<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Indigo Records - Label Management Platform

Plateforme de gestion complète pour label musical : artistes, projets, releases, équipe, calendrier et synchronisation Google Calendar.

## 🚀 Lancement Local

**Prérequis:** Node.js 18+

1. **Installation des dépendances:**
   ```bash
   npm install
   ```

2. **Configuration de l'environnement:**
   
   Créez un fichier `.env.local` à la racine:
   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...
   ```

3. **Lancement du serveur de développement:**
   ```bash
   npm run dev
   ```

4. **Build de production:**
   ```bash
   npm run build
   ```

## 🗄️ Gestion des Migrations SQL

### Méthode Rapide (Recommandée)

```bash
# Affiche les migrations à exécuter
npm run migrate
```

### Automatique avec Supabase CLI

```bash
# Installation (une fois)
npm install -g supabase

# Configuration (une fois)
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer les migrations
supabase db push
```

📚 **Plus d'infos:** Consultez [MIGRATIONS.md](MIGRATIONS.md) pour toutes les options disponibles.

## 🎵 Fonctionnalités

- **Artistes:** Gestion roster, liaison avec équipe interne, assets (contrats, EPK, photos)
- **Projets:** Singles, EPs, Albums, Mixtapes avec pipeline de production
- **Tâches:** Suivi collaboratif avec statuts et échéances
- **Calendrier:** Vue mensuelle + agenda, sync Google Calendar bidirectionnelle
- **Management:** Attribution managers-artistes, visualisation tâches par manager
- **Réunions:** Organisation avec notes et suivis
- **Équipe:** Gestion membres internes (agents Indigo)

## 🛠️ Stack Technique

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Router:** React Router v7
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Intégrations:** Google Calendar API

## 📂 Structure du Projet

```
nexus-label/
├── components/          # Composants UI réutilisables
│   ├── features/       # Composants métier (ArtistCard, Waveform)
│   ├── layout/         # Header, Sidebar
│   └── ui/             # Button, Card, Modal, Toast
├── pages/              # Pages principales (Artists, Projects, Calendar, etc.)
├── hooks/              # Custom React hooks (useAuth, useArtists)
├── lib/                # Services (Supabase, Storage, Google Calendar)
├── supabase/           # Migrations SQL + Edge Functions
├── scripts/            # Scripts d'automatisation (migrations)
└── public/             # Assets statiques
```

## 🔐 Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase | ✅ |
| `SUPABASE_SERVICE_KEY` | Clé service (pour migrations automatiques) | ⚠️ Optionnel |

## 📦 Déploiement

### Netlify

1. Connectez votre repo GitHub
2. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Variables d'environnement: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Ajoutez `_redirects` (déjà inclus dans `public/`)

## 🤝 Support

Pour toute question technique, consultez:
- [Documentation Supabase](https://supabase.com/docs)
- [Guide des Migrations](MIGRATIONS.md)
- Issues GitHub

---

**Indigo Records** © 2026 - Built with ❤️ and ☕

