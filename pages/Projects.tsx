
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Disc, LayoutGrid, List, Plus, Search, Filter, Calendar, Loader2, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Project, ProjectStatus, ProjectType, STATUS_LABELS } from '../types';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    // Fix: changed 'idee_brainstorm' to 'idea' to match ProjectStatus type
    title: '', artist_id: '', type: 'single', status: 'idea', release_date: '', budget: 0
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, artRes] = await Promise.all([
        supabase.from('projects').select('*, artist:artists(stage_name, avatar_url)').order('created_at', { ascending: false }),
        supabase.from('artists').select('id, stage_name').order('stage_name')
      ]);
      setProjects(projRes.data || []);
      setArtists(artRes.data || []);
    } catch (err: any) {
      alert("Erreur chargement : " + err.message);
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
      if (coverFile) coverUrl = await uploadFile(coverFile, 'covers', 'project-covers');
      const { data, error } = await supabase.from('projects').insert([{ ...formData, cover_url: coverUrl }]).select('*, artist:artists(*)').single();
      if (error) throw error;
      setProjects([data, ...projects]);
      setIsModalOpen(false);
      // Fix: changed 'idee_brainstorm' to 'idea' to match ProjectStatus type
      setFormData({ title: '', artist_id: '', type: 'single', status: 'idea', release_date: '', budget: 0 });
      setCoverFile(null);
      alert("Projet initialisé !");
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white">Pipeline de Production</h2>
          <p className="text-nexus-lightGray text-sm">Suivez l'avancement des sorties du label.</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Nouveau Projet</span>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input type="text" placeholder="Rechercher un projet, un artiste..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full glass rounded-2xl py-3 pl-12 pr-4 text-sm text-white" />
      </div>

      {loading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.artist?.stage_name.toLowerCase().includes(search.toLowerCase())).map(project => (
            <Card key={project.id} className="p-0 overflow-hidden group">
              <Link to={`/projects/${project.id}`}>
                <div className="h-40 overflow-hidden relative">
                  <img src={project.cover_url || "https://picsum.photos/seed/project/400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded bg-nexus-purple text-[8px] font-black uppercase tracking-widest">{STATUS_LABELS[project.status as ProjectStatus]}</div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-white group-hover:text-nexus-cyan transition-colors">{project.title}</h4>
                  <p className="text-xs text-white/40 uppercase font-mono mt-1">{project.artist?.stage_name}</p>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialiser un Projet">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="w-full h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group cursor-pointer">
            {coverFile ? <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" /> : <Camera className="text-white/20 group-hover:text-nexus-cyan transition-colors" />}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
          </div>
          <select required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" value={formData.artist_id} onChange={e => setFormData({...formData, artist_id: e.target.value})}>
            <option value="">Sélectionner un artiste...</option>
            {artists.map(a => <option key={a.id} value={a.id} className="bg-nexus-surface">{a.stage_name}</option>)}
          </select>
          <input required type="text" placeholder="Titre du projet" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          <div className="grid grid-cols-2 gap-4">
            <select className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ProjectType})}>
              <option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option><option value="mixtape">Mixtape</option>
            </select>
            <input type="date" value={formData.release_date} onChange={e => setFormData({...formData, release_date: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>Lancer le projet</Button>
        </form>
      </Modal>
    </div>
  );
};
