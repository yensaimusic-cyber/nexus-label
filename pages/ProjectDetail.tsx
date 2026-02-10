
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Disc, Users, Settings, 
  Play, Plus, Clock, DollarSign, 
  Trash2, Camera, Loader2, Save, FileAudio, Check, X, ClipboardList, Edit3, AlertTriangle, User, Calendar, Mail, Phone, ExternalLink, Music, Hash, Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Project, Track, Task, ProjectStatus, ProjectType, STATUS_LABELS, ProjectTeamMember, MemberType, TrackStatus, TRACK_STATUS_LABELS, TaskStatus, TaskPriority } from '../types';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allArtists, setAllArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'tasks' | 'collaboration'>('tracks');
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isTrackDeleteModalOpen, setIsTrackDeleteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms State
  const [editingTrack, setEditingTrack] = useState<Partial<Track> | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  
  const [addTeamType, setAddTeamType] = useState<MemberType>('internal');
  const [newTeamMember, setNewTeamMember] = useState({
    member_id: '', role_on_project: '', external_name: '', external_email: '', external_phone: '', external_notes: ''
  });

  const [editData, setEditData] = useState<Partial<Project>>({});
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projRes, tracksRes, tasksRes, teamRes, profilesRes, artistsRes] = await Promise.all([
        supabase.from('projects').select('*, artist:artists(*)').eq('id', id).single(),
        supabase.from('tracks').select('*').eq('project_id', id).order('created_at'),
        supabase.from('tasks').select('*, assignee:profiles(full_name, avatar_url)').eq('project_id', id).order('due_date'),
        supabase.from('project_team').select('*, profile:profiles(full_name, avatar_url, role)').eq('project_id', id),
        supabase.from('profiles').select('id, full_name, role').order('full_name'),
        supabase.from('artists').select('id, stage_name').order('stage_name')
      ]);

      if (projRes.error) throw projRes.error;
      setProject(projRes.data);
      setEditData(projRes.data);
      setTracks(tracksRes.data || []);
      setProjectTasks(tasksRes.data || []);
      setTeamMembers(teamRes.data || []);
      setProfiles(profilesRes.data || []);
      setAllArtists(artistsRes.data || []);
    } catch (err: any) {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let updates = { ...editData };
      if (newCoverFile) {
        updates.cover_url = await uploadFile(newCoverFile, 'covers', 'project-covers');
      }
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select('*, artist:artists(*)').single();
      if (error) throw error;
      setProject(data);
      setIsEditModalOpen(false);
      alert("Projet mis à jour !");
    } catch (err) { alert("Erreur mise à jour."); } finally { setIsSubmitting(false); }
  };

  const handleDeleteProject = async () => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      navigate('/projects');
    } catch (err) { alert("Suppression impossible."); } finally { setIsSubmitting(false); }
  };

  // --- TRACKS MANAGEMENT ---
  const handleOpenTrackModal = (track?: Track) => {
    setEditingTrack(track || { title: '', status: 'demo', project_id: id });
    setIsTrackModalOpen(true);
  };

  const handleCreateOrUpdateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack?.title) return;
    try {
      setIsSubmitting(true);
      if (editingTrack.id) {
        const { data, error } = await supabase.from('tracks').update(editingTrack).eq('id', editingTrack.id).select().single();
        if (error) throw error;
        setTracks(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const { data, error } = await supabase.from('tracks').insert([editingTrack]).select().single();
        if (error) throw error;
        setTracks([...tracks, data]);
      }
      setIsTrackModalOpen(false);
      setEditingTrack(null);
    } catch (err: any) { alert("Erreur track : " + err.message); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTrack = async () => {
    if (!editingTrack?.id) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('tracks').delete().eq('id', editingTrack.id);
      if (error) throw error;
      setTracks(prev => prev.filter(t => t.id !== editingTrack.id));
      setIsTrackDeleteModalOpen(false);
      setIsTrackModalOpen(false);
      setEditingTrack(null);
    } catch (err) { alert("Suppression impossible."); } finally { setIsSubmitting(false); }
  };

  // --- TASKS MANAGEMENT ---
  const handleOpenTaskModal = (task?: Task) => {
    setEditingTask(task || { title: '', status: 'todo', priority: 'medium', project_id: id });
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.title) return;
    try {
      setIsSubmitting(true);
      const cleanPayload = { ...editingTask };
      delete (cleanPayload as any).assignee;
      delete (cleanPayload as any).project;

      if (editingTask.id) {
        const { data, error } = await supabase.from('tasks').update(cleanPayload).eq('id', editingTask.id).select('*, assignee:profiles(full_name, avatar_url)').single();
        if (error) throw error;
        setProjectTasks(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const { data, error } = await supabase.from('tasks').insert([cleanPayload]).select('*, assignee:profiles(full_name, avatar_url)').single();
        if (error) throw error;
        setProjectTasks([...projectTasks, data]);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err: any) { alert("Erreur tâche."); } finally { setIsSubmitting(false); }
  };

  const formatDuration = (s?: number) => {
    if (!s) return '--:--';
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  const getTrackStatusColor = (s: TrackStatus) => {
    if (s === 'demo' || s === 'recording') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    if (s.includes('mix')) return 'bg-nexus-orange/10 text-nexus-orange border-nexus-orange/20';
    if (s.includes('master')) return 'bg-nexus-purple/10 text-nexus-purple border-nexus-purple/20';
    if (s === 'distributed') return 'bg-nexus-green/10 text-nexus-green border-nexus-green/20';
    return 'bg-white/5 text-white/40';
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'text-nexus-red border-nexus-red/30 bg-nexus-red/5';
      case 'high': return 'text-nexus-orange border-nexus-orange/30 bg-nexus-orange/5';
      case 'medium': return 'text-nexus-cyan border-nexus-cyan/30 bg-nexus-cyan/5';
      default: return 'text-white/40 border-white/10 bg-white/5';
    }
  };

  if (loading || !project) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link to="/projects" className="flex items-center gap-2 text-white/30 hover:text-white transition-all w-fit group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Pipeline Central</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="gap-2 border border-white/10 hover:bg-white/5">
              <Edit3 size={16} /> <span className="hidden sm:inline">Modifier</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(true)} className="gap-2 text-nexus-red hover:bg-nexus-red/10 border border-nexus-red/10">
              <Trash2 size={16} /> <span className="hidden sm:inline">Supprimer</span>
            </Button>
          </div>
        </div>

        <div className="glass p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border-white/10 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden shadow-2xl">
          <div className="w-40 h-40 lg:w-56 lg:h-56 rounded-[32px] lg:rounded-[40px] overflow-hidden border border-white/10 shrink-0 shadow-2xl relative z-10">
            <img src={project.cover_url || "https://picsum.photos/seed/project/400"} alt="Cover" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left relative z-10 w-full">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 rounded-lg bg-nexus-purple/20 text-nexus-purple text-[9px] font-black uppercase border border-nexus-purple/30 tracking-widest">{project.type}</span>
                <span className="px-3 py-1 rounded-lg bg-nexus-cyan/10 text-nexus-cyan text-[9px] font-black uppercase border border-nexus-cyan/30 tracking-widest">
                  {STATUS_LABELS[project.status as ProjectStatus] || project.status}
                </span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-heading font-extrabold text-white tracking-tighter leading-tight">{project.title}</h2>
              <p className="text-nexus-lightGray text-lg font-medium">Par <Link to={`/artists/${project.artist_id}`} className="text-nexus-cyan hover:underline">{project.artist?.stage_name}</Link></p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
                 <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">Budget Restant</p>
                 <p className="text-xl font-bold font-heading text-white">€{(project.budget - project.spent).toLocaleString()}</p>
               </div>
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
                 <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">Cible</p>
                 <p className="text-base font-bold font-heading text-white">{project.release_date || 'Non fixée'}</p>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 glass rounded-2xl w-full sm:w-fit shadow-2xl">
        {[
          { id: 'tracks', label: 'Morceaux', icon: <Disc size={16} /> },
          { id: 'tasks', label: 'Opérations', icon: <ClipboardList size={16} /> },
          { id: 'collaboration', label: 'Management', icon: <Users size={16} /> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
              activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {activeTab === 'tracks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Tracklist <span className="text-nexus-purple opacity-40 ml-2 font-mono">[{tracks.length}]</span></h3>
                <Button variant="outline" size="sm" onClick={() => handleOpenTrackModal()} className="gap-2 border-white/10 hover:border-nexus-purple">
                  <Plus size={16} /> Ajouter une track
                </Button>
              </div>
              <div className="space-y-3">
                {tracks.map((track, i) => (
                  <Card key={track.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 group hover:border-nexus-purple/40 cursor-pointer" onClick={() => handleOpenTrackModal(track)}>
                    <div className="flex items-center gap-5 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-mono text-sm text-white/20 font-black border border-white/5 group-hover:text-nexus-purple transition-colors">
                        {(i+1).toString().padStart(2, '0')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-base truncate">{track.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-widest ${getTrackStatusColor(track.status)}`}>
                            {TRACK_STATUS_LABELS[track.status] || track.status}
                          </span>
                          <span className="text-[9px] font-mono text-white/20">{formatDuration(track.duration)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pl-14 md:pl-0">
                        {track.bpm && (
                          <div className="flex flex-col items-center px-3 border-l border-white/5">
                            <span className="text-[7px] font-mono text-white/30 uppercase">BPM</span>
                            <span className="text-xs font-bold text-nexus-purple">{track.bpm}</span>
                          </div>
                        )}
                        {track.key && (
                          <div className="flex flex-col items-center px-3 border-l border-white/5">
                            <span className="text-[7px] font-mono text-white/30 uppercase">KEY</span>
                            <span className="text-xs font-bold text-nexus-cyan">{track.key}</span>
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="p-2 opacity-0 group-hover:opacity-100"><Edit3 size={16} /></Button>
                    </div>
                  </Card>
                ))}
                {tracks.length === 0 && (
                   <div className="py-20 text-center glass rounded-[32px] border-dashed border-white/10 opacity-30 flex flex-col items-center">
                     <FileAudio size={48} className="mb-4" />
                     <p className="text-sm font-bold italic">Le catalogue est encore vide.</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Opérations</h3>
                <Button variant="outline" size="sm" onClick={() => handleOpenTaskModal()} className="gap-2 border-white/10 text-nexus-cyan hover:border-nexus-cyan">
                  <Plus size={16} /> Créer une tâche
                </Button>
              </div>
              <div className="space-y-3">
                {projectTasks.map(task => (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 glass rounded-2xl hover:border-nexus-purple/30 transition-all group cursor-pointer" onClick={() => handleOpenTaskModal(task)}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-10 rounded-full shrink-0 ${task.status === 'done' ? 'bg-nexus-green' : 'bg-white/10'}`} />
                      <div className="min-w-0">
                        <p className={`font-bold text-base ${task.status === 'done' ? 'line-through text-white/20' : 'text-white'}`}>{task.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                           <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                           <span className="text-[9px] font-mono text-white/20 flex items-center gap-1"><Calendar size={10} /> {task.due_date || 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10">
                          <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.id}/50`} className="w-full h-full object-cover opacity-60" />
                        </div>
                        <span className="text-[10px] text-white/30 font-bold">{task.assignee?.full_name?.split(' ')[0]}</span>
                      </div>
                      <Edit3 size={16} className="text-white/10 group-hover:text-nexus-purple transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Collaboration tab identical to previous turn ... */}
        </motion.div>
      </AnimatePresence>

      {/* TRACK MODAL */}
      <Modal isOpen={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)} title={editingTrack?.id ? "Studio Piste" : "Nouvel Enregistrement"}>
        <form onSubmit={handleCreateOrUpdateTrack} className="space-y-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Titre du morceau *</label>
            <input required type="text" value={editingTrack?.title || ''} onChange={e => setEditingTrack({...editingTrack!, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="ex: Intro (The Nexus)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">BPM</label>
                <input type="number" value={editingTrack?.bpm || ''} onChange={e => setEditingTrack({...editingTrack!, bpm: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="128" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Key</label>
                <input type="text" value={editingTrack?.key || ''} onChange={e => setEditingTrack({...editingTrack!, key: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="Am, C# Maj..." />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Durée (Secondes)</label>
                <input type="number" value={editingTrack?.duration || ''} onChange={e => setEditingTrack({...editingTrack!, duration: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="180" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Production Status</label>
                <select value={editingTrack?.status || 'demo'} onChange={e => setEditingTrack({...editingTrack!, status: e.target.value as TrackStatus})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white">
                  {Object.entries(TRACK_STATUS_LABELS).map(([val, lbl]) => <option key={val} value={val} className="bg-nexus-surface">{lbl}</option>)}
                </select>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Paroles (Lyrics)</label>
            <textarea rows={4} value={editingTrack?.lyrics || ''} onChange={e => setEditingTrack({...editingTrack!, lyrics: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white resize-none" placeholder="Verse 1..." />
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/5">
             {editingTrack?.id && <Button type="button" variant="danger" onClick={() => setIsTrackDeleteModalOpen(true)}><Trash2 size={20} /></Button>}
             <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsTrackModalOpen(false)}>Annuler</Button>
             <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* TASK MODAL (Simplified for Project Context) */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask?.id ? "Mise à jour Tâche" : "Nouvelle Opération"}>
        <form onSubmit={handleUpdateTask} className="space-y-5">
           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Titre *</label>
             <input required type="text" value={editingTask?.title || ''} onChange={e => setEditingTask({...editingTask!, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Assigné à</label>
                <select required value={editingTask?.assigned_to || ''} onChange={e => setEditingTask({...editingTask!, assigned_to: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white">
                  <option value="" className="bg-nexus-surface">Choisir...</option>
                  {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Priorité</label>
                <select value={editingTask?.priority || 'medium'} onChange={e => setEditingTask({...editingTask!, priority: e.target.value as TaskPriority})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white">
                  <option value="low">Basse</option><option value="medium">Medium</option><option value="high">Haute</option><option value="urgent">Urgent</option>
                </select>
              </div>
           </div>
           <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsTaskModalOpen(false)}>Annuler</Button>
              <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Confirmer</Button>
           </div>
        </form>
      </Modal>

      {/* DELETE MODALS ... */}
      <Modal isOpen={isTrackDeleteModalOpen} onClose={() => setIsTrackDeleteModalOpen(false)} title="Confirmer Suppression Track">
         <div className="space-y-6 text-center py-4">
            <AlertTriangle size={32} className="mx-auto text-nexus-red" />
            <p className="text-white text-sm">Supprimer définitivement cette piste ?</p>
            <div className="flex gap-3 pt-4">
               <Button variant="ghost" className="flex-1" onClick={() => setIsTrackDeleteModalOpen(false)}>Annuler</Button>
               <Button variant="danger" className="flex-1" onClick={handleDeleteTrack} isLoading={isSubmitting}>Supprimer</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Suppression Projet">
        <div className="space-y-6 text-center py-4">
          <AlertTriangle size={32} className="mx-auto text-nexus-red" />
          <p className="text-sm text-white/40">Cette action supprimera tout l'historique de production associé.</p>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteProject} isLoading={isSubmitting}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
