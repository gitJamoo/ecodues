import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutDashboard, Plug, Heart, BookOpen, Settings, LogOut } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/providers",  label: "Providers",  icon: Plug },
  { href: "/donations",  label: "Donations",  icon: Heart },
  { href: "/methodology",label: "Methodology",icon: BookOpen },
  { href: "/settings",   label: "Settings",   icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-56 fixed inset-y-0 left-0 bg-white border-r border-border flex flex-col z-10">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/dashboard" className="font-semibold text-base tracking-tight">Countervail</Link>
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
          <p className="text-xs text-muted-foreground px-3 mb-2 truncate">{user.email}</p>
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

      {/* Main */}
      <main className="ml-56 flex-1 px-8 py-10 max-w-5xl">
        {children}
      </main>
    </div>
  );
}
