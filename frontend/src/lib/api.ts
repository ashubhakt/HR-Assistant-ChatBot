// Centralized API client for HR Chatbot
// Configure base URL via VITE_API_BASE_URL (defaults to http://localhost:8080)

const BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8080";

// ---------- Types ----------
export interface KbDocument {
  fileName: string;
  docId: string;
  uploadedAt: string;
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ---------- Knowledge Base ----------
export async function uploadDocument(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE_URL}/api/knowledgebase`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.text();
}

export async function listDocuments(): Promise<KbDocument[]> {
  const res = await fetch(`${BASE_URL}/api/knowledgebase`);
  if (!res.ok) throw new Error(`Failed to load documents: ${res.status}`);
  return res.json();
}

export async function deleteDocument(docId: string): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/knowledgebase?docId=${encodeURIComponent(docId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
  return res.text();
}

// ---------- Chat ----------
export async function createConversation(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat/new`, { method: "POST" });
  if (!res.ok) throw new Error(`Create conversation failed: ${res.status}`);
  const data = (await res.json()) as { conversationId: string };
  return data.conversationId;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${BASE_URL}/api/chat`);
  if (!res.ok) throw new Error(`Failed to load conversations: ${res.status}`);
  return res.json();
}

export async function getHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  const res = await fetch(
    `${BASE_URL}/api/chat/history/${encodeURIComponent(conversationId)}`
  );
  if (!res.ok) throw new Error(`Failed to load history: ${res.status}`);
  return res.json();
}

export async function deleteConversation(
  conversationId: string
): Promise<string> {
  const body = new URLSearchParams({ conversationId });
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "DELETE",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Delete conversation failed: ${res.status}`);
  return res.text();
}

/**
 * Sends a user query and streams the assistant's response chunk-by-chunk.
 * `onChunk` is called with each decoded text chunk as it arrives.
 * Returns the full concatenated response.
 */
export async function sendChatMessage(
  conversationId: string,
  userQuery: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const body = new URLSearchParams({ conversationId, userQuery });
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok || !res.body) throw new Error(`Chat failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) {
      full += text;
      onChunk(text);
    }
  }
  const tail = decoder.decode();
  if (tail) {
    full += tail;
    onChunk(tail);
  }
  return full;
}
