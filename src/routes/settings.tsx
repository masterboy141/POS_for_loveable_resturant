import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./coming-soon";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Harvest POS" }, { name: "description", content: "Restaurant, tax and staff settings." }] }),
  component: () => (
    <ComingSoon title="Settings" description="Configure restaurant details, GST, printers, roles and integrations." />
  ),
});
