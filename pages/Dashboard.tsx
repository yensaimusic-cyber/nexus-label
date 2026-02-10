
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { 
  Users, Disc, CheckSquare, TrendingUp, Clock, ArrowUpRight, Activity, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from 'recharts';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    artistsCount: 0,
    activeProjects: 0,
    pendingTasks: 0,
    totalStreams: '1.4M', // Mocked streams as we don't have a streaming table yet
    budgetTotal: 0,
    budgetSpent: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Counts
      const { count: artistsCount } = await supabase.from('artists').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['production', 'pre_production', 'post_production']);
      const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'done');

      // Budget
      const { data: budgetData } = await supabase.from('projects').select('budget, spent');
      const totalB = budgetData?.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0) || 0;
      const totalS = budgetData?.reduce((acc, curr) => acc + (Number(curr.spent) || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        artistsCount: artistsCount || 0,
        activeProjects: projectsCount || 0,
        pendingTasks: tasksCount || 0,
        budgetTotal: totalB,
        budgetSpent: totalS
      }));

      // Recent Projects
      const { data: proj } = await supabase.from('projects').select('*, artist:artists(stage_name)').order('created_at', { ascending: false }).limit(3);
      setRecentProjects(proj || []);

      // Upcoming Tasks
      const { data: tasks } = await supabase.from('tasks').select('*, project:projects(title)').neq('status', 'done').order('due_date', { ascending: true }).limit(5);
      setUpcomingTasks(tasks || []);

    } catch (err: any) {
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Mon', streams: 4200 }, { name: 'Tue', streams: 5100 }, { name: 'Wed', streams: 4800 },
    { name: 'Thu', streams: 7200 }, { name: 'Fri', streams: 8100 }, { name: 'Sat', streams: 9500 }, { name: 'Sun', streams: 11000 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-nexus-purple" size={48} />
        <p className="mt-4 text-[10px] font-mono tracking-widest text-white/30 uppercase">Initiating Command Center...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Command Center</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Label operations overview for <span className="text-nexus-purple font-semibold">Live Workspace</span>.</p>
        </div>
        <div className="hidden lg:flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-2.5 border border-white/10 glass shadow-xl">
          <Activity size={18} className="text-nexus-cyan animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-white/70 uppercase">Nexus Engine Live</span>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <span className="text-xs font-mono text-nexus-lightGray uppercase">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </header>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Active Artists', value: stats.artistsCount, icon: <Users size={20} />, trend: 'Roster', color: 'purple' },
          { label: 'Production Pipeline', value: stats.activeProjects, icon: <Disc size={20} />, trend: 'In-Prod', color: 'cyan' },
          { label: 'Pending Workflow', value: stats.pendingTasks, icon: <CheckSquare size={20} />, trend: 'Actions', color: 'pink' },
          { label: 'Platform Streams', value: stats.totalStreams, icon: <TrendingUp size={20} />, trend: '+15%', color: 'green' },
        ].map((stat, i) => (
          <Card key={i} className="p-5 lg:p-6 border-white/5 hover:border-nexus-purple/40 transition-all shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-nexus-${stat.color}/10 text-nexus-${stat.color} shadow-lg shadow-nexus-${stat.color}/5`}>
                {stat.icon}
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-nexus-${stat.color}/10 text-nexus-${stat.color} uppercase tracking-tighter`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-white/30 text-[10px] lg:text-xs font-mono uppercase tracking-[0.2em] font-bold mb-1">{stat.label}</h3>
            <p className="text-2xl lg:text-4xl font-bold font-heading tracking-tighter">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 min-h-[450px] flex flex-col p-8 border-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h3 className="font-heading font-extrabold text-xl flex items-center gap-3">
                Label Streaming Performance
                <span className="px-2 py-0.5 rounded-lg bg-nexus-green/10 text-nexus-green text-[10px] font-mono">+12.4% ↑</span>
              </h3>
              <p className="text-[10px] text-white/30 font-mono mt-1 uppercase tracking-widest">Aggregate platform data across active releases</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" stroke="#ffffff15" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#ffffff15" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="streams" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorStreams)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 h-full flex flex-col border-white/5">
          <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest">Urgent Deadlines</h3>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {upcomingTasks.map((task, i) => (
              <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer shadow-lg">
                <div className={`w-10 h-10 rounded-xl bg-nexus-orange/10 flex items-center justify-center shrink-0`}>
                  <Clock size={18} className="text-nexus-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{task.title}</p>
                  <p className="text-[9px] text-white/30 font-mono mt-0.5 uppercase tracking-tighter">{task.due_date || 'TBD'} • {task.project?.title}</p>
                </div>
                <ArrowUpRight size={14} className="text-white/10 group-hover:text-nexus-cyan transition-all" />
              </div>
            ))}
            {upcomingTasks.length === 0 && <p className="text-xs text-center text-white/20 py-20 italic">No urgent tasks detected.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 border-white/5">
          <h3 className="font-heading font-bold text-xl mb-8">Active Releases</h3>
          <div className="space-y-4">
            {recentProjects.map((rel, i) => (
              <div key={i} className="glass p-5 rounded-3xl border-white/5 hover:border-nexus-purple/30 transition-all group shadow-xl">
                <div className="flex justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-nexus-surface border border-white/10 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform">
                      <img src={rel.cover_url || `https://picsum.photos/seed/${rel.id}/100`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white leading-tight">{rel.title}</p>
                      <p className="text-xs text-nexus-cyan font-mono uppercase tracking-[0.2em] mt-1">{rel.artist?.stage_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono font-bold text-nexus-green uppercase tracking-widest">{rel.release_date || 'TBD'}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/30 uppercase mt-2 block border border-white/5 font-bold tracking-tighter">{rel.status}</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `45%` }} className="h-full nexus-gradient shadow-[0_0_10px_rgba(139,92,246,0.3)]" />
                </div>
              </div>
            ))}
            {recentProjects.length === 0 && <p className="text-center text-white/20 py-12">No active projects found.</p>}
          </div>
        </Card>

        <Card className="p-8 border-white/5">
          <h3 className="font-heading font-bold text-xl mb-8">Asset Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div>
                   <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mb-4">Pipeline Burn Rate</p>
                   <div className="flex items-end gap-3">
                      <p className="text-4xl font-heading font-extrabold text-white tracking-tighter">€{stats.budgetSpent}</p>
                      <p className="text-nexus-red text-[10px] font-bold mb-1.5 uppercase tracking-widest">Used Funds</p>
                   </div>
                   <div className="mt-4 h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.budgetSpent / (stats.budgetTotal || 1)) * 100}%` }} className="h-full bg-nexus-red" />
                   </div>
                </div>
                <div className="glass p-5 rounded-[24px] border-nexus-green/20 bg-nexus-green/5">
                   <p className="text-[10px] font-mono text-nexus-green uppercase tracking-widest font-black">Capital Remaining</p>
                   <p className="text-2xl font-heading font-extrabold text-white">€{stats.budgetTotal - stats.budgetSpent}</p>
                </div>
             </div>
             <div className="h-full flex items-center justify-center">
                <div className="relative w-40 h-40">
                   <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
                      <motion.circle 
                        cx="50" cy="50" r="40" stroke="#8B5CF6" strokeWidth="12" fill="none" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * (stats.budgetSpent / (stats.budgetTotal || 1)))}
                        strokeLinecap="round"
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black font-heading text-white">{Math.round((stats.budgetSpent / (stats.budgetTotal || 1)) * 100)}%</span>
                      <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Capacity</span>
                   </div>
                </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
