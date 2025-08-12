import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Plus, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Appointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients(first_name, last_name, company_name, client_type),
          legal_cases(title, case_number)
        `)
        .eq('user_id', user.id)
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const [open, setOpen] = useState(false);

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get('title') || '').trim();
    const start = String(formData.get('start_datetime') || '');
    const end = String(formData.get('end_datetime') || '');
    const location = String(formData.get('location') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const client_id_raw = String(formData.get('client_id') || '').trim();
    const legal_case_id_raw = String(formData.get('legal_case_id') || '').trim();

    if (!title || !start || !end) {
      toast({
        title: 'Champs requis',
        description: 'Titre, début et fin sont requis',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      user_id: user.id,
      title,
      status: 'Programmé' as const,
      appointment_type: 'Consultation' as const,
      start_datetime: new Date(start).toISOString(),
      end_datetime: new Date(end).toISOString(),
      location: location || undefined,
      description: description || undefined,
      client_id: client_id_raw ? client_id_raw : undefined,
      legal_case_id: legal_case_id_raw ? legal_case_id_raw : undefined,
    };

    const { error } = await supabase.from('appointments').insert(payload as any);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Succès', description: 'Rendez-vous créé avec succès' });
    setOpen(false);
    form.reset();
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Programmé':
        return 'bg-blue-100 text-blue-800';
      case 'Confirmé':
        return 'bg-green-100 text-green-800';
      case 'Annulé':
        return 'bg-red-100 text-red-800';
      case 'Terminé':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (appointment: any) => {
    if (!appointment.clients) return 'Client non spécifié';
    
    const client = appointment.clients;
    if (client.client_type === 'Entreprise') {
      return client.company_name || 'Entreprise';
    } else {
      return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Particulier';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rendez-vous</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos rendez-vous et consultations clients
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau RDV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau rendez-vous</DialogTitle>
                <DialogDescription>Créez un nouveau rendez-vous.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div>
                    <Label htmlFor="location">Lieu</Label>
                    <Input id="location" name="location" />
                  </div>
                  <div>
                    <Label htmlFor="start_datetime">Début</Label>
                    <Input id="start_datetime" name="start_datetime" type="datetime-local" required />
                  </div>
                  <div>
                    <Label htmlFor="end_datetime">Fin</Label>
                    <Input id="end_datetime" name="end_datetime" type="datetime-local" required />
                  </div>
                  <div>
                    <Label htmlFor="client_id">Client ID (optionnel)</Label>
                    <Input id="client_id" name="client_id" />
                  </div>
                  <div>
                    <Label htmlFor="legal_case_id">Dossier ID (optionnel)</Label>
                    <Input id="legal_case_id" name="legal_case_id" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {!appointments || appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun rendez-vous programmé
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Commencez par créer votre premier rendez-vous client.
              </p>
              <Button className="flex items-center gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Créer un rendez-vous
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{appointment.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {getClientName(appointment)}
                        </span>
                        {appointment.legal_cases && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {appointment.legal_cases.case_number}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(appointment.start_datetime), 'dd/MM/yyyy')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {format(new Date(appointment.start_datetime), 'HH:mm')} - {format(new Date(appointment.end_datetime), 'HH:mm')}
                    </div>
                    {appointment.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {appointment.location}
                      </div>
                    )}
                  </div>
                  {appointment.description && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {appointment.description}
                    </p>
                  )}
                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm">{appointment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;