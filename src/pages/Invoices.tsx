import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Receipt, Search, Euro, Calendar, Eye, Edit, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InvoiceDialog, { InvoiceFormData } from '@/components/invoices/InvoiceDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_method?: string;
  payment_date?: string;
  notes?: string;
  client_id: string;
  legal_case_id?: string;
  clients?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    client_type: string;
  } | null;
  legal_cases?: {
    title: string;
    case_number: string;
  } | null;
}

const Invoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  useEffect(() => {
    const filtered = invoices.filter(invoice => {
      const searchLower = searchTerm.toLowerCase();
      const clientName = getClientName(invoice.clients).toLowerCase();
      const invoiceNumber = invoice.invoice_number.toLowerCase();
      
      return clientName.includes(searchLower) || 
             invoiceNumber.includes(searchLower);
    });
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            company_name,
            client_type
          ),
          legal_cases (
            title,
            case_number
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (client?: Invoice['clients'] | null) => {
    if (!client) return 'Client';
    if (client.client_type === 'Entreprise') {
      return client.company_name || 'Entreprise';
    }
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Brouillon': return 'outline';
      case 'Envoyée': return 'default';
      case 'Payée': return 'default';
      case 'En retard': return 'destructive';
      case 'Annulée': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Payée': return 'text-success';
      case 'En retard': return 'text-destructive';
      case 'Annulée': return 'text-destructive';
      default: return '';
    }
  };

  const isOverdue = (dueDate?: string | null, status?: string) => {
    if (!dueDate) return false;
    if (status === 'Payée' || status === 'Annulée') return false;
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return false;
    return due < new Date();
  };

  const formatCurrency = (amount?: number | null) => {
    const safeAmount = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0;
    return safeAmount.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR');
  };

  const handleUpdateInvoice = async (invoiceId: string, updates: Partial<InvoiceFormData>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({
        title: 'Facture mise à jour',
        description: 'Le statut de la facture a été mis à jour',
      });
      fetchInvoices();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facture:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour la facture",
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({
        title: 'Facture supprimée',
        description: 'La facture a été supprimée avec succès',
      });
      fetchInvoices();
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la facture',
        variant: 'destructive',
      });
    }
  };

  // Calculs pour les statistiques
  const totalRevenue = invoices
    .filter(inv => inv.status === 'Payée')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'Envoyée')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const overdueAmount = invoices
    .filter(inv => isOverdue(inv.due_date, inv.status))
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Chargement des factures...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Facturation</h1>
            <p className="text-muted-foreground">Gérez vos factures et paiements</p>
          </div>
          <InvoiceDialog
            onSuccess={fetchInvoices}
            trigger={(
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Facture
              </Button>
            )}
          />
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus encaissés</CardTitle>
              <Euro className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {invoices.filter(inv => inv.status === 'Payée').length} factures payées
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {invoices.filter(inv => inv.status === 'Envoyée').length} factures envoyées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En retard</CardTitle>
              <Receipt className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(overdueAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {invoices.filter(inv => isOverdue(inv.due_date, inv.status)).length} factures en retard
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total factures</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
              <p className="text-xs text-muted-foreground">Toutes les factures</p>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Aucune facture trouvée' : 'Aucune facture'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Essayez de modifier votre recherche'
                  : 'Commencez par créer votre première facture'
                }
              </p>
              {!searchTerm && (
                <InvoiceDialog
                  onSuccess={fetchInvoices}
                  trigger={(
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une facture
                    </Button>
                  )}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => {
              const overdue = isOverdue(invoice.due_date, invoice.status);
              return (
                <Card key={invoice.id} className={`hover:shadow-lg transition-shadow ${overdue ? 'border-destructive' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Facture {invoice.invoice_number}</CardTitle>
                        <CardDescription>{getClientName(invoice.clients)}</CardDescription>
                      </div>
                      <Badge variant={getStatusBadgeVariant(invoice.status)} className={getStatusColor(invoice.status)}>
                        {overdue && invoice.status === 'Envoyée' ? 'En retard' : invoice.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Montant total:</span>
                        <span className="font-semibold">{formatCurrency(invoice.total_amount)}</span>
                      </div>

                      {invoice.status === 'Payée' && invoice.paid_amount > 0 && (
                        <div className="flex justify-between items-center text-success">
                          <span className="text-sm">Payé:</span>
                          <span className="font-semibold">{formatCurrency(invoice.paid_amount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Date d'émission:</span>
                        <span className="text-sm">{formatDate(invoice.issue_date)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Date d'échéance:</span>
                        <span className={`text-sm ${overdue ? 'text-destructive font-medium' : ''}`}>
                          {formatDate(invoice.due_date)}
                        </span>
                      </div>

                      {invoice.legal_cases && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Dossier: {invoice.legal_cases.title}
                          </p>
                        </div>
                      )}

                      {invoice.payment_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Payée le:</span>
                          <span className="text-sm">{formatDate(invoice.payment_date)}</span>
                        </div>
                      )}

                      {invoice.payment_method && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Mode de paiement:</span>
                          <span className="text-sm">{invoice.payment_method}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <InvoiceDialog
                          invoice={invoice}
                          mode="view"
                          onSuccess={fetchInvoices}
                          trigger={(
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        />
                        <InvoiceDialog
                          invoice={invoice}
                          onSuccess={fetchInvoices}
                          trigger={(
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        />
                        {invoice.status === 'Brouillon' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateInvoice(invoice.id, { status: 'Envoyée' })}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la facture</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera définitivement la facture {invoice.invoice_number}. Voulez-vous continuer ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;