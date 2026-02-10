
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, LayoutGrid, List, ChevronDown, Loader2, Camera, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArtistCard } from '../components/features/artists/ArtistCard';
import { useArtists } from '../hooks/useArtists';
import { Artist, ArtistStatus } from '../types';

export const Artists: React.FC = () => {
  const { artists, loading, error, addArtist, deleteArtist } = useArtists();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newArtist, setNewArtist] = useState<Partial<Artist>>({
    name: '',
    stage_name: '',
    bio: '',
    status: 'active',
    instagram_handle: '',
    spotify_id: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = 
      artist.stage_name.toLowerCase().includes(search.toLowerCase()) || 
      artist.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || artist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await addArtist(newArtist, selectedFile || undefined);
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewArtist({
      name: '',
      stage_name: '',
      bio: '',
      status: 'active',
      instagram_handle: '',
      spotify_id: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Label Roster</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Manage talent, track activity, and discover new signings.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="glass p-1 rounded-xl flex gap-1 grow lg:grow-0">
            <button 
              onClick={() => setView('grid')}
              className={`flex-1 lg:p-2 p-2.5 rounded-lg transition-all flex items-center justify-center ${view === 'grid' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`flex-1 lg:p-2 p-2.5 rounded-lg transition-all flex items-center justify-center ${view === 'list' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
          <Button 
            variant="primary" 
            className="gap-2 grow lg:grow-0 py-3 lg:py-2.5"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={20} />
            <span className="font-bold">Add Artist</span>
          </Button>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text" 
            placeholder="Search name or stage name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none text-white font-medium"
          />
        </div>
        
        <div className="flex gap-3 h-12.5">
          <div className="relative flex-1 md:min-w-[180px]">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-full bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white focus:outline-none focus:border-nexus-purple transition-all appearance-none cursor-pointer pr-10 font-bold tracking-wide"
            >
              <option value="all" className="bg-nexus-surface">All Status</option>
              <option value="active" className="bg-nexus-surface">Active</option>
              <option value="on_hold" className="bg-nexus-surface">On Hold</option>
              <option value="archived" className="bg-nexus-surface">Archived</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" />
          </div>
          
          <Button variant="outline" className="gap-2 px-5 h-full">
            <Filter size={18} />
            <span className="hidden lg:inline font-bold uppercase tracking-widest text-[10px]">Filter</span>
          </Button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-nexus-purple animate-spin mb-4" size={48} />
          <p className="text-white/40 font-mono text-sm tracking-widest">SYNCHRONIZING ROSTER...</p>
        </div>
      )}

      {!loading && error && (
        <div className="glass p-8 rounded-3xl border-nexus-red/20 text-center">
          <p className="text-nexus-red font-bold mb-2">Erreur de chargement</p>
          <p className="text-white/40 text-sm">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      )}

      {/* Artists Grid/List */}
      {!loading && !error && (
        <AnimatePresence mode="wait">
          <motion.div 
            key={view + statusFilter + search}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={view === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6"
              : "flex flex-col gap-4"
            }
          >
            {filteredArtists.length > 0 ? (
              filteredArtists.map((artist) => (
                <ArtistCard 
                  key={artist.id} 
                  artist={artist} 
                  view={view} 
                />
              ))
            ) : (
              <div className="col-span-full py-24 text-center glass rounded-[32px] border-dashed border-white/10 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  <Search className="text-white/10" size={40} />
                </div>
                <p className="text-white/40 font-heading text-xl font-bold">No talents found matching criteria</p>
                <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="mt-4 text-nexus-purple font-bold hover:underline">Clear filters</button>
              </div>
            )}
            
            {view === 'grid' && (
              <motion.div 
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => setIsAddModalOpen(true)}
                className="border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center p-8 hover:border-nexus-purple/40 hover:bg-nexus-purple/5 transition-all cursor-pointer group min-h-[300px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-nexus-purple/20 group-hover:scale-110 transition-all shadow-xl">
                  <Plus className="text-white/20 group-hover:text-nexus-purple" size={32} />
                </div>
                <p className="text-sm font-bold text-white/20 group-hover:text-white/60 tracking-widest uppercase">Add New Talent</p>
                <p className="text-[10px] text-white/10 mt-2 font-mono uppercase">Direct Signing Flow</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Add Artist Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Sign New Talent"
      >
        <form onSubmit={handleAddArtist} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center transition-all group-hover:border-nexus-purple/50">
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <Camera className="text-white/20 group-hover:text-nexus-purple transition-colors" size={32} />
                )}
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Click to upload avatar</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Stage Name</label>
              <input 
                required
                type="text" 
                value={newArtist.stage_name}
                onChange={(e) => setNewArtist({...newArtist, stage_name: e.target.value})}
                placeholder="ex: Solaris"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-nexus-purple transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Full Name</label>
              <input 
                required
                type="text" 
                value={newArtist.name}
                onChange={(e) => setNewArtist({...newArtist, name: e.target.value})}
                placeholder="ex: Luna Solaris"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-nexus-purple transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Artist Bio</label>
            <textarea 
              rows={3}
              value={newArtist.bio}
              onChange={(e) => setNewArtist({...newArtist, bio: e.target.value})}
              placeholder="Tell the artist's story..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-nexus-purple transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Instagram</label>
              <input 
                type="text" 
                value={newArtist.instagram_handle}
                onChange={(e) => setNewArtist({...newArtist, instagram_handle: e.target.value})}
                placeholder="@handle"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-nexus-purple transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Status</label>
              <select 
                value={newArtist.status}
                onChange={(e) => setNewArtist({...newArtist, status: e.target.value as ArtistStatus})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-nexus-purple appearance-none"
              >
                <option value="active" className="bg-nexus-surface">Active</option>
                <option value="on_hold" className="bg-nexus-surface">On Hold</option>
                <option value="archived" className="bg-nexus-surface">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              className="flex-1" 
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex-1"
              isLoading={isSubmitting}
            >
              Sign Artist
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
