
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, Music2, Users, Disc, FileText, BarChart3, Download, Mail, 
  MoreVertical, ExternalLink, Plus, ArrowLeft, ChevronRight, Camera, 
  Sparkles, Layers, Video, Trash2, Loader2, Save
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile, deleteFileByUrl } from '../lib/storage';
import { Artist, Project, TeamMember, Asset, ProjectType, ArtistStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATS_DATA = [
  { date: '2024-01', listeners: 120000, streams: 450000 },
  { date: '2024-02', listeners: 145000, streams: 510000 },
  { date: '2024-03', listeners: 138000, streams: 490000 },
  { date: '2024-04', listeners: 190000, streams: 720000 },
  { date: '2024-05', listeners: 250000, streams: 1100000 },
  { date: '2024-06', listeners: 320000, streams: 1500000 },
];

const PROJECT_TEMPLATES = [
  { id: 'ep_3_tracks', name: 'EP 3 Tracks', type: 'ep' as ProjectType, description: 'Auto-create 3 tracks + recording tasks', icon: <Layers size={20} />, defaultBudget: 4500 },
  { id: 'single_video', name: 'Single + Video', type: 'single' as ProjectType, description: 'Track + Music Video production workflow', icon: <Video size={20} />, defaultBudget: 6000 }
];

type TabType = 'projects' | 'team' | 'assets' | 'stats';

export const ArtistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Artist>>({});
  const [isSaving, setIsSaving] = useState(false);

  // New Project Modal
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectSource, setProjectSource] = useState<'manual' | 'template'>('manual');
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '',
    type: 'single',
    release_date: '',
    budget: 0,
    status: 'idea'
  });
  const [projectCoverFile, setProjectCoverFile] = useState<File | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) fetchArtistData();
  }, [id]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (artistError) throw artistError;
      setArtist(artistData);
      setEditData(artistData);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('artist_id', id)
        .order('release_date', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData);
    } catch (err: any) {
      alert("Error fetching artist: " + err.message);
      navigate('/artists');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArtist = async () => {
    if (!artist) return;
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('artists')
        .update(editData)
        .eq('id', artist.id);

      if (error) throw error;
      setArtist({ ...artist, ...editData });
      setIsEditing(false);
      alert("Artist updated successfully!");
    } catch (err: any) {
      alert("Error updating artist: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArtist = async () => {
    if (!artist) return;
    if (!confirm(`Are you sure you want to delete ${artist.stage_name}? All associated projects and data will be lost.`)) return;

    try {
      // 1. Delete Storage assets if they exist
      if (artist.avatar_url) await deleteFileByUrl(artist.avatar_url, 'avatars');
      if (artist.cover_url) await deleteFileByUrl(artist.cover_url, 'covers');

      // 2. Delete database entry (cascade will handle projects)
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artist.id);

      if (error) throw error;
      navigate('/artists');
      alert("Artist removed from roster.");
    } catch (err: any) {
      alert("Error deleting artist: " + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'covers') => {
    const file = e.target.files?.[0];
    if (!file || !artist) return;

    try {
      setLoading(true);
      const url = await uploadFile(file, bucket, `artist-${bucket}`);
      
      // Delete old file if exists
      const oldUrl = bucket === 'avatars' ? artist.avatar_url : artist.cover_url;
      if (oldUrl) await deleteFileByUrl(oldUrl, bucket);

      const updates = bucket === 'avatars' ? { avatar_url: url } : { cover_url: url };
      const { error } = await supabase
        .from('artists')
        .update(updates)
        .eq('id', artist.id);

      if (error) throw error;
      setArtist({ ...artist, ...updates });
      alert(`${bucket === 'avatars' ? 'Avatar' : 'Cover'} updated!`);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newProject.title) return;

    try {
      setIsCreatingProject(true);
      let coverUrl = '';
      if (projectCoverFile) {
        coverUrl = await uploadFile(projectCoverFile, 'covers', 'project-covers');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...newProject,
          artist_id: id,
          cover_url: coverUrl
        }])
        .select()
        .single();

      if (error) throw error;
      setProjects([data, ...projects]);
      setIsNewProjectModalOpen(false);
      resetProjectForm();
      alert("Project created!");
    } catch (err: any) {
      alert("Error creating project: " + err.message);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const resetProjectForm = () => {
    setNewProject({ title: '', type: 'single', release_date: '', budget: 0, status: 'idea' });
    setProjectCoverFile(null);
    setProjectSource('manual');
  };

  if (loading && !artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="text-nexus-purple animate-spin" size={48} />
        <p className="mt-4 text-white/40 font-mono tracking-widest uppercase">Fetching Talent Profile...</p>
      </div>
    );
  }

  if (!artist) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <input type="file" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatars')} className="hidden" accept="image/*" />
      <input type="file" ref={coverInputRef} onChange={(e) => handleFileUpload(e, 'covers')} className="hidden" accept="image/*" />

      {/* Hero Header */}
      <div className="relative h-[350px] w-full overflow-hidden">
        <img 
          src={artist.cover_url || "https://picsum.photos/seed/placeholder/1200/400"} 
          alt="Cover" 
          className="w-full h-full object-cover brightness-[0.4]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark via-nexus-dark/40 to-transparent" />
        
        <div className="absolute top-8 left-8 flex items-center gap-4">
          <Link to="/artists">
            <Button variant="ghost" size="sm" className="gap-2 backdrop-blur-md bg-white/5 border border-white/10">
              <ArrowLeft size={16} />
              <span>Roster</span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => coverInputRef.current?.click()} className="gap-2 backdrop-blur-md bg-white/5 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={16} />
            <span>Change Cover</span>
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row items-end gap-6">
          <div className="relative group shrink-0 z-10">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-36 h-36 rounded-[32px] overflow-hidden border-4 border-nexus-surface shadow-2xl bg-nexus-surface">
              <img src={artist.avatar_url || `https://picsum.photos/seed/${artist.id}/200`} alt={artist.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </motion.div>
            <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 rounded-2xl nexus-gradient text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all">
              <Camera size={18} />
            </button>
          </div>
          
          <div className="flex-1 space-y-2 z-10">
            {isEditing ? (
              <div className="space-y-3 max-w-xl">
                <input 
                  type="text" 
                  value={editData.stage_name} 
                  onChange={(e) => setEditData({...editData, stage_name: e.target.value})}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-2xl font-bold text-white w-full outline-none focus:border-nexus-purple"
                />
                <textarea 
                  value={editData.bio} 
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-nexus-lightGray w-full outline-none focus:border-nexus-purple resize-none h-20"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tighter">{artist.stage_name}</h1>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold border ${
                    artist.status === 'active' ? 'bg-nexus-green/20 text-nexus-green border-nexus-green/30' : 'bg-nexus-orange/20 text-nexus-orange border-nexus-orange/30'
                  }`}>
                    {artist.status}
                  </span>
                </div>
                <p className="text-nexus-lightGray max-w-2xl text-sm leading-relaxed">{artist.bio || "No biography provided yet."}</p>
              </>
            )}
            
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-nexus-pink text-xs font-bold">
                <Instagram size={14} />
                {isEditing ? (
                  <input value={editData.instagram_handle} onChange={e => setEditData({...editData, instagram_handle: e.target.value})} className="bg-white/5 border-b border-white/10 outline-none w-32" />
                ) : artist.instagram_handle || '@official'}
              </div>
              <div className="flex items-center gap-1.5 text-nexus-green text-xs font-bold">
                <Music2 size={14} />
                Spotify
              </div>
            </div>
          </div>

          <div className="flex gap-3 z-10">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => { setIsEditing(false); setEditData(artist); }} className="h-11">Cancel</Button>
                <Button variant="primary" onClick={handleUpdateArtist} isLoading={isSaving} className="h-11 gap-2"><Save size={18} /> Save</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="h-11 gap-2 border-white/10 hover:border-white/30"><MoreVertical size={18} /> Edit Profile</Button>
                <Button variant="danger" onClick={handleDeleteArtist} className="h-11 px-4"><Trash2 size={18} /></Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-8 mt-8 sticky top-20 z-30">
        <div className="glass p-1 rounded-2xl flex w-fit shadow-xl">
          {(['projects', 'team', 'assets', 'stats'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 text-sm font-bold uppercase tracking-widest ${
                activeTab === tab ? 'text-white' : 'text-nexus-lightGray hover:text-white'
              }`}
            >
              {activeTab === tab && (
                <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-white/10 rounded-xl" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8 pb-24 max-w-[1400px]">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:border-nexus-purple/40 transition-all group overflow-hidden flex flex-col h-full border-white/5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-xl border border-white/5 shrink-0 bg-nexus-surface">
                        <img src={project.cover_url || `https://picsum.photos/seed/${project.id}/100`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate text-white">{project.title}</h4>
                        <p className="text-[10px] text-nexus-cyan font-mono uppercase tracking-[0.2em]">{project.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-mono tracking-widest">
                        <span>Readiness</span>
                        <span className="text-white font-bold">Active</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `45%` }} className="h-full nexus-gradient shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 mt-6 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white/30 uppercase font-mono font-bold tracking-tighter">Release Date</span>
                        <span className="text-xs font-bold text-white/70">{project.release_date || 'TBD'}</span>
                      </div>
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 text-[10px] uppercase font-black bg-white/5 hover:bg-white/10 px-4">
                          Dashboard <ChevronRight size={14} className="text-nexus-purple" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
                
                <motion.div 
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => { resetProjectForm(); setIsNewProjectModalOpen(true); }}
                  className="border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center p-8 hover:border-nexus-purple/40 hover:bg-nexus-purple/5 transition-all cursor-pointer group min-h-[220px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-nexus-purple/20 group-hover:scale-110 transition-all">
                    <Plus className="text-white/20 group-hover:text-nexus-purple" />
                  </div>
                  <p className="text-xs font-bold text-white/20 group-hover:text-white/40 uppercase tracking-[0.2em]">New Project</p>
                </motion.div>
              </div>
            )}

            {/* Other tabs remain largely skeletal or can be filled with real data as needed */}
            {activeTab === 'team' && (
              <div className="glass p-12 rounded-[40px] text-center flex flex-col items-center justify-center border-white/5">
                <Users className="text-nexus-purple/20 mb-6" size={64} />
                <h3 className="text-2xl font-heading font-extrabold mb-2">Internal Team Only</h3>
                <p className="text-nexus-lightGray max-w-md mx-auto mb-8">This roster is currently managed by the Label Admins. Contact management to add collaborators.</p>
                <Button variant="outline" className="gap-2"><Mail size={18} /> Contact Admin</Button>
              </div>
            )}

            {activeTab === 'assets' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between group hover:border-nexus-purple/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-nexus-purple/10 text-nexus-purple">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Asset_Release_v{i}.pdf</h4>
                          <p className="text-[9px] font-mono text-white/30">EPK / PRESS KIT • 1.4 MB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Download size={18} /></Button>
                   </div>
                 ))}
               </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="min-h-[350px] p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-heading font-bold text-lg">Listeners (30D)</h3>
                      <span className="text-nexus-green text-[10px] font-mono font-bold uppercase tracking-widest bg-nexus-green/10 px-2 py-1 rounded">+24% ↑</span>
                    </div>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={STATS_DATA}>
                          <defs>
                            <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <Tooltip contentStyle={{ backgroundColor: '#0F0F15', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                          <Area type="monotone" dataKey="listeners" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorListeners)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* New Project Modal */}
      <Modal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} title="Initialize Project">
        <div className="space-y-6">
          <div className="flex glass p-1 rounded-xl">
            <button onClick={() => setProjectSource('manual')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${projectSource === 'manual' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Custom Flow</button>
            <button onClick={() => setProjectSource('template')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${projectSource === 'template' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Templates</button>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-5">
            <div className="space-y-4">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Project Media</label>
              <div className="w-full h-32 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group cursor-pointer overflow-hidden hover:border-nexus-purple transition-all">
                {projectCoverFile ? (
                  <img src={URL.createObjectURL(projectCoverFile)} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-white/20 group-hover:text-nexus-purple">
                    <Camera size={24} />
                    <span className="text-[9px] font-mono uppercase">Upload Artwork</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={e => setProjectCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Title</label>
              <input required type="text" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Project name..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Type</label>
                <select value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value as ProjectType})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-nexus-purple">
                  <option value="single">Single</option>
                  <option value="ep">EP</option>
                  <option value="album">Album</option>
                  <option value="mixtape">Mixtape</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Release Date</label>
                <input required type="date" value={newProject.release_date} onChange={e => setNewProject({...newProject, release_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple [color-scheme:dark]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Global Budget (€)</label>
              <input type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple" />
            </div>

            <div className="flex gap-3 pt-6">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsNewProjectModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" className="flex-1" isLoading={isCreatingProject}>Initialize</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
