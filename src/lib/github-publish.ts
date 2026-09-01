const PAT_KEY = "gstack-github-pat";
const TARGET_KEY = "gstack-github-target";

export type GitHubTarget = { owner: string; repo: string };

export function getGitHubPat(): string | null {
  try {
    return localStorage.getItem(PAT_KEY);
  } catch {
    return null;
  }
}

export function setGitHubPat(token: string | null): void {
  try {
    if (token) localStorage.setItem(PAT_KEY, token);
    else localStorage.removeItem(PAT_KEY);
  } catch {
    /* ignore */
  }
}

export function getGitHubTarget(): GitHubTarget | null {
  try {
    const raw = localStorage.getItem(TARGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GitHubTarget;
    return parsed && parsed.owner && parsed.repo ? parsed : null;
  } catch {
    return null;
  }
}

export function setGitHubTarget(target: GitHubTarget | null): void {
  try {
    if (target) localStorage.setItem(TARGET_KEY, JSON.stringify(target));
    else localStorage.removeItem(TARGET_KEY);
  } catch {
    /* ignore */
  }
}

export function isGitHubConfigured(): boolean {
  return Boolean(getGitHubPat() && getGitHubTarget());
}

/** Parse "owner/repo" — the only accepted target format. */
export function parseTarget(input: string): GitHubTarget | null {
  const m = input.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
  return m ? { owner: m[1]!, repo: m[2]! } : null;
}

export type PublishErrorKind = "auth" | "forbidden" | "validation" | "network" | "unknown";

export type PublishResult =
  | { ok: true; url: string }
  | { ok: false; kind: PublishErrorKind; message: string };

/**
 * Create a GitHub issue from an artifact, browser → api.github.com directly.
 * The PAT never touches our server (localStorage only). The body appends a
 * provenance line so the issue traces back to its sprint.
 */
export async function publishArtifactToGitHub(input: {
  title: string;
  content: string;
  sprintTitle: string;
}): Promise<PublishResult> {
  const pat = getGitHubPat();
  const target = getGitHubTarget();
  if (!pat || !target) return { ok: false, kind: "unknown", message: "not configured" };

  const body = `${input.content}\n\n---\n_Exported from GStack sprint "${input.sprintTitle}" · ${new Date().toLocaleString()}_`;

  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${target.owner}/${target.repo}/issues`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ title: input.title, body }),
    });
  } catch (err) {
    return { ok: false, kind: "network", message: err instanceof Error ? err.message : String(err) };
  }

  if (res.ok) {
    const json = (await res.json().catch(() => null)) as { html_url?: string } | null;
    return {
      ok: true,
      url: json?.html_url ?? `https://github.com/${target.owner}/${target.repo}/issues`,
    };
  }

  const detail = (await res.text().catch(() => "")).slice(0, 200);
  if (res.status === 401) return { ok: false, kind: "auth", message: detail };
  if (res.status === 403 || res.status === 429) return { ok: false, kind: "forbidden", message: detail };
  if (res.status === 404 || res.status === 410 || res.status === 422) {
    return { ok: false, kind: "validation", message: detail };
  }
  return { ok: false, kind: "unknown", message: `HTTP ${res.status}: ${detail}` };
}
