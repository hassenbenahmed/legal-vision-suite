import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scale, FileText, Users, Calculator, Shield, BarChart3 } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent/20 text-primary-foreground">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
      
      <div className="relative container mx-auto px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-accent">
              <Scale className="h-8 w-8" />
              <span className="font-semibold text-lg">LegalVision Suite</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              La Solution de Gestion
              <span className="text-accent block">Juridique Moderne</span>
            </h1>
            
            <p className="text-xl text-primary-foreground/90 leading-relaxed max-w-2xl">
              Optimisez votre cabinet avec notre plateforme tout-en-un : gestion des dossiers, 
              CRM intelligent, facturation automatisée et tableaux de bord avancés.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                Démarrer l'essai gratuit
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Voir la démo
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 text-sm text-primary-foreground/80">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>Conforme RGPD</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-accent" />
                <span>Sécurisé</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-accent" />
                <span>Support 24/7</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Card className="p-6 bg-card/10 backdrop-blur-sm border-primary-foreground/20 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-primary-foreground">Tableau de Bord</h3>
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary-foreground/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-accent">157</div>
                    <div className="text-sm text-primary-foreground/80">Dossiers actifs</div>
                  </div>
                  <div className="bg-primary-foreground/10 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-accent">€89,450</div>
                    <div className="text-sm text-primary-foreground/80">Revenus ce mois</div>
                  </div>
                </div>
                <div className="h-32 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground/60">Graphique interactif</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;