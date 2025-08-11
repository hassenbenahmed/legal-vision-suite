import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Plus, FileText, Eye, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface LegalCase {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  case_type: string;
  status: string;
  priority: string;
  start_date: string;
  end_date?: string;
  opposing_party?: string;
  court_name?: string;
  estimated_value?: number;
  client_id?: string;
  clients?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    client_type: string;
  };
}

const Cases = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // SEO
  useEffect(() => {
    document.title = "Dossiers | CRM juridique";
  }, []);

  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalCount, setTotalCount] = useState(0);
  const [openNew, setOpenNew] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCases();
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
    setLoading(true);
    try {
      let query = supabase
        .from('legal_cases')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            company_name,
            client_type
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(
          `title.ilike.${term},case_number.ilike.${term},case_type.ilike.${term}`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setCases(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les dossiers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Supprimer ce dossier ? Cette action est irréversible.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('legal_cases').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Dossier supprimé', description: 'Le dossier a été supprimé avec succès.' });
      if (cases.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchCases();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error);
      toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' });
    }
  };

  const newCaseSchema = z.object({
    title: z.string().min(1, 'Titre requis'),
    case_number: z.string().min(1, 'Numéro de dossier requis'),
    case_type: z.string().min(1, 'Type de dossier requis'),
    status: z.enum(['Ouvert', 'En cours', 'Fermé', 'Suspendu']),
    priority: z.enum(['Urgente', 'Haute', 'Normale', 'Basse']),
    client_id: z.string().optional(),
    description: z.string().optional(),
  });

  type NewCaseForm = z.infer<typeof newCaseSchema>;

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm<NewCaseForm>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: { status: 'Ouvert', priority: 'Normale' },
  });

  const onSubmit = async (values: NewCaseForm) => {
    try {
      const payload = { 
        ...values, 
        user_id: user?.id,
        start_date: new Date().toISOString().split('T')[0]
      };
      const { error } = await supabase.from('legal_cases').insert(payload);
      if (error) throw error;
      toast({ title: 'Dossier créé', description: 'Nouveau dossier ajouté avec succès.' });
      setOpenNew(false);
      reset();
      setPage(1);
      fetchCases();
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      toast({ title: 'Erreur', description: 'Création impossible', variant: 'destructive' });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Ouvert': return 'default';
      case 'En cours': return 'secondary';
      case 'Fermé': return 'outline';
      case 'Suspendu': return 'destructive';
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

  const getClientName = (clientData: any) => {
    if (!clientData) return 'Client non assigné';
    if (clientData.client_type === 'Entreprise') {
      return clientData.company_name;
    }
    return `${clientData.first_name} ${clientData.last_name}`;
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Chargement des dossiers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Dossiers</h1>
            <p className="text-muted-foreground">Gérez vos dossiers juridiques</p>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nouveau Dossier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre du dossier</Label>
                  <Input {...register('title')} placeholder="Titre du dossier" />
                </div>
                <div>
                  <Label htmlFor="case_number">Numéro de dossier</Label>
                  <Input {...register('case_number')} placeholder="ex: DOS-2024-001" />
                </div>
                <div>
                  <Label htmlFor="case_type">Type de dossier</Label>
                  <Input {...register('case_type')} placeholder="ex: Civil, Pénal, Commercial..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ouvert">Ouvert</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Fermé">Fermé</SelectItem>
                        <SelectItem value="Suspendu">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={watch('priority')} onValueChange={(value) => setValue('priority', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                        <SelectItem value="Haute">Haute</SelectItem>
                        <SelectItem value="Normale">Normale</SelectItem>
                        <SelectItem value="Basse">Basse</SelectItem>
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
                  <Label htmlFor="description">Description</Label>
                  <Input {...register('description')} placeholder="Description du dossier" />
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
              placeholder="Rechercher un dossier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {cases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Aucun dossier trouvé' : 'Aucun dossier'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Essayez de modifier votre recherche'
                  : 'Commencez par créer votre premier dossier juridique'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setOpenNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un dossier
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((legalCase) => (
              <Card key={legalCase.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{legalCase.title}</CardTitle>
                      <CardDescription>
                        Dossier #{legalCase.case_number}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={getStatusBadgeVariant(legalCase.status)}>
                        {legalCase.status}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(legalCase.priority)} className="text-xs">
                        {legalCase.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Type:</p>
                      <p className="text-sm text-muted-foreground">{legalCase.case_type}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-foreground">Client:</p>
                      <p className="text-sm text-muted-foreground">
                        {getClientName(legalCase.clients)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">Date de début:</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(legalCase.start_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    {legalCase.description && (
                      <div>
                        <p className="text-sm font-medium text-foreground">Description:</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {legalCase.description}
                        </p>
                      </div>
                    )}
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
                      onClick={() => handleDelete(legalCase.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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

export default Cases;