
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Clock, Loader2, Check, Disc, Save, ShieldAlert, Folder, User, Calendar as CalendarIcon, Edit3, Trash2, AlertTriangle, Music } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { AdminOnly } from '../components/AdminOnly';
import { useRole } from '../hooks/useRole';
import { Task, TaskPriority, TaskStatus, STATUS_LABELS, Track } from '../types';

const GROUP_ORDER = ['idea', 'pre_production', 'production', 'post_production', 'release', 'released', 'sans_projet'];

export const Tasks: React.FC = () => {
  const { role } = useRole();
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
  const [finishedOpen, setFinishedOpen] = useState(false);

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
    // Only admins can edit existing tasks
    if (role !== 'admin') return;
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.title) return alert("Le titre est obligatoire.");
    try {
      setIsSubmitting(true);
      const payload: any = { 
        title: editingTask.title,
        description: editingTask.description,
        project_id: editingTask.project_id || null,
        track_id: editingTask.track_id || null,
        assigned_to: editingTask.assigned_to || null,
        status: editingTask.status || 'todo',
        priority: editingTask.priority || 'medium',
        due_date: editingTask.due_date || null
      };

      if (editingTask.id) {
        const { data, error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', editingTask.id)
          .select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)')
          .single();
        if (error) throw error;
        setTasks(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert([payload])
          .select('*, project:projects(id, title, status, artist:artists(stage_name)), assignee:profiles(id, full_name, avatar_url)')
          .single();
        if (error) throw error;
        setTasks([data, ...tasks]);
      }

      setIsModalOpen(false);
      setEditingTask(null);
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
      alert("Mission effacée des registres.");
    } catch (err: any) {
      alert("Suppression impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Split tasks into pending and finished, then group only pending tasks by project status
  const { groupedTasks, finishedTasks } = useMemo(() => {
    const pending = tasks.filter(t => t.status !== 'done' && (t.title?.toLowerCase().includes(search.toLowerCase()) || t.project?.title?.toLowerCase().includes(search.toLowerCase())));
    const finished = tasks.filter(t => t.status === 'done' && (t.title?.toLowerCase().includes(search.toLowerCase()) || t.project?.title?.toLowerCase().includes(search.toLowerCase())));

    const grouped: Record<string, Task[]> = {};
    GROUP_ORDER.forEach(g => grouped[g] = []);
    pending.forEach(task => {
      const status = task.project?.status || 'sans_projet';
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(task);
    });

    return { groupedTasks: grouped, finishedTasks: finished };
  }, [tasks, search]);

  const totalFinishedCount = useMemo(() => tasks.filter(t => t.status === 'done').length, [tasks]);

  const priorityStyles: Record<TaskPriority, string> = {
    low: 'text-slate-400 border-slate-400/20 bg-slate-400/5',
    medium: 'text-nexus-cyan border-nexus-cyan/20 bg-nexus-cyan/5',
    high: 'text-nexus-orange border-nexus-orange/20 bg-nexus-orange/5',
    urgent: 'text-nexus-red border-nexus-red/30 bg-nexus-red/5',
    overdue: 'text-nexus-red border-nexus-red/50 bg-nexus-red/10'
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 min-h-screen max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl lg:text-5xl font-heading font-extrabold text-white tracking-tighter italic leading-none">Centre Opérationnel <span className="text-nexus-purple">Hub</span></h2>
          <p className="text-nexus-lightGray text-xs lg:text-sm font-mono uppercase tracking-[0.2em] mt-1.5 opacity-60">Registre central des missions Nexus</p>
        </div>
        <Button variant="primary" className="gap-2 h-14 rounded-2xl px-8 shadow-2xl nexus-glow" onClick={() => { setEditingTask({ title: '', status: 'todo', priority: 'medium' }); setIsModalOpen(true); }}>
          <Plus size={20} /> <span className="font-black uppercase tracking-[0.2em] text-[10px]">Déclencher Nouvelle Mission</span>
        </Button>
      </header>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher une mission ou un projet..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full glass rounded-[24px] py-4 pl-12 pr-4 text-sm text-white focus:border-nexus-purple outline-none transition-all shadow-xl font-medium" 
        />
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
           <Loader2 className="animate-spin text-nexus-purple" size={48} />
           <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/20">Accès au registre...</p>
        </div>
      ) : (
        <div className="space-y-20 pb-20">
          {GROUP_ORDER.map(statusKey => {
            const statusTasks = groupedTasks[statusKey];
            if (statusTasks.length === 0) return null;

            return (
              <section key={statusKey} className="space-y-8">
                <div className="flex items-center gap-6 border-b border-white/5 pb-5">
                  <div className="w-1.5 h-6 nexus-gradient rounded-full" />
                  <h3 className="text-[11px] font-black font-mono uppercase tracking-[0.4em] text-white/60">
                    {STATUS_LABELS[statusKey as any] || 'Missions Indépendantes'}
                  </h3>
                  <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-white/30 font-black shadow-inner">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {statusTasks.map(task => (
                    <motion.div 
                      key={task.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`glass p-7 rounded-[32px] border border-white/5 transition-all relative flex flex-col h-full shadow-2xl ${task.status === 'done' ? 'opacity-30 grayscale-[0.5]' : 'hover:border-nexus-purple/40 cursor-pointer'}`}
                      onClick={() => handleOpenEdit(task)}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border tracking-widest ${priorityStyles[task.priority]}`}>
                          {task.priority}
                        </span>
                        <div className="p-2 text-white/10 group-hover:text-nexus-purple transition-colors">
                          <Edit3 size={18} />
                        </div>
                      </div>
                      
                      <div className="flex gap-5 mb-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleTaskStatus(task.id, task.status); }}
                          className={`w-7 h-7 rounded-xl border-2 transition-all shrink-0 flex items-center justify-center mt-0.5 ${task.status === 'done' ? 'bg-nexus-green border-nexus-green text-nexus-dark shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'border-white/20 text-transparent hover:border-nexus-cyan hover:bg-white/5'}`}
                        >
                          <Check size={18} strokeWidth={4} />
                        </button>
                        <div className="min-w-0">
                          <h4 className={`text-lg font-heading font-extrabold leading-tight tracking-tight ${task.status === 'done' ? 'line-through' : 'text-white'}`}>{task.title}</h4>
                          {task.project && (
                             <div className="flex items-center gap-2 mt-4">
                                <Disc size={12} className="text-nexus-cyan shrink-0" />
                                <p className="text-[9px] text-nexus-cyan font-mono uppercase tracking-[0.2em] font-black truncate">{task.project.title}</p>
                             </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 mt-8 border-t border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-white/30">
                          <CalendarIcon size={14} className="text-nexus-purple/40" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Pas de deadline'}
                        </div>
                        <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/5 shadow-2xl bg-white/5">
                          <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.assigned_to}/50`} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Collapsible finished tasks panel fixed at bottom */}
      {totalFinishedCount > 0 && (
        <button onClick={() => setFinishedOpen(o => !o)} className="fixed bottom-6 right-4 z-[60] bg-nexus-purple text-white px-4 py-3 rounded-full shadow-2xl border border-white/10">
          Terminé · {totalFinishedCount}
        </button>
      )}

      <div className="fixed right-4 bottom-20 w-full max-w-md px-4 z-50 pointer-events-none">
        <motion.div initial={{ y: 120 }} animate={{ y: finishedOpen ? 0 : 120 }} transition={{ type: 'spring', damping: 20 }} className="pointer-events-auto">
            <div className={`glass rounded-2xl border border-white/10 shadow-2xl w-full ${finishedOpen ? 'p-6' : 'p-2'}`} style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 12px)` }}>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setFinishedOpen(o => !o)}>
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 nexus-gradient rounded-full" />
                <h3 className="text-[11px] font-black font-mono uppercase tracking-[0.4em] text-white/60">Terminé</h3>
                <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-white/30 font-black shadow-inner">{finishedTasks.length}</span>
              </div>
              <div className="text-[11px] font-black text-white/40 uppercase tracking-widest">{finishedOpen ? 'Fermer' : 'Afficher'}</div>
            </div>

            {finishedOpen && (
              <div className="mt-4 grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                {finishedTasks.map(task => (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`glass p-5 rounded-[24px] border border-white/5 relative flex flex-col h-full opacity-60 grayscale-[0.3]`}
                    onClick={() => handleOpenEdit(task)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 rounded-xl text-[9px] font-black uppercase border tracking-widest ${priorityStyles[task.priority]}`}>{task.priority}</span>
                      <div className="p-2 text-white/10"><Edit3 size={16} /></div>
                    </div>
                    <div className="flex gap-4 mb-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleTaskStatus(task.id, task.status); }}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center mt-0.5 ${task.status === 'done' ? 'bg-nexus-green border-nexus-green text-nexus-dark' : 'border-white/20 text-transparent hover:border-nexus-cyan hover:bg-white/5'}`}
                        aria-label="Marquer comme non terminé"
                      >
                        <Check size={18} strokeWidth={4} />
                      </button>
                      <div className="min-w-0">
                        <h4 className={`text-lg font-heading font-extrabold leading-tight tracking-tight line-through text-white`}>{task.title}</h4>
                        {task.project && (
                          <div className="flex items-center gap-2 mt-3">
                            <Disc size={12} className="text-nexus-cyan shrink-0" />
                            <p className="text-[9px] text-nexus-cyan font-mono uppercase tracking-[0.2em] font-black truncate">{task.project.title}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-white/30">
                        <CalendarIcon size={14} className="text-nexus-purple/40" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Pas de deadline'}
                      </div>
                      <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/5 shadow-2xl bg-white/5">
                        <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.assigned_to}/50`} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* MODAL: Tactical Mission Configuration */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} title={editingTask?.id ? "Mise à jour de Directive" : "Initialisation d'Ordre"}>
         <form onSubmit={handleCreateOrUpdate} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Intitulé de l'Opération *</label>
              <input required type="text" value={editingTask?.title || ''} onChange={e => setEditingTask({...editingTask!, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-nexus-purple shadow-xl" placeholder="ex: Validation Mix Master V2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Liaison Projet (Optionnel)</label>
                <select value={editingTask?.project_id || ''} onChange={e => setEditingTask({...editingTask!, project_id: e.target.value, track_id: ''})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl appearance-none">
                  <option value="" className="bg-nexus-surface">Mission Indépendante / Interne</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Liaison Track (Si applicable)</label>
                <select value={editingTask?.track_id || ''} onChange={e => setEditingTask({...editingTask!, track_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl appearance-none disabled:opacity-20" disabled={!editingTask?.project_id}>
                  <option value="" className="bg-nexus-surface">Global au Projet</option>
                  {relatedTracks.map(t => <option key={t.id} value={t.id} className="bg-nexus-surface">{t.title}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Responsable Assigné</label>
                <select required value={editingTask?.assigned_to || ''} onChange={e => setEditingTask({...editingTask!, assigned_to: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl appearance-none">
                  <option value="" className="bg-nexus-surface">Identifier un agent...</option>
                  {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Date d'Échéance</label>
                <input type="date" value={editingTask?.due_date || ''} onChange={e => setEditingTask({...editingTask!, due_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl [color-scheme:dark]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Niveau de Priorité</label>
                <select value={editingTask?.priority || 'medium'} onChange={e => setEditingTask({...editingTask!, priority: e.target.value as TaskPriority})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl">
                  <option value="low" className="bg-nexus-surface">Basse</option>
                  <option value="medium" className="bg-nexus-surface">Medium</option>
                  <option value="high" className="bg-nexus-surface">Haute</option>
                  <option value="urgent" className="bg-nexus-surface">Urgente</option>
                  <option value="overdue" className="bg-nexus-surface">Critique / Retard</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Statut d'Avancement</label>
                <select value={editingTask?.status || 'todo'} onChange={e => setEditingTask({...editingTask!, status: e.target.value as TaskStatus})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl">
                  <option value="todo" className="bg-nexus-surface">À faire</option>
                  <option value="in_progress" className="bg-nexus-surface">En cours</option>
                  <option value="review" className="bg-nexus-surface">Review / Test</option>
                  <option value="done" className="bg-nexus-surface">Terminé</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Briefing / Détails</label>
              <textarea rows={4} value={editingTask?.description || ''} onChange={e => setEditingTask({...editingTask!, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white resize-none outline-none focus:border-nexus-purple shadow-xl" placeholder="Instruction détaillées pour l'agent..." />
            </div>

            <div className="flex gap-4 pt-8 border-t border-white/5">
              <AdminOnly>
                {editingTask?.id && (
                  <Button type="button" variant="ghost" className="text-nexus-red border border-nexus-red/20 hover:bg-nexus-red/10 rounded-2xl h-14 w-14 p-0 shrink-0" onClick={() => setIsDeleteModalOpen(true)}>
                    <Trash2 size={24} />
                  </Button>
                )}
              </AdminOnly>
              <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => { setIsModalOpen(false); setEditingTask(null); }}>Annuler</Button>
              <Button type="submit" variant="primary" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" isLoading={isSubmitting}>Enregistrer les directives</Button>
            </div>
         </form>
      </Modal>

      {/* MODAL: Cancellation Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmation d'Archivage">
        <div className="space-y-8 text-center py-6">
          <AlertTriangle size={64} className="mx-auto text-nexus-red nexus-glow rounded-full p-2 bg-nexus-red/10" />
          <div className="space-y-3">
             <p className="text-white text-2xl font-heading font-extrabold">Confirmer l'annulation définitive de cette mission ?</p>
             <p className="text-white/40 text-sm italic">Cette action retirera la tâche du registre central sans possibilité de retour en arrière.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsDeleteModalOpen(false)}>Maintenir</Button>
            <Button variant="danger" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={handleDeleteTask} isLoading={isSubmitting}>Confirmer l'effacement</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
