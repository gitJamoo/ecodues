import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo size={26} />
        </Link>
        <div className="flex items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
          <Link
            href="/#about"
            className="hover:text-foreground transition-colors hidden sm:block"
          >
            About
          </Link>
          <Link
            href="/impact"
            className="hover:text-foreground transition-colors hidden sm:block"
          >
            Impact
          </Link>
          <Link
            href="/methodology"
            className="hover:text-foreground transition-colors hidden sm:block"
          >
            Methodology
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
