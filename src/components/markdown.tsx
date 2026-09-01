import { cn } from "@/lib/utils";

function inlineFmt(text: string) {
  const parts: (string | { t: "b" | "c"; v: string })[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) parts.push({ t: "b", v: tok.slice(2, -2) });
    else parts.push({ t: "c", v: tok.slice(1, -1) });
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : p.t === "b" ? (
      <strong key={i} className="font-medium text-fg">
        {p.v}
      </strong>
    ) : (
      <code key={i} className="rounded-xs bg-bg-subtle px-1 py-px font-mono text-[0.85em]">
        {p.v}
      </code>
    ),
  );
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks: { type: string; lines: string[] }[] = [];
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < raw.length) {
    const line = raw[i] ?? "";
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i += 1;
      while (i < raw.length && !raw[i]!.startsWith("```")) {
        buf.push(raw[i]!);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", lines: buf });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const buf: string[] = [];
      while (i < raw.length && /^\s*[-*]\s+/.test(raw[i] ?? "")) {
        buf.push((raw[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", lines: buf });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf: string[] = [];
      while (i < raw.length && /^\s*\d+\.\s+/.test(raw[i] ?? "")) {
        buf.push((raw[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", lines: buf });
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      const level = (line.match(/^#+/) ?? ["#"])[0].length;
      blocks.push({ type: `h${level}`, lines: [line.replace(/^#{1,3}\s+/, "")] });
      i += 1;
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr", lines: [] });
      i += 1;
      continue;
    }
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    const buf: string[] = [];
    while (i < raw.length && (raw[i] ?? "").trim() !== "" && !/^#{1,3}\s+/.test(raw[i] ?? "") && !/^\s*[-*]\s+/.test(raw[i] ?? "") && !/^\s*\d+\.\s+/.test(raw[i] ?? "") && !(raw[i] ?? "").startsWith("```")) {
      buf.push(raw[i]!);
      i += 1;
    }
    blocks.push({ type: "p", lines: buf });
  }

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-fg/90", className)}>
      {blocks.map((b, idx) => {
        if (b.type === "code") {
          return (
            <pre
              key={idx}
              className="overflow-x-auto rounded-md bg-bg-subtle px-3 py-2 font-mono text-[12px] text-fg/85"
            >
              {b.lines.join("\n")}
            </pre>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc space-y-1 pl-5">
              {b.lines.map((l, j) => (
                <li key={j}>{inlineFmt(l)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal space-y-1 pl-5">
              {b.lines.map((l, j) => (
                <li key={j}>{inlineFmt(l)}</li>
              ))}
            </ol>
          );
        }
        if (b.type === "hr") {
          return <hr key={idx} className="border-border" />;
        }
        if (b.type.startsWith("h")) {
          const Tag = (b.type === "h1" ? "h3" : b.type === "h2" ? "h4" : "h5") as "h3" | "h4" | "h5";
          return (
            <Tag key={idx} className="font-display text-base font-medium tracking-tight text-fg">
              {inlineFmt(b.lines[0] ?? "")}
            </Tag>
          );
        }
        return (
          <p key={idx} className="whitespace-pre-wrap">
            {inlineFmt(b.lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
