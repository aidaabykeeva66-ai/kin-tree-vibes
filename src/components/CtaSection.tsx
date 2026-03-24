import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20">
      <div className="container">
        <div className="rounded-3xl p-10 md:p-16 text-center space-y-6" style={{ background: "var(--cta-gradient)" }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground font-display">
            Начните собирать историю<br />своей семьи уже сегодня
          </h2>
          <div className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full font-semibold px-10"
              onClick={() => navigate("/register")}
            >
              Создать дерево
            </Button>
            <p className="text-primary-foreground/70 text-sm">
              Бесплатно навсегда до 80 родственников.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
