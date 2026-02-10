
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Clock, Loader2, CheckCircle2, X, Check, Disc, Save, ShieldAlert } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { Task, TaskPriority, STATUS_LABELS } from '../types';

const GROUP_ORDER = ['idee_brainstorm', 'maquette', 'rec', 'mix', 'master', 'prepa_promo', 'promo_sortie', 'promo_pre_sortie', 'fin', 'sans_projet'];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '', description: '', status: 'todo', priority: 'medium', project_id: '', assigned_to: '', due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projRes, profRes] = await Promise.all([
        supabase.from('tasks').select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, title, status').order('title'),
        supabase.from('profiles').select('id, full_name').order('full_name')
      ]);

      setTasks(tasksRes.data || []);
      setProjects(projRes.data || []);
      setProfiles(profRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert("Mise à jour impossible.");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.project_id) return;
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.from('tasks').insert([newTask]).select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)').single();
      if (error) throw error;
      setTasks([data, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', project_id: '', assigned_to: '', due_date: '' });
    } catch (err) {
      alert("Création impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = (task: Task) => {
    const now = new Date().toISOString().split('T')[0];
    return task.status !== 'done' && task.due_date < now;
  };

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    GROUP_ORDER.forEach(g => grouped[g] = []);
    tasks.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()) || t.project?.title?.toLowerCase().includes(search.toLowerCase()))
         .forEach(task => {
           const status = task.project?.status || 'sans_projet';
           if (!grouped[status]) grouped[status] = [];
           grouped[status].push(task);
         });
    return grouped;
  }, [tasks, search]);

  const priorityStyles: Record<TaskPriority, string> = {
    low: 'text-slate-400 border-slate-400/20 bg-slate-400/5',
    medium: 'text-nexus-cyan border-nexus-cyan/20 bg-nexus-cyan/5',
    high: 'text-nexus-orange border-nexus-orange/20 bg-nexus-orange/5',
    urgent: 'text-nexus-red border-nexus-red/30 bg-nexus-red/5',
    overdue: 'text-nexus-red border-nexus-red/50 bg-nexus-red/10'
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tighter">Flux Opérationnel</h2>
          <p className="text-nexus-lightGray text-sm">Gestion des priorités de production.</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nouvelles Mission
        </Button>
      </header>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input type="text" placeholder="Recherche missions..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full glass rounded-2xl py-3 pl-12 pr-4 text-sm text-white" />
      </div>

      {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-nexus-purple" size={40} /></div> : (
        <div className="space-y-12 pb-20">
          {GROUP_ORDER.map(statusKey => {
            const statusTasks = groupedTasks[statusKey];
            if (statusTasks.length === 0) return null;

            return (
              <section key={statusKey} className="space-y-5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <h3 className="text-xs font-black font-mono uppercase tracking-widest text-white/40">{STATUS_LABELS[statusKey as any] || 'Hors Projet'}</h3>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/30">{statusTasks.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {statusTasks.map(task => {
                    const overdue = isOverdue(task);
                    return (
                      <motion.div 
                        key={task.id} 
                        layout
                        className={`glass p-5 rounded-[24px] border border-white/5 transition-all relative ${task.status === 'done' ? 'opacity-40' : ''} ${overdue ? 'border-nexus-red/40 bg-nexus-red/5' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest ${priorityStyles[task.priority]}`}>
                            {overdue ? 'EN RETARD' : task.priority}
                          </span>
                        </div>
                        
                        <div className="flex gap-3 mb-5">
                          <button 
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className={`w-5 h-5 rounded-lg border transition-all shrink-0 flex items-center justify-center ${task.status === 'done' ? 'bg-nexus-green border-nexus-green text-nexus-dark' : 'border-white/20 text-transparent hover:border-nexus-cyan'}`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <h4 className={`text-sm font-bold leading-tight ${task.status === 'done' ? 'line-through' : 'text-white'}`}>{task.title}</h4>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                          <div className={`flex items-center gap-1.5 text-[9px] font-mono font-bold ${overdue ? 'text-nexus-red animate-pulse' : 'text-white/30'}`}>
                            {overdue ? <ShieldAlert size={10} /> : <Clock size={10} />}
                            {task.due_date}
                          </div>
                          <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/10">
                            <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.assigned_to}/50`} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modal identique à l'existant, mais avec 'overdue' caché en création */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Mission">
        <form onSubmit={handleCreateTask} className="space-y-6">
          <input required type="text" placeholder="Mission..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          <select required value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white">
            <option value="">Lier à un projet...</option>
            {projects.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.title}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
             <select value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white">
                <option value="">Assigner à...</option>
                {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
             </select>
             <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})} className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white">
                <option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgente</option>
             </select>
          </div>
          <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white [color-scheme:dark]" />
          <Button type="submit" variant="primary" className="w-full h-14" isLoading={isSubmitting}>Confirmer la Mission</Button>
        </form>
      </Modal>
    </div>
  );
};
