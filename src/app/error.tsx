"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 px-6 text-center">
      <Link href="/">
        <Logo size={28} />
      </Link>
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          An unexpected error occurred. Your data is safe — try again, or head back home.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button className="rounded-full px-6" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" className="rounded-full px-6">
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
