
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, MoreHorizontal, Clock, Loader2, CheckCircle2, User, X, Check, Disc, Square, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus, TaskPriority, STATUS_LABELS } from '../types';

const GROUP_ORDER = [
  'idee_brainstorm',
  'maquette',
  'rec',
  'mix',
  'master',
  'prepa_promo',
  'promo_sortie',
  'promo_pre_sortie',
  'fin',
  'sans_projet'
];

const GROUP_ICONS: Record<string, string> = {
  idee_brainstorm: '💡',
  maquette: '📝',
  rec: '🎤',
  mix: '🎛️',
  master: '🎚️',
  prepa_promo: '📋',
  promo_sortie: '🚀',
  promo_pre_sortie: '📢',
  fin: '✅',
  sans_projet: '📦'
};

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
        .select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      const { data: projData } = await supabase.from('projects').select('id, title, status').order('title');
      const { data: profData } = await supabase.from('profiles').select('id, full_name').order('full_name');
      
      if (projData) setProjects(projData);
      if (profData) setProfiles(profData);
    } catch (err: any) {
      console.error("Erreur récupération tâches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert("Erreur lors de la mise à jour de la tâche");
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
        .select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)')
        .single();

      if (error) throw error;
      setTasks([data, ...tasks]);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', project_id: '', assigned_to: '', due_date: '' });
      alert("Tâche créée avec succès !");
    } catch (err: any) {
      alert("Erreur lors de la création de la tâche");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression");
    }
  };

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    // Initialiser les groupes dans le bon ordre
    GROUP_ORDER.forEach(g => grouped[g] = []);

    tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) || 
      t.project?.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.project?.artist?.stage_name?.toLowerCase().includes(search.toLowerCase())
    ).forEach(task => {
      const status = task.project?.status || 'sans_projet';
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(task);
    });

    return grouped;
  }, [tasks, search]);

  const priorityColors: Record<TaskPriority, string> = {
    low: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    medium: 'text-nexus-cyan bg-nexus-cyan/10 border-nexus-cyan/20',
    high: 'text-nexus-orange bg-nexus-orange/10 border-nexus-orange/20',
    urgent: 'text-nexus-red bg-nexus-red/10 border-nexus-red/30',
  };

  return (
    <div className="p-4 lg:p-8 min-h-screen flex flex-col space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Flux de Travail</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Gérez vos priorités regroupées par phase de projet.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une mission..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none w-64 text-white"
            />
          </div>
          <Button variant="primary" className="gap-2 shadow-xl" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span className="font-bold">Nouvelle Tâche</span>
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-nexus-purple mb-4" size={40} />
          <p className="text-[10px] font-mono tracking-widest text-white/30 uppercase">Analyse des opérations...</p>
        </div>
      ) : (
        <div className="space-y-12 pb-20">
          {GROUP_ORDER.map(statusKey => {
            const statusTasks = groupedTasks[statusKey];
            if (statusTasks.length === 0) return null;

            return (
              <section key={statusKey} className="space-y-4">
                <div className="flex items-center gap-3 px-1 border-b border-white/5 pb-3">
                  <span className="text-2xl">{GROUP_ICONS[statusKey]}</span>
                  <h3 className="text-sm font-black font-mono uppercase tracking-[0.3em] text-white/60">
                    {STATUS_LABELS[statusKey as any] || 'Sans Projet'} à faire
                  </h3>
                  <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/40 font-bold ml-2">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence mode="popLayout">
                    {statusTasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -4 }}
                        className={`glass p-5 rounded-[28px] border-white/5 hover:border-nexus-purple/40 group transition-all relative shadow-xl ${task.status === 'done' ? 'opacity-40' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-widest ${priorityColors[task.priority as TaskPriority]}`}>
                            {task.priority === 'low' ? 'Basse' : task.priority === 'medium' ? 'Normale' : task.priority === 'high' ? 'Haute' : 'Urgente'}
                          </span>
                          <button onClick={() => handleDeleteTask(task.id)} className="text-white/10 hover:text-nexus-red p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={14} />
                          </button>
                        </div>
                        
                        <div className="flex gap-3 mb-4">
                           <button 
                             onClick={() => handleToggleTaskStatus(task.id, task.status)}
                             className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${task.status === 'done' ? 'bg-nexus-green border-nexus-green text-nexus-dark shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-white/20 text-transparent hover:border-nexus-cyan hover:text-nexus-cyan/40'}`}
                           >
                             <Check size={14} strokeWidth={3} />
                           </button>
                           <div className="flex-1 min-w-0">
                             <h4 className={`font-bold text-sm leading-snug group-hover:text-nexus-cyan transition-colors truncate ${task.status === 'done' ? 'line-through text-white/20' : 'text-white/90'}`}>
                               {task.title}
                             </h4>
                           </div>
                        </div>

                        <div className="space-y-4 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <Disc size={12} className="text-nexus-purple shrink-0" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter truncate">
                              {task.project?.title || 'Tâche Globale'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold font-mono ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-nexus-red' : 'text-nexus-orange/60'}`}>
                              <Clock size={12} />
                              <span>{task.due_date || 'ASAP'}</span>
                            </div>
                            <div className="w-7 h-7 rounded-xl overflow-hidden border border-white/10 shadow-lg" title={task.assignee?.full_name}>
                               <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.assigned_to}/50`} alt="" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}

          {tasks.length === 0 && !loading && (
            <div className="py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-30 flex flex-col items-center justify-center">
               <CheckCircle2 size={64} className="mb-4" />
               <p className="text-lg font-heading font-bold">Aucune tâche en cours</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nouvelle Tâche */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Mission">
        <form onSubmit={handleCreateTask} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Intitulé de la mission *</label>
            <input 
              required 
              type="text" 
              value={newTask.title} 
              onChange={e => setNewTask({...newTask, title: e.target.value})} 
              placeholder="ex: Finaliser le mixage du single..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none transition-all shadow-xl" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Projet Associé *</label>
            <select 
              required 
              value={newTask.project_id} 
              onChange={e => setNewTask({...newTask, project_id: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none appearance-none"
            >
              <option value="" className="bg-nexus-surface">Lier à un projet...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-nexus-surface">
                  {p.title} ({STATUS_LABELS[p.status as any] || p.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Assigné à</label>
              <select 
                value={newTask.assigned_to} 
                onChange={e => setNewTask({...newTask, assigned_to: e.target.value})} 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none appearance-none"
              >
                <option value="" className="bg-nexus-surface">Membre du staff...</option>
                {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Priorité</label>
              <select 
                value={newTask.priority} 
                onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})} 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white outline-none appearance-none"
              >
                <option value="low">Basse</option>
                <option value="medium">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Date d'échéance</label>
            <input 
              type="date" 
              value={newTask.due_date} 
              onChange={e => setNewTask({...newTask, due_date: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white outline-none [color-scheme:dark]" 
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-white/5">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>
              <Save size={18} className="mr-2" /> Créer la mission
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
