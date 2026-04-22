import { Button } from "@/components/ui/button";
import { TreePine } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const user = (() => {
    try {
      const saved = localStorage.getItem("kintree_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <TreePine className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-xl text-foreground">FamilyTree</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Цены</a>
          <a href="#views" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Примеры</a>
        </nav>
        <div className="flex items-center gap-3">
          {user && (
            <Button variant="hero-outline" size="sm" onClick={() => navigate("/tree-builder")}>
              🌳 Моё дерево
            </Button>
          )}
          <Button variant="hero" size="sm" onClick={() => navigate(user ? "/tree-builder" : "/register")}>
            {user ? `Привет, ${user.name}` : "Начать бесплатно"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
