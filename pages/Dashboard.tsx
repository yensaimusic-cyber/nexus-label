
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { 
  Users, Disc, CheckSquare, TrendingUp, Clock, ArrowUpRight, Activity, Loader2, Wallet,
  AlertCircle, ShieldAlert, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

interface Artist {
  id: string;
  stage_name: string;
}

interface Project {
  id: string;
  title: string;
}

interface BudgetItem {
  id: string;
  label: string;
  amount: number;
  status: 'pending' | 'paid';
  project_id: string;
  project: { title: string };
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeArtists: 0,
    activeProjects: 0,
    overdueTasksCount: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalPaid: 0,
    totalPending: 0
  });
  const [activeArtistsList, setActiveArtistsList] = useState<Artist[]>([]);
  const [activeProjectsList, setActiveProjectsList] = useState<Project[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [pendingBudgetItems, setPendingBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch active artists list
      const { data: artists } = await supabase
        .from('artists')
        .select('id, stage_name')
        .eq('status', 'active')
        .order('stage_name');

      // Fetch active projects list
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title')
        .in('status', ['production', 'post_production'])
        .order('title');

      // Fetch budget data
      const { data: budgetData } = await supabase
        .from('projects')
        .select('budget, spent');

      // Fetch pending budget items
      const { data: pendingBudgets } = await supabase
        .from('project_budgets')
        .select('id, label, amount, status, project_id, project:projects(title)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch all budget items to calculate totals
      const { data: allBudgets } = await supabase
        .from('project_budgets')
        .select('amount, status')
        .in('status', ['pending', 'paid']);

      // All active tasks
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*, project:projects(id, title, artist:artists(stage_name)), assignee:profiles(full_name, avatar_url)')
        .neq('status', 'done');

      const tasks = (allTasks || []) as Task[];

      // Filter Overdue: (due_date < today AND status != done) OR priority = overdue
      const overdue = tasks.filter(t => (t.due_date && t.due_date < today) || t.priority === 'overdue');
      
      // Filter Urgent: priority = urgent AND status != done
      const urgent = tasks.filter(t => t.priority === 'urgent');

      // Calculate budget statistics
      const totalBudget = budgetData?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0;
      const totalSpent = budgetData?.reduce((sum, p) => sum + (Number(p.spent) || 0), 0) || 0;
      const totalPaid = allBudgets?.reduce((sum, b) => sum + (b.status === 'paid' ? Number(b.amount) : 0), 0) || 0;
      const totalPending = allBudgets?.reduce((sum, b) => sum + (b.status === 'pending' ? Number(b.amount) : 0), 0) || 0;

      setStats({
        activeArtists: artists?.length || 0,
        activeProjects: projects?.length || 0,
        overdueTasksCount: overdue.length,
        totalBudget,
        totalSpent,
        totalPaid,
        totalPending
      });

      setActiveArtistsList(artists || []);
      setActiveProjectsList(projects || []);
      setOverdueTasks(overdue.slice(0, 5));
      setUrgentTasks(urgent.slice(0, 5));
      setPendingBudgetItems((pendingBudgets || []) as BudgetItem[]);

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
              <Link key={task.id} to={task.project_id ? `/projects/${task.project_id}` : '#'}>
                <div className="p-3 rounded-xl bg-black/40 border border-nexus-red/10 flex gap-3 items-center hover:border-nexus-red/40 hover:bg-black/60 transition-all cursor-pointer group">
                  <div className="w-1.5 h-1.5 rounded-full bg-nexus-red shadow-[0_0_8px_#EF4444]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-nexus-red transition-colors">{task.title}</p>
                    <p className="text-[9px] text-nexus-red font-mono uppercase mt-0.5">Échéance : {task.due_date}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-white/5">
                    <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.id}/50`} className="w-full h-full object-cover" />
                  </div>
                  <ExternalLink size={14} className="text-white/20 group-hover:text-nexus-red transition-colors shrink-0" />
                </div>
              </Link>
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
              <Link key={task.id} to={task.project_id ? `/projects/${task.project_id}` : '#'}>
                <div className="p-3 rounded-xl bg-black/40 border border-nexus-orange/10 flex gap-3 items-center hover:border-nexus-orange/40 hover:bg-black/60 transition-all cursor-pointer group">
                  <div className="w-1.5 h-1.5 rounded-full bg-nexus-orange" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-nexus-orange transition-colors">{task.title}</p>
                    <p className="text-[9px] text-white/40 font-mono uppercase mt-0.5">{task.project?.title || 'Nexus Internal'}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-white/5">
                    <img src={task.assignee?.avatar_url || `https://picsum.photos/seed/${task.id}/50`} className="w-full h-full object-cover" />
                  </div>
                  <ExternalLink size={14} className="text-white/20 group-hover:text-nexus-orange transition-colors shrink-0" />
                </div>
              </Link>
            ))}
            {urgentTasks.length === 0 && <p className="text-[10px] text-white/20 italic text-center py-4">Opérations fluides. Aucune urgence.</p>}
          </div>
        </Card>
      </div>

      {/* Artists Section */}
      {activeArtistsList.length > 0 && (
        <Card className="p-6 border-nexus-purple/20 bg-nexus-purple/5">
          <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-nexus-purple flex items-center gap-2 mb-5">
            <Users size={16} /> 
            Artistes Actifs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeArtistsList.map((artist) => (
              <Link key={artist.id} to={`/artists/${artist.id}`}>
                <div className="p-4 rounded-2xl bg-black/40 border border-nexus-purple/10 hover:border-nexus-purple/40 hover:bg-black/60 transition-all group cursor-pointer flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-nexus-purple/20 flex items-center justify-center text-nexus-purple font-bold group-hover:scale-110 transition-transform">
                    {artist.stage_name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs font-bold text-white truncate group-hover:text-nexus-purple transition-colors">{artist.stage_name}</p>
                  <ExternalLink size={12} className="text-white/20 group-hover:text-nexus-purple transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Projects Section */}
      {activeProjectsList.length > 0 && (
        <Card className="p-6 border-nexus-cyan/20 bg-nexus-cyan/5">
          <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-nexus-cyan flex items-center gap-2 mb-5">
            <Disc size={16} /> 
            Projets en Production
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeProjectsList.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <div className="p-4 rounded-2xl bg-black/40 border border-nexus-cyan/10 hover:border-nexus-cyan/40 hover:bg-black/60 transition-all group cursor-pointer flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-nexus-cyan/20 flex items-center justify-center text-nexus-cyan font-bold group-hover:scale-110 transition-transform">
                    <Disc size={20} />
                  </div>
                  <p className="text-xs font-bold text-white truncate group-hover:text-nexus-cyan transition-colors line-clamp-2">{project.title}</p>
                  <ExternalLink size={12} className="text-white/20 group-hover:text-nexus-cyan transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Budget Section */}
      <Card className="p-6 border-nexus-green/20 bg-nexus-green/5">
        <h3 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-nexus-green flex items-center gap-2 mb-6">
          <Wallet size={16} /> 
          Synthèse Budgétaire
        </h3>
        
        {/* Budget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-black/40 border border-nexus-green/10">
            <p className="text-[9px] font-mono text-nexus-green uppercase tracking-[0.3em] font-black mb-2">Budget Disponible</p>
            <p className="text-2xl font-bold font-heading text-white">{stats.totalBudget.toLocaleString()}€</p>
            <p className="text-[10px] text-white/30 mt-2">Somme des budgets actifs</p>
          </div>
          
          <div className="p-4 rounded-xl bg-black/40 border border-nexus-green/10">
            <p className="text-[9px] font-mono text-nexus-green uppercase tracking-[0.3em] font-black mb-2">Dépenses Payées</p>
            <p className="text-2xl font-bold font-heading text-nexus-green">{stats.totalPaid.toLocaleString()}€</p>
            <p className="text-[10px] text-white/30 mt-2">{stats.totalPaid > 0 ? `${((stats.totalPaid / stats.totalBudget) * 100).toFixed(0)}% du budget` : 'Aucune dépense'}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-black/40 border border-nexus-orange/10">
            <p className="text-[9px] font-mono text-nexus-orange uppercase tracking-[0.3em] font-black mb-2">En Attente de Paiement</p>
            <p className="text-2xl font-bold font-heading text-nexus-orange">{stats.totalPending.toLocaleString()}€</p>
            <p className="text-[10px] text-white/30 mt-2">{pendingBudgetItems.length} item(s) en attente</p>
          </div>
        </div>

        {/* Recent Pending Items */}
        {pendingBudgetItems.length > 0 && (
          <div>
            <h4 className="font-heading font-bold text-sm text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-nexus-orange" />
              5 Dernières Dépenses en Attente
            </h4>
            <div className="space-y-3">
              {pendingBudgetItems.map((item) => (
                <Link key={item.id} to={`/projects/${item.project_id}`}>
                  <div className="p-3 rounded-xl bg-black/40 border border-nexus-orange/10 hover:border-nexus-orange/40 hover:bg-black/60 transition-all group cursor-pointer flex gap-3 items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-nexus-orange transition-colors">{item.label}</p>
                      <p className="text-[9px] text-white/40 font-mono uppercase mt-1">{item.project?.title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-nexus-orange font-heading">{Number(item.amount).toLocaleString()}€</span>
                      <ExternalLink size={14} className="text-white/20 group-hover:text-nexus-orange transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {pendingBudgetItems.length === 0 && (
          <p className="text-[10px] text-white/20 italic text-center py-6">Tous les budgets sont à jour. Aucune dépense en attente.</p>
        )}
      </Card>
    </div>
  );
};
