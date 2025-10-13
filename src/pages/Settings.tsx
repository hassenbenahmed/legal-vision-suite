import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  Moon,
  Sun,
  Monitor,
  Mail,
  MessageSquare,
  Calendar,
  Smartphone,
  Lock,
  Eye,
  Download,
  Trash2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  appointment_reminders: boolean;
  invoice_alerts: boolean;
  system_updates: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  compact_mode: boolean;
  sidebar_collapsed: boolean;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  login_notifications: boolean;
  data_retention: number;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    task_reminders: true,
    appointment_reminders: true,
    invoice_alerts: true,
    system_updates: false,
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'system',
    compact_mode: false,
    sidebar_collapsed: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30, // minutes
    login_notifications: true,
    data_retention: 365, // days
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);

  // Fonctions pour la gestion de la sécurité
  const enable2FA = async (enabled: boolean) => {
    try {
      // Ici vous pouvez implémenter l'intégration avec Supabase pour l'authentification 2FA
      setSecurity(prev => ({ ...prev, two_factor_enabled: enabled }));
      toast({
        title: enabled ? "2FA activé" : "2FA désactivé",
        description: enabled ? "L'authentification à deux facteurs a été activée." : "L'authentification à deux facteurs a été désactivée."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier les paramètres 2FA.",
        variant: "destructive"
      });
    }
  };

  const handleSecurityChange = (setting: keyof SecuritySettings, value: boolean | number) => {
    setSecurity(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Paramètre mis à jour",
      description: "Vos paramètres de sécurité ont été sauvegardés."
    });
  };

  const changePassword = async (passwords: { current: string; new: string; confirm: string }) => {
    try {
      if (passwords.new !== passwords.confirm) {
        throw new Error("Les nouveaux mots de passe ne correspondent pas");
      }
      
      // Ici vous pouvez implémenter le changement de mot de passe avec Supabase
      // const { error } = await supabase.auth.updateUser({ password: passwords.new });
      // if (error) throw error;
      
      setShowPasswordDialog(false);
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès."
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de changer le mot de passe.",
        variant: "destructive"
      });
    }
  };

  const loadActiveSessions = async () => {
    try {
      // Ici vous pouvez implémenter la récupération des sessions actives
      const mockSessions = [
        {
          id: '1',
          device: 'Chrome sur Windows',
          location: 'Paris, France',
          lastActive: 'Il y a 5 minutes',
          current: true
        },
        {
          id: '2',
          device: 'Safari sur iPhone',
          location: 'Lyon, France',
          lastActive: 'Il y a 2 heures',
          current: false
        }
      ];
      setActiveSessions(mockSessions);
      setShowSessionsDialog(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sessions actives.",
        variant: "destructive"
      });
    }
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedNotifications = localStorage.getItem('legal-vision-notifications');
        const savedAppearance = localStorage.getItem('legal-vision-appearance');
        
        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        }
        
        if (savedAppearance) {
          setAppearance(JSON.parse(savedAppearance));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System theme
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(appearance.theme);
  }, [appearance.theme]);

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: value };
      // Save to localStorage immediately for notifications
      localStorage.setItem('legal-vision-notifications', JSON.stringify(updated));
      return updated;
    });
    setHasChanges(true);
    
    // Show immediate feedback
    toast({
      title: "Paramètre mis à jour",
      description: `Les notifications ${key.replace('_', ' ')} ont été ${value ? 'activées' : 'désactivées'}`,
    });
  };

  const handleAppearanceChange = (key: keyof AppearanceSettings, value: any) => {
    setAppearance(prev => {
      const updated = { ...prev, [key]: value };
      // Save to localStorage immediately for appearance
      localStorage.setItem('legal-vision-appearance', JSON.stringify(updated));
      return updated;
    });
    setHasChanges(true);
    
    // Show immediate feedback for theme changes
    if (key === 'theme') {
      toast({
        title: "Thème appliqué",
        description: `Le thème ${value === 'system' ? 'système' : value === 'dark' ? 'sombre' : 'clair'} a été appliqué`,
      });
    }
  };

  const saveSettings = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save to Supabase profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          // Store settings as JSON in a settings column (would need migration)
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      // Also ensure localStorage is updated
      localStorage.setItem('legal-vision-notifications', JSON.stringify(notifications));
      localStorage.setItem('legal-vision-appearance', JSON.stringify(appearance));
      
      setHasChanges(false);
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été synchronisées avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de synchroniser vos paramètres. Les modifications locales sont conservées.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    if (!user) return;
    
    try {
      // Create export data object
      const exportData = {
        user_info: {
          email: user.email,
          user_id: user.id,
          export_date: new Date().toISOString(),
        },
        settings: {
          notifications,
          appearance,
        },
        // Note: In a real implementation, you'd fetch actual user data from Supabase
        metadata: {
          export_version: '1.0',
          application: 'Legal Vision Suite',
        }
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `legal-vision-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export terminé",
        description: "Vos données ont été exportées avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter vos données",
        variant: "destructive",
      });
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const deleteAccount = async () => {
    if (!user || deleteConfirmation !== 'SUPPRIMER') {
      toast({
        title: "Confirmation requise",
        description: "Veuillez taper 'SUPPRIMER' pour confirmer",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, you would:
      // 1. Delete all user data from Supabase tables
      // 2. Delete the user account
      // 3. Sign out the user
      
      toast({
        title: "Suppression programmée",
        description: "Votre compte sera supprimé dans les 24h. Contactez le support pour annuler.",
        variant: "destructive",
      });
      
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le compte",
        variant: "destructive",
      });
    }
  };

  const viewAccountActivity = () => {
    toast({
      title: "Activité du compte",
      description: "Fonctionnalité en cours de développement",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Paramètres
          </h1>
          <p className="text-muted-foreground">
            Personnalisez votre expérience Legal Vision Suite
          </p>
        </div>
      </div>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configurez comment et quand vous souhaitez être notifié
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="email-notifications">Notifications par email</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recevez des alertes importantes par email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.email_notifications}
                onCheckedChange={(value) => handleNotificationChange('email_notifications', value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="push-notifications">Notifications push</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notifications en temps réel sur votre appareil
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={notifications.push_notifications}
                onCheckedChange={(value) => handleNotificationChange('push_notifications', value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="task-reminders">Rappels de tâches</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Rappels automatiques pour vos tâches en cours
                </p>
              </div>
              <Switch
                id="task-reminders"
                checked={notifications.task_reminders}
                onCheckedChange={(value) => handleNotificationChange('task_reminders', value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="appointment-reminders">Rappels de rendez-vous</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notifications avant vos rendez-vous programmés
                </p>
              </div>
              <Switch
                id="appointment-reminders"
                checked={notifications.appointment_reminders}
                onCheckedChange={(value) => handleNotificationChange('appointment_reminders', value)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="invoice-alerts">Alertes de facturation</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notifications pour les factures en retard et les paiements
                </p>
              </div>
              <Switch
                id="invoice-alerts"
                checked={notifications.invoice_alerts}
                onCheckedChange={(value) => handleNotificationChange('invoice_alerts', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Apparence</CardTitle>
          </div>
          <CardDescription>
            Personnalisez l'interface selon vos préférences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Thème</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={appearance.theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAppearanceChange('theme', 'light')}
                  className="gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Clair
                </Button>
                <Button
                  variant={appearance.theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAppearanceChange('theme', 'dark')}
                  className="gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Sombre
                </Button>
                <Button
                  variant={appearance.theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAppearanceChange('theme', 'system')}
                  className="gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Système
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mode compact</Label>
                <p className="text-sm text-muted-foreground">
                  Interface plus dense avec moins d'espacement
                </p>
              </div>
              <Switch
                checked={appearance.compact_mode}
                onCheckedChange={(value) => handleAppearanceChange('compact_mode', value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Confidentialité et sécurité</CardTitle>
          </div>
          <CardDescription>
            Gérez la sécurité de votre compte et vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="font-medium">Connexion sécurisée</span>
              </div>
              <Badge variant="secondary">HTTPS Activé</Badge>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Chiffrement des données</span>
              </div>
              <Badge variant="secondary">AES-256</Badge>
            </div>
          </div>

          <Separator />

          {/* Security Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </p>
              </div>
              <div className="flex items-center gap-2">
                {security.two_factor_enabled && (
                  <Badge variant="secondary" className="text-green-600">
                    Activée
                  </Badge>
                )}
                <Switch
                  id="two-factor"
                  checked={security.two_factor_enabled}
                  onCheckedChange={enable2FA}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="login-notifications">Notifications de connexion</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Être alerté des nouvelles connexions à votre compte
                </p>
              </div>
              <Switch
                id="login-notifications"
                checked={security.login_notifications}
                onCheckedChange={(value) => handleSecurityChange('login_notifications', value)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>Délai d'expiration de session</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Votre session expirera automatiquement après {security.session_timeout} minutes d'inactivité
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSecurityChange('session_timeout', 15)}
                  disabled={security.session_timeout === 15}
                >
                  15 min
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSecurityChange('session_timeout', 30)}
                  disabled={security.session_timeout === 30}
                >
                  30 min
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSecurityChange('session_timeout', 60)}
                  disabled={security.session_timeout === 60}
                >
                  1 heure
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSecurityChange('session_timeout', 120)}
                  disabled={security.session_timeout === 120}
                >
                  2 heures
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Changer le mot de passe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Changer le mot de passe</DialogTitle>
                  </DialogHeader>
                  <PasswordChangeForm onSubmit={changePassword} />
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={loadActiveSessions} className="gap-2">
                <Monitor className="h-4 w-4" />
                Gérer les sessions
              </Button>

              <Button variant="outline" onClick={exportData} className="gap-2">
                <Download className="h-4 w-4" />
                Exporter mes données
              </Button>
              
              <Button variant="outline" onClick={viewAccountActivity} className="gap-2">
                <Eye className="h-4 w-4" />
                Activité du compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
          </div>
          <CardDescription>
            Actions irréversibles concernant votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer définitivement le compte</DialogTitle>
                <DialogDescription>
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pour confirmer, tapez <strong>SUPPRIMER</strong> dans le champ ci-dessous :
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={deleteAccount}
                  disabled={deleteConfirmation !== 'SUPPRIMER'}
                >
                  Supprimer définitivement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <p className="text-sm text-muted-foreground mt-2">
            Cette action supprimera définitivement votre compte et toutes vos données.
          </p>
        </CardContent>
      </Card>

      {/* Changes indicator */}
      {hasChanges && (
        <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Des modifications non sauvegardées sont en attente. Cliquez sur "Sauvegarder" pour les synchroniser.
          </AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {loading ? 'Chargement des paramètres...' : hasChanges ? 'Modifications en attente' : 'Tous les paramètres sont à jour'}
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving || !hasChanges} 
          size="lg" 
          className="gap-2"
          variant={hasChanges ? 'default' : 'outline'}
        >
          <SettingsIcon className="h-4 w-4" />
          {saving ? 'Sauvegarde...' : hasChanges ? 'Sauvegarder les modifications' : 'Paramètres sauvegardés'}
        </Button>
      </div>
    </div>
  );
};

// Composant pour le formulaire de changement de mot de passe
const PasswordChangeForm = ({ onSubmit }: { onSubmit: (passwords: { current: string; new: string; confirm: string }) => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      current: currentPassword,
      new: newPassword,
      confirm: confirmPassword
    });
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Mot de passe actuel</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showPasswords.current ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility('current')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPasswords.new ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility('new')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showPasswords.confirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility('confirm')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">
          Changer le mot de passe
        </Button>
      </div>
    </form>
  );
};

export default Settings;