import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full min-h-24 resize-none rounded-md bg-bg-elevated px-4 py-3 text-sm text-fg placeholder:text-fg-subtle shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 focus:shadow-[var(--shadow-border-hover)] focus:ring-2 focus:ring-accent/40",
        className,
      )}
      {...props}
    />
  );
}
