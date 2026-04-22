import { Info } from "lucide-react";
import dinaraEje from "@/assets/dinara-eje.jpg";

const DetailsSection = () => {
  return (
    <section className="py-20">
      <div className="container grid md:grid-cols-2 gap-16 items-center">
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-start gap-3">
            <img
              src={dinaraEje}
              alt="Динара эже"
              className="w-12 h-12 rounded-full object-cover shrink-0"
              loading="lazy"
              width={48}
              height={48}
            />
            <div>
              <p className="font-display font-bold text-foreground">Динара эже (Абдуллаева)</p>
              <p className="text-sm text-muted-foreground">1924 — 2009</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Известна своей чуткостью и заботливостью. Проработала более 30 лет преподавателем, в том числе сельской школе.
          </p>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Быстрое добавление</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Бакас (Дядя Бакас)</p>
                <p className="text-xs text-muted-foreground">Сын. Брат дедушки Кусеинова</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Не знаете всех деталей? Дополните их позже.
          </h2>
          <p className="text-muted-foreground text-lg">
            FamilyTree создан для реальных семейных историй. Мы даём инструменты, чтобы зафиксировать то, что вы знаете сегодня, и оставляем место для открытий завтрашнего дня.
          </p>
          <div className="flex items-start gap-3 bg-accent/50 rounded-xl p-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Обязательно только имя. Остальное — по желанию.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailsSection;
