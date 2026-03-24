import { TreePine, Calendar, BookOpen, ImageIcon } from "lucide-react";

const cards = [
  {
    icon: TreePine,
    title: "Начать можно с минимума",
    desc: "Отсутствие дат — не повод не начинать историю семьи, а детали заполните позже.",
  },
  {
    icon: ImageIcon,
    title: "Разные форматы: дерево, схема, таблица",
    desc: "Визуализируйте историю так, как удобно именно вам.",
  },
  {
    icon: Calendar,
    title: "Для всей семьи",
    desc: "Совместное редактирование и добавление данных всей семьёй.",
  },
  {
    icon: Calendar,
    title: "Напоминания о событиях",
    desc: "Не пропустите важную дату — день рождения, годовщину и другие важные события.",
  },
  {
    icon: BookOpen,
    title: "Биографии и фотографии",
    desc: "Больше чем имена — сохраните саму суть каждого из ваших близких.",
  },
];

const HeritageSection = () => {
  return (
    <section className="py-20 bg-popover">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-foreground">Создано для сохранения наследия</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((c, i) => (
            <div
              key={i}
              className="bg-background rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <c.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeritageSection;
