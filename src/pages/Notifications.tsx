import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Users, 
  Receipt,
  X,
  Filter
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'task' | 'appointment' | 'invoice' | 'system' | 'client';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = () => {
    try {
      setLoading(true);
      
      // Load from localStorage
      const storedNotifications = localStorage.getItem(`notifications_${user?.id}`);
      
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(parsed);
      } else {
        // Create initial notifications if none exist
        createInitialNotifications();
      }
    } catch (error) {
      console.log('Error loading notifications:', error);
      createMockNotifications();
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = (notifications: Notification[]) => {
    try {
      localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(notifications));
    } catch (error) {
      console.log('Error saving notifications:', error);
    }
  };

  const createInitialNotifications = () => {
    const initialNotifications: Notification[] = [
      {
        id: '1',
        title: 'Bienvenue dans Legal Vision Suite',
        message: 'Votre compte a été configuré avec succès. Explorez toutes les fonctionnalités disponibles.',
        type: 'system',
        priority: 'medium',
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '/dashboard'
      },
      {
        id: '2',
        title: 'Configuration recommandée',
        message: 'Nous vous recommandons de configurer vos préférences dans les paramètres.',
        type: 'system',
        priority: 'low',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        read: false,
        actionUrl: '/settings'
      },
      {
        id: '3',
        title: 'Nouvelle tâche disponible',
        message: 'Une nouvelle tâche vous attend dans votre tableau de bord.',
        type: 'task',
        priority: 'medium',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        read: false,
        actionUrl: '/tasks'
      }
    ];

    setNotifications(initialNotifications);
    saveNotifications(initialNotifications);
  };

  const createMockNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'task',
        title: 'Tâche en retard',
        message: 'La tâche "Préparation dossier Martin" était due hier',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/tasks'
      },
      {
        id: '2',
        type: 'appointment',
        title: 'Rendez-vous dans 1 heure',
        message: 'RDV avec Mme Dupont à 14h00 - Consultation divorce',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/appointments'
      },
      {
        id: '3',
        type: 'invoice',
        title: 'Facture payée',
        message: 'La facture #FACT-2025-001 a été payée par le client SAS TechCorp',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        priority: 'low',
        actionUrl: '/invoices'
      },
      {
        id: '4',
        type: 'client',
        title: 'Nouveau client',
        message: 'Un nouveau client "Cabinet Conseil ABC" a été ajouté à votre base',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/clients'
      },
      {
        id: '5',
        type: 'system',
        title: 'Mise à jour système',
        message: 'Legal Vision Suite a été mis à jour vers la version 2.1.0',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        read: true,
        priority: 'low'
      }
    ];

    setNotifications(mockNotifications);
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `h-5 w-5 ${
      priority === 'high' ? 'text-red-500' :
      priority === 'medium' ? 'text-orange-500' :
      'text-blue-500'
    }`;

    switch (type) {
      case 'task':
        return <CheckCircle className={iconClass} />;
      case 'appointment':
        return <Calendar className={iconClass} />;
      case 'invoice':
        return <Receipt className={iconClass} />;
      case 'client':
        return <Users className={iconClass} />;
      case 'system':
        return <Bell className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
      case 'low':
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
      default:
        return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMilliseconds = now.getTime() - notificationTime.getTime();
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
    
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);

    toast({
      title: "Notifications marquées comme lues",
      description: "Toutes vos notifications ont été marquées comme lues",
    });
  };

  const deleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
    
    toast({
      title: "Notification supprimée",
      description: "La notification a été supprimée avec succès",
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Toutes vos notifications sont lues'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Toutes ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Non lues ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Lues ({notifications.length - unreadCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucune notification
              </h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? 'Toutes vos notifications ont été lues'
                  : 'Vous n\'avez aucune notification pour le moment'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`${getPriorityColor(notification.priority)} border-l-4 ${
                !notification.read ? 'ring-1 ring-primary/20' : ''
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(notification.timestamp)}
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="gap-1 text-xs"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Marquer comme lu
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="gap-1 text-xs text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {notification.actionUrl && (
                      <div className="mt-3">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <a href={notification.actionUrl}>
                            <FileText className="h-3 w-3" />
                            Voir les détails
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;