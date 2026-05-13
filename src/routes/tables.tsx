import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { Minus, Plus, Users, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore, type TableStatus } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/tables")({
  head: () => ({
    meta: [
      { title: "Tables · Harvest POS" },
      { name: "description", content: "Floor plan view of restaurant tables — set status, seated guests and reservation time." },
    ],
  }),
  component: TablesPage,
});

const statusStyle: Record<TableStatus, { ring: string; chip: string; dot: string; label: string; gradient: string }> = {
  available: { ring: "ring-leaf/40", chip: "bg-leaf/15 text-leaf", dot: "bg-leaf", label: "Available", gradient: "from-leaf/15 to-cream" },
  occupied: { ring: "ring-primary/50", chip: "bg-primary/10 text-primary", dot: "bg-primary", label: "Occupied", gradient: "from-primary/15 to-cream" },
  reserved: { ring: "ring-warning/50", chip: "bg-warning/15 text-warning", dot: "bg-warning", label: "Reserved", gradient: "from-warning/15 to-cream" },
};

function TablesPage() {
  const tables = useStore((s) => s.tables);
  const setStatus = useStore((s) => s.setTableStatus);
  const setOccupied = useStore((s) => s.setTableOccupied);
  const setReservation = useStore((s) => s.setTableReservation);

  const counts = useMemo(
    () => ({
      available: tables.filter((t) => t.status === "available").length,
      occupied: tables.filter((t) => t.status === "occupied").length,
      reserved: tables.filter((t) => t.status === "reserved").length,
    }),
    [tables],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title="Floor Plan" subtitle={`${tables.length} tables · ${counts.occupied} active right now`} />

      <div className="flex-1 space-y-5 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {(["available", "occupied", "reserved"] as TableStatus[]).map((s) => (
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
                      {(["available", "occupied", "reserved"] as TableStatus[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setStatus(t.id, opt);
                            toast.success(`${t.id} → ${statusStyle[opt].label}`);
                          }}
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
                  {t.status === "reserved" && t.reservedAt && (
                    <span className="inline-flex items-center gap-1 text-warning">
                      <CalendarClock className="size-3.5" />
                      {new Date(t.reservedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {t.status === "reserved" ? (
                  <ReservationEditor
                    tableId={t.id}
                    reservedAt={t.reservedAt}
                    reservedName={t.reservedName}
                    onSave={(at, name) => setReservation(t.id, at, name)}
                  />
                ) : (
                  <div className="rounded-2xl border bg-secondary/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Seated guests</span>
                      <span className="text-[10px] text-muted-foreground">max {t.seats}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="icon" variant="outline" className="size-8 rounded-full" onClick={() => setOccupied(t.id, t.occupied - 1)} disabled={t.occupied === 0}>
                        <Minus className="size-3.5" />
                      </Button>
                      <div className="flex-1 text-center font-display text-xl font-semibold">
                        {t.occupied}<span className="text-sm font-normal text-muted-foreground"> / {t.seats}</span>
                      </div>
                      <Button size="icon" variant="outline" className="size-8 rounded-full" onClick={() => setOccupied(t.id, t.occupied + 1)} disabled={t.occupied >= t.seats}>
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReservationEditor({
  tableId,
  reservedAt,
  reservedName,
  onSave,
}: {
  tableId: string;
  reservedAt?: string;
  reservedName?: string;
  onSave: (at?: string, name?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(reservedAt ?? "");
  const [name, setName] = useState(reservedName ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setAt(reservedAt ?? "");
          setName(reservedName ?? "");
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="rounded-2xl border bg-warning/10 p-3 text-left transition hover:bg-warning/15">
          <p className="text-[10px] font-medium uppercase tracking-wider text-warning">Reservation</p>
          {reservedAt ? (
            <>
              <p className="mt-1 font-display text-base font-semibold">
                {new Date(reservedAt).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
              {reservedName && <p className="text-xs text-muted-foreground">For {reservedName}</p>}
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Tap to set reservation time</p>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Reservation for {tableId}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Date & time</Label>
            <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Guest name (optional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mehta family" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!at) {
                toast.error("Pick a time");
                return;
              }
              onSave(at, name || undefined);
              setOpen(false);
              toast.success("Reservation saved");
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
