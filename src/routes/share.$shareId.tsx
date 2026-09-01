import { createFileRoute, Link } from "@tanstack/react-router";
import { getSharedSprint } from "@/lib/sprints";
import { useT } from "@/lib/i18n";
import { Markdown } from "@/components/markdown";
import { LocaleToggle } from "@/components/locale-toggle";
import { StackMark } from "@/components/mark";
import { AgentBubble, BoardCards, Briefing } from "@/components/war-room";

export const Route = createFileRoute("/share/$shareId")({
  loader: async ({ params }) => {
    try {
      return await getSharedSprint({ data: params.shareId });
    } catch {
      return null;
    }
  },
  component: SharePage,
});

function SharePage() {
  const t = useT();
  const data = Route.useLoaderData();

  if (!data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-fg">
        <p className="font-display text-2xl">{t("share.gone")}</p>
        <Link to="/" className="text-sm text-fg-muted underline-offset-4 hover:underline">
          {t("share.openApp")}
        </Link>
      </div>
    );
  }

  const { sprint } = data;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="flex h-14 items-center gap-3 border-b border-border px-3 md:px-5">
        <Link to="/" className="flex items-center gap-2">
          <StackMark className="size-4" />
          <span className="hidden font-mono text-[12px] sm:inline">gstack</span>
        </Link>
        <span className="text-border">/</span>
        <h1 className="min-w-0 flex-1 truncate font-display text-base font-medium tracking-tight">
          {sprint.title}
        </h1>
        <span className="hidden font-mono text-[11px] text-fg-subtle sm:inline">
          {t("share.readonly")}
        </span>
        <LocaleToggle />
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8">
        <Briefing idea={sprint.idea} />
        <ol className="mt-8 space-y-6">
          {sprint.messages.map((m) => (
            <li key={m.id}>
              {m.role === "user" ? (
                <div className="ml-8 rounded-lg bg-bg-elevated px-4 py-3 shadow-[var(--shadow-border)]">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                </div>
              ) : m.boardSections && m.boardSections.length > 0 ? (
                <BoardCards sections={m.boardSections} />
              ) : (
                <AgentBubble
                  agentId={m.agentId ?? "conductor"}
                  content={m.content}
                  streaming={false}
                  waiting={false}
                />
              )}
            </li>
          ))}
        </ol>

        {sprint.artifacts.length > 0 ? (
          <section className="mt-10">
            <p className="font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">
              {t("war.artifacts")}
            </p>
            <div className="mt-3 space-y-3">
              {sprint.artifacts.map((a) => (
                <article
                  key={a.id}
                  className="rounded-lg bg-bg-elevated p-4 shadow-[var(--shadow-border)]"
                >
                  <p className="font-mono text-[11px] text-fg-subtle">{a.kind}</p>
                  <h2 className="mt-1 font-display text-lg font-medium tracking-tight">
                    {a.title}
                  </h2>
                  <Markdown className="mt-3" text={a.content} />
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
