import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, Music, TrendingUp, CheckCircle, Clock, AlertCircle,
  ArrowRight, Disc, Zap, Plus, Trash2, Edit2, Loader2
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { AdminOnly } from '../../AdminOnly';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../ui/Toast';
import { Project, STATUS_LABELS, ProjectStatus } from '../../../types';
import { formatDate } from '../../../lib/utils';

type RoadmapItemType = 'milestone' | 'post' | 'event' | 'collaboration' | 'release' | 'other';
type RoadmapItemStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  item_type: RoadmapItemType;
  date?: string;
  status: RoadmapItemStatus;
  priority: string;
}

interface ArtistRoadmapProps {
  projects: Project[];
  artistId: string;
  sortiesStatus?: Record<string, any>;
}

export const ArtistRoadmap: React.FC<ArtistRoadmapProps> = ({ projects, artistId }) => {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    item_type: RoadmapItemType;
    date: string;
    status: RoadmapItemStatus;
    priority: string;
  }>({
    title: '',
    description: '',
    item_type: 'milestone',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    priority: 'medium',
  });

  const itemTypeLabels: Record<RoadmapItemType, string> = {
    milestone: '🎯 Milestone',
    post: '📱 Post Réseaux',
    event: '🎪 Événement',
    collaboration: '🤝 Collaboration',
    release: '🚀 Sortie',
    other: '📌 Autre',
  };

  const itemStatusColors: Record<RoadmapItemStatus, string> = {
    planned: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
    in_progress: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    completed: 'bg-green-500/10 border-green-500/30 text-green-300',
    cancelled: 'bg-red-500/10 border-red-500/30 text-red-300',
  };

  useEffect(() => {
    loadRoadmapItems();
  }, [artistId]);

  const loadRoadmapItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('artist_roadmap_items')
        .select('*')
        .eq('artist_id', artistId)
        .order('date', { ascending: true, nullsFirst: true });

      if (error) throw error;
      setRoadmapItems(data || []);
    } catch (err: any) {
      console.error('Error loading roadmap items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item?: RoadmapItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        item_type: item.item_type,
        date: item.date || new Date().toISOString().split('T')[0],
        status: item.status,
        priority: item.priority,
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        item_type: 'milestone',
        date: new Date().toISOString().split('T')[0],
        status: 'planned',
        priority: 'medium',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Le titre est obligatoire');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingItem) {
        const { error } = await supabase
          .from('artist_roadmap_items')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Roadmap item mis à jour');
      } else {
        const { error } = await supabase
          .from('artist_roadmap_items')
          .insert([{ ...formData, artist_id: artistId }]);

        if (error) throw error;
        toast.success('Roadmap item créé');
      }

      setIsModalOpen(false);
      setEditingItem(null);
      await loadRoadmapItems();
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) return;

    try {
      const { error } = await supabase
        .from('artist_roadmap_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Roadmap item supprimé');
      await loadRoadmapItems();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  };
  const statusOrder: ProjectStatus[] = [
    'idea',
    'pre_production',
    'production',
    'post_production',
    'release',
    'released',
  ];

  const statusColors: Record<ProjectStatus, { bg: string; border: string; icon: string }> = {
    idea: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: '💭' },
    pre_production: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '📋' },
    production: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: '🎙️' },
    post_production: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: '🎚️' },
    release: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '🚀' },
    released: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✅' },
  };

  const groupedProjects = useMemo(() => {
    const grouped: Record<ProjectStatus, Project[]> = {
      idea: [],
      pre_production: [],
      production: [],
      post_production: [],
      release: [],
      released: [],
    };

    projects.forEach(project => {
      grouped[project.status].push(project);
    });

    // Sort each group by release_date
    Object.keys(grouped).forEach(status => {
      grouped[status as ProjectStatus].sort((a, b) => {
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
      });
    });

    return grouped;
  }, [projects]);

  const nextReleaseDate = useMemo(() => {
    const sortedByDate = projects
      .filter(p => p.release_date)
      .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
    return sortedByDate[0]?.release_date;
  }, [projects]);

  const totalBudget = useMemo(
    () => projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    [projects]
  );

  const totalSpent = useMemo(
    () => projects.reduce((sum, p) => sum + (p.spent || 0), 0),
    [projects]
  );

  const projectsInProgress = useMemo(
    () =>
      projects.filter(
        p =>
          p.status === 'pre_production' ||
          p.status === 'production' ||
          p.status === 'post_production' ||
          p.status === 'release'
      ).length,
    [projects]
  );

  const getDaysUntil = (dateStr: string | null | undefined): number | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const renderProjectCard = (project: Project) => {
    const daysUntilRelease = project.release_date ? getDaysUntil(project.release_date) : null;
    const isUrgent = daysUntilRelease !== null && daysUntilRelease >= 0 && daysUntilRelease <= 30;
    const color = statusColors[project.status];
    const progress = project.progress || 0;

    return (
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <Link to={`/projects/${project.id}`}>
          <Card
            className={`border ${color.border} ${color.bg} p-4 h-full hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 opacity-5 group-hover:opacity-10 transition-opacity text-6xl">
              {color.icon}
            </div>

            {/* Urgent badge */}
            {isUrgent && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-1">
                <AlertCircle size={12} />
                Urgent
              </div>
            )}

            <div className="space-y-3 relative z-10">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white group-hover:text-nexus-cyan transition-colors line-clamp-2 flex-1">
                    {project.title}
                  </h3>
                  <span className="flex-shrink-0 text-sm">
                    <Disc size={16} className="text-nexus-cyan" />
                  </span>
                </div>
                <p className="text-xs text-nexus-light/60 capitalize">
                  {project.type === 'single'
                    ? 'Single'
                    : project.type === 'ep'
                    ? 'EP'
                    : project.type === 'album'
                    ? 'Album'
                    : 'Mixtape'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="inline-block">
                <span className="px-3 py-1 rounded-full bg-nexus-surface border border-nexus-light/20 text-xs font-medium text-white">
                  {STATUS_LABELS[project.status]}
                </span>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                {project.release_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-nexus-cyan flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-white font-medium">{formatDate(project.release_date)}</span>
                      {daysUntilRelease !== null && (
                        <span className="text-nexus-light/60 text-xs ml-2">
                          ({daysUntilRelease === 0
                            ? 'Aujourd\'hui'
                            : daysUntilRelease === 1
                            ? 'Demain'
                            : `${daysUntilRelease}j`})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-nexus-light/60">Progression</span>
                  <span className="text-xs font-semibold text-white">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-nexus-surface rounded-full overflow-hidden border border-nexus-light/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-nexus-cyan to-nexus-purple"
                  />
                </div>
              </div>

              {/* Budget */}
              {project.budget && project.budget > 0 && (
                <div className="pt-2 border-t border-nexus-light/10">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-nexus-light/60">Budget</span>
                    <span className="text-white font-medium">
                      {project.spent || 0} / {project.budget}€
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-nexus-surface rounded-full overflow-hidden border border-nexus-light/10">
                    <div
                      style={{
                        width: `${Math.min(100, ((project.spent || 0) / project.budget) * 100)}%`,
                      }}
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-nexus-light/20 bg-nexus-surface/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-nexus-light/60 text-sm mb-1">Total de Projets</p>
              <p className="text-3xl font-bold text-white">{projects.length}</p>
            </div>
            <Music size={32} className="text-nexus-cyan/30" />
          </div>
        </Card>

        <Card className="border border-nexus-light/20 bg-nexus-surface/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-nexus-light/60 text-sm mb-1">En Cours</p>
              <p className="text-3xl font-bold text-nexus-cyan">{projectsInProgress}</p>
            </div>
            <TrendingUp size={32} className="text-nexus-cyan/30" />
          </div>
        </Card>

        <Card className="border border-nexus-light/20 bg-nexus-surface/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-nexus-light/60 text-sm mb-1">Prochaine Sortie</p>
              <p className="text-white font-semibold max-w-[150px] line-clamp-2">
                {nextReleaseDate ? formatDate(nextReleaseDate) : '-'}
              </p>
            </div>
            <Calendar size={32} className="text-green-500/30" />
          </div>
        </Card>

        <Card className="border border-nexus-light/20 bg-nexus-surface/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-nexus-light/60 text-sm mb-1">Budget</p>
              <p className="text-white font-semibold">
                {totalSpent} / {totalBudget}€
              </p>
            </div>
            <Zap size={32} className="text-yellow-500/30" />
          </div>
        </Card>
      </div>

      {/* Timeline by Status */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Timeline des Projets</h2>

        <div className="space-y-6">
          {statusOrder.map(status => {
            const statusProjects = groupedProjects[status];
            if (statusProjects.length === 0) return null;

            return (
              <div key={status}>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{statusColors[status].icon}</div>
                  <div>
                    <h3 className="font-bold text-white">{STATUS_LABELS[status]}</h3>
                    <p className="text-sm text-nexus-light/60">{statusProjects.length} projet(s)</p>
                  </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <AnimatePresence mode="popLayout">
                    {statusProjects.map(project => renderProjectCard(project))}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                {status !== statusOrder[statusOrder.length - 1] && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-nexus-light/20 to-transparent" />
                    <ArrowRight size={20} className="text-nexus-light/30 mx-4" />
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-nexus-light/20 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <Card className="border border-nexus-light/10 bg-nexus-surface/50 p-12 text-center">
          <Music size={48} className="text-nexus-light/20 mx-auto mb-4" />
          <p className="text-nexus-light/50 text-lg">Aucun projet pour cet artiste</p>
          <p className="text-nexus-light/30 text-sm mt-2">Les projets apparaîtront ici une fois créés</p>
        </Card>
      )}

      {/* Roadmap Items Section */}
      <div className="pt-8 border-t border-nexus-light/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">📋 Road Map Personnalisée</h2>
          <AdminOnly>
            <Button
              onClick={() => handleOpenModal()}
              variant="primary"
              size="md"
              icon={<Plus size={18} />}
            >
              Ajouter un item
            </Button>
          </AdminOnly>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="text-nexus-cyan animate-spin" />
          </div>
        ) : roadmapItems.length === 0 ? (
          <Card className="border border-nexus-light/10 bg-nexus-surface/50 p-8 text-center">
            <p className="text-nexus-light/50">Aucun item pour le moment</p>
            <AdminOnly>
              <p className="text-nexus-light/30 text-sm mt-2">Créez votre première étape de la road map</p>
            </AdminOnly>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {roadmapItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className={`border ${itemStatusColors[item.status]} p-4 group hover:shadow-lg transition-all`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{itemTypeLabels[item.item_type].split(' ')[0]}</span>
                          <div>
                            <h3 className="font-bold text-white">{item.title}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-nexus-surface/50 text-nexus-light/70">
                              {itemTypeLabels[item.item_type].split(' ').slice(1).join(' ')}
                            </span>
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-nexus-light/70 mb-2">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-nexus-light/60">
                          {item.date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(item.date)}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded capitalize ${
                            item.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                            item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      <AdminOnly>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenModal(item);
                            }}
                            className="p-2 hover:bg-nexus-surface rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={16} className="text-blue-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-2 hover:bg-nexus-surface rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </AdminOnly>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal for Adding/Editing Roadmap Items */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Modifier Road Map Item' : 'Ajouter Road Map Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ex: Post Instagram du nouveau single"
              className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white placeholder-nexus-light/50 focus:outline-none focus:border-nexus-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Type</label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as RoadmapItemType })}
                className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
              >
                {Object.entries(itemTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as RoadmapItemStatus })}
                className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
              >
                <option value="planned">Planifié</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Complété</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Priorité</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails de ce que vous prévoyez..."
              rows={3}
              className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white placeholder-nexus-light/50 focus:outline-none focus:border-nexus-cyan resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 size={20} className="animate-spin" /> : undefined}
            >
              {isSubmitting
                ? 'Sauvegarde...'
                : editingItem
                ? 'Mettre à jour'
                : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
