import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, Music, TrendingUp, CheckCircle, Clock, AlertCircle,
  ArrowRight, Disc, Zap
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Project, STATUS_LABELS, ProjectStatus } from '../../types';
import { formatDate } from '../../lib/utils';

interface ArtistRoadmapProps {
  projects: Project[];
  sortiesStatus?: Record<string, any>;
}

export const ArtistRoadmap: React.FC<ArtistRoadmapProps> = ({ projects }) => {
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
    </div>
  );
};
