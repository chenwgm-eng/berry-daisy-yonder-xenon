import { cn } from "@/lib/utils";

export function StackMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("text-fg", className)}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="3.2" rx="0.6" fill="currentColor" />
      <rect x="3" y="10.4" width="13.5" height="3.2" rx="0.6" fill="currentColor" opacity="0.72" />
      <rect x="3" y="16.8" width="9" height="3.2" rx="0.6" fill="currentColor" opacity="0.44" />
    </svg>
  );
}
