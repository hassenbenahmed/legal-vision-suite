import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Users, Search, Mail, Phone, Building, User, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  useEffect(() => {
    const filtered = clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      const clientName = getClientName(client).toLowerCase();
      const email = client.email?.toLowerCase() || '';
      const phone = client.phone?.toLowerCase() || '';
      const company = client.company_name?.toLowerCase() || '';
      
      return clientName.includes(searchLower) || 
             email.includes(searchLower) || 
             phone.includes(searchLower) ||
             company.includes(searchLower);
    });
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
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
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (client: Client) => {
    if (client.client_type === 'Entreprise') {
      return client.company_name || 'Entreprise sans nom';
    }
    return `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client sans nom';
  };

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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Client
          </Button>
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
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Particuliers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => c.client_type === 'Particulier').length}
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
                {clients.filter(c => c.client_type === 'Entreprise').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {filteredClients.length === 0 ? (
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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
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
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default Clients;