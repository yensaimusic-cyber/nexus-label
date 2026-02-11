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
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    console.log('[exchange] incoming request', { method: req.method, url: req.url });

    let code = '';
    let user_id = '';

    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.searchParams.get('code') || '';
      user_id = url.searchParams.get('state') || '';
    } else {
      const body = await req.json();
      code = body.code;
      user_id = body.state || body.user_id;
    }

    console.log('[exchange] parsed params', { code: code ? 'REDACTED' : null, state: user_id });

    if (!code || !user_id) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
    const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') || Deno.env.get('REDIRECT_URI') || '';

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing Google OAuth config' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const tokenJson = await tokenRes.json();
    console.log('[exchange] token endpoint response', tokenJson);
    if (tokenJson.error) {
      return new Response(JSON.stringify({ error: 'token_error', details: tokenJson }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    const { access_token, refresh_token, expires_in } = tokenJson;
    const expiresAtIso = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'missing_supabase_config' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[exchange] upserting google_tokens for user', user_id);
    const { data: upsertData, error: upsertError } = await supabase.from('google_tokens').upsert({
      user_id,
      access_token,
      refresh_token,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (upsertError) {
      console.error('[exchange] upsert google_tokens error', upsertError, { upsertData });
    } else {
      console.log('[exchange] upsert google_tokens success', { user_id });
    }

    // If this was a browser GET from Google OAuth redirect, forward user to app
    // Always redirect to the canonical Netlify app calendar URL after OAuth exchange
    if (req.method === 'GET') {
      const redirectTo = 'https://heartfelt-madeleine-35cf1b.netlify.app/calendar?connected=1';
      return new Response(null, { status: 302, headers: { Location: redirectTo, ...CORS_HEADERS } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
