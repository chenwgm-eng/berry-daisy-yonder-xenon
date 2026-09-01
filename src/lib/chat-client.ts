import type { AgentId } from "./agents";
import type { Artifact, Message } from "./types";

export type ChatRequest = {
  agentId: AgentId;
  mode: "chat" | "board";
  idea: string;
  messages: Pick<Message, "role" | "content" | "agentId">[];
  artifacts: Pick<Artifact, "title" | "kind" | "content">[];
};

export async function streamAgent(
  req: ChatRequest,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) detail = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (!res.body) throw new Error("No response stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (!line || line === "[DONE]") continue;
      try {
        const json = JSON.parse(line) as { text?: string; error?: string };
        if (json.error) throw new Error(json.error);
        if (json.text) {
          full += json.text;
          onDelta(json.text);
        }
      } catch (err) {
        if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
          if (err instanceof SyntaxError) continue;
          throw err;
        }
      }
    }
  }

  return full;
}
