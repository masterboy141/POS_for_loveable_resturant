import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Leaf, Trash2 } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { categories } from "@/lib/pos-data";
import { useStore, type EditableMenuItem } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu Manager · Harvest POS" },
      { name: "description", content: "Manage categories, dishes, prices, GST and availability for your vegetarian menu." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const menu = useStore((s) => s.menu);
  const updateMenuItem = useStore((s) => s.updateMenuItem);
  const addMenuItem = useStore((s) => s.addMenuItem);
  const removeMenuItem = useStore((s) => s.removeMenuItem);

  const [active, setActive] = useState("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<EditableMenuItem | null>(null);
  const [adding, setAdding] = useState(false);

  const list = useMemo(
    () => menu.filter((m) => (active === "all" || m.category === active) && m.name.toLowerCase().includes(q.toLowerCase())),
    [menu, active, q],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Menu Manager" subtitle={`${menu.length} dishes · ${categories.length - 1} categories`} />

      <div className="flex-1 space-y-5 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes…" className="h-11 rounded-2xl border-border/70 bg-card pl-11" />
          </div>
          <Button onClick={() => setAdding(true)} className="h-11 rounded-2xl gradient-brand text-primary-foreground shadow-soft">
            <Plus className="mr-2 size-4" /> Add Dish
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={
                "rounded-full border px-4 py-2 text-sm font-medium transition " +
                (active === c.id
                  ? "border-transparent gradient-brand text-primary-foreground shadow-soft"
                  : "border-border bg-card hover:bg-secondary")
              }
            >
              <span className="mr-1">{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((m) => (
            <Card key={m.id} className="group overflow-hidden rounded-3xl border transition hover:shadow-soft">
              <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-secondary via-cream to-accent text-6xl">
                {m.emoji}
                <Badge className="absolute left-3 top-3 rounded-full border-0 bg-background/80 text-leaf">
                  <Leaf className="mr-1 size-3" /> Pure Veg
                </Badge>
                <Button size="icon" variant="secondary" onClick={() => setEditing(m)} className="absolute right-3 top-3 size-8 rounded-full opacity-0 transition group-hover:opacity-100">
                  <Pencil className="size-3.5" />
                </Button>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold">{m.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{m.category}</p>
                  </div>
                  <span className="font-display text-lg font-semibold text-gradient-brand">₹{m.price}</span>
                </div>
                {m.description && <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " + (m.inStock ? "bg-leaf/15 text-leaf" : "bg-destructive/10 text-destructive")}>
                    <span className={"size-1.5 rounded-full " + (m.inStock ? "bg-leaf" : "bg-destructive")} />
                    {m.inStock ? "In stock" : "Out of stock"}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">GST {m.gst}%</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit dish</DialogTitle>
          </DialogHeader>
          {editing && (
            <DishForm
              value={editing}
              onChange={setEditing}
              footer={
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => {
                      removeMenuItem(editing.id);
                      setEditing(null);
                      toast.success("Dish removed");
                    }}
                  >
                    <Trash2 className="mr-1 size-4" /> Delete
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      const { id, ...patch } = editing;
                      void id;
                      updateMenuItem(editing.id, patch);
                      setEditing(null);
                      toast.success("Dish updated");
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add new dish</DialogTitle>
          </DialogHeader>
          <AddDishForm onAdd={(item) => { addMenuItem(item); setAdding(false); toast.success("Dish added"); }} onCancel={() => setAdding(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DishForm({ value, onChange, footer }: { value: EditableMenuItem; onChange: (v: EditableMenuItem) => void; footer: React.ReactNode }) {
  return (
    <>
      <div className="grid gap-3">
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div className="grid gap-1.5">
            <Label>Image</Label>
            <Input className="text-center text-2xl h-14" value={value.emoji} onChange={(e) => onChange({ ...value, emoji: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Name</Label>
            <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Description</Label>
          <Textarea rows={2} value={value.description ?? ""} onChange={(e) => onChange({ ...value, description: e.target.value })} placeholder="Short description shown on the menu card" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-1.5">
            <Label>Category</Label>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })}>
              {categories.filter((c) => c.id !== "all").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Price ₹</Label>
            <Input type="number" value={value.price} onChange={(e) => onChange({ ...value, price: +e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>GST %</Label>
            <Input type="number" value={value.gst} onChange={(e) => onChange({ ...value, gst: +e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border bg-secondary/40 p-3">
          <div>
            <Label className="font-medium">In stock</Label>
            <p className="text-xs text-muted-foreground">Out of stock dishes are hidden from billing.</p>
          </div>
          <Switch checked={value.inStock} onCheckedChange={(v) => onChange({ ...value, inStock: v })} />
        </div>
      </div>
      {footer}
    </>
  );
}

function AddDishForm({ onAdd, onCancel }: { onAdd: (item: Omit<EditableMenuItem, "id">) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<EditableMenuItem>({
    id: "tmp", name: "", category: "mains", price: 0, veg: true, emoji: "🍽️", description: "", gst: 5, inStock: true,
  });
  return (
    <DishForm
      value={draft}
      onChange={setDraft}
      footer={
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() => {
              if (!draft.name.trim()) { toast.error("Name is required"); return; }
              const { id, ...rest } = draft; void id;
              onAdd(rest);
            }}
          >
            Add dish
          </Button>
        </DialogFooter>
      }
    />
  );
}
