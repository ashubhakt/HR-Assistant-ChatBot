import { createFileRoute } from "@tanstack/react-router";
import { AdminScreen } from "@/components/AdminScreen";

export const Route = createFileRoute("/_layout/admin")({
  head: () => ({
    meta: [
      { title: "HR Assistant — Admin" },
      { name: "description", content: "Manage the HR knowledge base documents." },
    ],
  }),
  component: AdminScreen,
});
