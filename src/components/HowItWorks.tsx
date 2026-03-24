import { UserPlus, Link2, Clock } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Добавьте родственника",
    desc: "Начните с себя или родителей. Для начала достаточно одного имени.",
  },
  {
    icon: Link2,
    title: "Укажите связь",
    desc: "Просто перетащите связи. Укажите роль: отец, дочь, или брат одним движением.",
  },
  {
    icon: Clock,
    title: "Заполните историю постепенно",
    desc: "Добавляйте даты, фото и летопись помогает не потерять. Добавляйте по чуть-чуть с каждым визитом.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-popover">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-foreground">Как это работает</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-4 animate-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                <s.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
