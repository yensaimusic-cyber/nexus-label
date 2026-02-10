
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ExternalLink, Mail, Globe, Star, Trash2, Briefcase, Loader2, Save, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { ExternalResource } from '../types';

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExternalResource>>({
    name: '',
    service_type: 'Audio',
    skills: [],
    contact_info: '',
    website: '',
    rating: 5,
    notes: ''
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setResources(data || []);
    } catch (err: any) {
      alert("Error fetching partners: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingId) {
        const { error } = await supabase.from('resources').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('resources').insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchResources();
      alert(`Partner ${editingId ? 'updated' : 'added'}!`);
    } catch (err: any) {
      alert("Operation failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this provider from the Nexus Directory?")) return;
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      setResources(resources.filter(r => r.id !== id));
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleEdit = (res: any) => {
    setEditingId(res.id);
    setFormData(res);
    setIsModalOpen(true);
  };

  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.service_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Nexus Directory</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Verified providers, studios, and external label services.</p>
        </div>
        <Button variant="primary" className="gap-2 shadow-xl" onClick={() => { setEditingId(null); setFormData({ name: '', service_type: 'Audio', skills: [], contact_info: '', website: '', rating: 5, notes: '' }); setIsModalOpen(true); }}>
          <Plus size={20} />
          <span>Add Provider</span>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text" 
          placeholder="Search directory by name or specialty..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full glass rounded-[24px] py-4 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none text-white font-medium shadow-lg"
        />
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
           <Loader2 className="animate-spin text-nexus-purple" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="flex flex-col h-full hover:border-nexus-cyan/40 transition-all group border-white/5 shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-[18px] bg-nexus-cyan/10 text-nexus-cyan shadow-lg shadow-cyan-500/5">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white group-hover:text-nexus-cyan transition-colors leading-none mb-1.5">{resource.name}</h3>
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] font-black">{resource.service_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-nexus-orange/10 px-2 py-1 rounded-lg text-nexus-orange">
                  <Star size={12} fill="currentColor" />
                  <span className="text-[10px] font-black">{resource.rating}</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {(resource.skills || []).map((skill: string) => (
                    <span key={skill} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-white/40 italic leading-relaxed line-clamp-3">
                  "{resource.notes || 'Reliable provider for label needs.'}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex gap-3">
                <Button variant="outline" size="sm" className="flex-1 gap-2 text-[10px] uppercase font-black tracking-widest h-11">
                  <Mail size={16} className="text-nexus-purple" />
                  Contact
                </Button>
                <div className="flex gap-2">
                   <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)} className="h-11 px-3 border border-white/5 hover:border-nexus-cyan transition-all"><Plus size={18} className="rotate-45" /></Button>
                   <Button variant="ghost" size="sm" onClick={() => handleDelete(resource.id)} className="h-11 px-3 border border-white/5 hover:border-nexus-red transition-all text-white/20 hover:text-nexus-red"><Trash2 size={18} /></Button>
                </div>
              </div>
            </Card>
          ))}
          {filteredResources.length === 0 && <div className="col-span-full py-24 text-center text-white/10 italic">No partners matching your query.</div>}
        </div>
      )}

      {/* Resource Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Update Partner Profile" : "Onboard External Service"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Partner Name *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-nexus-purple" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Sector</label>
              <select value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none">
                <option value="Audio">Audio / Studio</option>
                <option value="Image">Image / Visuals</option>
                <option value="Marketing">Marketing / PR</option>
                <option value="Legal">Legal / Business</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Nexus Rating (1-5)</label>
              <input type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Specialties (Comma separated)</label>
            <input type="text" value={formData.skills?.join(', ')} onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})} placeholder="Mixing, Dolby Atmos, VFX..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Strategic Notes</label>
            <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none resize-none" />
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}><Save size={18} className="mr-2" /> Commit Partner</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
