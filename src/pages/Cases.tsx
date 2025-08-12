import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [user]);

  const fetchCases = async () => {
    try {
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
        .order('created_at', { ascending: false });

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

    if (!title || !case_number || !case_type) {
      toast({ title: 'Champs requis', description: 'Titre, numéro et type sont requis', variant: 'destructive' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const payload = {
      user_id: user.id,
      title,
      case_number,
      case_type,
      status: 'Ouvert' as const,
      priority: 'Normale' as const,
      start_date: today,
      description: description || undefined,
      client_id: client_id_raw ? client_id_raw : undefined,
    };

    const { error } = await supabase.from('legal_cases').insert(payload as any);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Succès', description: 'Dossier créé avec succès' });
    setOpen(false);
    form.reset();
    await fetchCases();
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Dossier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau dossier</DialogTitle>
                <DialogDescription>Créez un nouveau dossier juridique.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCase} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div>
                    <Label htmlFor="case_number">Numéro de dossier</Label>
                    <Input id="case_number" name="case_number" required />
                  </div>
                  <div>
                    <Label htmlFor="case_type">Type de dossier</Label>
                    <Input id="case_type" name="case_type" required />
                  </div>
                  <div>
                    <Label htmlFor="client_id">Client ID (optionnel)</Label>
                    <Input id="client_id" name="client_id" />
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

        {cases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun dossier</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier dossier juridique
              </p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un dossier
              </Button>
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

                    {legalCase.opposing_party && (
                      <div>
                        <p className="text-sm font-medium text-foreground">Partie adverse:</p>
                        <p className="text-sm text-muted-foreground">{legalCase.opposing_party}</p>
                      </div>
                    )}

                    {legalCase.estimated_value && (
                      <div>
                        <p className="text-sm font-medium text-foreground">Valeur estimée:</p>
                        <p className="text-sm text-muted-foreground">
                          {legalCase.estimated_value.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                          })}
                        </p>
                      </div>
                    )}

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
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cases;