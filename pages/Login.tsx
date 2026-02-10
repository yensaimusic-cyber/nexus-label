
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError("Identifiants incorrects. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-nexus-dark relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-nexus-purple/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-nexus-cyan/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass w-full max-w-md p-10 lg:p-12 rounded-[40px] border-white/10 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 nexus-gradient rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/40 mb-6"
          >
            <Music className="text-white" size={40} />
          </motion.div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-white">
            NEXUS<span className="text-nexus-cyan font-light">LABEL</span>
          </h1>
          <p className="text-nexus-lightGray text-xs font-black uppercase tracking-[0.3em] mt-3">Centre de Commandement</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black ml-1">Email professionnel</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-nexus-purple transition-colors" size={20} />
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@nexuslabel.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-nexus-purple focus:ring-1 focus:ring-nexus-purple transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black ml-1">Clé d'accès</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-nexus-purple transition-colors" size={20} />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-nexus-purple focus:ring-1 focus:ring-nexus-purple transition-all shadow-inner"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-nexus-red text-xs font-bold text-center bg-nexus-red/10 py-3 rounded-2xl border border-nexus-red/20"
            >
              {error}
            </motion.p>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-16 rounded-2xl mt-4 text-sm font-black uppercase tracking-[0.2em] shadow-2xl nexus-glow"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <span className="flex items-center gap-3">
                S'identifier <ArrowRight size={20} />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
            Cryptage Militaire AES-256 Actif
          </p>
        </div>
      </motion.div>
    </div>
  );
};
