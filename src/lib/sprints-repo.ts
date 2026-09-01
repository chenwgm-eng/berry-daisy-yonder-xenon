import type { Sql } from "./db.ts";
import type { Sprint } from "./types.ts";

/** Row shape of the sprints table (snake_case columns). */
export type SprintRow = {
  id: string;
  user_id: string;
  title: string;
  payload: unknown;
  share_id: string | null;
  created_at: unknown;
  updated_at: unknown;
};

/** Serialize a client Sprint for the jsonb payload column. */
export function sprintToPayload(sprint: Sprint): string {
  return JSON.stringify(sprint);
}

/**
 * Rebuild a client Sprint from a stored row. pg and PGLite both return jsonb
 * already parsed; the string branch is a belt-and-braces fallback.
 */
export function sprintFromRow(row: SprintRow): Sprint {
  return (typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload) as Sprint;
}

export function newShareId(): string {
  return crypto.randomUUID();
}

export async function upsertSprintRow(sql: Sql, userId: string, sprint: Sprint): Promise<void> {
  await sql`
    insert into sprints (id, user_id, title, payload, created_at, updated_at)
    values (${sprint.id}, ${userId}, ${sprint.title}, ${sprintToPayload(sprint)}, to_timestamp(${sprint.createdAt / 1000}), to_timestamp(${sprint.updatedAt / 1000}))
    on conflict (user_id, id) do update set
      title = excluded.title,
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `;
}

export async function listSprintRows(sql: Sql, userId: string): Promise<SprintRow[]> {
  return sql<SprintRow>`select id, user_id, title, payload, share_id, created_at, updated_at from sprints where user_id = ${userId} order by updated_at desc`;
}

export async function getSprintRow(sql: Sql, userId: string, id: string): Promise<SprintRow | null> {
  const rows = await sql<SprintRow>`select id, user_id, title, payload, share_id, created_at, updated_at from sprints where user_id = ${userId} and id = ${id}`;
  return rows[0] ?? null;
}

export async function deleteSprintRow(sql: Sql, userId: string, id: string): Promise<void> {
  await sql`delete from sprints where user_id = ${userId} and id = ${id}`;
}

export async function setSprintShareId(sql: Sql, userId: string, id: string, shareId: string | null): Promise<void> {
  await sql`update sprints set share_id = ${shareId}, updated_at = now() where user_id = ${userId} and id = ${id}`;
}

/**
 * PUBLIC read by share link — deliberately not scoped by user: the random
 * share_id IS the capability, and revoking the link (share_id → null) is the
 * off switch.
 */
export async function getSprintByShareId(sql: Sql, shareId: string): Promise<SprintRow | null> {
  const rows = await sql<SprintRow>`select id, user_id, title, payload, share_id, created_at, updated_at from sprints where share_id = ${shareId}`;
  return rows[0] ?? null;
}
