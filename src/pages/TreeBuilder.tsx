import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreePine, Plus, Trash2, Users, Monitor, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthYear?: string;
  parentId?: string;
}

const RELATIONS = [
  { value: "self", label: "Я" },
  { value: "father", label: "Отец" },
  { value: "mother", label: "Мать" },
  { value: "grandfather_p", label: "Дедушка (по отцу)" },
  { value: "grandmother_p", label: "Бабушка (по отцу)" },
  { value: "grandfather_m", label: "Дедушка (по маме)" },
  { value: "grandmother_m", label: "Бабушка (по маме)" },
  { value: "brother", label: "Брат" },
  { value: "sister", label: "Сестра" },
  { value: "son", label: "Сын" },
  { value: "daughter", label: "Дочь" },
  { value: "uncle", label: "Дядя" },
  { value: "aunt", label: "Тётя" },
  { value: "cousin", label: "Двоюродный брат/сестра" },
  { value: "spouse", label: "Супруг(а)" },
  { value: "other", label: "Другое" },
];

const getRelationLabel = (value: string) => RELATIONS.find((r) => r.value === value)?.label || value;

const GENERATION_MAP: Record<string, number> = {
  grandfather_p: -2, grandmother_p: -2, grandfather_m: -2, grandmother_m: -2,
  father: -1, mother: -1, uncle: -1, aunt: -1,
  self: 0, brother: 0, sister: 0, spouse: 0, cousin: 0,
  son: 1, daughter: 1,
};

const TreeBuilder = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([
    { id: "1", name: "", relation: "self" },
  ]);
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("father");
  const [newBirthYear, setNewBirthYear] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const addMember = useCallback(() => {
    if (!newName.trim()) {
      toast.error("Введите имя");
      return;
    }
    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newName.trim(),
      relation: newRelation,
      birthYear: newBirthYear || undefined,
    };
    setMembers((prev) => [...prev, member]);
    setNewName("");
    setNewRelation("father");
    setNewBirthYear("");
    setShowDialog(false);
    toast.success(`${member.name} добавлен(а)`);
  }, [newName, newRelation, newBirthYear]);

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateSelfName = (name: string) => {
    setMembers((prev) => prev.map((m) => (m.id === "1" ? { ...m, name } : m)));
  };

  // Group members by generation
  const generations = new Map<number, FamilyMember[]>();
  members.forEach((m) => {
    const gen = GENERATION_MAP[m.relation] ?? 0;
    if (!generations.has(gen)) generations.set(gen, []);
    generations.get(gen)!.push(m);
  });
  const sortedGens = [...generations.entries()].sort((a, b) => a[0] - b[0]);

  const genLabels: Record<number, string> = {
    [-2]: "Бабушки и дедушки",
    [-1]: "Родители",
    [0]: "Моё поколение",
    [1]: "Дети",
  };

  const treeContainerClass = viewMode === "mobile" ? "max-w-sm mx-auto" : "w-full";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <TreePine className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">KinTree</span>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-border rounded-full p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode("desktop")}
                className={`p-1.5 rounded-full transition-colors ${viewMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Вебсайт"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`p-1.5 rounded-full transition-colors ${viewMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Мобильная версия"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            <Button variant="hero" size="sm" onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Добавить
            </Button>
          </div>
        </div>
      </header>

      {/* Tree visualization */}
      <main className="container py-8">
        <div className={treeContainerClass}>
          {/* Self name input */}
          {members[0]?.relation === "self" && !members[0].name && (
            <div className="max-w-xs mx-auto mb-8 text-center space-y-3">
              <Users className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-xl font-bold font-display text-foreground">Начните с себя</h2>
              <Input
                placeholder="Ваше имя"
                className="text-center"
                onBlur={(e) => {
                  if (e.target.value.trim()) updateSelfName(e.target.value.trim());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                    updateSelfName((e.target as HTMLInputElement).value.trim());
                  }
                }}
              />
            </div>
          )}

          {/* Tree view */}
          {(members[0]?.name || members.length > 1) && (
            <div className="space-y-8">
              {sortedGens.map(([gen, genMembers]) => (
                <div key={gen} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-center">
                    {genLabels[gen] || `Поколение ${gen}`}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {genMembers.map((m) => (
                      <div
                        key={m.id}
                        className={`relative group rounded-xl border-2 p-4 text-center min-w-[120px] transition-all hover:shadow-card ${
                          m.relation === "self"
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        {m.relation !== "self" && (
                          <button
                            onClick={() => removeMember(m.id)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                        <p className="font-semibold text-foreground text-sm">{m.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{getRelationLabel(m.relation)}</p>
                        {m.birthYear && (
                          <p className="text-xs text-muted-foreground mt-1">{m.birthYear}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Connection line */}
                  {gen < Math.max(...sortedGens.map(([g]) => g)) && (
                    <div className="flex justify-center">
                      <div className="w-px h-8 bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add member dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Добавить родственника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Имя родственника" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Кем приходится</Label>
              <Select value={newRelation} onValueChange={setNewRelation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.filter((r) => r.value !== "self").map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Год рождения (необязательно)</Label>
              <Input value={newBirthYear} onChange={(e) => setNewBirthYear(e.target.value)} placeholder="1965" maxLength={4} />
            </div>
            <Button variant="hero" className="w-full" onClick={addMember}>
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreeBuilder;
