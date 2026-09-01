import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "sonner";
import type { AgentId, StageId } from "./agents";
import { AGENT_MAP, STAGES } from "./agents";
import { t } from "./i18n";
import type { Artifact, BoardSection, Message, Sprint } from "./types";
import { uid } from "./utils";

type State = {
  hydrated: boolean;
  sprints: Sprint[];
  markHydrated: () => void;
  createSprint: (idea: string) => Sprint;
  deleteSprint: (id: string) => void;
  togglePin: (id: string) => void;
  /** Insert a sprint from the server, replacing the local copy only when the incoming one is newer (last-write-wins by updatedAt). */
  importSprint: (sprint: Sprint) => void;
  getSprint: (id: string) => Sprint | undefined;
  patchSprint: (id: string, patch: Partial<Sprint>) => void;
  addMessage: (sprintId: string, msg: Omit<Message, "id" | "createdAt"> & { id?: string }) => Message;
  updateMessage: (sprintId: string, messageId: string, content: string) => void;
  setMessageBoard: (
    sprintId: string,
    messageId: string,
    content: string,
    sections: BoardSection[],
  ) => void;
  removeMessage: (sprintId: string, messageId: string) => void;
  addArtifacts: (
    sprintId: string,
    items: Omit<Artifact, "id" | "createdAt">[],
  ) => void;
  setActiveAgent: (sprintId: string, agentId: AgentId) => void;
  setStage: (sprintId: string, stage: StageId) => void;
  markKickoff: (sprintId: string) => void;
};

const STAGE_IDS = new Set<StageId>(STAGES.map((s) => s.id));

function titleFromIdea(idea: string) {
  const line = idea.trim().split(/\n/)[0] ?? "Untitled sprint";
  return line.length > 48 ? `${line.slice(0, 46)}…` : line || "Untitled sprint";
}

/** Own-key guard: `in` matches prototype props such as "constructor". */
function isAgentId(id: unknown): id is AgentId {
  return typeof id === "string" && Object.hasOwn(AGENT_MAP, id);
}

function isStageId(id: unknown): id is StageId {
  return typeof id === "string" && STAGE_IDS.has(id as StageId);
}

/**
 * Repair persisted state from older/broken versions (e.g. a garbage
 * activeAgentId written before the whitelist guard existed, which would
 * otherwise crash the war-room header). Runs at rehydrate because the persist
 * options below declare version: 1.
 */
function sanitizePersisted(input: unknown): { sprints: Sprint[] } {
  if (!input || typeof input !== "object") return { sprints: [] };
  const raw = (input as { sprints?: unknown }).sprints;
  if (!Array.isArray(raw)) return { sprints: [] };
  const sprints: Sprint[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const sp = item as Partial<Sprint>;
    if (typeof sp.id !== "string" || typeof sp.idea !== "string") continue;
    sprints.push({
      id: sp.id,
      title: typeof sp.title === "string" && sp.title ? sp.title : titleFromIdea(sp.idea),
      idea: sp.idea,
      createdAt: typeof sp.createdAt === "number" ? sp.createdAt : Date.now(),
      updatedAt: typeof sp.updatedAt === "number" ? sp.updatedAt : Date.now(),
      stage: isStageId(sp.stage) ? sp.stage : "think",
      activeAgentId: isAgentId(sp.activeAgentId) ? sp.activeAgentId : "conductor",
      messages: Array.isArray(sp.messages) ? sp.messages : [],
      artifacts: Array.isArray(sp.artifacts) ? sp.artifacts : [],
      kickoffDone: sp.kickoffDone === true,
      pinned: sp.pinned === true,
    });
  }
  return { sprints };
}

/**
 * localStorage with a quota guard — a full store must surface as a toast, not
 * as silent data loss on every subsequent write.
 */
const guardedStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      if (typeof window !== "undefined") {
        toast.error(t("store.quotaFull"));
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const useSprintStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      sprints: [],
      markHydrated: () => set({ hydrated: true }),
      createSprint: (idea) => {
        const now = Date.now();
        const sprint: Sprint = {
          id: uid("sp"),
          title: titleFromIdea(idea),
          idea: idea.trim(),
          createdAt: now,
          updatedAt: now,
          stage: "think",
          activeAgentId: "conductor",
          messages: [],
          artifacts: [],
          kickoffDone: false,
        };
        set({ sprints: [sprint, ...get().sprints] });
        return sprint;
      },
      deleteSprint: (id) =>
        set({ sprints: get().sprints.filter((s) => s.id !== id) }),
      togglePin: (id) =>
        set({
          sprints: get().sprints.map((s) =>
            s.id === id ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s,
          ),
        }),
      importSprint: (sprint) =>
        set({
          sprints: get().sprints.some((s) => s.id === sprint.id)
            ? get().sprints.map((s) =>
                s.id === sprint.id && sprint.updatedAt >= s.updatedAt ? sprint : s,
              )
            : [sprint, ...get().sprints],
        }),
      getSprint: (id) => get().sprints.find((s) => s.id === id),
      patchSprint: (id, patch) =>
        set({
          sprints: get().sprints.map((s) =>
            s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
          ),
        }),
      addMessage: (sprintId, msg) => {
        const message: Message = {
          id: msg.id ?? uid("m"),
          role: msg.role,
          agentId: msg.agentId,
          content: msg.content,
          createdAt: Date.now(),
        };
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId
              ? { ...s, messages: [...s.messages, message], updatedAt: Date.now() }
              : s,
          ),
        });
        return message;
      },
      updateMessage: (sprintId, messageId, content) =>
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId
              ? {
                  ...s,
                  updatedAt: Date.now(),
                  messages: s.messages.map((m) =>
                    m.id === messageId ? { ...m, content } : m,
                  ),
                }
              : s,
          ),
        }),
      setMessageBoard: (sprintId, messageId, content, sections) =>
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId
              ? {
                  ...s,
                  updatedAt: Date.now(),
                  messages: s.messages.map((m) =>
                    m.id === messageId
                      ? { ...m, content, boardSections: sections }
                      : m,
                  ),
                }
              : s,
          ),
        }),
      removeMessage: (sprintId, messageId) =>
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId
              ? {
                  ...s,
                  messages: s.messages.filter((m) => m.id !== messageId),
                  updatedAt: Date.now(),
                }
              : s,
          ),
        }),
      addArtifacts: (sprintId, items) => {
        const now = Date.now();
        const arts: Artifact[] = items.map((it) => ({
          ...it,
          id: uid("a"),
          createdAt: now,
        }));
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId
              ? { ...s, artifacts: [...arts, ...s.artifacts], updatedAt: now }
              : s,
          ),
        });
      },
      setActiveAgent: (sprintId, agentId) => {
        // Whitelist guard — a garbage id would be persisted and later crash
        // the war-room header (AGENT_MAP[id] undefined).
        if (!isAgentId(agentId)) return;
        // Note: deliberately does NOT move the pipeline stage. Clicking around
        // the roster is browsing, not progress.
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId ? { ...s, activeAgentId: agentId, updatedAt: Date.now() } : s,
          ),
        });
      },
      // Stages only move forward, and only when work is actually produced
      // (the war room calls this after artifacts land / the board completes).
      setStage: (sprintId, stage) =>
        set({
          sprints: get().sprints.map((s) => {
            if (s.id !== sprintId) return s;
            const current = STAGES.findIndex((x) => x.id === s.stage);
            const next = STAGES.findIndex((x) => x.id === stage);
            if (next <= current) return s;
            return { ...s, stage, updatedAt: Date.now() };
          }),
        }),
      markKickoff: (sprintId) =>
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId ? { ...s, kickoffDone: true } : s,
          ),
        }),
    }),
    {
      name: "gstack-sprints-v1",
      version: 1,
      skipHydration: true,
      partialize: (s) => ({ sprints: s.sprints }),
      storage: createJSONStorage(() => guardedStorage),
      migrate: (persisted) => sanitizePersisted(persisted),
    },
  ),
);
