import { createClient } from '@supabase/supabase-js';

// Les variables d'environnement sont automatiquement chargées depuis Netlify
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Aide pour la gestion d'erreurs Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  // Tu peux ajouter ici un système de toast (ex: react-hot-toast)
  return error.message || 'Une erreur est survenue avec la base de données.';
};
