
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { 
  Users, Disc, CheckSquare, TrendingUp, Clock, ArrowUpRight, Activity, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    artistsCount: 0,
    activeProjects: 0,
    pendingTasks: 0,
    totalStreams: '1.4M',
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
      const { count: artistsCount } = await supabase.from('artists').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'fin');
      const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'done');

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

      const { data: proj } = await supabase.from('projects').select('*, artist:artists(stage_name)').order('created_at', { ascending: false }).limit(3);
      setRecentProjects(proj || []);

      const { data: tasks } = await supabase.from('tasks').select('*, project:projects(title)').neq('status', 'done').order('due_date', { ascending: true }).limit(5);
      setUpcomingTasks(tasks || []);

    } catch (err: any) {
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Lun', streams: 4200 }, { name: 'Mar', streams: 5100 }, { name: 'Mer', streams: 4800 },
    { name: 'Jeu', streams: 7200 }, { name: 'Ven', streams: 8100 }, { name: 'Sam', streams: 9500 }, { name: 'Dim', streams: 11000 },
  ];

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center"><Loader2 className="animate-spin text-nexus-purple" size={48} /><p className="mt-4 text-[10px] font-mono uppercase text-white/30">Lancement du Centre de Commandement...</p></div>;

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Tableau de Bord</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Aperçu opérationnel pour <span className="text-nexus-purple font-semibold">Nexus Label</span>.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Artistes Actifs', value: stats.artistsCount, icon: <Users size={20} />, color: 'purple' },
          { label: 'Projets en cours', value: stats.activeProjects, icon: <Disc size={20} />, color: 'cyan' },
          { label: 'Tâches en attente', value: stats.pendingTasks, icon: <CheckSquare size={20} />, color: 'pink' },
          { label: 'Total Streams', value: stats.totalStreams, icon: <TrendingUp size={20} />, color: 'green' },
        ].map((stat, i) => (
          <Card key={i} className="p-5 lg:p-6 border-white/5 hover:border-nexus-purple/40 transition-all">
            <div className={`p-3 rounded-2xl bg-nexus-${stat.color}/10 text-nexus-${stat.color} w-fit mb-4`}>{stat.icon}</div>
            <h3 className="text-white/30 text-[10px] font-mono uppercase tracking-[0.2em] font-bold mb-1">{stat.label}</h3>
            <p className="text-2xl lg:text-4xl font-bold font-heading tracking-tighter">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-8 flex flex-col">
          <h3 className="font-heading font-extrabold text-xl mb-10 flex items-center gap-3">Performance du Label <span className="text-[10px] text-nexus-green">+12.4% ↑</span></h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs><linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" stroke="#ffffff15" fontSize={10} />
                <YAxis stroke="#ffffff15" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="streams" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorStreams)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-8">
          <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest text-white/50">Deadlines urgentes</h3>
          <div className="space-y-4">
            {upcomingTasks.map((task, i) => (
              <div key={i} className="flex gap-4 items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <Clock size={18} className="text-nexus-orange" />
                <div><p className="text-xs font-bold">{task.title}</p><p className="text-[9px] text-white/30 uppercase">{task.due_date} • {task.project?.title}</p></div>
              </div>
            ))}
            {upcomingTasks.length === 0 && <p className="text-xs text-center text-white/20 py-20 italic">Aucune tâche urgente.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
