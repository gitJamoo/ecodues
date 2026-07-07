import { cn } from "@/lib/utils";

/**
 * Round user avatar: the OAuth profile photo when one exists (GitHub gives
 * user_metadata.avatar_url), otherwise a brand-tinted initial.
 */
export function UserAvatar({
  avatarUrl,
  name,
  size = 32,
  className,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        aria-hidden
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className={cn("rounded-full shrink-0 border border-border object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0 bg-primary/15 text-primary font-semibold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}
