import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowUpRight, IndianRupee, Receipt, Users, UtensilsCrossed, Clock, TrendingUp,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore, type Order } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Harvest POS" },
      { name: "description", content: "Live revenue, orders, kitchen and inventory analytics for your vegetarian restaurant." },
    ],
  }),
  component: Dashboard,
});

const chartColors = ["var(--primary)", "var(--leaf)", "var(--warning)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.05 30)"];

type Period = "day" | "week" | "month" | "year";

function startOf(period: Period) {
  const d = new Date();
  if (period === "day") { d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (period === "week") { d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (period === "month") { d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d.getTime(); }
  d.setMonth(d.getMonth() - 11); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime();
}

function filterPaid(orders: Order[], from: number) {
  return orders.filter((o) => o.status === "Paid" && (o.paidAt ?? o.placedAt) >= from);
}

function buildRevenueSeries(orders: Order[], period: Period) {
  const now = new Date();
  if (period === "day") {
    const buckets = Array.from({ length: 12 }, (_, i) => ({ label: `${(i * 2).toString().padStart(2, "0")}h`, revenue: 0 }));
    const dayStart = startOf("day");
    for (const o of filterPaid(orders, dayStart)) {
      const h = new Date(o.paidAt ?? o.placedAt).getHours();
      buckets[Math.min(11, Math.floor(h / 2))].revenue += o.totals.total;
    }
    return buckets;
  }
  if (period === "week") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i));
      return { label: days[d.getDay()], revenue: 0 };
    });
    const from = startOf("week");
    for (const o of filterPaid(orders, from)) {
      const ts = o.paidAt ?? o.placedAt;
      const idx = 6 - Math.floor((startOf("day") + 86_400_000 - ts) / 86_400_000);
      const clamped = Math.max(0, Math.min(6, idx));
      buckets[clamped].revenue += o.totals.total;
    }
    return buckets;
  }
  if (period === "month") {
    const buckets = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (29 - i));
      return { label: `${d.getDate()}`, revenue: 0 };
    });
    const from = startOf("month");
    for (const o of filterPaid(orders, from)) {
      const ts = o.paidAt ?? o.placedAt;
      const idx = 29 - Math.floor((startOf("day") + 86_400_000 - ts) / 86_400_000);
      const clamped = Math.max(0, Math.min(29, idx));
      buckets[clamped].revenue += o.totals.total;
    }
    return buckets;
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now); d.setMonth(now.getMonth() - (11 - i));
    return { label: months[d.getMonth()], revenue: 0 };
  });
  const from = startOf("year");
  for (const o of filterPaid(orders, from)) {
    const d = new Date(o.paidAt ?? o.placedAt);
    const idx = 11 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
    const clamped = Math.max(0, Math.min(11, idx));
    buckets[clamped].revenue += o.totals.total;
  }
  return buckets;
}

function Dashboard() {
  const orders = useStore((s) => s.orders);
  const menu = useStore((s) => s.menu);
  const tables = useStore((s) => s.tables);

  const [revPeriod, setRevPeriod] = useState<Period>("week");
  const [catPeriod, setCatPeriod] = useState<Exclude<Period, "year">>("day");
  const [topPeriod, setTopPeriod] = useState<Exclude<Period, "day">>("week");

  const revenueSeries = useMemo(() => buildRevenueSeries(orders, revPeriod), [orders, revPeriod]);

  const todayPaid = useMemo(() => filterPaid(orders, startOf("day")), [orders]);
  const todayRevenue = todayPaid.reduce((s, o) => s + o.totals.total, 0);
  const todayOrders = todayPaid.length;
  const aov = todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;
  const activeTables = tables.filter((t) => t.status === "occupied").length;

  const stats = [
    { label: "Today's Revenue", value: `₹ ${todayRevenue.toLocaleString("en-IN")}`, sub: `${todayOrders} paid`, icon: IndianRupee, tone: "primary" as const },
    { label: "Orders Today", value: `${todayOrders}`, sub: "All channels", icon: Receipt, tone: "leaf" as const },
    { label: "Avg. Order Value", value: `₹ ${aov}`, sub: "Per bill", icon: UtensilsCrossed, tone: "warning" as const },
    { label: "Active Tables", value: `${activeTables}`, sub: `of ${tables.length}`, icon: Users, tone: "primary" as const },
  ];

  // Category share
  const categoryShare = useMemo(() => {
    const from = startOf(catPeriod);
    const counts: Record<string, number> = {};
    for (const o of filterPaid(orders, from)) {
      for (const l of o.lines) {
        const cat = menu.find((m) => m.id === l.itemId)?.category ?? "other";
        counts[cat] = (counts[cat] ?? 0) + l.qty;
      }
    }
    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    if (total === 0) return [{ name: "No sales yet", value: 1, pct: 0 }];
    return Object.entries(counts)
      .map(([name, n]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: n, pct: Math.round((n / total) * 100) }))
      .sort((a, b) => b.value - a.value);
  }, [orders, menu, catPeriod]);

  // Top items
  const topItems = useMemo(() => {
    const from = startOf(topPeriod);
    const agg: Record<string, { name: string; sold: number; revenue: number }> = {};
    for (const o of filterPaid(orders, from)) {
      for (const l of o.lines) {
        const k = l.itemId;
        agg[k] ??= { name: l.name, sold: 0, revenue: 0 };
        agg[k].sold += l.qty;
        agg[k].revenue += l.price * l.qty;
      }
    }
    return Object.values(agg).sort((a, b) => b.sold - a.sold).slice(0, 6);
  }, [orders, topPeriod]);

  const revenueTotal = revenueSeries.reduce((s, x) => s + x.revenue, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Dashboard" subtitle="Live service overview · synced with billing" />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Hero greeting — CTAs removed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-soft md:p-8"
        >
          <div className="absolute -right-16 -top-16 size-64 rounded-full gradient-brand opacity-20 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 size-72 rounded-full gradient-leaf opacity-15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <Badge className="mb-3 rounded-full bg-leaf/15 text-leaf hover:bg-leaf/15">
                <span className="mr-1 size-1.5 rounded-full bg-leaf" /> 100% Pure Vegetarian
              </Badge>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Good evening, <span className="text-gradient-brand">Aarav</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {todayOrders > 0
                  ? <>You've collected <span className="font-medium text-foreground">₹{todayRevenue.toLocaleString("en-IN")}</span> across <span className="font-medium text-foreground">{todayOrders}</span> bills today.</>
                  : <>No paid bills yet today — fire up the first order from <span className="font-medium text-foreground">Billing</span>.</>}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden border-border/70 transition hover:shadow-soft">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{s.value}</p>
                    </div>
                    <div className={"flex size-11 items-center justify-center rounded-2xl " + (s.tone === "primary" ? "bg-primary/10 text-primary" : s.tone === "leaf" ? "bg-leaf/15 text-leaf" : "bg-warning/15 text-warning")}>
                      <s.icon className="size-5" />
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
                    <ArrowUpRight className="size-3" /> {s.sub}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue + Category mix */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            <CardHeader className="flex flex-row items-end justify-between gap-3">
              <div>
                <CardTitle className="font-display text-lg">Revenue overview</CardTitle>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-semibold tracking-tight text-gradient-brand">
                    ₹ {revenueTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-medium text-leaf">
                    <TrendingUp className="size-3" /> Live from billing
                  </span>
                </div>
              </div>
              <PeriodToggle value={revPeriod} onChange={setRevPeriod} options={["day", "week", "month", "year"]} />
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries} margin={{ left: -10, right: 10, top: 10 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                    <RTooltip
                      formatter={(v: number) => [`₹ ${v.toLocaleString("en-IN")}`, "Revenue"]}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="font-display text-lg">Share of orders</CardTitle>
                <p className="text-xs text-muted-foreground">By menu category</p>
              </div>
              <PeriodToggle value={catPeriod} onChange={setCatPeriod} options={["day", "week", "month"]} labels={{ day: "Today", week: "Week", month: "Month" }} />
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryShare} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {categoryShare.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(_v: number, _n, p: { payload?: { pct?: number; name?: string; value?: number } }) =>
                        [`${p.payload?.value ?? 0} sold · ${p.payload?.pct ?? 0}%`, p.payload?.name ?? ""]
                      }
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {categoryShare.map((c, i) => (
                  <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs">
                    <span className="size-2 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                    {c.name} · {c.pct}%
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live orders + top items */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Live orders</CardTitle>
                <p className="text-xs text-muted-foreground">Synced with kitchen in real time</p>
              </div>
              <Badge className="rounded-full bg-leaf/15 text-leaf hover:bg-leaf/15">
                {orders.filter((o) => o.status === "Preparing" || o.status === "Ready").length} active
              </Badge>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y">
                {orders.filter((o) => o.status === "Preparing" || o.status === "Ready").slice(0, 6).map((o) => {
                  const mins = Math.max(0, Math.floor((Date.now() - o.placedAt) / 60_000));
                  return (
                    <div key={o.id} className="flex items-center gap-4 px-6 py-3 transition hover:bg-secondary/50">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-semibold text-primary">
                        {o.channel}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{o.id}</p>
                          <Badge variant="secondary" className={"rounded-full text-[11px] " + (o.status === "Ready" ? "bg-leaf/15 text-leaf" : "bg-warning/15 text-warning")}>
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{o.lines.length} items · ₹ {o.totals.total}</p>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {mins} min
                      </div>
                    </div>
                  );
                })}
                {orders.filter((o) => o.status === "Preparing" || o.status === "Ready").length === 0 && (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">No active tickets right now.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="font-display text-lg">Top items</CardTitle>
                <p className="text-xs text-muted-foreground">Best sellers</p>
              </div>
              <PeriodToggle value={topPeriod} onChange={setTopPeriod} options={["week", "month", "year"]} />
            </CardHeader>
            <CardContent className="h-72">
              {topItems.length === 0 ? (
                <p className="grid h-full place-items-center text-sm text-muted-foreground">No paid orders in this range.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={120} />
                    <RTooltip
                      formatter={(v: number, n) => n === "sold" ? [`${v} sold`, "Quantity"] : [`₹ ${v}`, n]}
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="sold" fill="var(--leaf)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PeriodToggle<T extends string>({
  value, onChange, options, labels,
}: { value: T; onChange: (v: T) => void; options: readonly T[]; labels?: Partial<Record<T, string>> }) {
  return (
    <div className="flex gap-1 rounded-full bg-secondary p-1 text-xs">
      {options.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={"rounded-full px-3 py-1 capitalize transition " + (value === p ? "bg-background shadow-sm font-medium" : "text-muted-foreground")}
        >
          {labels?.[p] ?? p}
        </button>
      ))}
    </div>
  );
}
