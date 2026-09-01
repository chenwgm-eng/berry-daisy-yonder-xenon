import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Pencil, Pin, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AGENTS, STAGES, STARTERS } from "@/lib/agents";
import { authEnabled } from "@/lib/auth/client";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pullMissingFromCloud, pushAllToCloud } from "@/lib/cloud-sync";
import { useT } from "@/lib/i18n";
import { useSprintStore } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LocaleToggle } from "@/components/locale-toggle";
import { StackMark } from "@/components/mark";

const IMPORT_FLAG = "gstack-cloud-import";

export function Landing() {
  const navigate = useNavigate();
  const t = useT();
  const hydrated = useSprintStore((s) => s.hydrated);
  const sprints = useSprintStore((s) => s.sprints);
  const createSprint = useSprintStore((s) => s.createSprint);
  const deleteSprint = useSprintStore((s) => s.deleteSprint);
  const togglePin = useSprintStore((s) => s.togglePin);
  const patchSprint = useSprintStore((s) => s.patchSprint);
  const [idea, setIdea] = useState("");
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importClosed, setImportClosed] = useState(() => {
    try {
      return localStorage.getItem(IMPORT_FLAG) === "done";
    } catch {
      return false;
    }
  });
  const { user, isPending } = useCurrentUserState();

  function start(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const sprint = createSprint(trimmed);
    void navigate({ to: "/sprint/$sprintId", params: { sprintId: sprint.id } });
  }

  // On sign-in: pull sprints that exist on the server but not in this browser.
  useEffect(() => {
    if (!authEnabled || isPending || !user || !hydrated) return;
    void pullMissingFromCloud().catch(() => {});
  }, [user, isPending, hydrated]);

  const showImportBanner =
    authEnabled && !isPending && Boolean(user) && hydrated && sprints.length > 0 && !importClosed;

  function closeImportBanner() {
    try {
      localStorage.setItem(IMPORT_FLAG, "done");
    } catch {
      /* ignore */
    }
    setImportClosed(true);
  }

  async function doImport() {
    setImporting(true);
    try {
      const n = await pushAllToCloud();
      toast.success(t("landing.importDone", { count: String(n) }));
      closeImportBanner();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "error");
    } finally {
      setImporting(false);
    }
  }

  const q = query.trim().toLowerCase();
  // Pinned first, then most recently touched; search filters title + briefing.
  const sorted = [...sprints].sort(
    (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.updatedAt - a.updatedAt,
  );
  const visible = q
    ? sorted.filter(
        (sp) =>
          sp.title.toLowerCase().includes(q) || sp.idea.toLowerCase().includes(q),
      )
    : sorted;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <StackMark className="size-5" />
          <span className="font-mono text-[13px] tracking-wide text-fg">gstack</span>
        </Link>
        <nav className="flex items-center gap-1">
          <LocaleToggle />
          <Link
            to="/team"
            className="inline-flex h-11 items-center px-3 text-sm text-fg-muted transition-colors hover:text-fg"
          >
            {t("nav.team")}
          </Link>
          <SignedOut>
            <Link
              to="/login"
              className="inline-flex h-11 items-center px-3 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              {t("nav.signIn")}
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 md:px-10">
        <section className="pt-10 md:pt-16">
          <p className="rise font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase">
            {t("landing.tagline")}
          </p>
          <h1 className="rise-2 mt-5 max-w-3xl font-display text-[2.6rem] font-medium leading-[1.05] tracking-[-0.04em] text-fg md:text-[4.4rem]">
            {t("landing.heroA")}
            <br />
            {t("landing.heroB")}
          </h1>
          <p className="rise-3 mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted md:text-base">
            {t("landing.heroSub")}
          </p>
        </section>

        <section className="rise-4 mt-12 rounded-xl bg-bg-elevated p-3 shadow-[var(--shadow-border)] md:p-4">
          <label htmlFor="idea" className="sr-only">
            {t("landing.ideaLabel")}
          </label>
          <Textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(idea);
            }}
            placeholder={t("landing.ideaPlaceholder")}
            className="min-h-32 bg-transparent shadow-none focus:ring-0 md:min-h-36 md:text-base"
          />
          <div className="mt-2 flex flex-col gap-3 px-1 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-fg-subtle">{t("landing.shortcutHint")}</p>
            <Button
              onClick={() => start(idea)}
              disabled={!idea.trim()}
              className="w-full sm:w-auto"
            >
              {t("landing.openSprint")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button
              key={s.title}
              type="button"
              onClick={() => start(s.idea)}
              className="h-11 rounded-md px-3 text-left text-[13px] text-fg-muted shadow-[var(--shadow-border)] transition-[box-shadow,color] duration-150 hover:text-fg hover:shadow-[var(--shadow-border-hover)]"
            >
              {s.title}
            </button>
          ))}
        </div>

        <ol className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4 lg:grid-cols-7">
          {STAGES.map((st, i) => (
            <li key={st.id} className="bg-bg-elevated px-3 py-4">
              <p className="font-mono text-[10px] tabular-nums text-fg-subtle">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 font-display text-lg font-medium tracking-tight">{st.label}</p>
              <p className="mt-1 text-[12px] leading-snug text-fg-muted">{st.hint}</p>
            </li>
          ))}
        </ol>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-medium tracking-tight">{t("landing.specialists")}</h2>
            <Link
              to="/team"
              className="inline-flex h-11 items-center gap-1 text-sm text-fg-muted hover:text-fg"
            >
              {t("landing.fullRoster")}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {AGENTS.map((a) => (
              <li
                key={a.id}
                className="rounded-lg bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
              >
                <p className="font-mono text-[11px] text-fg-subtle">{a.initials}</p>
                <p className="mt-3 font-display text-lg font-medium tracking-tight">{a.name}</p>
                <p className="text-[12px] text-fg-muted">{a.role}</p>
                <p className="mt-2 text-[13px] leading-snug text-fg/80">{a.blurb}</p>
              </li>
            ))}
          </ul>
        </section>

        {showImportBanner ? (
          <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
            <p className="text-sm text-fg-muted">
              {t("landing.importPrompt", { count: String(sprints.length) })}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void doImport()} disabled={importing}>
                {t("landing.importYes")}
              </Button>
              <Button size="sm" variant="ghost" onClick={closeImportBanner} disabled={importing}>
                {t("landing.importDismiss")}
              </Button>
            </div>
          </section>
        ) : null}

        {hydrated && sprints.length > 0 ? (
          <section className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-medium tracking-tight">{t("landing.openSprints")}</h2>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("landing.searchPlaceholder")}
                aria-label={t("landing.searchAria")}
                className="h-11 w-full rounded-md bg-bg-elevated pl-9 pr-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-fg-subtle focus:ring-2 focus:ring-accent/40"
              />
            </div>
            {visible.length === 0 ? (
              <p className="mt-4 rounded-lg px-4 py-6 text-sm text-fg-muted shadow-[var(--shadow-border)]">
                {t("landing.noMatch")}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border rounded-lg shadow-[var(--shadow-border)]">
                {visible.slice(0, q ? 20 : 8).map((sp) => (
                  <li key={sp.id} className="relative">
                    <Link
                      to="/sprint/$sprintId"
                      params={{ sprintId: sp.id }}
                      className="flex items-center justify-between gap-4 py-4 pr-28 pl-4 transition-colors hover:bg-bg-elevated"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {sp.pinned ? <Pin className="mr-1.5 inline size-3.5 text-fg-muted" /> : null}
                          {sp.title}
                        </p>
                        <p className="truncate text-[12px] text-fg-muted">
                          {sp.stage} · {sp.messages.length} notes · {timeAgo(sp.updatedAt)}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-fg-subtle" />
                    </Link>
                    <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-0.5">
                      <button
                        type="button"
                        aria-label={sp.pinned ? t("landing.unpin") : t("landing.pin")}
                        title={sp.pinned ? t("landing.unpin") : t("landing.pin")}
                        className={`inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-bg-subtle ${
                          sp.pinned ? "text-fg" : "text-fg-subtle hover:text-fg"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePin(sp.id);
                        }}
                      >
                        <Pin className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("landing.rename")}
                        title={t("landing.rename")}
                        className="inline-flex size-9 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const next = window.prompt(t("landing.rename"), sp.title);
                          if (next && next.trim() && next.trim() !== sp.title) {
                            patchSprint(sp.id, { title: next.trim() });
                          }
                        }}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("landing.delete")}
                        title={t("landing.delete")}
                        className="inline-flex size-9 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (window.confirm(t("landing.deleteConfirm", { title: sp.title }))) {
                            deleteSprint(sp.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <footer className="mt-20 border-t border-border pt-8 text-[12px] text-fg-subtle">
          {t("landing.footer")}
        </footer>
      </main>
    </div>
  );
}
