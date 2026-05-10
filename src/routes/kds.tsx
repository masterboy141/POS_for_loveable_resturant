import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Soup, Bike, ShoppingBag, Utensils } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initialKdsOrders, type KdsOrder } from "@/lib/pos-data";
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

const typeStyles: Record<KdsOrder["type"], { icon: typeof Soup; color: string }> = {
  "Dine-in": { icon: Utensils, color: "bg-primary/10 text-primary" },
  Takeaway: { icon: ShoppingBag, color: "bg-warning/15 text-warning" },
  Delivery: { icon: Bike, color: "bg-leaf/15 text-leaf" },
};

function KDS() {
  const [orders, setOrders] = useState<KdsOrder[]>(initialKdsOrders);
  const [filter, setFilter] = useState<"all" | KdsOrder["type"]>("all");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  function advance(id: string) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        if (o.status === "Preparing") return { ...o, status: "Ready" };
        if (o.status === "Ready") {
          toast.success(`${o.id} marked served`);
          return { ...o, status: "Served" };
        }
        return o;
      }),
    );
  }

  const visible = orders.filter((o) => o.status !== "Served" && (filter === "all" || o.type === filter));

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
              const minsAgo = Math.floor(o.placedAt / 60_000) + tick * 0; // tick used to retrigger render
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
                        Table <span className="font-medium text-foreground">{o.table}</span>
                      </p>
                    </div>
                    <Badge className={"rounded-full border-0 " + T.color}>
                      <T.icon className="mr-1 size-3" /> {o.type}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-2 p-4">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary/50 p-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-background font-display text-sm font-semibold">
                          ×{it.qty}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{it.name}</p>
                          {it.note && <p className="text-xs italic text-warning">⚠ {it.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t bg-background p-3">
                    <div
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium " +
                        (delayed
                          ? "bg-destructive/10 text-destructive"
                          : o.status === "Ready"
                          ? "bg-leaf/15 text-leaf"
                          : "bg-warning/15 text-warning")
                      }
                    >
                      <Clock className="size-3" /> {minsAgo}m · {o.status}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => advance(o.id)}
                      className={
                        "rounded-full " +
                        (o.status === "Ready"
                          ? "bg-leaf text-primary-foreground hover:bg-leaf/90"
                          : "")
                      }
                    >
                      {o.status === "Preparing" ? (
                        <>
                          <Soup className="mr-1.5 size-4" /> Mark Ready
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-1.5 size-4" /> Mark Served
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
