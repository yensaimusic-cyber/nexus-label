
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Disc, CheckSquare, Users, MessageSquare, Settings, 
  Play, Pause, Download, MoreVertical, Plus, Clock, DollarSign, 
  Share2, Instagram, Youtube, Music, Trash2, Camera, Loader2, Save, FileAudio, Check, Square, X
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
  const [activeTab, setActiveTab] = useState<'tracks' | 'campaign' | 'collaboration' | 'config'>('tracks');
  
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

      setProject(projRes.data);
      setTracks(tracksRes.data || []);
      setCampaignTasks(tasksRes.data || []);
      setCollaborators(collabRes.data || []);
      setAllProfiles(profilesRes.data || []);
    } catch (err: any) {
      alert("Erreur : " + err.message);
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
      alert("Statut mis à jour !");
    } catch (err: any) {
      alert("Échec : " + err.message);
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
      alert("Erreur task : " + err.message);
    }
  };

  const handleToggleTask = async (taskId: string, current: boolean) => {
    try {
      const { error } = await supabase.from('campaign_tasks').update({ is_completed: !current }).eq('id', taskId);
      if (error) throw error;
      setCampaignTasks(campaignTasks.map(t => t.id === taskId ? { ...t, is_completed: !current } : t));
    } catch (err: any) {
      alert("Erreur update task : " + err.message);
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
    } catch (err: any) {
      alert("Erreur collab : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !project) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col gap-6">
        <Link to="/projects" className="flex items-center gap-2 text-white/30 hover:text-white transition-all w-fit">
          <ArrowLeft size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Retour au Pipeline</span>
        </Link>

        <div className="glass p-8 rounded-[40px] border-white/10 flex flex-col lg:flex-row gap-8 relative overflow-hidden">
          <div className="w-48 h-48 rounded-3xl overflow-hidden border border-white/10 shrink-0">
            <img src={project.cover_url || "https://picsum.photos/seed/project/400"} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-lg bg-nexus-purple/20 text-nexus-purple text-[10px] font-black uppercase border border-nexus-purple/30">{project.type}</span>
                  <select 
                    value={project.status} 
                    onChange={(e) => handleUpdateStatus(e.target.value as ProjectStatus)}
                    className="bg-nexus-surface border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-nexus-cyan outline-none"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <h2 className="text-4xl font-heading font-extrabold text-white">{project.title}</h2>
                <p className="text-nexus-lightGray">Par <Link to={`/artists/${project.artist_id}`} className="text-nexus-cyan hover:underline">{project.artist?.stage_name}</Link></p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Budget Restant</p>
                 <p className="text-xl font-bold font-heading">€{project.budget - project.spent}</p>
               </div>
               <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Sortie prévue</p>
                 <p className="text-xl font-bold font-heading">{project.release_date || 'TBD'}</p>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-2 p-1 glass rounded-2xl w-fit">
        {[
          { id: 'tracks', label: 'Tracks', icon: <Music size={16} /> },
          { id: 'campaign', label: 'Campagne (To-Do)', icon: <CheckSquare size={16} /> },
          { id: 'collaboration', label: 'Collaborateurs', icon: <Users size={16} /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl' : 'text-white/40 hover:text-white'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tracks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold">Tracklist</h3>
              <Button variant="outline" size="sm" className="gap-2"><Plus size={18} /> Ajouter une track</Button>
            </div>
            {tracks.map((track, i) => (
              <Card key={track.id} className="p-4 flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-mono text-xs text-white/20">{(i+1).toString().padStart(2, '0')}</div>
                <div className="flex-1">
                  <p className="font-bold text-white">{track.title}</p>
                  <p className="text-[10px] font-mono text-white/30 uppercase">{track.status}</p>
                </div>
                <button className="p-3 bg-nexus-purple/10 text-nexus-purple rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"><Play size={18} /></button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'campaign' && (
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-xl font-heading font-bold">Tâches de Campagne</h3>
            <div className="flex gap-2">
              <input type="text" placeholder="Nouvelle tâche de promo..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTask()} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
              <Button variant="primary" onClick={handleAddTask}><Plus size={20} /></Button>
            </div>
            <div className="space-y-2">
              {campaignTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-4 glass rounded-2xl hover:border-nexus-purple/30 transition-all">
                  <button onClick={() => handleToggleTask(task.id, task.is_completed)} className={`text-nexus-cyan transition-colors ${task.is_completed ? 'opacity-40' : ''}`}>
                    {task.is_completed ? <Check size={20} className="text-nexus-green" /> : <Square size={20} />}
                  </button>
                  <span className={`flex-1 text-sm ${task.is_completed ? 'line-through text-white/20' : 'text-white/80'}`}>{task.task_text}</span>
                  <button onClick={async () => { await supabase.from('campaign_tasks').delete().eq('id', task.id); setCampaignTasks(campaignTasks.filter(t => t.id !== task.id)); }} className="p-2 text-white/10 hover:text-nexus-red transition-colors"><X size={16} /></button>
                </div>
              ))}
              {campaignTasks.length === 0 && <p className="text-center text-white/20 py-12 italic">Aucune tâche planifiée.</p>}
            </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-heading font-bold">Staff assigné au projet</h3>
              <Button variant="primary" size="sm" onClick={() => setIsCollabModalOpen(true)}><Plus size={18} className="mr-2" /> Ajouter un collaborateur</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {collaborators.map(c => (
                <Card key={c.id} className="text-center p-6 border-white/5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 border border-white/10">
                    <img src={c.profile?.avatar_url} className="w-full h-full object-cover" />
                  </div>
                  <p className="font-bold text-white truncate">{c.profile?.full_name}</p>
                  <p className="text-[10px] text-nexus-cyan font-mono uppercase mt-1">{c.role || 'Membre'}</p>
                  <button onClick={async () => { await supabase.from('project_collaborators').delete().eq('id', c.id); setCollaborators(collaborators.filter(col => col.id !== c.id)); }} className="mt-4 text-[10px] text-nexus-red hover:underline uppercase font-bold">Retirer</button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Collaboration Modal */}
      <Modal isOpen={isCollabModalOpen} onClose={() => setIsCollabModalOpen(false)} title="Nouveau Collaborateur">
        <form onSubmit={handleAddCollaborator} className="space-y-4">
          <select required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" value={newCollab.profile_id} onChange={e => setNewCollab({...newCollab, profile_id: e.target.value})}>
            <option value="">Choisir un membre de l'équipe...</option>
            {allProfiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
          </select>
          <input type="text" placeholder="Rôle sur ce projet (ex: Lead Mix)" value={newCollab.role} onChange={e => setNewCollab({...newCollab, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>Confirmer</Button>
        </form>
      </Modal>
    </div>
  );
};
