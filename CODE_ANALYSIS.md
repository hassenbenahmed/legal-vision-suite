# 🔍 Guide d'analyse du code - Legal Vision Suite

Ce document explique en détail chaque bloc de code important du projet en français.

## 📁 Fichiers principaux commentés

### 🏠 App.tsx - Cœur de l'application

```typescript
// === FICHIER: src/App.tsx ===
// RÔLE: Point d'entrée principal de l'application React

// === IMPORTS PRINCIPAUX ===
// Composants UI pour les notifications et tooltips
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Client React Query pour la gestion des requêtes asynchrones et du cache
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Router React pour la navigation entre les pages
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Contexte d'authentification pour gérer l'état utilisateur global
import { AuthProvider } from "./contexts/AuthContext";

// === CONFIGURATION REACT QUERY ===
// Client pour gérer le cache des requêtes API, les refetch automatiques, etc.
const queryClient = new QueryClient();

// === COMPOSANT PRINCIPAL DE L'APPLICATION ===
const App = () => (
  // Provider React Query : gère les requêtes asynchrones et le cache global
  <QueryClientProvider client={queryClient}>
    {/* Provider d'authentification : gère l'état utilisateur dans toute l'app */}
    <AuthProvider>
      {/* Provider des tooltips pour l'interface utilisateur */}
      <TooltipProvider>
        {/* Composants de notification toast */}
        <Toaster />  {/* Toaster principal */}
        <Sonner />   {/* Toaster alternatif plus moderne */}
        
        {/* Router principal de l'application */}
        <BrowserRouter>
          <Routes>
            {/* === ROUTES PUBLIQUES === */}
            <Route path="/" element={<Index />} />     {/* Page d'accueil */}
            <Route path="/auth" element={<Auth />} />  {/* Authentification */}
            
            {/* === ROUTES PROTÉGÉES === */}
            {/* Chaque route protégée suit ce pattern : */}
            {/* ProtectedRoute > Layout > Page spécifique */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            {/* ... autres routes protégées ... */}
            
            {/* Route 404 - doit toujours être en dernier */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

**📝 Explication :**
- Le fichier App.tsx est le **chef d'orchestre** de toute l'application
- Il configure tous les **providers** nécessaires (authentification, cache, UI)
- Il définit le **système de routing** avec routes publiques et protégées
- Chaque route protégée utilise le pattern **ProtectedRoute + Layout + Page**

---

### 🔐 AuthContext.tsx - Gestion de l'authentification

```typescript
// === FICHIER: src/contexts/AuthContext.tsx ===
// RÔLE: Gestion globale de l'authentification utilisateur

// === INTERFACE DU CONTEXTE ===
// Définit tous les éléments disponibles dans le contexte auth
interface AuthContextType {
  user: User | null;           // Utilisateur connecté ou null
  session: Session | null;     // Session Supabase active ou null
  loading: boolean;            // État de chargement de l'authentification
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

// === COMPOSANT PROVIDER D'AUTHENTIFICATION ===
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // === ÉTATS LOCAUX DU CONTEXTE ===
  const [user, setUser] = useState<User | null>(null);        // Utilisateur connecté
  const [session, setSession] = useState<Session | null>(null); // Session Supabase
  const [loading, setLoading] = useState(true);                // Chargement initial

  // === EFFET POUR ÉCOUTER LES CHANGEMENTS D'AUTHENTIFICATION ===
  useEffect(() => {
    // Écoute en temps réel des changements d'état d'authentification
    // Se déclenche lors de : connexion, déconnexion, refresh de token, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event); // Debug
        setSession(session);                        // Met à jour la session
        setUser(session?.user ?? null);           // Met à jour l'utilisateur
        setLoading(false);                         // Arrête le chargement
      }
    );

    // Vérifie s'il existe déjà une session active au chargement
    // Important pour la persistance entre les rechargements de page
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Nettoyage : désabonne l'écouteur quand le composant se démonte
    return () => subscription.unsubscribe();
  }, []);

  // === FONCTION D'INSCRIPTION ===
  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,  // Redirection post-confirmation
        data: metadata                 // Données supplémentaires (nom, prénom, etc.)
      }
    });
    return { error };
  };

  // === FONCTION DE CONNEXION ===
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // === FONCTION DE DÉCONNEXION ===
  const signOut = async () => {
    await supabase.auth.signOut();
    // L'état sera automatiquement mis à jour grâce à onAuthStateChange
  };

  // Retourne le provider avec toutes les valeurs
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**📝 Explication :**
- Le **AuthContext** gère l'état d'authentification de toute l'application
- Il écoute en **temps réel** les changements d'authentification via Supabase
- Il fournit des **fonctions** pour se connecter, s'inscrire et se déconnecter
- Tous les composants peuvent accéder à ces données via `useAuth()`

---

### 🛡️ ProtectedRoute.tsx - Protection des routes

```typescript
// === FICHIER: src/components/ProtectedRoute.tsx ===
// RÔLE: Composant qui protège les routes nécessitant une authentification

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Récupération de l'état d'authentification
  const { user, loading } = useAuth();

  // === GESTION DE L'ÉTAT DE CHARGEMENT ===
  // Pendant que l'app vérifie l'authentification, on affiche un spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* Spinner de chargement animé */}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // === REDIRECTION SI NON AUTHENTIFIÉ ===
  // Si aucun utilisateur n'est connecté, redirection vers la page de connexion
  if (!user) {
    // 'replace' remplace l'entrée dans l'historique (empêche de revenir avec le bouton retour)
    return <Navigate to="/auth" replace />;
  }

  // === AFFICHAGE DU CONTENU PROTÉGÉ ===
  // Si l'utilisateur est authentifié, on affiche le contenu demandé
  return <>{children}</>;
};
```

**📝 Explication :**
- **ProtectedRoute** vérifie si l'utilisateur est connecté avant d'afficher une page
- Il gère trois états : **chargement**, **non connecté**, **connecté**
- Il redirige automatiquement vers `/auth` si l'utilisateur n'est pas connecté
- C'est un **garde** qui protège toutes les pages sensibles

---

### 🏗️ Layout.tsx - Structure commune des pages

```typescript
// === FICHIER: src/components/Layout.tsx ===
// RÔLE: Layout principal qui wrappe toutes les pages authentifiées

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation(); // Pour connaître la page actuelle

  // === CONFIGURATION DU MENU DE NAVIGATION ===
  const menuItems = [
    { path: '/dashboard', icon: Scale, label: 'Dashboard' },        // Tableau de bord
    { path: '/cases', icon: FileText, label: 'Dossiers' },          // Gestion des affaires
    { path: '/clients', icon: Users, label: 'Clients' },            // Base de données clients
    { path: '/tasks', icon: CheckSquare, label: 'Tâches' },          // Gestion des tâches
    { path: '/invoices', icon: Receipt, label: 'Facturation' },     // Système de facturation
    { path: '/appointments', icon: Calendar, label: 'RDV' },        // Calendrier rendez-vous
  ];

  // === FONCTION POUR DÉTERMINER L'ONGLET ACTIF ===
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* === HEADER PRINCIPAL === */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo cliquable pour retourner au dashboard */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">JurisCloud</span>
            </Link>
            
            {/* === NAVIGATION DESKTOP === */}
            <nav className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    // Classes CSS dynamiques selon si l'onglet est actif
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-primary text-primary-foreground'      // Style actif
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted' // Style inactif
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* === SECTION UTILISATEUR ET DÉCONNEXION === */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Bienvenue, {user?.email}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* === NAVIGATION MOBILE === */}
      <div className="md:hidden bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2 overflow-x-auto">
            {/* Même menu mais avec scroll horizontal sur mobile */}
            {menuItems.map((item) => (/* ... menu items ... */))}
          </div>
        </div>
      </div>

      {/* === CONTENU PRINCIPAL === */}
      <main className="flex-1">
        {children} {/* Le contenu de chaque page est injecté ici */}
      </main>
    </div>
  );
};
```

**📝 Explication :**
- Le **Layout** fournit la structure commune à toutes les pages authentifiées
- Il contient le **header** avec logo, navigation et profil utilisateur
- Il gère la **navigation responsive** (desktop horizontal, mobile scroll)
- Il injecte le **contenu spécifique** de chaque page via `{children}`

---

### 🏠 Dashboard.tsx - Tableau de bord principal

```typescript
// === FICHIER: src/pages/Dashboard.tsx ===
// RÔLE: Page d'accueil après connexion, affiche les KPI et activité récente

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* === EN-TÊTE DU DASHBOARD === */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.email || "Utilisateur"}
        </p>
      </div>

      {/* === CARTES DE STATISTIQUES (KPI) === */}
      {/* Grid responsive : 1 colonne sur mobile, 2 sur tablette, 4 sur desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI 1 : Dossiers actifs */}
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers actifs
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-green-600 mt-1">
              +2 ce mois {/* Indicateur de croissance */}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2-4 : Clients, RDV, CA */}
        {/* ... autres cartes KPI similaires ... */}
      </div>

      {/* === SECTION D'ACTIVITÉ RÉCENTE === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activité récente */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Activité récente
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Vos dernières actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chaque activité avec un indicateur coloré */}
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Nouveau dossier créé
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dossier Martin vs. Dupont - il y a 2h
                  </p>
                </div>
              </div>
              {/* ... autres activités ... */}
            </div>
          </CardContent>
        </Card>

        {/* Tâches à faire */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Tâches à faire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Tâches avec checkboxes interactives */}
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary" 
                />
                <span className="text-sm text-foreground">
                  Relancer client Dubois pour paiement
                </span>
              </div>
              {/* ... autres tâches ... */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

**📝 Explication :**
- Le **Dashboard** donne une vue d'ensemble de l'activité du cabinet
- Il affiche les **KPI principaux** (dossiers, clients, rendez-vous, chiffre d'affaires)
- Il montre l'**activité récente** avec une timeline des dernières actions
- Il présente les **tâches à faire** avec un système de todo-list interactif
- Le design est **responsive** et s'adapte aux différentes tailles d'écran

---

### 🔑 Auth.tsx - Page d'authentification

```typescript
// === FICHIER: src/pages/Auth.tsx ===
// RÔLE: Page de connexion et inscription des utilisateurs

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // === REDIRECTION AUTOMATIQUE ===
  // Si l'utilisateur est déjà connecté, redirection vers le dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // === FONCTION DE CONNEXION ===
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();        // Empêche le rechargement de la page
    setIsLoading(true);        // Active l'état de chargement

    // === EXTRACTION DES DONNÉES DU FORMULAIRE ===
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // === TENTATIVE DE CONNEXION ===
    const { error } = await signIn(email, password);

    // === GESTION DU RÉSULTAT ===
    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",     // Style rouge pour les erreurs
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur votre plateforme juridique!",
      });
      navigate('/dashboard');      // Redirection vers le tableau de bord
    }
    setIsLoading(false);
  };

  // === FONCTION D'INSCRIPTION ===
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Extraction des données du formulaire d'inscription
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const companyName = formData.get('companyName') as string;

    // Inscription avec métadonnées utilisateur
    const { error } = await signUp(email, password, {
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
    });

    if (error) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inscription réussie",
        description: "Vérifiez votre email pour confirmer votre compte.",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* === EN-TÊTE DE LA PAGE === */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold text-white">JurisCloud</span>
          </div>
          <p className="text-muted-light">
            Votre plateforme de gestion juridique professionnelle
          </p>
        </div>

        {/* === FORMULAIRES D'AUTHENTIFICATION === */}
        <Card className="backdrop-blur-sm bg-card/95 border-border/20">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Accès à votre espace
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Système d'onglets pour connexion/inscription */}
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              {/* Formulaire de connexion */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">
                      <Lock className="h-4 w-4" />
                      Mot de passe
                    </Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              {/* Formulaire d'inscription */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Champs nom/prénom */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">Prénom</Label>
                      <Input
                        id="signup-firstname"
                        name="firstName"
                        type="text"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Nom</Label>
                      <Input
                        id="signup-lastname"
                        name="lastName"
                        type="text"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Champs cabinet/entreprise */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-company">Cabinet/Entreprise</Label>
                    <Input
                      id="signup-company"
                      name="companyName"
                      type="text"
                    />
                  </div>
                  
                  {/* Champs email/mot de passe */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Création..." : "Créer mon compte"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

**📝 Explication :**
- La page **Auth** gère la connexion ET l'inscription sur une seule page
- Elle utilise des **onglets** pour basculer entre les deux modes
- Elle extrait les données des formulaires avec **FormData**
- Elle gère les **états de chargement** et affiche des notifications
- Elle redirige automatiquement si l'utilisateur est déjà connecté

---

## 🔧 Patterns et techniques utilisés

### 1. **Provider Pattern**
```typescript
// Utilisation de providers pour l'état global
<AuthProvider>
  <QueryClientProvider>
    <App />
  </QueryClientProvider>
</AuthProvider>
```

### 2. **Higher-Order Components (HOC)**
```typescript
// ProtectedRoute comme HOC
<ProtectedRoute>
  <Component />
</ProtectedRoute>
```

### 3. **Custom Hooks**
```typescript
// Hook personnalisé pour l'authentification
const { user, signIn, signOut } = useAuth();

// Hook pour les notifications
const { toast } = useToast();
```

### 4. **Conditional Rendering**
```typescript
// Rendu conditionnel basé sur l'état
{loading ? <Spinner /> : <Content />}
{user ? <Dashboard /> : <Login />}
```

### 5. **Form Handling**
```typescript
// Gestion des formulaires avec FormData
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const email = formData.get('email') as string;
};
```

### 6. **Error Boundaries & Error Handling**
```typescript
// Gestion d'erreurs avec try/catch et notifications
try {
  const { error } = await apiCall();
  if (error) throw error;
  // Succès
} catch (error) {
  toast({ title: "Erreur", description: error.message });
}
```

### 7. **Responsive Design Patterns**
```typescript
// Classes Tailwind pour le responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
className="hidden md:flex"  // Caché sur mobile
className="md:hidden"       // Visible uniquement sur mobile
```

---

## 🎯 Points clés à retenir

### ✅ **Bonnes pratiques implémentées**

1. **Séparation des responsabilités** : Chaque composant a un rôle spécifique
2. **État global centralisé** : AuthContext pour l'authentification
3. **Protection des routes** : ProtectedRoute vérifie l'authentification
4. **Gestion d'erreurs** : Try/catch + notifications toast
5. **Design responsive** : Adaptation mobile/tablette/desktop
6. **TypeScript strict** : Typage fort pour éviter les erreurs
7. **Composants réutilisables** : UI components via Shadcn/UI

### 🔍 **Comment lire et comprendre le code**

1. **Commencer par App.tsx** : Point d'entrée de l'application
2. **Comprendre les contexts** : AuthContext pour l'état global
3. **Suivre le flux de routing** : Routes publiques vs protégées
4. **Analyser les composants pages** : Dashboard, Auth, etc.
5. **Examiner les composants UI** : Layout, ProtectedRoute
6. **Étudier les hooks personnalisés** : useAuth, useToast

### 📚 **Ressources pour approfondir**

- **React Documentation** : https://react.dev/
- **TypeScript Handbook** : https://www.typescriptlang.org/docs/
- **Tailwind CSS** : https://tailwindcss.com/docs
- **Supabase Docs** : https://supabase.com/docs
- **React Router** : https://reactrouter.com/

---

Cette documentation vous donne toutes les clés pour comprendre et maintenir le code de Legal Vision Suite ! 🚀