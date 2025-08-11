import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Calendar, Clock, MapPin, Plus, Users, FileText, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  status: string;
  appointment_type: string;
  client_id?: string;
  legal_case_id?: string;
  clients?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    client_type: string;
  };
  legal_cases?: {
    title: string;
    case_number: string;
  };
}

const Appointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // SEO
  useEffect(() => {
    document.title = "Rendez-vous | CRM juridique";
  }, []);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalCount, setTotalCount] = useState(0);
  const [openNew, setOpenNew] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchCases();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, page, pageSize, searchTerm]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company_name, client_type')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_cases')
        .select('id, title, case_number')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients(first_name, last_name, company_name, client_type),
          legal_cases(title, case_number)
        `, { count: 'exact' })
        .order('start_datetime', { ascending: true });

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(
          `title.ilike.${term},description.ilike.${term},location.ilike.${term}`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setAppointments(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Supprimer ce rendez-vous ? Cette action est irréversible.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Rendez-vous supprimé', description: 'Le rendez-vous a été supprimé avec succès.' });
      if (appointments.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du rendez-vous:', error);
      toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' });
    }
  };

  const newAppointmentSchema = z.object({
    title: z.string().min(1, 'Titre requis'),
    start_datetime: z.string().min(1, 'Date et heure de début requises'),
    end_datetime: z.string().min(1, 'Date et heure de fin requises'),
    appointment_type: z.string().min(1, 'Type de rendez-vous requis'),
    status: z.enum(['Programmé', 'Confirmé', 'Annulé', 'Terminé']),
    client_id: z.string().optional(),
    legal_case_id: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
  });

  type NewAppointmentForm = z.infer<typeof newAppointmentSchema>;

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<NewAppointmentForm>({
    resolver: zodResolver(newAppointmentSchema),
    defaultValues: { status: 'Programmé', appointment_type: 'Consultation' },
  });

  const onSubmit = async (values: NewAppointmentForm) => {
    try {
      const payload = { 
        ...values, 
        user_id: user?.id
      };
      const { error } = await supabase.from('appointments').insert(payload);
      if (error) throw error;
      toast({ title: 'Rendez-vous créé', description: 'Nouveau rendez-vous ajouté avec succès.' });
      setOpenNew(false);
      reset();
      setPage(1);
      fetchAppointments();
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      toast({ title: 'Erreur', description: 'Création impossible', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Programmé': return 'bg-blue-100 text-blue-800';
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      case 'Terminé': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (appointment: Appointment) => {
    if (!appointment.clients) return 'Client non spécifié';
    
    const client = appointment.clients;
    if (client.client_type === 'Entreprise') {
      return client.company_name || 'Entreprise';
    } else {
      return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Particulier';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (loading) {
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
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau RDV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouveau Rendez-vous</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input {...register('title')} placeholder="Titre du rendez-vous" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_datetime">Début</Label>
                    <Input {...register('start_datetime')} type="datetime-local" />
                  </div>
                  <div>
                    <Label htmlFor="end_datetime">Fin</Label>
                    <Input {...register('end_datetime')} type="datetime-local" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appointment_type">Type</Label>
                    <Input {...register('appointment_type')} placeholder="ex: Consultation, Audience..." />
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Programmé">Programmé</SelectItem>
                        <SelectItem value="Confirmé">Confirmé</SelectItem>
                        <SelectItem value="Annulé">Annulé</SelectItem>
                        <SelectItem value="Terminé">Terminé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="client_id">Client (optionnel)</Label>
                  <Select value={watch('client_id')} onValueChange={(value) => setValue('client_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client_type === 'Entreprise' ? client.company_name : `${client.first_name} ${client.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="legal_case_id">Dossier (optionnel)</Label>
                  <Select value={watch('legal_case_id')} onValueChange={(value) => setValue('legal_case_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un dossier" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.title} (#{caseItem.case_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input {...register('location')} placeholder="Lieu du rendez-vous" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input {...register('description')} placeholder="Description du rendez-vous" />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenNew(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Création...' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un rendez-vous..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {!appointments || appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Aucun rendez-vous trouvé' : 'Aucun rendez-vous programmé'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? 'Essayez de modifier votre recherche'
                  : 'Commencez par créer votre premier rendez-vous client.'
                }
              </p>
              {!searchTerm && (
                <Button className="flex items-center gap-2" onClick={() => setOpenNew(true)}>
                  <Plus className="h-4 w-4" />
                  Créer un rendez-vous
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const startTime = formatDateTime(appointment.start_datetime);
              const endTime = formatDateTime(appointment.end_datetime);
              
              return (
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
                        {startTime.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {startTime.time} - {endTime.time}
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
                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => page > 1 && setPage(page - 1)}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={pageNum === page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => page < totalPages && setPage(page + 1)}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;