import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Leaf } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categories, menu } from "@/lib/pos-data";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu Manager · Harvest POS" },
      { name: "description", content: "Manage categories, dishes, prices and availability for your vegetarian menu." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [active, setActive] = useState("all");
  const [q, setQ] = useState("");

  const list = useMemo(
    () => menu.filter((m) => (active === "all" || m.category === active) && m.name.toLowerCase().includes(q.toLowerCase())),
    [active, q],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Menu Manager" subtitle={`${menu.length} dishes · ${categories.length - 1} categories`} />

      <div className="flex-1 space-y-5 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dishes…"
              className="h-11 rounded-2xl border-border/70 bg-card pl-11"
            />
          </div>
          <Button className="h-11 rounded-2xl gradient-brand text-primary-foreground shadow-soft">
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
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-3 top-3 size-8 rounded-full opacity-0 transition group-hover:opacity-100"
                >
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
                <div className="flex items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-leaf/15 px-2 py-0.5 text-[11px] font-medium text-leaf">
                    <span className="size-1.5 rounded-full bg-leaf" /> In stock
                  </span>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                    GST 5%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
