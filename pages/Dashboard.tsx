
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { 
  Users, Disc, CheckSquare, TrendingUp, Clock, ArrowUpRight, Activity, Loader2, Wallet,
  AlertCircle, ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeArtists: 0,
    activeProjects: 0,
    overdueTasksCount: 0,
    totalBudget: 0,
    totalSpent: 0
  });
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Stats Globales
      const [artistsCount, projectsCount, budgetData] = await Promise.all([
        supabase.from('artists').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).in('status', ['production', 'post_production']),
        supabase.from('projects').select('budget, spent')
      ]);

      // All active tasks
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*, project:projects(title, artist:artists(stage_name)), assignee:profiles(full_name, avatar_url)')
        .neq('status', 'done');

      const tasks = (allTasks || []) as Task[];

      // Filter Overdue: (due_date < today AND status != done) OR priority = overdue
      const overdue = tasks.filter(t => (t.due_date && t.due_date < today) || t.priority === 'overdue');
      
      // Filter Urgent: priority = urgent AND status != done
      const urgent = tasks.filter(t => t.priority === 'urgent');

      const totalBudget = budgetData.data?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0;
      const totalSpent = budgetData.data?.reduce((sum, p) => sum + (Number(p.spent) || 0), 0) || 0;

      setStats({
        activeArtists: artistsCount.count || 0,
        activeProjects: projectsCount.count || 0,
        overdueTasksCount: overdue.length,
        totalBudget,
        totalSpent
      });

      setOverdueTasks(overdue.slice(0, 5));
      setUrgentTasks(urgent.slice(0, 5));

    } catch (err: any) {
      console.error("Erreur stats dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-nexus-purple" size={48} />
      <p className="mt-4 text-[10px] font-mono uppercase text-white/30 tracking-widest">Calcul stratégique en cours...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header>
        <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Poste de Pilotage</h2>
        <p className="text-nexus-lightGray text-sm mt-1 uppercase tracking-widest font-mono opacity-60">Indigo Records Central Command</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="p-5 border-white/5 hover:border-nexus-purple/40">
          <div className="p-2.5 rounded-xl bg-nexus-purple/10 text-nexus-purple w-fit mb-3"><Users size={18} /></div>
          <h3 className="text-white/30 text-[9px] font-mono uppercase tracking-widest font-bold mb-1">Artistes Actifs</h3>
          <p className="text-2xl lg:text-3xl font-bold font-heading">{stats.activeArtists}</p>
        </Card>

        <Card className="p-5 border-white/5 hover:border-nexus-cyan/40">
          <div className="p-2.5 rounded-xl bg-nexus-cyan/10 text-nexus-cyan w-fit mb-3"><Disc size={18} /></div>
          <h3 className="text-white/30 text-[9px] font-mono uppercase tracking-widest font-bold mb-1">En Production</h3>
          <p className="text-2xl lg:text-3xl font-bold font-heading">{stats.activeProjects}</p>
        </Card>

        <Card className="p-5 border-white/5 hover:border-nexus-red/40">
          <div className="p-2.5 rounded-xl bg-nexus-red/10 text-nexus-red w-fit mb-3"><AlertCircle size={18} /></div>
          <h3 className="text-white/30 text-[9px] font-mono uppercase tracking-widest font-bold mb-1">Retards Détectés</h3>
          <p className={`text-2xl lg:text-3xl font-bold font-heading ${stats.overdueTasksCount > 0 ? 'text-nexus-red animate-pulse' : ''}`}>
            {stats.overdueTasksCount}
          </p>
        </Card>

        <Card className="p-5 border-white/5 hover:border-nexus-green/40">
          <div className="p-2.5 rounded-xl bg-nexus-green/10 text-nexus-green w-fit mb-3"><Wallet size={18} /></div>
          <h3 className="text-white/30 text-[9px] font-mono uppercase tracking-widest font-bold mb-1">Budget Total Label</h3>
          <p className="text-lg lg:text-xl font-bold font-heading truncate">
            {stats.totalSpent.toLocaleString()}€ <span className="text-white/20 text-[10px] font-normal font-mono">/ {stats.totalBudget.toLocaleString()}€</span>
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Overdue Section */}
        <Card className="p-6 border-nexus-red/20 bg-nexus-red/5">
          <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-nexus-red flex items-center gap-2 mb-5">
            <ShieldAlert size={16} /> 
            Alertes : En Retard
          </h3>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <div key={task.id} className="p-3 rounded-xl bg-black/40 border border-nexus-red/10 flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-nexus-red shadow-[0_0_8px_#EF4444]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{task.title}</p>
                  <p className="text-[9px] text-nexus-red font-mono uppercase mt-0.5">Échéance : {task.due_date}</p>
                </div>
                <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-white/5">
                  <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.id}/50`} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
            {overdueTasks.length === 0 && <p className="text-[10px] text-white/20 italic text-center py-4">Aucun retard critique détecté.</p>}
          </div>
        </Card>

        {/* Urgent Section */}
        <Card className="p-6 border-nexus-orange/20 bg-nexus-orange/5">
          <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-nexus-orange flex items-center gap-2 mb-5">
            <Clock size={16} /> 
            Urgences : Priorité Haute
          </h3>
          <div className="space-y-3">
            {urgentTasks.map((task) => (
              <div key={task.id} className="p-3 rounded-xl bg-black/40 border border-nexus-orange/10 flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-nexus-orange" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{task.title}</p>
                  <p className="text-[9px] text-white/40 font-mono uppercase mt-0.5">{task.project?.title || 'Nexus Internal'}</p>
                </div>
                <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-white/5">
                  <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.id}/50`} className="w-full h-full object-cover" />
                </div>
              </div>
            ))}
            {urgentTasks.length === 0 && <p className="text-[10px] text-white/20 italic text-center py-4">Opérations fluides. Aucune urgence.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
