import { cn } from "@/lib/utils";

interface LogoProps {
  /** Show icon + wordmark (default) or icon only */
  iconOnly?: boolean;
  /** Icon size in px (default 28) */
  size?: number;
  className?: string;
}

// Rendered as <img> rather than inline SVG on purpose: the logo appears in
// both the hidden and visible nav variants on the same page, and duplicate
// inline gradient ids inside a display:none subtree break fill resolution in
// Chromium (the sidebar leaves rendered unfilled). Each <img> is its own SVG
// document, so ids can't collide. Artwork lives in public/logo.svg — keep in
// sync with src/app/icon.svg and src/lib/brand.ts.
export function Logo({ iconOnly = false, size = 28, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        width={size}
        height={size}
        alt=""
        aria-hidden
        style={{ flexShrink: 0 }}
      />
      {!iconOnly && (
        <span className="font-semibold tracking-tight leading-none">EcoDues</span>
      )}
    </span>
  );
}
