
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Disc, CheckSquare, Users, MessageSquare, Settings, 
  Play, Pause, Download, MoreVertical, Plus, Clock, DollarSign, 
  Share2, Instagram, Youtube, Music, Trash2, Camera, Loader2, Save, FileAudio
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Waveform } from '../components/features/Waveform';
import { supabase } from '../lib/supabase';
import { uploadFile, deleteFileByUrl } from '../lib/storage';
import { Project, Track, TrackStatus } from '../types';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tracks' | 'tasks' | 'content' | 'team'>('tracks');
  
  // Audio Player
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<string | null>(null);

  // Modals
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isSubmittingTrack, setIsSubmittingTrack] = useState(false);
  const [newTrack, setNewTrack] = useState<Partial<Track>>({
    title: '',
    status: 'demo',
    bpm: 120,
    key: 'C'
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Editing Project
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    if (id) fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select('*, artist:artists(stage_name, name, avatar_url)')
        .eq('id', id)
        .single();

      if (projError) throw projError;
      setProject(projData);
      setEditData(projData);

      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (tracksError) throw tracksError;
      setTracks(tracksData);
    } catch (err: any) {
      alert("Error fetching project: " + err.message);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(editData)
        .eq('id', project.id);
      if (error) throw error;
      setProject(editData);
      setIsEditing(false);
      alert("Project updated!");
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingTrack(true);
      let audioUrl = '';
      if (audioFile) {
        audioUrl = await uploadFile(audioFile, 'audio', 'track-audio');
      }

      const { data, error } = await supabase
        .from('tracks')
        .insert([{
          ...newTrack,
          project_id: id,
          audio_file_url: audioUrl,
          duration: 0 // Ideally we'd calculate this from audio metadata
        }])
        .select()
        .single();

      if (error) throw error;
      setTracks([...tracks, data]);
      setIsTrackModalOpen(false);
      setNewTrack({ title: '', status: 'demo', bpm: 120, key: 'C' });
      setAudioFile(null);
      alert("Track added to project!");
    } catch (err: any) {
      alert("Error adding track: " + err.message);
    } finally {
      setIsSubmittingTrack(false);
    }
  };

  const handleDeleteTrack = async (trackId: string, audioUrl?: string) => {
    if (!confirm("Remove this track?")) return;
    try {
      if (audioUrl) await deleteFileByUrl(audioUrl, 'audio');
      const { error } = await supabase.from('tracks').delete().eq('id', trackId);
      if (error) throw error;
      setTracks(tracks.filter(t => t.id !== trackId));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const togglePlay = (trackId: string) => {
    setCurrentPlayingTrack(currentPlayingTrack === trackId ? null : trackId);
  };

  if (loading && !project) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-nexus-purple mb-4" size={48} />
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">Accessing Data Cluster...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'tracks', label: 'Tracklist', icon: <Music size={16} /> },
    { id: 'tasks', label: 'Production Tasks', icon: <CheckSquare size={16} /> },
    { id: 'content', label: 'Campaigns', icon: <Share2 size={16} /> },
    { id: 'team', label: 'Collaborators', icon: <Users size={16} /> },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col gap-6">
        <Link to="/projects" className="flex items-center gap-2 text-white/30 hover:text-white transition-all w-fit group">
          <div className="p-1 rounded-lg bg-white/5 group-hover:bg-nexus-purple/20">
            <ArrowLeft size={14} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Back to Global Pipeline</span>
        </Link>

        <div className="relative group rounded-[40px] overflow-hidden glass border-white/10 p-8 flex flex-col lg:flex-row gap-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Disc size={300} className="animate-[spin_20s_linear_infinite]" />
          </div>

          <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative z-10 shrink-0 bg-nexus-surface">
            <img src={project.cover_url || `https://picsum.photos/seed/${project.id}/400`} alt="Cover" className="w-full h-full object-cover" />
            <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
               <Camera size={24} />
            </button>
          </div>

          <div className="flex-1 space-y-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-nexus-purple/20 text-nexus-purple text-[10px] font-black uppercase tracking-widest border border-nexus-purple/30">
                    {project.type}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-nexus-cyan/20 text-nexus-cyan text-[10px] font-black uppercase tracking-widest border border-nexus-cyan/30">
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                {isEditing ? (
                   <input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="text-4xl font-heading font-extrabold text-white bg-white/5 border-b-2 border-nexus-purple outline-none w-full" />
                ) : (
                   <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tighter">{project.title}</h2>
                )}
                <p className="text-nexus-lightGray font-medium">By <Link to={`/artists/${project.artist_id}`} className="text-nexus-cyan hover:underline">{project.artist?.stage_name}</Link></p>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdateProject} className="gap-2"><Save size={18} /> Sync</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 border-white/10"><Settings size={18} /> Configure</Button>
                    <Button variant="primary" className="gap-2 shadow-lg"><Share2 size={18} /> Promote</Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-mono tracking-[0.2em] text-white/30">
                  <span>Production Status</span>
                  <span className="text-nexus-purple">Active</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `45%` }} className="h-full nexus-gradient" />
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="p-2.5 rounded-xl bg-nexus-green/10 text-nexus-green"><DollarSign size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-white/30 leading-none">Remaining Funds</p>
                  <p className="text-lg font-bold font-heading text-white">€{project.budget - project.spent}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="p-2.5 rounded-xl bg-nexus-cyan/10 text-nexus-cyan"><Clock size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-white/30 leading-none">Release Target</p>
                  <p className="text-sm font-bold font-heading text-white">{project.release_date || 'TBD'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-1 p-1 glass rounded-2xl w-fit shadow-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'tracks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-heading font-extrabold text-2xl">Project Tracks</h3>
                <Button variant="outline" size="sm" onClick={() => setIsTrackModalOpen(true)} className="gap-2 bg-nexus-purple/5 border-nexus-purple/20 text-nexus-purple hover:bg-nexus-purple hover:text-white"><Plus size={18} /> Register Track</Button>
              </div>

              <div className="space-y-4">
                {tracks.map((track, i) => (
                  <Card key={track.id} className="hover:border-nexus-purple/40 transition-all border-white/5 group">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <button 
                        onClick={() => togglePlay(track.id)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xl transition-all ${
                          currentPlayingTrack === track.id ? 'bg-nexus-cyan scale-110 shadow-cyan-500/20' : 'bg-white/5 hover:bg-nexus-purple'
                        }`}
                      >
                        {currentPlayingTrack === track.id ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white/20 font-mono text-[10px] font-bold tracking-tighter">TRACK_{String(i + 1).padStart(2, '0')}</span>
                          <h4 className="font-bold text-white text-xl truncate group-hover:text-nexus-cyan transition-colors">{track.title}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30 uppercase font-mono font-bold tracking-widest">
                          <span className={`px-2 py-0.5 rounded bg-white/5 border border-white/10 ${track.status === 'mix_approved' ? 'text-nexus-green border-nexus-green/30' : ''}`}>
                            {track.status.replace('_', ' ')}
                          </span>
                          <span>{track.bpm} BPM</span>
                          <span>KEY: {track.key}</span>
                        </div>
                      </div>

                      <div className="hidden xl:block w-72 h-14 opacity-40">
                        <Waveform isPlaying={currentPlayingTrack === track.id} color={currentPlayingTrack === track.id ? '#06B6D4' : '#ffffff10'} bars={40} />
                      </div>

                      <div className="flex items-center gap-2">
                        {track.audio_file_url && (
                          <a href={track.audio_file_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="p-3"><Download size={20} /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTrack(track.id, track.audio_file_url)} className="p-3 hover:text-nexus-red"><Trash2 size={20} /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {tracks.length === 0 && (
                  <div className="py-24 text-center glass rounded-[40px] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
                     <FileAudio size={64} className="mb-4" />
                     <p className="text-lg font-heading font-bold">Project has no tracks yet</p>
                     <p className="text-xs uppercase tracking-[0.2em] mt-2">Upload your first demo to begin tracking</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
             <div className="glass p-16 rounded-[48px] text-center border-white/5 flex flex-col items-center justify-center">
                <div className="p-6 rounded-[24px] bg-nexus-purple/10 text-nexus-purple mb-6 shadow-xl shadow-purple-500/10">
                   <CheckSquare size={56} />
                </div>
                <h3 className="text-3xl font-heading font-extrabold mb-3">Workflow Management</h3>
                <p className="text-nexus-lightGray max-w-lg mb-8">Access the global Kanban to manage cross-project deadlines or create tasks specifically for this project.</p>
                <Link to="/tasks">
                   <Button variant="primary" className="h-14 px-10 rounded-2xl shadow-2xl">Open Global Board</Button>
                </Link>
             </div>
          )}

          {activeTab === 'content' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1,2].map(i => (
                  <Card key={i} className="flex flex-col gap-6 p-8 border-white/5">
                     <div className="flex justify-between">
                        <div className="p-4 rounded-2xl bg-white/5 text-nexus-pink">
                           {i === 1 ? <Instagram size={28} /> : <Youtube size={28} />}
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-nexus-purple/10 text-nexus-purple font-mono text-[9px] font-bold uppercase h-fit tracking-widest">Scheduled</span>
                     </div>
                     <div>
                        <h4 className="font-heading font-bold text-lg mb-2">Campaign Draft #{i}</h4>
                        <p className="text-xs text-white/40 uppercase font-mono tracking-widest">Oct 24, 2024</p>
                     </div>
                     <Button variant="outline" className="w-full mt-4">Manage Strategy</Button>
                  </Card>
                ))}
             </div>
          )}

          {activeTab === 'team' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['Alex Rivera', 'Sarah Chen'].map(name => (
                  <Card key={name} className="flex items-center gap-4 p-5 border-white/5 hover:border-nexus-cyan/20">
                     <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-nexus-surface shrink-0">
                        <img src={`https://picsum.photos/seed/${name}/100`} alt="" className="w-full h-full object-cover" />
                     </div>
                     <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{name}</h4>
                        <p className="text-[10px] text-nexus-cyan font-mono uppercase tracking-widest">Collaborator</p>
                     </div>
                  </Card>
                ))}
             </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Track Modal */}
      <Modal isOpen={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)} title="Register New Track">
        <form onSubmit={handleAddTrack} className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Audio File</label>
            <div className="w-full h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group cursor-pointer hover:border-nexus-purple transition-all">
               {audioFile ? (
                 <div className="flex flex-col items-center">
                    <FileAudio className="text-nexus-purple mb-1" size={24} />
                    <span className="text-[10px] font-mono text-white/70 max-w-[200px] truncate">{audioFile.name}</span>
                 </div>
               ) : (
                 <div className="flex flex-col items-center text-white/20 group-hover:text-nexus-purple transition-colors">
                    <Plus size={24} />
                    <span className="text-[9px] font-mono uppercase">Upload MP3/WAV</span>
                 </div>
               )}
               <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Track Title *</label>
            <input required type="text" value={newTrack.title} onChange={e => setNewTrack({...newTrack, title: e.target.value})} placeholder="e.g. Midnight Soul" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">BPM</label>
              <input type="number" value={newTrack.bpm} onChange={e => setNewTrack({...newTrack, bpm: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Key</label>
              <input type="text" value={newTrack.key} onChange={e => setNewTrack({...newTrack, key: e.target.value})} placeholder="Am, Cm, G..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Status</label>
            <select value={newTrack.status} onChange={e => setNewTrack({...newTrack, status: e.target.value as TrackStatus})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none">
              <option value="demo">Demo</option>
              <option value="recording">Recording</option>
              <option value="mixing_v1">Mixing V1</option>
              <option value="mix_approved">Mix Approved</option>
              <option value="mastered">Mastered</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsTrackModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmittingTrack}>Add Track</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
