import type { AgentId, ArtifactKind, StageId } from "./agents";

export type ChatRole = "user" | "agent";

/** One specialist's block from a review-board run, kept structured for card rendering. */
export type BoardSection = {
  agentId: AgentId;
  content: string;
};

export type Message = {
  id: string;
  role: ChatRole;
  agentId?: AgentId;
  content: string;
  /** Board-run messages only: per-specialist sections for card rendering. */
  boardSections?: BoardSection[];
  createdAt: number;
};

export type Artifact = {
  id: string;
  agentId: AgentId;
  title: string;
  kind: ArtifactKind;
  content: string;
  createdAt: number;
};

export type Sprint = {
  id: string;
  title: string;
  idea: string;
  createdAt: number;
  updatedAt: number;
  stage: StageId;
  activeAgentId: AgentId;
  messages: Message[];
  artifacts: Artifact[];
  kickoffDone: boolean;
  pinned?: boolean;
};
