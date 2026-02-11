import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { user_id, meeting } = body;
    if (!user_id || !meeting) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400 });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) return new Response(JSON.stringify({ error: 'missing_supabase_config' }), { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from('google_tokens').select('*').eq('user_id', user_id).single();
    if (!data) return new Response(JSON.stringify({ error: 'no_tokens' }), { status: 404 });

    let access_token = (data as any).access_token;
    const refresh_token = (data as any).refresh_token;
    const expires_at = (data as any).expires_at;

    const now = Math.floor(Date.now() / 1000);
    if (!access_token || (expires_at && expires_at - 60 < now)) {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token,
        grant_type: 'refresh_token'
      });

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      const tokenJson = await tokenRes.json();
      if (!tokenJson.error) {
        access_token = tokenJson.access_token;
        const newExpires = Math.floor(Date.now() / 1000) + (tokenJson.expires_in || 3600);
        await supabase.from('google_tokens').update({ access_token, expires_at: newExpires, updated_at: new Date().toISOString() }).eq('user_id', user_id);
      }
    }

    // Build Google event from meeting
    const startDate = new Date(meeting.date);
    const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));
    const eventBody = {
      summary: meeting.title,
      description: meeting.summary || '',
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
      attendees: (meeting.attendees || []).map((email: string) => ({ email }))
    };

    const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
      body: JSON.stringify(eventBody)
    });

    const created = await createRes.json();
    if (created.error) return new Response(JSON.stringify({ error: 'create_failed', details: created }), { status: 400 });

    // update meeting row with google_event_id and synced_at
    await supabase.from('meetings').update({ google_event_id: created.id, synced_at: new Date().toISOString() }).eq('id', meeting.id);

    return new Response(JSON.stringify({ event: created }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
});
