
import { createClient } from '@supabase/supabase-js';

// Fix: Use process.env for environment variables to resolve TypeScript error 'Property env does not exist on type ImportMeta'
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uphtjvuacznfmooomzhe.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaHRqdnVhY3puZm1vb29temhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjU0NDYsImV4cCI6MjA4NjI0MTQ0Nn0.chsRiPNzXZ6tK02ZgF_s5ONCQk5sEwf-A8c4ci-z9IY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Aide pour la gestion d'erreurs Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return error.message || 'Une erreur est survenue avec la base de données.';
};
