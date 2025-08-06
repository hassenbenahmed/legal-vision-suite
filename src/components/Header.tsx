import { Button } from "@/components/ui/button";
import { Scale, Menu } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">LegalVision Suite</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Fonctionnalités
            </a>
            <a href="#dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              Tableau de bord
            </a>
            <a href="#security" className="text-muted-foreground hover:text-primary transition-colors">
              Sécurité
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
              Tarifs
            </a>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Connexion
            </Button>
            <Button>
              Essai gratuit
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Fonctionnalités
              </a>
              <a href="#dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                Tableau de bord
              </a>
              <a href="#security" className="text-muted-foreground hover:text-primary transition-colors">
                Sécurité
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Tarifs
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" className="justify-start">
                  Connexion
                </Button>
                <Button className="justify-start">
                  Essai gratuit
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;