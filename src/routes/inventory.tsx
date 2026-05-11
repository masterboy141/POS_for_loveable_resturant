import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Minus, Plus, Trash2, Package, AlertTriangle, IndianRupee, Boxes } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory · Harvest POS" },
      { name: "description", content: "Track ingredients, adjust stock and monitor low-stock alerts in real time." },
    ],
  }),
  component: InventoryPage,
});

type Unit = "kg" | "g" | "L" | "ml" | "pcs";

type StockItem = {
  id: string;
  name: string;
  category: string;
  unit: Unit;
  qty: number;
  reorder: number;
  cost: number; // cost per unit (INR)
};

const seed: StockItem[] = [
  { id: "i1", name: "Paneer", category: "Dairy", unit: "kg", qty: 12, reorder: 5, cost: 320 },
  { id: "i2", name: "Tomato", category: "Vegetables", unit: "kg", qty: 24, reorder: 10, cost: 28 },
  { id: "i3", name: "Onion", category: "Vegetables", unit: "kg", qty: 30, reorder: 12, cost: 22 },
  { id: "i4", name: "Basmati Rice", category: "Grains", unit: "kg", qty: 45, reorder: 20, cost: 95 },
  { id: "i5", name: "Wheat Flour", category: "Grains", unit: "kg", qty: 18, reorder: 15, cost: 42 },
  { id: "i6", name: "Butter", category: "Dairy", unit: "kg", qty: 4, reorder: 6, cost: 480 },
  { id: "i7", name: "Milk", category: "Dairy", unit: "L", qty: 22, reorder: 10, cost: 56 },
  { id: "i8", name: "Spinach", category: "Vegetables", unit: "kg", qty: 6, reorder: 8, cost: 35 },
  { id: "i9", name: "Cumin Seeds", category: "Spices", unit: "g", qty: 850, reorder: 500, cost: 0.6 },
  { id: "i10", name: "Garam Masala", category: "Spices", unit: "g", qty: 320, reorder: 400, cost: 1.2 },
  { id: "i11", name: "Cooking Oil", category: "Pantry", unit: "L", qty: 14, reorder: 8, cost: 145 },
  { id: "i12", name: "Mango Pulp", category: "Pantry", unit: "L", qty: 5, reorder: 4, cost: 180 },
];

const categoryColors: Record<string, string> = {
  Dairy: "bg-primary/10 text-primary",
  Vegetables: "bg-leaf/15 text-leaf",
  Grains: "bg-warning/15 text-warning",
  Spices: "bg-accent/40 text-foreground",
  Pantry: "bg-secondary text-foreground",
};

function InventoryPage() {
  const [items, setItems] = useState<StockItem[]>(seed);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<StockItem, "id">>({
    name: "",
    category: "Vegetables",
    unit: "kg",
    qty: 0,
    reorder: 0,
    cost: 0,
  });

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.category.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  const totals = useMemo(() => {
    const value = items.reduce((s, i) => s + i.qty * i.cost, 0);
    const low = items.filter((i) => i.qty <= i.reorder).length;
    return { value, low, count: items.length };
  }, [items]);

  const adjust = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, +(i.qty + delta).toFixed(2)) } : i)),
    );
  };

  const setQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)));
  };

  const setCost = (id: string, cost: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cost: Math.max(0, cost) } : i)));
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item removed");
  };

  const addItem = () => {
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const id = "i" + Math.random().toString(36).slice(2, 8);
    setItems((prev) => [{ id, ...draft }, ...prev]);
    setOpen(false);
    setDraft({ name: "", category: "Vegetables", unit: "kg", qty: 0, reorder: 0, cost: 0 });
    toast.success("Item added to inventory");
  };

  const stepFor = (unit: Unit) => (unit === "g" || unit === "ml" ? 50 : 1);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Inventory & Stock" subtitle={`${totals.count} items tracked · ${totals.low} need reorder`} />

      <div className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile icon={<Boxes className="size-5" />} label="Total Items" value={String(totals.count)} tone="primary" />
          <StatTile icon={<IndianRupee className="size-5" />} label="Stock Value" value={`₹ ${totals.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} tone="leaf" />
          <StatTile icon={<AlertTriangle className="size-5" />} label="Low Stock" value={String(totals.low)} tone="warning" />
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-display text-lg">Stock Ledger</CardTitle>
              <p className="text-xs text-muted-foreground">Tap +/− to adjust quantity. Edit cost inline.</p>
            </div>
            <div className="flex flex-1 gap-2 sm:max-w-md">
              <Input placeholder="Search ingredients…" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-full" />
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full shrink-0"><Plus className="mr-1 size-4" /> Add</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Add inventory item</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label>Name</Label>
                      <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Cashew" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label>Category</Label>
                        <select
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          value={draft.category}
                          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                        >
                          {["Dairy", "Vegetables", "Grains", "Spices", "Pantry"].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Unit</Label>
                        <select
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                          value={draft.unit}
                          onChange={(e) => setDraft({ ...draft, unit: e.target.value as Unit })}
                        >
                          {(["kg", "g", "L", "ml", "pcs"] as Unit[]).map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-1.5">
                        <Label>Qty</Label>
                        <Input type="number" value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: +e.target.value })} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Reorder at</Label>
                        <Input type="number" value={draft.reorder} onChange={(e) => setDraft({ ...draft, reorder: +e.target.value })} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Cost / unit</Label>
                        <Input type="number" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: +e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={addItem}>Add item</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y">
              {filtered.map((it) => {
                const low = it.qty <= it.reorder;
                const value = it.qty * it.cost;
                return (
                  <div key={it.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 transition hover:bg-secondary/40 md:px-6">
                    <div className="col-span-12 flex items-center gap-3 md:col-span-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                        <Package className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{it.name}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + (categoryColors[it.category] ?? "bg-secondary")}>
                            {it.category}
                          </span>
                          {low && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              <AlertTriangle className="size-3" /> Low
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-7 flex items-center gap-2 md:col-span-3">
                      <Button size="icon" variant="outline" className="size-8 rounded-full" onClick={() => adjust(it.id, -stepFor(it.unit))}>
                        <Minus className="size-3.5" />
                      </Button>
                      <div className="flex flex-1 items-center gap-1 rounded-lg border bg-background px-2">
                        <Input
                          type="number"
                          value={it.qty}
                          onChange={(e) => setQty(it.id, +e.target.value)}
                          className="h-8 border-0 p-0 text-center font-medium shadow-none focus-visible:ring-0"
                        />
                        <span className="text-xs text-muted-foreground">{it.unit}</span>
                      </div>
                      <Button size="icon" variant="outline" className="size-8 rounded-full" onClick={() => adjust(it.id, stepFor(it.unit))}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>

                    <div className="col-span-5 md:col-span-2">
                      <Label className="text-[10px] uppercase text-muted-foreground">Cost / {it.unit}</Label>
                      <div className="flex items-center gap-1 rounded-lg border bg-background px-2">
                        <span className="text-xs text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={it.cost}
                          onChange={(e) => setCost(it.id, +e.target.value)}
                          className="h-8 border-0 p-0 text-center shadow-none focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    <div className="col-span-7 text-right md:col-span-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Value</p>
                      <p className="font-display text-base font-semibold">₹ {value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                    </div>

                    <div className="col-span-5 flex justify-end md:col-span-1">
                      <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary" onClick={() => remove(it.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">No items match your search.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "leaf" | "warning" }) {
  const toneClass =
    tone === "primary" ? "bg-primary/10 text-primary" : tone === "leaf" ? "bg-leaf/15 text-leaf" : "bg-warning/15 text-warning";
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className={"flex size-11 items-center justify-center rounded-xl " + toneClass}>{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

// keep Badge import used for tree-shaking parity with other routes
void Badge;
