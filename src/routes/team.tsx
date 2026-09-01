import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AGENTS, STAGES } from "@/lib/agents";
import { StackMark } from "@/components/mark";

export const Route = createFileRoute("/team")({ component: TeamPage });

function TeamPage() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-2.5">
          <StackMark className="size-5" />
          <span className="font-mono text-[13px] tracking-wide">gstack</span>
        </Link>
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          Floor
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-24 md:px-10">
        <p className="mt-8 font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase">
          Roster
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
          Ten specialists. One floor.
        </h1>
        <p className="mt-4 max-w-xl text-fg-muted">
          Each agent is a gstack role with a job, a slash command, and a refusal to
          do someone else's work. Summon them from a sprint.
        </p>
        <ul className="mt-12 space-y-8">
          {STAGES.map((st) => {
            const people = AGENTS.filter((a) => a.stage === st.id);
            if (people.length === 0) return null;
            return (
              <li key={st.id}>
                <p className="font-mono text-[11px] tracking-wide text-fg-subtle uppercase">
                  {st.label}
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {people.map((a) => (
                    <article
                      key={a.id}
                      className="rounded-lg bg-bg-elevated p-5 shadow-[var(--shadow-border)]"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="font-display text-xl font-medium tracking-tight">
                          {a.name}
                        </h2>
                        <span className="font-mono text-[11px] text-fg-subtle">{a.slash}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-fg-muted">{a.role}</p>
                      <p className="mt-3 text-sm leading-relaxed text-fg/85">{a.blurb}</p>
                    </article>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
