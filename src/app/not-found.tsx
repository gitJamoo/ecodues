import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Page not found · EcoDues",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-8 px-6 text-center">
      <Link href="/">
        <Logo size={28} />
      </Link>
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link href="/">
        <Button className="rounded-full px-6">Back to home</Button>
      </Link>
    </div>
  );
}
