
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Star, Trash2, Briefcase, Loader2, Save, Mail, Phone, Instagram, ExternalLink, MoreVertical, X, Check, MessageCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { AdminOnly } from '../components/AdminOnly';
import { ExternalResource } from '../types';

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeContactMenu, setActiveContactMenu] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ExternalResource & { phone: string, email: string, instagram: string }>>({
    name: '', 
    service_type: '', 
    skills: [], 
    contact_info: '', 
    website: '', 
    rating: 5, 
    notes: '',
    phone: '',
    email: '',
    instagram: ''
  });

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('resources').select('*').order('name');
      if (error) throw error;
      setResources(data || []);
    } catch (err: any) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleEdit = (resource: any) => {
    setEditingId(resource.id);
    setFormData({
      ...resource,
      skills: resource.skills || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (editingId) {
        const { error } = await supabase.from('resources').update(formData).eq('id', editingId);
        if (error) throw error;
        alert("Partenaire mis à jour avec succès !");
      } else {
        const { error } = await supabase.from('resources').insert([formData]);
        if (error) throw error;
        alert("Nouveau partenaire ajouté au répertoire !");
      }
      
      setIsModalOpen(false);
      fetchResources();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce partenaire du répertoire ?")) return;
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      setResources(prev => prev.filter(r => r.id !== id));
      alert("Partenaire supprimé.");
    } catch (err: any) {
      alert("Erreur lors de la suppression.");
    }
  };

  const filteredResources = resources.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.service_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen flex flex-col">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold text-white tracking-tight">Répertoire Partenaires</h2>
          <p className="text-nexus-lightGray text-sm mt-1">Gérez vos prestataires externes, studios et créatifs favoris.</p>
        </div>
        <AdminOnly>
          <Button variant="primary" className="gap-2 shadow-xl" onClick={() => { 
            setEditingId(null); 
            setFormData({ name: '', service_type: '', skills: [], website: '', rating: 5, notes: '', phone: '', email: '', instagram: '' }); 
            setIsModalOpen(true); 
          }}>
            <Plus size={20} />
            <span>Nouveau Partenaire</span>
          </Button>
        </AdminOnly>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text" 
          placeholder="Rechercher par nom, service ou compétence..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full glass rounded-[24px] py-4 pl-12 pr-4 text-sm focus:border-nexus-purple transition-all outline-none text-white font-medium shadow-lg" 
        />
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
           <Loader2 className="animate-spin text-nexus-purple" size={40} />
           <p className="mt-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Synchronisation du carnet d'adresses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="flex flex-col h-full hover:border-nexus-cyan/40 transition-all group border-white/5 shadow-xl relative">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-[18px] bg-nexus-cyan/10 text-nexus-cyan shadow-lg">
                    <Briefcase size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-lg text-white group-hover:text-nexus-cyan transition-colors leading-none mb-1.5 truncate">{resource.name}</h3>
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] font-black">{resource.service_type || 'Service Divers'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-nexus-orange/10 px-2 py-1 rounded-lg text-nexus-orange shrink-0">
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
                  "{resource.notes || 'Aucune note stratégique pour ce partenaire.'}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex gap-2">
                <div className="relative flex-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 text-[10px] uppercase font-black tracking-widest h-11"
                    onClick={() => setActiveContactMenu(activeContactMenu === resource.id ? null : resource.id)}
                  >
                    <Mail size={16} className="text-nexus-purple" />
                    Contacter
                  </Button>
                  
                  <AnimatePresence>
                    {activeContactMenu === resource.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-14 left-0 w-full bg-nexus-surface border border-white/10 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                      >
                        {resource.email && (
                          <a href={`mailto:${resource.email}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-xs font-bold text-white/70">
                            <Mail size={14} className="text-nexus-purple" /> Email
                          </a>
                        )}
                        {resource.phone && (
                          <>
                            <a href={`tel:${resource.phone}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-xs font-bold text-white/70">
                              <Phone size={14} className="text-nexus-cyan" /> Appeler
                            </a>
                            <a href={`https://wa.me/${resource.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-xs font-bold text-white/70">
                              <MessageCircle size={14} className="text-nexus-green" /> WhatsApp
                            </a>
                          </>
                        )}
                        {resource.instagram && (
                          <a href={`https://instagram.com/${resource.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all text-xs font-bold text-white/70">
                            <Instagram size={14} className="text-nexus-pink" /> Instagram
                          </a>
                        )}
                        {!resource.email && !resource.phone && !resource.instagram && (
                          <p className="px-4 py-3 text-[10px] text-white/30 italic">Aucun contact enregistré</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AdminOnly>
                  <div className="flex gap-2">
                     <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)} className="h-11 px-3 border border-white/5 hover:border-nexus-cyan transition-all text-nexus-cyan">
                       <Save size={18} className="rotate-45" />
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => handleDelete(resource.id)} className="h-11 px-3 border border-white/5 hover:border-nexus-red transition-all text-white/20 hover:text-nexus-red">
                       <Trash2 size={18} />
                     </Button>
                  </div>
                </AdminOnly>
              </div>
            </Card>
          ))}
          {filteredResources.length === 0 && (
            <div className="col-span-full py-24 text-center glass rounded-[40px] border-dashed border-white/10 opacity-30 flex flex-col items-center justify-center">
               <Briefcase size={64} className="mb-4" />
               <p className="text-lg font-heading font-bold">Aucun partenaire trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Partenaire */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier le Partenaire" : "Nouveau Partenaire"}>
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Nom du partenaire *</label>
            <input required type="text" placeholder="ex: Studio Pulse" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none transition-all shadow-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Secteur / Type de service</label>
              <input 
                type="text"
                placeholder="Ex: Studio, Graphiste, PR..."
                value={formData.service_type || ''}
                onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none transition-all shadow-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Note de satisfaction (1-5)</label>
              <input type="number" min="1" max="5" step="0.5" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white outline-none" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-[10px] font-mono uppercase text-nexus-purple tracking-widest font-black">Coordonnées de contact</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input type="tel" placeholder="+33 6..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input type="email" placeholder="contact@..." value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Instagram</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input type="text" placeholder="@nomutilisateur" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Lien Site Web</label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input type="url" placeholder="https://..." value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">Notes & Retours</label>
            <textarea rows={3} placeholder="Tarifs préférentiels, spécialités Dolby Atmos..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-nexus-purple outline-none resize-none text-sm" />
          </div>

          <div className="flex gap-3 pt-6 border-t border-white/5">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>
              <Save size={18} className="mr-2" /> Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
