import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentId, StageId } from "./agents";
import { AGENT_MAP } from "./agents";
import type { Artifact, Message, Sprint } from "./types";
import { uid } from "./utils";

type State = {
  hydrated: boolean;
  sprints: Sprint[];
  markHydrated: () => void;
  createSprint: (idea: string) => Sprint;
  deleteSprint: (id: string) => void;
  getSprint: (id: string) => Sprint | undefined;
  patchSprint: (id: string, patch: Partial<Sprint>) => void;
  addMessage: (sprintId: string, msg: Omit<Message, "id" | "createdAt"> & { id?: string }) => Message;
  updateMessage: (sprintId: string, messageId: string, content: string) => void;
  addArtifacts: (
    sprintId: string,
    items: Omit<Artifact, "id" | "createdAt">[],
  ) => void;
  setActiveAgent: (sprintId: string, agentId: AgentId) => void;
  setStage: (sprintId: string, stage: StageId) => void;
  markKickoff: (sprintId: string) => void;
};

function titleFromIdea(idea: string) {
  const line = idea.trim().split(/\n/)[0] ?? "Untitled sprint";
  return line.length > 48 ? `${line.slice(0, 46)}…` : line || "Untitled sprint";
}

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
        const stage = AGENT_MAP[agentId]?.stage;
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId
              ? {
                  ...s,
                  activeAgentId: agentId,
                  stage: stage ?? s.stage,
                  updatedAt: Date.now(),
                }
              : s,
          ),
        });
      },
      setStage: (sprintId, stage) =>
        set({
          sprints: get().sprints.map((s) =>
            s.id === sprintId ? { ...s, stage, updatedAt: Date.now() } : s,
          ),
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
      skipHydration: true,
      partialize: (s) => ({ sprints: s.sprints }),
    },
  ),
);
