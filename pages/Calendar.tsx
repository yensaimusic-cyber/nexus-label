
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Disc, Calendar as CalendarIcon, 
  Music, Radio, RefreshCw, Clock, MapPin, Check, Filter, Users, Loader2
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
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<LabelEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      // 1. Fetch Tasks
      const { data: tasks } = await supabase.from('tasks').select('id, title, due_date, project:projects(artist:artists(stage_name))');
      const taskEvents = (tasks || []).filter(t => t.due_date).map(t => ({
        id: t.id,
        title: t.title,
        type: 'task' as EventType,
        artist: t.project?.artist?.stage_name || 'Label',
        date: t.due_date
      }));

      // 2. Fetch Meetings
      const { data: meetings } = await supabase.from('meetings').select('id, title, date');
      const meetingEvents = (meetings || []).map(m => ({
        id: m.id,
        title: m.title,
        type: 'meeting' as EventType,
        artist: 'Internal',
        date: m.date
      }));

      // 3. Fetch Releases
      const { data: projects } = await supabase.from('projects').select('id, title, release_date, artist:artists(stage_name)');
      const releaseEvents = (projects || []).filter(p => p.release_date).map(p => ({
        id: p.id,
        title: `Release: ${p.title}`,
        type: 'release' as EventType,
        artist: p.artist?.stage_name || 'Various',
        date: p.release_date
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
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1));

  const eventTypeConfig: Record<EventType, { color: string; icon: React.ReactNode; label: string }> = {
    release: { color: 'bg-nexus-purple', icon: <Disc size={12} />, label: 'Release' },
    session: { color: 'bg-nexus-cyan', icon: <Music size={12} />, label: 'Studio' },
    promo: { color: 'bg-nexus-pink', icon: <Radio size={12} />, label: 'Promo' },
    meeting: { color: 'bg-nexus-orange', icon: <Users size={12} />, label: 'Meeting' },
    task: { color: 'bg-nexus-red', icon: <Check size={12} />, label: 'Deadline' },
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => activeFilter === 'all' || e.type === activeFilter);
  }, [events, activeFilter]);

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Timeline Hub</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Unified view of all global deadlines and label events.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={fetchEvents} className="gap-2 border-white/5">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="font-bold uppercase tracking-widest text-[10px]">Refresh Cloud</span>
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xl">
            <Plus size={20} />
            <span className="font-bold">New Entry</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1">
        <Card className="xl:col-span-3 flex flex-col p-0 overflow-hidden border-white/10 shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-heading font-extrabold capitalize">{monthName} <span className="text-nexus-purple tracking-tighter">{year}</span></h3>
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 glass">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            <div className="hidden lg:flex gap-2">
              {(['all', 'release', 'task', 'meeting'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeFilter === type 
                    ? 'bg-nexus-purple text-white shadow-lg' 
                    : 'text-white/20 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-7 border-collapse relative">
            {loading && (
              <div className="absolute inset-0 bg-nexus-dark/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
                 <Loader2 className="animate-spin text-nexus-purple" size={40} />
              </div>
            )}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/20 bg-white/[0.01] border-b border-white/5 font-black">
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
                  className={`min-h-[140px] p-2 border-r border-b border-white/5 transition-all relative ${
                    !isCurrentMonth ? 'opacity-10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-mono font-bold ${
                      isToday ? 'w-7 h-7 rounded-xl bg-nexus-purple text-white flex items-center justify-center shadow-lg' : 'text-white/20'
                    }`}>
                      {isCurrentMonth ? dayNum : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div 
                        key={event.id}
                        className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5 truncate border border-white/5 shadow-xl ${eventTypeConfig[event.type].color} text-white transition-transform hover:scale-105 cursor-pointer`}
                      >
                        {eventTypeConfig[event.type].icon}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[8px] font-mono text-white/30 text-center uppercase tracking-widest mt-1">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sidebar Schedule */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col p-8 border-white/5 shadow-2xl">
            <h3 className="font-heading font-extrabold text-xl mb-8 flex items-center gap-3">
              <Clock size={20} className="text-nexus-purple" />
              Upcoming
            </h3>
            
            <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2">
              {filteredEvents.sort((a,b) => a.date.localeCompare(b.date)).filter(e => new Date(e.date) >= new Date()).slice(0, 8).map((event) => (
                <motion.div key={event.id} className="p-4 rounded-[20px] bg-white/[0.03] border border-white/5 hover:border-nexus-purple/40 transition-all group shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white ${eventTypeConfig[event.type].color}`}>
                      {event.type}
                    </span>
                    <span className="text-[10px] font-mono text-white/30 font-bold">{event.date}</span>
                  </div>
                  <h4 className="font-bold text-sm mb-3 group-hover:text-nexus-cyan transition-colors leading-snug">{event.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                    <Users size={12} className="text-nexus-purple" />
                    <span>{event.artist}</span>
                  </div>
                </motion.div>
              ))}
              
              {filteredEvents.length === 0 && <div className="py-24 text-center opacity-10 italic text-sm">No synchronized events.</div>}
            </div>
            
            <Button variant="outline" className="w-full mt-8 gap-2 h-12 uppercase tracking-widest text-[10px] font-black">
              Full Archive
            </Button>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Quick Schedule Entry">
        <p className="text-xs text-white/40 mb-6 font-medium italic">Please navigate to the dedicated section (Tasks, Meetings, or Projects) to create detailed scheduled items with full metadata.</p>
        <Button variant="primary" className="w-full" onClick={() => setIsModalOpen(false)}>Understood</Button>
      </Modal>
    </div>
  );
};
