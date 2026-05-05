import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/ChatScreen";

export const Route = createFileRoute("/_layout/")({
  head: () => ({
    meta: [
      { title: "HR Assistant — Chat" },
      { name: "description", content: "Chat with your HR knowledge base assistant." },
    ],
  }),
  component: ChatScreen,
});
