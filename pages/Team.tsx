
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Added Search to the imports from lucide-react
import { Plus, User, Camera, Loader2, ChevronRight, Mail, Trash2, Shield, Save, X, Search } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile, deleteFileByUrl } from '../lib/storage';
import { TeamMember, UserRole } from '../types';

const ROLE_COLORS: Record<string, string> = {
  'admin': 'bg-nexus-red/20 text-nexus-red border-nexus-red/30',
  'manager': 'bg-nexus-purple/20 text-nexus-purple border-nexus-purple/30',
  'artist': 'bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan/30',
  'engineer': 'bg-nexus-green/20 text-nexus-green border-nexus-green/30',
  'designer': 'bg-nexus-pink/20 text-nexus-pink border-nexus-pink/30',
};

export const Team: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    full_name: '',
    email: '',
    role: ['manager'],
    skills: [],
    avatar_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      alert("Error fetching profiles: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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

      const submissionData = {
        ...formData,
        avatar_url: avatarUrl
      };

      if (editingId) {
        const { error } = await supabase.from('profiles').update(submissionData).eq('id', editingId);
        if (error) throw error;
      } else {
        // Creating profile requires a valid auth user id, usually done via trigger on auth.signup
        // For existing label logic, we assume we update existing profiles or invite users
        alert("To create a NEW user, please use the Invite flow. (Profiles are auto-created on sign-up)");
        return;
      }

      setIsModalOpen(false);
      fetchProfiles();
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert("Operation failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (profile: any) => {
    setEditingId(profile.id);
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      role: Array.isArray(profile.role) ? profile.role : [profile.role],
      skills: profile.skills || [],
      avatar_url: profile.avatar_url
    });
    setPreviewUrl(profile.avatar_url);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, avatarUrl?: string) => {
    if (!confirm("Remove this member from Nexus Roster? (Auth account remains)")) return;
    try {
      if (avatarUrl) await deleteFileByUrl(avatarUrl, 'avatars');
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Label Roster</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Manage core team, artists and key label roles.</p>
        </div>
        <Button variant="primary" className="gap-2 shadow-xl" onClick={() => { setEditingId(null); setFormData({ full_name: '', email: '', role: ['manager'], skills: [] }); setPreviewUrl(null); setIsModalOpen(true); }}>
          <Plus size={20} />
          <span>Invite Member</span>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text" 
          placeholder="Search by name, email or role..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-[24px] py-4 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none text-white font-medium"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-nexus-purple mb-4" size={40} />
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Connecting to Internal Registry...</p>
        </div>
      ) : (
        <div className="glass rounded-[32px] overflow-hidden border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Profile</th>
                  <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Nexus Roles</th>
                  <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">Competencies</th>
                  <th className="px-6 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProfiles.map((member) => (
                  <tr key={member.id} className="group hover:bg-white/[0.03] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] overflow-hidden border border-white/10 group-hover:border-nexus-purple/50 transition-all shadow-lg bg-nexus-surface">
                          <img src={member.avatar_url || `https://picsum.photos/seed/${member.id}/100`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                           <span className="font-heading font-bold text-white group-hover:text-nexus-cyan transition-colors">{member.full_name}</span>
                           <span className="text-[10px] font-mono text-white/20 tracking-tighter">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(member.role) ? member.role.map(r => (
                          <span key={r} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ROLE_COLORS[r] || 'bg-white/5 text-white/40'}`}>
                            {r}
                          </span>
                        )) : (
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ROLE_COLORS[member.role] || 'bg-white/5 text-white/40'}`}>
                            {member.role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(member.skills || []).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-white/40 group-hover:text-white/70 transition-colors">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(member)} className="p-2.5 hover:bg-white/5"><ChevronRight size={20} className="text-nexus-purple" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id, member.avatar_url)} className="p-2.5 hover:text-nexus-red"><Trash2 size={18} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProfiles.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-20 text-center text-white/20 italic font-heading">No matching profiles in registry</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Update Nexus Profile" : "Invite to Label"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
             <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-2 border-dashed border-white/10 flex items-center justify-center bg-white/5 hover:border-nexus-purple transition-all">
                   {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Camera className="text-white/20" size={32} />}
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Update Identification Photo</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Full Legal Name *</label>
            <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Nexus Designation</label>
            <div className="grid grid-cols-2 gap-2">
              {['admin', 'manager', 'artist', 'engineer', 'designer'].map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => {
                    const current = formData.role || [];
                    const updated = current.includes(r as any) ? current.filter(x => x !== r) : [...current, r as any];
                    setFormData({...formData, role: updated});
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    formData.role?.includes(r as any) ? 'bg-nexus-purple text-white border-nexus-purple' : 'bg-white/5 text-white/30 border-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Abort</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}><Save size={18} className="mr-2" /> Sync Records</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
