import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreePine, Plus, Trash2, Users, Monitor, Smartphone, Share2, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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

// Relations that can only have ONE entry per tree (singletons)
const UNIQUE_RELATIONS = new Set([
  "self",
  "father",
  "mother",
  "grandfather_p",
  "grandmother_p",
  "grandfather_m",
  "grandmother_m",
  "spouse",
]);

const getRelationLabel = (value: string) => RELATIONS.find((r) => r.value === value)?.label || value;

const GENERATION_MAP: Record<string, number> = {
  grandfather_p: -2, grandmother_p: -2, grandfather_m: -2, grandmother_m: -2,
  father: -1, mother: -1, uncle: -1, aunt: -1,
  self: 0, brother: 0, sister: 0, spouse: 0, cousin: 0,
  son: 1, daughter: 1,
};

const loadMembers = (): FamilyMember[] => {
  try {
    const saved = localStorage.getItem("kintree_members");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [{ id: "1", name: "", relation: "self" }];
};

const TreeBuilder = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>(loadMembers);
  const [showDialog, setShowDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("father");
  const [newBirthYear, setNewBirthYear] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Persist members to localStorage on every change
  useEffect(() => {
    localStorage.setItem("kintree_members", JSON.stringify(members));
  }, [members]);

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

  // Build share text
  const buildShareText = () => {
    const selfName = members.find((m) => m.relation === "self")?.name || "Моё";
    let text = `🌳 Семейное дерево — ${selfName}\n\n`;
    const gens = new Map<number, FamilyMember[]>();
    members.filter((m) => m.name).forEach((m) => {
      const gen = GENERATION_MAP[m.relation] ?? 0;
      if (!gens.has(gen)) gens.set(gen, []);
      gens.get(gen)!.push(m);
    });
    const genLabels: Record<number, string> = {
      [-2]: "👴 Бабушки и дедушки",
      [-1]: "👨‍👩‍👧 Родители",
      [0]: "🧑 Моё поколение",
      [1]: "👶 Дети",
    };
    [...gens.entries()].sort((a, b) => a[0] - b[0]).forEach(([gen, genMembers]) => {
      text += `${genLabels[gen] || `Поколение ${gen}`}:\n`;
      genMembers.forEach((m) => {
        text += `  • ${m.name} (${getRelationLabel(m.relation)})${m.birthYear ? `, ${m.birthYear}` : ""}\n`;
      });
      text += "\n";
    });
    text += "Создано в KinTree 🌿";
    return text;
  };

  const shareViaWhatsApp = () => {
    const text = buildShareText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaTelegram = () => {
    const text = buildShareText();
    window.open(`https://t.me/share/url?url=${encodeURIComponent("KinTree")}&text=${encodeURIComponent(text)}`, "_blank");
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
  const hasTree = members.some((m) => m.name);

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
            {hasTree && (
              <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-4 w-4 mr-1" /> Поделиться
              </Button>
            )}
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

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Поделиться деревом</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={shareViaWhatsApp}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[hsl(142,70%,45%)]" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" onClick={shareViaTelegram}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[hsl(200,80%,50%)]" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreeBuilder;
