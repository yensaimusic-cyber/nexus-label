import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || '';

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI') || '';

    if (!clientId || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing Google OAuth config' }), { status: 500 });
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
    return new Response(JSON.stringify({ url: authUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500 });
  }
});
