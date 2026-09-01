import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUp,
  Check,
  Copy,
  Download,
  Layers,
  Link2Off,
  Pencil,
  RotateCcw,
  Share2,
  Shuffle,
  Square,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AGENTS,
  AGENT_MAP,
  STAGES,
  agentBySlash,
  type AgentId,
} from "@/lib/agents";
import { streamAgent } from "@/lib/chat-client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  parseAgentOutput,
  parseBoardSections,
  stripBoardMarkers,
} from "@/lib/parse-output";
import { getMySprint, setMySprintShared, upsertMySprint } from "@/lib/sprints";
import { useSprintStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { Artifact, BoardSection, Message, Sprint } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { StackMark } from "@/components/mark";

type Props = { sprintId: string };

export function WarRoom({ sprintId }: Props) {
  const t = useT();
  const hydrated = useSprintStore((s) => s.hydrated);
  const sprint = useSprintStore((s) => s.sprints.find((x) => x.id === sprintId));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [liveId, setLiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kickoffFailed, setKickoffFailed] = useState(false);
  const [panel, setPanel] = useState<"none" | "team" | "docs">("none");
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [triedRemote, setTriedRemote] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Keyed by sprintId — a plain boolean lock survives a sprint switch and
  // would suppress the next sprint's kickoff.
  const kickoffFor = useRef<string | null>(null);
  const fetchedFor = useRef<string | null>(null);
  const busyRef = useRef(false);
  const liveTextRef = useRef("");

  const addMessage = useSprintStore((s) => s.addMessage);
  const updateMessage = useSprintStore((s) => s.updateMessage);
  const setMessageBoard = useSprintStore((s) => s.setMessageBoard);
  const removeMessage = useSprintStore((s) => s.removeMessage);
  const addArtifacts = useSprintStore((s) => s.addArtifacts);
  const setActiveAgent = useSprintStore((s) => s.setActiveAgent);
  const markKickoff = useSprintStore((s) => s.markKickoff);
  const setStage = useSprintStore((s) => s.setStage);
  const patchSprint = useSprintStore((s) => s.patchSprint);
  const importSprint = useSprintStore((s) => s.importSprint);
  const { user } = useCurrentUserState();

  const scrollToEnd = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [sprint?.messages.length, liveText, scrollToEnd]);

  // Cross-device read path: the sprint isn't in localStorage but I'm signed
  // in — fetch my copy from the server before declaring it gone.
  useEffect(() => {
    if (!hydrated || sprint || !user) return;
    if (fetchedFor.current === sprintId) return;
    fetchedFor.current = sprintId;
    void getMySprint({ data: sprintId })
      .then((remote) => {
        if (remote) importSprint(remote);
      })
      .catch(() => {})
      .finally(() => setTriedRemote(true));
  }, [hydrated, sprint, user, sprintId, importSprint]);

  // Write-through sync while signed in: every local change is upserted after
  // a short debounce, so the other device (and any shared link) stays fresh.
  useEffect(() => {
    if (!user || !sprint) return;
    const timer = window.setTimeout(() => {
      void upsertMySprint({ data: sprint }).catch(() => {});
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [user, sprint]);

  const run = useCallback(
    async (opts: {
      agentId: AgentId;
      userText: string;
      mode?: "chat" | "board";
      recordUser?: boolean;
      kickoff?: boolean;
    }) => {
      const current = useSprintStore.getState().getSprint(sprintId);
      if (!current || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      if (opts.kickoff) setKickoffFailed(false);
      setLiveText("");
      liveTextRef.current = "";
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
      // Upload only what the server actually reads (it slices to the last 10)
      // — long sprints must not ship their whole history on every message.
      const history = snap.messages
        .filter((m) => m.id !== placeholder.id && m.content.trim())
        .slice(-10)
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
            artifacts: snap.artifacts.slice(0, 4).map((a) => ({
              title: a.title,
              kind: a.kind,
              content: a.content,
            })),
          },
          (chunk) => {
            liveTextRef.current += chunk;
            setLiveText(liveTextRef.current);
          },
          ac.signal,
        );

        if (opts.mode === "board") {
          const sections = parseBoardSections(full);
          if (sections.length > 0) {
            const arts: Omit<Artifact, "id" | "createdAt">[] = [];
            const boardSecs: BoardSection[] = [];
            let combined = "";
            for (const sec of sections) {
              const parsed = parseAgentOutput(sec.body);
              boardSecs.push({ agentId: sec.agentId, content: parsed.display });
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
            // content keeps the combined transcript (export/copy fallback);
            // boardSections drives the per-specialist card rendering.
            setMessageBoard(sprintId, placeholder.id, combined.trim(), boardSecs);
            if (arts.length) addArtifacts(sprintId, arts);
            setStage(sprintId, "plan");
          } else {
            // Fallback: never show raw :::agent: protocol markers to the user.
            const parsed = parseAgentOutput(full);
            updateMessage(
              sprintId,
              placeholder.id,
              stripBoardMarkers(parsed.display) || full,
            );
          }
        } else {
          const parsed = parseAgentOutput(full);
          updateMessage(sprintId, placeholder.id, parsed.display || full);
          if (parsed.artifacts.length) {
            addArtifacts(
              sprintId,
              parsed.artifacts.map((a) => ({ ...a, agentId: opts.agentId })),
            );
            // A produced deliverable advances the pipeline (monotonic — store).
            setStage(sprintId, AGENT_MAP[opts.agentId].stage);
          }
          if (parsed.handoff && parsed.handoff !== opts.agentId) {
            setActiveAgent(sprintId, parsed.handoff);
          }
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          // Builder pressed stop: keep partial output if any, otherwise remove
          // the empty placeholder so no ghost bubble is left behind.
          const partial = liveTextRef.current.trimEnd();
          if (partial) {
            updateMessage(sprintId, placeholder.id, `${partial}\n\n*stopped*`);
          } else {
            removeMessage(sprintId, placeholder.id);
          }
          return;
        }
        const message = err instanceof Error ? err.message : t("war.fellQuiet");
        setError(message);
        if (opts.kickoff) setKickoffFailed(true);
        updateMessage(
          sprintId,
          placeholder.id,
          t("war.couldNotReach", { message }),
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
        setLiveId(null);
        setLiveText("");
        liveTextRef.current = "";
        abortRef.current = null;
      }
    },
    [
      addArtifacts,
      addMessage,
      removeMessage,
      setActiveAgent,
      setMessageBoard,
      setStage,
      sprintId,
      t,
      updateMessage,
    ],
  );

  useEffect(() => {
    if (!hydrated || !sprint || sprint.kickoffDone) return;
    if (kickoffFor.current === sprintId) return;
    kickoffFor.current = sprintId;
    markKickoff(sprintId);
    void run({
      agentId: "conductor",
      userText: `New sprint. Briefing:\n\n${sprint.idea}`,
      recordUser: false,
      kickoff: true,
    });
  }, [hydrated, markKickoff, run, sprint, sprintId]);

  function submit() {
    const text = draft.trim();
    if (!text || busy || !sprint) return;
    setDraft("");
    const slashed = agentBySlash(text);
    if (slashed) {
      setActiveAgent(sprintId, slashed.id);
      const cleaned = text.replace(/^\/[a-z-]+\s*/i, "").trim();
      // A bare "/ceo" switches who you're talking to without sending a message.
      if (!cleaned) return;
      void run({ agentId: slashed.id, userText: cleaned });
      return;
    }
    void run({ agentId: sprint.activeAgentId, userText: text });
  }

  /**
   * Re-answer a completed agent message — same specialist by default, or any
   * other one. The triggering user message and the old answer are replaced
   * atomically so the visible conversation stays clean; the retry happens in
   * the CURRENT context (history is read fresh inside run()). Kickoff answers
   * have no stored user message, so the briefing is rebuilt instead.
   */
  function retryMessage(m: Message, asAgent?: AgentId) {
    if (busy || !sprint) return;
    const msgs = sprint.messages;
    const idx = msgs.findIndex((x) => x.id === m.id);
    if (idx < 0) return;
    const prevUser = [...msgs.slice(0, idx)].reverse().find((x) => x.role === "user");
    const userText = prevUser?.content ?? `New sprint. Briefing:\n\n${sprint.idea}`;
    const fromMessage: AgentId | undefined =
      m.agentId && Object.hasOwn(AGENT_MAP, m.agentId) ? m.agentId : undefined;
    removeMessage(sprintId, m.id);
    if (prevUser) removeMessage(sprintId, prevUser.id);
    void run({
      agentId: asAgent ?? fromMessage ?? sprint.activeAgentId,
      userText,
      recordUser: prevUser !== undefined,
    });
  }

  async function toggleShare() {
    if (!sprint || sharing) return;
    setSharing(true);
    try {
      if (sharedId) {
        await setMySprintShared({ data: { id: sprintId, shared: false } });
        setSharedId(null);
        toast.success(t("war.unshared"));
      } else {
        // Sync first so the shared copy is the current one, then mint the link.
        await upsertMySprint({ data: sprint });
        const res = await setMySprintShared({ data: { id: sprintId, shared: true } });
        setSharedId(res.shareId);
        await navigator.clipboard.writeText(`${window.location.origin}/share/${res.shareId}`);
        toast.success(t("war.shareCopied"));
      }
    } catch (err) {
      toast.error(
        t("war.shareFailed", { message: err instanceof Error ? err.message : "error" }),
      );
    } finally {
      setSharing(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
        {t("war.restoring")}
      </div>
    );
  }

  if (!sprint) {
    // Signed in and the server lookup hasn't answered yet — hold the spinner.
    if (user && !triedRemote) {
      return (
        <div className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
          {t("war.restoring")}
        </div>
      );
    }
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-2xl">{t("war.gone")}</p>
        <Link to="/" className="text-sm text-fg-muted underline-offset-4 hover:underline">
          {t("war.backToFloor")}
        </Link>
      </div>
    );
  }

  // Runtime guard for state persisted before the agentId whitelist existed.
  const active = AGENT_MAP[sprint.activeAgentId] ?? AGENT_MAP.conductor;
  const doc = sprint.artifacts.find((a) => a.id === openDoc) ?? sprint.artifacts[0];

  function copyDoc(d: Artifact) {
    void navigator.clipboard
      .writeText(`# ${d.title}\n\n${d.content}`)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  function downloadDoc(d: Artifact) {
    const blob = new Blob([`# ${d.title}\n\n${d.content}\n`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Keep CJK characters in filenames — only collapse the rest to dashes.
    a.download = `${
      d.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
        .replace(/^-+|-+$/g, "") || "artifact"
    }.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renameSprint() {
    if (!sprint) return;
    const next = window.prompt(t("war.rename"), sprint.title);
    if (next && next.trim() && next.trim() !== sprint.title) {
      patchSprint(sprintId, { title: next.trim() });
    }
  }

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
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-subtle hover:text-fg"
          onClick={renameSprint}
          aria-label={t("war.rename")}
          title={t("war.rename")}
        >
          <Pencil className="size-3.5" />
        </button>
        {user ? (
          <button
            type="button"
            disabled={sharing}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-subtle hover:bg-bg-subtle hover:text-fg disabled:opacity-40"
            onClick={() => void toggleShare()}
            aria-label={sharedId ? t("war.unshare") : t("war.share")}
            title={sharedId ? t("war.unshare") : t("war.share")}
          >
            {sharedId ? <Link2Off className="size-3.5" /> : <Share2 className="size-3.5" />}
          </button>
        ) : null}
        {/* Team sheet: available below lg, where the roster sidebar is hidden */}
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg lg:hidden"
          onClick={() => setPanel(panel === "team" ? "none" : "team")}
          aria-label={t("war.team")}
        >
          <Users className="size-4" />
        </button>
        {/* Docs sheet: available below xl, where the artifact sidebar is hidden */}
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg xl:hidden"
          onClick={() => setPanel(panel === "docs" ? "none" : "docs")}
          aria-label={t("war.artifacts")}
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
                let shown = raw;
                if (liveId === m.id) {
                  // While streaming, hide protocol blocks from the first marker
                  // onward, but keep prose before it visible — a reply must
                  // never go blank the moment an artifact block starts.
                  const markerAt = raw.search(/:::(?:agent|artifact|handoff)/);
                  if (markerAt >= 0) shown = raw.slice(0, markerAt).trimEnd();
                }
                return (
                  <li key={m.id}>
                    {m.role === "user" ? (
                      <div className="ml-8 rounded-lg bg-bg-elevated px-4 py-3 shadow-[var(--shadow-border)]">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                      </div>
                    ) : liveId !== m.id && m.boardSections && m.boardSections.length > 0 ? (
                      <BoardCards sections={m.boardSections} />
                    ) : (
                      <div className="group">
                        <AgentBubble
                          agentId={m.agentId ?? "conductor"}
                          content={shown}
                          streaming={busy && liveId === m.id && shown !== ""}
                          waiting={busy && liveId === m.id && shown === ""}
                        />
                        {!busy && liveId !== m.id && m.content ? (
                          <MessageActions
                            currentAgentId={m.agentId ?? "conductor"}
                            onRetry={() => retryMessage(m)}
                            onReanswer={(id) => retryMessage(m, id)}
                          />
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {error ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm text-danger">{error}</p>
            ) : null}
            {kickoffFailed && !busy ? (
              <div className="mx-auto mt-3 max-w-2xl">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void run({
                      agentId: "conductor",
                      userText: `New sprint. Briefing:\n\n${sprint.idea}`,
                      recordUser: false,
                      kickoff: true,
                    })
                  }
                >
                  <RotateCcw className="size-3.5" />
                  {t("war.retryKickoff")}
                </Button>
              </div>
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
                  {t("war.runBoard")}
                </Button>
                {active.id !== "conductor" ? (
                  <span className="inline-flex h-9 items-center font-mono text-[11px] text-fg-muted">
                    {t("war.talkingTo", { slash: active.slash })}
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
                  placeholder={t("war.messagePlaceholder", { name: active.name })}
                  className="min-h-[44px] max-h-40 bg-transparent py-2.5 shadow-none focus:ring-0"
                  rows={2}
                />
                {busy ? (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => abortRef.current?.abort()}
                    aria-label={t("war.stop")}
                    title={t("war.stop")}
                    className="shrink-0"
                  >
                    <Square className="size-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    disabled={!draft.trim()}
                    onClick={submit}
                    aria-label={t("war.send")}
                    className="shrink-0"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                )}
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
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-fg-subtle">{doc.kind}</p>
                  <h2 className="mt-1 font-display text-lg font-medium tracking-tight">
                    {doc.title}
                  </h2>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => copyDoc(doc)}
                    aria-label={t("war.copyMarkdown")}
                    title={t("war.copyMarkdown")}
                    className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg"
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDoc(doc)}
                    aria-label={t("war.downloadMd")}
                    title={t("war.downloadMd")}
                    className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              </div>
              <Markdown className="mt-3" text={doc.content} />
            </div>
          ) : (
            <p className="p-4 text-sm text-fg-muted">
              {t("war.artifactsHint")}
            </p>
          )}
        </aside>
      </div>

      {panel !== "none" ? (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-bg/70",
            panel === "team" ? "lg:hidden" : "xl:hidden",
          )}
          onClick={() => setPanel("none")}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg">
                {panel === "team" ? t("war.team") : t("war.artifacts")}
              </p>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center"
                onClick={() => setPanel("none")}
                aria-label={t("war.close")}
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
                {doc ? (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => copyDoc(doc)}
                        aria-label={t("war.copyMarkdown")}
                        title={t("war.copyMarkdown")}
                        className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg"
                      >
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDoc(doc)}
                        aria-label={t("war.downloadMd")}
                        title={t("war.downloadMd")}
                        className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg"
                      >
                        <Download className="size-3.5" />
                      </button>
                    </div>
                    <Markdown text={doc.content} />
                  </div>
                ) : null}
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

export function Briefing({ idea }: { idea: string }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl rounded-lg px-1">
      <p className="font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">
        {t("war.briefing")}
      </p>
      <p className="mt-2 font-display text-2xl font-medium leading-snug tracking-tight md:text-3xl">
        {idea}
      </p>
    </div>
  );
}

export function AgentBubble({
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
  const t = useT();
  // Fallback for messages persisted before the agentId whitelist existed.
  const agent = AGENT_MAP[agentId] ?? AGENT_MAP.conductor;
  return (
    <div>
      <p className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-fg-subtle">{agent.initials}</span>
        <span className="text-sm font-medium">{agent.name}</span>
        <span className="text-[12px] text-fg-muted">{agent.role}</span>
      </p>
      {waiting ? (
        <p className="shimmer font-mono text-[13px]">{t("war.thinking")}</p>
      ) : (
        <Markdown text={content} className={streaming ? "opacity-90" : undefined} />
      )}
    </div>
  );
}

function MessageActions({
  currentAgentId,
  onRetry,
  onReanswer,
}: {
  currentAgentId: AgentId;
  onRetry: () => void;
  onReanswer: (id: AgentId) => void;
}) {
  const t = useT();
  const [picking, setPicking] = useState(false);
  return (
    <div className="mt-2">
      {/* Always visible on touch, hover-revealed on desktop. */}
      <div className="flex gap-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 font-mono text-[11px] text-fg-subtle hover:bg-bg-subtle hover:text-fg"
        >
          <RotateCcw className="size-3" />
          {t("war.retry")}
        </button>
        <button
          type="button"
          onClick={() => setPicking((p) => !p)}
          aria-expanded={picking}
          className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 font-mono text-[11px] text-fg-subtle hover:bg-bg-subtle hover:text-fg"
        >
          <Shuffle className="size-3" />
          {t("war.answerAs")}
        </button>
      </div>
      {picking ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {AGENTS.filter((a) => a.id !== currentAgentId).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onReanswer(a.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 font-mono text-[11px] text-fg-muted shadow-[var(--shadow-border)] hover:text-fg hover:shadow-[var(--shadow-border-hover)]"
            >
              <span className="text-fg-subtle">{a.initials}</span>
              {a.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BoardCards({ sections }: { sections: BoardSection[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sections.map((sec, i) => {
        const agent = AGENT_MAP[sec.agentId] ?? AGENT_MAP.conductor;
        return (
          <article
            key={`${sec.agentId}-${i}`}
            className="rounded-lg bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
          >
            <p className="mb-2 flex items-baseline gap-2">
              <span className="font-mono text-[11px] text-fg-subtle">{agent.initials}</span>
              <span className="text-sm font-medium">{agent.name}</span>
              <span className="text-[12px] text-fg-muted">{agent.role}</span>
            </p>
            <Markdown text={sec.content} />
          </article>
        );
      })}
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
  const t = useT();
  const items = useMemo(() => artifacts, [artifacts]);
  if (items.length === 0) {
    return (
      <p className="p-4 text-sm text-fg-muted">{t("war.noArtifacts")}</p>
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
