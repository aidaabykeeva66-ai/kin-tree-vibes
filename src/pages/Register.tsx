import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreePine } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email");
      return;
    }
    if (password.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }
    toast.success(`Добро пожаловать, ${name}!`);
    navigate("/tree-builder");
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--hero-gradient)" }}>
      <div className="w-full max-w-md mx-4">
        <div className="bg-background rounded-2xl shadow-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4 cursor-pointer" onClick={() => navigate("/")}>
              <TreePine className="h-7 w-7 text-primary" />
              <span className="font-display font-bold text-2xl text-foreground">KinTree</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">Создайте аккаунт</h1>
            <p className="text-sm text-muted-foreground">Начните собирать историю своей семьи</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Минимум 6 символов" maxLength={128} />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full">
              Зарегистрироваться
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Бесплатно навсегда до 80 родственников
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
