import { cn } from "@/lib/utils";

interface LogoProps {
  /** Show icon + wordmark (default) or icon only */
  iconOnly?: boolean;
  /** Icon size in px (default 28) */
  size?: number;
  className?: string;
}

export function Logo({ iconOnly = false, size = 28, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ed-leaf" x1="120" y1="100" x2="380" y2="360" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8CF76B" />
            <stop offset="1" stopColor="#33C35D" />
          </linearGradient>
        </defs>
        {/* Full-bleed tile — keep in sync with src/app/icon.svg and src/lib/brand.ts */}
        <rect x="0" y="0" width="512" height="512" rx="110" fill="#081B17" />
        <path
          d="M135 170 C170 125 245 120 340 128 C322 178 270 215 205 215 H135 Z"
          fill="url(#ed-leaf)"
        />
        <path
          d="M135 297 C170 252 245 247 340 255 C322 305 270 342 205 342 H135 Z"
          fill="url(#ed-leaf)"
        />
      </svg>
      {!iconOnly && (
        <span className="font-semibold tracking-tight leading-none">EcoDues</span>
      )}
    </span>
  );
}
