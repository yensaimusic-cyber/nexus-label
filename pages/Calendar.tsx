
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Disc, 
  Calendar as CalendarIcon, 
  Music, 
  Radio, 
  RefreshCw,
  Clock,
  MapPin,
  Check,
  Filter,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { googleCalendarService } from '../lib/googleCalendar';

type EventType = 'release' | 'session' | 'promo' | 'meeting';

interface LabelEvent {
  id: string;
  title: string;
  type: EventType;
  artist: string;
  date: string;
  time?: string;
  location?: string;
}

const MOCK_EVENTS: LabelEvent[] = [
  { id: '1', date: '2025-05-15', title: 'Midnight City EP Release', type: 'release', artist: 'Ghost Tape', time: '00:00' },
  { id: '2', date: '2025-05-20', title: 'Neon Pulse Recording', type: 'session', artist: 'Solaris', time: '14:00', location: 'Studio A' },
  { id: '3', date: '2025-05-24', title: 'Press Interview: Lumina', type: 'promo', artist: 'Lumina', time: '10:30' },
  { id: '4', date: '2025-05-28', title: 'Vocal Tracking', type: 'session', artist: 'Neon Queen', time: '13:00' },
  { id: '5', date: '2025-05-18', title: 'Label Strategy Meeting', type: 'meeting', artist: 'Management', time: '11:00' },
];

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  // Month navigation logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1));

  const handleSync = async () => {
    setIsSyncing(true);
    await googleCalendarService.fetchEvents();
    setIsSyncing(false);
    setIsSynced(true);
    setTimeout(() => setIsSynced(false), 3000);
  };

  const eventTypeConfig: Record<EventType, { color: string; icon: React.ReactNode; label: string }> = {
    release: { color: 'bg-nexus-purple', icon: <Disc size={12} />, label: 'Release' },
    session: { color: 'bg-nexus-cyan', icon: <Music size={12} />, label: 'Studio' },
    promo: { color: 'bg-nexus-pink', icon: <Radio size={12} />, label: 'Promo' },
    meeting: { color: 'bg-nexus-orange', icon: <Users size={12} />, label: 'Meeting' },
  };

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter(e => activeFilter === 'all' || e.type === activeFilter);
  }, [activeFilter]);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto min-h-screen flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Label Timeline</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Manage global releases and multi-artist schedules.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isSyncing}
            className={`gap-2 glass ${isSynced ? 'border-nexus-green text-nexus-green' : ''}`}
          >
            {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : isSynced ? <Check size={18} /> : <RefreshCw size={18} />}
            <span className="font-bold uppercase tracking-widest text-[10px]">
              {isSyncing ? 'Syncing...' : isSynced ? 'Synced' : 'Sync Google'}
            </span>
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="gap-2 shadow-xl">
            <Plus size={20} />
            <span className="font-bold">Add Event</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1">
        {/* Main Calendar View */}
        <Card className="xl:col-span-3 flex flex-col p-0 overflow-hidden border-white/10">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-heading font-extrabold capitalize">{monthName} <span className="text-nexus-purple">{year}</span></h3>
              <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            <div className="hidden lg:flex gap-2">
              {(['all', 'release', 'session', 'promo', 'meeting'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeFilter === type 
                    ? 'bg-white/10 text-white border border-white/20' 
                    : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-7 border-collapse">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-white/20 bg-white/[0.01] border-b border-white/5">
                {day}
              </div>
            ))}
            
            {Array.from({ length: 42 }).map((_, i) => {
              const dayNum = i - firstDayOfMonth + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
              const dateString = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = MOCK_EVENTS.filter(e => e.date === dateString);
              const isToday = new Date().toISOString().split('T')[0] === dateString;

              return (
                <div 
                  key={i} 
                  className={`min-h-[120px] p-2 border-r border-b border-white/5 transition-colors group relative ${
                    !isCurrentMonth ? 'opacity-10 pointer-events-none' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-mono font-bold ${
                      isToday ? 'w-6 h-6 rounded-lg bg-nexus-purple text-white flex items-center justify-center' : 'text-white/30'
                    }`}>
                      {isCurrentMonth ? dayNum : ''}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-1">
                        {Array.from(new Set(dayEvents.map(e => e.type))).map(type => (
                          <div key={type} className={`w-1.5 h-1.5 rounded-full ${eventTypeConfig[type].color}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold flex items-center gap-1.5 truncate border border-white/5 shadow-lg ${eventTypeConfig[event.type].color} text-white`}
                      >
                        {eventTypeConfig[event.type].icon}
                        <span className="truncate">{event.title}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sidebar Schedule */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col p-6">
            <h3 className="font-heading font-bold text-lg mb-6 flex items-center gap-2">
              <Clock size={18} className="text-nexus-purple" />
              Upcoming Events
            </h3>
            
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {filteredEvents.sort((a,b) => a.date.localeCompare(b.date)).map((event) => (
                <motion.div 
                  key={event.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-nexus-purple/40 transition-all group"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider text-white ${eventTypeConfig[event.type].color}`}>
                      {event.type}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">{event.date}</span>
                  </div>
                  <h4 className="font-bold text-sm mb-1 group-hover:text-nexus-cyan transition-colors">{event.title}</h4>
                  <div className="flex flex-col gap-1 mt-3">
                    <div className="flex items-center gap-2 text-[10px] text-white/40">
                      <Users size={12} className="text-nexus-purple" />
                      <span>{event.artist}</span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <Clock size={12} className="text-nexus-cyan" />
                        <span>{event.time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <MapPin size={12} className="text-nexus-pink" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 italic">
                  <CalendarIcon size={40} className="mb-4" />
                  <p className="text-xs">No scheduled events</p>
                </div>
              )}
            </div>
            
            <Button variant="outline" className="w-full mt-6 gap-2">
              <Filter size={16} />
              Manage All
            </Button>
          </Card>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add Label Event"
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-white/40 tracking-widest">Event Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Mastering Session"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-white/40 tracking-widest">Type</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple appearance-none">
                <option value="release">Release</option>
                <option value="session">Studio Session</option>
                <option value="promo">Promotion</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-white/40 tracking-widest">Date</label>
              <input 
                required
                type="date" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-white/40 tracking-widest">Assign Artist</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple appearance-none">
              <option value="solaris">Solaris</option>
              <option value="ghost">Ghost Tape</option>
              <option value="queen">Neon Queen</option>
              <option value="management">Management</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1">Create Event</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
