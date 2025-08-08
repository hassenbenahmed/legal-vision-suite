import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckSquare, Clock, AlertTriangle, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  reminder_date?: string;
  legal_case_id?: string;
  legal_cases?: {
    title: string;
    case_number: string;
  };
}

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          legal_cases (
            title,
            case_number
          )
        `)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'À faire': return 'default';
      case 'En cours': return 'secondary';
      case 'Terminé': return 'outline';
      case 'Annulé': return 'destructive';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'destructive';
      case 'Haute': return 'secondary';
      case 'Normale': return 'default';
      case 'Basse': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Urgente': return AlertTriangle;
      case 'Haute': return AlertTriangle;
      default: return Clock;
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pas de date limite';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const markAsCompleted = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'Terminé',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      
      toast({
        title: "Tâche complétée",
        description: "La tâche a été marquée comme terminée",
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive",
      });
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const PriorityIcon = getPriorityIcon(task.priority);
    const overdue = isOverdue(task.due_date) && task.status !== 'Terminé';

    return (
      <Card className={`hover:shadow-lg transition-shadow ${overdue ? 'border-destructive' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{task.title}</CardTitle>
              {task.legal_cases && (
                <CardDescription>
                  Dossier: {task.legal_cases.title} (#{task.legal_cases.case_number})
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Badge variant={getStatusBadgeVariant(task.status)}>
                {task.status}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs">
                <PriorityIcon className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Type:</p>
              <p className="text-sm text-muted-foreground">{task.task_type}</p>
            </div>

            {task.description && (
              <div>
                <p className="text-sm font-medium text-foreground">Description:</p>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={`text-sm ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {formatDate(task.due_date)}
                {overdue && ' (En retard)'}
              </span>
            </div>

            {task.completed_at && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Terminé le {formatDate(task.completed_at)}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            {task.status !== 'Terminé' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAsCompleted(task.id)}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Marquer comme terminé
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Chargement des tâches...</div>
        </div>
      </div>
    );
  }

  const todoTasks = getTasksByStatus('À faire');
  const inProgressTasks = getTasksByStatus('En cours');
  const completedTasks = getTasksByStatus('Terminé');
  const overdueTasks = tasks.filter(task => 
    isOverdue(task.due_date) && task.status !== 'Terminé'
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Tâches</h1>
            <p className="text-muted-foreground">Suivez vos tâches et échéances</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Tâche
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">À faire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todoTasks.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminées</CardTitle>
              <CheckSquare className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En retard</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todo">À faire ({todoTasks.length})</TabsTrigger>
            <TabsTrigger value="progress">En cours ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Terminées ({completedTasks.length})</TabsTrigger>
            <TabsTrigger value="overdue">En retard ({overdueTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="mt-6">
            {todoTasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune tâche à faire</h3>
                  <p className="text-muted-foreground mb-4">
                    Toutes vos tâches sont terminées ou vous n'en avez pas encore créé
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            {inProgressTasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune tâche en cours</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune tâche terminée</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="mt-6">
            {overdueTasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckSquare className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune tâche en retard</h3>
                  <p className="text-muted-foreground">Excellent ! Vous êtes à jour sur toutes vos tâches</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overdueTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tasks;