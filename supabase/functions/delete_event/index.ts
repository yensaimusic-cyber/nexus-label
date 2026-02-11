import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

serve(async (req) => {
  const ALLOWED_ORIGIN = 'https://heartfelt-madeleine-35cf1b.netlify.app';
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    const body = await req.json();
    const { user_id, event_id } = body;
    console.log('[delete_event] received', { user_id, event_id });

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
      console.log('[delete_event] refreshing token');
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

    const calendarId = tokenRow.calendar_id || 'primary';
    const googleRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event_id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!googleRes.ok) {
      const errJson = await googleRes.json().catch(() => ({}));
      console.log('[delete_event] google error', errJson);
      return new Response(JSON.stringify({ error: 'google_error', details: errJson }), { status: 500, headers: CORS_HEADERS });
    }

    // Best-effort: remove google_event_id from meeting rows
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/meetings?google_event_id=eq.${encodeURIComponent(event_id)}`, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ google_event_id: null, synced_at: null }),
      });
    } catch (e) {
      console.log('[delete_event] failed to update meeting row', e);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: CORS_HEADERS });
  } catch (err) {
    console.error('[delete_event] error', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
