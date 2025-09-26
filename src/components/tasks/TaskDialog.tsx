import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Task {
  id?: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  due_date?: string;
  legal_case_id?: string;
}

interface LegalCase {
  id: string;
  title: string;
  case_number: string;
}

interface TaskDialogProps {
  task?: Task;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const TaskDialog: React.FC<TaskDialogProps> = ({ task, onSuccess, trigger }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  
  const [formData, setFormData] = useState<Task>({
    title: '',
    description: '',
    task_type: 'Général',
    status: 'À faire',
    priority: 'Normale',
    due_date: '',
    legal_case_id: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
      });
    }
  }, [task]);

  useEffect(() => {
    if (open && user) {
      fetchLegalCases();
    }
  }, [open, user]);

  const fetchLegalCases = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select('id, title, case_number')
        .eq('user_id', user?.id)
        .order('title');
      
      if (error) throw error;
      setLegalCases(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const taskData = {
        ...formData,
        user_id: user.id,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        legal_case_id: formData.legal_case_id || null
      };

      let result;
      if (task?.id) {
        result = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id);
      } else {
        result = await supabase
          .from('tasks')
          .insert([taskData]);
      }

      if (result.error) throw result.error;

      toast({
        title: task?.id ? "Tâche modifiée" : "Tâche créée",
        description: task?.id ? "La tâche a été modifiée avec succès" : "La nouvelle tâche a été créée avec succès",
      });

      setOpen(false);
      setFormData({
        title: '',
        description: '',
        task_type: 'Général',
        status: 'À faire',
        priority: 'Normale',
        due_date: '',
        legal_case_id: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la tâche",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès",
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche",
        variant: "destructive",
      });
    }
  };

  const defaultTrigger = (
    <Button>
      {task?.id ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
      {task?.id ? 'Modifier' : 'Nouvelle Tâche'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task?.id ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}</DialogTitle>
          <DialogDescription>
            {task?.id ? 'Modifiez les détails de cette tâche' : 'Remplissez les informations pour créer une nouvelle tâche'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Titre de la tâche"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_type">Type de tâche</Label>
              <Select value={formData.task_type} onValueChange={(value) => setFormData({...formData, task_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Général">Général</SelectItem>
                  <SelectItem value="Recherche">Recherche</SelectItem>
                  <SelectItem value="Rédaction">Rédaction</SelectItem>
                  <SelectItem value="Plaidoirie">Plaidoirie</SelectItem>
                  <SelectItem value="Réunion">Réunion</SelectItem>
                  <SelectItem value="Appel téléphonique">Appel téléphonique</SelectItem>
                  <SelectItem value="Administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="À faire">À faire</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basse">Basse</SelectItem>
                  <SelectItem value="Normale">Normale</SelectItem>
                  <SelectItem value="Haute">Haute</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_case_id">Dossier juridique</Label>
              <Select value={formData.legal_case_id || 'none'} onValueChange={(value) => setFormData({...formData, legal_case_id: value === 'none' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un dossier (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun dossier</SelectItem>
                  {legalCases.map((legalCase) => (
                    <SelectItem key={legalCase.id} value={legalCase.id}>
                      {legalCase.title} (#{legalCase.case_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Description détaillée de la tâche"
              rows={3}
            />
          </div>

          <div className="flex justify-between gap-2">
            <div>
              {task?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer la tâche</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : (task?.id ? 'Modifier' : 'Créer')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;