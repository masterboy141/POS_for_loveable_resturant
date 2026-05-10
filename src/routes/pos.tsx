import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Search, Trash2, CreditCard, Smartphone, Wallet, QrCode, Receipt, Percent } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { categories, menu, tables, type MenuItem } from "@/lib/pos-data";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "POS Billing · Harvest POS" },
      { name: "description", content: "Touch-friendly billing with quick item search, table selection, GST, discounts and UPI." },
    ],
  }),
  component: POS,
});

type CartLine = { item: MenuItem; qty: number };

function POS() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([
    { item: menu.find((m) => m.id === "m5")!, qty: 2 },
    { item: menu.find((m) => m.id === "m9")!, qty: 4 },
  ]);
  const [table, setTable] = useState("T5");
  const [discount, setDiscount] = useState(0);
  const [pay, setPay] = useState<"upi" | "card" | "cash">("upi");

  const filtered = useMemo(
    () =>
      menu.filter(
        (m) =>
          (active === "all" || m.category === active) &&
          m.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [active, query],
  );

  function add(item: MenuItem) {
    setCart((c) => {
      const found = c.find((l) => l.item.id === item.id);
      if (found) return c.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { item, qty: 1 }];
    });
  }
  function dec(id: string) {
    setCart((c) => c.flatMap((l) => (l.item.id === id ? (l.qty <= 1 ? [] : [{ ...l, qty: l.qty - 1 }]) : [l])));
  }
  function remove(id: string) {
    setCart((c) => c.filter((l) => l.item.id !== id));
  }

  const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
  const discountAmt = Math.round((subtotal * discount) / 100);
  const taxable = subtotal - discountAmt;
  const cgst = Math.round(taxable * 0.025);
  const sgst = Math.round(taxable * 0.025);
  const total = taxable + cgst + sgst;

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="POS Billing" subtitle={`Table ${table} · ${cart.length} items in cart`} />

      <div className="grid flex-1 gap-4 p-4 md:p-6 lg:grid-cols-[1fr_420px]">
        {/* Menu */}
        <div className="flex min-h-0 flex-col gap-4">
          {/* Search & categories */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Quick search — paneer, biryani, naan…"
                className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-base"
              />
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {categories.map((c) => {
                const isActive = c.id === active;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActive(c.id)}
                    className={
                      "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition " +
                      (isActive
                        ? "border-transparent gradient-brand text-primary-foreground shadow-soft"
                        : "border-border bg-card text-foreground hover:bg-secondary")
                    }
                  >
                    <span className="text-base">{c.emoji}</span> {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((m) => (
                <motion.button
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    add(m);
                    toast.success(`${m.name} added`, { duration: 1000 });
                  }}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition hover:shadow-soft"
                >
                  <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-secondary to-cream text-5xl">
                    {m.emoji}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-leaf backdrop-blur">
                      <span className="size-1.5 rounded-full bg-leaf" /> Veg
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-1 text-sm font-semibold">{m.name}</p>
                    <p className="line-clamp-1 text-[11px] capitalize text-muted-foreground">{m.category}</p>
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="font-display text-base font-semibold">₹{m.price}</span>
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <Plus className="size-4" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Cart */}
        <Card className="flex h-full flex-col overflow-hidden rounded-3xl border shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-card to-secondary/40 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current order</p>
              <p className="font-display text-lg font-semibold">Table {table}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {tables.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTable(t.id)}
                  className={
                    "size-9 rounded-xl text-xs font-semibold transition " +
                    (table === t.id
                      ? "gradient-brand text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-accent")
                  }
                >
                  {t.id}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {cart.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
                <Receipt className="size-10 opacity-40" />
                <p className="text-sm">No items yet — tap a dish to start the bill</p>
              </div>
            )}
            <AnimatePresence>
              {cart.map((l) => (
                <motion.div
                  key={l.item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-3"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-2xl">
                    {l.item.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{l.item.price} each</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                    <button onClick={() => dec(l.item.id)} className="flex size-7 items-center justify-center rounded-full bg-background hover:bg-accent">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                    <button onClick={() => add(l.item)} className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="w-16 text-right font-display font-semibold">₹{l.item.price * l.qty}</div>
                  <button onClick={() => remove(l.item.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="space-y-3 border-t bg-gradient-to-b from-background to-secondary/40 p-4">
            <div className="flex items-center gap-2">
              <Percent className="size-4 text-muted-foreground" />
              <div className="flex flex-1 gap-1 rounded-full bg-secondary p-1">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscount(d)}
                    className={
                      "flex-1 rounded-full py-1 text-xs font-medium transition " +
                      (discount === d ? "bg-leaf text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
                    }
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={`₹ ${subtotal}`} />
              {discount > 0 && <Row label={`Discount (${discount}%)`} value={`- ₹ ${discountAmt}`} accent />}
              <Row label="CGST 2.5%" value={`₹ ${cgst}`} muted />
              <Row label="SGST 2.5%" value={`₹ ${sgst}`} muted />
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-semibold">Total</span>
                <span className="font-display text-2xl font-bold text-gradient-brand">₹ {total}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "upi", label: "UPI / QR", icon: QrCode },
                { id: "card", label: "Card", icon: CreditCard },
                { id: "cash", label: "Cash", icon: Wallet },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPay(p.id as typeof pay)}
                  className={
                    "flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-medium transition " +
                    (pay === p.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary")
                  }
                >
                  <p.icon className="size-5" />
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12 rounded-2xl">
                <Smartphone className="mr-2 size-4" /> Send link
              </Button>
              <Button
                className="h-12 rounded-2xl gradient-brand text-primary-foreground shadow-soft"
                onClick={() => toast.success(`Bill ₹${total} charged via ${pay.toUpperCase()}`)}
              >
                Charge ₹ {total}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={accent ? "font-medium text-leaf" : "font-medium"}>{value}</span>
    </div>
  );
}
