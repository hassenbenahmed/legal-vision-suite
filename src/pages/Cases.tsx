import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, Edit, Trash2, Search, Filter, Calendar, DollarSign, User, Building, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import CaseDocuments from '@/components/cases/CaseDocuments';

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
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // États pour les fonctionnalités avancées
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    urgent: 0
  });

  // Logique de filtrage et tri optimisée
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases.filter(caseItem => {
      const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           caseItem.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           caseItem.case_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
      const matchesType = typeFilter === 'all' || caseItem.case_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { 'Urgente': 4, 'Haute': 3, 'Normale': 2, 'Basse': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [cases, searchTerm, statusFilter, priorityFilter, typeFilter, sortBy, sortOrder]);

  // Calcul des statistiques
  useEffect(() => {
    const total = cases.length;
    const open = cases.filter(c => c.status === 'Ouvert').length;
    const inProgress = cases.filter(c => c.status === 'En cours').length;
    const closed = cases.filter(c => c.status === 'Fermé').length;
    const urgent = cases.filter(c => c.priority === 'Urgente').length;
    
    setStats({ total, open, inProgress, closed, urgent });
  }, [cases]);

  useEffect(() => {
    if (user) {
      fetchCases();
      fetchClients();
    }
  }, [user]);

  // Fonctions utilitaires pour l'affichage
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ouvert': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'En cours': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Fermé': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'Suspendu': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-100 text-red-800 border-red-200';
      case 'Haute': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Normale': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Basse': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Non défini';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des clients",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_cases')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            company_name,
            client_type
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCases(data || []);
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
  const [open, setOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const handleCreateCase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get('title') || '').trim();
    const case_number = String(formData.get('case_number') || '').trim();
    const case_type = String(formData.get('case_type') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const client_id_raw = String(formData.get('client_id') || '').trim();
    const priority = String(formData.get('priority') || 'Normale').trim();
    const opposing_party = String(formData.get('opposing_party') || '').trim();
    const court_name = String(formData.get('court_name') || '').trim();
    const estimated_value = formData.get('estimated_value') ? parseFloat(String(formData.get('estimated_value'))) : undefined;

    // Validation des champs requis
    if (!title || !case_number || !case_type) {
      toast({ title: 'Champs requis', description: 'Titre, numéro et type sont requis', variant: 'destructive' });
      return;
    }

    // Validation du numéro de dossier unique
    const { data: existingCase } = await supabase
      .from('legal_cases')
      .select('id')
      .eq('case_number', case_number)
      .single();

    if (existingCase) {
      toast({ title: 'Erreur de validation', description: 'Ce numéro de dossier existe déjà', variant: 'destructive' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const payload = {
      user_id: user.id,
      title,
      case_number,
      case_type,
      status: 'Ouvert' as const,
      priority,
      start_date: today,
      description: description || undefined,
      client_id: client_id_raw && client_id_raw !== 'none' ? client_id_raw : undefined,
      opposing_party: opposing_party || undefined,
      court_name: court_name || undefined,
      estimated_value: estimated_value || undefined,
    };

    try {
      const { error } = await supabase.from('legal_cases').insert(payload as any);

      if (error) {
        throw error;
      }

      toast({ title: 'Succès', description: 'Dossier créé avec succès' });
      setOpen(false);
      form.reset();
      await fetchCases();
    } catch (error: any) {
      console.error('Erreur lors de la création du dossier:', error);
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Impossible de créer le dossier', 
        variant: 'destructive' 
      });
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

  const getClientDisplayName = (legalCase: LegalCase) => {
    if (!legalCase.clients) return 'Client non assigné';
    if (legalCase.clients.client_type === 'Entreprise') {
      return legalCase.clients.company_name;
    }
    return `${legalCase.clients.first_name} ${legalCase.clients.last_name}`;
  };

  const handleEditCase = (caseData: LegalCase) => {
    // TODO: Implémenter la modification des dossiers
    toast({ 
      title: 'Fonctionnalité en développement', 
      description: 'La modification des dossiers sera bientôt disponible' 
    });
  };

  const handleDeleteCase = async (caseData: LegalCase) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${caseData.title}" ?
Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('legal_cases')
        .delete()
        .eq('id', caseData.id);

      if (error) throw error;

      toast({ title: 'Succès', description: 'Dossier supprimé avec succès' });
      await fetchCases();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de supprimer le dossier', 
        variant: 'destructive' 
      });
    }
  };

  const handleViewCase = (caseData: LegalCase) => {
    // TODO: Redirection vers une vue détaillée du dossier
    toast({ 
      title: 'Fonctionnalité en développement', 
      description: 'La vue détaillée sera bientôt disponible' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des dossiers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestion des Dossiers</h1>
              <p className="text-muted-foreground mt-1">Gérez vos affaires juridiques de manière efficace</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="mt-4 lg:mt-0">
                  <Plus className="h-5 w-5 mr-2" />
                  Nouveau Dossier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau dossier</DialogTitle>
                  <DialogDescription>Remplissez les informations pour créer un nouveau dossier juridique.</DialogDescription>
                </DialogHeader>
                {/* Formulaire de création (conservé du code précédent) */}
                <form onSubmit={handleCreateCase} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Informations de base</TabsTrigger>
                      <TabsTrigger value="details">Détails</TabsTrigger>
                      <TabsTrigger value="financial">Financier</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Titre *</Label>
                          <Input id="title" name="title" placeholder="Ex: Contrat de vente immobilière" required />
                        </div>
                        <div>
                          <Label htmlFor="case_number">Numéro de dossier *</Label>
                          <Input id="case_number" name="case_number" placeholder="Ex: DOS-2024-001" required />
                        </div>
                        <div>
                          <Label htmlFor="case_type">Type de dossier *</Label>
                          <Select name="case_type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Civil">Civil</SelectItem>
                              <SelectItem value="Pénal">Pénal</SelectItem>
                              <SelectItem value="Commercial">Commercial</SelectItem>
                              <SelectItem value="Travail">Droit du travail</SelectItem>
                              <SelectItem value="Immobilier">Immobilier</SelectItem>
                              <SelectItem value="Famille">Droit de la famille</SelectItem>
                              <SelectItem value="Fiscal">Fiscal</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="priority">Priorité</Label>
                          <Select name="priority" defaultValue="Normale">
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
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="client_id">Client</Label>
                          <Select name="client_id">
                            <SelectTrigger>
                              <SelectValue placeholder={loadingClients ? "Chargement..." : "Sélectionner un client (optionnel)"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucun client</SelectItem>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  <div className="flex items-center gap-2">
                                    {client.client_type === 'Entreprise' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    {client.client_type === 'Entreprise' 
                                      ? client.company_name 
                                      : `${client.first_name} ${client.last_name}`
                                    }
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="opposing_party">Partie adverse</Label>
                          <Input id="opposing_party" name="opposing_party" placeholder="Nom de la partie adverse" />
                        </div>
                        <div>
                          <Label htmlFor="court_name">Tribunal</Label>
                          <Input id="court_name" name="court_name" placeholder="Nom du tribunal" />
                        </div>
                        <div>
                          <Label htmlFor="status">Statut initial</Label>
                          <Select name="status" defaultValue="Ouvert">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ouvert">Ouvert</SelectItem>
                              <SelectItem value="En cours">En cours</SelectItem>
                              <SelectItem value="Suspendu">Suspendu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          name="description" 
                          placeholder="Description détaillée du dossier..."
                          rows={4}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="financial" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="estimated_value">Valeur estimée (€)</Label>
                          <Input 
                            id="estimated_value" 
                            name="estimated_value" 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="hourly_rate">Taux horaire (€)</Label>
                          <Input 
                            id="hourly_rate" 
                            name="hourly_rate" 
                            type="number" 
                            step="0.01" 
                            placeholder="150.00" 
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button type="submit">Créer le dossier</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ouverts</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En cours</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fermés</p>
                    <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Urgents</p>
                    <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Barre d'outils avec recherche et filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre, numéro ou type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filtres */}
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Ouvert">Ouvert</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Fermé">Fermé</SelectItem>
                    <SelectItem value="Suspendu">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Haute">Haute</SelectItem>
                    <SelectItem value="Normale">Normale</SelectItem>
                    <SelectItem value="Basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    <SelectItem value="Pénal">Pénal</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Travail">Travail</SelectItem>
                    <SelectItem value="Immobilier">Immobilier</SelectItem>
                    <SelectItem value="Famille">Famille</SelectItem>
                    <SelectItem value="Fiscal">Fiscal</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date</SelectItem>
                    <SelectItem value="title">Titre</SelectItem>
                    <SelectItem value="priority">Priorité</SelectItem>
                    <SelectItem value="status">Statut</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
              
              {/* Boutons de vue */}
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                  </div>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <div className="w-4 h-4 flex flex-col gap-0.5">
                    <div className="bg-current h-0.5 rounded"></div>
                    <div className="bg-current h-0.5 rounded"></div>
                    <div className="bg-current h-0.5 rounded"></div>
                    <div className="bg-current h-0.5 rounded"></div>
                  </div>
                </Button>
              </div>
            </div>
            
            {/* Résultats de la recherche */}
            {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all') && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>{filteredAndSortedCases.length} résultat(s) sur {cases.length} dossier(s)</span>
                {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setTypeFilter('all');
                    }}
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affichage des dossiers */}
        {filteredAndSortedCases.length === 0 && !loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {cases.length === 0 ? 'Aucun dossier' : 'Aucun résultat'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {cases.length === 0 
                  ? 'Commencez par créer votre premier dossier juridique' 
                  : 'Aucun dossier ne correspond à vos critères de recherche'
                }
              </p>
              {cases.length === 0 && (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un dossier
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredAndSortedCases.map((legalCase) => (
              <Card key={legalCase.id} className="hover:shadow-lg transition-all duration-200 group">
                {viewMode === 'grid' ? (
                  /* Mode grille */
                  <>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {legalCase.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Dossier #{legalCase.case_number}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {getStatusIcon(legalCase.status)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusBadgeVariant(legalCase.status)}>
                          {legalCase.status}
                        </Badge>
                        <Badge className={getPriorityColor(legalCase.priority)}>
                          {legalCase.priority}
                        </Badge>
                        <Badge variant="outline">{legalCase.case_type}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          {legalCase.clients?.client_type === 'Entreprise' ? 
                            <Building className="h-4 w-4 text-muted-foreground" /> : 
                            <User className="h-4 w-4 text-muted-foreground" />
                          }
                          <span className="font-medium">Client:</span>
                          <span className="text-muted-foreground truncate">
                            {getClientDisplayName(legalCase)}
                          </span>
                        </div>

                        {legalCase.opposing_party && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Partie adverse:</span>
                            <span className="text-muted-foreground truncate">
                              {legalCase.opposing_party}
                            </span>
                          </div>
                        )}

                        {legalCase.estimated_value && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Valeur:</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(legalCase.estimated_value)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Créé le:</span>
                          <span className="text-muted-foreground">
                            {new Date(legalCase.start_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      {legalCase.description && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {legalCase.description}
                          </p>
                        </div>
                      )}

                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedCase(legalCase)} 
                            title="Voir les documents"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewCase(legalCase)} 
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditCase(legalCase)} 
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive" 
                          onClick={() => handleDeleteCase(legalCase)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  /* Mode liste */
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                              {legalCase.title}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              #{legalCase.case_number}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {legalCase.clients?.client_type === 'Entreprise' ? <Building className="h-3 w-3" /> : <User className="h-3 w-3" />}
                              <span>{getClientDisplayName(legalCase)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(legalCase.start_date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {legalCase.estimated_value && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{formatCurrency(legalCase.estimated_value)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(legalCase.status)} className="shrink-0">
                            {legalCase.status}
                          </Badge>
                          <Badge className={`${getPriorityColor(legalCase.priority)} shrink-0`}>
                            {legalCase.priority}
                          </Badge>
                          <Badge variant="outline" className="shrink-0">
                            {legalCase.case_type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button variant="outline" size="sm" onClick={() => setSelectedCase(legalCase)} title="Documents">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewCase(legalCase)} title="Détails">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditCase(legalCase)} title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive" 
                          onClick={() => handleDeleteCase(legalCase)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedCase} onOpenChange={(o) => !o && setSelectedCase(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Documents — {selectedCase?.title}</DialogTitle>
            </DialogHeader>
            {selectedCase && (
              <CaseDocuments caseId={selectedCase.id} clientId={selectedCase.client_id} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Cases;