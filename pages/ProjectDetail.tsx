
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Disc, Users, Settings, 
  Play, Plus, Clock, DollarSign, 
  Trash2, Camera, Loader2, Save, FileAudio, Check, X, ClipboardList, Edit3, AlertTriangle, User, Calendar, Mail, Phone, ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Project, Track, Task, ProjectStatus, ProjectType, STATUS_LABELS, ProjectTeamMember, MemberType } from '../types';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Team Member Form State
  const [addTeamType, setAddTeamType] = useState<MemberType>('internal');
  const [newTeamMember, setNewTeamMember] = useState({
    member_id: '',
    role_on_project: '',
    external_name: '',
    external_email: '',
    external_phone: '',
    external_notes: ''
  });

  // Edit Form State
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
      console.error("Fetch error:", err);
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
        const url = await uploadFile(newCoverFile, 'covers', 'project-covers');
        updates.cover_url = url;
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select('*, artist:artists(*)')
        .single();

      if (error) throw error;
      setProject(data);
      setIsEditModalOpen(false);
      alert("Projet mis à jour !");
    } catch (err: any) {
      alert("Erreur lors de la mise à jour.");
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
    } catch (err: any) {
      alert("Suppression impossible.");
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
        role_on_project: newTeamMember.role_on_project,
      };

      if (addTeamType === 'internal') {
        payload.member_id = newTeamMember.member_id;
      } else {
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
      setTeamMembers([...teamMembers, data]);
      setIsAddTeamModalOpen(false);
      setNewTeamMember({
        member_id: '',
        role_on_project: '',
        external_name: '',
        external_email: '',
        external_phone: '',
        external_notes: ''
      });
    } catch (err: any) {
      alert("Erreur lors de l'ajout : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    try {
      const { error } = await supabase.from('project_team').delete().eq('id', memberId);
      if (error) throw error;
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
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
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Retour au Pipeline</span>
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-40 h-40 lg:w-56 lg:h-56 rounded-[32px] lg:rounded-[40px] overflow-hidden border border-white/10 shrink-0 shadow-2xl relative z-10"
          >
            <img src={project.cover_url || "https://picsum.photos/seed/project/400"} alt="Cover" className="w-full h-full object-cover" />
          </motion.div>
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
                 <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">Restant</p>
                 <p className="text-xl font-bold font-heading text-white">€{(project.budget - project.spent).toLocaleString()}</p>
               </div>
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-xl">
                 <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">Sortie Cible</p>
                 <p className="text-base font-bold font-heading text-white">{project.release_date || 'Non fixée'}</p>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 glass rounded-2xl w-full sm:w-fit shadow-2xl">
        {[
          { id: 'tracks', label: 'Morceaux', icon: <Disc size={16} /> },
          { id: 'tasks', label: 'Tâches', icon: <ClipboardList size={16} /> },
          { id: 'collaboration', label: 'L\'Équipe', icon: <Users size={16} /> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
              activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl scale-[1.02]' : 'text-white/40 hover:text-white'
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Tracklist</h3>
                <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:border-nexus-purple">
                  <Plus size={16} /> Ajouter une track
                </Button>
              </div>
              <div className="space-y-3">
                {tracks.map((track, i) => (
                  <Card key={track.id} className="p-4 flex items-center gap-6 group hover:border-nexus-purple/40 border-white/5 shadow-lg bg-white/[0.01]">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-mono text-sm text-white/20 font-black border border-white/5 group-hover:text-nexus-purple transition-colors">
                      {(i+1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-base truncate">{track.title}</p>
                      <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mt-0.5">{track.status}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 px-4 border-l border-white/5">
                        <span className="text-[8px] font-mono text-white/20 uppercase">BPM</span>
                        <span className="text-xs font-bold text-nexus-purple">{track.bpm || '--'}</span>
                    </div>
                    <button className="p-2.5 bg-nexus-purple/10 text-nexus-purple rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <Play size={18} fill="currentColor" />
                    </button>
                  </Card>
                ))}
                {tracks.length === 0 && (
                   <div className="py-16 text-center glass rounded-[32px] border-dashed border-white/10 opacity-30 flex flex-col items-center justify-center">
                     <FileAudio size={48} className="mb-4" />
                     <p className="text-sm font-bold italic">Aucun enregistrement pour ce projet</p>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Opérations du projet</h3>
                <Link to="/tasks">
                  <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:border-nexus-cyan text-nexus-cyan">
                    <Plus size={16} /> Gérer les tâches
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {projectTasks.map(task => (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 glass rounded-2xl hover:border-nexus-purple/30 transition-all group shadow-xl bg-white/[0.01]">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-10 rounded-full shrink-0 ${task.status === 'done' ? 'bg-nexus-green' : 'bg-white/10'}`} />
                      <div className="min-w-0">
                        <p className={`font-bold text-base transition-all ${task.status === 'done' ? 'line-through text-white/20' : 'text-white/80'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                           <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border tracking-widest ${getPriorityColor(task.priority)}`}>
                             {task.priority}
                           </span>
                           <span className="text-[9px] font-mono text-white/20 flex items-center gap-1">
                             <Calendar size={10} /> {task.due_date || 'Pas de deadline'}
                           </span>
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
                      <div className="text-[9px] font-black uppercase text-nexus-cyan bg-nexus-cyan/10 px-2 py-1 rounded">
                        {task.status}
                      </div>
                    </div>
                  </div>
                ))}
                {projectTasks.length === 0 && (
                  <div className="text-center py-20 glass rounded-[32px] border-dashed border-white/10 opacity-30 flex flex-col items-center gap-4">
                    <ClipboardList size={40} />
                    <p className="text-sm">Aucune tâche assignée. Créez-en une sur la page Tâches.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'collaboration' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">L'Équipe</h3>
                <Button variant="outline" size="sm" onClick={() => setIsAddTeamModalOpen(true)} className="gap-2 border-white/10 hover:bg-nexus-cyan/10 text-nexus-cyan">
                  <Plus size={16} /> Ajouter un membre
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamMembers.map(member => (
                  <Card key={member.id} className="text-center p-8 border-white/5 hover:border-nexus-cyan/30 bg-white/[0.01] group relative">
                    <button 
                      onClick={() => handleRemoveTeamMember(member.id)}
                      className="absolute top-4 right-4 p-2 text-white/10 hover:text-nexus-red transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="w-20 h-20 rounded-[24px] overflow-hidden mx-auto mb-4 border-2 border-white/10 group-hover:border-nexus-cyan/40 transition-all shadow-2xl bg-nexus-surface">
                      <img 
                        src={member.member_type === 'internal' ? (member.profile?.avatar_url || `https://picsum.photos/seed/${member.member_id}/200`) : `https://ui-avatars.com/api/?name=${member.external_name}&background=06B6D4&color=fff&size=200`} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <p className="font-heading font-extrabold text-white truncate text-base">
                          {member.member_type === 'internal' ? member.profile?.full_name : member.external_name}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter ${member.member_type === 'internal' ? 'bg-nexus-purple/20 text-nexus-purple border border-nexus-purple/30' : 'bg-nexus-cyan/20 text-nexus-cyan border border-nexus-cyan/30'}`}>
                          {member.member_type === 'internal' ? 'Interne' : 'Externe'}
                        </span>
                      </div>
                      <p className="text-[9px] text-nexus-cyan font-mono uppercase tracking-[0.2em] font-black">{member.role_on_project}</p>
                    </div>

                    {member.member_type === 'external' && (
                      <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-white/5">
                        {member.external_email && (
                          <a href={`mailto:${member.external_email}`} className="text-white/20 hover:text-white transition-colors">
                            <Mail size={14} />
                          </a>
                        )}
                        {member.external_phone && (
                          <a href={`tel:${member.external_phone}`} className="text-white/20 hover:text-white transition-colors">
                            <Phone size={14} />
                          </a>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
                {teamMembers.length === 0 && (
                   <div className="col-span-full py-16 text-center glass rounded-[32px] border-dashed border-white/10 opacity-30 italic text-sm">
                     L'équipe du projet est vide. Mobilisez vos agents ou recrutez des externes.
                   </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Team Member Modal */}
      <Modal isOpen={isAddTeamModalOpen} onClose={() => setIsAddTeamModalOpen(false)} title="Assigner un Agent / Partenaire">
        <div className="flex p-1 bg-white/5 rounded-xl mb-6">
          <button 
            onClick={() => setAddTeamType('internal')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${addTeamType === 'internal' ? 'bg-nexus-purple text-white' : 'text-white/30 hover:text-white/50'}`}
          >
            Membre Interne
          </button>
          <button 
            onClick={() => setAddTeamType('external')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${addTeamType === 'external' ? 'bg-nexus-cyan text-white' : 'text-white/30 hover:text-white/50'}`}
          >
            Intervenant Externe
          </button>
        </div>

        <form onSubmit={handleAddTeamMember} className="space-y-4">
          {addTeamType === 'internal' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Agent Nexus *</label>
                <select 
                  required 
                  value={newTeamMember.member_id} 
                  onChange={e => setNewTeamMember({...newTeamMember, member_id: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none outline-none focus:border-nexus-purple"
                >
                  <option value="" className="bg-nexus-surface">Sélectionner un agent...</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id} className="bg-nexus-surface">
                      {p.full_name} ({Array.isArray(p.role) ? p.role.join(', ') : p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Nom de l'intervenant *</label>
                <input 
                  required 
                  type="text" 
                  value={newTeamMember.external_name} 
                  onChange={e => setNewTeamMember({...newTeamMember, external_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-nexus-cyan"
                  placeholder="ex: Alex Rivera"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Email</label>
                  <input 
                    type="email" 
                    value={newTeamMember.external_email} 
                    onChange={e => setNewTeamMember({...newTeamMember, external_email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-nexus-cyan"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Téléphone</label>
                  <input 
                    type="tel" 
                    value={newTeamMember.external_phone} 
                    onChange={e => setNewTeamMember({...newTeamMember, external_phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-nexus-cyan"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Notes</label>
                <textarea 
                  rows={2}
                  value={newTeamMember.external_notes} 
                  onChange={e => setNewTeamMember({...newTeamMember, external_notes: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-nexus-cyan resize-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Mission sur ce projet *</label>
            <input 
              required 
              type="text" 
              value={newTeamMember.role_on_project} 
              onChange={e => setNewTeamMember({...newTeamMember, role_on_project: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-white/40"
              placeholder="ex: Mix Engineer, Marketing Lead..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsAddTeamModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className={`flex-1 ${addTeamType === 'external' ? 'bg-nexus-cyan' : ''}`} isLoading={isSubmitting}>
              Assigner au Projet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier le Projet">
        <form onSubmit={handleUpdateProject} className="space-y-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Visuel de Couverture</label>
            <div className="relative h-24 rounded-xl overflow-hidden bg-white/5 border border-dashed border-white/20 flex items-center justify-center group cursor-pointer">
              {newCoverFile ? (
                <img src={URL.createObjectURL(newCoverFile)} className="w-full h-full object-cover" />
              ) : project.cover_url ? (
                <img src={project.cover_url} className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-white/20 group-hover:text-nexus-purple transition-all" />
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewCoverFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Titre du Projet *</label>
            <input required type="text" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-nexus-purple" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Artiste Associé</label>
              <select value={editData.artist_id} onChange={e => setEditData({...editData, artist_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none outline-none">
                {allArtists.map(a => <option key={a.id} value={a.id} className="bg-nexus-surface">{a.stage_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Type de Sortie</label>
              <select value={editData.type} onChange={e => setEditData({...editData, type: e.target.value as ProjectType})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none outline-none">
                <option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option><option value="mixtape">Mixtape</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Date de Sortie</label>
              <input type="date" value={editData.release_date} onChange={e => setEditData({...editData, release_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Statut de Pipeline</label>
              <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value as ProjectStatus})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none outline-none">
                {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val} className="bg-nexus-surface">{label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Budget Total (€)</label>
              <input type="number" value={editData.budget} onChange={e => setEditData({...editData, budget: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Déjà Dépensé (€)</label>
              <input type="number" value={editData.spent} onChange={e => setEditData({...editData, spent: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}><Save size={18} className="mr-2" /> Enregistrer</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmer la Suppression">
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 bg-nexus-red/10 text-nexus-red rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-white">Supprimer {project.title} ?</p>
            <p className="text-sm text-white/40">Cette action est irréversible et supprimera tout l'historique de production associé.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteProject} isLoading={isSubmitting}>Supprimer Définitivement</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
