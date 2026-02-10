
import { createClient } from '@supabase/supabase-js';

// Remplacer ces valeurs par tes propres clés Supabase une fois le projet créé
const supabaseUrl = 'https://uphtjvuacznfmosb_publishable_YabzV160QA383MBQOS6d4A_wJesuH8yta-cle-anonyme';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Aide pour la gestion d'erreurs Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  // Tu peux ajouter ici un système de toast (ex: react-hot-toast)
  return error.message || 'Une erreur est survenue avec la base de données.';
};
