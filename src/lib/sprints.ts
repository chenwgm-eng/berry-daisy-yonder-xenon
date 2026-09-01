import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "./db";
import { authMiddleware } from "./auth/middleware";
import {
  deleteSprintRow,
  getSprintByShareId,
  getSprintRow,
  listSprintRows,
  newShareId,
  setSprintShareId,
  sprintFromRow,
  upsertSprintRow,
} from "./sprints-repo";
import type { Sprint } from "./types";

const BoardSectionSchema = z.object({
  agentId: z.string().max(40),
  content: z.string().max(50_000),
});

const MessageSchema = z.object({
  id: z.string().max(80),
  role: z.enum(["user", "agent"]),
  agentId: z.string().max(40).optional(),
  content: z.string().max(100_000),
  boardSections: z.array(BoardSectionSchema).max(20).optional(),
  createdAt: z.number(),
});

const ArtifactSchema = z.object({
  id: z.string().max(80),
  agentId: z.string().max(40),
  title: z.string().max(300),
  kind: z.string().max(50),
  content: z.string().max(200_000),
  createdAt: z.number(),
});

const SprintSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  idea: z.string().max(20_000),
  createdAt: z.number(),
  updatedAt: z.number(),
  stage: z.string().max(20),
  activeAgentId: z.string().max(40),
  messages: z.array(MessageSchema).max(500),
  artifacts: z.array(ArtifactSchema).max(200),
  kickoffDone: z.boolean(),
  pinned: z.boolean().optional(),
});

/** Serializable summary for the landing list (the full payload is heavy). */
export type SprintSummary = {
  id: string;
  title: string;
  updatedAt: number;
  shareId: string | null;
};

export const upsertMySprint = createServerFn({ method: "POST" })
  .validator((input: unknown): Sprint => SprintSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<void> => {
    const sql = await getSql();
    await upsertSprintRow(sql, context.userId, data);
  });

export const listMySprints = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SprintSummary[]> => {
    const sql = await getSql();
    const rows = await listSprintRows(sql, context.userId);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: sprintFromRow(row).updatedAt,
      shareId: row.share_id,
    }));
  });

export const getMySprint = createServerFn({ method: "GET" })
  .validator((id: unknown): string => z.string().min(1).max(80).parse(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Sprint | null> => {
    const sql = await getSql();
    const row = await getSprintRow(sql, context.userId, data);
    return row ? sprintFromRow(row) : null;
  });

export const deleteMySprint = createServerFn({ method: "POST" })
  .validator((id: unknown): string => z.string().min(1).max(80).parse(id))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<void> => {
    const sql = await getSql();
    await deleteSprintRow(sql, context.userId, data);
  });

/**
 * Share/unshare a sprint I own. Sharing keeps the existing share_id when one
 * exists (old links keep working); unsharing nulls it, which 404s the link.
 */
export const setMySprintShared = createServerFn({ method: "POST" })
  .validator(
    (input: unknown): { id: string; shared: boolean } =>
      z.object({ id: z.string().min(1).max(80), shared: z.boolean() }).parse(input),
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ shareId: string | null }> => {
    const sql = await getSql();
    if (!data.shared) {
      await setSprintShareId(sql, context.userId, data.id, null);
      return { shareId: null };
    }
    const row = await getSprintRow(sql, context.userId, data.id);
    if (!row) {
      throw new Error("Sprint is not synced yet — open it once while signed in, then share.");
    }
    const shareId = row.share_id ?? newShareId();
    if (!row.share_id) {
      await setSprintShareId(sql, context.userId, data.id, shareId);
    }
    return { shareId };
  });

/**
 * Public, unauthenticated read backing /share/<shareId>. No authMiddleware on
 * purpose: the random share_id is the capability, and the payload is all the
 * caller gets (never the owner id list or anyone else's rows).
 */
export const getSharedSprint = createServerFn({ method: "GET" })
  .validator((shareId: unknown): string => z.uuid().parse(shareId))
  .handler(async ({ data }): Promise<{ title: string; sprint: Sprint } | null> => {
    const sql = await getSql();
    const row = await getSprintByShareId(sql, data);
    if (!row) return null;
    return { title: row.title, sprint: sprintFromRow(row) };
  });
