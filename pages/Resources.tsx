
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ExternalLink, Mail, Globe, Star, Tag, Briefcase } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExternalResource } from '../types';

const MOCK_RESOURCES: ExternalResource[] = [
  {
    id: 'r1',
    name: 'SND Studio Paris',
    service_type: 'Audio',
    skills: ['Mixing', 'Mastering', 'Dolby Atmos'],
    contact_info: 'contact@snd-studio.fr',
    website: 'https://snd-studio.fr',
    rating: 4.9,
    notes: 'Studio de référence pour le mixage Atmos. Très réactif.'
  },
  {
    id: 'r2',
    name: 'Visual Mindset',
    service_type: 'Image',
    skills: ['Video clip', 'VFX', 'Cover art'],
    contact_info: 'info@visualmindset.com',
    website: 'https://visualmindset.com',
    rating: 4.7,
    notes: 'Spécialisé dans les esthétiques néon et futuristes. Demander Paul.'
  },
  {
    id: 'r3',
    name: 'Promo Boost Agency',
    service_type: 'Marketing',
    skills: ['TikTok Ads', 'Spotify Pitch', 'PR'],
    contact_info: 'hello@promoboost.io',
    website: 'https://promoboost.io',
    rating: 4.5,
    notes: 'Excellents résultats sur les campagnes de singles récents.'
  }
];

export const Resources: React.FC = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Ressources & Partenaires</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Répertoire des prestataires et services externes de confiance.</p>
        </div>
        <Button variant="primary" className="gap-2 shadow-xl">
          <Plus size={20} />
          <span>Ajouter un Service</span>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher par nom, service ou compétence..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_RESOURCES.filter(r => 
          r.name.toLowerCase().includes(search.toLowerCase()) || 
          r.service_type.toLowerCase().includes(search.toLowerCase()) ||
          r.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
        ).map((resource) => (
          <Card key={resource.id} className="flex flex-col h-full hover:border-nexus-cyan/40 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-nexus-cyan/10 text-nexus-cyan`}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-nexus-cyan transition-colors">{resource.name}</h3>
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{resource.service_type}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-nexus-orange">
                <Star size={12} fill="currentColor" />
                <span className="text-[10px] font-bold">{resource.rating}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {resource.skills.map(skill => (
                  <span key={skill} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-semibold text-white/60">
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-xs text-white/40 italic line-clamp-3">
                "{resource.notes}"
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2 text-[10px] uppercase font-bold tracking-widest">
                <Mail size={14} className="text-nexus-purple" />
                Email
              </Button>
              <a href={resource.website} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="ghost" size="sm" className="w-full gap-2 text-[10px] uppercase font-bold tracking-widest border border-white/5">
                  <Globe size={14} className="text-nexus-cyan" />
                  Site
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
