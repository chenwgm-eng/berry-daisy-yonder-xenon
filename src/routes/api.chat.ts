import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AGENT_MAP, BOARD_AGENTS, type AgentId } from "@/lib/agents";

const MessageSchema = z.object({
  role: z.enum(["user", "agent"]),
  content: z.string().max(20_000),
  agentId: z.string().max(40).optional(),
});

const ArtifactSchema = z.object({
  title: z.string().max(200),
  kind: z.string().max(50),
  content: z.string().max(20_000),
});

const BodySchema = z.object({
  agentId: z.string().max(40).optional(),
  mode: z.enum(["chat", "board"]).optional(),
  idea: z.string().max(8_000).optional(),
  messages: z.array(MessageSchema).max(60).optional(),
  artifacts: z.array(ArtifactSchema).max(10).optional(),
});

const MAX_USER = 8000;
const MAX_HISTORY = 10;
const MAX_ARTIFACTS = 4;
const MAX_ARTIFACT_CHARS = 1200;

/** Model id is deploy-configurable; default matches the original hardcoded value. */
const XAI_MODEL = process.env.XAI_MODEL?.trim() || "grok-4.5";

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function clip(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}\n…` : s;
}

/**
 * Fetch-metadata isolation: only this app's own client (same-origin) or a
 * non-browser caller (SSR, server-to-server — no Sec-Fetch-Site header) may
 * spend the app owner's model quota. Scripted cross-site and same-site
 * sibling-tenant requests are rejected. Same semantics as
 * src/lib/auth/isolation.server.ts, applied to the route's own request object.
 */
function isScriptedCrossSite(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (!site || site === "same-origin" || site === "none") return false;
  return true;
}

/**
 * Best-effort per-client token bucket. Each serverless instance keeps its own
 * map, so this throttles casual abuse rather than a motivated attacker — pair
 * it with spend limits on the xAI side for real protection.
 */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
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
        if (isScriptedCrossSite(request)) {
          return Response.json(
            { error: "Forbidden: cross-site request blocked" },
            { status: 403 },
          );
        }

        const clientKey =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip")?.trim() ||
          "unknown";
        if (isRateLimited(clientKey)) {
          return Response.json(
            { error: "Rate limit exceeded — wait a minute and try again." },
            { status: 429 },
          );
        }

        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "AI is not available in this environment." },
            { status: 503 },
          );
        }

        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsedBody = BodySchema.safeParse(rawBody);
        if (!parsedBody.success) {
          return Response.json(
            {
              error: `Invalid request body: ${parsedBody.error.issues[0]?.message ?? "schema mismatch"}`,
            },
            { status: 400 },
          );
        }
        const body = parsedBody.data;

        const mode = body.mode === "board" ? "board" : "chat";
        // Own-key check: `in AGENT_MAP` would match prototype properties like
        // "constructor" and let a bogus agent id flow into the prompt.
        const agentId: AgentId =
          body.agentId && Object.hasOwn(AGENT_MAP, body.agentId)
            ? (body.agentId as AgentId)
            : "conductor";
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
              const who =
                m.agentId && Object.hasOwn(AGENT_MAP, m.agentId)
                  ? AGENT_MAP[m.agentId as AgentId].name
                  : "Agent";
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
          // Tie the upstream call to the client connection: when the builder
          // navigates away or presses stop, we stop paying for tokens.
          signal: request.signal,
          body: JSON.stringify({
            model: XAI_MODEL,
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
            const onClientAbort = () => {
              void reader.cancel().catch(() => {});
            };
            request.signal.addEventListener("abort", onClientAbort);
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
            } finally {
              request.signal.removeEventListener("abort", onClientAbort);
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
