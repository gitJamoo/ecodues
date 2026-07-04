import { cn } from "@/lib/utils";

interface CharityLogoProps {
  name: string;
  url?: string;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  const words = name.split(" ").filter(w => w.length > 2 && !["for", "the", "and", "of"].includes(w.toLowerCase()));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function CharityLogo({ name, url, size = 36, className }: CharityLogoProps) {
  const domain = url ? domainFromUrl(url) : null;
  const mono = initials(name);

  if (domain) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center rounded-lg bg-white border border-border overflow-hidden", className)}
        style={{ width: size, height: size, borderRadius: size * 0.2 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt={name}
          width={size * 0.65}
          height={size * 0.65}
          style={{ objectFit: "contain" }}
        />
      </span>
    );
  }

  // Fallback: monogram avatar
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground", className)}
      style={{ width: size, height: size, borderRadius: size * 0.2, fontSize: size * 0.36, fontWeight: 600 }}
    >
      {mono}
    </span>
  );
}
