import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Users, Search, Mail, Phone, Building, User, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface Client {
  id: string;
  client_type: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  registration_number?: string;
  notes?: string;
  created_at: string;
}

const Clients = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // SEO
  useEffect(() => {
    document.title = "Clients | CRM juridique";
  }, []);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalCount, setTotalCount] = useState(0); // filtered count for pagination
  const [totalAllCount, setTotalAllCount] = useState(0); // overall count for stats
  const [countIndividuals, setCountIndividuals] = useState(0);
  const [countCompanies, setCountCompanies] = useState(0);
  const [openNew, setOpenNew] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, page, pageSize, searchTerm]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(
          `first_name.ilike.${term},last_name.ilike.${term},company_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setClients(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const [totalRes, indivRes, compRes] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('client_type', 'Particulier'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('client_type', 'Entreprise'),
      ]);
      setTotalAllCount(totalRes.count || 0);
      setCountIndividuals(indivRes.count || 0);
      setCountCompanies(compRes.count || 0);
    } catch (error) {
      console.error('Erreur lors du comptage des clients:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Supprimer ce client ? Cette action est irréversible.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Client supprimé', description: 'Le client a été supprimé avec succès.' });
      if (clients.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchClients();
      }
      fetchCounts();
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' });
    }
  };

  const newClientSchema = z.object({
    client_type: z.enum(['Particulier', 'Entreprise']),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company_name: z.string().optional(),
    email: z.union([z.string().email(), z.literal('')]).optional(),
    phone: z.string().optional(),
  });

  type NewClientForm = z.infer<typeof newClientSchema>;

  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
    defaultValues: { client_type: 'Particulier', first_name: '', last_name: '', company_name: '', email: '', phone: '' },
  });

  const onSubmit = async (values: NewClientForm) => {
    try {
      const payload: any = { ...values, user_id: user?.id };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '' || payload[k] === undefined) delete payload[k];
      });
      const { error } = await supabase.from('clients').insert([payload]);
      if (error) throw error;
      toast({ title: 'Client créé', description: 'Nouveau client ajouté avec succès.' });
      setOpenNew(false);
      reset();
      setPage(1);
      fetchClients();
      fetchCounts();
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      toast({ title: 'Erreur', description: 'Création impossible', variant: 'destructive' });
    }
  };

  const getClientName = (client: Client) => {
    if (client.client_type === 'Entreprise') {
      return client.company_name || 'Entreprise sans nom';
    }
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client sans nom';
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const getClientIcon = (clientType: string) => {
    return clientType === 'Entreprise' ? Building : User;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Chargement des clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Clients</h1>
            <p className="text-muted-foreground">Gérez votre portefeuille clients</p>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nouveau Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="client_type">Type de client</Label>
                  <Select value={watch('client_type')} onValueChange={(value) => setValue('client_type', value as 'Particulier' | 'Entreprise')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Particulier">Particulier</SelectItem>
                      <SelectItem value="Entreprise">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {watch('client_type') === 'Particulier' ? (
                  <>
                    <div>
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input {...register('first_name')} placeholder="Prénom" />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Nom</Label>
                      <Input {...register('last_name')} placeholder="Nom" />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="company_name">Nom de l'entreprise</Label>
                    <Input {...register('company_name')} placeholder="Nom de l'entreprise" />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input {...register('email')} type="email" placeholder="email@exemple.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input {...register('phone')} placeholder="Téléphone" />
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

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAllCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Particuliers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {countIndividuals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {countCompanies}
              </div>
            </CardContent>
          </Card>
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Aucun client trouvé' : 'Aucun client'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Essayez de modifier votre recherche'
                  : 'Commencez par ajouter votre premier client'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setOpenNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const ClientIcon = getClientIcon(client.client_type);
              return (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <ClientIcon className="h-6 w-6 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{getClientName(client)}</CardTitle>
                          <Badge variant="outline">
                            {client.client_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{client.email}</span>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{client.phone}</span>
                        </div>
                      )}

                      {client.address && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {client.address}
                            {client.city && `, ${client.city}`}
                            {client.postal_code && ` ${client.postal_code}`}
                          </p>
                        </div>
                      )}

                      {client.registration_number && (
                        <div>
                          <p className="text-sm font-medium text-foreground">SIRET:</p>
                          <p className="text-sm text-muted-foreground">{client.registration_number}</p>
                        </div>
                      )}

                      {client.notes && (
                        <div>
                          <p className="text-sm font-medium text-foreground">Notes:</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{client.notes}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-muted-foreground">
                          Client depuis le {new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => handleDelete(client.id)}
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
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={pageNum === page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
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

export default Clients;