
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, User, Star, PenTool, Music, Mic2, Briefcase, Camera, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TeamMember } from '../types';

const MOCK_TEAM: TeamMember[] = [
  { id: '1', user_id: 'u1', full_name: 'GODFI', email: 'godfi@nexus.com', role: ['CO-F', 'Artiste'], skills: ['Chant', 'Écriture', 'Beatmaking'], avatar_url: 'https://picsum.photos/seed/godfi/100' },
  { id: '2', user_id: 'u2', full_name: 'Yensai', email: 'yensai@nexus.com', role: ['CO-F', 'Artiste', 'Ingénieur Son'], skills: ['Vidéo', 'Photo', 'Management'], avatar_url: 'https://picsum.photos/seed/yensai/100' },
  { id: '3', user_id: 'u3', full_name: 'Fahd', email: 'fahd@nexus.com', role: ['Trésorier', 'Artiste'], skills: ['Chant', 'Écriture', 'DA'], avatar_url: 'https://picsum.photos/seed/fahd/100' },
  { id: '4', user_id: 'u4', full_name: 'Hugin', email: 'hugin@nexus.com', role: ['Project Manager'], skills: ['Management'], avatar_url: 'https://picsum.photos/seed/hugin/100' },
  { id: '5', user_id: 'u5', full_name: 'Céline', email: 'celine@nexus.com', role: ['Direction Artistique'], skills: ['DA', 'Photo'], avatar_url: 'https://picsum.photos/seed/celine/100' },
  { id: '6', user_id: 'u6', full_name: 'Insty', email: 'insty@nexus.com', role: ['Direction Artistique'], skills: ['DA', 'Photo', 'Vidéo'], avatar_url: 'https://picsum.photos/seed/insty/100' },
  { id: '7', user_id: 'u7', full_name: 'Baddi', email: 'baddi@nexus.com', role: ['Artiste'], skills: ['Écriture', 'DA', 'Photo', 'Vidéo'], avatar_url: 'https://picsum.photos/seed/baddi/100' },
  { id: '8', user_id: 'u8', full_name: 'Kaina', email: 'kaina@nexus.com', role: ['Artiste'], skills: ['Chant', 'composition', 'auteur interprete'], avatar_url: 'https://picsum.photos/seed/kaina/100' },
  { id: '9', user_id: 'u9', full_name: 'Lewizzz', email: 'lewizzz@nexus.com', role: ['Artiste'], skills: ['Écriture', 'Chant', 'Beatmaking'], avatar_url: 'https://picsum.photos/seed/lewizzz/100' },
  { id: '10', user_id: 'u10', full_name: 'Odah', email: 'odah@nexus.com', role: ['Ingénieur Son'], skills: ['MIX', 'Mastering', 'Beatmaking'], avatar_url: 'https://picsum.photos/seed/odah/100' },
];

const getPositionColor = (role: string) => {
  if (role === 'Artiste') return 'bg-[#5B21B6] text-white';
  if (role === 'CO-F') return 'bg-[#7C2D12] text-white';
  if (role === 'Ingénieur Son') return 'bg-[#065F46] text-white';
  if (role === 'Project Manager') return 'bg-[#1E40AF] text-white';
  if (role === 'Direction Artistique') return 'bg-[#701A75] text-white';
  return 'bg-[#3F3F46] text-white';
};

const getSkillColor = (skill: string) => {
  const s = skill.toLowerCase();
  if (s.includes('chant')) return 'bg-[#1E3A8A] text-white';
  if (s.includes('écriture')) return 'bg-[#581C87] text-white';
  if (s.includes('beatmaking')) return 'bg-[#713F12] text-white';
  if (s.includes('vidéo')) return 'bg-[#7F1D1D] text-white';
  if (s.includes('photo')) return 'bg-[#3F3F46] text-white';
  if (s.includes('management')) return 'bg-[#431407] text-white';
  if (s.includes('da')) return 'bg-[#701A75] text-white';
  if (s.includes('mix') || s.includes('mastering')) return 'bg-[#064E3B] text-white';
  return 'bg-[#111827] text-white/70';
};

export const Team: React.FC = () => {
  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Roster NEXUS</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Équipe centrale, artistes et compétences clés du label.</p>
        </div>
        <Button variant="primary" className="gap-2 shadow-xl">
          <Plus size={20} />
          <span>Inviter un Membre</span>
        </Button>
      </header>

      <div className="glass rounded-[32px] overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Nom de l'Artiste</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Position</th>
                <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Compétences</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_TEAM.map((member) => (
                <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-nexus-purple/50 transition-colors">
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-heading font-bold text-white group-hover:text-nexus-purple transition-colors">{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {member.role.map(r => (
                        <span key={r} className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide ${getPositionColor(r)}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map(s => (
                        <span key={s} className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide ${getSkillColor(s)}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-white/20 hover:text-white transition-colors">
                       <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Artistes', value: '8', icon: <Mic2 />, color: 'purple' },
          { label: 'Beatmakers', value: '4', icon: <Music />, color: 'cyan' },
          { label: 'Image/DA', value: '5', icon: <Camera />, color: 'pink' },
          { label: 'Management', value: '3', icon: <Sparkles />, color: 'orange' },
        ].map((stat, i) => (
          <Card key={i} className="flex items-center gap-4 p-5">
            <div className={`p-3 rounded-2xl bg-nexus-${stat.color}/10 text-nexus-${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold font-heading">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
