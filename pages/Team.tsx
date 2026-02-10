
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, Camera, Loader2, ChevronRight, Mail, Trash2, Shield, Save, X, Search, Settings } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile, deleteFileByUrl } from '../lib/storage';
import { TeamMember, CustomRole } from '../types';

export const Team: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    full_name: '',
    email: '',
    role: [],
    skills: [],
    avatar_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('custom_roles').select('*').order('name')
      ]);
      setProfiles(profilesRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err: any) {
      alert("Erreur lors du chargement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName) return;
    try {
      const { data, error } = await supabase.from('custom_roles').insert([{ name: newRoleName }]).select().single();
      if (error) throw error;
      setRoles([...roles, data]);
      setNewRoleName('');
    } catch (err: any) {
      alert("Erreur role : " + err.message);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const { error } = await supabase.from('custom_roles').delete().eq('id', id);
      if (error) throw error;
      setRoles(roles.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Erreur suppression role : " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let avatarUrl = formData.avatar_url;
      if (selectedFile) {
        avatarUrl = await uploadFile(selectedFile, 'avatars', 'team-avatars');
      }
      
      if (editingId) {
        const { error } = await supabase.from('profiles').update({ ...formData, avatar_url: avatarUrl }).eq('id', editingId);
        if (error) throw error;
      } else {
        // En prod, la création de profil est liée à auth.signUp, mais on simule ici pour l'UI si besoin
        // Pour cet exemple, on suppose qu'on édite des profils existants ou créés par trigger
        alert("Action restreinte à la modification de profils existants dans cette vue.");
        return;
      }

      setIsModalOpen(false);
      await fetchInitialData(); // Re-sync de la liste
      alert("Opération réussie !");
    } catch (err: any) {
      alert("Échec : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Équipe du Label</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Gérez le staff, les artistes et les rôles personnalisés.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setIsRoleModalOpen(true)}>
            <Settings size={20} />
            <span>Gérer les rôles</span>
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => { setEditingId(null); setFormData({ full_name: '', email: '', role: [], skills: [] }); setPreviewUrl(null); setIsModalOpen(true); }}>
            <Plus size={20} />
            <span>Modifier un membre</span>
          </Button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher un membre par nom, email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-[24px] py-4 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none text-white font-medium"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-nexus-purple mb-4" size={40} />
          <p className="text-[10px] font-mono uppercase text-white/30">Accès aux registres...</p>
        </div>
      ) : (
        <div className="glass rounded-[32px] overflow-hidden border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-5 text-[10px] font-mono uppercase text-white/30 tracking-[0.2em]">Profil</th>
                  <th className="px-6 py-5 text-[10px] font-mono uppercase text-white/30 tracking-[0.2em]">Rôles Nexus</th>
                  <th className="px-6 py-5 text-[10px] font-mono uppercase text-white/30 tracking-[0.2em]">Compétences</th>
                  <th className="px-6 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProfiles.map((member) => (
                  <tr key={member.id} className="group hover:bg-white/[0.03] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] overflow-hidden border border-white/10 shadow-lg bg-nexus-surface">
                          <img src={member.avatar_url || `https://picsum.photos/seed/${member.id}/100`} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-heading font-bold text-white group-hover:text-nexus-cyan transition-colors">{member.full_name}</p>
                          <p className="text-[10px] font-mono text-white/20 tracking-tighter">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(member.role) && member.role.map((r: string) => (
                          <span key={r} className="px-2.5 py-1 rounded-lg bg-nexus-purple/10 text-nexus-purple text-[9px] font-black uppercase tracking-widest border border-nexus-purple/20">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(member.skills || []).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-white/40">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingId(member.id); setFormData(member); setPreviewUrl(member.avatar_url); setIsModalOpen(true); }} className="p-2.5 hover:bg-white/5 rounded-xl text-nexus-purple transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-20 text-center text-white/20 italic font-heading">Aucun membre trouvé</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Gestion Rôles */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Gestion des Rôles">
        <div className="space-y-6">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nouveau rôle..." 
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-nexus-purple outline-none"
            />
            <Button variant="primary" onClick={handleAddRole} className="px-4"><Plus size={18} /></Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-sm font-bold text-white/80">{role.name}</span>
                <button onClick={() => handleDeleteRole(role.id)} className="text-nexus-red hover:bg-nexus-red/10 p-2 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Edition Membre */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier le Profil" : "Informations Membre"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative group w-20 h-20 rounded-[24px] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-nexus-purple transition-all">
              {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Camera className="text-white/20" />}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }} />
            </div>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Identification visuelle</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Nom complet</label>
            <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-nexus-purple outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Rôles attribués</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {roles.map(role => (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => {
                    const current = formData.role || [];
                    const updated = current.includes(role.name) ? current.filter(x => x !== role.name) : [...current, role.name];
                    setFormData({...formData, role: updated});
                  }}
                  className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    formData.role?.includes(role.name) ? 'bg-nexus-purple text-white border-nexus-purple shadow-lg' : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}><Save size={18} className="mr-2" /> Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
