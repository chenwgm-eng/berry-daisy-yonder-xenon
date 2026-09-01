import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Sql } from "./db.ts";
import {
  deleteSprintRow,
  getSprintByShareId,
  getSprintRow,
  listSprintRows,
  newShareId,
  setSprintShareId,
  sprintFromRow,
  sprintToPayload,
  upsertSprintRow,
  type SprintRow,
} from "./sprints-repo.ts";
import type { Sprint } from "./types.ts";

type Call = { text: string; params: unknown[] };

/** Fake Sql surface: captures the parameterized text + params, replays `rows`. */
function fakeSql(rows: unknown[] = []) {
  const calls: Call[] = [];
  const run = async (text: string, params: unknown[]) => {
    calls.push({ text, params });
    return rows;
  };
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run(text, values);
  }) as unknown as Sql;
  sql.query = (text: string, params: unknown[] = []) => run(text, params);
  return { sql, calls };
}

function sampleSprint(): Sprint {
  return {
    id: "sp-1",
    title: "Test sprint",
    idea: "Build the thing",
    createdAt: 1_000_000,
    updatedAt: 2_000_000,
    stage: "plan",
    activeAgentId: "ceo",
    messages: [
      { id: "m1", role: "user", content: "hi", createdAt: 1_500_000 },
      {
        id: "m2",
        role: "agent",
        agentId: "ceo",
        content: "combined",
        boardSections: [{ agentId: "ceo", content: "section body" }],
        createdAt: 1_600_000,
      },
    ],
    artifacts: [],
    kickoffDone: true,
    pinned: true,
  };
}

describe("sprints-repo", () => {
  it("upsert scopes the write to the given user id and parameterizes every value", async () => {
    const { sql, calls } = fakeSql();
    await upsertSprintRow(sql, "user-1", sampleSprint());
    assert.equal(calls.length, 1);
    const { text, params } = calls[0]!;
    assert.match(text, /insert into sprints/);
    assert.match(text, /on conflict \(user_id, id\) do update/);
    assert.deepEqual(params[0], "sp-1");
    assert.deepEqual(params[1], "user-1");
    assert.deepEqual(params[2], "Test sprint");
    // payload goes out as a bound JSON string — never inlined into the SQL text
    assert.equal(typeof params[3], "string");
    assert.doesNotMatch(text, /Test sprint/);
  });

  it("payload round-trips board sections and pinned through JSON", () => {
    const sprint = sampleSprint();
    const row: SprintRow = {
      id: sprint.id,
      user_id: "user-1",
      title: sprint.title,
      payload: sprintToPayload(sprint),
      share_id: null,
      created_at: null,
      updated_at: null,
    };
    assert.deepEqual(sprintFromRow(row), sprint);
    // and when the driver hands back an already-parsed jsonb object
    assert.deepEqual(sprintFromRow({ ...row, payload: JSON.parse(row.payload as string) }), sprint);
  });

  it("list and get scope reads by user id", async () => {
    const { sql, calls } = fakeSql([]);
    await listSprintRows(sql, "user-1");
    assert.match(calls[0]!.text, /where user_id = \$1/);
    assert.deepEqual(calls[0]!.params, ["user-1"]);
    await getSprintRow(sql, "user-1", "sp-1");
    assert.match(calls[1]!.text, /where user_id = \$1 and id = \$2/);
    assert.deepEqual(calls[1]!.params, ["user-1", "sp-1"]);
  });

  it("delete is scoped by user id", async () => {
    const { sql, calls } = fakeSql();
    await deleteSprintRow(sql, "user-1", "sp-1");
    assert.match(calls[0]!.text, /delete from sprints where user_id = \$1 and id = \$2/);
    assert.deepEqual(calls[0]!.params, ["user-1", "sp-1"]);
  });

  it("share toggling is scoped by user id; the share read is public by share_id only", async () => {
    const { sql, calls } = fakeSql();
    await setSprintShareId(sql, "user-1", "sp-1", "uuid-1");
    assert.match(calls[0]!.text, /update sprints set share_id = \$1/);
    assert.match(calls[0]!.text, /where user_id = \$2 and id = \$3/);
    assert.deepEqual(calls[0]!.params, ["uuid-1", "user-1", "sp-1"]);

    await getSprintByShareId(sql, "uuid-1");
    assert.match(calls[1]!.text, /where share_id = \$1/);
    assert.deepEqual(calls[1]!.params, ["uuid-1"]);
  });

  it("newShareId produces unique uuids", () => {
    const a = newShareId();
    const b = newShareId();
    assert.match(a, /^[0-9a-f-]{36}$/);
    assert.notEqual(a, b);
  });
});
