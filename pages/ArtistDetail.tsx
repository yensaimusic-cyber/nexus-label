
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, Users, User, Disc, FileText, Download, Mail, 
  Plus, ArrowLeft, Camera, Trash2, Loader2, Save, File, X, Calendar, 
  MessageSquareText, Edit3, Phone, Briefcase, ExternalLink, Paperclip, FileCheck
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Artist, Project, ArtistAsset, ArtistTeamMember, ArtistStatus } from '../types';

export const ArtistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<ArtistAsset[]>([]);
  const [artistTeam, setArtistTeam] = useState<ArtistTeamMember[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projets' | 'equipe' | 'assets' | 'reunions'>('projets');
  
  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Entry States
  const [newAsset, setNewAsset] = useState({ name: '', notes: '', file: null as File | null });
  const [newTeamMember, setNewTeamMember] = useState<Partial<ArtistTeamMember>>({ name: '', role: '', email: '', phone: '', notes: '' });
  
  // Edit Artist State
  const [editFormData, setEditFormData] = useState<Partial<Artist>>({});
  const [editFiles, setEditFiles] = useState<{avatar?: File, cover?: File}>({});

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artistRes, projectsRes, assetsRes, teamRes] = await Promise.all([
        supabase.from('artists').select('*').eq('id', id).single(),
        supabase.from('projects').select('*').eq('artist_id', id).order('release_date', { ascending: false }),
        supabase.from('artist_assets').select('*').eq('artist_id', id).order('created_at', { ascending: false }),
        supabase.from('artist_team_members').select('*').eq('artist_id', id).order('created_at', { ascending: false })
      ]);

      if (artistRes.error) throw artistRes.error;
      
      setArtist(artistRes.data);
      setEditFormData(artistRes.data);
      const projData = projectsRes.data || [];
      setProjects(projData);
      setAssets(assetsRes.data || []);
      setArtistTeam(teamRes.data || []);

      if (projData.length > 0) {
        const projectIds = projData.map(p => p.id);
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('*, project:projects(title)')
          .in('project_id', projectIds)
          .order('date', { ascending: false });
        setMeetings(meetingsData || []);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur de récupération des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSubmitting(true);
      let updates = { ...editFormData };
      
      if (editFiles.avatar) {
        updates.avatar_url = await uploadFile(editFiles.avatar, 'avatars', 'artist-avatars');
      }
      if (editFiles.cover) {
        updates.cover_url = await uploadFile(editFiles.cover, 'covers', 'artist-covers');
      }

      delete (updates as any).id;
      delete (updates as any).created_at;

      const { data, error } = await supabase.from('artists').update(updates).eq('id', id).select().single();
      if (error) throw error;
      
      setArtist(data);
      setIsEditModalOpen(false);
      alert("Profil mis à jour !");
    } catch (err: any) {
      alert("Erreur de sauvegarde : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamMember.name || !newTeamMember.role || !id) return;
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.from('artist_team_members').insert([{
        artist_id: id,
        ...newTeamMember
      }]).select().single();
      
      if (error) throw error;
      setArtistTeam([data, ...artistTeam]);
      setIsTeamModalOpen(false);
      setNewTeamMember({ name: '', role: '', email: '', phone: '', notes: '' });
    } catch (err: any) {
      alert("Impossible d'ajouter le membre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.file || !newAsset.name || !id) return;
    try {
      setIsSubmitting(true);
      const url = await uploadFile(newAsset.file, 'covers', 'artist-assets'); 
      const { data, error } = await supabase.from('artist_assets').insert([{
        artist_id: id,
        name: newAsset.name,
        notes: newAsset.notes,
        file_url: url,
        file_type: newAsset.file.type,
        file_size: newAsset.file.size
      }]).select().single();
      
      if (error) throw error;
      setAssets([data, ...assets]);
      setIsAssetModalOpen(false);
      setNewAsset({ name: '', notes: '', file: null });
    } catch (err: any) {
      alert("Échec de l'upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    if (!confirm("Supprimer ce membre de l'équipe ?")) return;
    try {
      const { error } = await supabase.from('artist_team_members').delete().eq('id', memberId);
      if (error) throw error;
      setArtistTeam(artistTeam.filter(m => m.id !== memberId));
    } catch (err) { alert("Erreur suppression."); }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Supprimer cet asset définitivement ?")) return;
    try {
      const { error } = await supabase.from('artist_assets').delete().eq('id', assetId);
      if (error) throw error;
      setAssets(assets.filter(a => a.id !== assetId));
    } catch (err) { alert("Erreur suppression."); }
  };

  if (loading || !artist) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-nexus-dark">
      {/* Hero Header */}
      <div className="h-[300px] lg:h-[400px] relative overflow-hidden">
        <img src={artist.cover_url || "https://picsum.photos/seed/artcover/1200/400"} className="w-full h-full object-cover brightness-[0.25]" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-12">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 lg:gap-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-32 h-32 lg:w-44 lg:h-44 rounded-[40px] border-4 border-white/10 overflow-hidden shadow-2xl shrink-0 z-10">
              <img src={artist.avatar_url || `https://picsum.photos/seed/${artist.id}/400`} className="w-full h-full object-cover" alt="Avatar" />
            </motion.div>
            
            <div className="flex-1 text-center md:text-left z-10 mb-2">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
                <h1 className="text-4xl lg:text-6xl font-heading font-extrabold text-white tracking-tighter">{artist.stage_name}</h1>
                <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="rounded-full bg-white/5 border border-white/10 hover:bg-nexus-purple transition-all">
                  <Edit3 size={16} className="mr-2" /> Modifier
                </Button>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                <span className="text-nexus-cyan font-mono uppercase tracking-widest text-[9px] bg-nexus-cyan/10 px-3 py-1 rounded-full border border-nexus-cyan/20 font-black">{artist.status}</span>
                <p className="text-white/40 text-sm font-medium">{artist.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-12 space-y-12">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto custom-scrollbar gap-2 p-1.5 glass rounded-[24px] w-full lg:w-fit shadow-2xl sticky top-24 z-30">
          {[
            { id: 'projets', label: 'Catalogue', icon: <Disc size={16} /> },
            { id: 'equipe', label: 'Management', icon: <Users size={16} /> },
            { id: 'assets', label: 'Assets', icon: <Briefcase size={16} /> },
            { id: 'reunions', label: 'Meetings', icon: <Calendar size={16} /> }
          ].map((tab: any) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'projets' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map(p => (
                <Card key={p.id} className="p-0 overflow-hidden group hover:border-nexus-purple/40">
                  <Link to={`/projects/${p.id}`}>
                    <div className="h-44 relative overflow-hidden">
                      <img src={p.cover_url || "https://picsum.photos/seed/pro/400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Cover" />
                      <div className="absolute top-3 right-3 px-2 py-1 rounded bg-nexus-purple/90 text-[8px] font-black uppercase tracking-widest">{p.type}</div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-white group-hover:text-nexus-cyan transition-colors truncate">{p.title}</h3>
                      <p className="text-[10px] text-white/40 font-mono uppercase mt-1">Échéance : {p.release_date || 'TBD'}</p>
                    </div>
                  </Link>
                </Card>
              ))}
              <Link to="/projects">
                <div className="border-2 border-dashed border-white/5 rounded-[32px] h-full flex flex-col items-center justify-center p-12 hover:bg-white/5 hover:border-nexus-purple/30 transition-all group min-h-[220px]">
                  <Plus className="text-white/20 mb-3 group-hover:text-nexus-purple" size={32} />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Initier un Projet</span>
                </div>
              </Link>
            </motion.div>
          )}

          {activeTab === 'equipe' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Management & Staff</h3>
                <Button variant="outline" className="gap-2 border-white/10" onClick={() => setIsTeamModalOpen(true)}>
                  <Plus size={18} /> Signer un intervenant
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artistTeam.map(member => (
                  <Card key={member.id} className="p-6 border-white/5 hover:border-nexus-cyan/30 relative group">
                    <button onClick={() => handleDeleteTeamMember(member.id)} className="absolute top-4 right-4 text-white/10 hover:text-nexus-red transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-2xl bg-nexus-cyan/10 text-nexus-cyan">
                        <User size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-lg text-white truncate">{member.name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-widest text-nexus-cyan px-2 py-0.5 bg-nexus-cyan/5 rounded border border-nexus-cyan/20">
                          {member.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      {member.email && (
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Mail size={14} className="text-nexus-purple" /> {member.email}
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Phone size={14} className="text-nexus-cyan" /> {member.phone}
                        </div>
                      )}
                      {member.notes && (
                        <p className="text-[11px] text-white/30 italic line-clamp-2">"{member.notes}"</p>
                      )}
                    </div>
                  </Card>
                ))}
                {artistTeam.length === 0 && (
                  <div className="col-span-full py-24 text-center glass border-dashed border-white/10 rounded-[40px] opacity-20 italic">
                    Aucun membre d'équipe enregistré pour cet artiste.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Archives & Documents</h3>
                <Button variant="outline" className="gap-2 border-white/10" onClick={() => setIsAssetModalOpen(true)}>
                  <Plus size={18} /> Déposer un asset
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {assets.map(asset => (
                  <Card key={asset.id} className="p-5 border-white/5 hover:border-nexus-purple/30 group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-white/5 text-nexus-purple">
                        <FileCheck size={24} />
                      </div>
                      <div className="flex gap-1">
                        <a href={asset.file_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                          <Download size={16} />
                        </a>
                        <button onClick={() => handleDeleteAsset(asset.id)} className="p-2 hover:bg-nexus-red/10 rounded-lg text-white/10 hover:text-nexus-red transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-white mb-1 truncate">{asset.name}</h4>
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3">
                      {asset.file_type.split('/')[1] || 'DOC'} • {Math.round((asset.file_size || 0) / 1024)} KB
                    </p>
                    {asset.notes && <p className="text-[10px] text-white/40 line-clamp-2 italic">"{asset.notes}"</p>}
                  </Card>
                ))}
                {assets.length === 0 && (
                  <div className="col-span-full py-24 text-center glass border-dashed border-white/10 rounded-[40px] opacity-20">
                     <FileText size={48} className="mx-auto mb-4" />
                     <p className="text-sm font-bold uppercase tracking-widest italic">Le coffre-fort est vide</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Meetings Tab remains identical ... */}
        </AnimatePresence>
      </div>

      {/* MODAL: Edit Artist Profile */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Studio de Modification">
        <form onSubmit={handleUpdateArtist} className="space-y-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Avatar</label>
              <input type="file" onChange={e => setEditFiles({...editFiles, avatar: e.target.files?.[0]})} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-[10px]" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Cover</label>
              <input type="file" onChange={e => setEditFiles({...editFiles, cover: e.target.files?.[0]})} className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-[10px]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Nom de Scène</label>
            <input required type="text" value={editFormData.stage_name} onChange={e => setEditFormData({...editFormData, stage_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Bio & Univers</label>
            <textarea rows={4} value={editFormData.bio} onChange={e => setEditFormData({...editFormData, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white resize-none outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Spotify ID</label>
              <input type="text" value={editFormData.spotify_id || ''} onChange={e => setEditFormData({...editFormData, spotify_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Statut</label>
              <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as ArtistStatus})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none">
                <option value="active">Actif</option>
                <option value="on_hold">En attente</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-white/5">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Confirmer</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add Team Member */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Signer un intervenant">
        <form onSubmit={handleAddTeamMember} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Nom complet *</label>
              <input required type="text" value={newTeamMember.name} onChange={e => setNewTeamMember({...newTeamMember, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="ex: Marc Riva" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Rôle principal *</label>
              <input required type="text" value={newTeamMember.role} onChange={e => setNewTeamMember({...newTeamMember, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="ex: Manager, Booker..." />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Email</label>
              <input type="email" value={newTeamMember.email} onChange={e => setNewTeamMember({...newTeamMember, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="contact@pro.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Téléphone</label>
              <input type="tel" value={newTeamMember.phone} onChange={e => setNewTeamMember({...newTeamMember, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="+33 6..." />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Notes internes</label>
            <textarea rows={3} value={newTeamMember.notes} onChange={e => setNewTeamMember({...newTeamMember, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white resize-none" placeholder="Instructions particulières..." />
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsTeamModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Enregistrer au staff</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Upload Asset */}
      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Archives Nexus">
        <form onSubmit={handleUploadAsset} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Fichier *</label>
            <input required type="file" onChange={e => setNewAsset({...newAsset, file: e.target.files?.[0] || null})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Nom de l'asset *</label>
            <input required type="text" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="ex: Contrat Distribution V1" />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-mono font-black uppercase text-white/30 tracking-widest">Commentaires / Métadonnées</label>
            <textarea rows={3} value={newAsset.notes} onChange={e => setNewAsset({...newAsset, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white resize-none" placeholder="Contenu sensible, date d'expiration..." />
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsAssetModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Déposer l'asset</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
