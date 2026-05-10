import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./coming-soon";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers · Harvest POS" }, { name: "description", content: "Customer database, loyalty points and feedback." }] }),
  component: () => (
    <ComingSoon
      title="Customer Database"
      description="Manage your guest list, loyalty points, birthdays and feedback — all in one place."
    />
  ),
});
