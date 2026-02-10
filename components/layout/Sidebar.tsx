
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NAVIGATION } from '../../constants';
import { LogOut, Music, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const SidebarContent = () => (
    <>
      <div className="p-6 lg:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 nexus-gradient rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40">
            <Music className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-heading font-extrabold tracking-tighter text-white">
            NEXUS<span className="text-nexus-cyan font-light">LABEL</span>
          </h1>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-white/40 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAVIGATION.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.name} to={item.path} onClick={() => onClose()}>
              <motion.div
                className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                  isActive ? 'text-white bg-white/5' : 'text-nexus-lightGray hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ x: isActive ? 0 : 4 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1.5 h-6 nexus-gradient rounded-r-full"
                  />
                )}
                <span className={`${isActive ? 'text-nexus-purple' : 'group-hover:text-nexus-purple'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="font-semibold text-sm tracking-wide">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button className="flex items-center gap-3 px-4 py-3.5 w-full text-nexus-red hover:bg-nexus-red/10 rounded-xl transition-all group">
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-sm">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen fixed left-0 top-0 glass border-r border-white/10 z-50 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-nexus-dark border-r border-white/10 z-[70] lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
