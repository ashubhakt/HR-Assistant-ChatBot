import { useEffect, useRef, useState, FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Send, Trash2, MessageSquare, Loader2, Settings } from "lucide-react";
import {
  ChatMessage,
  ConversationSummary,
  createConversation,
  deleteConversation,
  getHistory,
  listConversations,
  sendChatMessage,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ChatScreen() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshConversations = async () => {
    try {
      const list = await listConversations();
      setConversations(list);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const selectConversation = async (id: string) => {
    setActiveId(id);
    setLoadingHistory(true);
    try {
      const hist = await getHistory(id);

const formatted = hist.map((m: any) => ({
  role: m.messageType,
  content: m.text,
}));

setMessages(formatted);
    } catch (e) {
      toast.error((e as Error).message);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const id = await createConversation();
      await refreshConversations();
      setActiveId(id);
      setMessages([]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.conversationId !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      toast.success("Conversation deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    let convId = activeId;
    if (!convId) {
      try {
        convId = await createConversation();
        setActiveId(convId);
        refreshConversations();
      } catch (err) {
        toast.error((err as Error).message);
        return;
      }
    }

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setSending(true);

    try {
      await sendChatMessage(convId, text, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + chunk };
          }
          return next;
        });
      });
      // Refresh title (AI-generated) after first exchange
      refreshConversations();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              HR
            </div>
            <span className="text-sm font-semibold">HR Assistant</span>
          </div>
          <Link
            to="/admin"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Admin"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
        <div className="p-3">
          <Button onClick={handleNewChat} className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => {
                const active = c.conversationId === activeId;
                return (
                  <li key={c.conversationId}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => selectConversation(c.conversationId)}
                      className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="flex-1 truncate">
                        {c.title || "Untitled"}
                      </span>
                      <button
                        onClick={(e) => handleDelete(c.conversationId, e)}
                        className="rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section className="flex flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {loadingHistory ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <MessageSquare className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">
                  Ask anything about your HR policies and documents.
                </p>
              </div>
            ) : (
              messages.map((m, i) => <Bubble key={i} message={m} />)
            )}
          </div>
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-border bg-background px-4 py-3"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {message.content || (
          <span className="inline-flex gap-1">
            <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
          </span>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
      style={{ animationDelay: delay }}
    />
  );
}
