import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, DollarSign, Users, CheckCircle } from "lucide-react";

const Dashboard = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Tableau de Bord
            <span className="text-primary block">Intelligent & Visuel</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Visualisez en temps réel les performances de votre cabinet avec des KPIs 
            personnalisés et des rapports automatisés.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <Card className="col-span-1 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Revenus Mensuels</CardTitle>
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">€127,350</div>
                <div className="flex items-center text-sm text-accent">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12.5% vs mois précédent
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1 border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Dossiers Actifs</CardTitle>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 text-foreground">89</div>
                <div className="text-sm text-muted-foreground">23 nouveaux ce mois</div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1 border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Clients Satisfaits</CardTitle>
                  <Users className="h-5 w-5 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 text-foreground">97%</div>
                <div className="text-sm text-muted-foreground">Score de satisfaction</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Progression des Affaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Dossiers en cours</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Affaires clôturées</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Nouveaux prospects</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Nouveau dossier créé</div>
                      <div className="text-xs text-muted-foreground">Affaire Martin vs. Dupont - Il y a 2h</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Facture générée</div>
                      <div className="text-xs text-muted-foreground">Client ABC - €2,850 - Il y a 4h</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Paiement reçu</div>
                      <div className="text-xs text-muted-foreground">Dossier #2024-001 - Il y a 6h</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;