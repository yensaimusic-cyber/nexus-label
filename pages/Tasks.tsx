
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Clock, Loader2, Check, Disc, Save, ShieldAlert, Folder, User, Calendar as CalendarIcon, Edit3, Trash2, AlertTriangle, Music } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { Task, TaskPriority, TaskStatus, STATUS_LABELS, Track } from '../types';

const GROUP_ORDER = ['idee_brainstorm', 'maquette', 'rec', 'mix', 'master', 'prepa_promo', 'promo_sortie', 'promo_pre_sortie', 'fin', 'sans_projet'];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

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

  // Fetch tracks when project changes in modal
  useEffect(() => {
    const fetchTracks = async () => {
      const pid = editingTask?.project_id;
      if (!pid) {
        setRelatedTracks([]);
        return;
      }
      const { data } = await supabase.from('tracks').select('id, title').eq('project_id', pid).order('title');
      setRelatedTracks(data || []);
    };
    fetchTracks();
  }, [editingTask?.project_id]);

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t));
    } catch (err) {
      alert("Mise à jour impossible.");
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.title) return alert("Le titre est obligatoire.");
    try {
      setIsSubmitting(true);
      const payload = { ...editingTask };
      
      // Nettoyage des IDs vides
      if (!payload.project_id) payload.project_id = undefined;
      if (!payload.track_id) payload.track_id = undefined;

      // Retirer les objets joints pour l'update Supabase
      const cleanPayload = { ...payload };
      delete (cleanPayload as any).project;
      delete (cleanPayload as any).assignee;

      if (editingTask.id) {
        const { data, error } = await supabase
          .from('tasks')
          .update(cleanPayload)
          .eq('id', editingTask.id)
          .select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)')
          .single();
        if (error) throw error;
        setTasks(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert([cleanPayload])
          .select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)')
          .single();
        if (error) throw error;
        setTasks([data, ...tasks]);
      }

      setIsModalOpen(false);
      setEditingTask(null);
      alert("Mission opérationnelle mise à jour !");
    } catch (err: any) {
      alert("Échec de l'opération : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask?.id) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('tasks').delete().eq('id', editingTask.id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== editingTask.id));
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
      setEditingTask(null);
      alert("Tâche supprimée définitivement.");
    } catch (err: any) {
      alert("Suppression impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = (task: Task) => {
    const now = new Date().toISOString().split('T')[0];
    return task.status !== 'done' && task.due_date && task.due_date < now;
  };

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    GROUP_ORDER.forEach(g => grouped[g] = []);
    tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) || 
      t.project?.title?.toLowerCase().includes(search.toLowerCase())
    ).forEach(task => {
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
    <div className="p-4 lg:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl lg:text-5xl font-heading font-extrabold text-white tracking-tighter italic">Opérations <span className="text-nexus-purple">Hub</span></h2>
          <p className="text-nexus-lightGray text-sm font-mono uppercase tracking-widest mt-1">Gestion centrale des priorités de production</p>
        </div>
        <Button variant="primary" className="gap-2 h-14 rounded-2xl px-8 shadow-2xl" onClick={() => { setEditingTask({ title: '', status: 'todo', priority: 'medium' }); setIsModalOpen(true); }}>
          <Plus size={20} /> <span className="font-black uppercase tracking-widest text-xs">Nouvelle Mission</span>
        </Button>
      </header>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        <input 
          type="text" 
          placeholder="Recherche par titre, projet ou artiste..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full glass rounded-[24px] py-4 pl-12 pr-4 text-sm text-white focus:border-nexus-purple outline-none transition-all shadow-xl" 
        />
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
           <Loader2 className="animate-spin text-nexus-purple" size={48} />
           <p className="text-[10px] font-mono uppercase text-white/20 tracking-[0.4em]">Accès au registre tactique...</p>
        </div>
      ) : (
        <div className="space-y-16 pb-20">
          {GROUP_ORDER.map(statusKey => {
            const statusTasks = groupedTasks[statusKey];
            if (statusTasks.length === 0) return null;

            return (
              <section key={statusKey} className="space-y-6">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-1.5 h-6 nexus-gradient rounded-full" />
                  <h3 className="text-xs font-black font-mono uppercase tracking-[0.3em] text-white/60">
                    {STATUS_LABELS[statusKey as any] || 'Hors Projet'}
                  </h3>
                  <span className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-lg text-white/30 font-black">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {statusTasks.map(task => {
                    const overdue = isOverdue(task);
                    return (
                      <motion.div 
                        key={task.id} 
                        layout
                        className={`glass p-6 rounded-[28px] border border-white/5 transition-all relative flex flex-col h-full ${task.status === 'done' ? 'opacity-40 grayscale-[0.5]' : ''} ${overdue ? 'border-nexus-red/40 bg-nexus-red/5' : 'hover:border-white/20 hover:bg-white/[0.02]'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border tracking-widest ${priorityStyles[task.priority]}`}>
                            {overdue ? 'DÉPASSEMENT CRITIQUE' : task.priority}
                          </span>
                          <button onClick={() => handleOpenEdit(task)} className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-nexus-purple transition-all">
                            <Edit3 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex gap-4 mb-auto">
                          <button 
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className={`w-6 h-6 rounded-xl border-2 transition-all shrink-0 flex items-center justify-center mt-0.5 ${task.status === 'done' ? 'bg-nexus-green border-nexus-green text-nexus-dark' : 'border-white/20 text-transparent hover:border-nexus-cyan'}`}
                          >
                            <Check size={16} strokeWidth={4} />
                          </button>
                          <div className="cursor-pointer" onClick={() => handleOpenEdit(task)}>
                            <h4 className={`text-base font-bold leading-snug tracking-tight ${task.status === 'done' ? 'line-through' : 'text-white'}`}>{task.title}</h4>
                            {task.project && (
                              <div className="flex items-center gap-1.5 text-[10px] text-nexus-cyan font-mono uppercase tracking-widest font-black mt-2">
                                <Folder size={12} />
                                <span className="truncate max-w-[150px]">{task.project.title}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-white/5 flex justify-between items-center">
                          <div className={`flex items-center gap-2 text-[10px] font-mono font-bold ${overdue ? 'text-nexus-red animate-pulse' : 'text-white/30'}`}>
                            {overdue ? <ShieldAlert size={12} /> : <CalendarIcon size={12} />}
                            {task.due_date || 'No Date'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/20 font-bold hidden sm:inline">{task.assignee?.full_name?.split(' ')[0]}</span>
                            <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                              <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.assigned_to}/50`} className="w-full h-full object-cover" />
                            </div>
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

      {/* Task Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} title={editingTask?.id ? "Mise à jour tactique" : "Programmer une Mission"}>
        <form onSubmit={handleCreateOrUpdate} className="space-y-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black ml-1">Désignation de la mission *</label>
            <input 
              required 
              type="text" 
              placeholder="ex: Finaliser Mixage V2..." 
              value={editingTask?.title || ''} 
              onChange={e => setEditingTask({...editingTask!, title: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-nexus-purple outline-none shadow-xl" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black ml-1">Description (Notes)</label>
            <textarea 
              rows={3}
              value={editingTask?.description || ''} 
              onChange={e => setEditingTask({...editingTask!, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:border-nexus-purple outline-none shadow-xl resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Projet</label>
                <select 
                  value={editingTask?.project_id || ''} 
                  onChange={e => setEditingTask({...editingTask!, project_id: e.target.value, track_id: ''})} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-nexus-purple"
                >
                  <option value="" className="bg-nexus-surface">Aucun Projet</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.title}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Track</label>
                <select 
                  value={editingTask?.track_id || ''} 
                  onChange={e => setEditingTask({...editingTask!, track_id: e.target.value})} 
                  disabled={!editingTask?.project_id}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-nexus-purple disabled:opacity-20"
                >
                  <option value="" className="bg-nexus-surface">Toute la tracklist</option>
                  {relatedTracks.map(t => <option key={t.id} value={t.id} className="bg-nexus-surface">{t.title}</option>)}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Assigné à</label>
              <select required value={editingTask?.assigned_to || ''} onChange={e => setEditingTask({...editingTask!, assigned_to: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-nexus-purple">
                <option value="" className="bg-nexus-surface">Choisir...</option>
                {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Status</label>
              <select value={editingTask?.status || 'todo'} onChange={e => setEditingTask({...editingTask!, status: e.target.value as TaskStatus})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-nexus-purple">
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="review">Revue</option>
                <option value="done">Terminé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Priorité</label>
              <select value={editingTask?.priority || 'medium'} onChange={e => setEditingTask({...editingTask!, priority: e.target.value as TaskPriority})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none outline-none focus:border-nexus-purple">
                <option value="low">Basse</option>
                <option value="medium">Standard</option>
                <option value="high">Haute</option>
                <option value="urgent">Critique</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Deadline</label>
              <input 
                type="date" 
                value={editingTask?.due_date || ''} 
                onChange={e => setEditingTask({...editingTask!, due_date: e.target.value})} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white [color-scheme:dark] outline-none" 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-white/5">
            {editingTask?.id && (
               <Button type="button" variant="danger" className="shrink-0 rounded-2xl" onClick={() => setIsDeleteModalOpen(true)}>
                 <Trash2 size={20} />
               </Button>
            )}
            <Button type="button" variant="ghost" className="flex-1 rounded-2xl" onClick={() => { setIsModalOpen(false); setEditingTask(null); }}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1 rounded-2xl font-black uppercase tracking-[0.2em] text-xs" isLoading={isSubmitting}>
              {editingTask?.id ? 'Mettre à jour' : 'Lancer Mission'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Task Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmer Suppression">
         <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-nexus-red/10 text-nexus-red rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
               <p className="text-xl font-bold text-white">Supprimer cette mission ?</p>
               <p className="text-sm text-white/40">Cette action est définitive et retirera la tâche du registre opérationnel.</p>
            </div>
            <div className="flex gap-3 pt-4">
               <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
               <Button variant="danger" className="flex-1" onClick={handleDeleteTask} isLoading={isSubmitting}>Confirmer</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
