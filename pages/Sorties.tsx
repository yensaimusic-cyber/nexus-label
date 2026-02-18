import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AdminOnly } from '../components/AdminOnly';
import { Calendar, Plus, Search, Loader2, Camera, Edit2, Trash2, CheckCircle } from 'lucide-react';
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
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.project?.title.toLowerCase().includes(search.toLowerCase())
  );

  // Groupe les sorties par statut
  const plannedSorties = filteredSorties.filter((s) => s.status === 'planned');
  const releasedSorties = filteredSorties.filter((s) => s.status === 'released');
  const cancelledSorties = filteredSorties.filter((s) => s.status === 'cancelled');

  const renderSortieCard = (sortie: Sortie) => {
    const isUpcoming =
      new Date(sortie.release_date) > new Date() && sortie.status === 'planned';
    const daysUntil = Math.ceil(
      (new Date(sortie.release_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <motion.div
        key={sortie.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 space-y-3 relative group">
          {sortie.cover_url && (
            <img
              src={sortie.cover_url}
              alt={sortie.title}
              className="w-full h-40 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
            />
          )}
          <div>
            <h3 className="font-bold text-white text-lg group-hover:text-nexus-cyan transition-colors">
              {sortie.title}
            </h3>
            {sortie.project && (
              <p className="text-xs text-nexus-cyan uppercase font-mono mt-1">
                {sortie.project.title}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/60">
            <Calendar size={16} />
            <span>{formatDate(sortie.release_date)}</span>
            {isUpcoming && daysUntil >= 0 && (
              <span className="text-nexus-orange font-semibold">
                ({daysUntil} j)
              </span>
            )}
          </div>

          {sortie.description && (
            <p className="text-sm text-white/70 line-clamp-2">
              {sortie.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {sortie.platforms?.map((platform) => (
              <span
                key={platform}
                className="text-xs bg-nexus-purple/20 text-nexus-purple px-2 py-1 rounded"
              >
                {platform}
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <AdminOnly>
              <button
                onClick={() => handleOpenModal(sortie)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-nexus-purple/20 text-nexus-purple rounded-lg hover:bg-nexus-purple/30 transition-colors text-sm font-semibold"
              >
                <Edit2 size={14} />
                Modifier
              </button>
              <button
                onClick={() => handleDelete(sortie.id)}
                className="px-3 py-2 bg-nexus-red/20 text-nexus-red rounded-lg hover:bg-nexus-red/30 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </AdminOnly>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-extrabold text-white">Sorties</h2>
          <p className="text-nexus-lightGray text-sm">
            Gérez les sorties prévues du label
          </p>
        </div>
        <AdminOnly>
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} />
            <span>Nouvelle Sortie</span>
          </Button>
        </AdminOnly>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type="text"
          placeholder="Rechercher une sortie, un projet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-2xl py-3 pl-12 pr-4 text-sm text-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-nexus-purple" size={48} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sorties Prévues */}
          {plannedSorties.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-nexus-purple" size={20} />
                <h3 className="text-lg font-bold text-white">
                  À Venir ({plannedSorties.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {plannedSorties.map(renderSortieCard)}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Sorties Publiées */}
          {releasedSorties.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-nexus-green" size={20} />
                <h3 className="text-lg font-bold text-white">
                  Publiées ({releasedSorties.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {releasedSorties.map(renderSortieCard)}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Sorties Annulées */}
          {cancelledSorties.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white/50">
                  Annulées ({cancelledSorties.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {cancelledSorties.map(renderSortieCard)}
                </AnimatePresence>
              </div>
            </div>
          )}

          {filteredSorties.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="mx-auto text-white/20 mb-4" size={48} />
              <p className="text-white/50">Aucune sortie trouvée</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Édition/Création */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSortie(null);
        }}
        title={editingSortie ? 'Modifier la Sortie' : 'Nouvelle Sortie'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Upload */}
          <div className="w-full h-40 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group cursor-pointer">
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

          {/* Titre */}
          <input
            required
            type="text"
            placeholder="Titre de la sortie"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40"
          />

          {/* Date de sortie */}
          <input
            required
            type="date"
            value={formData.release_date}
            onChange={(e) =>
              setFormData({ ...formData, release_date: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
          />

          {/* Description */}
          <textarea
            placeholder="Description (optionnel)"
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40 min-h-24 resize-none"
          />

          {/* Statut */}
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as any })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
          >
            <option value="planned">Prévu</option>
            <option value="released">Publié</option>
            <option value="cancelled">Annulé</option>
          </select>

          {/* Spotify URL */}
          <input
            type="url"
            placeholder="URL Spotify (optionnel)"
            value={formData.spotify_url || ''}
            onChange={(e) =>
              setFormData({ ...formData, spotify_url: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/40"
          />

          {/* Plateformes */}
          <div className="space-y-2">
            <label className="text-white/70 text-sm font-semibold">
              Plateformes
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Spotify', 'Apple Music', 'YouTube', 'SoundCloud'].map(
                (platform) => (
                  <label
                    key={platform}
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors"
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
                      className="w-4 h-4 rounded accent-nexus-purple"
                    />
                    <span className="text-sm text-white/70">{platform}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <AdminOnly>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
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
