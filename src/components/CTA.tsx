import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Scale } from "lucide-react";

const benefits = [
  "Essai gratuit de 30 jours",
  "Configuration rapide en 24h",
  "Formation complète incluse",
  "Support technique dédié",
  "Migration de données gratuite"
];

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzAgMzBsMTUtMTV2MzB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="container mx-auto px-6 relative">
        <Card className="max-w-4xl mx-auto bg-card/10 backdrop-blur-sm border-primary-foreground/20 shadow-2xl">
          <div className="p-8 lg:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-accent/20">
                <Scale className="h-12 w-12 text-accent" />
              </div>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Prêt à Moderniser
              <span className="text-accent block">Votre Cabinet Juridique ?</span>
            </h2>
            
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Rejoignez plus de 500 cabinets d'avocats qui font confiance à LegalVision Suite 
              pour optimiser leur gestion quotidienne et développer leur activité.
            </p>
            
            <div className="grid md:grid-cols-5 gap-4 mb-8 text-sm">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-primary-foreground/90">
                  <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg group">
                Commencer l'essai gratuit
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Planifier une démo
              </Button>
            </div>
            
            <p className="text-sm text-primary-foreground/70 mt-6">
              Aucune carte de crédit requise • Annulation à tout moment • Support français
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CTA;