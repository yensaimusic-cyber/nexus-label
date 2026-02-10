
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Disc, LayoutGrid, List, Plus, Search, Filter, Calendar, Loader2, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Project, ProjectStatus, ProjectType } from '../types';

const STAGES: { label: string, value: ProjectStatus }[] = [
  { label: 'Idea', value: 'idea' },
  { label: 'Pre-Prod', value: 'pre_production' },
  { label: 'Production', value: 'production' },
  { label: 'Post-Prod', value: 'post_production' },
  { label: 'Release Prep', value: 'release' },
  { label: 'Released', value: 'released' }
];

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    artist_id: '',
    type: 'single',
    status: 'idea',
    release_date: '',
    budget: 0
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, artist:artists(stage_name, name, avatar_url)')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData);

      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('id, stage_name')
        .order('stage_name', { ascending: true });
        
      if (artistsError) throw artistsError;
      setArtists(artistsData);
    } catch (err: any) {
      alert("Error fetching projects: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.artist_id || !formData.title) return;

    try {
      setIsSubmitting(true);
      let coverUrl = '';
      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'covers', 'project-covers');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...formData,
          cover_url: coverUrl
        }])
        .select('*, artist:artists(stage_name, name, avatar_url)')
        .single();

      if (error) throw error;
      setProjects([data, ...projects]);
      setIsModalOpen(false);
      setFormData({ title: '', artist_id: '', type: 'single', status: 'idea', release_date: '', budget: 0 });
      setCoverFile(null);
      alert("Project initialized!");
    } catch (err: any) {
      alert("Error creating project: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.artist?.stage_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white">Project Pipeline</h2>
          <p className="text-nexus-lightGray text-sm">Monitor and manage label releases from idea to launch.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="glass p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
          <Button variant="primary" className="gap-2 shadow-xl" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>New Project</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text" 
            placeholder="Search projects or artists..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none"
          />
        </div>
        <Button variant="outline" className="gap-2 border-white/5">
          <Filter size={18} />
          <span>Quick Filters</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-nexus-purple mb-4" size={40} />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Synchronizing Pipeline...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
          <div className="flex gap-6 h-full min-w-max px-2">
            {STAGES.map((stage) => (
              <div key={stage.value} className="w-80 flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-nexus-purple shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    <h3 className="font-heading font-bold text-sm tracking-widest uppercase">{stage.label}</h3>
                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/40 font-mono">
                      {filteredProjects.filter(p => p.status === stage.value).length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {filteredProjects.filter(p => p.status === stage.value).map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </AnimatePresence>
                  
                  {filteredProjects.filter(p => p.status === stage.value).length === 0 && (
                    <div className="h-24 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center opacity-20 italic text-[10px] uppercase font-bold tracking-widest">
                      Empty Segment
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize Project">
        <form onSubmit={handleCreate} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-4">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Artwork</label>
            <div className="relative w-full h-32 rounded-2xl bg-white/5 border border-white/10 overflow-hidden group">
              {coverFile ? (
                <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/20 group-hover:text-nexus-cyan transition-colors">
                  <Camera size={24} />
                  <span className="text-[9px] font-mono mt-1">Upload Cover</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Artist *</label>
            <select 
              required
              value={formData.artist_id}
              onChange={e => setFormData({...formData, artist_id: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-nexus-purple"
            >
              <option value="" className="bg-nexus-surface">Select Artist...</option>
              {artists.map(a => <option key={a.id} value={a.id} className="bg-nexus-surface">{a.stage_name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Project Title *</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Neon Pulse"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as ProjectType})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none"
              >
                <option value="single">Single</option>
                <option value="ep">EP</option>
                <option value="album">Album</option>
                <option value="mixtape">Mixtape</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none"
              >
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Release Date</label>
              <input type="date" value={formData.release_date} onChange={e => setFormData({...formData, release_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Budget (€)</label>
              <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ProjectCard: React.FC<{ project: any }> = ({ project }) => {
  const typeColors = {
    album: 'text-nexus-purple bg-nexus-purple/10',
    ep: 'text-nexus-cyan bg-nexus-cyan/10',
    single: 'text-nexus-pink bg-nexus-pink/10',
    mixtape: 'text-nexus-orange bg-nexus-orange/10',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="glass p-5 rounded-[24px] border-white/5 hover:border-nexus-purple/40 group transition-all cursor-pointer relative overflow-hidden"
    >
      <Link to={`/projects/${project.id}`} className="absolute inset-0 z-0" />
      
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0 bg-nexus-surface">
          <img src={project.cover_url || `https://picsum.photos/seed/${project.id}/100`} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-white group-hover:text-nexus-cyan transition-colors truncate">{project.title}</h4>
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{project.artist?.stage_name}</p>
          <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-mono uppercase font-bold mt-2 ${typeColors[project.type as keyof typeof typeColors]}`}>
            {project.type}
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-mono tracking-widest">
          <div className="flex items-center gap-1">
            <Calendar size={12} className="text-nexus-purple" />
            <span>{project.release_date ? new Date(project.release_date).toLocaleDateString() : 'TBD'}</span>
          </div>
          <span className="text-white font-bold tracking-tighter">Active Pipeline</span>
        </div>

        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `45%` }} className="h-full nexus-gradient" />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-lg border-2 border-nexus-surface overflow-hidden bg-white/10">
                <img src={project.artist?.avatar_url || `https://picsum.photos/seed/${project.artist_id}/50`} className="w-full h-full object-cover" />
             </div>
             <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">{project.artist?.stage_name}</span>
           </div>
           <div className="text-[10px] font-bold text-nexus-cyan font-mono">
             €{(project.spent || 0) / 1000}k / {(project.budget || 0) / 1000}k
           </div>
        </div>
      </div>
    </motion.div>
  );
};
