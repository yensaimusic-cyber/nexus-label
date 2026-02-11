
/**
 * NEXUS LABEL - Google Calendar API Integration
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: Array<{ email?: string }>;
}

import { supabase } from './supabase';

// Explicit Supabase project URL (functions base derived from this)
const SUPABASE_PROJECT_URL = 'https://uphtjvuacznfmooomzhe.supabase.co';
// Use the /functions/v1 path on the main Supabase host (not the .functions subdomain)
const functionsBase = `${SUPABASE_PROJECT_URL}/functions/v1`;

const callFunction = async (name: string, opts: { method?: string; body?: any; qs?: Record<string,string> } = {}) => {
  const url = functionsBase ? `${functionsBase}/${name}` : `/api/${name}`;
  let fullUrl = url;
  if (opts.qs) {
    const params = new URLSearchParams(opts.qs).toString();
    fullUrl = `${url}?${params}`;
  }

  // build headers including Supabase anon/apikey and current session token
  try {
    const sessionResp = await supabase.auth.getSession();
    const accessToken = sessionResp?.data?.session?.access_token;
    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaHRqdnVhY3puZm1vb29temhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjU0NDYsImV4cCI6MjA4NjI0MTQ0Nn0.chsRiPNzXZ6tK02ZgF_s5ONCQk5sEwf-A8c4ci-z9IY'
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      console.warn('[googleCalendar] no access token in session; calling functions with anon key only');
    }

    console.debug('[googleCalendar] fetch', fullUrl, opts.method || 'GET', { headers: Object.assign({}, headers, { Authorization: headers['Authorization'] ? 'REDACTED' : undefined }) });
    const res = await fetch(fullUrl, {
      method: opts.method || 'GET',
      mode: 'cors',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });

    let text = '';
    try {
      text = await res.text();
    } catch (e) {
      console.error('[googleCalendar] failed to read response text', e);
    }
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }

    console.debug('[googleCalendar] response', { status: res.status, ok: res.ok, body: json });
    return { ok: res.ok, status: res.status, json };
  } catch (err: any) {
    console.error('[googleCalendar] callFunction error', err);
    return { ok: false, status: 0, json: { error: err.message || String(err) } };
  }
};

export const googleCalendarService = {
  getAuthUrl: async (userId?: string) => {
    // ensure we have a user id (fallback to session)
    let uid = userId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id;
    }
    if (!uid) throw new Error('Missing user id for Google OAuth state');

    console.debug('[googleCalendar] getAuthUrl sending user_id in state', { user_id: uid });
    const { ok, json } = await callFunction('oauth_url', { qs: { user_id: uid } });
    if (!ok) throw new Error(json?.error || 'Failed to get auth url');
    return json.url as string;
  },

  exchangeCode: async (code: string, userId: string) => {
    const { ok, json } = await callFunction('exchange', { method: 'POST', body: { code, state: userId } });
    if (!ok) throw new Error(json?.error || 'Failed to exchange code');
    return json;
  },

  fetchEvents: async (userId: string): Promise<GoogleCalendarEvent[]> => {
    const { ok, json, status } = await callFunction('events', { qs: { user_id: userId } });
    if (!ok) {
      // propagate error info
      throw new Error(json?.error || `Failed to fetch events (${status})`);
    }
    return (json.events || []) as GoogleCalendarEvent[];
  },

  createEvent: async (userId: string, meeting: any) => {
    const { ok, json } = await callFunction('create_event', { method: 'POST', body: { user_id: userId, meeting } });
    if (!ok) throw new Error(json?.error || 'Failed to create event');
    return json.event;
  }
  ,
  disconnect: async (userId: string) => {
    const { ok, json } = await callFunction('disconnect', { method: 'POST', body: { user_id: userId } });
    if (!ok) throw new Error(json?.error || 'Failed to disconnect Google Calendar');
    return json;
  }
};
