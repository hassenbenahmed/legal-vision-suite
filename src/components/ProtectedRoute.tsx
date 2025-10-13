// === IMPORTS POUR LA PROTECTION DES ROUTES ===
import React from 'react';
// Navigate permet de rediriger l'utilisateur programmatiquement
import { Navigate } from 'react-router-dom';
// Hook pour accéder à l'état d'authentification
import { useAuth } from '@/contexts/AuthContext';

// === INTERFACE DU COMPOSANT ===
interface ProtectedRouteProps {
  children: React.ReactNode; // Le contenu à afficher si l'utilisateur est authentifié
}

// === COMPOSANT DE PROTECTION DES ROUTES ===
// Ce composant "wrappe" les pages qui nécessitent une authentification
// Il vérifie si l'utilisateur est connecté avant d'afficher le contenu
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

// === UTILISATION DU COMPOSANT ===
/*
  Exemple d'utilisation dans App.tsx :
  
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
  
  Flux de fonctionnement :
  1. L'utilisateur navigue vers /dashboard
  2. ProtectedRoute vérifie s'il est connecté
  3a. Si connecté : affiche Layout > Dashboard
  3b. Si non connecté : redirige vers /auth
  3c. Si en cours de vérification : affiche le spinner
*/

export default ProtectedRoute;