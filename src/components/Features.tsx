import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Calculator, BarChart3, Shield } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Gestion des Dossiers",
    description: "Suivi complet des affaires, automatisation des procédures et gestion intelligente des dates clés pour optimiser votre workflow juridique."
  },
  {
    icon: Users,
    title: "CRM Juridique Avancé",
    description: "Centralisation des clients, communication multicanal (email, SMS) et onboarding fluide pour renforcer vos relations clients."
  },
  {
    icon: Calculator,
    title: "Facturation Intelligente",
    description: "Génération automatique de factures, gestion des paiements et des dépenses avec reporting financier détaillé."
  },
  {
    icon: BarChart3,
    title: "Tableau de Bord KPI",
    description: "Visualisation claire des indicateurs clés de performance de votre cabinet avec des graphiques interactifs et en temps réel."
  },
  {
    icon: Shield,
    title: "Sécurité & Conformité",
    description: "Chiffrement des données, conformité RGPD et protection maximale des informations sensibles de vos clients."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Fonctionnalités Complètes pour
            <span className="text-primary block">Votre Cabinet Juridique</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Une suite d'outils professionnels conçue spécifiquement pour répondre aux besoins 
            des avocats et professionnels du droit modernes.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;