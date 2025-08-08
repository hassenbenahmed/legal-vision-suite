import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, LogOut, User, FileText, Calendar, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt sur JurisCloud!",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Gérez vos dossiers, clients et activités juridiques
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dossiers Actifs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 ce mois</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">+5 ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RDV Aujourd'hui</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Prochain à 14h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus du Mois</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€12,450</div>
              <p className="text-xs text-muted-foreground">+8.2% vs mois dernier</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dossiers Récents</CardTitle>
              <CardDescription>Vos derniers dossiers mis à jour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Divorce Mme Martin", type: "Famille", status: "En cours" },
                  { name: "Contrat SAS TechCorp", type: "Commercial", status: "Révision" },
                  { name: "Litige Fournisseur ABC", type: "Commercial", status: "Nouveau" },
                ].map((dossier, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{dossier.name}</p>
                      <p className="text-sm text-muted-foreground">{dossier.type}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                      {dossier.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prochains Rendez-vous</CardTitle>
              <CardDescription>Votre planning des prochains jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { client: "M. Dubois", time: "14:00", type: "Consultation", date: "Aujourd'hui" },
                  { client: "Mme Leroy", time: "10:30", type: "Signature", date: "Demain" },
                  { client: "SAS Innovation", time: "16:00", type: "Négociation", date: "Vendredi" },
                ].map((rdv, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{rdv.client}</p>
                      <p className="text-sm text-muted-foreground">{rdv.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{rdv.time}</p>
                      <p className="text-xs text-muted-foreground">{rdv.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default Dashboard;