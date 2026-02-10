
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Star, Trash2, Briefcase, Loader2, Save, Mail } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { ExternalResource } from '../types';

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<ExternalResource>>({
    name: '', service_type: 'Audio', skills: [], contact_info: '', website: '', rating: 5, notes: ''
  });

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('resources').select('*').order('name');
      setResources(data || []);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await supabase.from('resources').insert([formData]);
      setIsModalOpen(false);
      fetchResources();
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-extrabold">Partenaires & Services</h2>
          <p className="text-nexus-lightGray text-sm">Répertoire des prestataires externes et studios.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}><Plus size={20} className="mr-2" /> Ajouter un prestataire</Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input type="text" placeholder="Rechercher par nom ou spécialité..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full glass rounded-[24px] py-4 pl-12 text-sm" />
      </div>

      {loading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(resource => (
            <Card key={resource.id} className="hover:border-nexus-cyan/40 p-6 flex flex-col h-full">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">{resource.name}</h3>
                <div className="text-nexus-orange flex items-center gap-1"><Star size={12} fill="currentColor"/>{resource.rating}</div>
              </div>
              <p className="text-[10px] font-mono text-nexus-cyan uppercase mb-4">{resource.service_type}</p>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-white/40 italic">"{resource.notes}"</p>
              </div>
              <Button variant="outline" className="w-full mt-6 text-[10px] font-black uppercase"><Mail size={16} className="mr-2" /> Contacter</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Prestataire">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder="Nom du partenaire" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4" />
          <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})}>
            <option value="Audio">Audio / Studio</option><option value="Image">Image / Visuels</option><option value="Marketing">Marketing / PR</option>
          </select>
          <textarea placeholder="Notes stratégiques..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 resize-none" />
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>Enregistrer</Button>
        </form>
      </Modal>
    </div>
  );
};
