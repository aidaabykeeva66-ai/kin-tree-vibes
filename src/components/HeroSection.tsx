import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroTree from "@/assets/hero-tree.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24" style={{ background: "var(--hero-gradient)" }}>
      <div className="container grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-fade-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
            Создайте семейное дерево и сохраните историю <em className="text-primary not-italic">своего рода</em>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Добавляйте родственников, даже если знаете только имя. Начните с малого, а детали заполните позже.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="hero" size="lg" onClick={() => navigate("/register")}>Начать бесплатно</Button>
            <Button variant="hero-outline" size="lg" onClick={() => document.getElementById('views')?.scrollIntoView({ behavior: 'smooth' })}>Посмотреть пример</Button>
          </div>
        </div>
        <div className="flex justify-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <img src={heroTree} alt="Семейное дерево KinTree" width={500} height={500} className="w-full max-w-md" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
