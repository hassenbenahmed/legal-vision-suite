import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, FileCheck, Server, Users } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "Chiffrement AES-256",
    description: "Protection maximale de vos données avec un chiffrement de niveau militaire"
  },
  {
    icon: Lock,
    title: "Authentification 2FA",
    description: "Double authentification pour sécuriser l'accès à votre cabinet"
  },
  {
    icon: Eye,
    title: "Audit Trail Complet",
    description: "Traçabilité complète de toutes les actions effectuées dans le système"
  },
  {
    icon: FileCheck,
    title: "Conformité RGPD",
    description: "Respect strict des réglementations européennes sur la protection des données"
  },
  {
    icon: Server,
    title: "Hébergement Sécurisé",
    description: "Serveurs certifiés ISO 27001 avec sauvegarde automatique"
  },
  {
    icon: Users,
    title: "Gestion des Droits",
    description: "Contrôle granulaire des accès selon les rôles et responsabilités"
  }
];

const Security = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 to-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary text-primary">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité & Conformité
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Sécurité de Niveau
            <span className="text-primary block">Entreprise</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Protégez les données sensibles de vos clients avec notre infrastructure 
            sécurisée et nos protocoles de sécurité avancés.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="bg-card rounded-2xl p-8 shadow-xl border-0">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Certifications & Conformité
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Notre plateforme respecte les plus hauts standards de sécurité et de conformité 
                pour garantir la protection de vos données juridiques sensibles.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Badge variant="secondary" className="justify-center p-3">
                  <span className="font-semibold">ISO 27001</span>
                </Badge>
                <Badge variant="secondary" className="justify-center p-3">
                  <span className="font-semibold">RGPD</span>
                </Badge>
                <Badge variant="secondary" className="justify-center p-3">
                  <span className="font-semibold">SOC 2</span>
                </Badge>
                <Badge variant="secondary" className="justify-center p-3">
                  <span className="font-semibold">ANSSI</span>
                </Badge>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-8">
              <div className="text-center">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-2">99.9% Uptime</h4>
                <p className="text-muted-foreground">
                  Garantie de disponibilité avec infrastructure redondante
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;