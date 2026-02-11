
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Disc, Calendar as CalendarIcon, 
  Music, Radio, RefreshCw, Clock, Check, Users, Loader2, 
  Info, ArrowUpRight, MessageSquareText, ListChecks
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { googleCalendarService } from '../lib/googleCalendar';
import { useToast } from '../components/ui/Toast';

type EventType = 'release' | 'session' | 'promo' | 'meeting' | 'task';

interface LabelEvent {
  id: string;
  title: string;
  type: EventType;
  artist: string;
  date: string;
  time?: string;
  metadata?: any;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<LabelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LabelEvent | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; date: string; time?: string; description?: string; color?: string }>({ title: '', date: '', time: '', description: '', color: 'blue' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{ title: string; date: string; time?: string; summary?: string; syncToGoogle?: boolean }>({ title: '', date: new Date().toISOString().split('T')[0], time: '', summary: '', syncToGoogle: true });
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');
  const toast = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Handle OAuth callback (code & state) and the redirect marker ?connected=1
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const connected = params.get('connected');

    // If Netlify redirect included connected=1, show toast and refresh events
    if (connected === '1') {
      (async () => {
        try {
          toast.addToast('Google Calendar connecté !', 'success');
          setGoogleLoading(true);
          await fetchEvents();
        } catch (err) {
          console.error('Failed to load Google events after connect', err);
        } finally {
          setGoogleLoading(false);
          // remove the connected param from the URL
          const url = new URL(window.location.href);
          url.searchParams.delete('connected');
          window.history.replaceState({}, document.title, url.toString());
        }
      })();
      return;
    }

    // Handle normal OAuth code exchange
    if (code && state) {
      (async () => {
        try {
          setGoogleLoading(true);
          await googleCalendarService.exchangeCode(code, state);
          // remove code from url
          const url = new URL(window.location.href);
          url.search = '';
          window.history.replaceState({}, document.title, url.toString());
          // refresh events
          await fetchEvents();
          toast.addToast('Connexion Google Calendar établie.', 'success');
        } catch (err) {
          console.error('OAuth exchange failed', err);
          toast.addToast('Échec de la connexion Google Calendar.', 'error');
        } finally {
          setGoogleLoading(false);
        }
      })();
    }
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [tasksRes, meetingsRes, projectsRes] = await Promise.all([
        supabase.from('tasks').select('*, project:projects(title, artist:artists(stage_name))'),
        supabase.from('meetings').select('*, project:projects(title)'),
        supabase.from('projects').select('*, artist:artists(stage_name)')
      ]);

      const taskEvents = (tasksRes.data || []).filter(t => t.due_date).map(t => ({
        id: t.id,
        title: t.title,
        type: 'task' as EventType,
        artist: t.project?.artist?.stage_name || 'Nexus Internal',
        date: t.due_date,
        time: t.time,
        metadata: { description: t.description, priority: t.priority, status: t.status, project: t.project?.title, isNexus: true }
      }));

      const meetingEvents = (meetingsRes.data || []).map(m => ({
        id: m.id,
        title: m.title,
        type: 'meeting' as EventType,
        artist: 'Board / Team',
        date: m.date,
        time: m.time,
        metadata: { summary: m.summary, attendees: m.attendees, action_items: m.action_items, project: m.project?.title, google_event_id: m.google_event_id, color: m.color, isNexus: true }
      }));

      const releaseEvents = (projectsRes.data || []).filter(p => p.release_date).map(p => ({
        id: p.id,
        title: `RELEASE: ${p.title}`,
        type: 'release' as EventType,
        artist: p.artist?.stage_name || 'Unknown Artist',
        date: p.release_date,
        metadata: { type: p.type, status: p.status, isNexus: true }
      }));

      const localEvents = [...taskEvents, ...meetingEvents, ...releaseEvents];
      setEvents(localEvents);
      
      // try fetching Google events for the logged user
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          setGoogleLoading(true);
          const gEvents = await googleCalendarService.fetchEvents(userId).catch((e) => { throw e; });
          setGoogleEvents(gEvents || []);
          setGoogleConnected(true);
          // map google events into LabelEvent shape - Google events are treated as meetings in the calendar
          const mappedG = (gEvents || []).map((ge: any) => ({
            id: `gcal_${ge.id}`,
            title: ge.summary || 'Google Event',
            type: 'meeting' as EventType,
            artist: ge.organizer?.displayName || 'Google Calendar',
            date: (ge.start?.date || ge.start?.dateTime || '').split('T')[0],
            time: (ge.start?.dateTime || '').split('T')[1]?.substring(0, 5),
            metadata: { google: true, raw: ge, colorId: ge.colorId, isGoogle: true }
          }));
          setEvents(prev => [...prev, ...mappedG]);
        }
      } catch (gErr) {
        console.warn('No Google connection or failed to fetch Google events', gErr);
        setGoogleConnected(false);
      } finally {
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error("Calendar sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  // auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(() => {
      fetchEvents();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        toast.addToast('Veuillez vous connecter.', 'error');
        return;
      }
      setGoogleLoading(true);
      const url = await googleCalendarService.getAuthUrl(userId);
      // redirect to Google OAuth
      window.location.href = url;
    } catch (err) {
      console.error('Failed to get Google auth url', err);
      toast.addToast('Impossible de démarrer la connexion Google Calendar.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSyncMeetings = async () => {
    try {
      setSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return alert('Veuillez vous connecter.');

      // fetch local meetings not yet synced
      const { data: meetings } = await supabase.from('meetings').select('*').is('google_event_id', null).gte('date', new Date().toISOString().split('T')[0]);
      if (!meetings || meetings.length === 0) {
        toast.addToast('Aucun meeting à synchroniser.', 'info');
        return;
      }

      for (const m of meetings) {
        try {
          await googleCalendarService.createEvent(userId, m);
        } catch (err) {
          console.error('Failed to create event for meeting', m.id, err);
        }
      }

      // refresh events after sync
      await fetchEvents();
      toast.addToast('Synchronisation terminée.', 'success');
    } catch (err) {
      console.error(err);
      toast.addToast('Erreur pendant la synchronisation.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1));

  const eventTypeConfig: Record<EventType, { color: string; gradient: string; icon: React.ReactNode; label: string }> = {
    release: { color: 'bg-nexus-purple', gradient: 'from-nexus-purple to-purple-400', icon: <Disc size={14} />, label: 'Sortie' },
    session: { color: 'bg-nexus-cyan', gradient: 'from-nexus-cyan to-blue-400', icon: <Music size={14} />, label: 'Studio' },
    promo: { color: 'bg-nexus-pink', gradient: 'from-nexus-pink to-rose-400', icon: <Radio size={14} />, label: 'Promotion' },
    meeting: { color: 'bg-nexus-orange', gradient: 'from-nexus-orange to-amber-400', icon: <Users size={14} />, label: 'Réunion' },
    task: { color: 'bg-nexus-red', gradient: 'from-nexus-red to-orange-500', icon: <Check size={14} />, label: 'Deadline' },
  };

  // Helper to get event background style based on custom color or type
  const getEventStyle = (event: LabelEvent) => {
    if (event.metadata?.google) {
      return { className: 'bg-[rgb(229,229,229)] text-black', style: {} };
    }
    const customColor = event.metadata?.color;
    if (customColor) {
      // Parse custom color (could be hex like #FF0000 or named color like 'red')
      return { className: '', style: { backgroundColor: customColor, color: '#fff' } };
    }
    return { className: `bg-gradient-to-r ${eventTypeConfig[event.type].gradient} text-white`, style: {} };
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => activeFilter === 'all' || e.type === activeFilter);
  }, [events, activeFilter]);

  const handleEventClick = (event: LabelEvent) => {
    setSelectedEvent(event);
    // prefill edit form
    setEditForm({
      title: event.title,
      date: event.date,
      time: event.time || '',
      description: event.metadata?.summary || event.metadata?.description || '',
      color: event.metadata?.color || (event.metadata?.colorId ? String(event.metadata.colorId) : 'blue')
    });
    setIsDetailModalOpen(true);
  };

  const colorOptions: { key: string; label: string; uiClass: string; googleColorId?: number }[] = [
    { key: 'red', label: 'Rouge', uiClass: 'bg-red-500', googleColorId: 11 },
    { key: 'orange', label: 'Orange', uiClass: 'bg-orange-400', googleColorId: 6 },
    { key: 'yellow', label: 'Jaune', uiClass: 'bg-yellow-300', googleColorId: 5 },
    { key: 'green', label: 'Vert', uiClass: 'bg-green-500', googleColorId: 10 },
    { key: 'blue', label: 'Bleu', uiClass: 'bg-blue-500', googleColorId: 9 },
    { key: 'violet', label: 'Violet', uiClass: 'bg-purple-500', googleColorId: 1 },
    { key: 'pink', label: 'Rose', uiClass: 'bg-pink-400', googleColorId: 3 },
    { key: 'white', label: 'Blanc', uiClass: 'bg-white', googleColorId: 8 },
  ];

  const handleEventUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEvent) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // If this is a Google-only event (id starts with gcal_), call update_event directly
      if (selectedEvent.id.startsWith('gcal_')) {
        const geId = selectedEvent.metadata?.raw?.id;
        if (!geId || !userId) throw new Error('Impossible de mettre à jour l\'événement Google');
        const updatesForGoogle: any = {
          summary: editForm.title,
          description: editForm.description,
          start: { dateTime: editForm.date + (editForm.time ? 'T' + editForm.time + ':00' : 'T00:00:00'), timeZone: 'UTC' },
          end: { dateTime: editForm.date + (editForm.time ? 'T' + editForm.time + ':00' : 'T01:00:00'), timeZone: 'UTC' },
          colorId: colorOptions.find(c => String(c.key) === String(editForm.color))?.googleColorId
        };
        await googleCalendarService.updateEvent(userId, geId, updatesForGoogle);
        toast.addToast('Événement Google mis à jour.', 'success');
        setIsDetailModalOpen(false);
        await fetchEvents();
        return;
      }

      // Local meeting update
      const meetingId = selectedEvent.id;
      const updates: any = {
        title: editForm.title,
        date: editForm.date,
        summary: editForm.description,
        color: editForm.color,
      };
      await supabase.from('meetings').update(updates).eq('id', meetingId);

      // fetch meeting to see if it has google_event_id
      const { data: meetingRow } = await supabase.from('meetings').select('*').eq('id', meetingId).single();
      if (meetingRow?.google_event_id && userId) {
        const updatesForGoogle: any = {
          summary: editForm.title,
          description: editForm.description,
          start: { dateTime: editForm.date + (editForm.time ? 'T' + editForm.time + ':00' : 'T00:00:00'), timeZone: 'UTC' },
          end: { dateTime: editForm.date + (editForm.time ? 'T' + editForm.time + ':00' : 'T01:00:00'), timeZone: 'UTC' },
          colorId: colorOptions.find(c => c.key === editForm.color)?.googleColorId,
          id: meetingId,
          color: editForm.color
        };
        try {
          await googleCalendarService.updateEvent(userId, meetingRow.google_event_id, updatesForGoogle);
        } catch (gErr) {
          console.error('Failed to update google event', gErr);
          toast.addToast('Échec de la mise à jour Google, modifications locales enregistrées.', 'error');
        }
      }

      toast.addToast('Événement mis à jour.', 'success');
      setIsDetailModalOpen(false);
      await fetchEvents();
    } catch (err) {
      console.error(err);
      toast.addToast('Échec de la mise à jour.', 'error');
    }
  };

  const handleEventDelete = async () => {
    if (!selectedEvent) return;
    const ok = window.confirm('Confirmer la suppression de cet événement ?');
    if (!ok) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (selectedEvent.id.startsWith('gcal_')) {
        const geId = selectedEvent.metadata?.raw?.id;
        if (!geId || !userId) throw new Error('Impossible de supprimer l\'événement Google');
        await googleCalendarService.deleteEvent(userId, geId);
        toast.addToast('Événement Google supprimé.', 'success');
        setIsDetailModalOpen(false);
        await fetchEvents();
        return;
      }

      // local meeting
      const meetingId = selectedEvent.id;
      // check google_event_id
      const { data: meetingRow } = await supabase.from('meetings').select('*').eq('id', meetingId).single();
      if (meetingRow?.google_event_id && userId) {
        try {
          await googleCalendarService.deleteEvent(userId, meetingRow.google_event_id);
        } catch (gErr) {
          console.error('Failed to delete google event', gErr);
          toast.addToast('Suppression Google échouée, suppression locale tentée.', 'error');
        }
      }

      await supabase.from('meetings').delete().eq('id', meetingId);
      toast.addToast('Événement supprimé localement.', 'success');
      setIsDetailModalOpen(false);
      await fetchEvents();
    } catch (err) {
      console.error(err);
      toast.addToast('Échec de la suppression.', 'error');
    }
  };

  const openCreateModalForDate = (dateString: string) => {
    setCreateForm({ title: '', date: dateString, time: '', summary: '', syncToGoogle: true });
    setIsCreateModalOpen(true);
  };

  const handleCreateMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const meetingPayload: any = {
        title: createForm.title,
        date: createForm.date,
        summary: createForm.summary,
        attendees: [],
        action_items: [],
        project_id: null
      };
      const { data: inserted, error } = await supabase.from('meetings').insert([meetingPayload]).select().single();
      if (error) throw error;
      if (createForm.syncToGoogle && inserted) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (userId) {
            const createdEvent = await googleCalendarService.createEvent(userId, inserted);
            if (createdEvent?.id) {
              await supabase.from('meetings').update({ google_event_id: createdEvent.id, synced_at: new Date().toISOString() }).eq('id', inserted.id);
              toast.addToast('Meeting synchronisé avec Google Calendar !', 'success');
            }
          }
        } catch (gErr) {
          console.error('Google sync failed:', gErr);
          toast.addToast('Meeting créé mais la synchronisation Google a échoué.', 'error');
        }
      }
      setIsCreateModalOpen(false);
      await fetchEvents();
    } catch (err: any) {
      console.error('Create meeting failed', err);
      toast.addToast('Échec de la création du meeting.', 'error');
    }
  };

  const selectedDateString = currentDate.toISOString().split('T')[0];
  const selectedDayEvents = events.filter(e => e.date === selectedDateString);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 w-full mx-auto min-h-screen flex flex-col relative" style={{background: '#050505'}}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-5xl font-heading font-extrabold text-white tracking-tighter">Nexus <span className="text-nexus-purple italic">Hub</span></h2>
          <p className="text-nexus-lightGray text-xs lg:text-sm mt-1 uppercase tracking-widest font-mono">Contrôle temporel des opérations</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={fetchEvents} className="gap-2 border-white/10 hover:bg-nexus-purple/10 text-[10px] lg:text-xs">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="font-bold uppercase tracking-widest">Actualiser</span>
          </Button>

          <div className="flex items-center gap-3">
            {!googleConnected ? (
              <>
                <Button variant="secondary" onClick={handleConnectGoogle} className="gap-2 text-[10px] lg:text-xs">
                  {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <CalendarIcon size={16} />}
                  <span className="font-bold uppercase tracking-widest">Connecter Google Calendar</span>
                </Button>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[11px] text-white/50">Non connecté</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[11px] text-white/70">Google connecté</span>
                </div>
                <Button variant="ghost" onClick={async () => {
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const userId = session?.user?.id;
                    if (!userId) return;
                    await googleCalendarService.disconnect(userId);
                    setGoogleConnected(false);
                    setGoogleEvents([]);
                    toast.addToast('Google Calendar déconnecté.', 'info');
                  } catch (err) {
                    console.error('Disconnect failed', err);
                    toast.addToast('Échec de la déconnexion.', 'error');
                  }
                }} className="text-[10px]">Déconnecter</Button>
                
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8 flex-1">
        {/* Calendar Core */}
        <Card className="xl:col-span-4 flex flex-col p-0 overflow-hidden border-white/10 shadow-2xl bg-transparent">
          <div className="p-4 lg:p-8 border-b border-white/10 bg-[#070707] flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
            <div className="flex items-center gap-4 lg:gap-6">
                <div className="flex bg-black rounded-xl lg:rounded-2xl p-1 border border-white/5 shadow-inner">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg lg:rounded-xl text-white/40 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                  <div className="px-4 flex flex-col items-center justify-center min-w-[140px] lg:min-w-[180px]">
                  <h3 className="text-lg lg:text-2xl font-heading font-extrabold capitalize leading-none text-white">{monthName}</h3>
                  <span className="text-[9px] font-mono text-white/60 tracking-[0.3em] font-black mt-1 uppercase">{year}</span>
                </div>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg lg:rounded-xl text-white/40 hover:text-white transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 lg:gap-2">
              {(['all', 'release', 'task', 'meeting'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type as any)}
                  className={`px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all border ${
                    activeFilter === type 
                    ? 'bg-nexus-purple text-white shadow-lg border-nexus-purple' 
                    : 'text-white/30 border-white/5 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {type === 'all' ? 'Tout' : type === 'release' ? 'Sorties' : type === 'task' ? 'Deadlines' : 'Réunions'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar" style={{ height: 'calc(100vh - 240px)' }}>
            <div className="grid grid-cols-7 min-w-[700px] gap-0">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                <div key={day} className="py-3 lg:py-5 text-center text-[9px] lg:text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 border-b border-white/5 font-black">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: 42 }).map((_, i) => {
                const dayNum = i - firstDayOfMonth + 1;
                const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                const dateString = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = filteredEvents.filter(e => e.date === dateString);
                const isToday = new Date().toISOString().split('T')[0] === dateString;

                return (
                  <div 
                    key={i} 
                    className={`min-h-[100px] lg:min-h-[160px] p-2 border-r border-b border-white/10 transition-all relative group/cell flex flex-col ${
                      !isCurrentMonth ? 'bg-black/20 pointer-events-none' : 'bg-[#0b0b0b]'
                    }`} onClick={() => isCurrentMonth && openCreateModalForDate(dateString)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs lg:text-sm font-heading font-black transition-colors ${
                        isToday 
                        ? 'w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-nexus-purple text-white flex items-center justify-center shadow-sm scale-110' 
                        : isCurrentMonth ? 'text-white/60 group-hover/cell:text-white/80' : 'text-white/10'
                      }`}>
                        {isCurrentMonth ? dayNum : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '180px' }}>
                      {dayEvents.slice(0, 3).map((event) => {
                        const isGoogle = event.metadata?.google;
                        const eventStyle = getEventStyle(event);
                        return (
                        <motion.div 
                          key={event.id}
                          onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                          whileHover={{ scale: 1.02, x: 2 }}
                          className={`px-2 py-1 rounded-md lg:rounded-lg text-[8px] lg:text-[9px] font-bold tracking-tight flex items-center gap-1.5 truncate shadow-sm cursor-pointer ${eventStyle.className}`}
                          style={eventStyle.style}
                        >
                          <span className="truncate">{event.title}</span>
                          {isGoogle && <span className="ml-2 text-[9px] font-black px-1 rounded-full" style={{background:'#1a73e8', color: 'white'}}>G</span>}
                        </motion.div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[8px] font-black text-white/30 text-center uppercase tracking-widest mt-1">
                          + {dayEvents.length - 3}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Sidebar Schedule - Hide on very small screens or make it a list below */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col p-6 lg:p-8 border-white/10 shadow-2xl glass overflow-hidden">
            <h3 className="font-heading font-extrabold text-xl lg:text-2xl mb-6 lg:mb-8 flex items-center gap-3">
              <div className="p-2 rounded-lg lg:rounded-xl bg-nexus-purple/10 text-nexus-purple">
                <Clock size={20} />
              </div>
              Agenda
            </h3>
            
                <div className="flex-1 space-y-4 lg:space-y-6 overflow-y-auto custom-scrollbar pr-2">
              {filteredEvents
                .filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
                .sort((a,b) => a.date.localeCompare(b.date))
                .slice(0, 8)
                .map((event) => {
                  const eventStyle = getEventStyle(event);
                  return (
                  <motion.div 
                    key={event.id} 
                    onClick={() => handleEventClick(event)}
                    className={`p-4 rounded-2xl ${eventStyle.className} border border-white/5 hover:opacity-90 transition-all group cursor-pointer relative overflow-hidden`}
                    style={eventStyle.style}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.metadata?.google ? 'bg-[#1a73e8]' : (event.metadata?.color ? '' : eventTypeConfig[event.type].color.replace('bg-', 'bg-'))}`} style={event.metadata?.color ? { backgroundColor: event.metadata.color } : {}} />
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-[7px] lg:text-[8px] font-black uppercase tracking-widest ${event.metadata?.google ? 'bg-[rgb(229,229,229)] text-black' : event.metadata?.color ? '' : eventTypeConfig[event.type].color + ' text-white'}`} style={event.metadata?.color ? { backgroundColor: event.metadata.color, color: '#fff' } : {}}>
                        {eventTypeConfig[event.type].label}
                      </span>
                      <span className="text-[9px] font-mono text-white/30 font-bold">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs lg:text-sm leading-snug truncate">{event.title}</h4>
                    <p className="text-[9px] text-white/30 mt-1 uppercase font-black tracking-tighter truncate">{event.artist}</p>
                  </motion.div>
                  );
                })}
              
              {filteredEvents.length === 0 && (
                <div className="py-12 text-center opacity-20 italic flex flex-col items-center gap-3">
                  <CalendarIcon size={32} />
                  <p className="text-[10px]">Agenda vide.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={selectedEvent ? 'Modifier l\'événement' : 'Événement'}>
        {selectedEvent && (
          <form onSubmit={handleEventUpdate} className="space-y-6">
            <div className="flex items-start gap-4">
               <div className={`p-4 rounded-2xl ${eventTypeConfig[selectedEvent.type].color} text-white shadow-lg shrink-0`}>
                 {eventTypeConfig[selectedEvent.type].icon}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border border-white/10 ${eventTypeConfig[selectedEvent.type].color}`}>
                      {eventTypeConfig[selectedEvent.type].label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-white/40">{selectedEvent.date}</span>
                  </div>
                  <input required value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xl font-bold" />
                  <div className="flex items-center gap-2 text-nexus-cyan font-bold uppercase text-[9px] mt-1">
                    <Users size={12} />
                    {selectedEvent.artist}
                  </div>
               </div>
            </div>

            <div className="glass p-5 rounded-2xl border-white/10">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-white/60">Date</label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-white/60">Heure</label>
                  <input type="time" value={editForm.time} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-mono uppercase text-white/60">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" rows={4} />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-mono uppercase text-white/60 mb-2 block">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button key={c.key} type="button" onClick={() => setEditForm(f => ({ ...f, color: c.key }))} className={`w-10 h-8 rounded-lg flex items-center justify-center border ${editForm.color === c.key ? 'ring-2 ring-white' : 'border-white/10'}`}>
                      <span className={`${c.uiClass} w-8 h-6 rounded-md`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="destructive" onClick={handleEventDelete} className="flex-1">Supprimer</Button>
                <div className="flex-1" />
                <Button type="button" variant="ghost" onClick={() => setIsDetailModalOpen(false)}>Annuler</Button>
                <Button type="submit" variant="primary">Enregistrer</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Créer un meeting">
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/60">Titre *</label>
            <input required value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-white/60">Date</label>
              <input type="date" value={createForm.date} onChange={e => setCreateForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-white/60">Heure</label>
              <input type="time" value={createForm.time} onChange={e => setCreateForm(f => ({ ...f, time: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-white/60">Description</label>
            <textarea value={createForm.summary} onChange={e => setCreateForm(f => ({ ...f, summary: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" rows={4} />
          </div>
          <div className="flex items-center gap-3">
            <input id="syncGoogleCreate" type="checkbox" checked={createForm.syncToGoogle} onChange={e => setCreateForm(f => ({ ...f, syncToGoogle: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="syncGoogleCreate" className="text-[12px] text-white/70">Synchroniser avec Google Calendar</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1">Créer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
