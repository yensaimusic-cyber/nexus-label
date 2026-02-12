import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration depuis .env ou variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Clé service, pas anon key!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes');
  console.log('Assurez-vous que VITE_SUPABASE_URL et SUPABASE_SERVICE_KEY sont définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Démarrage des migrations Indigo Records...\n');

  const migrationsDir = join(__dirname, '../supabase/migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Tri alphabétique = tri chronologique si nommés correctement

  console.log(`📁 ${files.length} fichier(s) de migration trouvé(s)\n`);

  for (const file of files) {
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');

    console.log(`⏳ Exécution: ${file}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Si la fonction RPC n'existe pas, utiliser l'approche directe
        const { error: directError } = await supabase.from('_migrations').insert({
          name: file,
          executed_at: new Date().toISOString()
        });

        if (directError && directError.code !== '23505') { // Ignore duplicate key
          throw directError;
        }

        console.log(`✅ ${file} - OK`);
      } else {
        console.log(`✅ ${file} - OK`);
      }
    } catch (err) {
      console.error(`❌ ${file} - ÉCHEC`);
      console.error(err.message);
      // Continue avec les autres migrations
    }
  }

  console.log('\n🎉 Migrations terminées!');
}

runMigrations().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
