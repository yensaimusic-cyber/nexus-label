
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Instagram, Music2, Users, Disc, FileText, BarChart3, Download, Mail, 
  MoreVertical, Plus, ArrowLeft, ChevronRight, Camera, Trash2, Loader2, Save, File, X
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projets' | 'equipe' | 'assets' | 'stats'>('projets');
  
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
      setProjects(projectsRes.data || []);
      setAssets(assetsRes.data || []);
      setArtistTeam(teamRes.data || []);
      setAllProfiles(profilesRes.data || []);
    } catch (err: any) {
      alert("Erreur chargement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStats = async (field: string, value: number) => {
    if (!artist) return;
    try {
      const { error } = await supabase.from('artists').update({ [field]: value }).eq('id', artist.id);
      if (error) throw error;
      setArtist({ ...artist, [field]: value });
    } catch (err: any) {
      alert("Erreur stats : " + err.message);
    }
  };

  const handleUploadAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.file || !newAsset.name || !id) return;
    try {
      setIsSubmitting(true);
      const url = await uploadFile(newAsset.file, 'covers', 'assets'); // Utilise Bucket 'covers' par défaut ou crée un bucket 'assets'
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
      alert("Échec upload : " + err.message);
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
      alert("Échec ajout membre : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !artist) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-nexus-purple" size={48} /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero simple avec stats manuelles */}
      <div className="h-[300px] relative overflow-hidden">
        <img src={artist.cover_url || "https://picsum.photos/seed/bg/1200/400"} className="w-full h-full object-cover brightness-[0.3]" />
        <div className="absolute bottom-0 left-0 p-8 flex items-end gap-6">
          <div className="w-32 h-32 rounded-3xl border-4 border-nexus-surface overflow-hidden shadow-2xl">
            <img src={artist.avatar_url} className="w-full h-full object-cover" />
          </div>
          <div className="mb-2">
            <h1 className="text-5xl font-heading font-extrabold text-white">{artist.stage_name}</h1>
            <p className="text-nexus-cyan font-mono uppercase tracking-widest text-xs mt-2">{artist.status}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex gap-2 p-1 glass rounded-2xl w-fit">
          {['projets', 'equipe', 'assets', 'stats'].map((tab: any) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-nexus-purple text-white shadow-xl' : 'text-white/40 hover:text-white'}`}>{tab}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'projets' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map(p => (
                <Card key={p.id} className="hover:border-nexus-purple/40">
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  <p className="text-[10px] text-nexus-cyan font-mono uppercase">{p.type}</p>
                  <Link to={`/projects/${p.id}`} className="mt-4 block"><Button variant="outline" size="sm" className="w-full">Ouvrir</Button></Link>
                </Card>
              ))}
              <Link to="/projects">
                <div className="border-2 border-dashed border-white/10 rounded-2xl h-full flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all cursor-pointer">
                  <Plus className="text-white/20 mb-2" />
                  <span className="text-xs font-bold text-white/20 uppercase">Nouveau Projet</span>
                </div>
              </Link>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8">
                <h3 className="text-xl font-heading font-bold mb-6">Stats Spotify (Saisie manuelle)</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase text-white/40">Auditeurs Mensuels</label>
                    <div className="flex gap-4">
                      <input type="number" defaultValue={artist.monthly_listeners} onBlur={(e) => handleUpdateStats('monthly_listeners', parseInt(e.target.value))} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                      <div className="p-4 rounded-xl bg-nexus-purple/10 text-nexus-purple font-bold">{(artist.monthly_listeners || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase text-white/40">Total Streams</label>
                    <input type="number" defaultValue={artist.total_streams} onBlur={(e) => handleUpdateStats('total_streams', parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
              </Card>
              <div className="flex flex-col justify-center items-center opacity-30">
                <Music2 size={80} className="mb-4" />
                <p className="text-center text-sm max-w-xs italic">Connectez votre compte Spotify for Artists dans une future version pour l'automatisation.</p>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold">Documents & Médias</h3>
                <Button variant="primary" size="sm" onClick={() => setIsAssetModalOpen(true)}><Plus size={18} className="mr-2" /> Ajouter un Asset</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map(asset => (
                  <div key={asset.id} className="glass p-4 rounded-2xl flex items-center justify-between group hover:border-nexus-purple/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/5 text-nexus-purple"><FileText size={20} /></div>
                      <div>
                        <p className="font-bold text-sm">{asset.name}</p>
                        <p className="text-[9px] font-mono text-white/30 uppercase">{(asset.file_size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={asset.file_url} target="_blank" download className="p-2 hover:bg-white/10 rounded-lg text-nexus-cyan"><Download size={18} /></a>
                      <button onClick={async () => { await supabase.from('artist_assets').delete().eq('id', asset.id); setAssets(assets.filter(a => a.id !== asset.id)); }} className="p-2 hover:bg-nexus-red/10 rounded-lg text-nexus-red"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'equipe' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-heading font-bold">Équipe Dédiée</h3>
                <Button variant="primary" size="sm" onClick={() => setIsTeamModalOpen(true)}><Plus size={18} className="mr-2" /> Assigner un Membre</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {artistTeam.map(at => (
                  <Card key={at.id} className="text-center p-6 border-white/5 hover:border-nexus-cyan/30">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 border border-white/10">
                      <img src={at.profile?.avatar_url} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-bold text-white truncate">{at.profile?.full_name}</p>
                    <p className="text-[10px] text-nexus-cyan font-mono uppercase mt-1">{at.role || 'Collaborateur'}</p>
                    <button onClick={async () => { await supabase.from('artist_team_members').delete().eq('id', at.id); setArtistTeam(artistTeam.filter(t => t.id !== at.id)); }} className="mt-4 text-[10px] text-nexus-red hover:underline uppercase font-bold">Retirer</button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Asset Modal */}
      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Nouvel Asset">
        <form onSubmit={handleUploadAsset} className="space-y-4">
          <input required type="text" placeholder="Nom du fichier (ex: Dossier de presse)" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          <div className="border-2 border-dashed border-white/10 p-8 rounded-2xl text-center hover:bg-white/5 cursor-pointer relative">
            <Plus className="mx-auto mb-2 text-white/20" />
            <p className="text-xs text-white/40">{newAsset.file ? newAsset.file.name : "Cliquez pour sélectionner un fichier"}</p>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setNewAsset({...newAsset, file: e.target.files?.[0] || null})} />
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>Uploader</Button>
        </form>
      </Modal>

      {/* Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Assigner un Membre">
        <form onSubmit={handleAddTeamMember} className="space-y-4">
          <select required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" value={newTeamMember.profile_id} onChange={e => setNewTeamMember({...newTeamMember, profile_id: e.target.value})}>
            <option value="">Sélectionner un membre...</option>
            {allProfiles.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.full_name}</option>)}
          </select>
          <input type="text" placeholder="Rôle pour cet artiste (ex: Manager de tournée)" value={newTeamMember.role} onChange={e => setNewTeamMember({...newTeamMember, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" />
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>Assigner</Button>
        </form>
      </Modal>
    </div>
  );
};
