import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { ChevronLeft, Plus, X, Users, ListTodo, Briefcase, Trash2, Folder } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { AdminOnly } from '../components/AdminOnly';

interface Artist {
  id: string;
  name: string;
  stage_name: string;
  cover_url?: string;
  status?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  due_date?: string;
  project_id: string;
  project?: {
    id: string;
    title: string;
    artist_id: string;
  };
}

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  artist_id: string;
  cover_url?: string;
  release_date?: string;
}

interface ManagerArtistLink {
  id: string;
  artist_id: string;
  profile_id: string;
  role: string;
  artist?: Artist;
}

const Management: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [managedArtists, setManagedArtists] = useState<ManagerArtistLink[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedProfileToPromote, setSelectedProfileToPromote] = useState('');
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [managerRole, setManagerRole] = useState('Manager');
  const [newManager, setNewManager] = useState({ full_name: '', email: '', role: 'Manager', avatar_url: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchProfiles();
    fetchAllArtists();
    fetchAllProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      fetchManagedArtists();
    }
  }, [selectedProfile]);

  useEffect(() => {
    if (managedArtists.length > 0) {
      fetchTasks();
      fetchProjects();
    } else {
      setTasks([]);
      setProjects([]);
    }
  }, [managedArtists]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_manager', true)
        .order('full_name');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      addToast('Erreur lors du chargement des profils', 'error');
    }
  };

  const fetchAllArtists = async () => {
    try {
      // Essayer d'abord avec stage_name, sinon utiliser name
      let { data, error } = await supabase
        .from('artists')
        .select('id, name, stage_name, cover_url, status')
        .order('stage_name');
      
      // Si erreur sur stage_name ou profile_id, réessayer avec juste name
      if (error && (error.message.includes('stage_name') || error.message.includes('profile_id'))) {
        const result = await supabase
          .from('artists')
          .select('id, name, cover_url, status')
          .order('name');
        data = result.data;
        error = result.error;
        
        // Ajouter stage_name = name pour compatibilité
        if (data) {
          data = data.map(a => ({ ...a, stage_name: a.name }));
        }
      }
      
      if (error) throw error;
      setAllArtists(data || []);
    } catch (err: any) {
      console.error('Error fetching artists:', err);
      addToast(`Erreur de chargement: ${err.message}`, 'error');
    }
  };

  const fetchAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('is_manager', false)
        .order('full_name');
      
      if (error) throw error;
      setAllProfiles(data || []);
    } catch (err) {
      console.error('Error fetching all profiles:', err);
    }
  };

  const fetchManagedArtists = async () => {
    if (!selectedProfile) return;
    
    try {
      // Essayer d'abord avec stage_name
      let { data, error } = await supabase
        .from('artist_team_members')
        .select(`
          id,
          artist_id,
          profile_id,
          role,
          artist:artists(id, name, stage_name, cover_url, status)
        `)
        .eq('profile_id', selectedProfile.id)
        .eq('member_type', 'internal');
      
      // Si erreur sur stage_name ou profile_id, réessayer sans
      if (error && (error.message.includes('stage_name') || error.message.includes('profile_id') || error.message.includes('member_type'))) {
        const result = await supabase
          .from('artist_team_members')
          .select(`
            id,
            artist_id,
            profile_id,
            role,
            artist:artists(id, name, cover_url, status)
          `)
          .eq('profile_id', selectedProfile.id)
          .eq('member_type', 'internal');
        
        data = result.data;
        error = result.error;
        
        // Ajouter stage_name = name
        if (data) {
          data = data.map(item => ({
            ...item,
            artist: item.artist ? { ...item.artist, stage_name: item.artist.name } : null
          }));
        }
      }
      
      if (error) throw error;
      setManagedArtists(data || []);
    } catch (err: any) {
      console.error('Error fetching managed artists:', err);
      addToast(`Erreur: ${err.message}`, 'error');
    }
  };

  const fetchTasks = async () => {
    if (managedArtists.length === 0) return;
    
    const artistIds = managedArtists.map(ma => ma.artist_id);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(id, title, artist_id)
        `)
        .in('project.artist_id', artistIds)
        .neq('status', 'done')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      // Filter tasks whose projects belong to managed artists
      const filteredTasks = (data || []).filter(task => 
        task.project && artistIds.includes(task.project.artist_id)
      );
      
      setTasks(filteredTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      addToast('Erreur lors du chargement des tâches', 'error');
    }
  };

  const fetchProjects = async () => {
    if (managedArtists.length === 0) return;
    
    const artistIds = managedArtists.map(ma => ma.artist_id);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .in('artist_id', artistIds)
        .neq('status', 'released')
        .order('release_date', { ascending: true });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      addToast('Erreur lors du chargement des projets', 'error');
    }
  };

  const handleLinkArtist = async () => {
    if (!selectedProfile || !selectedArtistId) return;
    
    setLoading(true);
    try {
      // Check if link already exists
      const { data: existing } = await supabase
        .from('artist_team_members')
        .select('id')
        .eq('artist_id', selectedArtistId)
        .eq('profile_id', selectedProfile.id)
        .single();
      
      if (existing) {
        addToast('Cet artiste est déjà lié à ce manager', 'error');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('artist_team_members')
        .insert({
          artist_id: selectedArtistId,
          profile_id: selectedProfile.id,
          member_type: 'internal',
          role: managerRole
        });
      
      if (error) throw error;
      
      addToast('Artiste lié avec succès', 'success');
      setShowLinkModal(false);
      setSelectedArtistId('');
      setManagerRole('Manager');
      fetchManagedArtists();
    } catch (err) {
      console.error('Error linking artist:', err);
      addToast('Erreur lors de la liaison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkArtist = async (linkId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer cette liaison ?')) return;
    
    try {
      const { error } = await supabase
        .from('artist_team_members')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      
      addToast('Liaison retirée', 'success');
      fetchManagedArtists();
    } catch (err) {
      console.error('Error unlinking artist:', err);
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleAddManager = async () => {
    if (!newManager.full_name.trim() || !newManager.email.trim()) {
      addToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          full_name: newManager.full_name,
          email: newManager.email,
          role: newManager.role,
          avatar_url: newManager.avatar_url || null,
          is_manager: true
        });
      
      if (error) throw error;
      
      addToast('Manager ajouté avec succès', 'success');
      setShowAddManagerModal(false);
      setNewManager({ full_name: '', email: '', role: 'Manager', avatar_url: '' });
      fetchProfiles();
    } catch (err) {
      console.error('Error adding manager:', err);
      addToast('Erreur lors de l\'ajout du manager', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManager = async (profileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Retirer ce membre de la liste des managers ? Le profil et les liaisons artistes seront conservés.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_manager: false })
        .eq('id', profileId);
      
      if (error) throw error;
      
      addToast('Manager retiré de la liste', 'success');
      fetchProfiles();
      fetchAllProfiles();
    } catch (err) {
      console.error('Error removing manager:', err);
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const handlePromoteToManager = async () => {
    if (!selectedProfileToPromote) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_manager: true })
        .eq('id', selectedProfileToPromote);
      
      if (error) throw error;
      
      addToast('Membre promu en manager', 'success');
      setShowPromoteModal(false);
      setSelectedProfileToPromote('');
      fetchProfiles();
      fetchAllProfiles();
    } catch (err) {
      console.error('Error promoting to manager:', err);
      addToast('Erreur lors de la promotion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableArtists = () => {
    const managedArtistIds = managedArtists.map(ma => ma.artist_id);
    return allArtists.filter(a => !managedArtistIds.includes(a.id));
  };

  if (selectedProfile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back button */}
        <button 
          onClick={() => setSelectedProfile(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-mono uppercase tracking-widest font-black">Retour</span>
        </button>

        {/* Manager Header */}
        <div className="flex items-start gap-6">
          {selectedProfile.avatar_url ? (
            <img src={selectedProfile.avatar_url} alt={selectedProfile.full_name} className="w-24 h-24 rounded-2xl object-cover" />
          ) : (
            <div className="w-24 h-24 glass rounded-2xl flex items-center justify-center">
              <Users className="w-10 h-10 text-white/30" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-black text-white mb-2">{selectedProfile.full_name}</h1>
            <p className="text-white/60">{selectedProfile.role || 'Agent Indigo'}</p>
            {selectedProfile.email && (
              <p className="text-white/40 text-sm mt-1">{selectedProfile.email}</p>
            )}
          </div>
        </div>

        {/* Managed Artists Section */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-nexus-purple" />
              <h2 className="text-xl font-black text-white">Artistes managés</h2>
            </div>
            <AdminOnly>
              <Button onClick={() => setShowLinkModal(true)} icon={Plus}>
                Lier un artiste
              </Button>
            </AdminOnly>
          </div>

          {managedArtists.length === 0 ? (
            <p className="text-white/40 text-center py-8">Aucun artiste lié pour le moment</p>
          ) : (
            <div className="grid gap-4">
              {managedArtists.map(link => (
                <div key={link.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {link.artist?.cover_url ? (
                      <img src={link.artist.cover_url} alt={link.artist?.stage_name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 glass rounded-xl" />
                    )}
                    <div>
                      <h3 className="text-white font-bold">{link.artist?.stage_name}</h3>
                      <p className="text-white/60 text-sm">{link.role}</p>
                      {link.artist?.status && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-nexus-purple/20 text-nexus-purple border border-nexus-purple/30 mt-1 inline-block">
                          {link.artist.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <AdminOnly>
                    <button 
                      onClick={() => handleUnlinkArtist(link.id)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-red-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </AdminOnly>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Projects Section */}
        {projects.length > 0 && (
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Folder className="w-5 h-5 text-nexus-purple" />
              <h2 className="text-xl font-black text-white">Projets en cours</h2>
              <span className="text-white/40 text-sm">({projects.length})</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map(project => {
                const artistLink = managedArtists.find(ma => ma.artist_id === project.artist_id);
                const artistName = artistLink?.artist?.stage_name;
                return (
                  <div key={project.id} className="glass rounded-xl p-4 hover:border-nexus-purple/50 transition-all">
                    <div className="flex items-start gap-4">
                      {project.cover_url ? (
                        <img src={project.cover_url} alt={project.title} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 glass rounded-lg flex items-center justify-center">
                          <Folder className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold truncate">{project.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {artistName && (
                            <span className="text-xs text-white/60">{artistName}</span>
                          )}
                          {artistName && project.type && <span className="text-white/30">·</span>}
                          {project.type && (
                            <span className="text-xs text-white/60 capitalize">{project.type}</span>
                          )}
                          {project.release_date && (
                            <>
                              <span className="text-white/30">·</span>
                              <span className="text-xs text-white/60">
                                {new Date(project.release_date).toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${
                            project.status === 'production' 
                              ? 'bg-nexus-purple/20 text-nexus-purple border-nexus-purple/30'
                              : project.status === 'post_production'
                              ? 'bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan/30'
                              : project.status === 'release'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-white/5 text-white/60 border-white/10'
                          }`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Tasks Section */}
        {tasks.length > 0 && (
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <ListTodo className="w-5 h-5 text-nexus-cyan" />
              <h2 className="text-xl font-black text-white">Tâches des artistes managés</h2>
              <span className="text-white/40 text-sm">({tasks.length})</span>
            </div>

            <div className="space-y-2">
              {tasks.map(task => {
                const artistLink = managedArtists.find(ma => ma.artist_id === task.project?.artist_id);
                const artistName = artistLink?.artist?.stage_name;
                return (
                  <div key={task.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-bold">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-white/60">{task.project?.title}</span>
                          {artistName && (
                            <>
                              <span className="text-white/30">·</span>
                              <span className="text-xs text-white/60">{artistName}</span>
                            </>
                          )}
                          {task.due_date && (
                            <>
                              <span className="text-white/30">·</span>
                              <span className="text-xs text-white/60">
                                {new Date(task.due_date).toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        task.status === 'Terminé' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : task.status === 'En cours'
                          ? 'bg-nexus-cyan/20 text-nexus-cyan border-nexus-cyan/30'
                          : 'bg-white/5 text-white/60 border-white/10'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Link Artist Modal */}
        <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="Lier un artiste">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Artiste *</label>
              <select
                value={selectedArtistId}
                onChange={(e) => setSelectedArtistId(e.target.value)}
                className="w-full glass text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-nexus-purple/50"
              >
                <option value="">Sélectionner un artiste</option>
                {getAvailableArtists().map(artist => (
                  <option key={artist.id} value={artist.id}>
                    {artist.stage_name} ({artist.name})
                  </option>
                ))}
              </select>
              <p className="text-white/30 text-xs italic">{allArtists.length} artiste(s) au roster, {getAvailableArtists().length} disponible(s)</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Rôle *</label>
              <input
                type="text"
                value={managerRole}
                onChange={(e) => setManagerRole(e.target.value)}
                placeholder="ex: Manager, A&R, Producteur exécutif"
                className="w-full glass text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-nexus-purple/50"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowLinkModal(false)} variant="glass">
                Annuler
              </Button>
              <AdminOnly>
                <Button 
                  onClick={handleLinkArtist} 
                  disabled={!selectedArtistId || !managerRole.trim() || loading}
                >
                  {loading ? 'Liaison...' : 'Lier l\'artiste'}
                </Button>
              </AdminOnly>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white mb-2">Management</h1>
          <p className="text-white/60">Gérez les managers et leurs artistes affiliés</p>
        </div>
        <div className="flex gap-3">
          <AdminOnly>
            <Button onClick={() => setShowPromoteModal(true)} variant="outline" icon={Users}>
              Promouvoir un membre
            </Button>
          </AdminOnly>
          <AdminOnly>
            <Button onClick={() => setShowAddManagerModal(true)} icon={Plus}>
              Ajouter un manager
            </Button>
          </AdminOnly>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {profiles.map(profile => (
          <div 
            key={profile.id}
            onClick={() => setSelectedProfile(profile)}
            className="cursor-pointer relative group"
          >
            <AdminOnly>
              <button
                onClick={(e) => handleDeleteManager(profile.id, e)}
                className="absolute top-4 right-4 z-10 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </AdminOnly>
            <Card className="hover:border-nexus-purple/50 transition-all">
              <div className="flex flex-col items-center text-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-2xl object-cover mb-4" />
                ) : (
                  <div className="w-24 h-24 glass rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-white/30" />
                  </div>
                )}
                <h3 className="text-lg font-black text-white mb-1">{profile.full_name}</h3>
                <p className="text-white/60 text-sm">{profile.role || 'Agent Indigo'}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <p className="text-white/40 text-center py-12">Aucun membre de l'équipe trouvé</p>
      )}

      {/* Add Manager Modal */}
      <Modal isOpen={showAddManagerModal} onClose={() => setShowAddManagerModal(false)} title="Ajouter un manager">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Nom complet *</label>
            <input
              type="text"
              value={newManager.full_name}
              onChange={(e) => setNewManager({...newManager, full_name: e.target.value})}
              placeholder="ex: John Doe"
              className="w-full glass text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-nexus-purple/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Email *</label>
            <input
              type="email"
              value={newManager.email}
              onChange={(e) => setNewManager({...newManager, email: e.target.value})}
              placeholder="ex: john@indigo.com"
              className="w-full glass text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-nexus-purple/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Rôle</label>
            <input
              type="text"
              value={newManager.role}
              onChange={(e) => setNewManager({...newManager, role: e.target.value})}
              placeholder="ex: Manager, A&R, Producteur"
              className="w-full glass text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-nexus-purple/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">URL Avatar</label>
            <input
              type="url"
              value={newManager.avatar_url}
              onChange={(e) => setNewManager({...newManager, avatar_url: e.target.value})}
              placeholder="https://..."
              className="w-full glass text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-nexus-purple/50"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowAddManagerModal(false)} variant="ghost">
              Annuler
            </Button>
            <AdminOnly>
              <Button 
                onClick={handleAddManager} 
                disabled={!newManager.full_name.trim() || !newManager.email.trim() || loading}
              >
                {loading ? 'Ajout...' : 'Ajouter'}
              </Button>
            </AdminOnly>
          </div>
        </div>
      </Modal>

      {/* Promote Member Modal */}
      <Modal isOpen={showPromoteModal} onClose={() => setShowPromoteModal(false)} title="Promouvoir un membre en manager">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-black">Sélectionner un membre de l'équipe *</label>
            <select
              value={selectedProfileToPromote}
              onChange={(e) => setSelectedProfileToPromote(e.target.value)}
              className="w-full glass text-white px-4 py-3 rounded-xl border border-white/5 focus:outline-none focus:border-nexus-purple/50"
            >
              <option value="">Choisir un membre...</option>
              {allProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} {profile.role ? `(${profile.role})` : ''}
                </option>
              ))}
            </select>
            <p className="text-white/30 text-xs italic">Ce membre sera ajouté à la liste des managers</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowPromoteModal(false)} variant="ghost">
              Annuler
            </Button>
            <AdminOnly>
              <Button 
                onClick={handlePromoteToManager} 
                disabled={!selectedProfileToPromote || loading}
              >
                {loading ? 'Promotion...' : 'Promouvoir'}
              </Button>
            </AdminOnly>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Management;
