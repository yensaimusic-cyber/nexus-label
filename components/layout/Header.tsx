
import React, { useState } from 'react';
import { Search, Bell, User, Plus, Menu, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      alert('Erreur lors de la déconnexion');
    }
  };

  return (
    <header className="h-20 flex items-center justify-between px-4 lg:px-8 glass sticky top-0 z-40 border-b border-white/10 shadow-xl">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2.5 rounded-xl bg-white/5 text-white/70 hover:text-white transition-all shadow-lg"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 max-w-xl hidden md:block">
          {/* Barre de recherche supprimée car inutile selon les consignes */}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        <div className="relative">
          <button 
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative shadow-lg"
          >
            <Bell size={20} className="text-white/70" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-nexus-pink rounded-full border-2 border-nexus-dark" />
          </button>
          {showTooltip && (
            <div className="absolute top-12 right-0 bg-nexus-surface border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap shadow-2xl z-50">
              Centre de notifications
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 lg:pl-6 lg:border-l border-white/10">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold text-white leading-none tracking-tight">Directeur Nexus</p>
            <p className="text-[9px] text-nexus-cyan font-mono uppercase tracking-[0.2em] mt-1.5 font-black">Staff Autorisé</p>
          </div>
          <div className="group relative">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-nexus-purple/30 cursor-pointer hover:border-nexus-purple transition-all shadow-xl">
              <img src="https://picsum.photos/seed/manager/100" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            
            <div className="absolute top-14 right-0 w-56 bg-nexus-surface border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50 translate-y-2 group-hover:translate-y-0">
              <div className="px-4 py-3 border-b border-white/5 mb-1">
                 <p className="text-xs font-black uppercase text-white/40 tracking-widest">Ma Session</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-nexus-red hover:bg-nexus-red/10 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
