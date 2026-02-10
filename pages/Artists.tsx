
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ArtistCard } from '../components/features/artists/ArtistCard';
import { Artist } from '../types';
import { supabase } from '../lib/supabase';

export const Artists: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les artistes depuis Supabase
  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          projects:projects(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformer les données pour inclure projects_count
      const artistsWithCount = data?.map(artist => ({
        ...artist,
        projects_count: artist.projects?.[0]?.count || 0
      })) || [];

      setArtists(artistsWithCount);
    } catch (error) {
      console.error('Error fetching artists:', error);
      alert('Failed to load artists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.stage_name.toLowerCase().includes(search.toLowerCase()) || 
                         artist.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || artist.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <Button variant="primary" className="gap-2 grow lg:grow-0 py-3 lg:py-2.5">
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

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-white/40 font-heading text-xl">Loading artists...</div>
        </div>
      ) : (
        /* Artists Grid/List */
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
                <ArtistCard key={artist.id} artist={artist} view={view} />
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
    </div>
  );
};
