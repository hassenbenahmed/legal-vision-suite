// === IMPORTS POUR LA GESTION DE L'AUTHENTIFICATION ===
import React, { createContext, useContext, useEffect, useState } from 'react';
// Types Supabase pour l'utilisateur et la session
import { User, Session } from '@supabase/supabase-js';
// Client Supabase configuré pour interagir avec la base de données
import { supabase } from '@/integrations/supabase/client';

// === INTERFACE DU CONTEXTE D'AUTHENTIFICATION ===
// Définit tous les éléments disponibles dans le contexte auth
interface AuthContextType {
  user: User | null;           // Utilisateur connecté ou null
  session: Session | null;     // Session Supabase active ou null
  loading: boolean;            // État de chargement de l'authentification
  // Fonction d'inscription avec métadonnées optionnelles (nom, prénom, etc.)
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  // Fonction de connexion
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  // Fonction de déconnexion
  signOut: () => Promise<void>;
}

// === CRÉATION DU CONTEXTE ===
// Contexte React qui contiendra l'état d'authentification global
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// === HOOK PERSONNALISÉ POUR UTILISER LE CONTEXTE ===
// Hook qui permet d'accéder facilement au contexte d'auth depuis n'importe quel composant
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Protection contre l'utilisation hors du Provider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// === COMPOSANT PROVIDER D'AUTHENTIFICATION ===
// Fournit le contexte d'authentification à tous les composants enfants
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
  // Crée un nouveau compte utilisateur avec email/mot de passe
  const signUp = async (email: string, password: string, metadata?: any) => {
    // URL de redirection après confirmation d'email
    const redirectUrl = `${window.location.origin}/`;
    
    // Appel à l'API Supabase pour créer le compte
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,  // Redirection post-confirmation
        data: metadata                 // Données supplémentaires (nom, prénom, etc.)
      }
    });
    return { error }; // Retourne l'erreur s'il y en a une
  };

  // === FONCTION DE CONNEXION ===
  // Authentifie un utilisateur existant
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error }; // Retourne l'erreur s'il y en a une
  };

  // === FONCTION DE DÉCONNEXION ===
  // Déconnecte l'utilisateur et nettoie la session
  const signOut = async () => {
    await supabase.auth.signOut();
    // L'état sera automatiquement mis à jour grâce à onAuthStateChange
  };

  // === VALEUR DU CONTEXTE ===
  // Objet contenant toutes les données et fonctions disponibles dans le contexte
  const value = {
    user,      // Utilisateur connecté (null si déconnecté)
    session,   // Session Supabase avec tokens d'accès
    loading,   // True pendant la vérification initiale de l'auth
    signUp,    // Fonction d'inscription
    signIn,    // Fonction de connexion
    signOut,   // Fonction de déconnexion
  };

  // === RENDU DU PROVIDER ===
  // Fournit le contexte à tous les composants enfants
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// === UTILISATION DU CONTEXTE ===
/*
  Pour utiliser ce contexte dans un composant :
  
  import { useAuth } from '@/contexts/AuthContext';
  
  const MonComposant = () => {
    const { user, signIn, signOut, loading } = useAuth();
    
    if (loading) return <div>Chargement...</div>;
    if (!user) return <div>Non connecté</div>;
    
    return <div>Bonjour {user.email}</div>;
  };
*/