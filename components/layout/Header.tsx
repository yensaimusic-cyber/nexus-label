
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
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="h-20 flex items-center justify-between px-4 lg:px-8 glass sticky top-0 z-40 border-b border-white/10">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-nexus-purple transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Recherche rapide..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-nexus-purple focus:ring-1 focus:ring-nexus-purple transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        <div className="relative">
          <button 
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative"
          >
            <Bell size={20} className="text-white/70" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-nexus-pink rounded-full border border-nexus-dark" />
          </button>
          {showTooltip && (
            <div className="absolute top-12 right-0 bg-nexus-surface border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white whitespace-nowrap shadow-2xl z-50">
              Bientôt disponible
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 lg:pl-4 lg:border-l border-white/10">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold text-white leading-none">Alex Rivera</p>
            <p className="text-[9px] text-nexus-cyan font-mono uppercase tracking-[0.2em] mt-1">Directeur</p>
          </div>
          <div className="group relative">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-nexus-purple/30 cursor-pointer hover:border-nexus-purple transition-colors">
              <img src="https://picsum.photos/seed/manager/100" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            
            {/* Menu Dropdown déconnexion */}
            <div className="absolute top-12 right-0 w-48 bg-nexus-surface border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50 translate-y-2 group-hover:translate-y-0">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-nexus-red hover:bg-nexus-red/10 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm font-bold">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
