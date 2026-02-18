import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';

export interface Sortie {
  id: string;
  title: string;
  release_date: string; // DATE in SQL
  project_id: string | null;
  description?: string;
  cover_url?: string;
  platforms?: string[];
  spotify_url?: string;
  status: 'planned' | 'released' | 'cancelled';
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
    cover_url?: string;
  };
}

export const useSorties = () => {
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSorties = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('sorties')
        .select(`
          *,
          project:projects(id, title, cover_url)
        `)
        .order('release_date', { ascending: true });

      if (error) throw error;

      setSorties(data || []);
    } catch (err: any) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSorties();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('sorties')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sorties' },
        () => {
          fetchSorties();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addSortie = async (sortieData: Partial<Sortie>, coverFile?: File) => {
    try {
      let coverUrl = sortieData.cover_url;

      // Upload cover if provided
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `sortie-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, coverFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('sorties')
        .insert([
          {
            ...sortieData,
            cover_url: coverUrl,
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      setSorties([...sorties, data[0]].sort((a, b) => 
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
      ));

      return data[0];
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const updateSortie = async (id: string, sortieData: Partial<Sortie>, coverFile?: File) => {
    try {
      let coverUrl = sortieData.cover_url;

      // Upload cover if provided
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `sortie-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, coverFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('sorties')
        .update({
          ...sortieData,
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      setSorties(
        sorties.map((s) => (s.id === id ? data[0] : s)).sort((a, b) =>
          new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
        )
      );

      return data[0];
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const deleteSortie = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sorties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSorties(sorties.filter((s) => s.id !== id));
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  return {
    sorties,
    loading,
    error,
    fetchSorties,
    addSortie,
    updateSortie,
    deleteSortie,
  };
};
