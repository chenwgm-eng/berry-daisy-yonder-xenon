import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { StackMark } from "@/components/mark";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const t = useT();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <StackMark className="size-5" />
          <span className="font-mono text-[13px] tracking-wide">gstack</span>
        </Link>
        <h1 className="text-center font-display text-2xl font-medium tracking-tight">
          {t("login.title")}
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-fg-muted">{t("login.sub")}</p>
        <div className="mt-8 space-y-3">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                variant="outline"
                className="w-full"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" }).catch(() => {})}
              >
                {t("login.continueWith", { provider: p.label })}
              </Button>
            ))
          ) : (
            <p className="text-center text-sm text-fg-muted">{t("login.disabled")}</p>
          )}
        </div>
      </div>
    </main>
  );
}
