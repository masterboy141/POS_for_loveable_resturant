import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Soup, Bike, ShoppingBag, Utensils, ChevronDown, Circle, StickyNote } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore, type Order, type OrderStatus } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/kds")({
  head: () => ({
    meta: [
      { title: "Kitchen Display · Harvest POS" },
      { name: "description", content: "Live kitchen display system for chefs — track preparing, ready and served orders." },
    ],
  }),
  component: KDS,
});

const typeStyles: Record<Order["type"], { icon: typeof Soup; color: string }> = {
  "Dine-in": { icon: Utensils, color: "bg-primary/10 text-primary" },
  Takeaway: { icon: ShoppingBag, color: "bg-warning/15 text-warning" },
  Delivery: { icon: Bike, color: "bg-leaf/15 text-leaf" },
};

const statusStyle: Record<OrderStatus, string> = {
  Preparing: "bg-warning/15 text-warning",
  Ready: "bg-leaf/15 text-leaf",
  Served: "bg-secondary text-foreground",
  Paid: "bg-primary/10 text-primary",
};

function KDS() {
  const orders = useStore((s) => s.orders);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const [filter, setFilter] = useState<"all" | Order["type"]>("all");
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const visible = orders.filter(
    (o) => o.status !== "Paid" && o.status !== "Served" && (filter === "all" || o.type === filter),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Kitchen Display" subtitle={`${visible.length} active tickets · auto-refresh on`} />

      <div className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "Dine-in", "Takeaway", "Delivery"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-full px-4 py-2 text-sm font-medium transition " +
                (filter === f
                  ? "gradient-brand text-primary-foreground shadow-soft"
                  : "border border-border bg-card hover:bg-secondary")
              }
            >
              {f === "all" ? "All orders" : f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-leaf" /> Synced just now
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence>
            {visible.map((o) => {
              const minsAgo = Math.max(0, Math.floor((Date.now() - o.placedAt) / 60_000));
              const delayed = minsAgo >= 12 && o.status === "Preparing";
              const T = typeStyles[o.type];
              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={
                    "flex flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition " +
                    (delayed ? "ring-2 ring-destructive/60" : "")
                  }
                >
                  <div className="flex items-center justify-between border-b bg-gradient-to-r from-secondary/60 to-card p-4">
                    <div>
                      <p className="font-display text-lg font-semibold tracking-tight">{o.id}</p>
                      <p className="text-xs text-muted-foreground">
                        Table <span className="font-medium text-foreground">{o.channel}</span>
                      </p>
                    </div>
                    <Badge className={"rounded-full border-0 " + T.color}>
                      <T.icon className="mr-1 size-3" /> {o.type}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-2 p-4">
                    {o.lines.map((it) => (
                      <div key={it.itemId} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-background font-display text-sm font-semibold">
                          ×{it.qty}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{it.name}</p>
                        </div>
                      </div>
                    ))}
                    {o.note && (
                      <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
                        <StickyNote className="mt-0.5 size-3.5 shrink-0" />
                        <span className="italic">{o.note}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t bg-background p-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                      <Clock className="size-3" /> {minsAgo}m
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" className={"rounded-full " + statusStyle[o.status]}>
                          {o.status === "Preparing" ? <Soup className="mr-1.5 size-4" /> : <CheckCircle2 className="mr-1.5 size-4" />}
                          {o.status}
                          <ChevronDown className="ml-1 size-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-44 p-1.5">
                        {(["Preparing", "Ready", "Served"] as OrderStatus[]).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              setOrderStatus(o.id, opt);
                              toast.success(`${o.id} → ${opt}`);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                          >
                            {o.status === opt ? (
                              <CheckCircle2 className="size-4 text-leaf" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground" />
                            )}
                            {opt}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {visible.length === 0 && (
          <div className="rounded-3xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">
            No active tickets. Send an order from the Billing screen to see it here.
          </div>
        )}
      </div>
    </div>
  );
}
