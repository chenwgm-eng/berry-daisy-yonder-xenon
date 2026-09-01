# GStack — a virtual engineering company in your browser

GStack turns one builder into a team. Open a sprint, and ten specialists — a
YC-style office-hours partner, a CEO reviewer, an eng manager, a designer, a
staff engineer, QA, security, release, and a debugger — challenge the idea,
produce design docs and reviews, and hand work to each other. Inspired by the
open-source [gstack](https://github.com/garrytan/gstack) skill pack.

Built with TanStack Start, React 19, Tailwind CSS v4, Better Auth, and the
xAI chat API (streaming).

## Quick start

```bash
npm install
export XAI_API_KEY=...   # or put it in a .env file (gitignored)
npm run dev              # serves on http://localhost:8080
```

Open the app, describe what you're building, and the Conductor kicks off the
floor. Use slash commands (`/ceo`, `/eng`, `/qa`, …) or the roster to talk to
a specific specialist — a bare `/ceo` just switches who you're talking to.
"Run review board" gets office-hours + CEO + design + eng in one pass and
renders each specialist as its own card. Any reply can be retried or
re-answered by a different specialist from its action bar. Durable
deliverables land in the Artifacts panel, where they can be copied, downloaded
as Markdown, or published straight to a GitHub issue (set a PAT once — it
stays in this browser; the call goes browser → api.github.com directly).
Sprints can be searched, pinned, renamed, and deleted from the home page. The
UI speaks English and 中文 — use the header toggle.

Sign in (Google / X via the Grok broker) to sync sprints across devices and
share a revocable read-only link (`/share/<id>`) for any sprint — teammates
read the full transcript and artifacts, no account needed on their side.
Signed-out visitors keep the pure-local mode; nothing breaks.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on 0.0.0.0:8080 (via `scripts/with-app-env.mjs`) |
| `npm run build` | Production build + DB migration step |
| `npm run preview` / `preview:restart` | Serve the built output on 127.0.0.1:8081 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Node test runner: scripts + lib unit tests |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run check:auth` | Dev-server vs build auth-flag agreement |
| `node scripts/browser-smoke.mjs` | Headless desktop + mobile render check |

CI runs typecheck, tests, lint and a production build on every push to `main`
and on pull requests (`.github/workflows/ci.yml`).

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `XAI_API_KEY` | yes | Server-side xAI access for `/api/chat` |
| `XAI_MODEL` | no | Model id (default `grok-4.5`) |
| `DATABASE_URL` | no | Postgres/Neon; unset → embedded PGLite (sessions + sprints) |
| `VITE_AUTH_ENABLED` | no | Set `"false"` in `.grok/app-env.json` for offline local dev-user mode |

`/api/chat` is quota-guarded: a fetch-metadata check rejects scripted
cross-site calls, a per-client token bucket throttles bursts (20 req/min), and
the upstream model call aborts when the client disconnects. Pair this with
spend limits on the xAI side for real protection.

## Data & auth

Sign-in is ON: this app runs its own Better Auth at `/api/auth/*`, federating
to the Grok broker (Google / X). Sprint rows live in
`migrations/0002_sprints.sql` — per-user (`user_id` scoping on every read and
write through `authMiddleware`), the whole sprint aggregate as one JSONB
payload. Sharing mints a random `share_id`; setting it back to null revokes
the link.

Signed out: sprints stay in `localStorage` (zustand persist, versioned +
migrated). First sign-in offers a one-time import of local sprints into the
account; local copies are never auto-deleted.

## Deployment

The app targets Vercel via the nitro `vercel` preset (`npm run build` emits
`.vercel/output`, which is gitignored — never commit it). The build runs
`db:migrate` against the provisioned `DATABASE_URL`. On Vercel's free/Hobby
tier, note the serverless function duration limit: long board-mode streams
(up to 2400 tokens) can hit it. Raise the function `maxDuration` in the
Vercel project settings if board runs get cut off.

`startup.sh`, `AGENTS.md` and `.grok/` are the Grok app-builder sandbox
contract — keep them at the repo root if you round-trip the workspace through
Grok Build.

## Repo layout

- `src/routes/` — pages (`/`, `/team`, `/login`, `/sprint/$sprintId`, `/share/$shareId`) and API handlers (`api.chat`, `api/auth/$`)
- `src/components/` — landing, war room, markdown renderer, GitHub publish, UI primitives
- `src/lib/i18n.ts` — en/中文 UI strings, locale state, `t()` / `useT()`
- `src/lib/agents.ts` — the ten specialists: roles, prompts, slash commands
- `src/lib/parse-output.ts` — `:::artifact` / `:::handoff` / `:::agent:` protocol parsers (unit-tested)
- `src/lib/store.ts` — sprint store (persisted, versioned, quota-guarded)
- `src/lib/sprints.ts` + `sprints-repo.ts` — server functions + per-user SQL layer (unit-tested)
- `src/lib/cloud-sync.ts` — local ↔ cloud pull/push helpers
- `src/lib/github-publish.ts` — artifact → GitHub issue (PAT stays browser-local)
- `src/lib/auth/` — pre-wired Better Auth (do not edit; see AGENTS.md)
- `scripts/` — build/preview/QA tooling; `server/` — platform middleware

## Credits

Agent roles and builder ethos adapted from
[garrytan/gstack](https://github.com/garrytan/gstack) (MIT).
