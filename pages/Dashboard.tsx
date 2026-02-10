
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { 
  Users, 
  Disc, 
  CheckSquare, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from 'recharts';

const data = [
  { name: 'Mon', streams: 4200 },
  { name: 'Tue', streams: 5100 },
  { name: 'Wed', streams: 4800 },
  { name: 'Thu', streams: 7200 },
  { name: 'Fri', streams: 8100 },
  { name: 'Sat', streams: 9500 },
  { name: 'Sun', streams: 11000 },
];

const budgetData = [
  { name: 'Marketing', value: 45, color: '#8B5CF6' },
  { name: 'Studio', value: 30, color: '#06B6D4' },
  { name: 'Video', value: 15, color: '#EC4899' },
  { name: 'Other', value: 10, color: '#10B981' },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Command Center</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Label operations overview for <span className="text-nexus-purple font-semibold">Q4 2024</span>.</p>
        </div>
        <div className="hidden lg:flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-2.5 border border-white/10 glass shadow-xl shadow-black/20">
          <Activity size={18} className="text-nexus-cyan animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-white/70">SYSTEM ONLINE</span>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <span className="text-xs font-mono text-nexus-lightGray">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </header>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {[
          { label: 'Artists', value: '24', icon: <Users size={20} />, trend: '+3', color: 'purple' },
          { label: 'Projects', value: '12', icon: <Disc size={20} />, trend: '92%', color: 'cyan' },
          { label: 'Tasks', value: '48', icon: <CheckSquare size={20} />, trend: '12!', color: 'pink' },
          { label: 'Streams', value: '1.2M', icon: <TrendingUp size={20} />, trend: '↑15%', color: 'green' },
        ].map((stat, i) => (
          <Card key={i} className="p-4 lg:p-6 !animate-none border-white/5 hover:border-nexus-purple/40 transition-all">
            <div className="flex justify-between items-start mb-3 lg:mb-4">
              <div className={`p-2 lg:p-3 rounded-xl bg-nexus-${stat.color}/10 text-nexus-${stat.color} shadow-lg shadow-nexus-${stat.color}/5`}>
                {stat.icon}
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-nexus-${stat.color}/10 text-nexus-${stat.color}`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-white/40 text-[10px] lg:text-xs font-mono uppercase tracking-[0.2em] font-bold">{stat.label}</h3>
            <p className="text-xl lg:text-3xl font-bold font-heading mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="xl:col-span-2 min-h-[450px] flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="font-heading font-extrabold text-lg flex items-center gap-2">
                Streaming Performance
                <span className="px-2 py-0.5 rounded-full bg-nexus-green/10 text-nexus-green text-[10px] font-mono">+12.4%</span>
              </h3>
              <p className="text-xs text-white/30 font-mono mt-1 uppercase">Total plays accumulated across platforms</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-white/40 hover:text-white transition-all">7D</button>
              <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-nexus-purple text-white shadow-lg">30D</button>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" stroke="#ffffff15" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#ffffff15" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="streams" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorStreams)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <Card className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading font-bold">Recent Pulse</h3>
              <button className="text-[10px] text-nexus-purple hover:underline font-bold tracking-widest uppercase">Live View</button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {[
                { user: 'Sarah K.', action: 'mastered', target: 'Neon Pulse', time: '2m', color: 'purple' },
                { user: 'Elena R.', action: 'scheduled', target: 'Campaign v2', time: '15m', color: 'cyan' },
                { user: 'Alex R.', action: 'signed', target: 'New Artist', time: '45m', color: 'pink' },
                { user: 'Marcus C.', action: 'delivered', target: 'Cover Art', time: '1h', color: 'green' },
                { user: 'System', action: 'exported', target: 'Monthly Report', time: '3h', color: 'orange' },
              ].map((act, i) => (
                <div key={i} className="flex gap-3 items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl bg-nexus-${act.color}/10 flex items-center justify-center shrink-0`}>
                    <Activity size={16} className={`text-nexus-${act.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-nexus-lightGray truncate leading-tight">
                      <span className="text-white font-bold">{act.user}</span> {act.action} <span className={`text-nexus-${act.color} font-mono font-bold tracking-tighter`}>{act.target}</span>
                    </p>
                    <p className="text-[10px] text-white/20 font-mono mt-0.5">{act.time} ago</p>
                  </div>
                  <ArrowUpRight size={14} className="text-white/10 group-hover:text-white/40 transition-all shrink-0" />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">
              Load More Activity
            </button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-heading font-bold text-lg">Upcoming Releases</h3>
            <button className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 hover:border-nexus-purple transition-all font-bold uppercase tracking-widest">Pipeline</button>
          </div>
          <div className="space-y-4">
            {[
              { artist: 'Solaris', title: 'Neon Pulse', date: 'Oct 24', status: 'Production', progress: 65, color: 'purple' },
              { artist: 'Ghost Tape', title: 'Analog Soul', date: 'Nov 02', status: 'Mixing', progress: 40, color: 'cyan' },
              { artist: 'Neon Queen', title: 'Midnight', date: 'Nov 12', status: 'Pre-prod', progress: 15, color: 'pink' }
            ].map((rel, i) => (
              <div key={i} className="glass p-5 rounded-2xl border-white/5 hover:border-white/10 transition-all group">
                <div className="flex justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-nexus-${rel.color}/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                      <Disc size={24} className={`text-nexus-${rel.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white leading-tight">{rel.title}</p>
                      <p className="text-xs text-nexus-lightGray font-medium">{rel.artist}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-mono font-bold text-nexus-green uppercase tracking-wider">{rel.date}</p>
                    <p className="text-[10px] text-white/30 uppercase mt-0.5 font-bold tracking-tighter">{rel.status}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-mono uppercase font-bold text-white/30">
                    <span>Readiness</span>
                    <span>{rel.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${rel.progress}%` }}
                      className={`h-full bg-nexus-${rel.color}`} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-heading font-bold text-lg">Resource Allocation</h3>
            <span className="text-[10px] text-white/30 font-mono">LIVE BUDGET TRACKER</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#ffffff30" fontSize={10} width={80} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{fill: '#ffffff05'}}
                   contentStyle={{ backgroundColor: '#1A1A24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {budgetData.map((b, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="text-[10px] text-nexus-lightGray font-bold uppercase tracking-widest">{b.name}</span>
                </div>
                <span className="text-sm font-bold font-heading text-white">{b.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
