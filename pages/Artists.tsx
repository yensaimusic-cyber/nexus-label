
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, LayoutGrid, List, ChevronDown, Loader2, Camera, X, Check, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArtistCard } from '../components/features/artists/ArtistCard';
import { useArtists } from '../hooks/useArtists';
import { Artist, ArtistStatus } from '../types';
import { uploadFile } from '../lib/storage';
import { supabase } from '../lib/supabase';

export const Artists: React.FC = () => {
  const { artists, loading, error, addArtist, fetchArtists } = useArtists();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [profiles, setProfiles] = useState<any[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newArtist, setNewArtist] = useState<Partial<Artist>>({
    name: '', stage_name: '', bio: '', status: 'active', instagram_handle: '', spotify_id: '', profile_id: null
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .order('full_name');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.stage_name?.toLowerCase().includes(search.toLowerCase()) || artist.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || artist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.name || !newArtist.stage_name) return alert("Nom civil et Nom de scène requis.");
    try {
      setIsSubmitting(true);
      let avatarUrl = '';
      if (avatarFile) avatarUrl = await uploadFile(avatarFile, 'avatars', 'artist-avatars');
      await addArtist({ ...newArtist, avatar_url: avatarUrl });
      setIsAddModalOpen(false);
      fetchArtists();
      alert("Nouvel artiste signé avec succès !");
    } catch (err: any) {
      alert("Erreur lors de la signature : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Roster Global</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Gérez vos talents et suivez leur développement artistique.</p>
        </div>
        <Button variant="primary" className="gap-2 shadow-xl" onClick={() => {
          setNewArtist({ name: '', stage_name: '', bio: '', status: 'active', profile_id: null });
          setAvatarPreview(null);
          setIsAddModalOpen(true);
        }}>
          <Plus size={20} />
          <span className="font-bold">Signer un Artiste</span>
        </Button>
      </header>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input type="text" placeholder="Rechercher par nom de scène..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full glass rounded-[20px] py-3.5 pl-12 pr-4 text-sm text-white focus:border-nexus-purple outline-none shadow-lg transition-all" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-[20px] px-6 text-sm text-white outline-none focus:border-nexus-purple transition-all shadow-lg appearance-none cursor-pointer pr-10">
          <option value="all" className="bg-nexus-surface">Tous les statuts</option>
          <option value="active" className="bg-nexus-surface">Actif</option>
          <option value="on_hold" className="bg-nexus-surface">En pause</option>
          <option value="archived" className="bg-nexus-surface">Archivé</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="animate-spin text-nexus-purple" size={48} />
          <p className="mt-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Récupération du catalogue...</p>
        </div>
      ) : (
        <div className={view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
          {filteredArtists.map(artist => <ArtistCard key={artist.id} artist={artist} view={view} />)}
          {filteredArtists.length === 0 && (
             <div className="col-span-full py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-30">
                {/* Fix: Added Users icon to lucide-react imports above */}
                <Users size={64} className="mx-auto mb-4" />
                <p className="text-xl font-heading font-bold italic">Aucun artiste ne correspond à ces critères</p>
             </div>
          )}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Signature Nouveau Contrat">
        <form onSubmit={handleAddArtist} className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-[32px] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden bg-white/5 hover:border-nexus-purple transition-all group cursor-pointer shadow-2xl">
              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" /> : <Camera className="text-white/20 group-hover:text-nexus-purple transition-colors" size={32} />}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
              }} />
            </div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-black">Identité Visuelle</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Nom de scène *</label>
              <input required type="text" placeholder="Artiste / Groupe" value={newArtist.stage_name} onChange={e => setNewArtist({...newArtist, stage_name: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white focus:border-nexus-purple outline-none shadow-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Nom civil réel *</label>
              <input required type="text" placeholder="Nom complet juridique" value={newArtist.name} onChange={e => setNewArtist({...newArtist, name: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white focus:border-nexus-purple outline-none shadow-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Profil & Biographie</label>
            <textarea rows={4} placeholder="Parcours artistique, univers, genre..." value={newArtist.bio} onChange={e => setNewArtist({...newArtist, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white resize-none focus:border-nexus-purple outline-none shadow-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Lier à un membre de l'équipe Indigo (optionnel)</label>
            <select 
              value={newArtist.profile_id || ''} 
              onChange={e => setNewArtist({...newArtist, profile_id: e.target.value || null})} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white focus:border-nexus-purple outline-none shadow-xl appearance-none"
            >
              <option value="" className="bg-nexus-surface">Aucun (artiste externe)</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id} className="bg-nexus-surface">
                  {profile.full_name} {profile.role ? `(${profile.role})` : ''}
                </option>
              ))}
            </select>
            <p className="text-white/30 text-xs italic">Si l'artiste fait également partie de l'équipe Indigo</p>
          </div>
          <div className="flex gap-4 pt-6 border-t border-white/5">
            <Button type="button" variant="ghost" className="flex-1 h-14" onClick={() => setIsAddModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1 h-14 font-black uppercase tracking-widest text-xs" isLoading={isSubmitting}>Enregistrer au Roster</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
