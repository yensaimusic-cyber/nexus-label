
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Disc, LayoutGrid, List, Plus, Search, Filter, Calendar } from 'lucide-react';
import { Project, ProjectStatus } from '../types';

const MOCK_PROJECTS: Project[] = [
  { id: '1', artist_id: 'a1', title: 'Neon Pulse', type: 'album', release_date: '2024-11-20', status: 'production', budget: 15000, spent: 4500, progress: 35 },
  { id: '2', artist_id: 'a2', title: 'Midnight City', type: 'ep', release_date: '2024-10-15', status: 'post_production', budget: 5000, spent: 4800, progress: 90 },
  { id: '3', artist_id: 'a3', title: 'Broken Silence', type: 'single', release_date: '2024-10-05', status: 'released', budget: 1200, spent: 1150, progress: 100 },
  { id: '4', artist_id: 'a4', title: 'Future Echoes', type: 'mixtape', release_date: '2025-01-10', status: 'idea', budget: 8000, spent: 0, progress: 5 },
  { id: '5', artist_id: 'a1', title: 'The Void', type: 'single', release_date: '2024-12-01', status: 'pre_production', budget: 2000, spent: 200, progress: 15 },
];

const STAGES: { label: string, value: ProjectStatus }[] = [
  { label: 'Idea', value: 'idea' },
  { label: 'Pre-Production', value: 'pre_production' },
  { label: 'Production', value: 'production' },
  { label: 'Post-Prod', value: 'post_production' },
  { label: 'Release Prep', value: 'release' },
  { label: 'Released', value: 'released' }
];

export const Projects: React.FC = () => {
  const [view, setView] = useState<'grid' | 'kanban'>('kanban');
  const [search, setSearch] = useState('');

  const filteredProjects = MOCK_PROJECTS.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white">Project Pipeline</h2>
          <p className="text-nexus-lightGray text-sm">Monitor and manage label releases from idea to launch.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="glass p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-nexus-purple text-white' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-nexus-purple text-white' : 'text-white/40 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
          <Button variant="primary" className="gap-2">
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
            placeholder="Filter projects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass rounded-xl py-2.5 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={18} />
          <span>Filters</span>
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max px-2">
          {STAGES.map((stage) => (
            <div key={stage.value} className="w-80 flex flex-col gap-4 h-full">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-nexus-purple shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  <h3 className="font-heading font-bold text-sm tracking-wide uppercase">{stage.label}</h3>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
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
      className="glass p-5 rounded-2xl border-white/5 hover:border-nexus-purple/30 group transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Disc size={16} className="text-white/20 animate-[spin_4s_linear_infinite]" />
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden shadow-xl shadow-black/40 border border-white/5 shrink-0">
          <img src={`https://picsum.photos/seed/${project.id}/100`} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div>
          <h4 className="font-bold text-white group-hover:text-nexus-cyan transition-colors line-clamp-1">{project.title}</h4>
          <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold mt-1 ${typeColors[project.type]}`}>
            {project.type}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-mono tracking-widest">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{new Date(project.release_date).toLocaleDateString()}</span>
          </div>
          <span>{project.progress}% Complete</span>
        </div>

        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            className="h-full nexus-gradient" 
          />
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-nexus-surface overflow-hidden bg-white/10">
                <img src={`https://picsum.photos/seed/user${i}/50`} className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-nexus-surface bg-nexus-surface text-[8px] flex items-center justify-center text-white/50">+2</div>
          </div>
          <div className="text-[10px] font-mono text-nexus-cyan">
            ${(project.spent / 1000).toFixed(1)}k / ${(project.budget / 1000).toFixed(1)}k
          </div>
        </div>
      </div>
    </motion.div>
  );
};
