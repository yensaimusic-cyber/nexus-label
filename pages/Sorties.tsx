import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AdminOnly } from '../components/AdminOnly';
import { Calendar, Plus, Search, Loader2, Camera, Edit2, Trash2, CheckCircle, Disc, Clock, Zap } from 'lucide-react';
import { useSorties, type Sortie } from '../hooks/useSorties';
import { formatDate } from '../lib/utils';

export const Sorties: React.FC = () => {
  const { sorties, loading, addSortie, updateSortie, deleteSortie } = useSorties();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSortie, setEditingSortie] = useState<Sortie | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState<Partial<Sortie>>({
    title: '',
    release_date: '',
    description: '',
    status: 'planned',
    platforms: [],
    spotify_url: '',
  });

  const handleOpenModal = (sortie?: Sortie) => {
    if (sortie && sortie.source === 'project') {
      return;
    }
    if (sortie) {
      setEditingSortie(sortie);
      setFormData({
        title: sortie.title,
        release_date: sortie.release_date,
        description: sortie.description,
        status: sortie.status,
        platforms: sortie.platforms || [],
        spotify_url: sortie.spotify_url,
      });
    } else {
      setEditingSortie(null);
      setFormData({
        title: '',
        release_date: '',
        description: '',
        status: 'planned',
        platforms: [],
        spotify_url: '',
      });
    }
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.release_date) return;

    try {
      setIsSubmitting(true);
      if (editingSortie) {
        await updateSortie(editingSortie.id, formData, coverFile || undefined);
      } else {
        await addSortie(formData, coverFile || undefined);
      }
      setIsModalOpen(false);
      setEditingSortie(null);
      setFormData({
        title: '',
        release_date: '',
        description: '',
        status: 'planned',
        platforms: [],
        spotify_url: '',
      });
      setCoverFile(null);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sortie?')) return;
    try {
      await deleteSortie(id);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  };

  const filteredSorties = sorties.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const plannedSorties = filteredSorties.filter((s) => s.status === 'planned');
  const releasedSorties = filteredSorties.filter((s) => s.status === 'released');
  const cancelledSorties = filteredSorties.filter((s) => s.status === 'cancelled');

  // Highest priority: next sorties in the coming week
  const upcomingThis = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return plannedSorties.filter(s => {
      const releaseDate = new Date(s.release_date);
      return releaseDate <= nextWeek && releaseDate >= today;
    });
  }, [plannedSorties]);

  const getDaysUntil = (releaseDate: string): number => {
    return Math.ceil(
      (new Date(releaseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getUrgencyColor = (days: number): string => {
    if (days <= 3) return 'from-red-500 to-red-600';
    if (days <= 7) return 'from-orange-500 to-orange-600';
    if (days <= 14) return 'from-yellow-500 to-yellow-600';
    return 'from-nexus-purple to-nexus-cyan';
  };

  const getUrgencyBgColor = (days: number): string => {
    if (days <= 3) return 'bg-red-500/10 border-red-500/30';
    if (days <= 7) return 'bg-orange-500/10 border-orange-500/30';
    if (days <= 14) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-nexus-purple/10 border-nexus-purple/30';
  };

  const renderSortieCard = (sortie: Sortie) => {
    const isProject = sortie.source === 'project';
    const daysUntil = getDaysUntil(sortie.release_date);
    const isUpcoming = sortie.status === 'planned' && daysUntil >= 0;
    const isVeryUrgent = daysUntil <= 7 && daysUntil >= 0;

    return (
      <motion.div
        key={sortie.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`group relative h-full ${isVeryUrgent ? 'ring-2 ring-offset-1 ring-offset-nexus-dark' : ''}`}
        style={isVeryUrgent ? { '--tw-ring-color': 'var(--color-urgent)' } as any : {}}
      >
        <style>
          {isVeryUrgent && `
            .group { --color-urgent: ${daysUntil <= 3 ? '#ef4444' : '#f97316'}; }
          `}
        </style>
        
        <Card className={`p-0 overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-2xl ${
          isVeryUrgent ? 'border-2 border-orange-500/50' : ''
        }`}>
          {/* Cover Image */}
          <div className="relative overflow-hidden h-48 bg-gradient-to-br from-nexus-purple/20 to-nexus-cyan/20">
            {sortie.cover_url ? (
              <img
                src={sortie.cover_url}
                alt={sortie.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-nexus-purple/30 to-nexus-cyan/30">
                <Disc className="text-white/20" size={48} />
              </div>
            )}

            {/* Badges - Top Left */}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              {isProject && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-nexus-cyan/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-lg"
                >
                  <Disc size={12} />
                  Projet
                </motion.div>
              )}
            </div>

            {/* Countdown - Top Right */}
            {isUpcoming && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute top-3 right-3 backdrop-blur-md rounded-lg px-3 py-2 font-bold text-sm shadow-lg flex items-center gap-1.5 ${
                  daysUntil <= 3
                    ? 'bg-red-500/90 text-white'
                    : daysUntil <= 7
                    ? 'bg-orange-500/90 text-white'
                    : 'bg-nexus-purple/90 text-white'
                }`}
              >
                <Clock size={14} />
                {daysUntil === 0 ? 'AUJOURD\'HUI' : daysUntil === 1 ? 'DEMAIN' : `${daysUntil}j`}
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col p-4 space-y-3">
            {/* Title */}
            {isProject ? (
              <Link to={`/projects/${sortie.project_id}`}>
                <h3 className="font-heading font-bold text-lg text-white group-hover:text-nexus-cyan transition-colors line-clamp-2">
                  {sortie.title}
                </h3>
              </Link>
            ) : (
              <h3 className="font-heading font-bold text-lg text-white group-hover:text-nexus-cyan transition-colors line-clamp-2">
                {sortie.title}
              </h3>
            )}

            {/* Artist & Manager Info */}
            <div className="space-y-1.5">
              {sortie.artist_name && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-nexus-cyan/60 font-semibold">Artiste:</span>
                  <span className="text-white font-medium">{sortie.artist_name}</span>
                </div>
              )}
              {sortie.manager_name && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-nexus-purple/60 font-semibold">Manager:</span>
                  <span className="text-white/80 font-medium">{sortie.manager_name}</span>
                </div>
              )}
            </div>

            {/* Date */}
            <div className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-3 py-2 w-fit ${getUrgencyBgColor(daysUntil)}`}>
              <Calendar size={15} className="text-nexus-cyan" />
              <span className="text-white">{formatDate(sortie.release_date)}</span>
            </div>

            {/* Description */}
            {sortie.description && !isProject && (
              <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                {sortie.description}
              </p>
            )}

            {/* Platforms */}
            {sortie.platforms && sortie.platforms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sortie.platforms.slice(0, 3).map((platform) => (
                  <span
                    key={platform}
                    className="text-xs font-semibold bg-gradient-to-r from-nexus-purple/40 to-nexus-cyan/40 text-nexus-cyan px-2.5 py-1 rounded-full border border-nexus-cyan/30"
                  >
                    {platform}
                  </span>
                ))}
                {sortie.platforms.length > 3 && (
                  <span className="text-xs font-semibold text-white/60 px-2.5 py-1">
                    +{sortie.platforms.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            {!isProject && (
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <AdminOnly>
                  <button
                    onClick={() => handleOpenModal(sortie)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-nexus-purple/30 hover:bg-nexus-purple/50 text-nexus-purple rounded-lg transition-all duration-300 text-sm font-semibold group/btn"
                  >
                    <Edit2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDelete(sortie.id)}
                    className="px-3 py-2.5 bg-nexus-red/30 hover:bg-nexus-red/50 text-nexus-red rounded-lg transition-all duration-300 group/btn"
                  >
                    <Trash2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
                </AdminOnly>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tight">
            Sorties
          </h1>
          <p className="text-nexus-lightGray text-base font-medium">
            Gérez les sorties prévues du label (projets + sorties détaillées)
          </p>
        </div>
        <AdminOnly>
          <Button
            variant="primary"
            className="gap-2 px-6 py-3 text-base"
            onClick={() => handleOpenModal()}
          >
            <Plus size={20} />
            <span>Nouvelle Sortie</span>
          </Button>
        </AdminOnly>
      </motion.header>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-cyan/50 group-hover:text-nexus-cyan transition-colors" size={20} />
        <input
          type="text"
          placeholder="Rechercher une sortie, un projet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-xl py-3 pl-12 pr-4 text-base text-white placeholder-white/50 border border-white/10 group-hover:border-nexus-cyan/50 transition-all focus:border-nexus-cyan focus:ring-2 focus:ring-nexus-cyan/20"
        />
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="text-nexus-purple" size={56} />
          </motion.div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* 🔴 Sorties TRÈS URGENTES (0-3 jours) */}
          {upcomingThis.filter(s => getDaysUntil(s.release_date) <= 3).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 w-fit">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="text-red-400" size={22} />
                </motion.div>
                <h3 className="text-lg font-black text-red-300 uppercase tracking-wide">
                  ⚡ Sorties cette semaine
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence>
                  {upcomingThis.filter(s => getDaysUntil(s.release_date) <= 3).map(renderSortieCard)}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* 🟠 Prochaines Sorties à Venir */}
          {plannedSorties.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-nexus-purple/20 to-nexus-cyan/20 border border-nexus-purple/30 w-fit">
                <Calendar className="text-nexus-cyan" size={22} />
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  À Venir ({plannedSorties.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AnimatePresence>
                  {plannedSorties.map(renderSortieCard)}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* 🟢 Sorties Publiées */}
          {releasedSorties.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-nexus-green/20 to-emerald-500/20 border border-nexus-green/30 w-fit">
                <CheckCircle className="text-nexus-green" size={22} />
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Publiées ({releasedSorties.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-75">
                <AnimatePresence>
                  {releasedSorties.map(renderSortieCard)}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ⚫ Sorties Annulées */}
          {cancelledSorties.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/20 w-fit">
                <h3 className="text-lg font-black text-white/60 uppercase tracking-wide">
                  Annulées ({cancelledSorties.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-50">
                <AnimatePresence>
                  {cancelledSorties.map(renderSortieCard)}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredSorties.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Calendar className="mx-auto text-white/20 mb-4" size={64} />
              </motion.div>
              <p className="text-white/50 text-lg font-medium">Aucune sortie trouvée</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSortie(null);
        }}
        title={editingSortie ? 'Modifier la Sortie' : 'Nouvelle Sortie'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="w-full h-40 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-nexus-cyan/50 transition-all">
            {coverFile ? (
              <img
                src={URL.createObjectURL(coverFile)}
                className="w-full h-full object-cover"
              />
            ) : editingSortie?.cover_url ? (
              <img
                src={editingSortie.cover_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="text-white/20 group-hover:text-nexus-cyan transition-colors" size={32} />
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </div>

          <input
            required
            type="text"
            placeholder="Titre de la sortie"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-nexus-cyan/20 focus:border-nexus-cyan transition-all"
          />

          <input
            required
            type="date"
            value={formData.release_date}
            onChange={(e) =>
              setFormData({ ...formData, release_date: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-nexus-cyan/20 focus:border-nexus-cyan transition-all"
          />

          <textarea
            placeholder="Description (optionnel)"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 min-h-24 resize-none focus:ring-2 focus:ring-nexus-cyan/20 focus:border-nexus-cyan transition-all"
          />

          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-nexus-cyan/20 focus:border-nexus-cyan transition-all"
          >
            <option value="planned">Prévu</option>
            <option value="released">Publié</option>
            <option value="cancelled">Annulé</option>
          </select>

          <input
            type="url"
            placeholder="URL Spotify (optionnel)"
            value={formData.spotify_url || ''}
            onChange={(e) =>
              setFormData({ ...formData, spotify_url: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:ring-2 focus:ring-nexus-cyan/20 focus:border-nexus-cyan transition-all"
          />

          <div className="space-y-3">
            <label className="text-white font-semibold text-sm">Plateformes</label>
            <div className="grid grid-cols-2 gap-3">
              {['Spotify', 'Apple Music', 'YouTube', 'SoundCloud'].map(
                (platform) => (
                  <label
                    key={platform}
                    className="flex items-center gap-2 cursor-pointer p-3 hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-nexus-cyan/30"
                  >
                    <input
                      type="checkbox"
                      checked={formData.platforms?.includes(platform) || false}
                      onChange={(e) => {
                        const platforms = formData.platforms || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            platforms: [...platforms, platform],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            platforms: platforms.filter((p) => p !== platform),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded accent-nexus-cyan"
                    />
                    <span className="text-white font-medium">{platform}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <AdminOnly>
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              isLoading={isSubmitting}
            >
              {editingSortie ? 'Mettre à jour' : 'Créer la sortie'}
            </Button>
          </AdminOnly>
        </form>
      </Modal>
    </div>
  );
};
