import { TreePine } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-10 border-t border-border">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TreePine className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-foreground">KinTree</span>
        </div>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">KinTree.kg</a>
          <a href="#" className="hover:text-foreground transition-colors">Конфиденциальность</a>
          <a href="#" className="hover:text-foreground transition-colors">Условия</a>
          <a href="#" className="hover:text-foreground transition-colors">Аида А.</a>
        </nav>
        <p className="text-xs text-muted-foreground">© 2025 KinTree. Все права защищены.</p>
      </div>
    </footer>
  );
};

export default Footer;
