# 📚 Documentation complète - Legal Vision Suite

## 🏗️ Architecture générale du projet

### Vue d'ensemble
Legal Vision Suite est une application **Single Page Application (SPA)** construite avec React et TypeScript. Elle utilise une architecture basée sur des composants réutilisables et un système de routing client-side.

### Schéma architectural

```
┌─────────────────────────────────────────────────────────────┐
│                    LEGAL VISION SUITE                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                             │
│  ├── Pages (Dashboard, Clients, Cases, etc.)               │
│  ├── Components (Layout, UI, Forms)                        │
│  ├── Contexts (Auth, Theme)                                │
│  └── Hooks (Custom, API calls)                             │
├─────────────────────────────────────────────────────────────┤
│  Backend (Supabase BaaS)                                   │
│  ├── Database (PostgreSQL)                                 │
│  ├── Authentication (JWT)                                  │
│  ├── Real-time (WebSockets)                                │
│  └── Storage (Files & Documents)                           │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Structure détaillée des dossiers

```
legal-vision-suite/
│
├── public/                    # Fichiers statiques
│   ├── favicon.ico           # Icône du site
│   ├── placeholder.svg       # Images par défaut
│   └── robots.txt            # Instructions pour les moteurs de recherche
│
├── src/                      # Code source principal
│   ├── components/           # Composants réutilisables
│   │   ├── ui/              # Composants UI de base (Shadcn)
│   │   │   ├── button.tsx   # Boutons personnalisés
│   │   │   ├── card.tsx     # Cartes de contenu
│   │   │   ├── dialog.tsx   # Modales et popups
│   │   │   ├── form.tsx     # Composants de formulaire
│   │   │   ├── table.tsx    # Tableaux de données
│   │   │   └── ...          # Autres composants UI
│   │   ├── cases/           # Composants spécifiques aux dossiers
│   │   │   └── CaseDocuments.tsx # Gestion des documents de dossier
│   │   ├── tasks/           # Composants de gestion des tâches
│   │   │   └── TaskDialog.tsx    # Dialogue de création/édition de tâche
│   │   ├── Layout.tsx       # Layout principal avec navigation
│   │   ├── Header.tsx       # En-tête pour les pages publiques
│   │   ├── ProtectedRoute.tsx # Composant de protection des routes
│   │   ├── Features.tsx     # Section des fonctionnalités
│   │   ├── Hero.tsx         # Section héro de la page d'accueil
│   │   ├── Dashboard.tsx    # Composants du tableau de bord
│   │   ├── Security.tsx     # Section sécurité
│   │   ├── CTA.tsx          # Call-to-action
│   │   └── Footer.tsx       # Pied de page
│   │
│   ├── contexts/            # Contextes React globaux
│   │   └── AuthContext.tsx  # Gestion de l'authentification globale
│   │
│   ├── hooks/               # Hooks personnalisés
│   │   ├── use-toast.ts     # Hook pour les notifications toast
│   │   └── use-mobile.tsx   # Hook pour détecter les appareils mobiles
│   │
│   ├── integrations/        # Intégrations avec services externes
│   │   └── supabase/        # Configuration Supabase
│   │       ├── client.ts    # Client Supabase configuré
│   │       └── types.ts     # Types TypeScript générés
│   │
│   ├── lib/                 # Bibliothèques et utilitaires
│   │   └── utils.ts         # Fonctions utilitaires (classNames, etc.)
│   │
│   ├── pages/               # Pages de l'application
│   │   ├── Index.tsx        # Page d'accueil publique
│   │   ├── Auth.tsx         # Page d'authentification (connexion/inscription)
│   │   ├── Dashboard.tsx    # Tableau de bord principal
│   │   ├── Cases.tsx        # Gestion des dossiers juridiques
│   │   ├── Clients.tsx      # Gestion de la base de données clients
│   │   ├── Tasks.tsx        # Gestion des tâches et workflow
│   │   ├── Invoices.tsx     # Système de facturation
│   │   ├── Appointments.tsx # Gestion du calendrier et rendez-vous
│   │   ├── Profile.tsx      # Profil utilisateur
│   │   ├── Settings.tsx     # Paramètres de l'application
│   │   ├── Notifications.tsx # Centre de notifications
│   │   └── NotFound.tsx     # Page 404
│   │
│   ├── App.tsx              # Composant racine avec configuration du routing
│   ├── main.tsx             # Point d'entrée de l'application
│   ├── index.css            # Styles CSS globaux
│   └── vite-env.d.ts        # Types TypeScript pour Vite
│
├── supabase/                # Configuration Supabase
│   ├── config.toml          # Configuration du projet Supabase
│   └── migrations/          # Migrations de base de données
│       ├── 20250806194438_*.sql # Tables principales
│       ├── 20250806194448_*.sql # Relations et contraintes
│       └── ...              # Autres migrations
│
├── Configuration files      # Fichiers de configuration
│   ├── package.json         # Dépendances et scripts npm
│   ├── tsconfig.json        # Configuration TypeScript
│   ├── vite.config.ts       # Configuration Vite
│   ├── tailwind.config.ts   # Configuration Tailwind CSS
│   ├── components.json      # Configuration Shadcn/UI
│   ├── eslint.config.js     # Configuration ESLint
│   └── postcss.config.js    # Configuration PostCSS
```

## 🔄 Flux de données et état

### Architecture de l'état

```
┌─────────────────────────────────────────────────────────────┐
│                    GESTION DE L'ÉTAT                       │
├─────────────────────────────────────────────────────────────┤
│  Context API (Global)                                      │
│  ├── AuthContext: Utilisateur, session, fonctions auth    │
│  └── ThemeContext: Mode sombre/clair (futur)              │
├─────────────────────────────────────────────────────────────┤
│  React Query (Cache API)                                   │
│  ├── Clients: Cache des données clients                    │
│  ├── Cases: Cache des dossiers                             │
│  ├── Tasks: Cache des tâches                               │
│  └── Appointments: Cache des rendez-vous                   │
├─────────────────────────────────────────────────────────────┤
│  localStorage (Persistance locale)                         │
│  ├── Préférences utilisateur                               │
│  ├── Notifications                                         │
│  └── Paramètres d'affichage                                │
├─────────────────────────────────────────────────────────────┤
│  État local (useState)                                     │
│  ├── États de formulaires                                  │
│  ├── États de modales                                      │
│  └── États temporaires                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Composants clés expliqués

### 1. App.tsx - Composant racine
```typescript
// === RÔLE PRINCIPAL ===
// Configure l'application entière avec tous les providers nécessaires
// Définit le système de routing avec routes publiques et protégées

// === PROVIDERS INCLUS ===
// - QueryClientProvider: Gestion du cache API
// - AuthProvider: État d'authentification global
// - TooltipProvider: Système de tooltips
// - BrowserRouter: Navigation client-side

// === STRUCTURE DES ROUTES ===
// Routes publiques: /, /auth
// Routes protégées: /dashboard, /cases, /clients, etc.
// Route de fallback: * (404)
```

### 2. AuthContext.tsx - Gestion de l'authentification
```typescript
// === FONCTIONNALITÉS ===
// - Écoute en temps réel des changements d'auth (Supabase)
// - Persistance automatique de la session
// - Fonctions signIn, signUp, signOut
// - État global de l'utilisateur connecté

// === UTILISATION ===
// const { user, signIn, signOut, loading } = useAuth();
// if (loading) return <Spinner />;
// if (!user) return <LoginForm />;
```

### 3. ProtectedRoute.tsx - Protection des routes
```typescript
// === LOGIQUE DE PROTECTION ===
// 1. Vérification de l'état de chargement
// 2. Redirection vers /auth si non connecté
// 3. Affichage du contenu si authentifié

// === UTILISATION ===
// <ProtectedRoute>
//   <Layout><Dashboard /></Layout>
// </ProtectedRoute>
```

### 4. Layout.tsx - Structure commune
```typescript
// === COMPOSANTS INCLUS ===
// - Header avec logo et navigation
// - Menu de navigation (desktop/mobile)
// - Zone de contenu principal
// - Bouton de déconnexion

// === NAVIGATION RESPONSIVE ===
// - Desktop: Menu horizontal dans le header
// - Mobile: Menu en scroll horizontal
```

## 🗄️ Schéma de base de données

### Tables principales (Supabase)

```sql
-- Table des profils utilisateurs
profiles {
  id: uuid (PK)
  email: text
  first_name: text
  last_name: text
  company_name: text
  created_at: timestamp
  updated_at: timestamp
}

-- Table des clients
clients {
  id: uuid (PK)
  user_id: uuid (FK -> profiles.id)
  name: text
  email: text
  phone: text
  address: text
  company: text
  type: text (individual/company)
  status: text (active/inactive)
  created_at: timestamp
  updated_at: timestamp
}

-- Table des dossiers juridiques
legal_cases {
  id: uuid (PK)
  user_id: uuid (FK -> profiles.id)
  client_id: uuid (FK -> clients.id)
  title: text
  description: text
  case_type: text
  status: text (open/closed/pending)
  priority: text (low/medium/high)
  created_at: timestamp
  updated_at: timestamp
}

-- Table des tâches
tasks {
  id: uuid (PK)
  user_id: uuid (FK -> profiles.id)
  legal_case_id: uuid (FK -> legal_cases.id)
  title: text
  description: text
  status: text (pending/completed/cancelled)
  priority: text (low/medium/high)
  due_date: timestamp
  created_at: timestamp
  updated_at: timestamp
}

-- Table des rendez-vous
appointments {
  id: uuid (PK)
  user_id: uuid (FK -> profiles.id)
  client_id: uuid (FK -> clients.id)
  legal_case_id: uuid (FK -> legal_cases.id)
  title: text
  description: text
  start_datetime: timestamp
  end_datetime: timestamp
  location: text
  status: text (scheduled/completed/cancelled)
  created_at: timestamp
  updated_at: timestamp
}

-- Table des factures
invoices {
  id: uuid (PK)
  user_id: uuid (FK -> profiles.id)
  client_id: uuid (FK -> clients.id)
  legal_case_id: uuid (FK -> legal_cases.id)
  invoice_number: text
  amount: decimal
  status: text (draft/sent/paid/overdue)
  due_date: timestamp
  created_at: timestamp
  updated_at: timestamp
}

-- Table des documents
documents {
  id: uuid (PK)
  user_id: uuid (FK -> profiles.id)
  legal_case_id: uuid (FK -> legal_cases.id)
  filename: text
  file_path: text
  file_size: bigint
  mime_type: text
  status: text (active/archived)
  created_at: timestamp
  updated_at: timestamp
}
```

## 🔐 Système d'authentification détaillé

### Flux d'authentification complet

```
1. INSCRIPTION
   ├── Utilisateur remplit le formulaire
   ├── Envoi vers Supabase Auth
   ├── Email de confirmation envoyé
   ├── Utilisateur clique sur le lien
   └── Compte activé et connecté

2. CONNEXION
   ├── Saisie email/mot de passe
   ├── Vérification par Supabase
   ├── Génération des tokens JWT
   ├── Stockage automatique des tokens
   └── Redirection vers /dashboard

3. GESTION DE SESSION
   ├── Tokens stockés dans localStorage
   ├── Refresh automatique des tokens
   ├── Écoute des changements d'état
   └── Nettoyage lors de la déconnexion

4. PROTECTION DES ROUTES
   ├── Vérification de la session
   ├── Redirection si non authentifié
   ├── Mise à jour de l'état global
   └── Accès aux données utilisateur
```

### Sécurité implémentée

- **Tokens JWT** sécurisés avec expiration automatique
- **Row Level Security (RLS)** sur toutes les tables Supabase
- **Validation côté client** et serveur
- **Chiffrement HTTPS** pour toutes les communications
- **Nettoyage automatique** des sessions expirées

## 🎨 Système de design

### Palette de couleurs
```css
:root {
  /* Couleurs principales */
  --primary: 222.2 84% 4.9%;        /* Bleu foncé */
  --primary-foreground: 210 40% 98%; /* Blanc cassé */
  
  /* Couleurs secondaires */
  --secondary: 210 40% 96%;          /* Gris très clair */
  --secondary-foreground: 222.2 84% 4.9%; /* Bleu foncé */
  
  /* Couleurs d'accent */
  --accent: 210 40% 96%;             /* Gris clair */
  --accent-foreground: 222.2 84% 4.9%; /* Bleu foncé */
  
  /* Couleurs destructives */
  --destructive: 0 84.2% 60.2%;      /* Rouge */
  --destructive-foreground: 210 40% 98%; /* Blanc */
  
  /* Couleurs de fond */
  --background: 0 0% 100%;           /* Blanc pur */
  --foreground: 222.2 84% 4.9%;     /* Bleu très foncé */
  
  /* Couleurs de bordure */
  --border: 214.3 31.8% 91.4%;      /* Gris clair */
  --ring: 222.2 84% 4.9%;           /* Bleu foncé */
}
```

### Composants UI standardisés

#### Buttons (Boutons)
```typescript
// Variantes disponibles
type ButtonVariant = 
  | "default"    // Bouton principal bleu
  | "destructive" // Bouton rouge pour actions dangereuses
  | "outline"    // Bouton avec bordure
  | "secondary"  // Bouton secondaire gris
  | "ghost"      // Bouton transparent
  | "link"       // Bouton style lien

// Tailles disponibles
type ButtonSize = "sm" | "default" | "lg" | "icon"
```

#### Cards (Cartes)
```typescript
// Structure standard d'une carte
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenu principal */}
  </CardContent>
  <CardFooter>
    {/* Actions ou informations supplémentaires */}
  </CardFooter>
</Card>
```

#### Forms (Formulaires)
```typescript
// Structure standard d'un formulaire
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="field">Libellé</Label>
      <Input 
        id="field" 
        name="field" 
        type="text" 
        placeholder="Placeholder" 
      />
    </div>
    <Button type="submit">Valider</Button>
  </div>
</form>
```

## 📱 Responsive Design

### Breakpoints Tailwind
```css
/* Mobile first approach */
sm:   640px  /* Tablettes portrait */
md:   768px  /* Tablettes paysage */
lg:   1024px /* Desktop petit */
xl:   1280px /* Desktop standard */
2xl:  1536px /* Desktop large */
```

### Stratégies responsive

#### Navigation
- **Mobile**: Menu hamburger + navigation en scroll horizontal
- **Tablet**: Navigation horizontale compacte
- **Desktop**: Navigation complète avec labels

#### Grids
```css
/* Pattern standard pour les grids */
grid-cols-1        /* Mobile: 1 colonne */
md:grid-cols-2     /* Tablet: 2 colonnes */
lg:grid-cols-3     /* Desktop: 3 colonnes */
xl:grid-cols-4     /* Large: 4 colonnes */
```

#### Tables
- **Mobile**: Cartes empilées
- **Tablet**: Table avec scroll horizontal
- **Desktop**: Table complète

## 🔔 Système de notifications

### Types de notifications
```typescript
type NotificationType = 
  | "task"        // Notifications de tâches
  | "appointment" // Notifications de rendez-vous
  | "invoice"     // Notifications de facturation
  | "client"      // Notifications clients
  | "system"      // Notifications système

type NotificationPriority = "low" | "medium" | "high"
```

### Persistance des notifications
- **localStorage**: Stockage local par utilisateur
- **Supabase**: Synchronisation future (table notifications)
- **Real-time**: Mise à jour en temps réel via WebSockets

### Interface de notification
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  actionUrl?: string; // Lien vers la page concernée
}
```

## 🧪 Tests et qualité du code

### Outils de qualité
- **TypeScript**: Typage statique strict
- **ESLint**: Linting du code JavaScript/TypeScript
- **Prettier**: Formatage automatique du code
- **Vite**: Build optimisé et tree-shaking

### Conventions de nommage
```typescript
// Composants: PascalCase
const UserProfile = () => { ... }

// Fonctions: camelCase
const handleSubmit = () => { ... }

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = "https://api.example.com"

// Types/Interfaces: PascalCase
interface UserData { ... }
type ButtonVariant = "primary" | "secondary"
```

## 🚀 Optimisations de performance

### Techniques utilisées

#### Code Splitting
```typescript
// Lazy loading des pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cases = lazy(() => import('./pages/Cases'));

// Wrapper avec Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

#### Optimisation des images
- **Formats modernes**: WebP, AVIF
- **Lazy loading**: Chargement à la demande
- **Responsive images**: Différentes tailles selon l'écran

#### Cache et mémoire
- **React Query**: Cache intelligent des requêtes API
- **localStorage**: Cache des préférences utilisateur
- **Memoization**: React.memo pour les composants purs

### Métriques de performance cibles
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle size**: < 250KB (gzipped)

## 🛡️ Sécurité et bonnes pratiques

### Sécurité frontend
- **Validation des inputs**: Sanitisation côté client
- **Protection XSS**: Échappement automatique par React
- **HTTPS**: Connexions sécurisées uniquement
- **Tokens sécurisés**: Stockage approprié des JWT

### Sécurité backend (Supabase)
- **Row Level Security**: Isolation des données par utilisateur
- **Policies PostgreSQL**: Contrôle d'accès granulaire
- **Audit trail**: Traçabilité des actions utilisateur
- **Backup automatique**: Sauvegarde quotidienne

### Conformité RGPD
- **Consentement**: Gestion des cookies et tracking
- **Portabilité**: Export des données utilisateur
- **Droit à l'oubli**: Suppression complète des données
- **Minimisation**: Collecte de données strictement nécessaires

## 📈 Monitoring et maintenance

### Métriques surveillées
- **Erreurs JavaScript**: Suivi des bugs en production
- **Performance**: Temps de chargement et réactivité
- **Utilisation**: Features les plus/moins utilisées
- **Conversion**: Taux de completion des actions

### Outils recommandés
- **Sentry**: Monitoring d'erreurs en temps réel
- **Vercel Analytics**: Métriques de performance
- **Google Analytics**: Analyse du comportement utilisateur
- **LogRocket**: Session replay pour debugging

### Plan de maintenance
- **Mises à jour hebdomadaires**: Correctifs de sécurité
- **Mises à jour mensuelles**: Nouvelles fonctionnalités
- **Mises à jour trimestrielles**: Refactoring et optimisations
- **Audit annuel**: Revue complète de l'architecture

---

Cette documentation couvre l'ensemble de l'architecture et du fonctionnement de Legal Vision Suite. Elle doit être mise à jour à chaque évolution majeure du projet.