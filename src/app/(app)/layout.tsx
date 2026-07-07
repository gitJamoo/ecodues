import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutDashboard, Plug, Heart, Trophy, Settings, LogOut } from "lucide-react";
import { DEV_MODE, DEV_USER, DEV_PROFILE } from "@/lib/dev-mode";
import { DevBanner } from "@/components/dev-banner";
import { Logo } from "@/components/logo";
import { UserAvatar } from "@/components/user-avatar";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/providers",   label: "Providers",   icon: Plug },
  { href: "/donations",   label: "Donations",   icon: Heart },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/settings",    label: "Settings",    icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let email: string;
  let username: string | null;
  let avatarUrl: string | null = null;
  if (DEV_MODE) {
    email = DEV_USER.email;
    username = DEV_PROFILE.display_name;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    email = user.email ?? "";
    // OAuth providers (GitHub) supply a profile photo in user_metadata.
    const meta = user.user_metadata as { avatar_url?: string; picture?: string } | null;
    avatarUrl = meta?.avatar_url ?? meta?.picture ?? null;
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
    username = profile?.display_name ?? null;
  }

  return (
    <div className={`flex min-h-screen bg-muted/30 ${DEV_MODE ? "pt-8" : ""}`}>
      {DEV_MODE && <DevBanner />}

      {/* Mobile top nav — icons-only so all 5 items fit at 360px; sign-out pinned outside scroll region */}
      <nav className={`sm:hidden fixed ${DEV_MODE ? "top-8" : "top-0"} left-0 right-0 z-20 bg-card border-b border-border`}>
        <div className="flex items-center px-3 py-2 gap-1">
          {/* Scrollable nav items — overflow-x-auto kept as a safety valve */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            <Link href="/dashboard" className="shrink-0 mr-1">
              <Logo size={20} />
            </Link>
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex items-center shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4" />
              </Link>
            ))}
          </div>
          {/* Avatar → settings; sign-out — both pinned outside the scroll region */}
          <Link href="/settings" aria-label="Your settings" className="shrink-0 ml-1">
            <UserAvatar avatarUrl={avatarUrl} name={username ?? email} size={26} />
          </Link>
          <form action="/auth/signout" method="post" className="shrink-0">
            <button
              type="submit"
              aria-label="Sign out"
              className="flex items-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </nav>

      {/* Sidebar — hidden on mobile, fixed on sm+ */}
      <aside className={`hidden sm:flex sm:flex-col w-56 fixed ${DEV_MODE ? "top-8" : "top-0"} bottom-0 left-0 bg-card border-r border-border z-10`}>
        <div className="px-5 py-4 border-b border-border">
          <Link href="/dashboard">
            <Logo size={24} />
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-2.5 px-3 mb-2">
            <UserAvatar avatarUrl={avatarUrl} name={username ?? email} size={32} />
            <div className="min-w-0">
              {username && <p className="text-sm font-medium truncate">{username}</p>}
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main — full width on mobile, offset by sidebar on sm+.
          min-w-0 stops flex min-width:auto from letting wide children push
          the page past the viewport; overflow-x-clip is the backstop. */}
      <main className="sm:ml-56 flex-1 min-w-0 overflow-x-clip px-4 sm:px-8 pb-10 pt-14 sm:pt-10 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
