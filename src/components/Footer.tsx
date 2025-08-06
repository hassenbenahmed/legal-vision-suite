import { Scale, Mail, Phone, MapPin } from "lucide-react";
const Footer = () => {
  return <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Scale className="h-6 w-6 text-accent" />
              <span className="text-lg font-bold">LegalVision Suite</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              La solution de gestion complète pour les cabinets d'avocats modernes.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Sécurité</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Intégrations</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Formation</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Support technique</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-primary-foreground/80">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-accent" />
                <span>contact@legalvision.fr</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-accent" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-accent" />
                <span>Paris, France</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-primary-foreground/60">
          <p>© 2025 LegalVision Suite. Tous droits réservés.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-accent transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-accent transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-accent transition-colors">RGPD</a>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;