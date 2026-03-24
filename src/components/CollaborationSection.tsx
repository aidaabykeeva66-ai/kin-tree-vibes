import { Users, History, Eye } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Общий доступ",
    desc: "Работайте над деревом вместе с родными — бабушкой, братьями и сестрой.",
  },
  {
    icon: History,
    title: "История правок",
    desc: "Все действия логируются, можно отменить любые фото бабушки.",
  },
  {
    icon: Eye,
    title: "Загрузи фото и видео для хранения",
    desc: "Загружайте фото и видео для сохранения памяти и важных моментов семьи.",
  },
];

const CollaborationSection = () => {
  return (
    <section id="features" className="py-20">
      <div className="container grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Собирайте историю вместе</h2>
          <p className="text-muted-foreground text-lg">
            Пригласите родственников в ваш архив. Они смогут добавлять свои семейные истории, загружать фото и дополнять биографии.
          </p>
          <div className="space-y-5">
            {features.map((f, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground">{f.title}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="bg-accent/50 rounded-xl p-4 text-sm text-foreground">
            <span className="font-semibold">Бабушка</span> добавила 4 фото в альбом «Лето 1985»
          </div>
          <div className="bg-accent/50 rounded-xl p-4 text-sm text-foreground">
            <span className="font-semibold">Алгус</span> связал ветки родства Тарабаевых
          </div>
          <div className="bg-accent/50 rounded-xl p-4 text-sm text-foreground">
            <span className="font-semibold">Токжан</span> загрузил 10 видео с поездки на юг
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollaborationSection;
