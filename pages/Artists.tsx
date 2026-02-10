
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, LayoutGrid, List, ChevronDown, Loader2, Camera, X, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArtistCard } from '../components/features/artists/ArtistCard';
import { useArtists } from '../hooks/useArtists';
import { Artist, ArtistStatus } from '../types';
import { uploadFile } from '../lib/storage';

export const Artists: React.FC = () => {
  const { artists, loading, error, addArtist, fetchArtists } = useArtists();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newArtist, setNewArtist] = useState<Partial<Artist>>({
    name: '', stage_name: '', bio: '', status: 'active', instagram_handle: '', spotify_id: ''
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.stage_name.toLowerCase().includes(search.toLowerCase()) || artist.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || artist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.name || !newArtist.stage_name) return alert("Nom et Nom de scène requis.");
    try {
      setIsSubmitting(true);
      let avatarUrl = '';
      if (avatarFile) avatarUrl = await uploadFile(avatarFile, 'avatars', 'artist-avatars');
      await addArtist({ ...newArtist, avatar_url: avatarUrl });
      setIsAddModalOpen(false);
      fetchArtists();
      alert("Artiste ajouté avec succès !");
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Roster du Label</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Gérez vos talents et suivez leur activité.</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={20} />
          <span className="font-bold">Nouvel Artiste</span>
        </Button>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input type="text" placeholder="Rechercher un artiste..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full glass rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white outline-none">
          <option value="all" className="bg-nexus-surface">Tous les statuts</option>
          <option value="active" className="bg-nexus-surface">Actif</option>
          <option value="on_hold" className="bg-nexus-surface">En pause</option>
          <option value="archived" className="bg-nexus-surface">Archivé</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div> : (
        <div className={view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
          {filteredArtists.map(artist => <ArtistCard key={artist.id} artist={artist} view={view} />)}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Signer un nouveau talent">
        <form onSubmit={handleAddArtist} className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden bg-white/5">
              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Camera className="text-white/20" />}
              <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
              }} />
            </div>
            <p className="text-[10px] font-mono text-white/30 uppercase">Photo de profil</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required type="text" placeholder="Nom de scène" value={newArtist.stage_name} onChange={e => setNewArtist({...newArtist, stage_name: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
            <input required type="text" placeholder="Nom civil" value={newArtist.name} onChange={e => setNewArtist({...newArtist, name: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          </div>
          <textarea rows={3} placeholder="Biographie..." value={newArtist.bio} onChange={e => setNewArtist({...newArtist, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white resize-none" />
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>Ajouter au Roster</Button>
        </form>
      </Modal>
    </div>
  );
};
