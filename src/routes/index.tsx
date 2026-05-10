import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  IndianRupee,
  Receipt,
  Users,
  UtensilsCrossed,
  ChefHat,
  Clock,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryShare, salesWeek, topItems } from "@/lib/pos-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Harvest POS" },
      { name: "description", content: "Live revenue, orders, kitchen and inventory analytics for your vegetarian restaurant." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Today's Revenue", value: "₹ 31,240", delta: "+12.4%", icon: IndianRupee, tone: "primary" as const },
  { label: "Orders", value: "138", delta: "+8.1%", icon: Receipt, tone: "leaf" as const },
  { label: "Avg. Order Value", value: "₹ 226", delta: "+3.2%", icon: UtensilsCrossed, tone: "warning" as const },
  { label: "Active Customers", value: "412", delta: "+24", icon: Users, tone: "primary" as const },
];

const liveOrders = [
  { id: "ORD-2041", table: "T5", items: 4, total: 920, status: "Preparing", mins: 4 },
  { id: "ORD-2042", table: "T2", items: 3, total: 480, status: "Preparing", mins: 9 },
  { id: "ORD-2043", table: "TA", items: 6, total: 1180, status: "Ready", mins: 14 },
  { id: "ORD-2044", table: "DL", items: 5, total: 760, status: "Preparing", mins: 18 },
];

const chartColors = ["var(--primary)", "var(--leaf)", "var(--warning)", "var(--chart-4)", "var(--chart-5)", "oklch(0.7 0.05 30)"];

function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Dashboard" subtitle="Sunday · 10 May 2026 · Service in progress" />

      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Hero greeting */}
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
                Sales are up <span className="font-medium text-foreground">12.4%</span> compared to last Sunday.
                Kitchen is handling <span className="font-medium text-foreground">4 live orders</span> with an average prep time of 11 min.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full" size="lg">
                <Receipt className="mr-2 size-4" /> New Bill
              </Button>
              <Button variant="outline" className="rounded-full" size="lg">
                <ChefHat className="mr-2 size-4" /> Open Kitchen
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden border-border/70 transition hover:shadow-soft">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{s.value}</p>
                    </div>
                    <div
                      className={
                        "flex size-11 items-center justify-center rounded-2xl " +
                        (s.tone === "primary"
                          ? "bg-primary/10 text-primary"
                          : s.tone === "leaf"
                          ? "bg-leaf/15 text-leaf"
                          : "bg-warning/15 text-warning")
                      }
                    >
                      <s.icon className="size-5" />
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2 py-1 text-xs font-medium text-leaf">
                    <ArrowUpRight className="size-3" /> {s.delta} this week
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Revenue this week</CardTitle>
                <p className="text-xs text-muted-foreground">Daily totals · ₹ INR</p>
              </div>
              <div className="flex gap-1 rounded-full bg-secondary p-1 text-xs">
                {["Day", "Week", "Month"].map((p, i) => (
                  <button
                    key={p}
                    className={
                      "rounded-full px-3 py-1 transition " +
                      (i === 1 ? "bg-background shadow-sm font-medium" : "text-muted-foreground")
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesWeek} margin={{ left: -10, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Category mix</CardTitle>
              <p className="text-xs text-muted-foreground">Share of orders today</p>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryShare}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryShare.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryShare.map((c, i) => (
                  <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs">
                    <span className="size-2 rounded-full" style={{ background: chartColors[i % chartColors.length] }} />
                    {c.name} · {c.value}%
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
              <Badge className="rounded-full bg-leaf/15 text-leaf hover:bg-leaf/15">4 active</Badge>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y">
                {liveOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-4 px-6 py-3 transition hover:bg-secondary/50">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-semibold text-primary">
                      {o.table}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{o.id}</p>
                        <Badge
                          variant="secondary"
                          className={
                            "rounded-full text-[11px] " +
                            (o.status === "Ready"
                              ? "bg-leaf/15 text-leaf"
                              : "bg-warning/15 text-warning")
                          }
                        >
                          {o.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{o.items} items · ₹ {o.total}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {o.mins} min
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Top items</CardTitle>
              <p className="text-xs text-muted-foreground">Best sellers this week</p>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={120} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="sold" fill="var(--leaf)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
