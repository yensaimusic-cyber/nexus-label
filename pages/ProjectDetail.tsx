
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Disc, CheckSquare, Calendar, Users, 
  MessageSquare, Settings, Play, Pause, Download,
  MoreVertical, Plus, Clock, DollarSign, Share2,
  Instagram, Youtube, Music, Send, FileText
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Waveform } from '../components/features/Waveform';
import { Project, Track, Task, ContentPost } from '../types';

const MOCK_PROJECT: Project = {
  id: '1',
  artist_id: 'a1',
  title: 'Neon Pulse',
  type: 'album',
  release_date: '2024-11-20',
  status: 'production',
  budget: 15000,
  spent: 4500,
  progress: 35,
  cover_url: 'https://picsum.photos/seed/project1/600'
};

const MOCK_TRACKS: Track[] = [
  { id: 't1', project_id: '1', title: 'Intro: Midnight', duration: 184, status: 'mix_approved', bpm: 124, key: 'Am' },
  { id: 't2', project_id: '1', title: 'Neon Pulse (feat. Solaris)', duration: 215, status: 'mixing_v2', bpm: 128, key: 'Cm' },
  { id: 't3', project_id: '1', title: 'Electric Dreams', duration: 198, status: 'recording', bpm: 120, key: 'G' },
  { id: 't4', project_id: '1', title: 'City Lights', duration: 240, status: 'demo', bpm: 95, key: 'F#m' },
];

const MOCK_CONTENT: ContentPost[] = [
  { id: 'c1', project_id: '1', platform: 'instagram', type: 'reel', scheduled_date: '2024-10-25', status: 'production', title: 'Behind the Scenes: Recording' },
  { id: 'c2', project_id: '1', platform: 'tiktok', type: 'video', scheduled_date: '2024-11-01', status: 'idea', title: 'Neon Pulse Challenge' },
  { id: 'c3', project_id: '1', platform: 'youtube', type: 'video', scheduled_date: '2024-11-20', status: 'scheduled', title: 'Official Music Video' },
];

export const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'tracks' | 'tasks' | 'content' | 'team' | 'timeline'>('tracks');
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<string | null>(null);

  const togglePlay = (trackId: string) => {
    setCurrentPlayingTrack(currentPlayingTrack === trackId ? null : trackId);
  };

  const tabs = [
    { id: 'tracks', label: 'Tracks', icon: <Music size={16} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} /> },
    { id: 'content', label: 'Promotion', icon: <Share2 size={16} /> },
    { id: 'team', label: 'Team', icon: <Users size={16} /> },
    { id: 'timeline', label: 'History', icon: <Clock size={16} /> },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Hero */}
      <div className="flex flex-col gap-6">
        <Link to="/projects" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors w-fit">
          <ArrowLeft size={16} />
          <span className="text-sm font-semibold uppercase tracking-widest font-mono">Back to Pipeline</span>
        </Link>

        <div className="relative group rounded-3xl overflow-hidden glass border-white/10 p-8 flex flex-col md:flex-row gap-8">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Disc size={240} className="animate-[spin_10s_linear_infinite]" />
          </div>

          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative z-10 shrink-0">
            <img src={MOCK_PROJECT.cover_url} alt="Cover" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 space-y-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-nexus-purple/20 text-nexus-purple text-[10px] font-mono font-bold uppercase border border-nexus-purple/30">
                    {MOCK_PROJECT.type}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-nexus-cyan/20 text-nexus-cyan text-[10px] font-mono font-bold uppercase border border-nexus-cyan/30">
                    {MOCK_PROJECT.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-4xl font-heading font-extrabold text-white">{MOCK_PROJECT.title}</h2>
                <p className="text-nexus-lightGray">Release scheduled for <span className="text-white font-semibold">{MOCK_PROJECT.release_date}</span></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2"><Settings size={16} /> Edit</Button>
                <Button variant="primary" size="sm" className="gap-2"><Share2 size={16} /> Share</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-mono text-white/40">
                  <span>Overall Progress</span>
                  <span>{MOCK_PROJECT.progress}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${MOCK_PROJECT.progress}%` }} className="h-full nexus-gradient" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-mono text-white/40">
                  <span>Budget Spent</span>
                  <span>{Math.round((MOCK_PROJECT.spent / MOCK_PROJECT.budget) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(MOCK_PROJECT.spent / MOCK_PROJECT.budget) * 100}%` }} className="h-full bg-nexus-green" />
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="p-2 rounded-lg bg-nexus-green/10 text-nexus-green"><DollarSign size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-mono text-white/40 leading-none">Remaining</p>
                  <p className="text-lg font-bold font-heading text-white">${MOCK_PROJECT.budget - MOCK_PROJECT.spent}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 p-1 glass rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="min-h-[400px]"
        >
          {activeTab === 'tracks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <h3 className="font-heading font-bold text-xl">Tracklist</h3>
                <Button variant="outline" size="sm" className="gap-2"><Plus size={16} /> Add Track</Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {MOCK_TRACKS.map((track, i) => (
                  <Card key={track.id} className="hover:border-nexus-purple/40 transition-all">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <button 
                        onClick={() => togglePlay(track.id)}
                        className="w-12 h-12 rounded-full nexus-gradient flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
                      >
                        {currentPlayingTrack === track.id ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white/20 font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                          <h4 className="font-bold text-white text-lg truncate">{track.title}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{track.status.replace('_', ' ')}</span>
                          <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                          <span>{track.bpm} BPM</span>
                          <span>Key: {track.key}</span>
                        </div>
                      </div>

                      <div className="hidden lg:block w-64 h-12 opacity-50">
                        <Waveform isPlaying={currentPlayingTrack === track.id} color={currentPlayingTrack === track.id ? '#8B5CF6' : '#ffffff20'} bars={30} />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="p-2"><MessageSquare size={18} /></Button>
                        <Button variant="ghost" size="sm" className="p-2"><Download size={18} /></Button>
                        <Button variant="ghost" size="sm" className="p-2"><MoreVertical size={18} /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_CONTENT.map(post => (
                <Card key={post.id} className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl bg-white/5 text-nexus-${post.platform === 'instagram' ? 'pink' : post.platform === 'tiktok' ? 'cyan' : 'red'}`}>
                      {post.platform === 'instagram' ? <Instagram size={24} /> : post.platform === 'tiktok' ? <Music size={24} /> : <Youtube size={24} />}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-nexus-purple/10 text-nexus-purple border border-nexus-purple/20 font-bold uppercase">{post.status}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{post.title}</h4>
                    <p className="text-xs text-white/40 font-mono uppercase tracking-widest">{new Date(post.scheduled_date).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-auto w-full">Edit Content</Button>
                </Card>
              ))}
              <div className="border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 hover:border-nexus-purple/20 transition-all cursor-pointer group">
                 <Plus className="text-white/20 group-hover:text-nexus-purple mb-2" />
                 <p className="text-sm font-semibold text-white/20">Add Promo Slot</p>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="glass p-8 rounded-3xl text-center border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-nexus-purple/10 text-nexus-purple">
                <CheckSquare size={48} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Manage Project Tasks</h3>
                <p className="text-nexus-lightGray">Track recordings, mixing sessions, and artwork creation.</p>
              </div>
              <Link to="/tasks">
                <Button variant="primary">Go to Kanban Board</Button>
              </Link>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Alex Rivera', role: 'A&R Manager', avatar: 'https://picsum.photos/seed/alex/100' },
                { name: 'Sarah Chen', role: 'Lead Engineer', avatar: 'https://picsum.photos/seed/sarah/100' },
                { name: 'Marcus Volt', role: 'Visual Artist', avatar: 'https://picsum.photos/seed/marcus/100' }
              ].map((member, i) => (
                <Card key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                    <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold">{member.name}</h4>
                    <p className="text-xs text-nexus-cyan font-mono uppercase">{member.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {[
                { time: '2h ago', user: 'Alex R.', action: 'approved the master of Neon Pulse', icon: <Music /> },
                { time: 'Yesterday', user: 'Marcus V.', action: 'uploaded 3 new cover concepts', icon: <FileText /> },
                { time: '2 days ago', user: 'Sarah C.', action: 'completed vocal tracking session', icon: <Music /> },
                { time: 'Last week', user: 'Alex R.', action: 'allocated $2,000 for social media ads', icon: <DollarSign /> }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-nexus-purple/10 text-nexus-purple flex items-center justify-center border border-nexus-purple/20 z-10">
                      {item.icon}
                    </div>
                    {i !== 3 && <div className="w-0.5 flex-1 bg-white/5 my-2" />}
                  </div>
                  <div className="pb-8">
                    <p className="text-xs text-white/30 font-mono mb-1 uppercase tracking-widest">{item.time}</p>
                    <p className="text-sm text-nexus-lightGray">
                      <span className="text-white font-bold">{item.user}</span> {item.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
