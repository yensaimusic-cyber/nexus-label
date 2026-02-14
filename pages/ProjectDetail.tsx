
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Disc, Users, Settings, 
  Plus, DollarSign, 
  Trash2, Camera, Loader2, Save, FileAudio, Check, X, ClipboardList, Edit3, AlertTriangle, Mail, Phone, ExternalLink, Hash, Layers, UserPlus, Calendar
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ProjectBudget } from '../components/ProjectBudget';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Project, Track, Task, ProjectStatus, ProjectType, STATUS_LABELS, ProjectTeamMember, MemberType, TrackStatus, TRACK_STATUS_LABELS, TaskPriority, TaskStatus } from '../types';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allArtists, setAllArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'tasks' | 'collaboration' | 'meetings' | 'budget'>('tracks');
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
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
      const [projRes, tracksRes, tasksRes, teamRes, meetingsRes, profilesRes, artistsRes] = await Promise.all([
        supabase.from('projects').select('*, artist:artists(*)').eq('id', id).single(),
        supabase.from('tracks').select('*').eq('project_id', id).order('created_at'),
        supabase.from('tasks').select('*, assignee:profiles(full_name, avatar_url)').eq('project_id', id).order('due_date'),
        supabase.from('project_team').select('*, profile:profiles(full_name, avatar_url, role)').eq('project_id', id),
        supabase.from('meetings').select('*').eq('project_id', id).order('date', { ascending: false }),
        supabase.from('profiles').select('id, full_name, role').order('full_name'),
        supabase.from('artists').select('id, stage_name').order('stage_name')
      ]);

      if (projRes.error) throw projRes.error;
      setProject(projRes.data);
      setEditData(projRes.data);
      setTracks(tracksRes.data || []);
      setProjectTasks(tasksRes.data || []);
      setTeamMembers(teamRes.data || []);
      setMeetings(meetingsRes.data || []);
      setProfiles(profilesRes.data || []);
      setAllArtists(artistsRes.data || []);
    } catch (err: any) {
      console.error(err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let updates: any = { ...editData };
      if (newCoverFile) {
        updates.cover_url = await uploadFile(newCoverFile, 'covers', 'project-covers');
      }
      
      // FIX 400 ERROR: Only keep fields that exist in table "projects"
      const persistentFields = ['artist_id', 'title', 'type', 'release_date', 'status', 'budget', 'spent', 'cover_url'];
      const cleanUpdates: any = {};
      persistentFields.forEach(f => {
        if (updates[f] !== undefined) cleanUpdates[f] = updates[f];
      });

      const { data, error } = await supabase
        .from('projects')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*, artist:artists(*)')
        .single();
        
      if (error) throw error;
      setProject(data);
      setIsEditModalOpen(false);
      alert("Projet mis à jour avec succès !");
    } catch (err: any) { 
      alert("Erreur lors de la mise à jour : " + err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDeleteProject = async () => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      navigate('/projects');
    } catch (err) { 
      alert("Impossible de supprimer le projet."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload: any = {
        project_id: id,
        member_type: addTeamType,
        role_on_project: newTeamMember.role_on_project
      };

      if (addTeamType === 'internal') {
        if (!newTeamMember.member_id) return alert("Veuillez sélectionner un agent.");
        payload.member_id = newTeamMember.member_id;
      } else {
        if (!newTeamMember.external_name) return alert("Le nom est obligatoire pour un externe.");
        payload.external_name = newTeamMember.external_name;
        payload.external_email = newTeamMember.external_email;
        payload.external_phone = newTeamMember.external_phone;
        payload.external_notes = newTeamMember.external_notes;
      }

      const { data, error } = await supabase
        .from('project_team')
        .insert([payload])
        .select('*, profile:profiles(full_name, avatar_url, role)')
        .single();

      if (error) throw error;
      setTeamMembers(prev => [...prev, data]);
      setIsAddTeamModalOpen(false);
      setNewTeamMember({
        member_id: '', role_on_project: '', external_name: '', external_email: '', external_phone: '', external_notes: ''
      });
    } catch (err: any) {
      alert("Erreur lors de l'ajout : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!confirm("Retirer ce membre du projet ?")) return;
    try {
      const { error } = await supabase.from('project_team').delete().eq('id', memberId);
      if (error) throw error;
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

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
        setTracks(prev => [...prev, data]);
      }
      setIsTrackModalOpen(false);
      setEditingTrack(null);
    } catch (err: any) { alert("Erreur track : " + err.message); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTrack = async () => {
    if (!editingTrack?.id || !confirm("Supprimer cette track ?")) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('tracks').delete().eq('id', editingTrack.id);
      if (error) throw error;
      setTracks(prev => prev.filter(t => t.id !== editingTrack.id));
      setIsTrackModalOpen(false);
      setEditingTrack(null);
    } catch (err) { alert("Suppression impossible."); } finally { setIsSubmitting(false); }
  };

  const handleOpenTaskModal = (task?: Task) => {
    setEditingTask(task || { title: '', status: 'todo', priority: 'medium', project_id: id });
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.title) return;
    try {
      setIsSubmitting(true);
      const cleanPayload: any = { 
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
        assigned_to: editingTask.assigned_to,
        project_id: editingTask.project_id
      };

      if (editingTask.id) {
        const { data, error } = await supabase.from('tasks').update(cleanPayload).eq('id', editingTask.id).select('*, assignee:profiles(full_name, avatar_url)').single();
        if (error) throw error;
        setProjectTasks(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        const { data, error } = await supabase.from('tasks').insert([cleanPayload]).select('*, assignee:profiles(full_name, avatar_url)').single();
        if (error) throw error;
        setProjectTasks(prev => [...prev, data]);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err: any) { alert("Erreur tâche : " + err.message); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTask = async () => {
    if (!editingTask?.id || !confirm("Effacer cette mission ?")) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('tasks').delete().eq('id', editingTask.id);
      if (error) throw error;
      setProjectTasks(prev => prev.filter(t => t.id !== editingTask.id));
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) { alert("Suppression impossible."); } finally { setIsSubmitting(false); }
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1000px] mx-auto min-h-screen">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link to="/projects" className="flex items-center gap-2 text-white/30 hover:text-white transition-all w-fit group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Archives Pipeline</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="gap-2 border border-white/10 hover:bg-white/5 rounded-full">
              <Edit3 size={16} /> <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Modifier Opération</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(true)} className="gap-2 text-nexus-red hover:bg-nexus-red/10 border border-nexus-red/10 rounded-full">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="glass p-3 sm:p-4 md:p-6 lg:p-10 rounded-2xl border-white/10 flex flex-col md:flex-row gap-3 items-center md:items-start relative overflow-hidden shadow-sm sm:shadow-2xl">
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 lg:w-60 lg:h-60 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl relative z-10 nexus-glow">
            <img src={project.cover_url || 'https://picsum.photos/seed/project/400'} alt="Cover" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left relative z-10 w-full">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-2 py-1 rounded-full bg-nexus-purple/20 text-nexus-purple text-[9px] font-black uppercase border border-nexus-purple/30 tracking-[0.2em]">{project.type}</span>
                <span className="px-2 py-1 rounded-full bg-nexus-cyan/10 text-nexus-cyan text-[9px] font-black uppercase border border-nexus-cyan/30 tracking-[0.2em]">
                  {STATUS_LABELS[project.status as ProjectStatus] || project.status}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl md:text-4xl lg:text-6xl font-heading font-extrabold text-white tracking-tighter leading-none">{project.title}</h2>
              <p className="text-nexus-lightGray text-base font-medium">Par <Link to={`/artists/${project.artist_id}`} className="text-nexus-cyan hover:underline">{project.artist?.stage_name}</Link></p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
               <div className="bg-white/5 p-3 rounded-xl border border-white/5 shadow-xl backdrop-blur-md">
                 <p className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em] mb-1 font-black">Consommé / Budget</p>
                 <p className="text-base font-bold font-heading text-white">€{Number(project.spent).toLocaleString()} / €{Number(project.budget).toLocaleString()}</p>
               </div>
               <div className="bg-white/5 p-3 rounded-xl border border-white/5 shadow-xl backdrop-blur-md">
                 <p className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em] mb-1 font-black">Timeline Sortie</p>
                 <p className="text-sm font-bold font-heading text-white">{project.release_date ? new Date(project.release_date).toLocaleDateString() : 'Non fixée'}</p>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap sm:flex-nowrap overflow-x-auto no-scrollbar gap-2 p-1 glass rounded-[20px] w-full lg:w-fit shadow-sm sm:shadow-2xl">
        {[
          { id: 'tracks', label: 'Discographie', icon: <Disc size={16} /> },
          { id: 'tasks', label: 'Opérations', icon: <ClipboardList size={16} /> },
          { id: 'collaboration', label: 'Équipe Hub', icon: <Users size={16} /> },
          { id: 'meetings', label: 'Sessions / Meetings', icon: <Calendar size={16} /> },
          { id: 'budget', label: 'Budget', icon: <DollarSign size={16} /> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 w-full sm:w-auto justify-center ${
              activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl nexus-glow' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-20">
          {activeTab === 'tracks' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Tracklist <span className="text-nexus-purple opacity-40 ml-2 font-mono">[{tracks.length}]</span></h3>
                <Button variant="outline" size="sm" onClick={() => handleOpenTrackModal()} className="gap-2 border-white/10 hover:bg-nexus-purple/10 rounded-xl">
                  <Plus size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Enregistrer une track</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {tracks.map((track, i) => (
                  <Card key={track.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-6 group hover:border-nexus-purple/40 cursor-pointer shadow-xl border-white/5" onClick={() => handleOpenTrackModal(track)}>
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-mono text-sm text-white/20 font-black border border-white/5 group-hover:text-nexus-purple transition-all group-hover:scale-105">
                        {(i+1).toString().padStart(2, '0')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-lg text-white truncate">{track.title}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${getTrackStatusColor(track.status)}`}>
                            {TRACK_STATUS_LABELS[track.status] || track.status}
                          </span>
                          {track.bpm && <span className="text-[10px] font-mono text-white/30 uppercase">{track.bpm} BPM</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                       <Button variant="ghost" size="sm" className="text-white/40 hover:text-nexus-purple"><Edit3 size={18} /></Button>
                    </div>
                  </Card>
                ))}
                {tracks.length === 0 && <div className="py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-20 italic">Aucune piste enregistrée.</div>}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Opérations Tactiques</h3>
                <Button variant="outline" size="sm" onClick={() => handleOpenTaskModal()} className="gap-2 border-white/10 text-nexus-cyan hover:bg-nexus-cyan/10 rounded-xl">
                  <Plus size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Lancer une mission</span>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectTasks.map(task => (
                  <Card key={task.id} className="p-4 md:p-6 glass rounded-3xl hover:border-nexus-purple/40 transition-all group cursor-pointer border-white/5 shadow-xl flex flex-col justify-between" onClick={() => handleOpenTaskModal(task)}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest inline-block ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        {task.status === 'done' && <div className="p-1 rounded-full bg-nexus-green/20 text-nexus-green border border-nexus-green/20"><Check size={14} /></div>}
                      </div>
                      <p className={`font-heading font-bold text-lg leading-tight ${task.status === 'done' ? 'line-through text-white/20' : 'text-white'}`}>{task.title}</p>
                      {task.due_date && <p className="text-[10px] font-mono text-white/30 uppercase mt-4 flex items-center gap-2"><Calendar size={12} /> {new Date(task.due_date).toLocaleDateString()}</p>}
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                           <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.id}/50`} className="w-full h-full object-cover" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{task.assignee?.full_name || 'Non assigné'}</p>
                       </div>
                    </div>
                  </Card>
                ))}
                {projectTasks.length === 0 && <div className="col-span-full py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-20 italic">Aucune mission en cours.</div>}
              </div>
            </div>
          )}

          {activeTab === 'collaboration' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Corps d'Élite / Hub Projet</h3>
                <Button variant="outline" size="sm" onClick={() => setIsAddTeamModalOpen(true)} className="gap-2 border-white/10 text-nexus-purple hover:bg-nexus-purple/10 rounded-xl">
                  <UserPlus size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Mobiliser un agent</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {teamMembers.map(member => (
                  <Card key={member.id} className="p-4 md:p-8 border-white/5 hover:border-nexus-purple/30 group relative shadow-2xl">
                    <button onClick={() => handleRemoveTeamMember(member.id)} className="absolute top-6 right-6 p-2 text-white/10 hover:text-nexus-red transition-all opacity-0 group-hover:opacity-100"><X size={18} /></button>
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl">
                        <img src={member.member_type === 'internal' ? (member.profile?.avatar_url || `https://picsum.photos/seed/${member.member_id}/100`) : `https://ui-avatars.com/api/?name=${member.external_name}&background=8B5CF6&color=fff`} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-heading font-extrabold text-xl text-white truncate">{member.member_type === 'internal' ? member.profile?.full_name : member.external_name}</h4>
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border mt-1.5 inline-block ${member.member_type === 'internal' ? 'bg-nexus-purple/10 text-nexus-purple border-nexus-purple/20' : 'bg-nexus-cyan/10 text-nexus-cyan border-nexus-cyan/20'}`}>
                          {member.member_type === 'internal' ? 'Agent Nexus' : 'Consultant Externe'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <p className="text-[10px] font-mono uppercase text-white/30 tracking-[0.3em] font-black">Mission</p>
                      <p className="text-sm font-bold text-white bg-black/40 p-4 rounded-2xl border border-white/5">{member.role_on_project}</p>
                    </div>
                  </Card>
                ))}
                {teamMembers.length === 0 && <div className="col-span-full py-24 text-center glass rounded-[48px] border-dashed border-white/10 opacity-20 italic">Aucun agent assigné à l'opération.</div>}
              </div>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-heading font-extrabold text-white">Logs de Sessions & Stratégie</h3>
              <div className="space-y-6">
                {meetings.map(meeting => (
                  <Card key={meeting.id} className="p-6 md:p-8 border-white/5 hover:border-nexus-purple/40 shadow-2xl group transition-all">
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black font-mono text-nexus-purple uppercase tracking-[0.3em] bg-nexus-purple/10 px-4 py-1 rounded-full border border-nexus-purple/20">{meeting.date}</span>
                          </div>
                          <h4 className="text-2xl font-heading font-extrabold text-white group-hover:text-nexus-cyan transition-colors">{meeting.title}</h4>
                          <p className="text-sm text-white/50 leading-relaxed max-w-4xl line-clamp-3 italic">"{meeting.summary}"</p>
                       </div>
                       <Link to="/meetings" className="shrink-0">
                         <Button variant="ghost" size="sm" className="rounded-2xl border border-white/5 text-nexus-cyan hover:bg-nexus-cyan/10">Archive Complète <ExternalLink size={16} className="ml-2" /></Button>
                       </Link>
                    </div>
                  </Card>
                ))}
                {meetings.length === 0 && <div className="py-24 text-center glass rounded-[48px] border-dashed border-white/10 opacity-20 italic">Aucun log de session archivé pour ce projet.</div>}
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <ProjectBudget projectId={project.id} totalBudget={project.budget || 0} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODALS: Operational Updates */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier les Paramètres d'Opération">
        <form onSubmit={handleUpdateProject} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
           <div className="space-y-3">
             <label className="text-[10px] font-mono uppercase text-white/30 tracking-[0.3em] font-black">Visuel de Production</label>
             <div className="relative h-40 rounded-[32px] overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer shadow-inner">
               {newCoverFile ? (
                 <img src={URL.createObjectURL(newCoverFile)} className="w-full h-full object-cover" />
               ) : project.cover_url ? (
                 <img src={project.cover_url} className="w-full h-full object-cover" />
               ) : (
                 <Camera className="text-white/20 group-hover:text-nexus-purple transition-all" size={32} />
               )}
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewCoverFile(e.target.files?.[0] || null)} />
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Titre Officiel *</label>
             <input required type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-nexus-purple outline-none shadow-xl" />
           </div>

           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Format</label>
               <select value={editData.type} onChange={e => setEditData({...editData, type: e.target.value as ProjectType})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none appearance-none">
                 <option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option><option value="mixtape">Mixtape</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Phase Actuelle</label>
               <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value as ProjectStatus})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none appearance-none">
                 {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
               </select>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Date de Sortie (Target)</label>
             <input type="date" value={editData.release_date || ''} onChange={e => setEditData({...editData, release_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none [color-scheme:dark]" />
           </div>

           <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Budget Total (€)</label>
               <input type="number" value={editData.budget} onChange={e => setEditData({...editData, budget: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Dépenses Réelles (€)</label>
               <input type="number" value={editData.spent} onChange={e => setEditData({...editData, spent: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl" />
             </div>
           </div>

           <div className="flex gap-4 pt-8 border-t border-white/5">
             <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
             <Button type="submit" variant="primary" className="flex-1 h-14 rounded-2xl uppercase font-black tracking-widest text-[10px]" isLoading={isSubmitting}>Enregistrer les modifs</Button>
           </div>
        </form>
      </Modal>

      {/* MODAL: Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="⚠️ ARCHIVAGE DÉFINITIF">
        <div className="space-y-8 text-center py-6">
          <AlertTriangle size={64} className="mx-auto text-nexus-red nexus-glow rounded-full p-2 bg-nexus-red/10" />
          <div className="space-y-3">
             <p className="text-white text-2xl font-heading font-extrabold">Confirmer la suppression irréversible du projet ?</p>
             <p className="text-white/40 text-sm italic leading-relaxed">Toutes les tracks, tâches et historiques de sessions liés à "{project.title}" seront effacés définitivement.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="danger" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={handleDeleteProject} isLoading={isSubmitting}>Supprimer des serveurs</Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Track Management */}
      <Modal isOpen={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)} title={editingTrack?.id ? "Studio: Piste Audio" : "Nouvel Enregistrement"}>
         <form onSubmit={handleCreateOrUpdateTrack} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Titre de la track *</label>
              <input required type="text" value={editingTrack?.title || ''} onChange={e => setEditingTrack({...editingTrack!, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-nexus-purple" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">BPM</label>
                 <input type="number" value={editingTrack?.bpm || ''} onChange={e => setEditingTrack({...editingTrack!, bpm: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Statut Production</label>
                 <select value={editingTrack?.status || 'demo'} onChange={e => setEditingTrack({...editingTrack!, status: e.target.value as TrackStatus})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none">
                    {Object.entries(TRACK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                 </select>
               </div>
            </div>
            <div className="flex gap-3 pt-4">
              {editingTrack?.id && <Button type="button" variant="ghost" className="text-nexus-red hover:bg-nexus-red/10 border-nexus-red/10 h-14 rounded-2xl flex-1" onClick={handleDeleteTrack}>Supprimer</Button>}
              <Button type="submit" variant="primary" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" isLoading={isSubmitting}>Confirmer</Button>
            </div>
         </form>
      </Modal>

      {/* MODAL: Task Management */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask?.id ? "Mise à jour de Mission" : "Assigner Nouvelle Mission"}>
        <form onSubmit={handleUpdateTask} className="space-y-5">
           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Intitulé Mission *</label>
             <input required type="text" value={editingTask?.title || ''} onChange={e => setEditingTask({...editingTask!, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-nexus-cyan outline-none" />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Priorité</label>
               <select value={editingTask?.priority || 'medium'} onChange={e => setEditingTask({...editingTask!, priority: e.target.value as TaskPriority})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none appearance-none">
                 <option value="low">Basse</option><option value="medium">Medium</option><option value="high">Haute</option><option value="urgent">Urgente</option><option value="overdue">Critique / Retard</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Responsable</label>
               <select value={editingTask?.assigned_to || ''} onChange={e => setEditingTask({...editingTask!, assigned_to: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none appearance-none">
                 <option value="">Sélectionner agent...</option>
                 {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
               </select>
             </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Statut</label>
                <select value={editingTask?.status || 'todo'} onChange={e => setEditingTask({...editingTask!, status: e.target.value as TaskStatus})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none">
                  <option value="todo">À faire</option><option value="in_progress">En cours</option><option value="review">Review / Test</option><option value="done">Terminé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Échéance</label>
                <input type="date" value={editingTask?.due_date || ''} onChange={e => setEditingTask({...editingTask!, due_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none [color-scheme:dark]" />
              </div>
           </div>
           <div className="flex gap-3 pt-4">
             {editingTask?.id && <Button type="button" variant="ghost" className="text-nexus-red hover:bg-nexus-red/10 border-nexus-red/10 h-14 rounded-2xl flex-1" onClick={handleDeleteTask}>Annuler Mission</Button>}
             <Button type="submit" variant="primary" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" isLoading={isSubmitting}>Confirmer l'ordre</Button>
           </div>
        </form>
      </Modal>

      {/* MODAL: Mobilize Agent */}
      <Modal isOpen={isAddTeamModalOpen} onClose={() => setIsAddTeamModalOpen(false)} title="Assignation d'Agent au Hub Projet">
         <div className="flex gap-2 p-1 glass rounded-2xl mb-6">
            <button variant={addTeamType === 'internal' ? 'primary' : 'ghost'} onClick={() => setAddTeamType('internal')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${addTeamType === 'internal' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/30 hover:text-white'}`}>Agent Interne</button>
            <button variant={addTeamType === 'external' ? 'primary' : 'ghost'} onClick={() => setAddTeamType('external')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${addTeamType === 'external' ? 'bg-nexus-cyan text-white shadow-lg' : 'text-white/30 hover:text-white'}`}>Expert Externe</button>
         </div>
         <form onSubmit={handleAddTeamMember} className="space-y-6">
            {addTeamType === 'internal' ? (
               <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Agent Nexus *</label>
                  <select required value={newTeamMember.member_id} onChange={e => setNewTeamMember({...newTeamMember, member_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl">
                     <option value="" className="bg-nexus-surface">Identifier l'agent...</option>
                     {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name} ({p.role})</option>)}
                  </select>
               </div>
            ) : (
               <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Nom de l'intervenant *</label>
                    <input required type="text" placeholder="ex: Studio Pulse" value={newTeamMember.external_name} onChange={e => setNewTeamMember({...newTeamMember, external_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="email" placeholder="Email contact" value={newTeamMember.external_email} onChange={e => setNewTeamMember({...newTeamMember, external_email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none" />
                    <input type="tel" placeholder="Téléphone" value={newTeamMember.external_phone} onChange={e => setNewTeamMember({...newTeamMember, external_phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none" />
                  </div>
               </div>
            )}
            <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black">Rôle sur le projet *</label>
               <input required type="text" placeholder="ex: Lead Mix Engineer" value={newTeamMember.role_on_project} onChange={e => setNewTeamMember({...newTeamMember, role_on_project: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" />
            </div>
            <Button type="submit" variant="primary" className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em]" isLoading={isSubmitting}>Lancer l'assignation</Button>
         </form>
      </Modal>
    </div>
  );
};
