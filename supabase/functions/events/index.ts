import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || '';
    if (!userId) return new Response(JSON.stringify({ error: 'missing_user_id' }), { status: 400 });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) return new Response(JSON.stringify({ error: 'missing_supabase_config' }), { status: 500 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('google_tokens').select('*').eq('user_id', userId).single();
    if (error || !data) return new Response(JSON.stringify({ error: 'no_tokens' }), { status: 404 });

    let { access_token, refresh_token, expires_at } = data as any;

    // refresh if expired (with small buffer)
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
        expires_at = Math.floor(Date.now() / 1000) + (tokenJson.expires_in || 3600);
        await supabase.from('google_tokens').update({ access_token, expires_at, updated_at: new Date().toISOString() }).eq('user_id', userId);
      }
    }

    // fetch events for next 30 days
    const timeMin = new Date().toISOString();
    const max = new Date();
    max.setDate(max.getDate() + 30);
    const timeMax = max.toISOString();

    const eventsRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const eventsJson = await eventsRes.json();

    return new Response(JSON.stringify({ events: eventsJson.items || [] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
});
