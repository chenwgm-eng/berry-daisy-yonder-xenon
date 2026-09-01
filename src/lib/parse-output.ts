import type { AgentId, ArtifactKind } from "./agents.ts";
import { AGENT_MAP } from "./agents.ts";

const KINDS = new Set<ArtifactKind>([
  "design-doc",
  "ceo-review",
  "eng-review",
  "design-review",
  "qa-report",
  "security",
  "ship-plan",
  "debug-note",
  "note",
]);

export type ParsedOutput = {
  display: string;
  artifacts: { title: string; kind: ArtifactKind; content: string }[];
  handoff?: AgentId;
};

/** Own-key check — the `in` operator would match prototype props like "constructor". */
function hasAgent(id: string): id is AgentId {
  return Object.hasOwn(AGENT_MAP, id);
}

export function parseAgentOutput(raw: string): ParsedOutput {
  const artifacts: ParsedOutput["artifacts"] = [];
  let handoff: AgentId | undefined;
  let text = raw;

  // The closing fence must sit on its own line, so an artifact body may
  // contain ":::" inline without ending the block early.
  text = text.replace(
    /:::artifact[ \t]+title="([^"]+)"[ \t]+kind="([^"]+)"[ \t]*\r?\n([\s\S]*?)^:::[ \t]*(?:\r?$|\r?\n)/gim,
    (_m, title: string, kind: string, body: string) => {
      const k = kind.toLowerCase() as ArtifactKind;
      artifacts.push({
        title: title.trim(),
        kind: KINDS.has(k) ? k : "note",
        content: body.trim(),
      });
      return "";
    },
  );

  text = text.replace(/:::handoff[ \t]*\r?\n[ \t]*([a-z-]+)[ \t]*\r?\n?:::/gi, (_m, id: string) => {
    const key = id.trim().toLowerCase();
    if (hasAgent(key)) handoff = key;
    return "";
  });

  return { display: text.replace(/\n{3,}/g, "\n\n").trim(), artifacts, handoff };
}

export function parseBoardSections(raw: string): { agentId: AgentId; body: string }[] {
  // Line-based parser: a section opens on a `:::agent:<id>` line and closes on
  // a bare `:::` line. Nested `:::artifact` blocks are depth-tracked so their
  // own closing fence cannot end the section early — the previous regex-based
  // parser truncated the section at the artifact's OPENING fence, losing the
  // artifact and everything after it.
  const out: { agentId: AgentId; body: string }[] = [];
  let current: { agentId: string; lines: string[] } | null = null;
  let artifactDepth = 0;

  const flush = () => {
    if (current && hasAgent(current.agentId)) {
      const body = current.lines.join("\n").trim();
      if (body) out.push({ agentId: current.agentId, body });
    }
    current = null;
    artifactDepth = 0;
  };

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (artifactDepth === 0) {
      const open = trimmed.match(/^:::agent:([a-z-]+)$/i);
      if (open) {
        flush();
        current = { agentId: open[1]!.toLowerCase(), lines: [] };
        continue;
      }
    }
    if (!current) continue;
    if (/^:::artifact[ \t]/i.test(trimmed)) {
      artifactDepth += 1;
      current.lines.push(line);
      continue;
    }
    if (trimmed === ":::") {
      if (artifactDepth > 0) {
        artifactDepth -= 1;
        current.lines.push(line);
      } else {
        flush();
      }
      continue;
    }
    current.lines.push(line);
  }
  flush();
  return out;
}

/**
 * Remove leftover protocol markers (`:::agent:<id>` openers and bare `:::`
 * fences) from text that is shown to the user. Run AFTER parseAgentOutput —
 * artifact fences are still needed until artifacts have been extracted.
 */
export function stripBoardMarkers(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return t !== ":::" && !/^:::agent:[a-z-]+$/i.test(t);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
