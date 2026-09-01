import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseAgentOutput,
  parseBoardSections,
  stripBoardMarkers,
} from "./parse-output.ts";

describe("parseAgentOutput", () => {
  it("extracts artifacts and strips them from the display text", () => {
    const raw =
      'Here is the plan.\n\n:::artifact title="Design doc" kind="design-doc"\n# Design\nBody text.\n:::\n\nAfter word.';
    const out = parseAgentOutput(raw);
    assert.equal(out.artifacts.length, 1);
    assert.equal(out.artifacts[0]!.title, "Design doc");
    assert.equal(out.artifacts[0]!.kind, "design-doc");
    assert.match(out.artifacts[0]!.content, /# Design/);
    assert.match(out.display, /Here is the plan/);
    assert.match(out.display, /After word/);
    assert.doesNotMatch(out.display, /:::artifact/);
  });

  it("keeps an inline ::: inside an artifact body", () => {
    const raw =
      ':::artifact title="Note" kind="note"\nline one ::: inline marker\nline two\n:::\n';
    const out = parseAgentOutput(raw);
    assert.equal(out.artifacts.length, 1);
    assert.match(out.artifacts[0]!.content, /line one ::: inline marker/);
    assert.match(out.artifacts[0]!.content, /line two/);
  });

  it("maps unknown artifact kinds to note", () => {
    const out = parseAgentOutput(':::artifact title="X" kind="weird"\nbody\n:::\n');
    assert.equal(out.artifacts[0]!.kind, "note");
  });

  it("accepts a valid handoff target", () => {
    const out = parseAgentOutput("Done.\n\n:::handoff\nceo\n:::\n");
    assert.equal(out.handoff, "ceo");
    assert.doesNotMatch(out.display, /handoff/);
  });

  it("rejects prototype-property handoff ids like constructor", () => {
    const out = parseAgentOutput(":::handoff\nconstructor\n:::\n");
    assert.equal(out.handoff, undefined);
  });
});

describe("parseBoardSections", () => {
  it("parses four agent sections in order", () => {
    const raw = [
      ":::agent:office-hours",
      "Premise check.",
      ":::",
      ":::agent:ceo",
      "Scope mode: HOLD.",
      ":::",
      ":::agent:design",
      "Hierarchy 7/10.",
      ":::",
      ":::agent:eng",
      "READY WITH GATES.",
      ":::",
    ].join("\n");
    const sections = parseBoardSections(raw);
    assert.deepEqual(
      sections.map((s) => s.agentId),
      ["office-hours", "ceo", "design", "eng"],
    );
    assert.match(sections[1]!.body, /HOLD/);
  });

  it("keeps a nested artifact block inside its section", () => {
    const raw = [
      ":::agent:ceo",
      "Verdict first.",
      "",
      ':::artifact title="CEO review" kind="ceo-review"',
      "Full review body.",
      ":::",
      "Trailing note.",
      ":::",
    ].join("\n");
    const sections = parseBoardSections(raw);
    assert.equal(sections.length, 1);
    assert.match(sections[0]!.body, /Verdict first/);
    assert.match(sections[0]!.body, /Full review body/);
    assert.match(sections[0]!.body, /Trailing note/);
    const parsed = parseAgentOutput(sections[0]!.body);
    assert.equal(parsed.artifacts.length, 1);
    assert.equal(parsed.artifacts[0]!.kind, "ceo-review");
  });

  it("skips sections whose agent id is not an own key of AGENT_MAP", () => {
    const raw = ":::agent:constructor\nHacked.\n:::\n:::agent:qa\nReal.\n:::";
    const sections = parseBoardSections(raw);
    assert.deepEqual(
      sections.map((s) => s.agentId),
      ["qa"],
    );
  });

  it("flushes an unterminated final section", () => {
    const sections = parseBoardSections(":::agent:eng\nNo closing fence.");
    assert.equal(sections.length, 1);
    assert.match(sections[0]!.body, /No closing fence/);
  });
});

describe("stripBoardMarkers", () => {
  it("removes agent openers and bare fences but keeps prose", () => {
    const raw = ":::agent:ceo\nText here.\n:::\nMore text.";
    assert.equal(stripBoardMarkers(raw), "Text here.\nMore text.");
  });
});
