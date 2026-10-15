"use client";

import type { ReactNode } from "react";

export function GlobeBadge({
  children,
  withPulse = false,
}: {
  children: ReactNode;
  withPulse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-hairline px-3 py-1.5 font-mono text-label-s uppercase text-fg-secondary">
      {withPulse && (
        <span
          aria-hidden="true"
          className="relative inline-flex h-1.5 w-1.5 items-center justify-center"
        >
          <span
            data-pulse-ring
            className="absolute inset-0 rounded-full bg-accent"
          />
          <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      )}
      {children}
    </span>
  );
}
