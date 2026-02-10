
import React, { useState, useMemo, useEffect } from 'react';
// Fix: Added missing Link import from react-router-dom
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Disc, Calendar as CalendarIcon, 
  Music, Radio, RefreshCw, Clock, MapPin, Check, Filter, Users, Loader2, 
  Info, ArrowUpRight, MessageSquareText, ListChecks
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';

type EventType = 'release' | 'session' | 'promo' | 'meeting' | 'task';

interface LabelEvent {
  id: string;
  title: string;
  type: EventType;
  artist: string;
  date: string;
  time?: string;
  metadata?: any; // Pour stocker les détails supplémentaires (summary, attendees, etc.)
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<LabelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LabelEvent | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, project:projects(title, artist:artists(stage_name))');
        
      const taskEvents = (tasks || []).filter(t => t.due_date).map(t => ({
        id: t.id,
        title: t.title,
        type: 'task' as EventType,
        artist: t.project?.artist?.stage_name || 'Nexus Internal',
        date: t.due_date,
        metadata: { description: t.description, priority: t.priority, status: t.status, project: t.project?.title }
      }));

      // 2. Fetch Meetings
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*, project:projects(title)');
        
      const meetingEvents = (meetings || []).map(m => ({
        id: m.id,
        title: m.title,
        type: 'meeting' as EventType,
        artist: 'Board / Team',
        date: m.date,
        metadata: { 
          summary: m.summary, 
          attendees: m.attendees, 
          action_items: m.action_items,
          project: m.project?.title 
        }
      }));

      // 3. Fetch Releases (Projects)
      const { data: projects } = await supabase
        .from('projects')
        .select('*, artist:artists(stage_name)');
        
      const releaseEvents = (projects || []).filter(p => p.release_date).map(p => ({
        id: p.id,
        title: `RELEASE: ${p.title}`,
        type: 'release' as EventType,
        artist: p.artist?.stage_name || 'Unknown Artist',
        date: p.release_date,
        metadata: { type: p.type, budget: p.budget, status: p.status }
      }));

      setEvents([...taskEvents, ...meetingEvents, ...releaseEvents]);
    } catch (err) {
      console.error("Calendar sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1));

  const eventTypeConfig: Record<EventType, { color: string; gradient: string; icon: React.ReactNode; label: string }> = {
    release: { 
      color: 'bg-nexus-purple', 
      gradient: 'from-nexus-purple to-purple-400',
      icon: <Disc size={14} />, 
      label: 'Sortie' 
    },
    session: { 
      color: 'bg-nexus-cyan', 
      gradient: 'from-nexus-cyan to-blue-400',
      icon: <Music size={14} />, 
      label: 'Studio' 
    },
    promo: { 
      color: 'bg-nexus-pink', 
      gradient: 'from-nexus-pink to-rose-400',
      icon: <Radio size={14} />, 
      label: 'Promotion' 
    },
    meeting: { 
      color: 'bg-nexus-orange', 
      gradient: 'from-nexus-orange to-amber-400',
      icon: <Users size={14} />, 
      label: 'Réunion' 
    },
    task: { 
      color: 'bg-nexus-red', 
      gradient: 'from-nexus-red to-orange-500',
      icon: <Check size={14} />, 
      label: 'Deadline' 
    },
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => activeFilter === 'all' || e.type === activeFilter);
  }, [events, activeFilter]);

  const handleEventClick = (event: LabelEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1700px] mx-auto min-h-screen flex flex-col relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tighter">Timeline <span className="text-nexus-purple italic">Hub</span></h2>
          <p className="text-nexus-lightGray text-sm mt-1 uppercase tracking-widest font-mono">Planification centrale des opérations du label</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={fetchEvents} className="gap-2 border-white/10 hover:bg-nexus-purple/10">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="font-bold uppercase tracking-widest text-[10px]">Actualiser le Cloud</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 flex-1">
        {/* Main Grid */}
        <Card className="xl:col-span-4 flex flex-col p-0 overflow-hidden border-white/10 shadow-2xl bg-white/[0.01]">
          <div className="p-6 lg:p-8 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 glass shadow-inner">
                <button onClick={handlePrevMonth} className="p-2.5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"><ChevronLeft size={24} /></button>
                <div className="px-6 flex flex-col items-center justify-center min-w-[180px]">
                  <h3 className="text-xl lg:text-2xl font-heading font-extrabold capitalize leading-none">{monthName}</h3>
                  <span className="text-[10px] font-mono text-nexus-purple tracking-[0.3em] font-black mt-1 uppercase">{year}</span>
                </div>
                <button onClick={handleNextMonth} className="p-2.5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"><ChevronRight size={24} /></button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(['all', 'release', 'task', 'meeting'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type as any)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
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

          <div className="flex-1 grid grid-cols-7 relative overflow-x-auto min-w-[800px] custom-scrollbar">
            {loading && (
              <div className="absolute inset-0 bg-nexus-dark/60 backdrop-blur-[2px] z-[60] flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-nexus-purple" size={48} />
                    <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40 animate-pulse">Chargement Nexus Hub...</p>
                 </div>
              </div>
            )}
            
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="py-5 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 bg-white/[0.01] border-b border-white/5 font-black">
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
                  className={`min-h-[160px] p-3 border-r border-b border-white/5 transition-all relative group/cell ${
                    !isCurrentMonth ? 'bg-black/20 pointer-events-none' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-sm font-heading font-black transition-colors ${
                      isToday 
                      ? 'w-9 h-9 rounded-2xl bg-nexus-purple text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)] scale-110' 
                      : isCurrentMonth ? 'text-white/40 group-hover/cell:text-white/80' : 'text-white/5'
                    }`}>
                      {isCurrentMonth ? dayNum : ''}
                    </span>
                    {isToday && (
                      <span className="text-[8px] font-black uppercase text-nexus-purple animate-pulse mt-1">Today</span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 overflow-hidden">
                    {dayEvents.slice(0, 4).map((event) => (
                      <motion.div 
                        key={event.id}
                        layoutId={`event-${event.id}`}
                        onClick={() => handleEventClick(event)}
                        whileHover={{ scale: 1.02, x: 2 }}
                        className={`px-3 py-2 rounded-xl text-[9px] font-bold tracking-tight flex items-center gap-2 truncate border border-white/5 shadow-lg shadow-black/20 cursor-pointer bg-gradient-to-r ${eventTypeConfig[event.type].gradient} text-white group/event`}
                      >
                        <div className="shrink-0 opacity-70 group-hover/event:opacity-100 transition-opacity">
                          {eventTypeConfig[event.type].icon}
                        </div>
                        <span className="truncate flex-1">{event.title}</span>
                      </motion.div>
                    ))}
                    {dayEvents.length > 4 && (
                      <p className="text-[9px] font-black text-white/20 text-center uppercase tracking-widest py-1 border-t border-white/5 mt-1">
                        + {dayEvents.length - 4} événements
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sidebar Schedule */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="h-full flex flex-col p-8 border-white/10 shadow-2xl glass overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <CalendarIcon size={120} className="text-white" />
            </div>
            
            <h3 className="font-heading font-extrabold text-2xl mb-8 flex items-center gap-3 relative z-10">
              <div className="p-2.5 rounded-xl bg-nexus-purple/10 text-nexus-purple">
                <Clock size={22} />
              </div>
              À venir
            </h3>
            
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-3 relative z-10">
              {filteredEvents
                .filter(e => new Date(e.date) >= new Date())
                .sort((a,b) => a.date.localeCompare(b.date))
                .slice(0, 10)
                .map((event) => (
                  <motion.div 
                    key={event.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleEventClick(event)}
                    className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-nexus-purple/40 transition-all group cursor-pointer shadow-xl relative overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${eventTypeConfig[event.type].color}`} />
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 ${eventTypeConfig[event.type].color} text-white`}>
                        {eventTypeConfig[event.type].label}
                      </span>
                      <span className="text-[10px] font-mono text-white/30 font-bold bg-white/5 px-2 py-0.5 rounded-md">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mb-3 group-hover:text-nexus-cyan transition-colors leading-snug pr-4">{event.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-tighter">
                      <Users size={12} className="text-nexus-purple" />
                      <span className="truncate">{event.artist}</span>
                    </div>
                  </motion.div>
                ))}
              
              {filteredEvents.length === 0 && (
                <div className="py-24 text-center opacity-20 italic flex flex-col items-center justify-center gap-4">
                  <CalendarIcon size={48} />
                  <p className="text-sm">Aucun événement synchronisé.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title="Détails de l'événement"
      >
        {selectedEvent && (
          <div className="space-y-8">
            <div className="flex items-start gap-5">
               <div className={`p-5 rounded-3xl ${eventTypeConfig[selectedEvent.type].color} text-white shadow-2xl shrink-0`}>
                 {eventTypeConfig[selectedEvent.type].icon}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 ${eventTypeConfig[selectedEvent.type].color}`}>
                      {eventTypeConfig[selectedEvent.type].label}
                    </span>
                    <span className="text-xs font-mono font-bold text-white/40">{selectedEvent.date}</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-heading font-extrabold text-white tracking-tight leading-none mb-2">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-2 text-nexus-cyan font-bold uppercase tracking-widest text-[10px]">
                    <Users size={14} />
                    {selectedEvent.artist}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Contenu dynamique selon le type */}
              {selectedEvent.type === 'meeting' && selectedEvent.metadata && (
                <div className="space-y-6">
                  <div className="glass p-6 rounded-3xl border-white/10">
                    <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-nexus-purple mb-4 flex items-center gap-2">
                      <MessageSquareText size={16} />
                      Résumé Stratégique
                    </h4>
                    <p className="text-sm text-white/70 leading-relaxed italic">
                      {selectedEvent.metadata.summary || "Aucun compte-rendu enregistré."}
                    </p>
                  </div>

                  {selectedEvent.metadata.attendees && selectedEvent.metadata.attendees.length > 0 && (
                    <div className="space-y-3 px-2">
                      <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-2">
                        <Users size={16} />
                        Stakeholders Présents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.metadata.attendees.map((a: string) => (
                          <span key={a} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.metadata.action_items && selectedEvent.metadata.action_items.length > 0 && (
                    <div className="glass p-6 rounded-3xl border-white/5 bg-nexus-green/5">
                      <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-nexus-green mb-4 flex items-center gap-2">
                        <ListChecks size={16} />
                        Actions Requises
                      </h4>
                      <ul className="space-y-3">
                        {selectedEvent.metadata.action_items.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-white/80">
                            <div className="w-5 h-5 rounded-lg bg-nexus-green/20 flex items-center justify-center shrink-0 mt-0.5">
                               <Check size={12} className="text-nexus-green" />
                            </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedEvent.type === 'task' && selectedEvent.metadata && (
                <div className="space-y-6 px-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass p-4 rounded-2xl border-white/5">
                      <p className="text-[9px] font-mono uppercase text-white/30 tracking-widest mb-1">Priorité</p>
                      <p className="text-sm font-bold uppercase text-nexus-red">{selectedEvent.metadata.priority}</p>
                    </div>
                    <div className="glass p-4 rounded-2xl border-white/5">
                      <p className="text-[9px] font-mono uppercase text-white/30 tracking-widest mb-1">Statut</p>
                      <p className="text-sm font-bold uppercase text-nexus-cyan">{selectedEvent.metadata.status}</p>
                    </div>
                  </div>
                  <div className="glass p-6 rounded-3xl border-white/10">
                    <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-white/30 mb-2">Description de la mission</h4>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {selectedEvent.metadata.description || "Aucune instruction supplémentaire."}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.type === 'release' && selectedEvent.metadata && (
                <div className="space-y-6 px-2 text-center">
                   <div className="p-10 border-2 border-dashed border-nexus-purple/20 rounded-[40px] bg-nexus-purple/5">
                      <Disc size={48} className="mx-auto mb-4 text-nexus-purple animate-spin-slow" />
                      <h4 className="text-xl font-heading font-black mb-2 tracking-tight">Lancement Opérationnel</h4>
                      <p className="text-sm text-white/40 italic">Ce projet est programmé pour une sortie mondiale le {selectedEvent.date}.</p>
                   </div>
                   {/* Fix: Wrap action button in Link to resolve 'Cannot find name Link' */}
                   <Link to={`/projects/${selectedEvent.id}`} className="block">
                    <Button variant="primary" className="w-full h-16 rounded-[20px] shadow-2xl gap-3 text-sm uppercase tracking-widest font-black">
                      Ouvrir le dossier de production <ArrowUpRight size={20} />
                    </Button>
                   </Link>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 flex gap-4">
               <Button variant="ghost" className="flex-1 h-14" onClick={() => setIsDetailModalOpen(false)}>Fermer l'aperçu</Button>
               {selectedEvent.metadata?.project && (
                 <Button variant="outline" className="flex-1 h-14 border-white/10 gap-2 font-black uppercase tracking-widest text-[10px]">
                   <Info size={16} /> Projet : {selectedEvent.metadata.project}
                 </Button>
               )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
