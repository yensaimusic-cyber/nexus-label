
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { 
  Users, Disc, CheckSquare, TrendingUp, Clock, ArrowUpRight, Activity, Loader2, Wallet
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeArtists: 0,
    activeProjects: 0,
    overdueTasks: 0,
    totalBudget: 0,
    totalSpent: 0
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Nombre d'artistes actifs
      const { count: artistCount } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      // Projets en cours (période de production active)
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['rec', 'mix', 'master', 'prepa_promo']);
      
      // Tâches en retard (date passée et non terminée)
      const today = new Date().toISOString().split('T')[0];
      const { count: overdueCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .neq('status', 'done');
      
      // Budget total et dépensé cumulé
      const { data: budgetData } = await supabase
        .from('projects')
        .select('budget, spent');
      
      const totalBudget = budgetData?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0;
      const totalSpent = budgetData?.reduce((sum, p) => sum + (Number(p.spent) || 0), 0) || 0;

      setStats({
        activeArtists: artistCount || 0,
        activeProjects: projectCount || 0,
        overdueTasks: overdueCount || 0,
        totalBudget,
        totalSpent
      });

      // Projets récents
      const { data: proj } = await supabase
        .from('projects')
        .select('*, artist:artists(stage_name)')
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentProjects(proj || []);

      // Prochaines tâches
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*, project:projects(title)')
        .neq('status', 'done')
        .order('due_date', { ascending: true })
        .limit(5);
      setUpcomingTasks(tasks || []);

    } catch (err: any) {
      console.error("Erreur stats dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Lun', streams: 4200 }, { name: 'Mar', streams: 5100 }, { name: 'Mer', streams: 4800 },
    { name: 'Jeu', streams: 7200 }, { name: 'Ven', streams: 8100 }, { name: 'Sam', streams: 9500 }, { name: 'Dim', streams: 11000 },
  ];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-nexus-purple" size={48} />
      <p className="mt-4 text-[10px] font-mono uppercase text-white/30 tracking-widest">Initialisation du Centre de Commandement...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Tableau de Bord</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Aperçu opérationnel de <span className="text-nexus-purple font-semibold">Nexus Label</span>.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="p-5 lg:p-6 border-white/5 hover:border-nexus-purple/40 transition-all">
          <div className="p-3 rounded-2xl bg-nexus-purple/10 text-nexus-purple w-fit mb-4"><Users size={20} /></div>
          <h3 className="text-white/30 text-[10px] font-mono uppercase tracking-[0.2em] font-bold mb-1">Artistes Actifs</h3>
          <p className="text-2xl lg:text-4xl font-bold font-heading tracking-tighter">{stats.activeArtists}</p>
        </Card>

        <Card className="p-5 lg:p-6 border-white/5 hover:border-nexus-cyan/40 transition-all">
          <div className="p-3 rounded-2xl bg-nexus-cyan/10 text-nexus-cyan w-fit mb-4"><Disc size={20} /></div>
          <h3 className="text-white/30 text-[10px] font-mono uppercase tracking-[0.2em] font-bold mb-1">Projets en cours</h3>
          <p className="text-2xl lg:text-4xl font-bold font-heading tracking-tighter">{stats.activeProjects}</p>
        </Card>

        <Card className="p-5 lg:p-6 border-white/5 hover:border-nexus-pink/40 transition-all">
          <div className="p-3 rounded-2xl bg-nexus-pink/10 text-nexus-pink w-fit mb-4"><CheckSquare size={20} /></div>
          <h3 className="text-white/30 text-[10px] font-mono uppercase tracking-[0.2em] font-bold mb-1">Tâches en retard</h3>
          <p className={`text-2xl lg:text-4xl font-bold font-heading tracking-tighter ${stats.overdueTasks > 0 ? 'text-nexus-red' : ''}`}>{stats.overdueTasks}</p>
        </Card>

        <Card className="p-5 lg:p-6 border-white/5 hover:border-nexus-green/40 transition-all">
          <div className="p-3 rounded-2xl bg-nexus-green/10 text-nexus-green w-fit mb-4"><Wallet size={20} /></div>
          <h3 className="text-white/30 text-[10px] font-mono uppercase tracking-[0.2em] font-bold mb-1">Budget consommé</h3>
          <p className="text-xl lg:text-2xl font-bold font-heading tracking-tighter truncate">
            {stats.totalSpent.toLocaleString()}€ <span className="text-white/20 text-sm font-sans font-normal">/ {stats.totalBudget.toLocaleString()}€</span>
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-8 flex flex-col shadow-2xl">
          <h3 className="font-heading font-extrabold text-xl mb-10 flex items-center gap-3">Performance Global <span className="text-[10px] text-nexus-green bg-nexus-green/10 px-2 py-0.5 rounded-full font-bold">+12.4% ↑</span></h3>
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" stroke="#ffffff15" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff15" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                  itemStyle={{ color: '#8B5CF6', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="streams" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorStreams)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 shadow-2xl flex flex-col">
          <h3 className="font-heading font-bold text-lg mb-8 uppercase tracking-widest text-white/50 border-b border-white/5 pb-4">Prochaines Deadlines</h3>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {upcomingTasks.map((task, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-nexus-purple/30 transition-all group"
              >
                <div className={`p-2.5 rounded-xl ${new Date(task.due_date) < new Date() ? 'bg-nexus-red/10 text-nexus-red' : 'bg-nexus-orange/10 text-nexus-orange'}`}>
                  <Clock size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-nexus-cyan transition-colors truncate">{task.title}</p>
                  <p className="text-[9px] text-white/30 uppercase font-mono tracking-tighter mt-1">{task.due_date} • {task.project?.title}</p>
                </div>
              </motion.div>
            ))}
            {upcomingTasks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                <CheckSquare size={48} className="mb-4" />
                <p className="text-xs italic">Aucune tâche planifiée</p>
              </div>
            )}
          </div>
          <button className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-nexus-purple transition-colors">Voir tout le planning →</button>
        </Card>
      </div>
    </div>
  );
};
