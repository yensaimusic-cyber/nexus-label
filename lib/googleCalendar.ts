
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

const supabaseUrl = (supabase as any).url || '';
const functionsBase = supabaseUrl ? supabaseUrl.replace('.supabase.co', '.functions.supabase.co') : '';

const callFunction = async (name: string, opts: { method?: string; body?: any; qs?: Record<string,string> } = {}) => {
  const url = functionsBase ? `${functionsBase}/${name}` : `/api/${name}`;
  let fullUrl = url;
  if (opts.qs) {
    const params = new URLSearchParams(opts.qs).toString();
    fullUrl = `${url}?${params}`;
  }

  const res = await fetch(fullUrl, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
};

export const googleCalendarService = {
  getAuthUrl: async (userId: string) => {
    const { ok, json } = await callFunction('oauth_url', { qs: { user_id: userId } });
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
};
