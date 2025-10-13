import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Scale, 
  LogOut, 
  FileText, 
  Users, 
  CheckSquare, 
  Receipt, 
  Calendar, 
  Settings, 
  User,
  Bell,
  Menu,
  X,
  BarChart3,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt sur Legal Vision Suite!",
    });
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: BarChart3, 
      label: 'Tableau de bord',
      description: 'Vue d\'ensemble de l\'activité'
    },
    { 
      path: '/cases', 
      icon: Briefcase, 
      label: 'Dossiers',
      description: 'Gestion des affaires juridiques'
    },
    { 
      path: '/clients', 
      icon: Users, 
      label: 'Clients',
      description: 'Base de données clients'
    },
    { 
      path: '/tasks', 
      icon: CheckSquare, 
      label: 'Tâches',
      description: 'Suivi des actions'
    },
    { 
      path: '/invoices', 
      icon: Receipt, 
      label: 'Facturation',
      description: 'Gestion financière'
    },
    { 
      path: '/appointments', 
      icon: Calendar, 
      label: 'Agenda',
      description: 'Rendez-vous & planification'
    },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const getActiveLabel = () => {
    const activeItem = menuItems.find(item => isActivePath(item.path));
    return activeItem?.label || 'Legal Vision Suite';
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Scale className="h-6 w-6 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-lg font-bold text-foreground">Legal Vision Suite</span>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    Solution juridique professionnelle
                  </p>
                </div>
              </Link>
              
              {/* Page indicator for mobile */}
              <div className="sm:hidden">
                <Badge variant="outline" className="text-xs">
                  {getActiveLabel()}
                </Badge>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium 
                      transition-all duration-200 hover:scale-105
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button 
                asChild 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-accent/50 transition-colors"
              >
                <Link to="/notifications">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
                    >
                      {notificationCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Mon compte</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <nav className="grid grid-cols-2 gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-lg text-center transition-colors
                        ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* === CONTENU PRINCIPAL === */}
      {/* Zone où s'affiche le contenu de chaque page */}
      <main className="flex-1">
        {children} {/* Le contenu de la page actuelle est injecté ici */}
      </main>
    </div>
  );
};

// === UTILISATION ET ARCHITECTURE ===
/*
  Le Layout est utilisé pour wrapper toutes les pages authentifiées :
  
  <ProtectedRoute>
    <Layout>
      <Dashboard />  // Le contenu spécifique de la page
    </Layout>
  </ProtectedRoute>
  
  Structure générée :
  - Header avec logo et navigation desktop
  - Navigation mobile (visible uniquement sur petit écran)
  - Zone de contenu principal (children)
  
  Réactivité :
  - Desktop : navigation horizontale dans le header
  - Mobile : navigation en scroll horizontal sous le header
*/

export default Layout;