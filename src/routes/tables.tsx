import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { tables as seedTables } from "@/lib/pos-data";
import { Minus, Plus, Users, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export const Route = createFileRoute("/tables")({
  head: () => ({
    meta: [
      { title: "Tables · Harvest POS" },
      { name: "description", content: "Floor plan view of restaurant tables — set status and seated guests in real time." },
    ],
  }),
  component: TablesPage,
});

type Status = "available" | "occupied" | "reserved";
type TableState = {
  id: string;
  number: number;
  seats: number; // capacity
  status: Status;
  occupied: number; // currently seated
};

const statusStyle: Record<Status, { ring: string; chip: string; dot: string; label: string; gradient: string }> = {
  available: { ring: "ring-leaf/40", chip: "bg-leaf/15 text-leaf", dot: "bg-leaf", label: "Available", gradient: "from-leaf/15 to-cream" },
  occupied: { ring: "ring-primary/50", chip: "bg-primary/10 text-primary", dot: "bg-primary", label: "Occupied", gradient: "from-primary/15 to-cream" },
  reserved: { ring: "ring-warning/50", chip: "bg-warning/15 text-warning", dot: "bg-warning", label: "Reserved", gradient: "from-warning/15 to-cream" },
};

function TablesPage() {
  const [tables, setTables] = useState<TableState[]>(
    seedTables.map((t) => ({ ...t, occupied: t.status === "occupied" ? Math.min(2, t.seats) : 0 })),
  );

  const counts = useMemo(
    () => ({
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
    }),
    [tables],
  );

  const setStatus = (id: string, status: Status) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (status === "occupied") {
          return { ...t, status, occupied: t.occupied || 1 };
        }
        return { ...t, status, occupied: 0 };
      }),
    );
    toast.success(`Marked ${id} as ${statusStyle[status].label}`);
  };

  const setOccupied = (id: string, delta: number) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = Math.max(0, Math.min(t.seats, t.occupied + delta));
        if (next === t.occupied && delta > 0) {
          toast.warning(`${t.id} only seats ${t.seats}`);
          return t;
        }
        // Auto sync status: 0 → available, >0 → occupied (unless reserved)
        let status: Status = t.status;
        if (next === 0 && t.status === "occupied") status = "available";
        if (next > 0 && t.status === "available") status = "occupied";
        return { ...t, occupied: next, status };
      }),
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Floor Plan" subtitle={`${tables.length} tables · ${counts.occupied} active right now`} />

      <div className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {(["available", "occupied", "reserved"] as Status[]).map((s) => (
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

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {tables.map((t) => {
            const s = statusStyle[t.status];
            return (
              <div
                key={t.id}
                className={
                  "group relative flex flex-col gap-3 rounded-3xl border bg-card p-4 shadow-sm ring-2 transition hover:-translate-y-0.5 hover:shadow-soft " +
                  s.ring
                }
              >
                <div className="flex items-start justify-between">
                  <div className={"flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-2xl font-semibold text-foreground " + s.gradient}>
                    {t.id}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition hover:opacity-80 " + s.chip}>
                        <span className={"size-1.5 rounded-full " + s.dot} /> {s.label}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-44 p-1.5">
                      {(["available", "occupied", "reserved"] as Status[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setStatus(t.id, opt)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
                        >
                          {t.status === opt ? (
                            <CheckCircle2 className="size-4 text-leaf" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground" />
                          )}
                          <span className={"size-2 rounded-full " + statusStyle[opt].dot} />
                          {statusStyle[opt].label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> Capacity {t.seats}
                  </span>
                  {t.status === "reserved" && (
                    <span className="inline-flex items-center gap-1 text-warning">
                      <CalendarClock className="size-3.5" /> Held
                    </span>
                  )}
                </div>

                <div className="rounded-2xl border bg-secondary/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Seated guests</span>
                    <span className="text-[10px] text-muted-foreground">max {t.seats}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8 rounded-full"
                      onClick={() => setOccupied(t.id, -1)}
                      disabled={t.occupied === 0}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <div className="flex-1 text-center font-display text-xl font-semibold">
                      {t.occupied}<span className="text-sm font-normal text-muted-foreground"> / {t.seats}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8 rounded-full"
                      onClick={() => setOccupied(t.id, 1)}
                      disabled={t.occupied >= t.seats}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
                    <div
                      className={"h-full transition-all " + (t.occupied >= t.seats ? "bg-primary" : "bg-leaf")}
                      style={{ width: `${(t.occupied / t.seats) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
