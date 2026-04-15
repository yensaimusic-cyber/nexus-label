import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Loader2, Trash2, Edit2, Calendar, Music, Zap, 
  Users, MessageSquareText, Disc
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AdminOnly } from '../components/AdminOnly';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../lib/utils';

type EventType = 'concert' | 'open_mic' | 'freestyle' | 'workshop' | 'promo' | 'showcase' | 'festival' | 'soundcheck';
type AggregatedEvent = {
  id: string;
  title: string;
  type: 'custom';
  eventType?: EventType;
  date: string;
  time?: string;
  description?: string;
  artist?: string;
  teamMember?: any;
  metadata?: any;
};

export const Events: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [customEvents, setCustomEvents] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'custom'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    title: string;
    eventType: EventType;
    date: string;
    time?: string;
    description?: string;
    teamMemberId?: string;
  }>({
    title: '',
    eventType: 'concert',
    date: new Date().toISOString().split('T')[0],
    time: '',
    description: '',
    teamMemberId: '',
  });

  const eventTypeLabels: Record<EventType, string> = {
    concert: '🎤 Concert',
    open_mic: '🎵 Open Mic',
    freestyle: '🎙️ Freestyle',
    workshop: '📚 Workshop',
    promo: '📢 Promo',
    showcase: '🌟 Showcase',
    festival: '🎪 Festival',
    soundcheck: '🔊 Soundcheck',
  };

  const Mic2Icon = (props: any) => <MessageSquareText {...props} />;

  const eventTypeIcons: Record<EventType, React.ReactNode> = {
    concert: <Music size={16} />,
    open_mic: <Mic2Icon size={16} />,
    freestyle: <Zap size={16} />,
    workshop: <Users size={16} />,
    promo: <Disc size={16} />,
    showcase: <Music size={16} />,
    festival: <Music size={16} />,
    soundcheck: <Music size={16} />,
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);

      // Load custom events
      const eventsData = await supabase
        .from('events')
        .select(`
          id, title, event_type, date, time, description, 
          team_member_id, team_member:artist_team_members(id, role, profile:profiles(id, full_name)),
          created_at
        `)
        .order('date', { ascending: true });

      if (eventsData.error && eventsData.error.code !== 'PGRST116') throw eventsData.error;
      setCustomEvents(eventsData.data || []);

      // Load team members for dropdown
      const membersData = await supabase
        .from('artist_team_members')
        .select('id, role, profile:profiles(id, full_name)')
        .order('profile(full_name)', { ascending: true });

      if (membersData.error) throw membersData.error;
      setTeamMembers(membersData.data || []);
    } catch (err: any) {
      console.error('Error loading events:', err);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const aggregatedEvents: AggregatedEvent[] = useMemo(() => {
    const all: AggregatedEvent[] = [];

    // Add custom events only
    customEvents.forEach((event: any) => {
      all.push({
        id: `custom-${event.id}`,
        title: event.title,
        type: 'custom',
        eventType: event.event_type,
        date: event.date,
        time: event.time,
        description: event.description,
        teamMember: event.team_member,
        metadata: { originalId: event.id },
      });
    });

    return all
      .filter(
        event =>
          search === '' ||
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.description?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customEvents, search]);

  const handleOpenModal = (event?: AggregatedEvent) => {
    if (event && event.type === 'custom') {
      const customEvent = customEvents.find((e: any) => e.id === event.metadata.originalId);
      if (customEvent) {
        setEditingEvent(customEvent);
        setFormData({
          title: customEvent.title,
          eventType: customEvent.event_type,
          date: customEvent.date,
          time: customEvent.time || '',
          description: customEvent.description || '',
          teamMemberId: customEvent.team_member_id || '',
        });
      }
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        eventType: 'concert',
        date: new Date().toISOString().split('T')[0],
        time: '',
        description: '',
        teamMemberId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('Titre et date sont obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            title: formData.title,
            event_type: formData.eventType,
            date: formData.date,
            time: formData.time || null,
            description: formData.description || null,
            team_member_id: formData.teamMemberId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success('Événement mis à jour');
      } else {
        // Create new event
        const { error } = await supabase.from('events').insert([
          {
            title: formData.title,
            event_type: formData.eventType,
            date: formData.date,
            time: formData.time || null,
            description: formData.description || null,
            team_member_id: formData.teamMemberId || null,
            created_by: user?.id,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        toast.success('Événement créé');
      }

      setIsModalOpen(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        eventType: 'concert',
        date: new Date().toISOString().split('T')[0],
        time: '',
        description: '',
        teamMemberId: '',
      });
      await loadEvents();
    } catch (err: any) {
      console.error('Error:', err);
      toast.error('Erreur: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (event: AggregatedEvent) => {
    if (event.type !== 'custom') {
      toast.error('Vous pouvez uniquement supprimer les événements personnalisés');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.metadata.originalId);

      if (error) throw error;
      toast.success('Événement supprimé');
      await loadEvents();
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    }
  };

  const renderEventCard = (event: AggregatedEvent) => {
    const getEventColor = (): string => {
      return 'border-cyan-500/50 bg-cyan-500/5';
    };

    const getEventIcon = (): React.ReactNode => {
      return event.eventType ? eventTypeIcons[event.eventType] : <Music size={18} className="text-cyan-400" />;
    };

    const getEventTypeLabel = (): string => {
      return event.eventType ? eventTypeLabels[event.eventType] : 'Événement';
    };

    const daysUntil = Math.ceil(
      (new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const isUpcoming = daysUntil >= 0 && daysUntil <= 7;

    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`border ${getEventColor()} group relative p-4 hover:shadow-lg transition-all`}>
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-nexus-surface/50">
              {getEventIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-semibold text-white truncate">{event.title}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-nexus-purple/50 text-cyan-300 flex-shrink-0 whitespace-nowrap">
                    {getEventTypeLabel()}
                  </span>
                  {isUpcoming && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 flex-shrink-0">
                      {daysUntil === 0 ? 'Aujourd\'hui' : `${daysUntil}j`}
                    </span>
                  )}
                </div>
              </div>
              {event.description && (
                <p className="text-sm text-nexus-light mb-2 line-clamp-2">{event.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-nexus-light/70">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(event.date)}
                  {event.time && ` at ${event.time}`}
                </span>
                {event.teamMember && (
                  <span className="text-cyan-300 flex items-center gap-1">
                    <Users size={14} />
                    {event.teamMember.profile?.full_name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenModal(event)}
                className="p-2 hover:bg-nexus-surface rounded transition-colors"
                title="Modifier"
              >
                <Edit2 size={16} className="text-blue-400" />
              </button>
              <button
                onClick={() => handleDelete(event)}
                className="p-2 hover:bg-nexus-surface rounded transition-colors"
                title="Supprimer"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 size={32} className="text-nexus-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white">Événements</h1>
          <AdminOnly>
            <Button
              onClick={() => handleOpenModal()}
              variant="primary"
              size="lg"
              icon={<Plus size={20} />}
            >
              Nouvel Événement
            </Button>
          </AdminOnly>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-nexus-light/50" size={20} />
            <input
              type="text"
              placeholder="Rechercher événements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white placeholder-nexus-light/50 focus:outline-none focus:border-nexus-cyan"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {aggregatedEvents.length === 0 ? (
          <Card className="border border-nexus-light/10 bg-nexus-surface/50 p-8 text-center">
            <p className="text-nexus-light/50 mb-4">Aucun événement trouvé</p>
            <AdminOnly>
              <Button
                onClick={() => handleOpenModal()}
                variant="secondary"
                size="md"
                icon={<Plus size={18} />}
              >
                Créer le premier événement
              </Button>
            </AdminOnly>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {aggregatedEvents.map(event => renderEventCard(event))}
          </AnimatePresence>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? 'Modifier Événement' : 'Nouvel Événement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="ex: Concert au Rex Club"
              className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white placeholder-nexus-light/50 focus:outline-none focus:border-nexus-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Type d'Événement *</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
                className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
              >
                {Object.entries(eventTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Heure</label>
            <input
              type="time"
              value={formData.time || ''}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Membre de l'équipe (optionnel)</label>
            <select
              value={formData.teamMemberId || ''}
              onChange={(e) => setFormData({ ...formData, teamMemberId: e.target.value })}
              className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white focus:outline-none focus:border-nexus-cyan"
            >
              <option value="">-- Aucun(e) --</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.profile?.full_name} - {member.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails de l'événement..."
              rows={3}
              className="w-full px-4 py-2 bg-nexus-surface border border-nexus-light/20 rounded-lg text-white placeholder-nexus-light/50 focus:outline-none focus:border-nexus-cyan resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingEvent(null);
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
                : editingEvent
                ? 'Mettre à jour'
                : 'Créer Événement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
