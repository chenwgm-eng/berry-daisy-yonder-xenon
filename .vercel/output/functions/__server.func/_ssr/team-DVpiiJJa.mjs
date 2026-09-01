import { _ as Link, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as ArrowLeft } from "../_libs/lucide-react.mjs";
import { i as AGENTS, o as STAGES } from "./router-D3oKOygD.mjs";
import { t as StackMark } from "./mark-ChUom3Mb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/team-DVpiiJJa.js
var import_jsx_runtime = require_jsx_runtime();
function TeamPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between px-5 py-4 md:px-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackMark, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[13px] tracking-wide",
					children: "gstack"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "inline-flex h-11 items-center gap-2 text-sm text-fg-muted hover:text-fg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), "Floor"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-4xl px-5 pb-24 md:px-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-8 font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase",
					children: "Roster"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl",
					children: "Ten specialists. One floor."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-xl text-fg-muted",
					children: "Each agent is a gstack role with a job, a slash command, and a refusal to do someone else's work. Summon them from a sprint."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-12 space-y-8",
					children: STAGES.map((st) => {
						const people = AGENTS.filter((a) => a.stage === st.id);
						if (people.length === 0) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[11px] tracking-wide text-fg-subtle uppercase",
							children: st.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-3 md:grid-cols-2",
							children: people.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-lg bg-bg-elevated p-5 shadow-[var(--shadow-border)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-display text-xl font-medium tracking-tight",
											children: a.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-[11px] text-fg-subtle",
											children: a.slash
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-[13px] text-fg-muted",
										children: a.role
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-sm leading-relaxed text-fg/85",
										children: a.blurb
									})
								]
							}, a.id))
						})] }, st.id);
					})
				})
			]
		})]
	});
}
//#endregion
export { TeamPage as component };
