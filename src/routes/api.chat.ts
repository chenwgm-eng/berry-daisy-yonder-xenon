import { createFileRoute } from "@tanstack/react-router";
import { AGENT_MAP, BOARD_AGENTS, type AgentId } from "@/lib/agents";

type IncomingMessage = {
  role: "user" | "agent";
  content: string;
  agentId?: AgentId;
};

type IncomingArtifact = {
  title: string;
  kind: string;
  content: string;
};

type Body = {
  agentId?: AgentId;
  mode?: "chat" | "board";
  idea?: string;
  messages?: IncomingMessage[];
  artifacts?: IncomingArtifact[];
};

const MAX_USER = 8000;
const MAX_HISTORY = 10;
const MAX_ARTIFACTS = 4;
const MAX_ARTIFACT_CHARS = 1200;

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function clip(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}\n…` : s;
}

function boardSystem() {
  const roster = BOARD_AGENTS.map((id) => {
    const a = AGENT_MAP[id];
    return `${a.name} (${id}): ${a.role}. ${a.blurb}`;
  }).join("\n");

  return `You are running a GStack review board. Four specialists speak in order. Stay in GStack voice: lead with the point, concrete, no em dashes, no AI filler. Reply in the user's language.

Roster:
${roster}

Output EXACTLY four blocks and nothing else around them:

:::agent:office-hours
YC office hours. Challenge the premise. Ask the most important unanswered question. Sketch the wedge. Write as if this IS the design-doc start.
:::

:::agent:ceo
CEO review. Pick a scope mode. Challenge premises. Two approaches with Completeness scores. Name the 10-star version and what to cut.
:::

:::agent:design
Designer. Score hierarchy, states, craft, slop, differentiation /10. Say what a 10 looks like on the weakest two.
:::

:::agent:eng
Eng manager. Architecture in plain language, one ASCII diagram, named failure modes, test gates. Verdict READY / READY WITH GATES / NOT READY.
:::

Each block 180–280 words. No code files. The builder decides.`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "AI is not available in this environment." },
            { status: 503 },
          );
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const mode = body.mode === "board" ? "board" : "chat";
        const agentId = (body.agentId && body.agentId in AGENT_MAP
          ? body.agentId
          : "conductor") as AgentId;
        const agent = AGENT_MAP[agentId];
        const idea = clip((body.idea ?? "").trim(), 4000);
        const history = (body.messages ?? []).slice(-MAX_HISTORY);
        const artifacts = (body.artifacts ?? []).slice(0, MAX_ARTIFACTS);

        const lastUser = [...history].reverse().find((m) => m.role === "user");
        if (lastUser && lastUser.content.length > MAX_USER) {
          lastUser.content = clip(lastUser.content, MAX_USER);
        }

        const artBlock =
          artifacts.length === 0
            ? "No artifacts yet."
            : artifacts
                .map(
                  (a) =>
                    `### ${a.title} (${a.kind})\n${clip(a.content, MAX_ARTIFACT_CHARS)}`,
                )
                .join("\n\n");

        const system =
          mode === "board"
            ? boardSystem()
            : `${agent.prompt}

Sprint briefing:
${idea || "(no briefing yet)"}

Existing artifacts:
${artBlock}

You are ${agent.name} (${agent.slash}). Stay in role.`;

        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: system },
        ];

        if (mode === "board") {
          messages.push({
            role: "user",
            content: `Run the review board on this sprint.\n\n${idea}\n\n${
              lastUser?.content && lastUser.content !== idea
                ? `Builder's latest note:\n${lastUser.content}`
                : ""
            }`,
          });
        } else {
          for (const m of history) {
            if (!m.content.trim()) continue;
            if (m.role === "user") {
              messages.push({ role: "user", content: m.content });
            } else {
              const who = m.agentId ? AGENT_MAP[m.agentId]?.name : "Agent";
              messages.push({
                role: "assistant",
                content: m.agentId && m.agentId !== agentId ? `[${who}]\n${m.content}` : m.content,
              });
            }
          }
          if (messages.filter((m) => m.role !== "system").length === 0) {
            messages.push({
              role: "user",
              content: idea || "Open this sprint.",
            });
          }
        }

        const xai = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            stream: true,
            temperature: 0.55,
            max_tokens: mode === "board" ? 2400 : 1400,
            messages,
          }),
        });

        if (!xai.ok || !xai.body) {
          const errText = await xai.text().catch(() => "");
          return Response.json(
            { error: `Model error ${xai.status}${errText ? `: ${clip(errText, 180)}` : ""}` },
            { status: 502 },
          );
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const reader = xai.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (!payload || payload === "[DONE]") continue;
                  try {
                    const json = JSON.parse(payload) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const piece = json.choices?.[0]?.delta?.content;
                    if (piece) controller.enqueue(encoder.encode(sse({ text: piece })));
                  } catch {
                    /* skip malformed chunk */
                  }
                }
              }
              controller.enqueue(encoder.encode(sse({ done: true })));
              controller.close();
            } catch (err) {
              const message = err instanceof Error ? err.message : "stream failed";
              try {
                controller.enqueue(encoder.encode(sse({ error: message })));
                controller.close();
              } catch {
                /* already closed */
              }
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});

