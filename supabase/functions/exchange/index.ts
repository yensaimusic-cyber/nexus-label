import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

serve(async (req: Request) => {
  try {
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

    if (!code || !user_id) return new Response(JSON.stringify({ error: 'missing_params' }), { status: 400 });

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
    const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') || Deno.env.get('REDIRECT_URI') || '';

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing Google OAuth config' }), { status: 500 });
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
    if (tokenJson.error) {
      return new Response(JSON.stringify({ error: 'token_error', details: tokenJson }), { status: 400 });
    }

    const { access_token, refresh_token, expires_in } = tokenJson;
    const expiresAt = Math.floor(Date.now() / 1000) + (expires_in || 3600);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'missing_supabase_config' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('google_tokens').upsert({
      user_id,
      access_token,
      refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // If this was a browser GET from Google OAuth redirect, forward user to app
    const netlifyApp = Deno.env.get('NETLIFY_APP_URL') || 'https://heartfelt-madeleine-35cf1b.netlify.app';
    if (req.method === 'GET') {
      const redirectTo = `${netlifyApp}/calendar?connected=1`;
      return new Response(null, { status: 302, headers: { Location: redirectTo } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
});
