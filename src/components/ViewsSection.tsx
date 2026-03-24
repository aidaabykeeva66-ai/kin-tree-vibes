import { TreePine, CircleDot, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const views = [
  {
    icon: TreePine,
    title: "Классическое дерево",
    desc: "Традиционный иерархический вид для привычного визуального представления.",
    bg: "bg-accent",
    demo: "tree",
  },
  {
    icon: CircleDot,
    title: "Радиальная схема",
    desc: "Наглядная визуализация от центрального корня — идеальна для больших семей.",
    bg: "bg-secondary",
    demo: "radial",
  },
  {
    icon: Table,
    title: "Структурная таблица",
    desc: "Строгий формат для работы с датами, местами, фактами и большими данными.",
    bg: "bg-card",
    demo: "table",
  },
];

const TreeDemo = () => (
  <div className="flex flex-col items-center gap-2 py-4">
    <div className="w-20 h-10 rounded-lg bg-primary/20 border-2 border-primary flex items-center justify-center text-xs font-semibold text-foreground">Дедушка</div>
    <div className="w-px h-6 bg-border" />
    <div className="flex gap-8">
      {["Папа", "Дядя", "Тётя"].map((n) => (
        <div key={n} className="flex flex-col items-center gap-2">
          <div className="w-16 h-9 rounded-lg bg-accent border border-border flex items-center justify-center text-xs font-medium text-foreground">{n}</div>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-2">
            <div className="w-12 h-7 rounded bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground">Сын</div>
            <div className="w-12 h-7 rounded bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground">Дочь</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RadialDemo = () => (
  <div className="flex items-center justify-center py-8">
    <div className="relative w-64 h-64">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-xs font-bold text-foreground">Я</div>
      {["Мама", "Папа", "Бабушка", "Дедушка", "Тётя", "Дядя"].map((name, i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        return (
          <div key={name} className="absolute w-14 h-8 rounded-full bg-accent border border-border flex items-center justify-center text-[10px] text-foreground" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
            {name}
          </div>
        );
      })}
    </div>
  </div>
);

const TableDemo = () => (
  <div className="overflow-x-auto py-4">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Имя</th>
          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Годы</th>
          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Связь</th>
        </tr>
      </thead>
      <tbody>
        {[
          ["Динара эже", "1924–2009", "Бабушка"],
          ["Бакас", "1950–", "Дядя"],
          ["Кусеинов А.", "1948–2010", "Дедушка"],
        ].map(([name, years, rel]) => (
          <tr key={name} className="border-b border-border/50">
            <td className="py-2 px-3 text-foreground font-medium">{name}</td>
            <td className="py-2 px-3 text-muted-foreground">{years}</td>
            <td className="py-2 px-3 text-muted-foreground">{rel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const demoComponents: Record<string, React.FC> = {
  tree: TreeDemo,
  radial: RadialDemo,
  table: TableDemo,
};

const ViewsSection = () => {
  const [openDemo, setOpenDemo] = useState<string | null>(null);

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
              <div className="p-5 bg-background space-y-3">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <v.icon className="h-4 w-4 text-primary" />
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpenDemo(v.demo)}
                >
                  Посмотреть пример
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!openDemo} onOpenChange={() => setOpenDemo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {openDemo && views.find((v) => v.demo === openDemo)?.title}
            </DialogTitle>
          </DialogHeader>
          {openDemo && demoComponents[openDemo] && (() => {
            const DemoComp = demoComponents[openDemo];
            return <DemoComp />;
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ViewsSection;
