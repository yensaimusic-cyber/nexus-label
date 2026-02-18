
import React, { useState } from 'react';
import { Search, Bell, User, Plus, Menu, LogOut, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useActivityLog } from '../../hooks/useActivityLog';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { activities } = useActivityLog(10);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      alert('Erreur lors de la déconnexion');
    }
  };

  const getActivityColor = (entityType: string) => {
    switch (entityType) {
      case 'project': return 'text-nexus-purple';
      case 'sortie': return 'text-nexus-orange';
      case 'meeting': return 'text-nexus-cyan';
      case 'task': return 'text-nexus-green';
      case 'artist': return 'text-nexus-pink';
      default: return 'text-white/50';
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
    return `il y a ${Math.floor(seconds / 86400)}j`;
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
          {/* SEARCH BAR REMOVED FOR CLEANER UI */}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative shadow-lg group"
          >
            <Bell size={20} className="text-white/70 group-hover:text-white transition-colors" />
            {activities.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-nexus-red rounded-full animate-pulse shadow-[0_0_8px_#EF4444]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 right-0 w-80 bg-nexus-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-nexus-purple/20 to-nexus-cyan/20 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-nexus-purple" />
                    <h3 className="font-bold text-white text-sm">Activités Récentes</h3>
                  </div>
                  <span className="text-xs bg-nexus-purple/30 text-nexus-purple px-2 py-1 rounded-full font-semibold">
                    {activities.length}
                  </span>
                </div>

                {/* Activities List */}
                {activities.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {activities.slice(0, 8).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate('/actualite')}
                        className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5 bg-nexus-cyan flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-nexus-cyan transition-colors">
                              {activity.entity_title}
                            </p>
                            <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{activity.description}</p>
                            <p className="text-xs text-white/30 mt-1.5 font-mono">{getTimeAgo(activity.created_at)}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${
                            activity.action_type.includes('created') ? 'bg-nexus-green/20 text-nexus-green' :
                            activity.action_type.includes('updated') ? 'bg-nexus-cyan/20 text-nexus-cyan' :
                            'bg-nexus-red/20 text-nexus-red'
                          }`}>
                            {activity.action_type.includes('created') ? 'Créé' :
                             activity.action_type.includes('updated') ? 'Modifié' : 'Supprimé'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-white/50">
                    <Activity size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune activité pour le moment</p>
                  </div>
                )}

                {/* View All Button */}
                {activities.length > 0 && (
                  <button
                    onClick={() => {
                      navigate('/actualite');
                      setShowNotifications(false);
                    }}
                    className="w-full px-4 py-3 text-center text-sm font-semibold text-nexus-cyan hover:bg-nexus-cyan/10 transition-colors border-t border-white/10"
                  >
                    Voir toutes les activités →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
