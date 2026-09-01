import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUp, Layers, Users, X } from "lucide-react";
import {
  AGENTS,
  AGENT_MAP,
  STAGES,
  agentBySlash,
  type AgentId,
} from "@/lib/agents";
import { streamAgent } from "@/lib/chat-client";
import { parseAgentOutput, parseBoardSections } from "@/lib/parse-output";
import { useSprintStore } from "@/lib/store";
import type { Artifact, Sprint } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { StackMark } from "@/components/mark";

type Props = { sprintId: string };

export function WarRoom({ sprintId }: Props) {
  const hydrated = useSprintStore((s) => s.hydrated);
  const sprint = useSprintStore((s) => s.sprints.find((x) => x.id === sprintId));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [liveId, setLiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"none" | "team" | "docs">("none");
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const kickoffLock = useRef(false);
  const busyRef = useRef(false);

  const addMessage = useSprintStore((s) => s.addMessage);
  const updateMessage = useSprintStore((s) => s.updateMessage);
  const addArtifacts = useSprintStore((s) => s.addArtifacts);
  const setActiveAgent = useSprintStore((s) => s.setActiveAgent);
  const markKickoff = useSprintStore((s) => s.markKickoff);
  const setStage = useSprintStore((s) => s.setStage);

  const scrollToEnd = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [sprint?.messages.length, liveText, scrollToEnd]);

  const run = useCallback(
    async (opts: {
      agentId: AgentId;
      userText: string;
      mode?: "chat" | "board";
      recordUser?: boolean;
    }) => {
      const current = useSprintStore.getState().getSprint(sprintId);
      if (!current || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      setLiveText("");
      setActiveAgent(sprintId, opts.agentId);

      if (opts.recordUser !== false) {
        addMessage(sprintId, { role: "user", content: opts.userText });
      }

      const placeholder = addMessage(sprintId, {
        role: "agent",
        agentId: opts.agentId,
        content: "",
      });
      setLiveId(placeholder.id);

      const snap = useSprintStore.getState().getSprint(sprintId)!;
      const ac = new AbortController();
      abortRef.current = ac;
      const history = snap.messages
        .filter((m) => m.id !== placeholder.id)
        .map((m) => ({
          role: m.role,
          content: m.content,
          agentId: m.agentId,
        }));
      if (opts.recordUser === false) {
        history.push({ role: "user", content: opts.userText, agentId: undefined });
      }

      try {
        const full = await streamAgent(
          {
            agentId: opts.agentId,
            mode: opts.mode ?? "chat",
            idea: snap.idea,
            messages: history,
            artifacts: snap.artifacts.map((a) => ({
              title: a.title,
              kind: a.kind,
              content: a.content,
            })),
          },
          (chunk) => {
            setLiveText((prev) => prev + chunk);
          },
          ac.signal,
        );

        if (opts.mode === "board") {
          const sections = parseBoardSections(full);
          if (sections.length > 0) {
            const arts: Omit<Artifact, "id" | "createdAt">[] = [];
            let combined = "";
            for (const sec of sections) {
              const parsed = parseAgentOutput(sec.body);
              combined += `## ${AGENT_MAP[sec.agentId].name}\n\n${parsed.display}\n\n`;
              for (const a of parsed.artifacts) {
                arts.push({ ...a, agentId: sec.agentId });
              }
              if (parsed.artifacts.length === 0 && parsed.display) {
                arts.push({
                  agentId: sec.agentId,
                  title: `${AGENT_MAP[sec.agentId].name} board note`,
                  kind:
                    sec.agentId === "ceo"
                      ? "ceo-review"
                      : sec.agentId === "eng"
                        ? "eng-review"
                        : sec.agentId === "design"
                          ? "design-review"
                          : "design-doc",
                  content: parsed.display,
                });
              }
            }
            updateMessage(sprintId, placeholder.id, combined.trim());
            if (arts.length) addArtifacts(sprintId, arts);
            setStage(sprintId, "plan");
          } else {
            const parsed = parseAgentOutput(full);
            updateMessage(sprintId, placeholder.id, parsed.display || full);
          }
        } else {
          const parsed = parseAgentOutput(full);
          updateMessage(sprintId, placeholder.id, parsed.display || full);
          if (parsed.artifacts.length) {
            addArtifacts(
              sprintId,
              parsed.artifacts.map((a) => ({ ...a, agentId: opts.agentId })),
            );
          }
          if (parsed.handoff && parsed.handoff !== opts.agentId) {
            setActiveAgent(sprintId, parsed.handoff);
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "The floor went quiet.";
        setError(message);
        updateMessage(
          sprintId,
          placeholder.id,
          `Could not reach the specialist. ${message}`,
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
        setLiveId(null);
        setLiveText("");
        abortRef.current = null;
      }
    },
    [
      addArtifacts,
      addMessage,
      setActiveAgent,
      setStage,
      sprintId,
      updateMessage,
    ],
  );

  useEffect(() => {
    if (!hydrated || !sprint || sprint.kickoffDone || kickoffLock.current) return;
    kickoffLock.current = true;
    markKickoff(sprintId);
    void run({
      agentId: "conductor",
      userText: `New sprint. Briefing:\n\n${sprint.idea}`,
      recordUser: false,
    });
  }, [hydrated, markKickoff, run, sprint, sprintId]);

  function submit() {
    const text = draft.trim();
    if (!text || busy || !sprint) return;
    setDraft("");
    const slashed = agentBySlash(text);
    const agentId = slashed?.id ?? sprint.activeAgentId;
    const cleaned = slashed ? text.replace(/^\/[a-z-]+\s*/i, "").trim() || text : text;
    void run({ agentId, userText: cleaned });
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
        Restoring the floor…
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-2xl">This sprint is gone.</p>
        <Link to="/" className="text-sm text-fg-muted underline-offset-4 hover:underline">
          Back to the floor
        </Link>
      </div>
    );
  }

  const active = AGENT_MAP[sprint.activeAgentId];
  const doc = sprint.artifacts.find((a) => a.id === openDoc) ?? sprint.artifacts[0];

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-5">
        <Link to="/" className="flex items-center gap-2">
          <StackMark className="size-4" />
          <span className="hidden font-mono text-[12px] sm:inline">gstack</span>
        </Link>
        <span className="text-border">/</span>
        <h1 className="min-w-0 flex-1 truncate font-display text-base font-medium tracking-tight">
          {sprint.title}
        </h1>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg md:hidden"
          onClick={() => setPanel(panel === "team" ? "none" : "team")}
          aria-label="Team"
        >
          <Users className="size-4" />
        </button>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg md:hidden"
          onClick={() => setPanel(panel === "docs" ? "none" : "docs")}
          aria-label="Artifacts"
        >
          <Layers className="size-4" />
        </button>
      </header>

      <Pipeline stage={sprint.stage} />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border lg:flex">
          <Roster
            activeId={sprint.activeAgentId}
            disabled={busy}
            onPick={(id) => setActiveAgent(sprintId, id)}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <Briefing idea={sprint.idea} />
            <ol className="mx-auto mt-8 max-w-2xl space-y-6">
              {sprint.messages.map((m) => {
                const raw = liveId === m.id ? liveText : m.content;
                const hideProto =
                  liveId === m.id && /:::(agent|artifact|handoff)/.test(raw);
                const shown = hideProto ? "" : raw;
                return (
                <li key={m.id}>
                  {m.role === "user" ? (
                    <div className="ml-8 rounded-lg bg-bg-elevated px-4 py-3 shadow-[var(--shadow-border)]">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    </div>
                  ) : (
                    <AgentBubble
                      agentId={m.agentId ?? "conductor"}
                      content={shown}
                      streaming={busy && liveId === m.id && shown !== ""}
                      waiting={busy && liveId === m.id && shown === ""}
                    />
                  )}
                </li>
                );
              })}
            </ol>
            {error ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm text-danger">{error}</p>
            ) : null}
          </div>

          <div className="border-t border-border px-3 py-3 md:px-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run({
                      agentId: "conductor",
                      userText: "Run the review board on this sprint.",
                      mode: "board",
                    })
                  }
                >
                  Run review board
                </Button>
                {active.id !== "conductor" ? (
                  <span className="inline-flex h-9 items-center font-mono text-[11px] text-fg-muted">
                    talking to {active.slash}
                  </span>
                ) : null}
              </div>
              <div className="flex items-end gap-2 rounded-lg bg-bg-elevated p-2 shadow-[var(--shadow-border)]">
                <Textarea
                  value={draft}
                  disabled={busy}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder={`Message ${active.name}…  /office-hours  /ceo  /eng`}
                  className="min-h-[44px] max-h-40 bg-transparent py-2.5 shadow-none focus:ring-0"
                  rows={2}
                />
                <Button
                  size="icon"
                  disabled={busy || !draft.trim()}
                  onClick={submit}
                  aria-label="Send"
                  className="shrink-0"
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden w-80 shrink-0 flex-col border-l border-border xl:flex">
          <ArtifactList
            artifacts={sprint.artifacts}
            selected={openDoc}
            onSelect={setOpenDoc}
          />
          {doc ? (
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-border p-4">
              <p className="font-mono text-[11px] text-fg-subtle">{doc.kind}</p>
              <h2 className="mt-1 font-display text-lg font-medium tracking-tight">{doc.title}</h2>
              <Markdown className="mt-3" text={doc.content} />
            </div>
          ) : (
            <p className="p-4 text-sm text-fg-muted">
              Artifacts land here when a specialist writes a review or design doc.
            </p>
          )}
        </aside>
      </div>

      {panel !== "none" ? (
        <div className="fixed inset-0 z-40 bg-bg/70 lg:hidden" onClick={() => setPanel("none")}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg">{panel === "team" ? "Team" : "Artifacts"}</p>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center"
                onClick={() => setPanel("none")}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            {panel === "team" ? (
              <Roster
                activeId={sprint.activeAgentId}
                disabled={busy}
                onPick={(id) => {
                  setActiveAgent(sprintId, id);
                  setPanel("none");
                }}
              />
            ) : (
              <div>
                <ArtifactList
                  artifacts={sprint.artifacts}
                  selected={openDoc}
                  onSelect={(id) => setOpenDoc(id)}
                />
                {doc ? <Markdown className="mt-4" text={doc.content} /> : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Pipeline({ stage }: { stage: Sprint["stage"] }) {
  const idx = STAGES.findIndex((s) => s.id === stage);
  return (
    <ol className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 py-2 md:px-5">
      {STAGES.map((s, i) => (
        <li
          key={s.id}
          className={cn(
            "flex h-8 shrink-0 items-center rounded-sm px-2 font-mono text-[11px] tracking-wide",
            i === idx ? "bg-accent text-accent-fg" : "text-fg-subtle",
            i < idx && "text-fg-muted",
          )}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}

function Roster({
  activeId,
  disabled,
  onPick,
}: {
  activeId: AgentId;
  disabled: boolean;
  onPick: (id: AgentId) => void;
}) {
  return (
    <ul className="flex flex-col p-2">
      {AGENTS.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(a.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150",
              a.id === activeId ? "bg-bg-subtle" : "hover:bg-bg-subtle/60",
            )}
          >
            <span className="mt-0.5 w-7 shrink-0 font-mono text-[11px] text-fg-subtle">
              {a.initials}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{a.name}</span>
              <span className="block truncate text-[12px] text-fg-muted">{a.role}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Briefing({ idea }: { idea: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg px-1">
      <p className="font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">Briefing</p>
      <p className="mt-2 font-display text-2xl font-medium leading-snug tracking-tight md:text-3xl">
        {idea}
      </p>
    </div>
  );
}

function AgentBubble({
  agentId,
  content,
  streaming,
  waiting,
}: {
  agentId: AgentId;
  content: string;
  streaming: boolean;
  waiting: boolean;
}) {
  const agent = AGENT_MAP[agentId];
  return (
    <div>
      <p className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-fg-subtle">{agent.initials}</span>
        <span className="text-sm font-medium">{agent.name}</span>
        <span className="text-[12px] text-fg-muted">{agent.role}</span>
      </p>
      {waiting ? (
        <p className="shimmer font-mono text-[13px]">thinking</p>
      ) : (
        <Markdown text={content} className={streaming ? "opacity-90" : undefined} />
      )}
    </div>
  );
}

function ArtifactList({
  artifacts,
  selected,
  onSelect,
}: {
  artifacts: Artifact[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const items = useMemo(() => artifacts, [artifacts]);
  if (items.length === 0) {
    return (
      <p className="p-4 text-sm text-fg-muted">No artifacts yet. Run a specialist or the board.</p>
    );
  }
  return (
    <ul className="p-2">
      {items.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => onSelect(a.id)}
            className={cn(
              "flex w-full flex-col items-start rounded-md px-3 py-2.5 text-left",
              selected === a.id ? "bg-bg-subtle" : "hover:bg-bg-subtle/60",
            )}
          >
            <span className="text-sm font-medium">{a.title}</span>
            <span className="font-mono text-[11px] text-fg-subtle">
              {a.kind} · {timeAgo(a.createdAt)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}


