import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  TreePine, Trash2, Users, Monitor, Smartphone, Share2,
  CircleDot, Table as TableIcon, FileText, Edit, Eye, Heart,
  Camera, Info, Download, Plus, X, Bird,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Relations that can only have ONE entry per tree (singletons)
const UNIQUE_RELATIONS = new Set([
  "self", "father", "mother",
  "grandfather_p", "grandmother_p", "grandfather_m", "grandmother_m",
  "spouse",
]);

// ─── Types ───
interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthDate?: string;
  deathDate?: string;
  photo?: string;
  side?: "father" | "mother" | "both";
  biography?: string;
  facts?: string;
  linkedTo?: string;
}

interface AuditEntry {
  timestamp: string;
  action: string;
  memberName: string;
  details: string;
}

type ViewMode = "tree" | "table" | "radial";
type DeviceMode = "desktop" | "mobile";

// ─── Relations ───
const RELATIONS = [
  { value: "self", label: "Я" },
  { value: "spouse", label: "Супруг(а)" },
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
  { value: "nephew", label: "Племянник" },
  { value: "niece", label: "Племянница" },
  { value: "uncle", label: "Дядя" },
  { value: "aunt", label: "Тётя" },
  { value: "cousin", label: "Двоюродный брат/сестра" },
  { value: "other", label: "Другое" },
];

const getRelationLabel = (value: string) => RELATIONS.find((r) => r.value === value)?.label || value;

const GENERATION_MAP: Record<string, number> = {
  grandfather_p: -2, grandmother_p: -2, grandfather_m: -2, grandmother_m: -2,
  father: -1, mother: -1, uncle: -1, aunt: -1,
  self: 0, brother: 0, sister: 0, spouse: 0, cousin: 0,
  son: 1, daughter: 1, nephew: 1, niece: 1,
};

const NEEDS_LINK = ["spouse", "son", "daughter", "nephew", "niece", "father", "mother"];

const loadMembers = (): FamilyMember[] => {
  try {
    const saved = localStorage.getItem("familytree_members");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const loadAudit = (): AuditEntry[] => {
  try {
    const saved = localStorage.getItem("familytree_audit");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

// ─── Tree Node helpers ───
interface TreeNode {
  member: FamilyMember;
  children: TreeNode[];
  couple?: TreeNode;
}

function buildFamilyTree(members: FamilyMember[]): TreeNode[] {
  const self = members.find(m => m.relation === "self");
  if (!self || !self.name) return [];

  const findSpouse = (id: string) => members.find(m => m.relation === "spouse" && m.linkedTo === id);
  const siblings = members.filter(m => ["brother", "sister"].includes(m.relation));
  const childrenOf = (parentId: string) => members.filter(m =>
    (["son", "daughter", "nephew", "niece"].includes(m.relation)) && m.linkedTo === parentId
  );
  const unlinkedChildren = members.filter(m =>
    ["son", "daughter"].includes(m.relation) && !m.linkedTo
  );

  const father = members.find(m => m.relation === "father");
  const mother = members.find(m => m.relation === "mother");
  const grandfather_p = members.find(m => m.relation === "grandfather_p");
  const grandmother_p = members.find(m => m.relation === "grandmother_p");
  const grandfather_m = members.find(m => m.relation === "grandfather_m");
  const grandmother_m = members.find(m => m.relation === "grandmother_m");
  const unclesAunts = members.filter(m => ["uncle", "aunt"].includes(m.relation));
  const cousins = members.filter(m => m.relation === "cousin");

  // Self node
  const selfKids = [
    ...childrenOf(self.id).map(c => ({ member: c, children: [] as TreeNode[] })),
    ...unlinkedChildren.map(c => ({ member: c, children: [] as TreeNode[] })),
  ];
  const selfSpouse = findSpouse(self.id) || members.find(m => m.relation === "spouse" && !m.linkedTo);
  const selfNode: TreeNode = {
    member: self,
    children: selfKids,
    couple: selfSpouse ? { member: selfSpouse, children: [] } : undefined,
  };

  // Sibling nodes
  const siblingNodes: TreeNode[] = siblings.map(sib => {
    const sibKids = childrenOf(sib.id);
    const sibSpouse = findSpouse(sib.id);
    return {
      member: sib,
      children: sibKids.map(c => ({ member: c, children: [] })),
      couple: sibSpouse ? { member: sibSpouse, children: [] } : undefined,
    };
  });

  const familyChildren = [selfNode, ...siblingNodes];

  // Uncle/aunt with cousins
  const uncleAuntNodes: TreeNode[] = unclesAunts.map(ua => ({
    member: ua,
    children: cousins.map(c => ({ member: c, children: [] })),
  }));

  // Parents
  let parentsNode: TreeNode | null = null;
  if (father && mother) {
    parentsNode = { member: father, children: familyChildren, couple: { member: mother, children: [] } };
  } else if (father) {
    parentsNode = { member: father, children: familyChildren };
  } else if (mother) {
    parentsNode = { member: mother, children: familyChildren };
  }

  const fatherSideChildren = [...(parentsNode ? [parentsNode] : []), ...uncleAuntNodes];

  // Grandparents paternal
  let gpPNode: TreeNode | null = null;
  if (grandfather_p || grandmother_p) {
    const main = grandfather_p || grandmother_p!;
    const partner = grandfather_p && grandmother_p ? (main === grandfather_p ? grandmother_p : grandfather_p) : undefined;
    gpPNode = { member: main, children: fatherSideChildren, couple: partner ? { member: partner, children: [] } : undefined };
  }

  // Grandparents maternal — connect to mother
  let gpMNode: TreeNode | null = null;
  if (grandfather_m || grandmother_m) {
    const main = grandfather_m || grandmother_m!;
    const partner = grandfather_m && grandmother_m ? (main === grandfather_m ? grandmother_m : grandfather_m) : undefined;
    // Maternal grandparents have mother as child (if mother exists and not already in paternal branch)
    const motherChild = mother && !father ? [{ member: mother, children: familyChildren }] : [];
    gpMNode = { member: main, children: motherChild, couple: partner ? { member: partner, children: [] } : undefined };
  }

  const roots: TreeNode[] = [];
  if (gpPNode) roots.push(gpPNode);
  else if (parentsNode) roots.push(parentsNode);

  if (gpMNode) roots.push(gpMNode);

  if (roots.length === 0) {
    roots.push(selfNode);
    roots.push(...siblingNodes);
  }

  return roots;
}

// ─── Node Card ───
const NodeBox = ({ member, onClickProfile }: { member: FamilyMember; onClickProfile: (m: FamilyMember) => void }) => {
  const isSelf = member.relation === "self";
  const hasDeath = !!member.deathDate;

  return (
    <div
      onClick={() => onClickProfile(member)}
      className={`rounded-2xl border px-4 py-3 text-center min-w-[100px] cursor-pointer transition-all hover:shadow-card-hover ${
        isSelf
          ? "border-primary bg-accent shadow-card"
          : "border-border bg-card shadow-card"
      }`}
    >
      {member.photo ? (
        <img src={member.photo} alt={member.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-border" />
      ) : (
        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold ${
          isSelf ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          {member.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground leading-tight">{member.name || "—"}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{getRelationLabel(member.relation)}</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        {member.birthDate && (
          <span className="text-[10px] text-muted-foreground">{member.birthDate}</span>
        )}
        {hasDeath && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex" onClick={e => e.stopPropagation()}>
                <Bird className="h-3 w-3 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Дата смерти: {member.deathDate}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {(member.biography || member.facts) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex" onClick={e => e.stopPropagation()}>
                <Info className="h-3 w-3 text-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {member.biography && <p className="text-xs mb-1"><strong>Биография:</strong> {member.biography}</p>}
              {member.facts && <p className="text-xs"><strong>Факты:</strong> {member.facts}</p>}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const TreeNodeView = ({ node, depth = 0, onClickProfile }: { node: TreeNode; depth?: number; onClickProfile: (m: FamilyMember) => void }) => {
  return (
    <div className="flex flex-col items-center">
      {node.couple ? (
        <div className="flex items-center gap-2">
          <NodeBox member={node.member} onClickProfile={onClickProfile} />
          <span className="text-primary text-sm font-medium">♥</span>
          <NodeBox member={node.couple.member} onClickProfile={onClickProfile} />
        </div>
      ) : (
        <NodeBox member={node.member} onClickProfile={onClickProfile} />
      )}
      {node.children.length > 0 && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-6 relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" style={{ width: `${(node.children.length - 1) * 160}px` }} />
            )}
            {node.children.map((child) => (
              <div key={child.member.id} className="flex flex-col items-center">
                {node.children.length > 1 && <div className="w-px h-4 bg-border" />}
                <TreeNodeView node={child} depth={depth + 1} onClickProfile={onClickProfile} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ClassicTreeView = ({ members, onClickProfile }: { members: FamilyMember[]; onClickProfile: (m: FamilyMember) => void }) => {
  const roots = buildFamilyTree(members);
  if (roots.length === 0) return <p className="text-center text-muted-foreground py-12">Добавьте членов семьи для отображения дерева</p>;
  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex gap-16 justify-center min-w-max px-8 pt-4">
        {roots.map(root => <TreeNodeView key={root.member.id} node={root} onClickProfile={onClickProfile} />)}
      </div>
    </div>
  );
};

// ─── Radial View ───
const RadialView = ({ members, onClickProfile }: { members: FamilyMember[]; onClickProfile: (m: FamilyMember) => void }) => {
  const named = members.filter(m => m.name);
  const self = named.find(m => m.relation === "self");
  const others = named.filter(m => m.relation !== "self");
  if (!self) return <p className="text-center text-muted-foreground py-12">Добавьте членов семьи</p>;

  const generations = new Map<number, FamilyMember[]>();
  others.forEach(m => {
    const gen = GENERATION_MAP[m.relation] ?? 0;
    if (!generations.has(gen)) generations.set(gen, []);
    generations.get(gen)!.push(m);
  });
  const sortedGens = [...generations.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative" style={{ width: 420, height: 420 }}>
        <div
          onClick={() => onClickProfile(self)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-accent border-2 border-primary flex items-center justify-center text-xs font-bold text-foreground z-10 cursor-pointer hover:shadow-card-hover transition-shadow"
        >
          {self.name}
        </div>
        {sortedGens.map(([, genMembers], ringIdx) => {
          const radius = 85 + ringIdx * 65;
          return genMembers.map((m, i) => {
            const angle = (i * (360 / genMembers.length) - 90) * (Math.PI / 180);
            const x = 210 + radius * Math.cos(angle);
            const y = 210 + radius * Math.sin(angle);
            return (
              <div
                key={m.id}
                onClick={() => onClickProfile(m)}
                className="absolute flex flex-col items-center cursor-pointer"
                style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
              >
                <div className="w-16 h-10 rounded-full bg-card border border-border flex items-center justify-center text-[10px] text-foreground z-10 hover:shadow-card-hover transition-shadow">
                  {m.name}
                </div>
                <span className="text-[8px] text-muted-foreground mt-0.5">{getRelationLabel(m.relation)}</span>
              </div>
            );
          });
        })}
        {sortedGens.map(([, ], ringIdx) => {
          const r = 85 + ringIdx * 65;
          return <div key={ringIdx} className="absolute border border-border/30 rounded-full" style={{ width: r * 2, height: r * 2, left: 210 - r, top: 210 - r }} />;
        })}
      </div>
    </div>
  );
};

// ─── Table View ───
const TableView = ({ members, onRemove, onClickProfile }: { members: FamilyMember[]; onRemove: (id: string) => void; onClickProfile: (m: FamilyMember) => void }) => {
  const named = members.filter(m => m.name);
  const sorted = [...named].sort((a, b) => (GENERATION_MAP[a.relation] ?? 0) - (GENERATION_MAP[b.relation] ?? 0));

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Фото</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Имя</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Связь</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Сторона</th>
            <th className="text-left py-3 px-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Рождение</th>
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(m => (
            <tr key={m.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => onClickProfile(m)}>
              <td className="py-3 px-4">
                {m.photo ? <img src={m.photo} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{m.name?.charAt(0)}</div>}
              </td>
              <td className="py-3 px-4 text-foreground font-medium">
                {m.name}
                {m.deathDate && <Bird className="inline h-3 w-3 ml-1 text-muted-foreground" />}
              </td>
              <td className="py-3 px-4 text-muted-foreground">{getRelationLabel(m.relation)}</td>
              <td className="py-3 px-4 text-muted-foreground text-xs">
                {m.side === "father" ? "По отцу" : m.side === "mother" ? "По маме" : m.side === "both" ? "Обе" : "—"}
              </td>
              <td className="py-3 px-4 text-muted-foreground">{m.birthDate || "—"}</td>
              <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                {m.relation !== "self" && (
                  <button onClick={() => onRemove(m.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Share text builder ───
const buildShareText = (members: FamilyMember[]) => {
  const selfName = members.find(m => m.relation === "self")?.name || "Моё";
  let text = `🌳 Семейное дерево — ${selfName}\n\n`;
  const gens = new Map<number, FamilyMember[]>();
  members.filter(m => m.name).forEach(m => {
    const gen = GENERATION_MAP[m.relation] ?? 0;
    if (!gens.has(gen)) gens.set(gen, []);
    gens.get(gen)!.push(m);
  });
  const genLabels: Record<number, string> = { [-2]: "👴 Бабушки и дедушки", [-1]: "👨‍👩‍👧 Родители", [0]: "🧑 Моё поколение", [1]: "👶 Дети" };
  [...gens.entries()].sort((a, b) => a[0] - b[0]).forEach(([gen, gm]) => {
    text += `${genLabels[gen] || `Поколение ${gen}`}:\n`;
    gm.forEach(m => { text += `  • ${m.name} (${getRelationLabel(m.relation)})${m.birthDate ? `, ${m.birthDate}` : ""}\n`; });
    text += "\n";
  });
  text += "Создано в FamilyTree 🌿";
  return text;
};

// ─── Link options ───
function getLinkOptions(relation: string, members: FamilyMember[]): { id: string; label: string }[] {
  const named = members.filter(m => m.name);
  if (relation === "spouse") {
    const existingSpouseLinkedIds = new Set(members.filter(m => m.relation === "spouse").map(m => m.linkedTo));
    return named
      .filter(m => m.relation !== "spouse" && !existingSpouseLinkedIds.has(m.id))
      .map(m => ({ id: m.id, label: `${m.name} (${getRelationLabel(m.relation)})` }));
  }
  if (["son", "daughter"].includes(relation)) {
    return named.map(m => ({ id: m.id, label: `${m.name} (${getRelationLabel(m.relation)})` }));
  }
  if (["nephew", "niece"].includes(relation)) {
    return named
      .filter(m => ["brother", "sister"].includes(m.relation))
      .map(m => ({ id: m.id, label: `${m.name} (${getRelationLabel(m.relation)})` }));
  }
  if (["father", "mother"].includes(relation)) {
    return named.map(m => ({ id: m.id, label: `${m.name} (${getRelationLabel(m.relation)})` }));
  }
  return [];
}

function getLinkLabel(relation: string): string {
  if (relation === "spouse") return "Чей супруг(а)?";
  if (["son", "daughter"].includes(relation)) return "Чей ребёнок?";
  if (["nephew", "niece"].includes(relation)) return "Чей ребёнок?";
  if (["father", "mother"].includes(relation)) return "Чей родитель?";
  return "Привязать к";
}

// ─── Main Component ───
const TreeBuilder = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>(loadMembers);
  const [audit, setAudit] = useState<AuditEntry[]>(loadAudit);
  const [showDialog, setShowDialog] = useState(false);
  const [showSelfDialog, setShowSelfDialog] = useState(() => loadMembers().length === 0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<FamilyMember | null>(null);

  // Form state
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("spouse");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newDeathDate, setNewDeathDate] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | undefined>();
  const [newSide, setNewSide] = useState<"father" | "mother" | "both">("both");
  const [newBiography, setNewBiography] = useState("");
  const [newFacts, setNewFacts] = useState("");
  const [newLinkedTo, setNewLinkedTo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Self form
  const [selfName, setSelfName] = useState("");
  const [selfBirthDate, setSelfBirthDate] = useState("");
  const [selfPhoto, setSelfPhoto] = useState<string | undefined>();
  const [selfBiography, setSelfBiography] = useState("");
  const [selfFacts, setSelfFacts] = useState("");
  const selfFileRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");

  useEffect(() => {
    localStorage.setItem("familytree_members", JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem("familytree_audit", JSON.stringify(audit));
  }, [audit]);

  const addAudit = useCallback((action: string, memberName: string, details: string) => {
    setAudit(prev => [{
      timestamp: new Date().toLocaleString("ru-RU"),
      action,
      memberName,
      details,
    }, ...prev].slice(0, 100));
  }, []);

  const needsLink = NEEDS_LINK.includes(newRelation);
  const linkOptions = useMemo(() => getLinkOptions(newRelation, members), [newRelation, members]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string | undefined) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Фото не более 2МБ"); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveSelf = useCallback(() => {
    if (!selfName.trim()) { toast.error("Введите имя"); return; }
    const selfMember: FamilyMember = {
      id: "self_" + Date.now(),
      name: selfName.trim(),
      relation: "self",
      birthDate: selfBirthDate || undefined,
      photo: selfPhoto,
      side: "both",
      biography: selfBiography || undefined,
      facts: selfFacts || undefined,
    };
    setMembers([selfMember]);
    setShowSelfDialog(false);
    addAudit("Добавлен", selfMember.name, "Я (создатель дерева)");
    toast.success("Добро пожаловать, " + selfMember.name + "!");
  }, [selfName, selfBirthDate, selfPhoto, selfBiography, selfFacts, addAudit]);

  const addMember = useCallback(() => {
    if (!newName.trim()) { toast.error("Введите имя"); return; }
    // Prevent duplicates for singleton relations
    if (UNIQUE_RELATIONS.has(newRelation) && members.some(m => m.relation === newRelation)) {
      toast.error(`${getRelationLabel(newRelation)} уже добавлен(а) в дерево`);
      return;
    }
    // Prevent exact duplicate (same name + same relation)
    if (members.some(m => m.relation === newRelation && m.name.trim().toLowerCase() === newName.trim().toLowerCase())) {
      toast.error("Такой родственник уже есть");
      return;
    }
    if (needsLink && linkOptions.length > 0 && !newLinkedTo) {
      toast.error("Выберите, к кому привязать"); return;
    }
    if (["nephew", "niece"].includes(newRelation) && linkOptions.length === 0) {
      toast.error("Сначала добавьте брата или сестру"); return;
    }
    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newName.trim(),
      relation: newRelation,
      birthDate: newBirthDate || undefined,
      deathDate: newDeathDate || undefined,
      photo: newPhoto,
      side: newSide,
      biography: newBiography || undefined,
      facts: newFacts || undefined,
      linkedTo: needsLink ? (newLinkedTo || linkOptions[0]?.id) : undefined,
    };
    setMembers(prev => [...prev, member]);
    addAudit("Добавлен", member.name, `${getRelationLabel(member.relation)}`);
    resetForm();
    setShowDialog(false);
    toast.success(`${member.name} добавлен(а)`);
  }, [newName, newRelation, newBirthDate, newDeathDate, newPhoto, newSide, newBiography, newFacts, newLinkedTo, needsLink, linkOptions, addAudit, members]);

  const resetForm = () => {
    setNewName(""); setNewRelation("spouse"); setNewBirthDate(""); setNewDeathDate("");
    setNewPhoto(undefined); setNewSide("both"); setNewBiography(""); setNewFacts(""); setNewLinkedTo("");
  };

  const removeMember = (id: string) => {
    const m = members.find(x => x.id === id);
    if (m) addAudit("Удалён", m.name, getRelationLabel(m.relation));
    setMembers(prev => prev.filter(x => x.id !== id));
  };

  const openProfile = (m: FamilyMember) => {
    setSelectedProfile(m);
    setShowProfileDialog(true);
  };

  const shareViaWhatsApp = (mode: "text" | "link-view" | "link-edit") => {
    if (mode === "text") {
      window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText(members))}`, "_blank");
    } else {
      const url = `${window.location.origin}/tree-builder?shared=true&edit=${mode === "link-edit"}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(`🌳 Моё семейное дерево: ${url}`)}`, "_blank");
    }
  };

  const shareViaTelegram = (mode: "text" | "link-view" | "link-edit") => {
    if (mode === "text") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent("FamilyTree")}&text=${encodeURIComponent(buildShareText(members))}`, "_blank");
    } else {
      const url = `${window.location.origin}/tree-builder?shared=true&edit=${mode === "link-edit"}`;
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("🌳 Моё семейное дерево")}`, "_blank");
    }
  };

  const exportPDF = async () => {
    const node = document.getElementById("tree-pdf-area");
    if (!node) { toast.error("Не удалось найти дерево"); return; }
    if (!members.some(m => m.name)) { toast.error("Сначала добавьте родственников"); return; }
    toast.info("Готовим PDF...");
    try {
      node.classList.add("exporting-pdf");
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      node.classList.remove("exporting-pdf");
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }
      const selfName = members.find(m => m.relation === "self")?.name || "tree";
      pdf.save(`FamilyTree-${selfName}.pdf`);
      toast.success("PDF сохранён");
    } catch (err) {
      console.error(err);
      toast.error("Ошибка при создании PDF");
    }
  };

  const hasSelf = members.some(m => m.relation === "self" && m.name);
  const hasTree = members.some(m => m.name);
  const treeContainerClass = deviceMode === "mobile" ? "max-w-sm mx-auto" : "w-full";

  const VIEW_OPTIONS: { value: ViewMode; icon: React.ElementType; label: string }[] = [
    { value: "tree", icon: TreePine, label: "Дерево" },
    { value: "table", icon: TableIcon, label: "Таблица" },
    { value: "radial", icon: CircleDot, label: "Радиальная" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <TreePine className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">FamilyTree</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-full p-0.5 gap-0.5">
              {VIEW_OPTIONS.map(v => (
                <button
                  key={v.value}
                  onClick={() => setViewMode(v.value)}
                  className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs ${
                    viewMode === v.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <v.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center border border-border rounded-full p-0.5 gap-0.5">
              <button onClick={() => setDeviceMode("desktop")} className={`p-1.5 rounded-full transition-colors ${deviceMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Monitor className="h-4 w-4" />
              </button>
              <button onClick={() => setDeviceMode("mobile")} className={`p-1.5 rounded-full transition-colors ${deviceMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            {hasTree && (
              <>
                <Button variant="outline" size="sm" onClick={exportPDF}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
                  <Share2 className="h-4 w-4 mr-1" /> Поделиться
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAuditDialog(true)} title="Журнал изменений">
                  <FileText className="h-4 w-4" />
                </Button>
              </>
            )}
            {hasSelf && (
              <Button size="sm" onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> Добавить
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container py-8">
        <div className={treeContainerClass} id="tree-pdf-area">
          {!hasSelf && (
            <div className="max-w-sm mx-auto mb-8 text-center space-y-4 py-20">
              <div className="w-20 h-20 rounded-full bg-accent mx-auto flex items-center justify-center">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold font-display text-foreground">Начните с себя</h2>
              <p className="text-muted-foreground">Добавьте своё имя, чтобы начать строить семейное дерево</p>
              <Button size="lg" onClick={() => setShowSelfDialog(true)}>Добавить себя</Button>
            </div>
          )}

          {hasTree && (
            <>
              {viewMode === "tree" && <ClassicTreeView members={members} onClickProfile={openProfile} />}
              {viewMode === "radial" && <RadialView members={members} onClickProfile={openProfile} />}
              {viewMode === "table" && <TableView members={members} onRemove={removeMember} onClickProfile={openProfile} />}

              {viewMode !== "table" && (
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Все участники ({members.filter(m => m.name).length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {members.filter(m => m.name).map(m => (
                      <div key={m.id} className={`relative group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer hover:shadow-card transition-shadow ${
                        m.relation === "self" ? "border-primary bg-accent" : "border-border bg-card"
                      }`} onClick={() => openProfile(m)}>
                        {m.photo ? (
                          <img src={m.photo} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{m.name?.charAt(0)}</div>
                        )}
                        <span className="font-medium text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground">({getRelationLabel(m.relation)})</span>
                        {m.deathDate && <Bird className="h-3 w-3 text-muted-foreground" />}
                        {m.relation !== "self" && (
                          <button onClick={e => { e.stopPropagation(); removeMember(m.id); }} className="text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Self dialog */}
      <Dialog open={showSelfDialog} onOpenChange={setShowSelfDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Расскажите о себе</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Ваше имя *</Label>
              <Input value={selfName} onChange={e => setSelfName(e.target.value)} placeholder="Полное имя" />
            </div>
            <div className="space-y-2">
              <Label>Дата рождения</Label>
              <Input type="date" value={selfBirthDate} onChange={e => setSelfBirthDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Фото</Label>
              <input type="file" accept="image/*" ref={selfFileRef} className="hidden" onChange={e => handlePhotoUpload(e, setSelfPhoto)} />
              <div className="flex items-center gap-3">
                {selfPhoto ? (
                  <img src={selfPhoto} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => selfFileRef.current?.click()}>
                  {selfPhoto ? "Изменить" : "Загрузить"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Биография</Label>
              <Textarea value={selfBiography} onChange={e => setSelfBiography(e.target.value)} placeholder="Расскажите о себе..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Интересные факты</Label>
              <Textarea value={selfFacts} onChange={e => setSelfFacts(e.target.value)} placeholder="Увлечения, достижения..." rows={2} />
            </div>
            <Button className="w-full" size="lg" onClick={saveSelf}>Начать</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={showDialog} onOpenChange={v => { if (!v) resetForm(); setShowDialog(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Добавить родственника</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Полное имя *</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Имя родственника" />
            </div>
            <div className="space-y-2">
              <Label>Кем приходится *</Label>
              <Select value={newRelation} onValueChange={v => { setNewRelation(v); setNewLinkedTo(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONS.filter(r => r.value !== "self").map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link selector */}
            {needsLink && linkOptions.length > 0 && (
              <div className="space-y-2">
                <Label>{getLinkLabel(newRelation)}</Label>
                <Select value={newLinkedTo} onValueChange={setNewLinkedTo}>
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    {linkOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {["nephew", "niece"].includes(newRelation) && linkOptions.length === 0 && (
              <p className="text-sm text-destructive">Сначала добавьте брата или сестру</p>
            )}

            {/* Side of family */}
            <div className="space-y-2">
              <Label>Сторона семьи *</Label>
              <Select value={newSide} onValueChange={v => setNewSide(v as "father" | "mother" | "both")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">По отцу</SelectItem>
                  <SelectItem value="mother">По маме</SelectItem>
                  <SelectItem value="both">Обе стороны</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Дата рождения</Label>
              <Input type="date" value={newBirthDate} onChange={e => setNewBirthDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Дата смерти (если применимо)</Label>
              <Input type="date" value={newDeathDate} onChange={e => setNewDeathDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Фото</Label>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={e => handlePhotoUpload(e, setNewPhoto)} />
              <div className="flex items-center gap-3">
                {newPhoto ? (
                  <img src={newPhoto} className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {newPhoto ? "Изменить" : "Загрузить"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Биография</Label>
              <Textarea value={newBiography} onChange={e => setNewBiography(e.target.value)} placeholder="Краткая биография..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Интересные факты</Label>
              <Textarea value={newFacts} onChange={e => setNewFacts(e.target.value)} placeholder="Увлечения, достижения..." rows={2} />
            </div>

            <Button className="w-full" size="lg" onClick={addMember} disabled={["nephew", "niece"].includes(newRelation) && linkOptions.length === 0}>
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Профиль</DialogTitle></DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="text-center">
                {selectedProfile.photo ? (
                  <img src={selectedProfile.photo} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto bg-accent flex items-center justify-center text-2xl font-bold text-primary">
                    {selectedProfile.name?.charAt(0)}
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground mt-3">{selectedProfile.name}</h3>
                <p className="text-sm text-muted-foreground">{getRelationLabel(selectedProfile.relation)}</p>
                {selectedProfile.side && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProfile.side === "father" ? "Сторона отца" : selectedProfile.side === "mother" ? "Сторона мамы" : "Обе стороны"}
                  </p>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {selectedProfile.birthDate && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Дата рождения</span>
                    <span className="text-foreground">{selectedProfile.birthDate}</span>
                  </div>
                )}
                {selectedProfile.deathDate && (
                  <div className="flex justify-between py-2 border-b border-border items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Bird className="h-3 w-3" /> Дата смерти
                    </span>
                    <span className="text-foreground">{selectedProfile.deathDate}</span>
                  </div>
                )}
                {selectedProfile.biography && (
                  <div className="py-2 border-b border-border">
                    <p className="text-muted-foreground mb-1">Биография</p>
                    <p className="text-foreground">{selectedProfile.biography}</p>
                  </div>
                )}
                {selectedProfile.facts && (
                  <div className="py-2">
                    <p className="text-muted-foreground mb-1">Интересные факты</p>
                    <p className="text-foreground">{selectedProfile.facts}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Поделиться деревом</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">WhatsApp</p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start gap-3" onClick={() => shareViaWhatsApp("text")}>
                  <FileText className="h-4 w-4 text-primary" /> Текст дерева
                </Button>
                <Button variant="outline" className="justify-start gap-3" onClick={() => shareViaWhatsApp("link-view")}>
                  <Eye className="h-4 w-4 text-primary" /> Ссылка (просмотр)
                </Button>
                <Button variant="outline" className="justify-start gap-3" onClick={() => shareViaWhatsApp("link-edit")}>
                  <Edit className="h-4 w-4 text-primary" /> Ссылка (редактирование)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Telegram</p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start gap-3" onClick={() => shareViaTelegram("text")}>
                  <FileText className="h-4 w-4 text-primary" /> Текст дерева
                </Button>
                <Button variant="outline" className="justify-start gap-3" onClick={() => shareViaTelegram("link-view")}>
                  <Eye className="h-4 w-4 text-primary" /> Ссылка (просмотр)
                </Button>
                <Button variant="outline" className="justify-start gap-3" onClick={() => shareViaTelegram("link-edit")}>
                  <Edit className="h-4 w-4 text-primary" /> Ссылка (редактирование)
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit log dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Журнал изменений</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Нет записей</p>
            ) : (
              audit.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{entry.action}:</span> {entry.memberName}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.details}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{entry.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreeBuilder;
