import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as ArrowUp, i as Layers, n as Users, t as X } from "../_libs/lucide-react.mjs";
import { a as AGENT_MAP, c as agentBySlash, i as AGENTS, l as cn, n as Route, o as STAGES, r as useSprintStore, u as timeAgo } from "./router-D3oKOygD.mjs";
import { n as Textarea, t as Button } from "./textarea-ZaQpEUsX.mjs";
import { t as StackMark } from "./mark-ChUom3Mb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sprint._sprintId-BaC5poF_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function streamAgent(req, onDelta, signal) {
	const res = await fetch("/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
		signal
	});
	if (!res.ok) {
		let detail = `Request failed (${res.status})`;
		try {
			const body = await res.json();
			if (body.error) detail = body.error;
		} catch {}
		throw new Error(detail);
	}
	if (!res.body) throw new Error("No response stream");
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const parts = buffer.split("\n\n");
		buffer = parts.pop() ?? "";
		for (const part of parts) {
			const line = part.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
			if (!line || line === "[DONE]") continue;
			try {
				const json = JSON.parse(line);
				if (json.error) throw new Error(json.error);
				if (json.text) {
					full += json.text;
					onDelta(json.text);
				}
			} catch (err) {
				if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
					if (err instanceof SyntaxError) continue;
					throw err;
				}
			}
		}
	}
	return full;
}
var KINDS = /* @__PURE__ */ new Set([
	"design-doc",
	"ceo-review",
	"eng-review",
	"design-review",
	"qa-report",
	"security",
	"ship-plan",
	"debug-note",
	"note"
]);
function parseAgentOutput(raw) {
	const artifacts = [];
	let handoff;
	let text = raw;
	text = text.replace(/:::artifact\s+title="([^"]+)"\s+kind="([^"]+)"\s*\n([\s\S]*?):::/gi, (_m, title, kind, body) => {
		const k = kind.toLowerCase();
		artifacts.push({
			title: title.trim(),
			kind: KINDS.has(k) ? k : "note",
			content: body.trim()
		});
		return "";
	});
	text = text.replace(/:::handoff\s*\n\s*([a-z-]+)\s*\n?:::/gi, (_m, id) => {
		const key = id.trim();
		if (key in AGENT_MAP) handoff = key;
		return "";
	});
	return {
		display: text.replace(/\n{3,}/g, "\n\n").trim(),
		artifacts,
		handoff
	};
}
function parseBoardSections(raw) {
	const out = [];
	const re = /:::agent:([a-z-]+)\s*\n([\s\S]*?):::/gi;
	let m;
	while (m = re.exec(raw)) {
		const id = m[1].trim();
		if (id in AGENT_MAP) out.push({
			agentId: id,
			body: m[2].trim()
		});
	}
	return out;
}
function inlineFmt(text) {
	const parts = [];
	const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
	let last = 0;
	let m;
	while (m = re.exec(text)) {
		if (m.index > last) parts.push(text.slice(last, m.index));
		const tok = m[0];
		if (tok.startsWith("**")) parts.push({
			t: "b",
			v: tok.slice(2, -2)
		});
		else parts.push({
			t: "c",
			v: tok.slice(1, -1)
		});
		last = m.index + tok.length;
	}
	if (last < text.length) parts.push(text.slice(last));
	return parts.map((p, i) => typeof p === "string" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p }, i) : p.t === "b" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
		className: "font-medium text-fg",
		children: p.v
	}, i) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
		className: "rounded-xs bg-bg-subtle px-1 py-px font-mono text-[0.85em]",
		children: p.v
	}, i));
}
function Markdown({ text, className }) {
	const blocks = [];
	const raw = text.replace(/\r\n/g, "\n").split("\n");
	let i = 0;
	while (i < raw.length) {
		const line = raw[i] ?? "";
		if (line.startsWith("```")) {
			const buf = [];
			i += 1;
			while (i < raw.length && !raw[i].startsWith("```")) {
				buf.push(raw[i]);
				i += 1;
			}
			i += 1;
			blocks.push({
				type: "code",
				lines: buf
			});
			continue;
		}
		if (/^\s*[-*]\s+/.test(line)) {
			const buf = [];
			while (i < raw.length && /^\s*[-*]\s+/.test(raw[i] ?? "")) {
				buf.push((raw[i] ?? "").replace(/^\s*[-*]\s+/, ""));
				i += 1;
			}
			blocks.push({
				type: "ul",
				lines: buf
			});
			continue;
		}
		if (/^\s*\d+\.\s+/.test(line)) {
			const buf = [];
			while (i < raw.length && /^\s*\d+\.\s+/.test(raw[i] ?? "")) {
				buf.push((raw[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
				i += 1;
			}
			blocks.push({
				type: "ol",
				lines: buf
			});
			continue;
		}
		if (/^#{1,3}\s+/.test(line)) {
			const level = (line.match(/^#+/) ?? ["#"])[0].length;
			blocks.push({
				type: `h${level}`,
				lines: [line.replace(/^#{1,3}\s+/, "")]
			});
			i += 1;
			continue;
		}
		if (/^---+$/.test(line.trim())) {
			blocks.push({
				type: "hr",
				lines: []
			});
			i += 1;
			continue;
		}
		if (line.trim() === "") {
			i += 1;
			continue;
		}
		const buf = [];
		while (i < raw.length && (raw[i] ?? "").trim() !== "" && !/^#{1,3}\s+/.test(raw[i] ?? "") && !/^\s*[-*]\s+/.test(raw[i] ?? "") && !/^\s*\d+\.\s+/.test(raw[i] ?? "") && !(raw[i] ?? "").startsWith("```")) {
			buf.push(raw[i]);
			i += 1;
		}
		blocks.push({
			type: "p",
			lines: buf
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("space-y-3 text-sm leading-relaxed text-fg/90", className),
		children: blocks.map((b, idx) => {
			if (b.type === "code") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "overflow-x-auto rounded-md bg-bg-subtle px-3 py-2 font-mono text-[12px] text-fg/85",
				children: b.lines.join("\n")
			}, idx);
			if (b.type === "ul") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "list-disc space-y-1 pl-5",
				children: b.lines.map((l, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inlineFmt(l) }, j))
			}, idx);
			if (b.type === "ol") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "list-decimal space-y-1 pl-5",
				children: b.lines.map((l, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inlineFmt(l) }, j))
			}, idx);
			if (b.type === "hr") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "border-border" }, idx);
			if (b.type.startsWith("h")) {
				const Tag = b.type === "h1" ? "h3" : b.type === "h2" ? "h4" : "h5";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
					className: "font-display text-base font-medium tracking-tight text-fg",
					children: inlineFmt(b.lines[0] ?? "")
				}, idx);
			}
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "whitespace-pre-wrap",
				children: inlineFmt(b.lines.join(" "))
			}, idx);
		})
	});
}
function WarRoom({ sprintId }) {
	const hydrated = useSprintStore((s) => s.hydrated);
	const sprint = useSprintStore((s) => s.sprints.find((x) => x.id === sprintId));
	const [draft, setDraft] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [liveText, setLiveText] = (0, import_react.useState)("");
	const [liveId, setLiveId] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [panel, setPanel] = (0, import_react.useState)("none");
	const [openDoc, setOpenDoc] = (0, import_react.useState)(null);
	const scroller = (0, import_react.useRef)(null);
	const abortRef = (0, import_react.useRef)(null);
	const kickoffLock = (0, import_react.useRef)(false);
	const busyRef = (0, import_react.useRef)(false);
	const addMessage = useSprintStore((s) => s.addMessage);
	const updateMessage = useSprintStore((s) => s.updateMessage);
	const addArtifacts = useSprintStore((s) => s.addArtifacts);
	const setActiveAgent = useSprintStore((s) => s.setActiveAgent);
	const markKickoff = useSprintStore((s) => s.markKickoff);
	const setStage = useSprintStore((s) => s.setStage);
	const scrollToEnd = (0, import_react.useCallback)(() => {
		const el = scroller.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, []);
	(0, import_react.useEffect)(() => {
		scrollToEnd();
	}, [
		sprint?.messages.length,
		liveText,
		scrollToEnd
	]);
	const run = (0, import_react.useCallback)(async (opts) => {
		if (!useSprintStore.getState().getSprint(sprintId) || busyRef.current) return;
		busyRef.current = true;
		setBusy(true);
		setError(null);
		setLiveText("");
		setActiveAgent(sprintId, opts.agentId);
		if (opts.recordUser !== false) addMessage(sprintId, {
			role: "user",
			content: opts.userText
		});
		const placeholder = addMessage(sprintId, {
			role: "agent",
			agentId: opts.agentId,
			content: ""
		});
		setLiveId(placeholder.id);
		const snap = useSprintStore.getState().getSprint(sprintId);
		const ac = new AbortController();
		abortRef.current = ac;
		const history = snap.messages.filter((m) => m.id !== placeholder.id).map((m) => ({
			role: m.role,
			content: m.content,
			agentId: m.agentId
		}));
		if (opts.recordUser === false) history.push({
			role: "user",
			content: opts.userText,
			agentId: void 0
		});
		try {
			const full = await streamAgent({
				agentId: opts.agentId,
				mode: opts.mode ?? "chat",
				idea: snap.idea,
				messages: history,
				artifacts: snap.artifacts.map((a) => ({
					title: a.title,
					kind: a.kind,
					content: a.content
				}))
			}, (chunk) => {
				setLiveText((prev) => prev + chunk);
			}, ac.signal);
			if (opts.mode === "board") {
				const sections = parseBoardSections(full);
				if (sections.length > 0) {
					const arts = [];
					let combined = "";
					for (const sec of sections) {
						const parsed = parseAgentOutput(sec.body);
						combined += `## ${AGENT_MAP[sec.agentId].name}\n\n${parsed.display}\n\n`;
						for (const a of parsed.artifacts) arts.push({
							...a,
							agentId: sec.agentId
						});
						if (parsed.artifacts.length === 0 && parsed.display) arts.push({
							agentId: sec.agentId,
							title: `${AGENT_MAP[sec.agentId].name} board note`,
							kind: sec.agentId === "ceo" ? "ceo-review" : sec.agentId === "eng" ? "eng-review" : sec.agentId === "design" ? "design-review" : "design-doc",
							content: parsed.display
						});
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
				if (parsed.artifacts.length) addArtifacts(sprintId, parsed.artifacts.map((a) => ({
					...a,
					agentId: opts.agentId
				})));
				if (parsed.handoff && parsed.handoff !== opts.agentId) setActiveAgent(sprintId, parsed.handoff);
			}
		} catch (err) {
			if (err.name === "AbortError") return;
			const message = err instanceof Error ? err.message : "The floor went quiet.";
			setError(message);
			updateMessage(sprintId, placeholder.id, `Could not reach the specialist. ${message}`);
		} finally {
			busyRef.current = false;
			setBusy(false);
			setLiveId(null);
			setLiveText("");
			abortRef.current = null;
		}
	}, [
		addArtifacts,
		addMessage,
		setActiveAgent,
		setStage,
		sprintId,
		updateMessage
	]);
	(0, import_react.useEffect)(() => {
		if (!hydrated || !sprint || sprint.kickoffDone || kickoffLock.current) return;
		kickoffLock.current = true;
		markKickoff(sprintId);
		run({
			agentId: "conductor",
			userText: `New sprint. Briefing:\n\n${sprint.idea}`,
			recordUser: false
		});
	}, [
		hydrated,
		markKickoff,
		run,
		sprint,
		sprintId
	]);
	function submit() {
		const text = draft.trim();
		if (!text || busy || !sprint) return;
		setDraft("");
		const slashed = agentBySlash(text);
		const agentId = slashed?.id ?? sprint.activeAgentId;
		const cleaned = slashed ? text.replace(/^\/[a-z-]+\s*/i, "").trim() || text : text;
		run({
			agentId,
			userText: cleaned
		});
	}
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center text-sm text-fg-muted",
		children: "Restoring the floor…"
	});
	if (!sprint) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl",
			children: "This sprint is gone."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			className: "text-sm text-fg-muted underline-offset-4 hover:underline",
			children: "Back to the floor"
		})]
	});
	const active = AGENT_MAP[sprint.activeAgentId];
	const doc = sprint.artifacts.find((a) => a.id === openDoc) ?? sprint.artifacts[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackMark, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden font-mono text-[12px] sm:inline",
							children: "gstack"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-border",
						children: "/"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "min-w-0 flex-1 truncate font-display text-base font-medium tracking-tight",
						children: sprint.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg md:hidden",
						onClick: () => setPanel(panel === "team" ? "none" : "team"),
						"aria-label": "Team",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg md:hidden",
						onClick: () => setPanel(panel === "docs" ? "none" : "docs"),
						"aria-label": "Artifacts",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pipeline, { stage: sprint.stage }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "hidden w-56 shrink-0 flex-col border-r border-border lg:flex",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roster, {
							activeId: sprint.activeAgentId,
							disabled: busy,
							onPick: (id) => setActiveAgent(sprintId, id)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex min-w-0 flex-1 flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							ref: scroller,
							className: "min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefing, { idea: sprint.idea }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
									className: "mx-auto mt-8 max-w-2xl space-y-6",
									children: sprint.messages.map((m) => {
										const raw = liveId === m.id ? liveText : m.content;
										const shown = liveId === m.id && /:::(agent|artifact|handoff)/.test(raw) ? "" : raw;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: m.role === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "ml-8 rounded-lg bg-bg-elevated px-4 py-3 shadow-[var(--shadow-border)]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "whitespace-pre-wrap text-sm leading-relaxed",
												children: m.content
											})
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentBubble, {
											agentId: m.agentId ?? "conductor",
											content: shown,
											streaming: busy && liveId === m.id && shown !== "",
											waiting: busy && liveId === m.id && shown === ""
										}) }, m.id);
									})
								}),
								error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mx-auto mt-4 max-w-2xl text-sm text-danger",
									children: error
								}) : null
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border px-3 py-3 md:px-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mx-auto flex max-w-2xl flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										disabled: busy,
										onClick: () => void run({
											agentId: "conductor",
											userText: "Run the review board on this sprint.",
											mode: "board"
										}),
										children: "Run review board"
									}), active.id !== "conductor" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex h-9 items-center font-mono text-[11px] text-fg-muted",
										children: ["talking to ", active.slash]
									}) : null]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end gap-2 rounded-lg bg-bg-elevated p-2 shadow-[var(--shadow-border)]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
										value: draft,
										disabled: busy,
										onChange: (e) => setDraft(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												submit();
											}
										},
										placeholder: `Message ${active.name}…  /office-hours  /ceo  /eng`,
										className: "min-h-[44px] max-h-40 bg-transparent py-2.5 shadow-none focus:ring-0",
										rows: 2
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "icon",
										disabled: busy || !draft.trim(),
										onClick: submit,
										"aria-label": "Send",
										className: "shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" })
									})]
								})]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "hidden w-80 shrink-0 flex-col border-l border-border xl:flex",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtifactList, {
							artifacts: sprint.artifacts,
							selected: openDoc,
							onSelect: setOpenDoc
						}), doc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-h-0 flex-1 overflow-y-auto border-t border-border p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-[11px] text-fg-subtle",
									children: doc.kind
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 font-display text-lg font-medium tracking-tight",
									children: doc.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, {
									className: "mt-3",
									text: doc.content
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "p-4 text-sm text-fg-muted",
							children: "Artifacts land here when a specialist writes a review or design doc."
						})]
					})
				]
			}),
			panel !== "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 bg-bg/70 lg:hidden",
				onClick: () => setPanel("none"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-xl bg-bg-elevated p-4 shadow-[var(--shadow-border)]",
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-lg",
							children: panel === "team" ? "Team" : "Artifacts"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "inline-flex size-11 items-center justify-center",
							onClick: () => setPanel("none"),
							"aria-label": "Close",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}), panel === "team" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Roster, {
						activeId: sprint.activeAgentId,
						disabled: busy,
						onPick: (id) => {
							setActiveAgent(sprintId, id);
							setPanel("none");
						}
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtifactList, {
						artifacts: sprint.artifacts,
						selected: openDoc,
						onSelect: (id) => setOpenDoc(id)
					}), doc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, {
						className: "mt-4",
						text: doc.content
					}) : null] })]
				})
			}) : null
		]
	});
}
function Pipeline({ stage }) {
	const idx = STAGES.findIndex((s) => s.id === stage);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 py-2 md:px-5",
		children: STAGES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: cn("flex h-8 shrink-0 items-center rounded-sm px-2 font-mono text-[11px] tracking-wide", i === idx ? "bg-accent text-accent-fg" : "text-fg-subtle", i < idx && "text-fg-muted"),
			children: s.label
		}, s.id))
	});
}
function Roster({ activeId, disabled, onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "flex flex-col p-2",
		children: AGENTS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			disabled,
			onClick: () => onPick(a.id),
			className: cn("flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150", a.id === activeId ? "bg-bg-subtle" : "hover:bg-bg-subtle/60"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-0.5 w-7 shrink-0 font-mono text-[11px] text-fg-subtle",
				children: a.initials
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm font-medium",
					children: a.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-[12px] text-fg-muted",
					children: a.role
				})]
			})]
		}) }, a.id))
	});
}
function Briefing({ idea }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl rounded-lg px-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase",
			children: "Briefing"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-display text-2xl font-medium leading-snug tracking-tight md:text-3xl",
			children: idea
		})]
	});
}
function AgentBubble({ agentId, content, streaming, waiting }) {
	const agent = AGENT_MAP[agentId];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "mb-2 flex items-baseline gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] text-fg-subtle",
				children: agent.initials
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: agent.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[12px] text-fg-muted",
				children: agent.role
			})
		]
	}), waiting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "shimmer font-mono text-[13px]",
		children: "thinking"
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, {
		text: content,
		className: streaming ? "opacity-90" : void 0
	})] });
}
function ArtifactList({ artifacts, selected, onSelect }) {
	const items = (0, import_react.useMemo)(() => artifacts, [artifacts]);
	if (items.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-4 text-sm text-fg-muted",
		children: "No artifacts yet. Run a specialist or the board."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "p-2",
		children: items.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => onSelect(a.id),
			className: cn("flex w-full flex-col items-start rounded-md px-3 py-2.5 text-left", selected === a.id ? "bg-bg-subtle" : "hover:bg-bg-subtle/60"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: a.title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono text-[11px] text-fg-subtle",
				children: [
					a.kind,
					" · ",
					timeAgo(a.createdAt)
				]
			})]
		}) }, a.id))
	});
}
function SprintPage() {
	const { sprintId } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WarRoom, { sprintId });
}
//#endregion
export { SprintPage as component };
