
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, Clock, Loader2, CheckCircle2, User, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus, TaskPriority } from '../types';

const COLUMNS: { label: string, value: TaskStatus }[] = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Review', value: 'review' },
  { label: 'Completed', value: 'done' }
];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    project_id: '',
    assigned_to: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, project:projects(title, artist:artists(stage_name)), assignee:profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData);

      const { data: projData } = await supabase.from('projects').select('id, title').order('title');
      const { data: profData } = await supabase.from('profiles').select('id, full_name').order('full_name');
      
      if (projData) setProjects(projData);
      if (profData) setProfiles(profData);
    } catch (err: any) {
      alert("Error fetching tasks: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert("Failed to update task: " + err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.project_id) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select('*, project:projects(title, artist:artists(stage_name)), assignee:profiles(full_name, avatar_url)')
        .single();

      if (error) throw error;
      setTasks([data, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', project_id: '', assigned_to: '', due_date: '' });
      alert("Task created!");
    } catch (err: any) {
      alert("Creation failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.project?.title.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColors: Record<TaskPriority, string> = {
    low: 'text-slate-400 bg-slate-400/10',
    medium: 'text-nexus-cyan bg-nexus-cyan/10',
    high: 'text-nexus-orange bg-nexus-orange/10',
    urgent: 'text-nexus-red bg-nexus-red/10 border-nexus-red/30',
  };

  return (
    <div className="p-4 lg:p-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white">Label Workflow</h2>
          <p className="text-nexus-lightGray text-sm">Assign, track, and optimize label operations.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Search workflow..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none w-full md:w-64 text-white"
            />
          </div>
          <Button variant="primary" className="gap-2 shadow-xl" onClick={() => setIsModalOpen(true)}><Plus size={18} /> New Task</Button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-nexus-purple mb-4" size={40} />
          <p className="text-[10px] font-mono tracking-widest text-white/30">SYNCING BOARDS...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
          <div className="flex gap-6 h-full min-w-max px-2">
            {COLUMNS.map(col => (
              <div key={col.value} className="w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                     <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-white/60">{col.label}</h3>
                     <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-white/40 font-mono">
                       {filteredTasks.filter(t => t.status === col.value).length}
                     </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks
                      .filter(t => t.status === col.value)
                      .map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ y: -4 }}
                          className="glass p-5 rounded-[24px] border-white/5 hover:border-nexus-purple/40 group transition-all cursor-pointer relative"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase border ${priorityColors[task.priority as TaskPriority]}`}>
                              {task.priority}
                            </span>
                            <div className="flex items-center gap-1">
                              <select 
                                onChange={(e) => handleUpdateStatus(task.id, e.target.value as TaskStatus)}
                                className="bg-transparent text-[8px] font-mono uppercase text-white/20 hover:text-white outline-none cursor-pointer"
                                value={task.status}
                              >
                                {COLUMNS.map(c => <option key={c.value} value={c.value} className="bg-nexus-surface">{c.label}</option>)}
                              </select>
                              <button onClick={() => handleDeleteTask(task.id)} className="text-white/20 hover:text-nexus-red p-1"><X size={12} /></button>
                            </div>
                          </div>
                          
                          <h4 className="font-bold text-sm text-white group-hover:text-nexus-cyan transition-colors mb-2 line-clamp-2">{task.title}</h4>
                          <p className="text-[10px] text-white/30 line-clamp-1 mb-4 italic">Project: {task.project?.title || 'General'}</p>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded-lg bg-nexus-purple/20 flex items-center justify-center text-[8px] text-nexus-purple font-mono uppercase border border-nexus-purple/30">
                              {task.project?.artist?.stage_name?.[0] || 'L'}
                            </div>
                            <span className="text-[10px] text-white/40 truncate tracking-tight">{task.project?.artist?.stage_name} Release Flow</span>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-white/40">
                              <Clock size={12} className="text-nexus-orange" />
                              <span className="text-[10px] font-mono">{task.due_date || 'No Date'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-7 h-7 rounded-xl overflow-hidden border border-white/10" title={task.assignee?.full_name}>
                                 <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.assigned_to}/50`} alt="" className="w-full h-full object-cover" />
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Pipeline Task">
        <form onSubmit={handleCreateTask} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Task Label *</label>
            <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Master track for Spotify..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Project Alignment *</label>
            <select required value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none">
              <option value="" className="bg-nexus-surface">Select Project...</option>
              {projects.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Assign To</label>
              <select value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none">
                <option value="" className="bg-nexus-surface">Internal Team...</option>
                {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Priority</label>
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Deadline</label>
            <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none [color-scheme:dark]" />
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Activate Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
