
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MessageSquareText, Calendar, Users, ListChecks, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Meeting } from '../types';

const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Stratégie Sortie "Neon Pulse"',
    date: '2024-10-18',
    attendees: ['Alex Rivera', 'Solaris', 'Elena Ray'],
    summary: 'Validation du plan de communication TikTok et Instagram. Accord sur la date du 20 Novembre pour le lancement officiel. Discussion sur les budgets ads.',
    action_items: [
      'Contacter agence influence pour TikTok',
      'Finaliser le montage du teaser #1',
      'Réserver le studio pour le 22'
    ]
  },
  {
    id: 'm2',
    title: 'Update Production - Album Solaris',
    date: '2024-10-12',
    attendees: ['Sarah Chen', 'Marcus Volt', 'Alex Rivera'],
    summary: 'Point sur les mixages. 4 titres sont finalisés. 2 titres nécessitent un nouvel enregistrement des voix.',
    action_items: [
      'Envoyer les stems à Sarah avant Jeudi',
      'Réserver 3 sessions voix Studio B'
    ]
  }
];

export const Meetings: React.FC = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Comptes-rendus</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Archive des décisions et comptes-rendus de réunions du label.</p>
        </div>
        <Button variant="primary" className="gap-2 shadow-xl">
          <Plus size={20} />
          <span>Nouvelle Réunion</span>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher une réunion par titre ou participants..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {MOCK_MEETINGS.filter(m => m.title.toLowerCase().includes(search.toLowerCase())).map((meeting) => (
          <Card key={meeting.id} className="hover:border-nexus-purple/40 transition-all">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/3 space-y-4 border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-8">
                <div className="flex items-center gap-2 text-nexus-purple font-mono text-[10px] uppercase tracking-widest font-bold">
                  <Calendar size={14} />
                  {meeting.date}
                </div>
                <h3 className="text-xl font-bold text-white font-heading">{meeting.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Users size={14} />
                    <span>Participants:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {meeting.attendees.map(a => (
                      <span key={a} className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-semibold text-nexus-cyan border border-white/5">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-xs font-mono uppercase text-nexus-lightGray tracking-widest mb-2 flex items-center gap-2">
                    <MessageSquareText size={14} className="text-nexus-purple" />
                    Résumé
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {meeting.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-nexus-lightGray tracking-widest mb-3 flex items-center gap-2">
                    <ListChecks size={14} className="text-nexus-green" />
                    Action Items
                  </h4>
                  <ul className="space-y-2">
                    {meeting.action_items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs text-white/50 group cursor-pointer hover:text-white transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-nexus-green/50 group-hover:bg-nexus-green transition-colors" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-center">
                <Button variant="ghost" size="sm" className="p-3">
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
