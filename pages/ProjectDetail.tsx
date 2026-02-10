
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Disc, CheckSquare, Users, MessageSquare, Settings, 
  Play, Pause, Download, MoreVertical, Plus, Clock, DollarSign, 
  Share2, Instagram, Youtube, Music, Trash2, Camera, Loader2, Save, FileAudio, Check, Square, X, ClipboardList
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Waveform } from '../components/features/Waveform';
import { supabase } from '../lib/supabase';
import { uploadFile, deleteFileByUrl } from '../lib/storage';
import { Project, Track, TrackStatus, STATUS_LABELS, ProjectStatus, CampaignTask, ProjectCollaborator } from '../types';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [campaignTasks, setCampaignTasks] = useState<CampaignTask[]>([]);
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'tasks' | 'collaboration'>('tracks');
  
  // States
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCollab, setNewCollab] = useState({ profile_id: '', role: '' });
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, tracksRes, tasksRes, collabRes, profilesRes] = await Promise.all([
        supabase.from('projects').select('*, artist:artists(*)').eq('id', id).single(),
        supabase.from('tracks').select('*').eq('project_id', id).order('created_at'),
        supabase.from('campaign_tasks').select('*').eq('project_id', id).order('order_index'),
        supabase.from('project_collaborators').select('*, profile:profiles(*)').eq('project_id', id),
        supabase.from('profiles').select('*').order('full_name')
      ]);

      if (projRes.error) throw projRes.error;
      setProject(projRes.data);
      setTracks(tracksRes.data || []);
      setCampaignTasks(tasksRes.data || []);
      setCollaborators(collabRes.data || []);
      setAllProfiles(profilesRes.data || []);
    } catch (err: any) {
      alert("Erreur lors de l'accès au projet : " + err.message);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ProjectStatus) => {
    try {
      const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setProject({ ...project, status: newStatus });
      alert("Pipeline mis à jour !");
    } catch (err: any) {
      alert("Erreur de synchronisation du statut.");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText) return;
    try {
      const { data, error } = await supabase.from('campaign_tasks').insert([{
        project_id: id,
        task_text: newTaskText,
        order_index: campaignTasks.length
      }]).select().single();
      if (error) throw error;
      setCampaignTasks([...campaignTasks, data]);
      setNewTaskText('');
    } catch (err: any) {
      alert("Erreur lors de l'ajout de la mission.");
    }
  };

  const handleToggleTask = async (taskId: string, current: boolean) => {
    try {
      const { error } = await supabase.from('campaign_tasks').update({ is_completed: !current }).eq('id', taskId);
      if (error) throw error;
      setCampaignTasks(campaignTasks.map(t => t.id === taskId ? { ...t, is_completed: !current } : t));
    } catch (err: any) {
      alert("Erreur de mise à jour.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if(!confirm("Voulez-vous supprimer cette tâche ?")) return;
    try {
      const { error } = await supabase.from('campaign_tasks').delete().eq('id', taskId);
      if (error) throw error;
      setCampaignTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollab.profile_id) return;
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.from('project_collaborators').insert([{
        project_id: id,
        profile_id: newCollab.profile_id,
        role: newCollab.role
      }]).select('*, profile:profiles(*)').single();
      if (error) throw error;
      setCollaborators([...collaborators, data]);
      setIsCollabModalOpen(false);
      alert("Collaborateur assigné !");
    } catch (err: any) {
      alert("Erreur lors de l'assignation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !project) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col gap-6">
        <Link to="/projects" className="flex items-center gap-2 text-white/30 hover:text-white transition-all w-fit group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Retour au Pipeline</span>
        </Link>

        <div className="glass p-8 lg:p-12 rounded-[48px] border-white/10 flex flex-col lg:flex-row gap-8 lg:gap-12 relative overflow-hidden shadow-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-48 h-48 lg:w-64 lg:h-64 rounded-[40px] overflow-hidden border border-white/10 shrink-0 shadow-2xl relative z-10"
          >
            <img src={project.cover_url || "https://picsum.photos/seed/project/400"} alt="Cover" className="w-full h-full object-cover" />
          </motion.div>
          <div className="flex-1 space-y-6 relative z-10">
            <div className="flex flex-col justify-between items-start gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3.5 py-1.5 rounded-xl bg-nexus-purple/20 text-nexus-purple text-[10px] font-black uppercase border border-nexus-purple/30 tracking-widest shadow-lg">{project.type}</span>
                  <div className="relative">
                    <select 
                      value={project.status} 
                      onChange={(e) => handleUpdateStatus(e.target.value as ProjectStatus)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-nexus-cyan outline-none focus:border-nexus-cyan transition-all appearance-none cursor-pointer tracking-widest uppercase shadow-xl pr-8"
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val} className="bg-nexus-surface">{label}</option>)}
                    </select>
                    <MoreVertical size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nexus-cyan pointer-events-none" />
                  </div>
                </div>
                <h2 className="text-4xl lg:text-6xl font-heading font-extrabold text-white tracking-tighter leading-tight">{project.title}</h2>
                <p className="text-nexus-lightGray text-xl font-medium mt-1">Par <Link to={`/artists/${project.artist_id}`} className="text-nexus-cyan hover:underline transition-all">{project.artist?.stage_name}</Link></p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
               <div className="bg-white/5 p-6 rounded-3xl border border-white/5 glass shadow-xl">
                 <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1.5">Trésorerie Restante</p>
                 <p className="text-3xl font-bold font-heading text-white">€{(project.budget - project.spent).toLocaleString()}</p>
               </div>
               <div className="bg-white/5 p-6 rounded-3xl border border-white/5 glass shadow-xl">
                 <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1.5">Date de sortie cible</p>
                 <p className="text-xl font-bold font-heading text-white">{project.release_date ? new Date(project.release_date).toLocaleDateString('fr-FR') : 'Non planifiée'}</p>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-2 p-1.5 glass rounded-[24px] w-fit shadow-2xl">
        {[
          { id: 'tracks', label: 'Morceaux', icon: <Music size={16} /> },
          { id: 'tasks', label: 'Tâches', icon: <ClipboardList size={16} /> },
          { id: 'collaboration', label: 'L\'Équipe', icon: <Users size={16} /> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-2 px-8 py-3.5 rounded-[18px] text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-nexus-purple text-white shadow-2xl scale-[1.05]' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'tracks' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-3xl font-heading font-extrabold text-white">Tracklist du projet</h3>
                <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:border-nexus-purple text-nexus-purple">
                  <Plus size={18} /> Ajouter une track
                </Button>
              </div>
              <div className="space-y-4">
                {tracks.map((track, i) => (
                  <Card key={track.id} className="p-6 flex items-center gap-8 group hover:border-nexus-purple/40 transition-all border-white/5 shadow-xl bg-white/[0.02]">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-mono text-base text-white/20 font-black border border-white/5 group-hover:text-nexus-purple transition-colors shrink-0">
                      {(i+1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xl truncate group-hover:text-nexus-cyan transition-colors">{track.title}</p>
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] font-black mt-1">{track.status.replace('_', ' ')}</p>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1 px-8 border-x border-white/5">
                        <span className="text-[10px] font-mono text-white/20 uppercase">BPM</span>
                        <span className="text-sm font-bold text-nexus-purple">{track.bpm || '--'}</span>
                    </div>
                    <button className="p-4 bg-nexus-purple/10 text-nexus-purple rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-2xl shadow-purple-500/10">
                      <Play size={24} fill="currentColor" />
                    </button>
                  </Card>
                ))}
                {tracks.length === 0 && (
                   <div className="py-24 text-center glass rounded-[48px] border-dashed border-white/10 opacity-30 flex flex-col items-center justify-center">
                     <FileAudio size={80} className="mb-6" />
                     <p className="text-xl font-heading font-bold italic">Aucun enregistrement détecté pour ce projet</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="px-2">
                <h3 className="text-3xl font-heading font-extrabold text-white mb-2">Tâches opérationnelles</h3>
                <p className="text-nexus-lightGray text-base">Planifiez les actions spécifiques de production et de marketing.</p>
              </div>
              
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Définir une nouvelle mission..." 
                  value={newTaskText} 
                  onChange={e => setNewTaskText(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()} 
                  className="flex-1 bg-white/5 border border-white/10 rounded-[20px] px-6 py-4 text-sm text-white focus:border-nexus-purple outline-none shadow-2xl transition-all" 
                />
                <Button variant="primary" onClick={handleAddTask} className="px-8 rounded-[20px] shadow-2xl">
                  <Plus size={24} />
                </Button>
              </div>

              <div className="space-y-3 pt-6">
                {campaignTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-5 p-6 glass rounded-[32px] hover:border-nexus-purple/30 transition-all group shadow-2xl bg-white/[0.01]">
                    <button 
                      onClick={() => handleToggleTask(task.id, task.is_completed)} 
                      className={`w-7 h-7 flex items-center justify-center rounded-xl border-2 transition-all ${task.is_completed ? 'bg-nexus-green border-nexus-green text-nexus-dark shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-white/10 text-transparent hover:border-nexus-cyan hover:text-nexus-cyan/40'}`}
                    >
                      <Check size={18} strokeWidth={4} />
                    </button>
                    <span className={`flex-1 text-lg font-medium transition-all ${task.is_completed ? 'line-through text-white/10' : 'text-white/80'}`}>
                      {task.task_text}
                    </span>
                    <button 
                      onClick={() => handleDeleteTask(task.id)} 
                      className="p-2.5 text-white/5 hover:text-nexus-red transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                {campaignTasks.length === 0 && (
                  <div className="text-center py-24 opacity-20 italic flex flex-col items-center gap-6">
                    <CheckSquare size={64} />
                    <p className="text-xl">Le plan d'action est vide. Démarrez la production !</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'collaboration' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-3xl font-heading font-extrabold text-white">L'Équipe dédiée</h3>
                <Button variant="primary" size="sm" onClick={() => setIsCollabModalOpen(true)} className="gap-2 shadow-2xl px-8">
                  <Plus size={18} /> Assigner un expert
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {collaborators.map(c => (
                  <Card key={c.id} className="text-center p-10 border-white/5 hover:border-nexus-cyan/30 transition-all group relative overflow-hidden shadow-2xl">
                    <div className="w-24 h-24 rounded-[32px] overflow-hidden mx-auto mb-6 border-2 border-white/10 group-hover:border-nexus-cyan/40 transition-all shadow-2xl bg-nexus-surface">
                      <img src={c.profile?.avatar_url || `https://picsum.photos/seed/${c.profile_id}/200`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <p className="font-heading font-extrabold text-white truncate text-xl leading-none">{c.profile?.full_name}</p>
                    <p className="text-[10px] text-nexus-cyan font-mono uppercase mt-2.5 tracking-[0.2em] font-black">{c.role || 'Expert Nexus'}</p>
                    
                    <button 
                      onClick={async () => { 
                        if(!confirm("Retirer ce collaborateur du projet ?")) return;
                        await supabase.from('project_collaborators').delete().eq('id', c.id); 
                        setCollaborators(collaborators.filter(col => col.id !== c.id)); 
                      }} 
                      className="mt-8 text-[9px] text-nexus-red hover:underline uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Désassigner
                    </button>
                  </Card>
                ))}
                {collaborators.length === 0 && (
                   <div className="col-span-full py-24 text-center glass rounded-[48px] border-dashed border-white/10 opacity-30 italic">
                     Aucune expertise assignée pour le moment.
                   </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Collaboration Modal */}
      <Modal isOpen={isCollabModalOpen} onClose={() => setIsCollabModalOpen(false)} title="Assignation d'Expertise">
        <form onSubmit={handleAddCollaborator} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Expert du Staff *</label>
            <select 
              required 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white outline-none focus:border-nexus-purple transition-all appearance-none shadow-xl" 
              value={newCollab.profile_id} 
              onChange={e => setNewCollab({...newCollab, profile_id: e.target.value})}
            >
              <option value="" className="bg-nexus-surface">Parcourir l'annuaire...</option>
              {allProfiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Définition du rôle sur {project.title}</label>
            <input 
              type="text" 
              placeholder="ex: Lead Audio, Visual Director, PR Strategist..." 
              value={newCollab.role} 
              onChange={e => setNewCollab({...newCollab, role: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white outline-none focus:border-nexus-purple transition-all shadow-2xl" 
            />
          </div>
          <div className="flex gap-4 pt-8">
            <Button type="button" variant="ghost" className="flex-1 h-14" onClick={() => setIsCollabModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1 h-14 font-black uppercase tracking-widest text-xs" isLoading={isSubmitting}>Confirmer l'Assignation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
