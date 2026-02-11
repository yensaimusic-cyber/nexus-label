import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

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

    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || '';

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') || Deno.env.get('REDIRECT_URI') || '';

    if (!clientId || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing Google OAuth config' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
      state: userId
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return new Response(JSON.stringify({ url: authUrl }), { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
});
