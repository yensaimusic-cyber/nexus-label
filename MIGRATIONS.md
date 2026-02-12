# Guide des Migrations - Indigo Records

## 🎯 Méthodes d'exécution des migrations

### Méthode 1: Supabase SQL Editor (Actuelle - Manuelle)

1. Ouvrez Supabase Dashboard → SQL Editor
2. Copiez le contenu du fichier de migration
3. Cliquez sur "Run"
4. ✅ Migration appliquée

**Fichiers à exécuter:**
- `supabase/migrations/20260212_add_artist_team_members_profile_support.sql`
- `supabase/migrations/20260212_link_artists_to_team_profiles.sql`

---

### Méthode 2: Script PowerShell (Semi-automatique)

```powershell
# Depuis la racine du projet
.\scripts\migrate.ps1
```

Ce script affiche les migrations à exécuter et vous guide étape par étape.

---

### Méthode 3: Supabase CLI (Recommandé - Automatique)

#### Installation

```powershell
# Installer Supabase CLI
npm install -g supabase

# Ou avec winget (Windows)
winget install Supabase.CLI
```

#### Configuration

```powershell
# Se connecter à Supabase
supabase login

# Lier votre projet (une seule fois)
supabase link --project-ref YOUR_PROJECT_REF
```

Votre `PROJECT_REF` se trouve dans l'URL Supabase:
`https://app.supabase.com/project/[PROJECT_REF]`

#### Utilisation

```powershell
# Appliquer toutes les migrations en attente
supabase db push

# Ou créer une nouvelle migration
supabase migration new ma_nouvelle_migration
```

---

### Méthode 4: Script Node.js (Avancé)

Nécessite une **Service Role Key** (clé admin, pas anon key):

1. Allez dans Supabase Dashboard → Settings → API
2. Copiez la `service_role` key (⚠️ gardez-la secrète!)
3. Créez un fichier `.env.local`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...  # Service role key
```

4. Exécutez:

```powershell
node scripts/run-migrations.js
```

---

## 📋 Migrations disponibles

### 1. `20260212_add_artist_team_members_profile_support.sql`
**But:** Ajouter le support des membres internes (agents Indigo) dans la gestion d'équipe des artistes

**Changements:**
- Ajoute colonne `member_type` (internal/external)
- Ajoute colonne `profile_id` (FK vers profiles)
- Rend `name` et `role` nullable (pour membres internes)
- Crée des index pour performances

### 2. `20260212_link_artists_to_team_profiles.sql`
**But:** Permettre de lier un artiste à un profil de l'équipe (si l'artiste est aussi membre de l'équipe)

**Changements:**
- Ajoute colonne `profile_id` à la table `artists`
- Crée un index pour performances

---

## 🔧 Dépannage

### Erreur: "relation already exists"
✅ Normal - La migration vérifie si la colonne/table existe déjà

### Erreur: "permission denied"
❌ Vous utilisez l'anon key au lieu de la service key

### Migrations ne s'appliquent pas
1. Vérifiez que vous êtes connecté au bon projet
2. Vérifiez les permissions de votre compte Supabase
3. Essayez en mode manuel (SQL Editor)

---

## 🎯 Workflow recommandé

Pour éviter d'exécuter manuellement les migrations à chaque fois:

### Option A: Utiliser Supabase CLI (Meilleur choix)
```powershell
# Setup une fois
npm install -g supabase
supabase login
supabase link --project-ref YOUR_REF

# À chaque nouvelle migration
supabase db push
```

### Option B: Intégrer dans le déploiement Netlify
Ajoutez dans `netlify.toml`:
```toml
[build]
  command = "npm run build"
  
[build.environment]
  SUPABASE_ACCESS_TOKEN = "YOUR_TOKEN"

[[plugins]]
  package = "@supabase/netlify-plugin-supabase"
```

Puis configurez les hooks de déploiement pour exécuter les migrations automatiquement.

---

## 📚 Ressources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [Database Management](https://supabase.com/docs/guides/database)
