import { TreePine, CircleDot, Table } from "lucide-react";

const views = [
  {
    icon: TreePine,
    title: "Классическое дерево",
    desc: "Традиционный иерархический вид для привычного визуального представления.",
    bg: "bg-accent",
  },
  {
    icon: CircleDot,
    title: "Радиальная схема",
    desc: "Наглядная визуализация от центрального корня — идеальна для больших семей.",
    bg: "bg-secondary",
  },
  {
    icon: Table,
    title: "Структурная таблица",
    desc: "Строгий формат для работы с датами, местами, фактами и большими данными.",
    bg: "bg-card",
  },
];

const ViewsSection = () => {
  return (
    <section id="views" className="py-20">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">Взгляд сквозь время</h2>
        <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">
          Переключайте форматы между видами мгновенно, чтобы увидеть новые закономерности своего рода.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {views.map((v, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className={`${v.bg} h-48 flex items-center justify-center`}>
                <v.icon className="h-16 w-16 text-accent-foreground/40" />
              </div>
              <div className="p-5 bg-background space-y-2">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <v.icon className="h-4 w-4 text-primary" />
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ViewsSection;
