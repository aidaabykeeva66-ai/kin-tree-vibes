import { Bell, Settings, Check } from "lucide-react";

const PresentSection = () => {
  return (
    <section className="py-20 bg-popover">
      <div className="container grid md:grid-cols-2 gap-16 items-center">
        <div className="bg-background rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 bg-accent/50 rounded-xl p-4">
            <Bell className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Узнайте скорее: день рождения</p>
              <p className="text-xs text-muted-foreground">80 лет со дня рождения дедушки</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-accent/50 rounded-xl p-4">
            <Settings className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">Бабуля это добавила 5 фото</p>
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Будьте рядом в настоящем</h2>
          <p className="text-muted-foreground text-lg">
            KinTree — это не только про прошлое. Он помогает современной семье оставаться на связи через важные напоминания и близкие людям вещи.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-foreground">Синхронизация с вашим календарём</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <span className="text-foreground">Гибкая настройка уведомлений</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default PresentSection;
