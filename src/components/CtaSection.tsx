import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CtaSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email");
      return;
    }
    toast.success(`Добро пожаловать, ${name}! Регистрация успешна.`);
    setName("");
    setEmail("");
    setShowForm(false);
  };

  return (
    <section className="py-20">
      <div className="container">
        <div className="rounded-3xl p-10 md:p-16 text-center space-y-6" style={{ background: "var(--cta-gradient)" }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground font-display">
            Начните собирать историю<br />своей семьи уже сегодня
          </h2>

          {!showForm ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full font-semibold px-10"
                onClick={() => setShowForm(true)}
              >
                Создать дерево
              </Button>
              <p className="text-primary-foreground/70 text-sm">
                Будет не привычно. Бесплатно навсегда до 80 родственников.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4 animate-fade-up">
              <div className="text-left space-y-2">
                <Label className="text-primary-foreground">Имя</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50"
                  maxLength={100}
                />
              </div>
              <div className="text-left space-y-2">
                <Label className="text-primary-foreground">Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50"
                  maxLength={255}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full font-semibold"
              >
                Зарегистрироваться
              </Button>
              <button type="button" onClick={() => setShowForm(false)} className="text-primary-foreground/70 text-sm underline">
                Назад
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
