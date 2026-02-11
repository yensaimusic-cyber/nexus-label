import { serve } from 'std/server';

serve(async (req) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    const body = await req.json();
    const { user_id, event_id, updates } = body;
    console.log('[update_event] received', { user_id, event_id, updates });

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'missing supabase env' }), { status: 500, headers: CORS_HEADERS });
    }

    // Fetch tokens for user
    const tokenRes = await fetch(`${SUPABASE_URL}/rest/v1/google_tokens?user_id=eq.${encodeURIComponent(user_id)}`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    const tokens = await tokenRes.json();
    if (!tokens || tokens.length === 0) return new Response(JSON.stringify({ error: 'no_tokens' }), { status: 404, headers: CORS_HEADERS });
    const tokenRow = tokens[0];

    // refresh if needed
    let access_token = tokenRow.access_token;
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : 0;
    if (!access_token || Date.now() > expiresAt - 60000) {
      console.log('[update_event] refreshing token');
      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refresh_token,
        }),
      });
      const tokenJson = await tokenResp.json();
      if (tokenJson.error) return new Response(JSON.stringify({ error: 'refresh_failed', details: tokenJson }), { status: 500, headers: CORS_HEADERS });
      access_token = tokenJson.access_token;
      const newExpiresAt = tokenJson.expires_in ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString() : tokenRow.expires_at;

      // update stored tokens
      await fetch(`${SUPABASE_URL}/rest/v1/google_tokens?id=eq.${tokenRow.id}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ access_token, expires_at: newExpiresAt }),
      });
    }

    // Build patch body for Google API
    const patchBody: any = {};
    if (updates.summary) patchBody.summary = updates.summary;
    if (updates.description !== undefined) patchBody.description = updates.description;
    if (updates.colorId) patchBody.colorId = String(updates.colorId);
    if (updates.start) patchBody.start = updates.start;
    if (updates.end) patchBody.end = updates.end;

    // Call Google Events patch
    const calendarId = tokenRow.calendar_id || 'primary';
    const googleRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event_id)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify(patchBody),
    });
    const googleJson = await googleRes.json();
    if (googleJson.error) {
      console.log('[update_event] google error', googleJson);
      return new Response(JSON.stringify({ error: 'google_error', details: googleJson }), { status: 500, headers: CORS_HEADERS });
    }

    // Update meetings row if needed (try best-effort)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/meetings?id=eq.${updates.id}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: updates.summary, description: updates.description, start_at: updates.start?.dateTime || updates.start?.date, end_at: updates.end?.dateTime || updates.end?.date, color: updates.color }),
      });
    } catch (e) {
      console.log('[update_event] failed to update meeting row', e);
    }

    return new Response(JSON.stringify({ event: googleJson }), { headers: CORS_HEADERS });
  } catch (err) {
    console.error('[update_event] error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
