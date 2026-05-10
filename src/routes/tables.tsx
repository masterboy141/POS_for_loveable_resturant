import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { tables } from "@/lib/pos-data";
import { Users } from "lucide-react";

export const Route = createFileRoute("/tables")({
  head: () => ({
    meta: [
      { title: "Tables · Harvest POS" },
      { name: "description", content: "Floor plan view of restaurant tables — see availability, occupancy and reservations at a glance." },
    ],
  }),
  component: TablesPage,
});

const statusStyle = {
  available: { ring: "ring-leaf/40", chip: "bg-leaf/15 text-leaf", dot: "bg-leaf", label: "Available" },
  occupied: { ring: "ring-primary/40", chip: "bg-primary/10 text-primary", dot: "bg-primary", label: "Occupied" },
  reserved: { ring: "ring-warning/50", chip: "bg-warning/15 text-warning", dot: "bg-warning", label: "Reserved" },
} as const;

function TablesPage() {
  const counts = {
    available: tables.filter((t) => t.status === "available").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Floor Plan" subtitle={`${tables.length} tables · ${counts.occupied} active right now`} />

      <div className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {(["available", "occupied", "reserved"] as const).map((s) => (
            <div key={s} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <div className={"flex size-11 items-center justify-center rounded-xl " + statusStyle[s].chip}>
                <span className={"size-3 rounded-full " + statusStyle[s].dot} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{statusStyle[s].label}</p>
                <p className="font-display text-2xl font-semibold">{counts[s]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {tables.map((t) => {
            const s = statusStyle[t.status];
            return (
              <button
                key={t.id}
                className={
                  "group flex flex-col items-center gap-2 rounded-3xl border bg-card p-5 shadow-sm ring-2 transition hover:-translate-y-0.5 hover:shadow-soft " +
                  s.ring
                }
              >
                <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-cream font-display text-3xl font-semibold text-foreground">
                  {t.id}
                </div>
                <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium " + s.chip}>
                  <span className={"size-1.5 rounded-full " + s.dot} /> {s.label}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" /> {t.seats} seats
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
