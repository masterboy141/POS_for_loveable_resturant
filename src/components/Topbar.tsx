import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="text-foreground" />
      <div className="hidden flex-col leading-tight md:flex">
        <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items, orders, tables…"
            className="h-10 w-72 rounded-full border-border/70 bg-secondary/60 pl-9"
          />
        </div>
        <Button size="icon" variant="ghost" className="relative rounded-full">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
        </Button>
        <div className="hidden h-10 items-center gap-2 rounded-full bg-secondary px-3 md:flex">
          <span className="size-2 rounded-full bg-success" />
          <span className="text-xs font-medium">Live · Kitchen synced</span>
        </div>
      </div>
    </header>
  );
}
