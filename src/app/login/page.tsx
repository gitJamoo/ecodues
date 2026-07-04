"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    router.push("/dashboard");
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Check your email to confirm your account.");
  }

  async function magicLink() {
    if (!email) { toast.error("Enter your email first."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/confirm` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Magic link sent — check your inbox.");
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-semibold text-lg tracking-tight">Countervail</Link>
          <p className="text-sm text-muted-foreground mt-1">Make your AI use net-positive</p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <Tabs defaultValue="signin">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-in">Email</Label>
                <Input id="email-in" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-in">Password</Label>
                <Input id="pass-in" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && signIn()} />
              </div>
              <Button className="w-full" onClick={signIn} disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative text-center text-xs text-muted-foreground bg-white px-2 mx-auto w-fit">or</div>
              </div>
              <Button variant="outline" className="w-full" onClick={magicLink} disabled={loading}>
                Email me a magic link
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-up">Email</Label>
                <Input id="email-up" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass-up">Password</Label>
                <Input id="pass-up" type="password" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && signUp()} />
              </div>
              <Button className="w-full" onClick={signUp} disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/methodology" className="underline underline-offset-2">Read our methodology</Link>
        </p>
      </div>
    </div>
  );
}
