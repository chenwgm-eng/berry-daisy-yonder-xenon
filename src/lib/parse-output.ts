import type { AgentId, ArtifactKind } from "./agents";
import { AGENT_MAP } from "./agents";

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

export function parseAgentOutput(raw: string): ParsedOutput {
  const artifacts: ParsedOutput["artifacts"] = [];
  let handoff: AgentId | undefined;
  let text = raw;

  text = text.replace(
    /:::artifact\s+title="([^"]+)"\s+kind="([^"]+)"\s*\n([\s\S]*?):::/gi,
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

  text = text.replace(/:::handoff\s*\n\s*([a-z-]+)\s*\n?:::/gi, (_m, id: string) => {
    const key = id.trim() as AgentId;
    if (key in AGENT_MAP) handoff = key;
    return "";
  });

  return { display: text.replace(/\n{3,}/g, "\n\n").trim(), artifacts, handoff };
}

export function parseBoardSections(raw: string): { agentId: AgentId; body: string }[] {
  const out: { agentId: AgentId; body: string }[] = [];
  const re = /:::agent:([a-z-]+)\s*\n([\s\S]*?):::/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const id = m[1]!.trim() as AgentId;
    if (id in AGENT_MAP) out.push({ agentId: id, body: m[2]!.trim() });
  }
  return out;
}
