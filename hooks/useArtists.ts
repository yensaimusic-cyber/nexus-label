
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
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          projects:projects(count)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      // Mapper les données pour inclure projects_count
      const formattedArtists = data.map((artist: any) => ({
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

      // 2. Insertion en base
      const { data, error } = await supabase
        .from('artists')
        .insert([{ ...artistData, avatar_url: avatarUrl }])
        .select()
        .single();

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

      if (error) throw error;

      setArtists(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
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
