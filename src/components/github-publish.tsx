import { useState } from "react";
import { Github } from "lucide-react";
import { toast } from "sonner";
import type { Artifact } from "@/lib/types";
import {
  getGitHubPat,
  getGitHubTarget,
  isGitHubConfigured,
  parseTarget,
  publishArtifactToGitHub,
  setGitHubPat,
  setGitHubTarget,
  type PublishErrorKind,
} from "@/lib/github-publish";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/**
 * Artifact → GitHub issue. Icon button in the artifact panel; the first click
 * (or any click while unconfigured) opens a fixed setup card for the PAT +
 * owner/repo. Both live only in this browser's localStorage.
 */
export function PublishToGitHubButton({
  artifact,
  sprintTitle,
}: {
  artifact: Artifact;
  sprintTitle: string;
}) {
  const t = useT();
  const [configured, setConfigured] = useState(isGitHubConfigured);
  const [setupOpen, setSetupOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pat, setPat] = useState("");
  const [target, setTarget] = useState("");

  const errText: Record<PublishErrorKind, string> = {
    auth: t("gh.errAuth"),
    forbidden: t("gh.errForbidden"),
    validation: t("gh.errValidation"),
    network: t("gh.errNetwork"),
    unknown: t("gh.errUnknown"),
  };

  function openSetup() {
    setPat(getGitHubPat() ?? "");
    const cur = getGitHubTarget();
    setTarget(cur ? `${cur.owner}/${cur.repo}` : "");
    setSetupOpen(true);
  }

  function save() {
    const parsed = parseTarget(target);
    if (!pat.trim() || !parsed) {
      toast.error(t("gh.errValidation"));
      return;
    }
    setGitHubPat(pat.trim());
    setGitHubTarget(parsed);
    setConfigured(true);
    setSetupOpen(false);
    toast.success(t("gh.saved"));
  }

  function remove() {
    setGitHubPat(null);
    setGitHubTarget(null);
    setConfigured(false);
    setSetupOpen(false);
    toast.success(t("gh.removed"));
  }

  async function publish() {
    if (!configured) {
      openSetup();
      return;
    }
    setPublishing(true);
    try {
      const res = await publishArtifactToGitHub({
        title: artifact.title,
        content: artifact.content,
        sprintTitle,
      });
      if (res.ok) {
        toast.success(t("gh.published"), {
          description: (
            <a href={res.url} target="_blank" rel="noreferrer" className="underline break-all">
              {res.url}
            </a>
          ),
        });
      } else if (res.message === "not configured") {
        openSetup();
      } else {
        toast.error(errText[res.kind], { description: res.message || undefined });
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={publishing}
        onClick={() => void publish()}
        aria-label={t("gh.publish")}
        title={t("gh.publish")}
        className="inline-flex size-8 items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-40"
      >
        <Github className="size-3.5" />
      </button>
      {setupOpen ? (
        <div className="fixed right-4 bottom-4 z-50 w-80 rounded-lg border border-border bg-bg-elevated p-4 shadow-[var(--shadow-border)]">
          <p className="font-display text-base font-medium">{t("gh.setupTitle")}</p>
          <p className="mt-1 text-[12px] leading-snug text-fg-muted">{t("gh.setupNote")}</p>
          <label className="mt-3 block text-[12px] text-fg-muted">{t("gh.patLabel")}</label>
          <input
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder={t("gh.patPlaceholder")}
            autoComplete="off"
            className="mt-1 h-10 w-full rounded-md bg-bg px-3 font-mono text-[12px] text-fg shadow-[var(--shadow-border)] outline-none focus:ring-2 focus:ring-accent/40"
          />
          <label className="mt-3 block text-[12px] text-fg-muted">{t("gh.targetLabel")}</label>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={t("gh.targetPlaceholder")}
            autoComplete="off"
            className="mt-1 h-10 w-full rounded-md bg-bg px-3 font-mono text-[12px] text-fg shadow-[var(--shadow-border)] outline-none focus:ring-2 focus:ring-accent/40"
          />
          <div className="mt-4 flex items-center justify-between gap-2">
            {configured ? (
              <button
                type="button"
                onClick={remove}
                className="text-[12px] text-danger hover:underline"
              >
                {t("gh.remove")}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSetupOpen(false)}>
                {t("gh.cancel")}
              </Button>
              <Button size="sm" onClick={save}>
                {t("gh.save")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
