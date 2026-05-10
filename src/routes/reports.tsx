import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./coming-soon";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · Harvest POS" }, { name: "description", content: "Sales, GST and expense reports." }] }),
  component: () => (
    <ComingSoon title="Reports & Exports" description="Generate sales, GST and expense reports — export as PDF or CSV." />
  ),
});
