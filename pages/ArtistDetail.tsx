
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, Users, User, Disc, FileText, Download, Mail, 
  Plus, ArrowLeft, Camera, Trash2, Loader2, Save, File, X, Calendar, 
  MessageSquareText, Edit3, Phone, Briefcase, ExternalLink, Paperclip, FileCheck, Music2,
  AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { Artist, Project, ArtistAsset, ArtistTeamMember, ArtistStatus, ProjectType, ProjectStatus, STATUS_LABELS } from '../types';

export const ArtistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<ArtistAsset[]>([]);
  const [artistTeam, setArtistTeam] = useState<ArtistTeamMember[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [linkedProfile, setLinkedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projets' | 'equipe' | 'assets' | 'reunions'>('projets');
  
  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Entry States
  const [newAsset, setNewAsset] = useState<{name: string, type: string, file: File | null, notes: string}>({
    name: '', type: 'contract', file: null, notes: ''
  });
  const [newTeamMember, setNewTeamMember] = useState<any>({
    member_type: 'external',
    name: '', role: '', email: '', phone: '', notes: '', profile_id: null
  });
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: '', type: 'single', status: 'idea', release_date: '', budget: 0
  });
  
  // Edit Artist State
  const [editFormData, setEditFormData] = useState<Partial<Artist>>({});
  const [editFiles, setEditFiles] = useState<{avatar?: File, cover?: File}>({});

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch artist - with fallback for missing profile_id column
      let artistRes = await supabase
        .from('artists')
        .select('*, linked_profile:profiles!artists_profile_id_fkey(id, full_name, avatar_url, role)')
        .eq('id', id)
        .single();
      
      // Si erreur sur profile_id ou linked_profile, réessayer sans jointure
      if (artistRes.error && (artistRes.error.message.includes('profile_id') || artistRes.error.message.includes('linked_profile'))) {
        artistRes = await supabase
          .from('artists')
          .select('*')
          .eq('id', id)
          .single();
      }

      if (artistRes.error) throw artistRes.error;
      
      // Fetch remaining data in parallel
      const [projectsRes, assetsRes, teamRes, profilesRes] = await Promise.all([
        supabase.from('projects').select('*').eq('artist_id', id).order('release_date', { ascending: false }),
        supabase.from('artist_assets').select('*').eq('artist_id', id).order('created_at', { ascending: false }),
        supabase.from('artist_team_members').select('*, profile:profiles(id, full_name, avatar_url, role)').eq('artist_id', id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, avatar_url, role').order('full_name')
      ]);
      
      setArtist(artistRes.data);
      setLinkedProfile(artistRes.data.linked_profile);
      setEditFormData(artistRes.data);
      const projData = projectsRes.data || [];
      setProjects(projData);
      setAssets(assetsRes.data || []);
      setArtistTeam(teamRes.data || []);
      setProfiles(profilesRes.data || []);

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
      alert("Profil mis à jour avec succès !");
    } catch (err: any) {
      alert("Erreur de sauvegarde : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArtist = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('artists').delete().eq('id', id);
      if (error) throw error;
      navigate('/artists');
    } catch (err: any) {
      alert("Erreur suppression : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !id) return;
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.from('projects').insert([{
        artist_id: id,
        ...newProject
      }]).select().single();
      
      if (error) throw error;
      setProjects([data, ...projects]);
      setIsProjectModalOpen(false);
      setNewProject({ title: '', type: 'single', status: 'idea', release_date: '', budget: 0 });
      alert("Projet ajouté au pipeline !");
    } catch (err: any) {
      alert("Erreur ajout projet : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    // Validate based on member type
    if (newTeamMember.member_type === 'internal' && !newTeamMember.profile_id) {
      alert('Veuillez sélectionner un membre de l\'équipe.');
      return;
    }
    if (newTeamMember.member_type === 'external' && (!newTeamMember.name || !newTeamMember.role)) {
      alert('Nom et rôle sont obligatoires pour un intervenant externe.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const payload: any = {
        artist_id: id,
        member_type: newTeamMember.member_type
      };
      
      if (newTeamMember.member_type === 'internal') {
        payload.profile_id = newTeamMember.profile_id;
      } else {
        payload.name = newTeamMember.name;
        payload.role = newTeamMember.role;
        payload.email = newTeamMember.email;
        payload.phone = newTeamMember.phone;
        payload.notes = newTeamMember.notes;
      }
      
      const { data, error } = await supabase.from('artist_team_members').insert([payload]).select('*, profile:profiles(id, full_name, avatar_url, role)').single();
      
      if (error) throw error;
      setArtistTeam([data, ...artistTeam]);
      setIsTeamModalOpen(false);
      setNewTeamMember({ member_type: 'external', name: '', role: '', email: '', phone: '', notes: '', profile_id: null });
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
        type: newAsset.type,
        url: url,
        notes: newAsset.notes
      }]).select().single();
      
      if (error) throw error;
      setAssets([data, ...assets]);
      setIsAssetModalOpen(false);
      setNewAsset({ name: '', type: 'contract', file: null, notes: '' });
    } catch (err: any) {
      alert("Échec de l'upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    if (!confirm("Retirer ce membre ?")) return;
    try {
      const { error } = await supabase.from('artist_team_members').delete().eq('id', memberId);
      if (error) throw error;
      setArtistTeam(prev => prev.filter(m => m.id !== memberId));
    } catch (err) { alert("Suppression impossible."); }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Supprimer cet asset ?")) return;
    try {
      const { error } = await supabase.from('artist_assets').delete().eq('id', assetId);
      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err) { alert("Suppression impossible."); }
  };

  if (loading || !artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-nexus-purple" size={48} />
        <p className="mt-4 text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">Chargement du Roster...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-nexus-dark relative">
      {/* Dynamic Header */}
      <div className="h-[350px] lg:h-[450px] relative overflow-hidden group">
        <img 
          src={artist.cover_url || "https://picsum.photos/seed/artcover/1200/400"} 
          className="w-full h-full object-cover brightness-[0.3] group-hover:scale-105 transition-transform duration-1000" 
          alt="Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark via-transparent to-transparent" />
        
        <div className="absolute inset-x-0 bottom-0 p-6 lg:p-12">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 lg:gap-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="w-32 h-32 lg:w-48 lg:h-48 rounded-[48px] border-4 border-white/10 overflow-hidden shadow-2xl shrink-0 z-10 nexus-glow"
            >
              <img src={artist.avatar_url || `https://picsum.photos/seed/${artist.id}/400`} className="w-full h-full object-cover" alt="Avatar" />
            </motion.div>
            
            <div className="flex-1 text-center md:text-left z-10 pb-2">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                <h1 className="text-4xl lg:text-7xl font-heading font-extrabold text-white tracking-tighter leading-none">{artist.stage_name}</h1>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="rounded-full bg-white/5 border border-white/10 hover:bg-nexus-purple hover:border-nexus-purple">
                    <Edit3 size={16} className="mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">Modifier</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(true)} className="rounded-full bg-white/5 border border-white/10 text-nexus-red hover:bg-nexus-red/10">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-4">
                <span className="text-nexus-cyan font-mono uppercase tracking-[0.2em] text-[10px] bg-nexus-cyan/10 px-4 py-1.5 rounded-full border border-nexus-cyan/20 font-black">{artist.status}</span>
                {linkedProfile && (
                  <span className="text-nexus-purple font-mono uppercase tracking-[0.2em] text-[10px] bg-nexus-purple/10 px-4 py-1.5 rounded-full border border-nexus-purple/20 font-black flex items-center gap-2">
                    <Users size={12} />
                    Membre Equipe Indigo: {linkedProfile.full_name}
                  </span>
                )}
                <p className="text-white/40 text-sm font-medium">ID Civil: {artist.name}</p>
                <div className="flex gap-4 ml-2 pl-4 border-l border-white/10">
                  {artist.instagram_handle && (
                    <a href={`https://instagram.com/${artist.instagram_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-nexus-pink hover:scale-125 transition-transform">
                      <Instagram size={20} />
                    </a>
                  )}
                  {artist.spotify_id && (
                    <a href={`https://open.spotify.com/artist/${artist.spotify_id}`} target="_blank" rel="noreferrer" className="text-nexus-green hover:scale-125 transition-transform">
                      <Music2 size={20} />
                    </a>
                  )}
                </div>
              </div>

              {artist.bio && (
                <p className="text-white/60 text-sm max-w-3xl leading-relaxed italic line-clamp-3 md:line-clamp-none bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                  {artist.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-12 space-y-12 max-w-[1400px] mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto custom-scrollbar gap-2 p-1.5 glass rounded-[28px] w-full lg:w-fit shadow-2xl sticky top-24 z-30">
          {[
            { id: 'projets', label: 'Discographie', icon: <Disc size={16} /> },
            { id: 'equipe', label: 'Management', icon: <Users size={16} /> },
            { id: 'assets', label: 'Vault / Assets', icon: <Briefcase size={16} /> },
            { id: 'reunions', label: 'Stratégie / Meetings', icon: <Calendar size={16} /> }
          ].map((tab: any) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl nexus-glow' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'projets' && (
            <motion.div key="projets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map(p => (
                <Card key={p.id} className="p-0 overflow-hidden group hover:border-nexus-purple/40 shadow-2xl">
                  <Link to={`/projects/${p.id}`}>
                    <div className="h-52 relative overflow-hidden">
                      <img src={p.cover_url || "https://picsum.photos/seed/pro/400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Cover" />
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-nexus-purple/90 text-[9px] font-black uppercase tracking-widest backdrop-blur-md">{p.type}</div>
                      <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark via-transparent to-transparent opacity-60" />
                    </div>
                    <div className="p-6">
                      <h3 className="font-heading font-extrabold text-lg text-white group-hover:text-nexus-cyan transition-colors truncate">{p.title}</h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">{p.release_date || 'TBD'}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded border border-white/10 text-white/40 uppercase font-black">{STATUS_LABELS[p.status as ProjectStatus]}</span>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
              <button onClick={() => setIsProjectModalOpen(true)} className="w-full h-full min-h-[250px]">
                <div className="border-2 border-dashed border-white/5 rounded-[40px] h-full flex flex-col items-center justify-center p-12 hover:bg-white/5 hover:border-nexus-purple/30 transition-all group shadow-inner">
                  <Plus className="text-white/20 mb-4 group-hover:text-nexus-purple group-hover:scale-110 transition-all" size={48} />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Initier Nouveau Projet</span>
                </div>
              </button>
            </motion.div>
          )}

          {activeTab === 'equipe' && (
            <motion.div key="equipe" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Roster Management</h3>
                <Button variant="outline" className="gap-2 border-white/10" onClick={() => setIsTeamModalOpen(true)}>
                  <Plus size={18} /> <span className="uppercase font-black text-[10px] tracking-widest">Signer un intervenant</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {artistTeam.map(member => {
                  const isInternal = member.member_type === 'internal';
                  const displayName = isInternal ? member.profile?.full_name : member.name;
                  const displayRole = member.role; // Toujours afficher le rôle de la relation, pas celui du profil
                  const avatarUrl = isInternal ? member.profile?.avatar_url : null;
                  
                  return (
                    <Card key={member.id} className="p-8 border-white/5 hover:border-nexus-cyan/30 relative group shadow-xl">
                      <button onClick={() => handleDeleteTeamMember(member.id)} className="absolute top-6 right-6 text-white/10 hover:text-nexus-red transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center gap-5 mb-6">
                        {avatarUrl ? (
                          <div className="w-16 h-16 rounded-3xl overflow-hidden border-2 border-white/10 shrink-0 shadow-2xl">
                            <img src={avatarUrl} className="w-full h-full object-cover" alt={displayName} />
                          </div>
                        ) : (
                          <div className="p-4 rounded-3xl bg-nexus-cyan/10 text-nexus-cyan nexus-glow">
                            <User size={32} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-heading font-extrabold text-xl text-white truncate">{displayName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isInternal ? 'text-nexus-purple' : 'text-nexus-cyan'}`}>
                              {displayRole}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${isInternal ? 'bg-nexus-purple/10 text-nexus-purple border-nexus-purple/20' : 'bg-nexus-cyan/10 text-nexus-cyan border-nexus-cyan/20'}`}>
                              {isInternal ? 'Agent Indigo' : 'Externe'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-6 border-t border-white/5">
                        {member.email && (
                          <div className="flex items-center gap-3 text-xs text-white/60 font-mono">
                            <Mail size={16} className="text-nexus-purple" /> {member.email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-3 text-xs text-white/60 font-mono">
                            <Phone size={16} className="text-nexus-cyan" /> {member.phone}
                          </div>
                        )}
                        {member.notes && (
                          <p className="text-[11px] text-white/30 italic line-clamp-3 bg-black/40 p-4 rounded-2xl border border-white/5 mt-4">
                            "{member.notes}"
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {artistTeam.length === 0 && (
                  <div className="col-span-full py-32 text-center glass border-dashed border-white/10 rounded-[48px] opacity-20 italic">
                    Aucun staff enregistré. Constituez l'équipe de choc.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div key="assets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Nexus Vault: Assets</h3>
                <Button variant="outline" className="gap-2 border-white/10" onClick={() => setIsAssetModalOpen(true)}>
                  <Plus size={18} /> <span className="uppercase font-black text-[10px] tracking-widest">Déposer un asset</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {assets.map(asset => (
                  <Card key={asset.id} className="p-6 border-white/5 hover:border-nexus-purple/30 group shadow-2xl relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 rounded-3xl bg-white/5 text-nexus-purple">
                        <FileCheck size={28} />
                      </div>
                      <div className="flex gap-2">
                        <a href={asset.url} target="_blank" rel="noreferrer" className="p-2.5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all">
                          <Download size={18} />
                        </a>
                        <button onClick={() => handleDeleteAsset(asset.id)} className="p-2.5 hover:bg-nexus-red/10 rounded-xl text-white/10 hover:text-nexus-red transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-heading font-bold text-lg text-white mb-2 truncate">{asset.name}</h4>
                    <span className="px-2 py-0.5 rounded bg-nexus-purple/10 text-nexus-purple text-[9px] font-black uppercase tracking-widest mb-4 inline-block">
                      {asset.type}
                    </span>
                    {asset.notes && <p className="text-[10px] text-white/40 line-clamp-3 italic mt-4 bg-black/40 p-3 rounded-xl border border-white/5">"{asset.notes}"</p>}
                  </Card>
                ))}
                {assets.length === 0 && (
                   <div className="col-span-full py-32 text-center glass border-dashed border-white/10 rounded-[48px] opacity-20 flex flex-col items-center gap-4">
                     <Briefcase size={64} />
                     <p>Le coffre-fort est vide.</p>
                   </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'reunions' && (
            <motion.div key="reunions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Log de Commandement: Réunions</h3>
              </div>
              <div className="space-y-6">
                {meetings.map(meeting => (
                  <Card key={meeting.id} className="hover:border-nexus-purple/40 border-white/5 shadow-2xl p-8 group">
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-nexus-purple bg-nexus-purple/10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-nexus-purple/20 shadow-lg">{meeting.date}</span>
                          <span className="text-white/20 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                             <Disc size={12} className="text-nexus-cyan" /> Projet: {meeting.project?.title || 'Global'}
                          </span>
                        </div>
                        <h4 className="text-2xl font-heading font-extrabold text-white group-hover:text-nexus-cyan transition-colors">{meeting.title}</h4>
                        <p className="text-sm text-white/50 leading-relaxed max-w-4xl line-clamp-2">{meeting.summary}</p>
                      </div>
                      <Link to="/meetings" className="shrink-0">
                        <Button variant="ghost" className="rounded-2xl border border-white/5 text-nexus-cyan hover:bg-nexus-cyan/10">
                          Explorer <ArrowUpRight size={18} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
                {meetings.length === 0 && (
                  <div className="py-32 text-center glass border-dashed border-white/10 rounded-[48px] opacity-20 italic">
                    Aucun historique de décisions stratégiques archivé.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL: Edit Artist Profile */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Mise à jour Dossier Artiste">
        <form onSubmit={handleUpdateArtist} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-[0.3em]">Photo de Profil</label>
              <div className="relative h-40 rounded-[32px] overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer shadow-inner">
                {editFiles.avatar ? (
                  <img src={URL.createObjectURL(editFiles.avatar)} className="w-full h-full object-cover" />
                ) : artist.avatar_url ? (
                  <img src={artist.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-white/20 group-hover:text-nexus-purple transition-all" size={32} />
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setEditFiles({...editFiles, avatar: e.target.files?.[0]})} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-[0.3em]">Cover Hero</label>
              <div className="relative h-40 rounded-[32px] overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer shadow-inner">
                {editFiles.cover ? (
                  <img src={URL.createObjectURL(editFiles.cover)} className="w-full h-full object-cover" />
                ) : artist.cover_url ? (
                  <img src={artist.cover_url} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-white/20 group-hover:text-nexus-purple transition-all" size={32} />
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setEditFiles({...editFiles, cover: e.target.files?.[0]})} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-widest">Nom de Scène Official *</label>
            <input required type="text" value={editFormData.stage_name} onChange={e => setEditFormData({...editFormData, stage_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-nexus-purple shadow-xl" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-widest">Bio & Univers Artistique</label>
            <textarea rows={5} value={editFormData.bio} onChange={e => setEditFormData({...editFormData, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white resize-none outline-none focus:border-nexus-purple shadow-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-widest">Spotify Artist ID</label>
              <input type="text" placeholder="ID de l'artiste sur Spotify" value={editFormData.spotify_id || ''} onChange={e => setEditFormData({...editFormData, spotify_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-widest">Instagram Handle</label>
              <input type="text" placeholder="@nomutilisateur" value={editFormData.instagram_handle || ''} onChange={e => setEditFormData({...editFormData, instagram_handle: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-widest">Statut Contractuel</label>
            <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value as ArtistStatus})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl appearance-none">
              <option value="active" className="bg-nexus-surface">Actif</option>
              <option value="on_hold" className="bg-nexus-surface">En attente / Break</option>
              <option value="archived" className="bg-nexus-surface">Archivé</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-black uppercase text-white/30 tracking-widest">Lier à un Membre de l'Équipe Indigo</label>
            <select 
              value={editFormData.profile_id || ''} 
              onChange={e => setEditFormData({...editFormData, profile_id: e.target.value || null})} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl appearance-none"
            >
              <option value="" className="bg-nexus-surface">Aucun (artiste externe)</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id} className="bg-nexus-surface">
                  {profile.full_name} {profile.role ? `(${profile.role})` : ''}
                </option>
              ))}
            </select>
            <p className="text-white/30 text-xs italic">Si cet artiste est également membre de l'équipe Indigo, sélectionnez son profil</p>
          </div>

          <div className="flex gap-4 pt-8 border-t border-white/5">
            <Button type="button" variant="ghost" className="flex-1 h-14" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1 h-14 uppercase font-black tracking-widest text-xs" isLoading={isSubmitting}>Enregistrer les modifications</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: New Project */}
      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Initier un Nouveau Projet">
        <form onSubmit={handleAddProject} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Titre du projet *</label>
            <input required type="text" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-nexus-cyan shadow-xl" placeholder="ex: EP Genesis" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Format</label>
              <select value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value as ProjectType})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl appearance-none">
                <option value="single">Single</option>
                <option value="ep">EP</option>
                <option value="album">Album</option>
                <option value="mixtape">Mixtape</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Statut initial</label>
              <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value as ProjectStatus})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl appearance-none">
                <option value="idea">Idée / Maquette</option>
                <option value="pre_production">Pré-Production</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Date de Sortie (Cible)</label>
            <input type="date" value={newProject.release_date} onChange={e => setNewProject({...newProject, release_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none [color-scheme:dark]" />
          </div>
          <Button type="submit" variant="primary" className="w-full h-16 font-black uppercase tracking-[0.2em]" isLoading={isSubmitting}>Lancer la Production</Button>
        </form>
      </Modal>

      {/* MODAL: Add Team Member */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Signer un Intervenant Management">
        <form onSubmit={handleAddTeamMember} className="space-y-5">
           {/* Toggle between internal and external */}
           <div className="flex gap-2 p-1 glass rounded-2xl mb-6">
              <button 
                type="button"
                onClick={() => setNewTeamMember({...newTeamMember, member_type: 'internal', name: '', role: '', email: '', phone: '', notes: ''})}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${newTeamMember.member_type === 'internal' ? 'bg-nexus-purple text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
              >
                Agent Indigo
              </button>
              <button 
                type="button"
                onClick={() => setNewTeamMember({...newTeamMember, member_type: 'external', profile_id: null})}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${newTeamMember.member_type === 'external' ? 'bg-nexus-cyan text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
              >
                Intervenant Externe
              </button>
           </div>

           {newTeamMember.member_type === 'internal' ? (
             <div className="space-y-2">
               <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Agent Indigo *</label>
               <select 
                 required 
                 value={newTeamMember.profile_id || ''} 
                 onChange={e => setNewTeamMember({...newTeamMember, profile_id: e.target.value})} 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none shadow-xl"
               >
                 <option value="" className="bg-nexus-surface">Identifier l'agent...</option>
                 {profiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name} ({p.role})</option>)}
               </select>
             </div>
           ) : (
             <>
               <div className="space-y-2">
                 <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Nom complet *</label>
                 <input required type="text" value={newTeamMember.name} onChange={e => setNewTeamMember({...newTeamMember, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" placeholder="ex: Julien Smith" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Rôle / Poste *</label>
                 <input required type="text" value={newTeamMember.role} onChange={e => setNewTeamMember({...newTeamMember, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" placeholder="ex: Manager, Booking, PR..." />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Email</label>
                   <input type="email" value={newTeamMember.email} onChange={e => setNewTeamMember({...newTeamMember, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Téléphone</label>
                   <input type="tel" value={newTeamMember.phone} onChange={e => setNewTeamMember({...newTeamMember, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none" />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Notes stratégiques</label>
                 <textarea rows={3} value={newTeamMember.notes} onChange={e => setNewTeamMember({...newTeamMember, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none resize-none" />
               </div>
             </>
           )}
           <Button type="submit" variant="primary" className="w-full h-14 font-black uppercase tracking-widest text-[10px]" isLoading={isSubmitting}>Enregistrer au staff</Button>
        </form>
      </Modal>

      {/* MODAL: Upload Asset */}
      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Archives Nexus: Déposer un Asset">
        <form onSubmit={handleUploadAsset} className="space-y-5">
           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Nom de l'Asset *</label>
             <input required type="text" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" placeholder="ex: Contrat Distribution 2024" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Type de document</label>
             <select value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none appearance-none">
               <option value="contract">Contrat / Juridique</option>
               <option value="photo">Identité Visuelle / Photo</option>
               <option value="epk">EPK / Bio</option>
               <option value="rider">Rider / Fiche Technique</option>
               <option value="other">Autre / Divers</option>
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Fichier Source *</label>
             <div className="relative h-32 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center group hover:border-nexus-purple transition-all cursor-pointer overflow-hidden">
                {newAsset.file ? (
                  <div className="flex items-center gap-3 text-nexus-cyan">
                    <FileCheck size={32} />
                    <span className="text-xs font-bold truncate max-w-[200px]">{newAsset.file.name}</span>
                  </div>
                ) : (
                  <>
                    <Paperclip className="text-white/20 group-hover:text-nexus-purple mb-2" size={32} />
                    <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">Cliquer pour uploader</span>
                  </>
                )}
                <input required type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewAsset({...newAsset, file: e.target.files?.[0] || null})} />
             </div>
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Commentaires</label>
             <textarea rows={2} value={newAsset.notes} onChange={e => setNewAsset({...newAsset, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none resize-none" />
           </div>
           <Button type="submit" variant="primary" className="w-full h-14 font-black uppercase tracking-widest text-[10px]" isLoading={isSubmitting}>Stocker dans le Vault</Button>
        </form>
      </Modal>

      {/* MODAL: Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="⚠️ ALERTE CRITIQUE: Suppression">
        <div className="space-y-8 text-center py-6">
          <div className="w-24 h-24 bg-nexus-red/10 text-nexus-red rounded-full flex items-center justify-center mx-auto nexus-glow">
            <AlertTriangle size={48} />
          </div>
          <div className="space-y-4">
            <p className="text-white text-2xl font-heading font-extrabold leading-tight">Confirmation de la rupture définitive du contrat ?</p>
            <p className="text-white/40 text-sm leading-relaxed px-4">
              Cette action est <span className="text-nexus-red font-black uppercase">irréversible</span>. Toutes les archives, projets et assets liés à <span className="text-white font-bold">{artist.stage_name}</span> seront effacés des serveurs Nexus.
            </p>
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
            <Button variant="danger" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={handleDeleteArtist} isLoading={isSubmitting}>Éffacer les données</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
