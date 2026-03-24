import { Button } from "@/components/ui/button";
import { TreePine } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <TreePine className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-xl text-foreground">KinTree</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Цены</a>
          <a href="#views" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Примеры</a>
        </nav>
        <Button variant="hero" size="sm" onClick={() => navigate("/register")}>Начать бесплатно</Button>
      </div>
    </header>
  );
};

export default Header;
