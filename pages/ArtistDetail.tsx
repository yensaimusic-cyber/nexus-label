
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, Music2, Users, Disc, FileText, Download, Mail, 
  MoreVertical, Plus, ArrowLeft, ChevronRight, Camera, Trash2, Loader2, Save, File, X, Calendar, MessageSquareText
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { uploadFile, deleteFileByUrl } from '../lib/storage';
import { Artist, Project, ArtistAsset, TeamMember } from '../types';

export const ArtistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<ArtistAsset[]>([]);
  const [artistTeam, setArtistTeam] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projets' | 'equipe' | 'assets' | 'reunions'>('projets');
  
  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inputs
  const [newAsset, setNewAsset] = useState({ name: '', file: null as File | null });
  const [newTeamMember, setNewTeamMember] = useState({ profile_id: '', role: '' });

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artistRes, projectsRes, assetsRes, teamRes, profilesRes] = await Promise.all([
        supabase.from('artists').select('*').eq('id', id).single(),
        supabase.from('projects').select('*').eq('artist_id', id).order('release_date', { ascending: false }),
        supabase.from('artist_assets').select('*').eq('artist_id', id).order('created_at', { ascending: false }),
        supabase.from('artist_team_members').select('*, profile:profiles(*)').eq('artist_id', id),
        supabase.from('profiles').select('*').order('full_name')
      ]);

      setArtist(artistRes.data);
      const projData = projectsRes.data || [];
      setProjects(projData);
      setAssets(assetsRes.data || []);
      setArtistTeam(teamRes.data || []);
      setAllProfiles(profilesRes.data || []);

      // Fetch meetings related to the artist's projects
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
      alert("Erreur lors de la récupération des données de l'artiste.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.file || !newAsset.name || !id) return;
    try {
      setIsSubmitting(true);
      const url = await uploadFile(newAsset.file, 'covers', 'assets'); 
      const { data, error } = await supabase.from('artist_assets').insert([{
        artist_id: id,
        name: newAsset.name,
        file_url: url,
        file_type: newAsset.file.type,
        file_size: newAsset.file.size
      }]).select().single();
      if (error) throw error;
      setAssets([data, ...assets]);
      setIsAssetModalOpen(false);
      setNewAsset({ name: '', file: null });
    } catch (err: any) {
      alert("Échec de l'upload : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamMember.profile_id || !id) return;
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.from('artist_team_members').insert([{
        artist_id: id,
        profile_id: newTeamMember.profile_id,
        role: newTeamMember.role
      }]).select('*, profile:profiles(*)').single();
      if (error) throw error;
      setArtistTeam([...artistTeam, data]);
      setIsTeamModalOpen(false);
    } catch (err: any) {
      alert("Échec de l'assignation du membre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !artist) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-nexus-dark">
      {/* Hero simple avec stats manuelles */}
      <div className="h-[350px] relative overflow-hidden">
        <img src={artist.cover_url || "https://picsum.photos/seed/artistbg/1200/400"} className="w-full h-full object-cover brightness-[0.2]" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-nexus-dark to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 lg:p-12 flex items-end gap-8 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 lg:w-44 lg:h-44 rounded-[40px] border-4 border-white/5 overflow-hidden shadow-2xl relative z-10"
          >
            <img src={artist.avatar_url || `https://picsum.photos/seed/${artist.id}/400`} className="w-full h-full object-cover" alt="Avatar" />
          </motion.div>
          <div className="mb-4 flex-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl lg:text-7xl font-heading font-extrabold text-white tracking-tighter"
            >
              {artist.stage_name}
            </motion.h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-nexus-cyan font-mono uppercase tracking-[0.2em] text-[10px] bg-nexus-cyan/10 px-3 py-1 rounded-full border border-nexus-cyan/20">{artist.status}</span>
              <p className="text-white/40 text-sm font-medium">{artist.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-12 space-y-12">
        <div className="flex gap-2 p-1.5 glass rounded-2xl w-fit shadow-xl">
          {[
            { id: 'projets', label: 'Projets', icon: <Disc size={16} /> },
            { id: 'equipe', label: 'Équipe', icon: <Users size={16} /> },
            { id: 'assets', label: 'Assets', icon: <FileText size={16} /> },
            { id: 'reunions', label: 'Réunions', icon: <Calendar size={16} /> }
          ].map((tab: any) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-nexus-purple text-white shadow-xl' : 'text-white/40 hover:text-white'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'projets' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {projects.map(p => (
                <Card key={p.id} className="hover:border-nexus-purple/40 p-0 overflow-hidden group">
                  <Link to={`/projects/${p.id}`}>
                    <div className="h-40 relative">
                      <img src={p.cover_url || "https://picsum.photos/seed/proj/400"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cover" />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-nexus-purple/90 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">{p.type}</div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-white group-hover:text-nexus-cyan transition-colors truncate">{p.title}</h3>
                      <p className="text-[10px] text-white/40 font-mono uppercase mt-1">Sortie : {p.release_date || 'TBD'}</p>
                    </div>
                  </Link>
                </Card>
              ))}
              <Link to="/projects">
                <div className="border-2 border-dashed border-white/5 rounded-3xl h-full flex flex-col items-center justify-center p-12 hover:bg-white/5 hover:border-nexus-purple/30 transition-all cursor-pointer group min-h-[220px]">
                  <Plus className="text-white/20 mb-3 group-hover:text-nexus-purple transition-colors" size={32} />
                  <span className="text-xs font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Nouveau Projet</span>
                </div>
              </Link>
            </motion.div>
          )}

          {activeTab === 'reunions' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-heading font-extrabold text-white">Archives de Réunions</h3>
                <Link to="/meetings"><Button variant="outline" size="sm">Tout voir</Button></Link>
              </div>
              
              {meetings.length === 0 ? (
                <div className="py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-30 flex flex-col items-center justify-center">
                  <MessageSquareText size={64} className="mb-4" />
                  <p className="text-lg font-heading font-bold italic">Aucun compte-rendu disponible pour cet artiste</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map(meeting => (
                    <Card key={meeting.id} className="p-6 hover:border-nexus-purple/30 group">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                          <h4 className="font-heading font-bold text-white text-xl group-hover:text-nexus-cyan transition-colors">{meeting.title}</h4>
                          <p className="text-sm text-nexus-cyan font-mono uppercase tracking-widest mt-1">{meeting.project?.title || 'Global'}</p>
                        </div>
                        <span className="text-[10px] font-mono font-black text-nexus-purple bg-nexus-purple/10 border border-nexus-purple/20 px-3 py-1 rounded-lg w-fit">
                          {new Date(meeting.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {meeting.summary && (
                        <p className="text-white/60 text-sm leading-relaxed mb-4">{meeting.summary}</p>
                      )}
                      
                      {meeting.action_items && meeting.action_items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                          <p className="text-[10px] font-mono uppercase text-white/30 tracking-widest font-black">Plan d'action :</p>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {meeting.action_items.map((item: string, idx: number) => (
                              <li key={idx} className="text-xs text-white/70 flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-nexus-purple mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Assets & Ressources</h3>
                <Button variant="primary" size="sm" onClick={() => setIsAssetModalOpen(true)} className="shadow-lg"><Plus size={18} className="mr-2" /> Nouvel Asset</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map(asset => (
                  <Card key={asset.id} className="p-4 rounded-3xl flex items-center justify-between group hover:border-nexus-cyan/40 transition-all border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3.5 rounded-2xl bg-white/5 text-nexus-purple shadow-lg shrink-0"><FileText size={20} /></div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{asset.name}</p>
                        <p className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">{(asset.file_size / 1024 / 1024).toFixed(2)} MB • {asset.file_type.split('/')[1]}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={asset.file_url} target="_blank" download className="p-2.5 hover:bg-white/10 rounded-xl text-nexus-cyan transition-colors"><Download size={18} /></a>
                      <button onClick={async () => { 
                        if(!confirm("Supprimer cet asset ?")) return;
                        await supabase.from('artist_assets').delete().eq('id', asset.id); 
                        setAssets(assets.filter(a => a.id !== asset.id)); 
                      }} className="p-2.5 hover:bg-nexus-red/10 rounded-xl text-nexus-red transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </Card>
                ))}
                {assets.length === 0 && (
                  <div className="col-span-full py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-30 italic">
                    Aucun document partagé.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'equipe' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-heading font-extrabold text-white">Équipe Dédiée</h3>
                <Button variant="primary" size="sm" onClick={() => setIsTeamModalOpen(true)} className="shadow-lg"><Plus size={18} className="mr-2" /> Assigner Staff</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {artistTeam.map(at => (
                  <Card key={at.id} className="text-center p-8 border-white/5 hover:border-nexus-purple/30 group relative overflow-hidden">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden mx-auto mb-5 border-2 border-white/5 group-hover:border-nexus-purple/50 transition-all shadow-2xl bg-nexus-surface">
                      <img src={at.profile?.avatar_url || `https://picsum.photos/seed/${at.profile_id}/200`} className="w-full h-full object-cover" alt="Staff" />
                    </div>
                    <p className="font-heading font-extrabold text-white truncate text-lg leading-tight">{at.profile?.full_name}</p>
                    <p className="text-[10px] text-nexus-cyan font-mono uppercase mt-2 tracking-widest font-black">{at.role || 'Nexus Staff'}</p>
                    <button 
                      onClick={async () => { 
                        if(!confirm("Retirer ce membre de l'équipe artiste ?")) return;
                        await supabase.from('artist_team_members').delete().eq('id', at.id); 
                        setArtistTeam(artistTeam.filter(t => t.id !== at.id)); 
                      }} 
                      className="mt-6 text-[9px] text-nexus-red hover:underline uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Désassigner
                    </button>
                  </Card>
                ))}
                {artistTeam.length === 0 && (
                  <div className="col-span-full py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-30 italic">
                    Aucun staff assigné à cet artiste.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Asset Modal */}
      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Upload de Ressource">
        <form onSubmit={handleUploadAsset} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Nom de l'élément *</label>
            <input required type="text" placeholder="ex: EPK, Dossier de Presse, Logo HD..." value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none shadow-xl" />
          </div>
          <div className="border-2 border-dashed border-white/10 p-12 rounded-3xl text-center hover:bg-white/5 hover:border-nexus-cyan/40 transition-all cursor-pointer relative group">
            <Plus className="mx-auto mb-3 text-white/20 group-hover:text-nexus-cyan transition-colors" size={32} />
            <p className="text-sm text-white/40 font-bold">{newAsset.file ? newAsset.file.name : "Glisser un fichier ou cliquer pour parcourir"}</p>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewAsset({...newAsset, file: e.target.files?.[0] || null})} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsAssetModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Enregistrer l'Asset</Button>
          </div>
        </form>
      </Modal>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Assignation Équipe">
        <form onSubmit={handleAddTeamMember} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Collaborateur Nexus *</label>
            <select required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none appearance-none" value={newTeamMember.profile_id} onChange={e => setNewTeamMember({...newTeamMember, profile_id: e.target.value})}>
              <option value="" className="bg-nexus-surface">Rechercher dans l'annuaire...</option>
              {allProfiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Rôle spécifié pour {artist.stage_name}</label>
            <input type="text" placeholder="ex: Tour Manager, Strategist, PR..." value={newTeamMember.role} onChange={e => setNewTeamMember({...newTeamMember, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none shadow-xl" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsTeamModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Confirmer l'Assignation</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
