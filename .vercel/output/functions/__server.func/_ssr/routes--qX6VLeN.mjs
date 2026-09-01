import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link, b as require_jsx_runtime, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as ArrowUpRight, s as ArrowRight } from "../_libs/lucide-react.mjs";
import { i as AGENTS, o as STAGES, r as useSprintStore, s as STARTERS, u as timeAgo } from "./router-D3oKOygD.mjs";
import { n as Textarea, t as Button } from "./textarea-ZaQpEUsX.mjs";
import { t as StackMark } from "./mark-ChUom3Mb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes--qX6VLeN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Landing() {
	const navigate = useNavigate();
	const hydrated = useSprintStore((s) => s.hydrated);
	const sprints = useSprintStore((s) => s.sprints);
	const createSprint = useSprintStore((s) => s.createSprint);
	const [idea, setIdea] = (0, import_react.useState)("");
	function start(text) {
		const trimmed = text.trim();
		if (!trimmed) return;
		const sprint = createSprint(trimmed);
		navigate({
			to: "/sprint/$sprintId",
			params: { sprintId: sprint.id }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between px-5 py-4 md:px-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackMark, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[13px] tracking-wide text-fg",
					children: "gstack"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "flex items-center gap-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/team",
					className: "inline-flex h-11 items-center px-3 text-sm text-fg-muted transition-colors hover:text-fg",
					children: "The team"
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-5xl px-5 pb-24 md:px-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "pt-10 md:pt-16",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rise font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase",
							children: "Virtual engineering company"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "rise-2 mt-5 max-w-3xl font-display text-[2.6rem] font-medium leading-[1.05] tracking-[-0.04em] text-fg md:text-[4.4rem]",
							children: [
								"That is not a copilot.",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"That is a team."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rise-3 mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted md:text-base",
							children: "GStack is Garry Tan's workflow — office hours, CEO review, architecture, design, QA, security, ship — turned into agents you can summon. One builder. A company's worth of judgment."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rise-4 mt-12 rounded-xl bg-bg-elevated p-3 shadow-[var(--shadow-border)] md:p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "idea",
							className: "sr-only",
							children: "What are you building"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							id: "idea",
							value: idea,
							onChange: (e) => setIdea(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(idea);
							},
							placeholder: "What are you building? Paste a messy idea, a plan, or a bug.",
							className: "min-h-32 bg-transparent shadow-none focus:ring-0 md:min-h-36 md:text-base"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-col gap-3 px-1 pb-1 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-fg-subtle",
								children: "⌘ / Ctrl + Enter to open the floor"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => start(idea),
								disabled: !idea.trim(),
								className: "w-full sm:w-auto",
								children: ["Open a sprint", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: STARTERS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => start(s.idea),
						className: "h-11 rounded-md px-3 text-left text-[13px] text-fg-muted shadow-[var(--shadow-border)] transition-[box-shadow,color] duration-150 hover:text-fg hover:shadow-[var(--shadow-border-hover)]",
						children: s.title
					}, s.title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4 lg:grid-cols-7",
					children: STAGES.map((st, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "bg-bg-elevated px-3 py-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[10px] tabular-nums text-fg-subtle",
								children: String(i + 1).padStart(2, "0")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 font-display text-lg font-medium tracking-tight",
								children: st.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[12px] leading-snug text-fg-muted",
								children: st.hint
							})
						]
					}, st.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-medium tracking-tight",
							children: "Specialists on the floor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/team",
							className: "inline-flex h-11 items-center gap-1 text-sm text-fg-muted hover:text-fg",
							children: ["Full roster", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5" })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
						children: AGENTS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-lg bg-bg-elevated p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-mono text-[11px] text-fg-subtle",
									children: a.initials
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 font-display text-lg font-medium tracking-tight",
									children: a.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[12px] text-fg-muted",
									children: a.role
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-[13px] leading-snug text-fg/80",
									children: a.blurb
								})
							]
						}, a.id))
					})]
				}),
				hydrated && sprints.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-medium tracking-tight",
						children: "Open sprints"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-5 divide-y divide-border rounded-lg shadow-[var(--shadow-border)]",
						children: sprints.slice(0, 8).map((sp) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/sprint/$sprintId",
							params: { sprintId: sp.id },
							className: "flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-bg-elevated",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-medium",
									children: sp.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-[12px] text-fg-muted",
									children: [
										sp.stage,
										" · ",
										sp.messages.length,
										" notes · ",
										timeAgo(sp.updatedAt)
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 shrink-0 text-fg-subtle" })]
						}) }, sp.id))
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
					className: "mt-20 border-t border-border pt-8 text-[12px] text-fg-subtle",
					children: "Inspired by the open-source gstack skill pack. Agents recommend. You decide."
				})
			]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landing, {});
}
//#endregion
export { Home as component };
