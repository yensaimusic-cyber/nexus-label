
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Music, Users, ArrowUpRight, Instagram, Music2 } from 'lucide-react';
import { Artist } from '../../../types';

interface ArtistCardProps {
  artist: Artist;
  view?: 'grid' | 'list';
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, view = 'grid' }) => {
  const statusColors = {
    active: 'bg-nexus-green/20 text-nexus-green border-nexus-green/30',
    on_hold: 'bg-nexus-orange/20 text-nexus-orange border-nexus-orange/30',
    archived: 'bg-white/10 text-white/40 border-white/10',
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4 }}
        className="glass group p-4 rounded-2xl border-white/5 hover:border-nexus-purple/30 transition-all flex items-center gap-6"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
          <img 
            src={artist.avatar_url || `https://picsum.photos/seed/${artist.id}/200`} 
            alt={artist.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-white truncate group-hover:text-nexus-cyan transition-colors">
              {artist.stage_name}
            </h4>
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-mono uppercase font-bold border ${statusColors[artist.status]}`}>
              {artist.status}
            </span>
            {(artist as any).linked_profile && (
              <span className="px-2 py-0.5 rounded-md text-[8px] font-mono uppercase font-bold border bg-nexus-purple/20 text-nexus-purple border-nexus-purple/30">
                Équipe
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 truncate">{artist.name}</p>
        </div>

        <div className="hidden md:flex items-center gap-6 text-white/40 text-xs">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-nexus-purple" />
            <span>{artist.projects_count || 0} Projets</span>
          </div>
          <div className="flex items-center gap-3">
            <Instagram size={14} className="hover:text-nexus-pink cursor-pointer transition-colors" />
            <Music2 size={14} className="hover:text-nexus-green cursor-pointer transition-colors" />
          </div>
        </div>

        <Link to={`/artists/${artist.id}`}>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-nexus-purple hover:text-white transition-all">
            <ArrowUpRight size={18} />
          </button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="glass group relative rounded-3xl overflow-hidden border-white/5 hover:border-nexus-purple/30 transition-all cursor-pointer"
    >
      <Link to={`/artists/${artist.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={artist.avatar_url || `https://picsum.photos/seed/${artist.id}/400`} 
            alt={artist.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark via-transparent to-transparent" />
          
          <div className="absolute top-4 right-4 flex gap-2">
            {(artist as any).linked_profile && (
              <span className="px-2 py-1 rounded-lg text-[9px] font-mono uppercase font-bold backdrop-blur-md border bg-nexus-purple/20 text-nexus-purple border-nexus-purple/30">
                Équipe Indigo
              </span>
            )}
            <span className={`px-2 py-1 rounded-lg text-[9px] font-mono uppercase font-bold backdrop-blur-md border ${statusColors[artist.status]}`}>
              {artist.status}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-lg font-bold text-white group-hover:text-nexus-cyan transition-colors leading-tight">
              {artist.stage_name}
            </h4>
            <p className="text-sm text-white/40 font-medium">{artist.name}</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-nexus-lightGray">
              <div className="p-1.5 rounded-lg bg-nexus-purple/10 text-nexus-purple">
                <Music size={14} />
              </div>
              <span className="text-xs font-semibold">{artist.projects_count || 0} Projets</span>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-nexus-surface overflow-hidden bg-white/10">
                  <img src={`https://picsum.photos/seed/fan${i}/50`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
