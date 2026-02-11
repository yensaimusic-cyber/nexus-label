import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const ALLOWED_ORIGIN = 'https://heartfelt-madeleine-35cf1b.netlify.app';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    let userId = '';
    if (req.method === 'GET') {
      const url = new URL(req.url);
      userId = url.searchParams.get('user_id') || '';
    } else {
      const body = await req.json().catch(() => ({}));
      userId = body.user_id || '';
    }

    if (!userId) return new Response(JSON.stringify({ error: 'missing_user_id' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) return new Response(JSON.stringify({ error: 'missing_supabase_config' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optionally revoke token at Google (best-effort)
    const { data } = await supabase.from('google_tokens').select('*').eq('user_id', userId).single();
    const access_token = (data as any)?.access_token || '';
    if (access_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(access_token)}`, { method: 'POST' });
      } catch (e) {
        console.warn('Failed to revoke google token', e);
      }
    }

    // delete stored tokens
    await supabase.from('google_tokens').delete().eq('user_id', userId);

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
