-- App schema: per-user sprints for share links + cross-device sync (Issue #2, M1).
--
-- Rows are owned: every query through src/lib/sprints.ts scopes by the verified
-- context.userId (TEXT — the preview dev user id is the string 'dev-user').
-- The one exception is the share read: a share link is a public read
-- capability (random UUID, revocable by setting share_id back to null).
--
-- payload is the whole Sprint aggregate as JSONB (messages, artifacts,
-- boardSections included): a sprint is always read and written as a unit, so
-- splitting messages/artifacts into tables would buy nothing.
--
-- Depends on the Better Auth schema (0001_auth.sql, applies first by name).

create table if not exists sprints (
  id text not null,
  user_id text not null references "user" ("id") on delete cascade,
  title text not null,
  payload jsonb not null,
  share_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists sprints_share_id_idx on sprints (share_id) where share_id is not null;
