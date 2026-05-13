import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus, Plus, Search, Trash2, CreditCard, Wallet, QrCode, Receipt, Percent, ChefHat, History, Clock, CheckCircle2, StickyNote, Bike, ShoppingBag, Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { categories } from "@/lib/pos-data";
import { useStore, computeTotals, type EditableMenuItem, type Order, type PayMethod } from "@/lib/store";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "Billing · Harvest POS" },
      { name: "description", content: "Per-table billing with kitchen tickets, pending payments and order history." },
    ],
  }),
  component: BillingPage,
});

const channelTypeIcon = { "Dine-in": Utensils, Takeaway: ShoppingBag, Delivery: Bike } as const;

function BillingPage() {
  const tables = useStore((s) => s.tables);
  const channels = useMemo(() => [...tables.map((t) => t.id), "Takeaway", "Delivery"], [tables]);
  const [channel, setChannel] = useState<string>("T1");
  const [tab, setTab] = useState<"new" | "pending" | "history">("new");
  const orders = useStore((s) => s.orders);

  const pending = orders.filter((o) => o.status !== "Paid" && o.status !== "Served");
  const history = orders.filter((o) => o.status === "Paid" || o.status === "Served");

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Billing" subtitle={`${pending.length} pending · ${history.length} completed`} />

      <div className="p-4 md:p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="rounded-full">
            <TabsTrigger value="new" className="rounded-full"><Receipt className="mr-1.5 size-4" />New order</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-full"><Clock className="mr-1.5 size-4" />Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full"><History className="mr-1.5 size-4" />History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <NewOrderView channel={channel} setChannel={setChannel} channels={channels} />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <PendingView orders={pending} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <HistoryView orders={history} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// -------------------- NEW ORDER --------------------
function NewOrderView({ channel, setChannel, channels }: { channel: string; setChannel: (c: string) => void; channels: string[] }) {
  const menu = useStore((s) => s.menu);
  const cart = useStore((s) => s.carts[channel]) ?? { lines: [], note: "", discountPct: 0 };
  const addToCart = useStore((s) => s.addToCart);
  const changeQty = useStore((s) => s.changeQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const setNote = useStore((s) => s.setNote);
  const setDiscount = useStore((s) => s.setDiscount);
  const createOrder = useStore((s) => s.createOrder);

  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      menu.filter(
        (m) =>
          m.inStock &&
          (active === "all" || m.category === active) &&
          m.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [menu, active, query],
  );

  const totals = computeTotals(cart.lines, cart.discountPct);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <div className="flex min-h-0 flex-col gap-4">
        {/* Channel selector */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border bg-card p-2">
          {channels.map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition " +
                (channel === c ? "gradient-brand text-primary-foreground shadow-soft" : "bg-secondary text-foreground hover:bg-accent")
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Quick search…" className="h-12 rounded-2xl border-border/70 bg-card pl-11 text-base" />
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
                  (isActive ? "border-transparent gradient-brand text-primary-foreground shadow-soft" : "border-border bg-card hover:bg-secondary")
                }
              >
                <span className="text-base">{c.emoji}</span> {c.name}
              </button>
            );
          })}
        </div>

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
                onClick={() => { addToCart(channel, m); }}
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
                  <p className="line-clamp-1 text-[11px] capitalize text-muted-foreground">{m.category} · GST {m.gst}%</p>
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
        <div className="border-b bg-gradient-to-r from-card to-secondary/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Current cart</p>
          <p className="font-display text-lg font-semibold">{channel}</p>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {cart.lines.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <Receipt className="size-10 opacity-40" />
              <p className="text-sm">No items yet — tap a dish to start the order for {channel}</p>
            </div>
          )}
          <AnimatePresence>
            {cart.lines.map((l) => (
              <motion.div key={l.itemId} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-2xl">{l.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">₹{l.price} each</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                  <button onClick={() => changeQty(channel, l.itemId, -1)} className="flex size-7 items-center justify-center rounded-full bg-background hover:bg-accent">
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                  <button onClick={() => changeQty(channel, l.itemId, 1)} className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <div className="w-16 text-right font-display font-semibold">₹{l.price * l.qty}</div>
                <button onClick={() => removeFromCart(channel, l.itemId)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-3 border-t bg-gradient-to-b from-background to-secondary/40 p-4">
          <div className="grid gap-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><StickyNote className="size-3.5" /> Note for kitchen</label>
            <Textarea rows={2} value={cart.note} onChange={(e) => setNote(channel, e.target.value)} placeholder="e.g. Less spicy, no onion…" className="rounded-xl text-sm" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Percent className="size-4 text-muted-foreground" />
              <div className="flex flex-1 gap-1 rounded-full bg-secondary p-1">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscount(channel, d)}
                    className={"flex-1 rounded-full py-1 text-xs font-medium transition " + (cart.discountPct === d ? "bg-leaf text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    {d}%
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-full bg-secondary px-2">
                <Input
                  type="number"
                  value={cart.discountPct}
                  onChange={(e) => setDiscount(channel, +e.target.value)}
                  className="h-8 w-14 border-0 bg-transparent p-0 text-center text-sm shadow-none focus-visible:ring-0"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={`₹ ${totals.subtotal}`} />
            {totals.discount > 0 && <Row label={`Discount (${cart.discountPct}%)`} value={`- ₹ ${totals.discount}`} accent />}
            <Row label="GST" value={`₹ ${totals.tax}`} muted />
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-gradient-brand">₹ {totals.total}</span>
            </div>
          </div>

          <Button
            disabled={cart.lines.length === 0}
            onClick={() => {
              const o = createOrder(channel);
              if (o) toast.success(`Order ${o.id} sent to kitchen`);
            }}
            className="h-12 w-full rounded-2xl gradient-brand text-primary-foreground shadow-soft"
          >
            <ChefHat className="mr-2 size-4" /> Send to Kitchen
          </Button>
        </div>
      </Card>
    </div>
  );
}

// -------------------- PENDING --------------------
function PendingView({ orders }: { orders: Order[] }) {
  const [paying, setPaying] = useState<Order | null>(null);

  if (orders.length === 0) {
    return <div className="rounded-3xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">No pending orders. Send an order from the New order tab.</div>;
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((o) => {
          const T = channelTypeIcon[o.type];
          const ready = o.status === "Ready";
          const minsAgo = Math.max(0, Math.floor((Date.now() - o.placedAt) / 60_000));
          return (
            <Card key={o.id} className={"flex flex-col gap-3 rounded-3xl border p-4 shadow-sm transition " + (ready ? "ring-2 ring-leaf/50" : "")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold">{o.id}</p>
                  <p className="text-xs text-muted-foreground"><T className="mr-1 inline size-3" />{o.channel} · {o.type}</p>
                </div>
                <Badge className={"rounded-full border-0 " + (ready ? "bg-leaf/15 text-leaf" : "bg-warning/15 text-warning")}>
                  {ready ? <CheckCircle2 className="mr-1 size-3" /> : <Clock className="mr-1 size-3" />}
                  {o.status}
                </Badge>
              </div>
              <div className="space-y-1 rounded-2xl bg-secondary/50 p-3 text-sm">
                {o.lines.map((l) => (
                  <div key={l.itemId} className="flex justify-between"><span>×{l.qty} {l.name}</span><span className="text-muted-foreground">₹{l.price * l.qty}</span></div>
                ))}
              </div>
              {o.note && <p className="rounded-xl border border-warning/30 bg-warning/10 p-2 text-xs italic text-warning"><StickyNote className="mr-1 inline size-3" />{o.note}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground"><Clock className="mr-1 inline size-3" />{minsAgo}m ago</span>
                <span className="font-display text-lg font-semibold">₹ {o.totals.total}</span>
              </div>
              <Button
                disabled={!ready}
                onClick={() => setPaying(o)}
                className={"h-11 rounded-2xl " + (ready ? "gradient-brand text-primary-foreground shadow-soft" : "")}
              >
                {ready ? <>Collect Payment</> : <>Waiting for kitchen…</>}
              </Button>
            </Card>
          );
        })}
      </div>
      <PayDialog order={paying} onClose={() => setPaying(null)} />
    </>
  );
}

function PayDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const payOrder = useStore((s) => s.payOrder);
  const [method, setMethod] = useState<PayMethod>("upi");
  if (!order) return null;
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Collect ₹{order.totals.total} · {order.id}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "upi", label: "UPI / QR", icon: QrCode },
            { id: "card", label: "Card", icon: CreditCard },
            { id: "cash", label: "Cash", icon: Wallet },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setMethod(p.id as PayMethod)}
              className={"flex flex-col items-center gap-1 rounded-2xl border p-4 text-xs font-medium transition " + (method === p.id ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary")}
            >
              <p.icon className="size-5" /> {p.label}
            </button>
          ))}
        </div>
        <Button
          onClick={() => { payOrder(order.id, method); toast.success(`Paid ₹${order.totals.total} via ${method.toUpperCase()}`); onClose(); }}
          className="h-12 rounded-2xl gradient-brand text-primary-foreground shadow-soft"
        >
          Mark paid
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// -------------------- HISTORY --------------------
function HistoryView({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <div className="rounded-3xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">No completed orders yet.</div>;
  }
  return (
    <Card className="overflow-hidden rounded-3xl">
      <div className="divide-y">
        {orders.map((o) => (
          <div key={o.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3 transition hover:bg-secondary/40 md:px-6">
            <div className="col-span-6 md:col-span-3">
              <p className="font-medium">{o.id}</p>
              <p className="text-xs text-muted-foreground">{o.channel} · {o.type}</p>
            </div>
            <div className="col-span-6 md:col-span-3 text-xs text-muted-foreground">
              {o.lines.length} items · {o.lines.reduce((s, l) => s + l.qty, 0)} qty
            </div>
            <div className="col-span-6 md:col-span-2 text-xs text-muted-foreground">
              {new Date(o.paidAt ?? o.placedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="col-span-3 md:col-span-2">
              <Badge className={"rounded-full border-0 " + (o.status === "Paid" ? "bg-leaf/15 text-leaf" : "bg-secondary")}>
                {o.status}{o.payMethod ? ` · ${o.payMethod.toUpperCase()}` : ""}
              </Badge>
            </div>
            <div className="col-span-3 text-right font-display text-base font-semibold md:col-span-2">₹ {o.totals.total}</div>
          </div>
        ))}
      </div>
    </Card>
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
