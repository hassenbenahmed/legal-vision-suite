import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Clients from "./pages/Clients";
import Tasks from "./pages/Tasks";
import Invoices from "./pages/Invoices";
import Appointments from "./pages/Appointments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

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
            {/* Page d'accueil : présentation du produit, fonctionnalités */}
            <Route path="/" element={<Index />} />
            
            {/* Page d'authentification : connexion et inscription */}
            <Route path="/auth" element={<Auth />} />
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
            <Route 
              path="/cases" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Cases />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Clients />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Tasks />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Invoices />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/appointments" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Appointments />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Notifications />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* === ROUTE DE FALLBACK === */}
            {/* Route 404 : capture toutes les URLs non définies */}
            {/* IMPORTANT: Cette route doit toujours être en dernier */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// === ARCHITECTURE DE L'APPLICATION ===
/*
  Structure des Providers (de l'extérieur vers l'intérieur) :
  1. QueryClientProvider : Gestion des requêtes API et cache
  2. AuthProvider : État d'authentification global
  3. TooltipProvider : Système de tooltips UI
  4. BrowserRouter : Navigation et routing
  
  Chaque route protégée utilise :
  - ProtectedRoute : Vérifie l'authentification
  - Layout : Navigation et structure commune
  - Page spécifique : Contenu de la page
*/

export default App;
