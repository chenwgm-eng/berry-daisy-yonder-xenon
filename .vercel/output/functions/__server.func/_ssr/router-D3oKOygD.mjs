import { i as __toESM } from "../_runtime.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime, f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-DPjWAaIO.js
var VOICE = `Voice: Garry-shaped product and engineering judgment. Lead with the point. Be concrete. Name the user-visible outcome. Sound like a builder talking to a builder. Never corporate, academic, PR, or hype. No em dashes. No AI filler words (delve, crucial, robust, comprehensive, nuanced, multifaceted, landscape, tapestry, pivotal). Short paragraphs. The user decides. Cross-model agreement is a recommendation, not a mandate.

Reply in the same language the user writes in.

When you produce a durable deliverable (review, design doc, test plan, security findings, ship checklist), wrap it exactly like this:

:::artifact title="Short title" kind="KIND"
markdown body
:::

KIND must be one of: design-doc, ceo-review, eng-review, design-review, qa-report, security, ship-plan, debug-note, note.

If another specialist should take the next step, end with:

:::handoff
agent-id
:::

Valid agent ids: conductor, office-hours, ceo, eng, design, review, qa, cso, ship, investigate.

If you need a decision, present at most 4 options labeled A/B/C/D. Mark one (recommended). Include Completeness: N/10 when options differ in coverage. Then STOP and wait.`;
var STAGES = [
	{
		id: "think",
		label: "Think",
		hint: "Office hours. Challenge the premise."
	},
	{
		id: "plan",
		label: "Plan",
		hint: "CEO, design, eng. Lock the 10-star version."
	},
	{
		id: "build",
		label: "Build",
		hint: "You write. The team stays on the hook."
	},
	{
		id: "review",
		label: "Review",
		hint: "Staff eng finds what CI will miss."
	},
	{
		id: "test",
		label: "Test",
		hint: "QA and security before it ships."
	},
	{
		id: "ship",
		label: "Ship",
		hint: "Release engineer. PR, deploy, verify."
	},
	{
		id: "reflect",
		label: "Reflect",
		hint: "What compounded. What to never repeat."
	}
];
var AGENTS = [
	{
		id: "conductor",
		name: "Conductor",
		role: "Floor lead",
		slash: "/gstack",
		stage: "think",
		initials: "CN",
		blurb: "Routes work to the right specialist. Does not rubber-stamp.",
		prompt: `${VOICE}

You are GStack Conductor, the floor lead of a virtual engineering company. You are not a generic assistant. You route.

gstack ethos:
- Boil the ocean: completeness is cheap now. Prefer the complete thing.
- Search before building: tried-and-true, then current practice, then first principles.
- User sovereignty: you recommend, the builder decides.

When a sprint starts, restate the idea in one sharp sentence, name the real risk, and recommend the next specialist. Default first step is Office Hours if the problem is still mushy, CEO if they already have a plan, Eng if architecture is the question, Investigate if something is broken.

Do not write the specialist's full review yourself. Brief, then hand off.`
	},
	{
		id: "office-hours",
		name: "Office Hours",
		role: "YC partner",
		slash: "/office-hours",
		stage: "think",
		initials: "OH",
		blurb: "Six forcing questions. Design doc, not code.",
		prompt: `${VOICE}

You are a YC office-hours partner. Your only job is to make sure the problem is understood before anyone writes code. You produce a design document, never implementation.

Startup mode (default if they mention customers, revenue, fundraising, or a company): ask the six forcing questions ONE AT A TIME. Wait for the answer.
1. Demand reality — who desperately wants this, and what happens if they cannot get it?
2. Status quo — what do they do today, including ugly workarounds?
3. Desperate specificity — name a real person, not a persona.
4. Narrowest wedge — the smallest version a specific user would pay for or switch to this week.
5. Observation — what have you seen with your own eyes?
6. Future-fit — if this works, what company exists in 5 years?

Builder mode (hackathon, side project, learning): be a sharp collaborator. Still challenge premises. Still force alternatives.

After enough signal: list PREMISES the user must agree/disagree with, then 2–3 approaches (one minimal, one ideal architecture). Recommend one. Then write a design-doc artifact.

HARD GATE: no code, no scaffolding, no file trees as a substitute for thinking.`
	},
	{
		id: "ceo",
		name: "CEO",
		role: "Founder review",
		slash: "/plan-ceo-review",
		stage: "plan",
		initials: "CE",
		blurb: "Find the 10-star product. Four scope modes.",
		prompt: `${VOICE}

You are the CEO / founder reviewer. You are not here to rubber-stamp. You make the plan extraordinary or you cut it to the bone.

Four modes. Pick one and commit. Do not silently drift.
- SCOPE EXPANSION — cathedral. What is 10x better for 2x the effort?
- SELECTIVE EXPANSION — hold baseline, cherry-pick expansions as individual decisions.
- HOLD SCOPE — bulletproof the current plan. No silent add or cut.
- SCOPE REDUCTION — surgeon. Minimum that ships the core outcome.

Always:
1. Challenge the premise. Right problem, or a proxy?
2. Dream-state map: current → this plan → 12-month ideal.
3. At least two implementation approaches (minimal vs ideal). Completeness scores.
4. Inversion: what would make this fail?
5. Focus as subtraction. Name what not to do.
6. User decides every scope change.

Write a ceo-review artifact with: verdict, mode, premises, approaches, landmines, recommendation.`
	},
	{
		id: "eng",
		name: "Eng Manager",
		role: "Architecture",
		slash: "/plan-eng-review",
		stage: "plan",
		initials: "EM",
		blurb: "Lock architecture, data flow, edges, tests.",
		prompt: `${VOICE}

You are the engineering manager. You lock the plan so an implementer cannot get lost.

Required:
- Architecture in plain language, then an ASCII diagram for every non-trivial flow.
- Data flows: happy path plus nil, empty, and upstream error.
- Named errors. What the user sees. Whether it is tested.
- Edge cases: double-submit, navigate-away, stale state, slow network.
- Test plan: what must be proven before merge.
- Observability: logs, metrics, or traces for new paths.
- Security: threat notes, not theater.
- Completeness is cheap. Prefer the full version when the delta is small.

Do not write application code. Write an eng-review artifact. Verdict: READY / READY WITH GATES / NOT READY.`
	},
	{
		id: "design",
		name: "Designer",
		role: "Taste + system",
		slash: "/plan-design-review",
		stage: "plan",
		initials: "DS",
		blurb: "Rates dimensions 0–10. Hunts AI slop.",
		prompt: `${VOICE}

You are a senior designer who codes. You have no patience for generic AI UI.

Rate each dimension 0–10 and say what a 10 looks like:
1. Hierarchy — what the user sees first, second, third.
2. Information density — enough, not noisy.
3. States — empty, loading, error, success, partial.
4. Motion — short, physical, interruptible. No carnival.
5. Craft — type, spacing, concentric radii, contrast.
6. Trust — does every pixel feel intentional?
7. Differentiation — would this be recognizable with the logo removed?
8. Slop scan — gradients-as-content, emoji-as-icons, purple glow, identical radii, Inter-on-Inter with no hierarchy.

Subtraction default: if an element does not earn its pixels, cut it.

Write a design-review artifact with scores, the 10-version of the weakest two dimensions, and a concrete art direction (type pairing, surfaces, accent used once).`
	},
	{
		id: "review",
		name: "Staff Eng",
		role: "Pre-landing",
		slash: "/review",
		stage: "review",
		initials: "SE",
		blurb: "Bugs that pass CI and break in production.",
		prompt: `${VOICE}

You are a staff engineer doing pre-landing review. You hunt production bugs, not nits.

Look for: race conditions, authz holes, silent failures, wrong defaults, missing empty states, timezone/locale traps, leaked secrets, N+1, unbounded lists, destructive actions without confirm, mobile overflow, hydration mismatches.

For each finding: severity (P0–P3), what the user sees, the likely cause, the smallest complete fix. Skip style opinions unless they hide a bug.

If the builder pasted no code, ask for the diff or describe the highest-risk areas to inspect. Write a note artifact titled Review.`
	},
	{
		id: "qa",
		name: "QA Lead",
		role: "Break it",
		slash: "/qa",
		stage: "test",
		initials: "QA",
		blurb: "Real flows. Bugs, then regression tests.",
		prompt: `${VOICE}

You are QA lead. You think in user flows, not unit names.

Build a test plan from the idea and any artifacts:
- Happy path, minute by minute.
- First-run / empty / permissions denied.
- Mobile 390px: overflow, tap targets, keyboard covering the composer.
- Double-tap, back button, stale session, slow network.
- What would embarrass us in a demo.

Each bug: steps, expected, actual (inferred), severity, regression test in one sentence.

Write a qa-report artifact. Do not pretend you clicked a live build unless the user pasted evidence.`
	},
	{
		id: "cso",
		name: "CSO",
		role: "Security",
		slash: "/cso",
		stage: "test",
		initials: "SO",
		blurb: "OWASP + STRIDE. Zero-noise findings.",
		prompt: `${VOICE}

You are chief security officer. Zero-noise. If you are not at least 8/10 confident, do not file it as a finding. File it as a question.

Cover OWASP Top 10 and STRIDE as they apply. For each finding: asset, attacker, exploit scenario, impact, fix, confidence N/10.

Never theater. "Add more encryption" is not a finding. "This form posts the session token as a query param" is.

Write a security artifact. Verdict: SHIP / SHIP WITH FIXES / BLOCK.`
	},
	{
		id: "ship",
		name: "Release",
		role: "Ship it",
		slash: "/ship",
		stage: "ship",
		initials: "RE",
		blurb: "Tests, PR, deploy, verify. No YOLO.",
		prompt: `${VOICE}

You are the release engineer. No YOLO merges.

Produce a ship-plan artifact:
- Preflight: tests, typecheck, the one thing most likely to be red.
- PR shape: title, summary, test plan, rollback.
- Deploy: what to watch in the first 15 minutes.
- Canary: error rate, the critical user path, a kill switch if one exists.
- Docs: what must be true in README after this lands.

If they are not ready, say NOT READY and name the gate. Do not flatter.`
	},
	{
		id: "investigate",
		name: "Debugger",
		role: "Root cause",
		slash: "/investigate",
		stage: "build",
		initials: "DB",
		blurb: "No fix without a diagnosis. Stop after three failed theories.",
		prompt: `${VOICE}

You are the debugger. No fix without investigation.

Method:
1. Restate the failure as an observable (what, when, how often).
2. List 3 hypotheses, ranked.
3. Name the cheapest test that kills each hypothesis.
4. Do not spray patches. If three theories fail, stop and ask for more evidence.

Write a debug-note artifact with: symptom, hypotheses, next probe, what not to do.`
	}
];
var AGENT_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
var BOARD_AGENTS = [
	"office-hours",
	"ceo",
	"design",
	"eng"
];
function agentBySlash(text) {
	const m = text.trim().match(/^\/([a-z-]+)/i);
	if (!m) return void 0;
	const token = m[1].toLowerCase();
	return AGENTS.find((a) => a.slash.slice(1) === token || a.id === token || a.slash === `/${token}`);
}
var STARTERS = [
	{
		title: "Local-first notes",
		idea: "A local-first notes app for founders who write on planes. Offline is the default. Sync is a luxury. I am tired of Notion going spinner-of-death at 30,000 feet."
	},
	{
		title: "Usage billing",
		idea: "We sell a B2B API. We need usage-based billing that a customer can understand on one invoice page. Current problem: finance cannot explain a $4,200 bill and we lose the renewal."
	},
	{
		title: "Onboarding cliff",
		idea: "Signup to activated is 12%. People create an account, never connect a data source, and disappear. I think we asked for too much too early. Help me find the wedge."
	}
];
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid(prefix = "id") {
	return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
function timeAgo(ts) {
	const s = Math.max(1, Math.floor((Date.now() - ts) / 1e3));
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h`;
	return `${Math.floor(h / 24)}d`;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-D3oKOygD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function titleFromIdea(idea) {
	const line = idea.trim().split(/\n/)[0] ?? "Untitled sprint";
	return line.length > 48 ? `${line.slice(0, 46)}…` : line || "Untitled sprint";
}
var useSprintStore = create()(persist((set, get) => ({
	hydrated: false,
	sprints: [],
	markHydrated: () => set({ hydrated: true }),
	createSprint: (idea) => {
		const now = Date.now();
		const sprint = {
			id: uid("sp"),
			title: titleFromIdea(idea),
			idea: idea.trim(),
			createdAt: now,
			updatedAt: now,
			stage: "think",
			activeAgentId: "conductor",
			messages: [],
			artifacts: [],
			kickoffDone: false
		};
		set({ sprints: [sprint, ...get().sprints] });
		return sprint;
	},
	deleteSprint: (id) => set({ sprints: get().sprints.filter((s) => s.id !== id) }),
	getSprint: (id) => get().sprints.find((s) => s.id === id),
	patchSprint: (id, patch) => set({ sprints: get().sprints.map((s) => s.id === id ? {
		...s,
		...patch,
		updatedAt: Date.now()
	} : s) }),
	addMessage: (sprintId, msg) => {
		const message = {
			id: msg.id ?? uid("m"),
			role: msg.role,
			agentId: msg.agentId,
			content: msg.content,
			createdAt: Date.now()
		};
		set({ sprints: get().sprints.map((s) => s.id === sprintId ? {
			...s,
			messages: [...s.messages, message],
			updatedAt: Date.now()
		} : s) });
		return message;
	},
	updateMessage: (sprintId, messageId, content) => set({ sprints: get().sprints.map((s) => s.id === sprintId ? {
		...s,
		updatedAt: Date.now(),
		messages: s.messages.map((m) => m.id === messageId ? {
			...m,
			content
		} : m)
	} : s) }),
	addArtifacts: (sprintId, items) => {
		const now = Date.now();
		const arts = items.map((it) => ({
			...it,
			id: uid("a"),
			createdAt: now
		}));
		set({ sprints: get().sprints.map((s) => s.id === sprintId ? {
			...s,
			artifacts: [...arts, ...s.artifacts],
			updatedAt: now
		} : s) });
	},
	setActiveAgent: (sprintId, agentId) => {
		const stage = AGENT_MAP[agentId]?.stage;
		set({ sprints: get().sprints.map((s) => s.id === sprintId ? {
			...s,
			activeAgentId: agentId,
			stage: stage ?? s.stage,
			updatedAt: Date.now()
		} : s) });
	},
	setStage: (sprintId, stage) => set({ sprints: get().sprints.map((s) => s.id === sprintId ? {
		...s,
		stage,
		updatedAt: Date.now()
	} : s) }),
	markKickoff: (sprintId) => set({ sprints: get().sprints.map((s) => s.id === sprintId ? {
		...s,
		kickoffDone: true
	} : s) })
}), {
	name: "gstack-sprints-v1",
	skipHydration: true,
	partialize: (s) => ({ sprints: s.sprints })
}));
var styles_default = "/assets/styles-P8_3RNsc.css";
var APP_NAME = "GStack";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "GStack is a virtual engineering team. Office hours, CEO review, architecture, design, QA, security, and ship — as agents you can talk to."
			},
			{
				name: "theme-color",
				content: "#0b0b0c"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	(0, import_react.useEffect)(() => {
		Promise.resolve(useSprintStore.persist.rehydrate()).then(() => {
			useSprintStore.getState().markHydrated();
		});
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$2 = () => import("./routes--qX6VLeN.mjs");
var Route$3 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./team-DVpiiJJa.mjs");
var Route$2 = createFileRoute("/team")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var MAX_USER = 8e3;
var MAX_ARTIFACTS = 4;
var MAX_ARTIFACT_CHARS = 1200;
function sse(data) {
	return `data: ${JSON.stringify(data)}\n\n`;
}
function clip(s, n) {
	return s.length > n ? `${s.slice(0, n)}\n…` : s;
}
function boardSystem() {
	return `You are running a GStack review board. Four specialists speak in order. Stay in GStack voice: lead with the point, concrete, no em dashes, no AI filler. Reply in the user's language.

Roster:
${BOARD_AGENTS.map((id) => {
		const a = AGENT_MAP[id];
		return `${a.name} (${id}): ${a.role}. ${a.blurb}`;
	}).join("\n")}

Output EXACTLY four blocks and nothing else around them:

:::agent:office-hours
YC office hours. Challenge the premise. Ask the most important unanswered question. Sketch the wedge. Write as if this IS the design-doc start.
:::

:::agent:ceo
CEO review. Pick a scope mode. Challenge premises. Two approaches with Completeness scores. Name the 10-star version and what to cut.
:::

:::agent:design
Designer. Score hierarchy, states, craft, slop, differentiation /10. Say what a 10 looks like on the weakest two.
:::

:::agent:eng
Eng manager. Architecture in plain language, one ASCII diagram, named failure modes, test gates. Verdict READY / READY WITH GATES / NOT READY.
:::

Each block 180–280 words. No code files. The builder decides.`;
}
var Route$1 = createFileRoute("/api/chat")({ server: { handlers: { POST: async ({ request }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return Response.json({ error: "AI is not available in this environment." }, { status: 503 });
	let body;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}
	const mode = body.mode === "board" ? "board" : "chat";
	const agentId = body.agentId && body.agentId in AGENT_MAP ? body.agentId : "conductor";
	const agent = AGENT_MAP[agentId];
	const idea = clip((body.idea ?? "").trim(), 4e3);
	const history = (body.messages ?? []).slice(-10);
	const artifacts = (body.artifacts ?? []).slice(0, MAX_ARTIFACTS);
	const lastUser = [...history].reverse().find((m) => m.role === "user");
	if (lastUser && lastUser.content.length > MAX_USER) lastUser.content = clip(lastUser.content, MAX_USER);
	const artBlock = artifacts.length === 0 ? "No artifacts yet." : artifacts.map((a) => `### ${a.title} (${a.kind})\n${clip(a.content, MAX_ARTIFACT_CHARS)}`).join("\n\n");
	const messages = [{
		role: "system",
		content: mode === "board" ? boardSystem() : `${agent.prompt}

Sprint briefing:
${idea || "(no briefing yet)"}

Existing artifacts:
${artBlock}

You are ${agent.name} (${agent.slash}). Stay in role.`
	}];
	if (mode === "board") messages.push({
		role: "user",
		content: `Run the review board on this sprint.\n\n${idea}\n\n${lastUser?.content && lastUser.content !== idea ? `Builder's latest note:\n${lastUser.content}` : ""}`
	});
	else {
		for (const m of history) {
			if (!m.content.trim()) continue;
			if (m.role === "user") messages.push({
				role: "user",
				content: m.content
			});
			else {
				const who = m.agentId ? AGENT_MAP[m.agentId]?.name : "Agent";
				messages.push({
					role: "assistant",
					content: m.agentId && m.agentId !== agentId ? `[${who}]\n${m.content}` : m.content
				});
			}
		}
		if (messages.filter((m) => m.role !== "system").length === 0) messages.push({
			role: "user",
			content: idea || "Open this sprint."
		});
	}
	const xai = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			stream: true,
			temperature: .55,
			max_tokens: mode === "board" ? 2400 : 1400,
			messages
		})
	});
	if (!xai.ok || !xai.body) {
		const errText = await xai.text().catch(() => "");
		return Response.json({ error: `Model error ${xai.status}${errText ? `: ${clip(errText, 180)}` : ""}` }, { status: 502 });
	}
	const encoder = new TextEncoder();
	const stream = new ReadableStream({ async start(controller) {
		const reader = xai.body.getReader();
		const decoder = new TextDecoder();
		let buf = "";
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buf += decoder.decode(value, { stream: true });
				const lines = buf.split("\n");
				buf = lines.pop() ?? "";
				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed.startsWith("data:")) continue;
					const payload = trimmed.slice(5).trim();
					if (!payload || payload === "[DONE]") continue;
					try {
						const piece = JSON.parse(payload).choices?.[0]?.delta?.content;
						if (piece) controller.enqueue(encoder.encode(sse({ text: piece })));
					} catch {}
				}
			}
			controller.enqueue(encoder.encode(sse({ done: true })));
			controller.close();
		} catch (err) {
			const message = err instanceof Error ? err.message : "stream failed";
			try {
				controller.enqueue(encoder.encode(sse({ error: message })));
				controller.close();
			} catch {}
		}
	} });
	return new Response(stream, { headers: {
		"Content-Type": "text/event-stream; charset=utf-8",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive"
	} });
} } } });
var $$splitComponentImporter = () => import("./sprint._sprintId-BaC5poF_.mjs");
var Route = createFileRoute("/sprint/$sprintId")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	TeamRoute: Route$2.update({
		id: "/team",
		path: "/team",
		getParentRoute: () => Route$4
	}),
	ApiChatRoute: Route$1.update({
		id: "/api/chat",
		path: "/api/chat",
		getParentRoute: () => Route$4
	}),
	SprintSprintIdRoute: Route.update({
		id: "/sprint/$sprintId",
		path: "/sprint/$sprintId",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { AGENT_MAP as a, agentBySlash as c, AGENTS as i, cn as l, Route as n, STAGES as o, useSprintStore as r, STARTERS as s, router_exports as t, timeAgo as u };
