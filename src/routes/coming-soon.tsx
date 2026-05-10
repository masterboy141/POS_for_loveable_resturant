import { createFileRoute } from "@tanstack/react-router";
import { Topbar } from "@/components/Topbar";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar title={title} subtitle="Coming soon" />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border bg-card p-10 text-center shadow-soft">
          <div className="absolute -right-16 -top-16 size-56 rounded-full gradient-brand opacity-20 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 size-64 rounded-full gradient-leaf opacity-15 blur-3xl" />
          <div className="relative">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl gradient-brand text-primary-foreground shadow-soft">
              <Sparkles className="size-6" />
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
            <Button className="mt-6 rounded-full">Notify me when ready</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Make this a proper route too so /coming-soon works if linked.
export const Route = createFileRoute("/coming-soon")({
  component: () => (
    <ComingSoon title="Coming soon" description="This module is being prepared." />
  ),
});
