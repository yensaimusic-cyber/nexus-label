
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, User, Camera, Loader2, ChevronRight, Mail, Trash2, Shield, Save, X, Search, Settings, Edit3 } from 'lucide-react';
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName) return;
    try {
      const { data, error } = await supabase.from('custom_roles').insert([{ name: newRoleName }]).select().single();
      if (error) throw error;
      setRoles(prev => [...prev, data]);
      setNewRoleName('');
    } catch (err: any) {
      alert("Erreur lors de l'ajout du rôle.");
    }
  };

  const handleDeleteRole = async (id: string) => {
    if(!confirm("Supprimer ce rôle des registres ?")) return;
    try {
      const { error } = await supabase.from('custom_roles').delete().eq('id', id);
      if (error) throw error;
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Erreur suppression rôle.");
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
      
      const payload = {
        full_name: formData.full_name,
        email: formData.email || null, // Optional FIX
        role: formData.role,
        skills: formData.skills,
        avatar_url: avatarUrl
      };

      if (editingId) {
        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const newId = crypto.randomUUID();
        const { error } = await supabase
          .from('profiles')
          .insert([{ 
            ...payload,
            id: newId
          }]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchInitialData();
      alert("Profil d'agent synchronisé !");
    } catch (err: any) {
      alert("Échec de l'opération : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Effacer définitivement ce profil ?")) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight leading-none">Roster de l'Équipe</h2>
          <p className="text-nexus-lightGray text-xs lg:text-sm mt-2 opacity-60">Gestion du staff et des intervenants stratégiques Nexus.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-white/10 rounded-2xl h-14" onClick={() => setIsRoleModalOpen(true)}>
            <Settings size={20} />
            <span className="font-black uppercase tracking-widest text-[10px]">Rôles Hub</span>
          </Button>
          <Button variant="primary" className="gap-2 shadow-2xl rounded-2xl h-14 nexus-glow" onClick={() => { 
            setEditingId(null); 
            setFormData({ full_name: '', email: '', role: [], skills: [] }); 
            setPreviewUrl(null); 
            setIsModalOpen(true); 
          }}>
            <Plus size={20} />
            <span className="font-black uppercase tracking-widest text-[10px]">Recruter un Agent</span>
          </Button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        <input 
          type="text" 
          placeholder="Identifier un agent par nom ou expertise..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-[32px] py-5 pl-14 pr-6 text-sm focus:border-nexus-purple transition-all outline-none text-white font-medium shadow-2xl"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-nexus-purple mb-4" size={48} />
          <p className="text-[10px] font-mono uppercase text-white/30 tracking-[0.4em]">Lecture de la base profiles...</p>
        </div>
      ) : (
        <div className="glass rounded-[40px] overflow-hidden border-white/5 shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-10 py-8 text-[10px] font-mono uppercase text-white/30 tracking-[0.3em] font-black italic">Agent Hub</th>
                  <th className="px-10 py-8 text-[10px] font-mono uppercase text-white/30 tracking-[0.3em] font-black italic">Rôles Attribués</th>
                  <th className="px-10 py-8 text-[10px] font-mono uppercase text-white/30 tracking-[0.3em] font-black italic">Expertises</th>
                  <th className="px-10 py-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProfiles.map((member) => (
                  <tr key={member.id} className="group hover:bg-white/[0.04] transition-all">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[24px] overflow-hidden border-2 border-white/10 bg-nexus-surface group-hover:border-nexus-purple/50 transition-all shadow-2xl">
                          <img src={member.avatar_url || `https://picsum.photos/seed/${member.id}/100`} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="font-heading font-extrabold text-white text-lg group-hover:text-nexus-cyan transition-colors">{member.full_name}</p>
                          <p className="text-[10px] font-mono text-white/20 mt-1 uppercase tracking-widest">{member.email || 'Pas de canal email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(member.role) && member.role.map((r: string) => (
                          <span key={r} className="px-3 py-1 rounded-lg bg-nexus-purple/10 text-nexus-purple text-[9px] font-black uppercase tracking-[0.2em] border border-nexus-purple/20">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-wrap gap-2">
                        {(member.skills || []).map((s: string) => (
                          <span key={s} className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-white/40 border border-white/5">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingId(member.id); setFormData(member); setPreviewUrl(member.avatar_url); setIsModalOpen(true); }} className="p-3 bg-white/5 hover:bg-nexus-purple/20 rounded-xl text-nexus-purple transition-all"><Edit3 size={20} /></button>
                         <button onClick={() => handleDeleteMember(member.id)} className="p-3 bg-white/5 hover:bg-nexus-red/10 rounded-xl text-nexus-red transition-all"><Trash2 size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProfiles.length === 0 && <div className="py-32 text-center opacity-20 italic">Aucun agent identifié dans ce secteur.</div>}
        </div>
      )}

      {/* Modal Profile Edit/Add */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Actualiser Dossier Agent" : "Recrutement Nouvel Agent"}>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group w-32 h-32 rounded-[40px] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-nexus-purple transition-all shadow-2xl">
              {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Camera className="text-white/20 group-hover:text-nexus-purple transition-all" size={40} />}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }} />
            </div>
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] font-black">Identité Visuelle Agent</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Nom complet *</label>
            <input required type="text" placeholder="ex: Julien Rivera" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-nexus-purple outline-none shadow-2xl" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Email Personnel (Optionnel)</label>
            <input type="email" placeholder="agent@nexuslabel.com" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-nexus-purple outline-none shadow-2xl" />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest font-black ml-1">Rôles Stratégiques</label>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {roles.map(role => (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => {
                    const current = formData.role || [];
                    const updated = current.includes(role.name) ? current.filter(x => x !== role.name) : [...current, role.name];
                    setFormData({...formData, role: updated});
                  }}
                  className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                    formData.role?.includes(role.name) 
                    ? 'bg-nexus-purple text-white border-nexus-purple shadow-2xl nexus-glow' 
                    : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10 shadow-inner'
                  }`}
                >
                  {role.name}
                </button>
              ))}
              {roles.length === 0 && <p className="col-span-2 text-[10px] text-white/20 italic text-center py-4">Configurez les rôles hub d'abord.</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-10 border-t border-white/5">
            <Button type="button" variant="ghost" className="flex-1 h-16 rounded-2xl font-bold" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1 h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl nexus-glow" isLoading={isSubmitting}><Save size={20} className="mr-3" /> Synchroniser</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Role Management */}
      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Architecture des Rôles Hub">
        <div className="space-y-8">
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Intitulé du nouveau rôle..." 
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-nexus-purple"
            />
            <Button variant="primary" className="h-14 w-14 p-0 rounded-2xl shadow-xl" onClick={handleAddRole}><Plus size={24} /></Button>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase text-white/30 tracking-[0.3em] font-black ml-1">Rôles Actuels</p>
            <div className="grid grid-cols-1 gap-2">
               {roles.map(role => (
                 <div key={role.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl group/role">
                   <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{role.name}</span>
                   <button onClick={() => handleDeleteRole(role.id)} className="text-white/10 hover:text-nexus-red transition-all p-2 opacity-0 group-role-hover:opacity-100"><X size={18} /></button>
                 </div>
               ))}
               {roles.length === 0 && <div className="py-12 text-center italic opacity-20">Aucun rôle défini.</div>}
            </div>
          </div>
          <Button variant="ghost" className="w-full h-14 rounded-2xl font-bold" onClick={() => setIsRoleModalOpen(false)}>Fermer</Button>
        </div>
      </Modal>
    </div>
  );
};
