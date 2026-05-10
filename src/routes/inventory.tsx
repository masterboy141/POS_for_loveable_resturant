import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./coming-soon";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory · Harvest POS" }, { name: "description", content: "Stock and ingredient tracking." }] }),
  component: () => (
    <ComingSoon title="Inventory & Stock" description="Track ingredients, get low-stock alerts and auto-deduct on every order." />
  ),
});
