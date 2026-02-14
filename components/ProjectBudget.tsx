import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { useRole } from '../hooks/useRole';
import { AdminOnly } from './AdminOnly';
import { Plus, Trash2, Check, Clock } from 'lucide-react';

interface ProjectBudgetItem {
  id: string;
  project_id: string;
  label: string;
  amount: number;
  status: 'pending' | 'paid';
  created_at: string;
}

interface ProjectBudgetProps {
  projectId: string;
  totalBudget: number;
}

export const ProjectBudget: React.FC<ProjectBudgetProps> = ({ projectId, totalBudget }) => {
  const { role } = useRole();
  const [budgetItems, setBudgetItems] = useState<ProjectBudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', amount: '' });

  useEffect(() => {
    fetchBudgets();
  }, [projectId]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (err: any) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.label.trim() || !newItem.amount) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('project_budgets').insert([
        {
          project_id: projectId,
          label: newItem.label,
          amount: parseFloat(newItem.amount),
          status: 'pending'
        }
      ]);

      if (error) throw error;
      setNewItem({ label: '', amount: '' });
      setIsModalOpen(false);
      await fetchBudgets();
    } catch (err: any) {
      console.error('Error adding budget item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBudgetItem = async (id: string) => {
    if (!confirm('Supprimer ce poste budgétaire ?')) return;

    try {
      const { error } = await supabase
        .from('project_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBudgets();
    } catch (err: any) {
      console.error('Error deleting budget item:', err);
    }
  };

  const handleTogglePaid = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      const { error } = await supabase
        .from('project_budgets')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchBudgets();
    } catch (err: any) {
      console.error('Error updating budget item:', err);
    }
  };

  const totalPlanned = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = budgetItems
    .filter(item => item.status === 'paid')
    .reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalBudget - totalPaid;

  if (loading) return <div className="text-white/40 text-xs">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-2xl border border-white/10">
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2">Budget Total</p>
          <p className="text-2xl font-black text-white">{totalBudget.toLocaleString('fr-FR')}€</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/10">
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2">Dépenses Payées</p>
          <p className="text-2xl font-black text-nexus-green">{totalPaid.toLocaleString('fr-FR')}€</p>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/10">
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2">Dépenses Prévues</p>
          <p className="text-2xl font-black text-nexus-orange">{totalPlanned.toLocaleString('fr-FR')}€</p>
        </div>
        <div className={`glass p-4 rounded-2xl border border-white/10 ${remaining < 0 ? 'border-nexus-red/40' : 'border-white/10'}`}>
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2">Budget Restant</p>
          <p className={`text-2xl font-black ${remaining < 0 ? 'text-nexus-red' : 'text-white'}`}>
            {remaining.toLocaleString('fr-FR')}€
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white">Postes de Dépense</h3>
          <AdminOnly>
            <Button variant="outline" className="gap-2 text-xs" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} /> Ajouter
            </Button>
          </AdminOnly>
        </div>

        {budgetItems.length === 0 ? (
          <div className="text-center py-12 text-white/40 italic">Aucun poste budgétaire encore</div>
        ) : (
          <div className="space-y-2">
            {budgetItems.map(item => (
              <div key={item.id} className="glass p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-white">{item.label}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                        item.status === 'paid'
                          ? 'bg-nexus-green/20 text-nexus-green border border-nexus-green/30'
                          : 'bg-nexus-orange/20 text-nexus-orange border border-nexus-orange/30'
                      }`}
                    >
                      {item.status === 'paid' ? (
                        <span className="flex items-center gap-1">
                          <Check size={12} /> Payé
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> En attente
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <p className="font-black text-lg text-white min-w-24 text-right">{item.amount.toLocaleString('fr-FR')}€</p>
                  <AdminOnly>
                    <button
                      onClick={() => handleTogglePaid(item.id, item.status)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                        item.status === 'paid'
                          ? 'bg-nexus-green/10 text-nexus-green hover:bg-nexus-green/20'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {item.status === 'paid' ? 'Marquer EN ATTENTE' : 'Marquer PAYÉ'}
                    </button>
                    <button
                      onClick={() => handleDeleteBudgetItem(item.id)}
                      className="p-2 hover:bg-nexus-red/10 rounded-lg text-white/40 hover:text-nexus-red transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </AdminOnly>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un Poste Budgétaire">
        <form onSubmit={handleAddBudgetItem} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/60 font-black">Nom du Poste *</label>
            <input
              required
              type="text"
              placeholder="ex: Studio, Mixage, Marketing..."
              value={newItem.label}
              onChange={e => setNewItem({ ...newItem, label: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-nexus-cyan"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/60 font-black">Montant (€) *</label>
            <input
              required
              type="number"
              placeholder="0.00"
              step="0.01"
              value={newItem.amount}
              onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-nexus-cyan"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
