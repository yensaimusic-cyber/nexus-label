
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, 
  Music2, 
  Users, 
  Disc, 
  FileText, 
  BarChart3, 
  Download, 
  Mail, 
  MoreVertical, 
  ExternalLink,
  Plus,
  ArrowLeft,
  Filter,
  Calendar,
  Camera,
  ChevronRight,
  ArrowUpDown,
  ListFilter,
  Layers,
  Video,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Artist, Project, TeamMember, Asset, ProjectType } from '../types';
import { supabase } from '../lib/supabase';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const INITIAL_MOCK_ARTIST: Artist = {
  id: 'a1',
  name: 'Luna Solaris',
  stage_name: 'Solaris',
  bio: 'Rising synth-pop artist from Berlin, exploring the intersection of neon aesthetics and deep emotional narratives. Known for ethereal vocals and cutting-edge production.',
  avatar_url: 'https://picsum.photos/seed/solaris/400',
  cover_url: 'https://picsum.photos/seed/solaris_cover/1200/400',
  spotify_id: 'solaris_official',
  instagram_handle: '@solaris_music',
  status: 'active'
};

const MOCK_PROJECTS: Project[] = [
  { id: '1', artist_id: 'a1', title: 'Neon Pulse', type: 'album', release_date: '2024-11-20', status: 'production', budget: 15000, spent: 4500, progress: 35 },
  { id: '5', artist_id: 'a1', title: 'The Void', type: 'single', release_date: '2024-12-01', status: 'pre_production', budget: 2000, spent: 200, progress: 15 },
];

// Fixed role to be string[] and added missing skills property to comply with TeamMember interface
const MOCK_TEAM: TeamMember[] = [
  { id: 'tm1', user_id: 'u1', artist_id: 'a1', role: ['Manager'], skills: ['Management'], full_name: 'Alex Rivera', email: 'alex@nexus.com', avatar_url: 'https://picsum.photos/seed/alex/100' },
  { id: 'tm2', user_id: 'u2', artist_id: 'a1', role: ['A&R'], skills: ['Scouting'], full_name: 'Sarah Chen', email: 'sarah@nexus.com', avatar_url: 'https://picsum.photos/seed/sarah/100' },
  { id: 'tm3', user_id: 'u3', artist_id: 'a1', role: ['Sound Engineer'], skills: ['Mixing'], full_name: 'Marcus Volt', email: 'marcus@nexus.com', avatar_url: 'https://picsum.photos/seed/marcus/100' },
  { id: 'tm4', user_id: 'u4', artist_id: 'a1', role: ['Graphiste'], skills: ['Design'], full_name: 'Elena Ray', email: 'elena@nexus.com', avatar_url: 'https://picsum.photos/seed/elena/100' },
];

const MOCK_ASSETS: Asset[] = [
  { id: 'as1', artist_id: 'a1', name: 'Official EPK 2024', type: 'epk', url: '#', size: '12.4 MB' },
  { id: 'as2', artist_id: 'a1', name: 'Press Kit Photos', type: 'photo', url: '#', size: '45.0 MB' },
  { id: 'as3', artist_id: 'a1', name: 'Main Logo Pack (Vector)', type: 'logo', url: '#', size: '2.1 MB' },
];

const STATS_DATA = [
  { date: '2024-01', listeners: 120000, streams: 450000 },
  { date: '2024-02', listeners: 145000, streams: 510000 },
  { date: '2024-03', listeners: 138000, streams: 490000 },
  { date: '2024-04', listeners: 190000, streams: 720000 },
  { date: '2024-05', listeners: 250000, streams: 1100000 },
  { date: '2024-06', listeners: 320000, streams: 1500000 },
];

const PROJECT_TEMPLATES = [
  { 
    id: 'ep_3_tracks', 
    name: 'EP 3 Tracks', 
    type: 'ep' as ProjectType, 
    description: 'Auto-create 3 tracks + recording tasks', 
    icon: <Layers size={20} />,
    defaultBudget: 4500
  },
  { 
    id: 'single_video', 
    name: 'Single + Video', 
    type: 'single' as ProjectType, 
    description: 'Track + Music Video production workflow', 
    icon: <Video size={20} />,
    defaultBudget: 6000
  }
];

type TabType = 'projects' | 'team' | 'assets' | 'stats';

export const ArtistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artistData, setArtistData] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  
  // Team states
  const [teamRoleFilter, setTeamRoleFilter] = useState<string>('All');
  const [teamSortBy, setTeamSortBy] = useState<'name' | 'role'>('name');
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectSource, setProjectSource] = useState<'manual' | 'template'>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'single' as ProjectType,
    release_date: '',
    budget: '',
    templateId: ''
  });

  // Charger l'artiste depuis Supabase
  useEffect(() => {
    if (id) {
      fetchArtist();
    }
  }, [id]);

  const fetchArtist = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setArtistData(data);
      }
    } catch (error) {
      console.error('Error fetching artist:', error);
      alert('Failed to load artist details.');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'projects', label: 'Projets', icon: <Disc size={18} /> },
    { id: 'team', label: 'Équipe', icon: <Users size={18} /> },
    { id: 'assets', label: 'Assets', icon: <FileText size={18} /> },
    { id: 'stats', label: 'Stats', icon: <BarChart3 size={18} /> },
  ];

  const teamRoles = useMemo(() => {
    // Fixed to use flatMap for string array role to extract unique roles
    const roles = Array.from(new Set(MOCK_TEAM.flatMap(m => m.role)));
    return ['All', ...roles];
  }, []);

  const processedTeam = useMemo(() => {
    let result = [...MOCK_TEAM];
    
    // Filter by role
    if (teamRoleFilter !== 'All') {
      // Fixed filter for string array role
      result = result.filter(m => m.role.includes(teamRoleFilter));
    }
    
    // Sort logic
    result.sort((a, b) => {
      if (teamSortBy === 'role') {
        // Fixed comparison for string array role by using the primary (first) role
        const roleA = a.role[0] || '';
        const roleB = b.role[0] || '';
        const roleCompare = roleA.localeCompare(roleB);
        return roleCompare !== 0 ? roleCompare : a.full_name.localeCompare(b.full_name);
      }
      return a.full_name.localeCompare(b.full_name);
    });
    
    return result;
  }, [teamRoleFilter, teamSortBy]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Project Created:', { ...formData, source: projectSource });
    setIsNewProjectModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setProjectSource('manual');
    setFormData({
      title: '',
      type: 'single',
      release_date: '',
      budget: '',
      templateId: ''
    });
  };

  const handleApplyTemplate = (template: typeof PROJECT_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      templateId: template.id,
      type: template.type,
      budget: template.defaultBudget.toString(),
      title: `New ${template.name}`
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && artistData) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setArtistData(prev => prev ? ({
          ...prev,
          avatar_url: reader.result as string
        }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/40 font-heading text-xl">Loading artist...</div>
      </div>
    );
  }

  // Artist not found
  if (!artistData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-white/40 font-heading text-xl">Artist not found</div>
        <Link to="/artists">
          <Button variant="primary">Back to Artists</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* Hero Header */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img 
          src={artistData.cover_url || 'https://picsum.photos/1200/400'} 
          alt="Cover" 
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark via-nexus-dark/40 to-transparent" />
        
        <div className="absolute top-8 left-8">
          <Link to="/artists">
            <Button variant="ghost" size="sm" className="gap-2 backdrop-blur-md bg-white/5 border border-white/10">
              <ArrowLeft size={16} />
              <span>Retour aux artistes</span>
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col md:flex-row items-end gap-6">
          <div className="relative group shrink-0 z-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-nexus-surface shadow-2xl"
            >
              <img src={artistData.avatar_url || 'https://picsum.photos/200'} alt={artistData.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </motion.div>
            
            <button 
              onClick={handleAvatarClick}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl nexus-gradient text-white shadow-lg shadow-purple-500/40 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
              title="Changer l'avatar"
            >
              <Camera size={18} />
            </button>
          </div>
          
          <div className="flex-1 space-y-2 z-10">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight">{artistData.name}</h1>
              <span className="px-2 py-0.5 rounded-md bg-nexus-green/20 text-nexus-green text-[10px] font-mono uppercase font-bold border border-nexus-green/30">
                {artistData.status}
              </span>
            </div>
            <p className="text-nexus-lightGray max-w-2xl line-clamp-2 text-sm">
              {artistData.bio || 'No bio available'}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="flex items-center gap-1.5 text-nexus-pink hover:text-nexus-pink/80 transition-colors text-xs font-medium">
                <Instagram size={14} />
                {artistData.instagram_handle || '@artist'}
              </a>
              <a href="#" className="flex items-center gap-1.5 text-nexus-green hover:text-nexus-green/80 transition-colors text-xs font-medium">
                <Music2 size={14} />
                Spotify
              </a>
            </div>
          </div>

          <div className="flex gap-3 z-10">
            <Button variant="outline" size="sm" className="gap-2">
              <MoreVertical size={16} />
              Actions
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="gap-2"
              onClick={() => { resetForm(); setIsNewProjectModalOpen(true); }}
            >
              <Plus size={16} />
              Nouveau Projet
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-8 mt-8 sticky top-20 z-30">
        <div className="glass p-1 rounded-2xl flex w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold ${
                activeTab === tab.id ? 'text-white' : 'text-nexus-lightGray hover:text-white'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={activeTab === tab.id ? 'text-nexus-purple' : ''}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8 pb-20 max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_PROJECTS.map((project) => (
                  <Card key={project.id} className="hover:border-nexus-purple/40 transition-all group overflow-hidden">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-xl border border-white/5">
                        <img src={`https://picsum.photos/seed/${project.id}/100`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{project.title}</h4>
                        <p className="text-xs text-nexus-cyan font-mono uppercase tracking-widest">{project.type}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-mono">
                        <span>Progression</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          className="h-full nexus-gradient" 
                        />
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] bg-nexus-purple/10 text-nexus-purple px-2 py-0.5 rounded uppercase font-bold w-fit">
                            {project.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-white/30 font-mono">{project.release_date}</span>
                        </div>
                        <Link to={`/projects/${project.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2 text-xs border border-white/5 hover:border-nexus-purple/50 bg-white/5 hover:bg-white/10"
                            title="View Project Details"
                          >
                            <span>Détails</span>
                            <ChevronRight size={14} className="text-nexus-purple" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
                <div 
                  onClick={() => { resetForm(); setIsNewProjectModalOpen(true); }}
                  className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-nexus-purple/20 transition-all cursor-pointer group min-h-[200px]"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-nexus-purple/10 group-hover:scale-110 transition-all">
                    <Plus className="text-white/20 group-hover:text-nexus-purple" />
                  </div>
                  <p className="text-sm font-semibold text-white/20 group-hover:text-white/40">Nouveau Projet</p>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-3xl border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-nexus-purple/10 text-nexus-purple shadow-lg shadow-purple-500/10">
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white leading-none mb-1">Équipe de Production</h4>
                      <p className="text-xs text-nexus-lightGray font-mono uppercase tracking-wider">
                        Displaying {processedTeam.length} member(s)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest hidden sm:inline">Filtrer</span>
                      <div className="relative">
                        <ListFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-cyan pointer-events-none" />
                        <select 
                          value={teamRoleFilter}
                          onChange={(e) => setTeamRoleFilter(e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-nexus-purple transition-all appearance-none cursor-pointer hover:bg-white/10"
                        >
                          {teamRoles.map(role => (
                            <option key={role} value={role} className="bg-nexus-surface text-white">{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest hidden sm:inline">Trier</span>
                      <div className="relative">
                        <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-purple pointer-events-none" />
                        <select 
                          value={teamSortBy}
                          onChange={(e) => setTeamSortBy(e.target.value as 'name' | 'role')}
                          className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-nexus-purple transition-all appearance-none cursor-pointer hover:bg-white/10"
                        >
                          <option value="name" className="bg-nexus-surface">Nom (A-Z)</option>
                          <option value="role" className="bg-nexus-surface">Rôle (A-Z)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedTeam.map((member) => (
                    <Card key={member.id} className="group overflow-hidden border-white/5 hover:border-nexus-purple/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-nexus-purple/20 shadow-xl shadow-black/20">
                          <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg group-hover:text-nexus-cyan transition-colors">{member.full_name}</h4>
                          <div className="flex items-center gap-2">
                            {/* Fixed role to join array elements for display */}
                            <span className="text-[10px] text-nexus-purple font-mono tracking-widest uppercase bg-nexus-purple/10 px-2 py-0.5 rounded">
                              {member.role.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center gap-3">
                        <Button variant="outline" size="sm" className="flex-1 gap-2 text-xs h-10 border-white/10 bg-white/[0.02]">
                          <Mail size={14} className="text-nexus-purple" />
                          Message
                        </Button>
                        <Button variant="ghost" size="sm" className="aspect-square p-0 w-10 h-10 rounded-xl border border-white/5 hover:border-nexus-purple/50">
                          <MoreVertical size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {processedTeam.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-nexus-lightGray opacity-30 italic">Aucun membre ne correspond à ce filtre.</p>
                    </div>
                  )}

                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 hover:border-nexus-purple/20 transition-all cursor-pointer group min-h-[180px]"
                  >
                    <Plus className="text-white/10 group-hover:text-nexus-purple mb-2 transition-colors" />
                    <p className="text-sm font-semibold text-white/10 group-hover:text-white/30">Ajouter un membre</p>
                  </motion.div>
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="space-y-4">
                {MOCK_ASSETS.map((asset) => (
                  <div key={asset.id} className="glass p-4 rounded-2xl flex items-center justify-between group hover:border-nexus-purple/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-nexus-purple/10 text-nexus-purple group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{asset.name}</h4>
                        <p className="text-[10px] text-white/30 font-mono uppercase">{asset.type} • {asset.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download size={14} />
                        Download
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2">
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-2 border-dashed border-white/5 rounded-2xl p-6 text-center hover:border-nexus-purple/20 transition-colors cursor-pointer group">
                  <Plus className="mx-auto text-white/20 mb-2 group-hover:text-nexus-purple transition-colors" />
                  <p className="text-xs font-semibold text-white/20">Upload Asset</p>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading font-bold text-lg">Spotify Monthly Listeners</h3>
                      <span className="text-nexus-green text-xs font-mono font-bold">+24% ↑</span>
                    </div>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={STATS_DATA}>
                          <defs>
                            <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="listeners" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorListeners)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-nexus-lightGray uppercase font-mono tracking-widest">Current Total</p>
                        <p className="text-2xl font-bold font-heading">320,452</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-nexus-lightGray uppercase font-mono tracking-widest">Growth Peak</p>
                        <p className="text-lg font-bold font-mono">May 2024</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading font-bold text-lg">Total Streams Growth</h3>
                      <span className="text-nexus-green text-xs font-mono font-bold">+18.5% ↑</span>
                    </div>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={STATS_DATA}>
                          <defs>
                            <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="streams" stroke="#06B6D4" fillOpacity={1} fill="url(#colorStreams)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-nexus-lightGray uppercase font-mono tracking-widest">Total Streams</p>
                        <p className="text-2xl font-bold font-heading">4.27M</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-nexus-lightGray uppercase font-mono tracking-widest">Global Rank</p>
                        <p className="text-lg font-bold font-mono">#1,402</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* New Project Modal */}
      <Modal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Nouveau Projet"
      >
        <div className="space-y-6">
          {/* Source Toggle */}
          <div className="flex glass p-1 rounded-xl">
            <button 
              onClick={() => { setProjectSource('manual'); resetForm(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${projectSource === 'manual' ? 'bg-nexus-purple text-white' : 'text-white/40 hover:text-white'}`}
            >
              Projet Vierge
            </button>
            <button 
              onClick={() => setProjectSource('template')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${projectSource === 'template' ? 'bg-nexus-purple text-white' : 'text-white/40 hover:text-white'}`}
            >
              Templates NEXUS
            </button>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-6">
            {projectSource === 'template' && (
              <div className="grid grid-cols-1 gap-3">
                <p className="text-[10px] font-mono uppercase text-white/30 tracking-widest mb-1">Choisir un Template</p>
                {PROJECT_TEMPLATES.map((template) => (
                  <div 
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                      formData.templateId === template.id 
                        ? 'bg-nexus-purple/20 border-nexus-purple shadow-lg shadow-purple-500/10' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${formData.templateId === template.id ? 'bg-nexus-purple text-white' : 'bg-white/5 text-white/40'}`}>
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-white">{template.name}</h4>
                        {formData.templateId === template.id && <Sparkles size={14} className="text-nexus-cyan animate-pulse" />}
                      </div>
                      <p className="text-[10px] text-white/40">{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-nexus-lightGray tracking-wider">Titre du Projet</label>
              <input 
                required
                type="text" 
                placeholder="ex: Neon Pulse"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple focus:ring-1 focus:ring-nexus-purple transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-nexus-lightGray tracking-wider">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple transition-all appearance-none"
                >
                  <option value="single" className="bg-nexus-surface">Single</option>
                  <option value="ep" className="bg-nexus-surface">EP</option>
                  <option value="album" className="bg-nexus-surface">Album</option>
                  <option value="mixtape" className="bg-nexus-surface">Mixtape</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-nexus-lightGray tracking-wider">Date de Sortie</label>
                <div className="relative">
                  <input 
                    required
                    type="date" 
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-nexus-lightGray tracking-wider">Budget (€)</label>
              <input 
                required
                type="number" 
                placeholder="ex: 5000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                className="flex-1"
                onClick={() => setIsNewProjectModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Créer le Projet
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
