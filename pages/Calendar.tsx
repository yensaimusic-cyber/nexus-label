
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
        metadata: { description: t.description, priority: t.priority, status: t.status, project: t.project?.title }
      }));

      const meetingEvents = (meetingsRes.data || []).map(m => ({
        id: m.id,
        title: m.title,
        type: 'meeting' as EventType,
        artist: 'Board / Team',
        date: m.date,
        metadata: { summary: m.summary, attendees: m.attendees, action_items: m.action_items, project: m.project?.title }
      }));

      const releaseEvents = (projectsRes.data || []).filter(p => p.release_date).map(p => ({
        id: p.id,
        title: `RELEASE: ${p.title}`,
        type: 'release' as EventType,
        artist: p.artist?.stage_name || 'Unknown Artist',
        date: p.release_date,
        metadata: { type: p.type, status: p.status }
      }));

      setEvents([...taskEvents, ...meetingEvents, ...releaseEvents]);
      // try fetching Google events for the logged user
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (userId) {
          setGoogleLoading(true);
          const gEvents = await googleCalendarService.fetchEvents(userId).catch((e) => { throw e; });
          setGoogleEvents(gEvents || []);
          setGoogleConnected(true);
          // map google events into LabelEvent shape
          const mappedG = (gEvents || []).map((ge: any) => ({
            id: `gcal_${ge.id}`,
            title: ge.summary || 'Google Event',
            type: 'meeting' as EventType,
            artist: ge.organizer?.displayName || 'Google Calendar',
            date: (ge.start?.date || ge.start?.dateTime || '').split('T')[0],
            metadata: { google: true, raw: ge }
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

  const filteredEvents = useMemo(() => {
    return events.filter(e => activeFilter === 'all' || e.type === activeFilter);
  }, [events, activeFilter]);

  const handleEventClick = (event: LabelEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  const selectedDateString = currentDate.toISOString().split('T')[0];
  const selectedDayEvents = events.filter(e => e.date === selectedDateString);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1700px] mx-auto min-h-screen flex flex-col relative">
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
                <Button variant="outline" onClick={handleSyncMeetings} className="gap-2 border-white/10 hover:bg-nexus-purple/10 text-[10px] lg:text-xs">
                  <ListChecks size={16} className={syncing ? 'animate-spin' : ''} />
                  <span className="font-bold uppercase tracking-widest">Synchroniser meetings</span>
                </Button>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[11px] text-green-300 font-bold">Google connecté</span>
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
        <Card className="xl:col-span-4 flex flex-col p-0 overflow-hidden border-white/10 shadow-2xl bg-white/[0.01]">
          <div className="p-4 lg:p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex bg-white/5 rounded-xl lg:rounded-2xl p-1 border border-white/10 glass shadow-inner">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg lg:rounded-xl text-white/40 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                <div className="px-4 flex flex-col items-center justify-center min-w-[140px] lg:min-w-[180px]">
                  <h3 className="text-lg lg:text-2xl font-heading font-extrabold capitalize leading-none">{monthName}</h3>
                  <span className="text-[9px] font-mono text-nexus-purple tracking-[0.3em] font-black mt-1 uppercase">{year}</span>
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

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="grid grid-cols-7 min-w-[700px]">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                <div key={day} className="py-3 lg:py-5 text-center text-[9px] lg:text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 border-b border-white/5 font-black">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: 42 }).map((_, i) => {
                const dayNum = i - firstDayOfMonth + 1;
                const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                const dateString = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dateString);
                const isToday = new Date().toISOString().split('T')[0] === dateString;

                return (
                  <div 
                    key={i} 
                    className={`min-h-[100px] lg:min-h-[160px] p-2 border-r border-b border-white/5 transition-all relative group/cell ${
                      !isCurrentMonth ? 'bg-black/20 pointer-events-none' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs lg:text-sm font-heading font-black transition-colors ${
                        isToday 
                        ? 'w-7 h-7 lg:w-9 lg:h-9 rounded-xl lg:rounded-2xl bg-nexus-purple text-white flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] scale-110' 
                        : isCurrentMonth ? 'text-white/40 group-hover/cell:text-white/80' : 'text-white/5'
                      }`}>
                        {isCurrentMonth ? dayNum : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => {
                        const isGoogle = event.metadata?.google;
                        const gradient = isGoogle ? 'from-blue-600 to-blue-400' : eventTypeConfig[event.type].gradient;
                        return (
                        <motion.div 
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          whileHover={{ scale: 1.02, x: 2 }}
                          className={`px-2 py-1 rounded-md lg:rounded-lg text-[8px] lg:text-[9px] font-bold tracking-tight flex items-center gap-1.5 truncate border border-white/5 shadow-lg cursor-pointer bg-gradient-to-r ${gradient} text-white`}
                        >
                          <span className="truncate">{event.title}</span>
                          {isGoogle && <span className="ml-2 text-[9px] font-black bg-white/10 px-1 rounded-full">G</span>}
                        </motion.div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[8px] font-black text-white/20 text-center uppercase tracking-widest mt-1">
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
                .map((event) => (
                  <motion.div 
                    key={event.id} 
                    onClick={() => handleEventClick(event)}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-nexus-purple/40 transition-all group cursor-pointer relative overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.metadata?.google ? 'bg-blue-500' : eventTypeConfig[event.type].color}`} />
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-[7px] lg:text-[8px] font-black uppercase tracking-widest ${event.metadata?.google ? 'bg-blue-500 text-white' : eventTypeConfig[event.type].color} text-white`}>
                        {eventTypeConfig[event.type].label}
                      </span>
                      <span className="text-[9px] font-mono text-white/30 font-bold">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs lg:text-sm group-hover:text-nexus-cyan transition-colors leading-snug truncate">{event.title}</h4>
                    <p className="text-[9px] text-white/30 mt-1 uppercase font-black tracking-tighter truncate">{event.artist}</p>
                  </motion.div>
                ))}
              
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

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Détails de l'événement">
        {selectedEvent && (
          <div className="space-y-6">
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
                  <h3 className="text-xl lg:text-2xl font-heading font-extrabold text-white leading-tight">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-2 text-nexus-cyan font-bold uppercase text-[9px] mt-1">
                    <Users size={12} />
                    {selectedEvent.artist}
                  </div>
               </div>
            </div>

            <div className="glass p-5 rounded-2xl border-white/10">
              {selectedEvent.type === 'meeting' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[9px] font-mono font-black uppercase text-nexus-purple mb-2">Résumé</h4>
                    <p className="text-xs text-white/70 italic">{selectedEvent.metadata.summary || "Aucun compte-rendu."}</p>
                  </div>
                  {selectedEvent.metadata.action_items?.length > 0 && (
                    <div>
                      <h4 className="text-[9px] font-mono font-black uppercase text-nexus-green mb-2">Actions</h4>
                      <ul className="space-y-1.5">
                        {selectedEvent.metadata.action_items.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] text-white/80">
                            <span className="text-nexus-green">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedEvent.type === 'task' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-mono uppercase text-white/30">Priorité</p>
                      <p className="text-xs font-bold text-nexus-red uppercase">{selectedEvent.metadata.priority}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono uppercase text-white/30">Statut</p>
                      <p className="text-xs font-bold text-nexus-cyan uppercase">{selectedEvent.metadata.status}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{selectedEvent.metadata.description || "Aucune description."}</p>
                </div>
              )}

              {selectedEvent.type === 'release' && (
                <div className="text-center py-4">
                   <Link to={`/projects/${selectedEvent.id}`} className="block">
                    <Button variant="primary" className="w-full gap-2 text-xs uppercase font-black">
                      Voir le projet <ArrowUpRight size={16} />
                    </Button>
                   </Link>
                </div>
              )}
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setIsDetailModalOpen(false)}>Fermer</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
