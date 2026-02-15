
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MessageSquareText, Calendar, Users, ListChecks, ChevronRight, Trash2, Loader2, Save, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { googleCalendarService } from '../lib/googleCalendar';
import { useToast } from '../components/ui/Toast';
import { AdminOnly } from '../components/AdminOnly';
import { Meeting } from '../types';

export const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const toast = useToast();
  const [formData, setFormData] = useState<Partial<Meeting>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    attendees: [],
    action_items: [],
    project_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*, project:projects(title)')
        .order('date', { ascending: false });

      if (meetingsError) throw meetingsError;
      setMeetings(meetingsData);

      const { data: projData } = await supabase.from('projects').select('id, title').order('title');
      if (projData) setProjects(projData);
    } catch (err: any) {
      toast.addToast("Error fetching meetings: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingId) {
        const { error } = await supabase.from('meetings').update(formData).eq('id', editingId);
        if (error) throw error;
        
        // Handle Google synchronization for existing meetings
        if (syncToGoogle) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (userId) {
              // Get the updated meeting to sync
              const { data: updatedMeeting } = await supabase.from('meetings').select('*').eq('id', editingId).single();
              if (updatedMeeting) {
                if (updatedMeeting.google_event_id) {
                  // Update existing Google Calendar event
                  await googleCalendarService.updateEvent(userId, updatedMeeting.google_event_id, {
                    summary: updatedMeeting.title,
                    description: updatedMeeting.summary,
                    start: { dateTime: updatedMeeting.date + 'T00:00:00', timeZone: 'UTC' },
                    end: { dateTime: updatedMeeting.date + 'T01:00:00', timeZone: 'UTC' }
                  });
                  toast.addToast('Meeting et Google Calendar synchronisés !', 'success');
                } else {
                  // Create new Google Calendar event if not already linked
                  const createdEvent = await googleCalendarService.createEvent(userId, updatedMeeting);
                  if (createdEvent?.id) {
                    await supabase.from('meetings').update({ google_event_id: createdEvent.id, synced_at: new Date().toISOString() }).eq('id', editingId);
                    toast.addToast('Meeting synchronisé avec Google Calendar !', 'success');
                  }
                }
              }
            }
          } catch (gErr) {
            console.error('Google sync failed:', gErr);
            toast.addToast('Meeting mis à jour mais la synchronisation Google a échoué.', 'error');
          }
        }
      } else {
        const { data: inserted, error } = await supabase.from('meetings').insert([formData]).select().single();
        if (error) throw error;
        // Optionally sync to Google Calendar
        if (syncToGoogle && inserted) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (userId) {
              const createdEvent = await googleCalendarService.createEvent(userId, inserted);
              // If the create_event Edge Function didn't update the meeting row, update it here
              if (createdEvent?.id) {
                await supabase.from('meetings').update({ google_event_id: createdEvent.id, synced_at: new Date().toISOString() }).eq('id', inserted.id);
                toast.addToast('Meeting synchronisé avec Google Calendar !', 'success');
              } else {
                toast.addToast('Meeting créé mais pas d\'identifiant Google retourné.', 'warning');
              }
            }
          } catch (gErr) {
            console.error('Google sync failed:', gErr);
            toast.addToast('Meeting créé mais la synchronisation Google a échoué.', 'error');
          }
        }
      }
      setIsModalOpen(false);
      fetchData();
      toast.addToast(`Meeting record ${editingId ? 'updated' : 'archived'}!`, 'success');
    } catch (err: any) {
      toast.addToast("Action failed: " + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this meeting log from Nexus Archive?")) return;
    try {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
      setMeetings(meetings.filter(m => m.id !== id));
    } catch (err: any) {
      toast.addToast("Delete failed: " + err.message, 'error');
    }
  };

  const handleEdit = (meeting: any) => {
    setEditingId(meeting.id);
    setFormData({
      title: meeting.title,
      date: meeting.date,
      summary: meeting.summary,
      attendees: meeting.attendees || [],
      action_items: meeting.action_items || [],
      project_id: meeting.project_id || ''
    });
    setSyncToGoogle(true);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Meeting Logs</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Archive of strategic decisions and executive summaries.</p>
        </div>
        <Button variant="primary" className="gap-2 shadow-xl" onClick={() => { setEditingId(null); setFormData({ title: '', date: new Date().toISOString().split('T')[0], summary: '', attendees: [], action_items: [], project_id: '' }); setSyncToGoogle(true); setIsModalOpen(true); }}>
          <Plus size={20} />
          <span>New Session</span>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text" 
          placeholder="Filter logs by title, participants or project..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-[24px] py-4 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none text-white font-medium shadow-lg"
        />
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-nexus-purple mb-4" size={40} />
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/30">Retrieving Archive...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-20">
          {meetings.filter(m => 
            m.title.toLowerCase().includes(search.toLowerCase()) || 
            m.summary?.toLowerCase().includes(search.toLowerCase()) ||
            m.project?.title?.toLowerCase().includes(search.toLowerCase())
          ).map((meeting) => (
            <Card key={meeting.id} className="hover:border-nexus-purple/40 transition-all border-white/5 shadow-xl group">
              <div className="flex flex-col lg:flex-row gap-8 p-4">
                <div className="lg:w-1/3 space-y-4 border-b lg:border-b-0 lg:border-r border-white/5 pb-4 lg:pb-0 lg:pr-8">
                  <div className="flex items-center gap-2 text-nexus-purple font-mono text-[10px] uppercase tracking-widest font-bold bg-nexus-purple/5 px-3 py-1.5 rounded-lg w-fit">
                    <Calendar size={14} />
                    {meeting.date}
                  </div>
                  <h3 className="text-xl font-heading font-extrabold text-white leading-tight">{meeting.title}</h3>
                  {meeting.project && (
                    <div className="text-[10px] font-mono text-nexus-cyan uppercase tracking-widest bg-nexus-cyan/5 px-2 py-1 rounded border border-nexus-cyan/20 w-fit">
                      Project: {meeting.project.title}
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      <Users size={14} />
                      <span>Stakeholders:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendees.map((a: string) => (
                        <span key={a} className="px-2 py-1 rounded-lg bg-white/5 text-[9px] font-bold text-white/50 border border-white/5">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-mono uppercase text-nexus-purple tracking-[0.3em] mb-3 flex items-center gap-2 font-black">
                      <MessageSquareText size={14} />
                      Executive Summary
                    </h4>
                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                      {meeting.summary || "No detailed summary available."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono uppercase text-nexus-green tracking-[0.3em] mb-4 flex items-center gap-2 font-black">
                      <ListChecks size={14} />
                      Required Actions
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(meeting.action_items || []).map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-white/40 group/item cursor-default">
                          <div className="w-4 h-4 rounded bg-nexus-green/10 flex items-center justify-center shrink-0 mt-0.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-nexus-green" />
                          </div>
                          <span className="group-hover/item:text-white transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <AdminOnly>
                  <div className="shrink-0 flex lg:flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(meeting)} className="p-3 hover:bg-nexus-purple/10 text-nexus-purple"><ChevronRight size={24} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(meeting.id)} className="p-3 hover:text-nexus-red"><Trash2 size={20} /></Button>
                  </div>
                </AdminOnly>
              </div>
            </Card>
          ))}
          {meetings.length === 0 && <div className="py-24 text-center opacity-30 italic font-heading">The Nexus vault is currently empty.</div>}
        </div>
      )}

      {/* Meeting Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Update Session Log" : "Initialize New Session"}>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Session Title *</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Timestamp</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Project Link</label>
              <select value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none">
                <option value="" className="bg-nexus-surface">Global Session</option>
                {projects.map(p => <option key={p.id} value={p.id} className="bg-nexus-surface">{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Participants (Comma separated)</label>
            <input 
              type="text" 
              placeholder="Alex Rivera, Solaris, etc."
              value={formData.attendees?.join(', ')} 
              onChange={e => setFormData({...formData, attendees: e.target.value.split(',').map(s => s.trim())})}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Strategic Summary</label>
            <textarea rows={4} value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none resize-none" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Action Items (One per line)</label>
            <textarea rows={3} value={formData.action_items?.join('\n')} onChange={e => setFormData({...formData, action_items: e.target.value.split('\n').filter(s => s.trim() !== '')})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none resize-none font-mono text-xs" />
          </div>

          <div className="flex items-center gap-3">
            <input id="syncGoogle" type="checkbox" checked={syncToGoogle} disabled className="w-4 h-4" />
            <label htmlFor="syncGoogle" className="text-[12px] text-white/60">Synchroniser avec Google Calendar (toujours activé)</label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Abort</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}><Save size={18} className="mr-2" /> Commit to Archive</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
