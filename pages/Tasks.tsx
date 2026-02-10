
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, Clock, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Task, TaskStatus, TaskPriority } from '../types';

const MOCK_TASKS: Task[] = [
  { id: '1', project_id: '1', assigned_to: 'Alex Rivera', title: 'Finalize Distribution Contract', status: 'in_progress', priority: 'high', due_date: '2024-10-25', artist_name: 'Solaris', project_title: 'Neon Pulse' },
  { id: '2', project_id: '1', assigned_to: 'Sarah Chen', title: 'Vocal Tuning - Track 02', status: 'todo', priority: 'medium', due_date: '2024-10-28', artist_name: 'Solaris', project_title: 'Neon Pulse' },
  { id: '3', project_id: '2', assigned_to: 'Marcus Volt', title: 'EPK Design Concepts', status: 'review', priority: 'urgent', due_date: '2024-10-22', artist_name: 'Ghost Tape', project_title: 'Midnight City' },
  { id: '4', project_id: '3', assigned_to: 'Alex Rivera', title: 'Pitch to Spotify Playlists', status: 'done', priority: 'high', due_date: '2024-10-15', artist_name: 'Neon Queen', project_title: 'Broken Silence' },
  { id: '5', project_id: '1', assigned_to: 'Elena Ray', title: 'Social Media Assets Kit', status: 'in_progress', priority: 'low', due_date: '2024-11-05', artist_name: 'Solaris', project_title: 'Neon Pulse' },
];

const COLUMNS: { label: string, value: TaskStatus }[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Completed', value: 'done' }
];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [search, setSearch] = useState('');

  const priorityColors: Record<TaskPriority, string> = {
    low: 'text-slate-400 bg-slate-400/10',
    medium: 'text-nexus-cyan bg-nexus-cyan/10',
    high: 'text-nexus-orange bg-nexus-orange/10',
    urgent: 'text-nexus-red bg-nexus-red/10 border-nexus-red/30',
  };

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white">Label Tasks</h2>
          <p className="text-nexus-lightGray text-sm">Organize production workflows across all active artists.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none w-64"
            />
          </div>
          <Button variant="primary" className="gap-2"><Plus size={18} /> New Task</Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max px-2">
          {COLUMNS.map(col => (
            <div key={col.value} className="w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                   <h3 className="font-heading font-bold text-sm uppercase tracking-widest">{col.label}</h3>
                   <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-white/40 font-mono">
                     {tasks.filter(t => t.status === col.value).length}
                   </span>
                </div>
                <Button variant="ghost" size="sm" className="p-1"><MoreHorizontal size={16} /></Button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {tasks
                    .filter(t => t.status === col.value && t.title.toLowerCase().includes(search.toLowerCase()))
                    .map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -4 }}
                        className="glass p-5 rounded-2xl border-white/5 hover:border-nexus-purple/30 group transition-all cursor-pointer relative"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase border ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          <button className="text-white/20 hover:text-white"><MoreHorizontal size={14} /></button>
                        </div>
                        
                        <h4 className="font-bold text-sm text-white group-hover:text-nexus-cyan transition-colors mb-2 line-clamp-2">{task.title}</h4>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-5 h-5 rounded-full bg-nexus-purple/20 flex items-center justify-center text-[8px] text-nexus-purple font-mono uppercase border border-nexus-purple/30">
                            {task.artist_name?.[0]}
                          </div>
                          <span className="text-[10px] text-white/40 truncate">{task.artist_name} • {task.project_title}</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-white/40">
                            <Clock size={12} />
                            <span className="text-[10px] font-mono">{task.due_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10" title={task.assigned_to}>
                               <img src={`https://picsum.photos/seed/${task.assigned_to}/50`} alt="" className="w-full h-full object-cover" />
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
                <div className="border-2 border-dashed border-white/5 rounded-2xl p-4 text-center hover:border-nexus-purple/20 transition-all cursor-pointer group">
                  <Plus className="mx-auto text-white/10 group-hover:text-nexus-purple mb-1" size={20} />
                  <span className="text-[10px] font-semibold text-white/10 group-hover:text-white/30 uppercase">Add Task</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
