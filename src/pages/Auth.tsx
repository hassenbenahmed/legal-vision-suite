// === IMPORTS POUR LA PAGE D'AUTHENTIFICATION ===
import React, { useState, useEffect } from 'react';
// Hook de navigation pour rediriger après connexion
import { useNavigate } from 'react-router-dom';
// Composants UI pour l'interface
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Composants pour les onglets connexion/inscription
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Hook d'authentification
import { useAuth } from '@/contexts/AuthContext';
// Hook pour les notifications
import { useToast } from '@/hooks/use-toast';
// Icônes pour l'interface
import { Scale, Mail, Lock, User, Building2 } from 'lucide-react';

// === COMPOSANT PRINCIPAL D'AUTHENTIFICATION ===
// Page qui gère la connexion et l'inscription des utilisateurs
const Auth = () => {
  // === ÉTATS LOCAUX ===
  const [isLoading, setIsLoading] = useState(false); // État de chargement des formulaires
  
  // === HOOKS ===
  const { signIn, signUp, user } = useAuth();         // Fonctions d'authentification
  const { toast } = useToast();                       // Notifications toast
  const navigate = useNavigate();                     // Navigation programmatique

  // === REDIRECTION AUTOMATIQUE ===
  // Si l'utilisateur est déjà connecté, redirection vers le dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // === FONCTION DE CONNEXION ===
  // Gère la soumission du formulaire de connexion
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
      // En cas d'erreur : affichage d'une notification d'erreur
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",     // Style rouge pour les erreurs
      });
    } else {
      // En cas de succès : notification positive et redirection
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur votre plateforme juridique!",
      });
      navigate('/dashboard');      // Redirection vers le tableau de bord
    }

    setIsLoading(false);           // Désactive l'état de chargement
  };

  // === FONCTION D'INSCRIPTION ===
  // Gère la soumission du formulaire d'inscription
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();        // Empêche le rechargement de la page
    setIsLoading(true);        // Active l'état de chargement

    // === EXTRACTION DES DONNÉES DU FORMULAIRE ===
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const companyName = formData.get('companyName') as string;

    // === TENTATIVE D'INSCRIPTION ===
    // Envoi des données utilisateur comme métadonnées
    const { error } = await signUp(email, password, {
      first_name: firstName,     // Prénom utilisateur
      last_name: lastName,       // Nom utilisateur  
      company_name: companyName, // Nom du cabinet/entreprise
    });

    // === GESTION DU RÉSULTAT ===
    if (error) {
      // En cas d'erreur : notification d'erreur
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // En cas de succès : notification avec instruction de vérification email
      toast({
        title: "Inscription réussie",
        description: "Vérifiez votre email pour confirmer votre compte.",
      });
    }

    setIsLoading(false);         // Désactive l'état de chargement
  };

  // === STRUCTURE PRINCIPALE DE LA PAGE ===
  return (
    // Conteneur principal avec dégradé de fond
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* === EN-TÊTE DE LA PAGE === */}
        <div className="text-center mb-8">
          {/* Logo et nom de l'application */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold text-white">JurisCloud</span>
          </div>
          {/* Description de l'application */}
          <p className="text-muted-light">
            Votre plateforme de gestion juridique professionnelle
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 border-border/20">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              Accès à votre espace
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Connectez-vous ou créez votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Mot de passe
                    </Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Prénom
                      </Label>
                      <Input
                        id="signup-firstname"
                        name="firstName"
                        type="text"
                        placeholder="Jean"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Nom</Label>
                      <Input
                        id="signup-lastname"
                        name="lastName"
                        type="text"
                        placeholder="Dupont"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-company" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Cabinet/Entreprise
                    </Label>
                    <Input
                      id="signup-company"
                      name="companyName"
                      type="text"
                      placeholder="Cabinet Dupont & Associés"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Mot de passe
                    </Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
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

export default Auth;