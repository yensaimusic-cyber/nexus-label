
import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { Artist, ArtistStatus } from '../types';

export const useArtists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      
      // Essayer d'abord avec la jointure linked_profile (après migrations)
      let { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          projects:projects(count),
          linked_profile:profiles!artists_profile_id_fkey(id, full_name, avatar_url, role)
        `)
        .order('name', { ascending: true });

      // Si erreur sur profile_id ou linked_profile (colonne n'existe pas), réessayer sans jointure
      if (error && (error.message.includes('profile_id') || error.message.includes('linked_profile'))) {
        const result = await supabase
          .from('artists')
          .select(`
            *,
            projects:projects(count)
          `)
          .order('name', { ascending: true });
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Mapper les données pour inclure projects_count
      const formattedArtists = (data || []).map((artist: any) => ({
        ...artist,
        projects_count: artist.projects?.[0]?.count || 0
      }));

      setArtists(formattedArtists);
    } catch (err: any) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const addArtist = async (artistData: Partial<Artist>, avatarFile?: File) => {
    try {
      let avatarUrl = artistData.avatar_url;

      // 1. Upload de l'image si présente
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `artist-avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
      }

      // 2. Insertion en base - essayer d'abord avec tous les champs
      let { data, error } = await supabase
        .from('artists')
        .insert([{ ...artistData, avatar_url: avatarUrl }])
        .select()
        .single();

      // Si erreur sur profile_id (colonne n'existe pas encore), retenter sans
      if (error && (error.message.includes('profile_id') || error.message.includes('unknown column'))) {
        const dataWithoutProfileId = { ...artistData, avatar_url: avatarUrl };
        delete (dataWithoutProfileId as any).profile_id;
        
        const retryResult = await supabase
          .from('artists')
          .insert([dataWithoutProfileId])
          .select()
          .single();
        
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) throw error;
      
      setArtists(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const updateArtist = async (id: string, updates: Partial<Artist>, avatarFile?: File) => {
    try {
      let avatarUrl = updates.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${id}-${Math.random()}.${fileExt}`;
        const filePath = `artist-avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('artists')
        .update({ ...updates, avatar_url: avatarUrl })
        .eq('id', id)
        .select()
        .single();

      // Si erreur sur profile_id (colonne n'existe pas encore), retenter sans
      if (error && (error.message.includes('profile_id') || error.message.includes('unknown column'))) {
        const updatesWithoutProfileId = { ...updates, avatar_url: avatarUrl };
        delete (updatesWithoutProfileId as any).profile_id;
        
        const retryResult = await supabase
          .from('artists')
          .update(updatesWithoutProfileId)
          .eq('id', id)
          .select()
          .single();
        
        if (retryResult.error) throw retryResult.error;
        
        setArtists(prev => prev.map(a => a.id === id ? { ...a, ...retryResult.data } : a));
        return retryResult.data;
      }

      if (error) throw error;

      setArtists(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
      return data;
      return data;
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  const deleteArtist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setArtists(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      throw new Error(handleSupabaseError(err));
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  return { artists, loading, error, fetchArtists, addArtist, updateArtist, deleteArtist };
};
