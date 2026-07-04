"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { connectApiKey, connectTier, addManualUsage, removeConnection } from "@/lib/actions";
import { TIER_ESTIMATES } from "@/lib/emissions/tiers";
import { periodDateString, previousPeriod } from "@/lib/cycle";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const PROVIDERS = [
  { id: "openrouter" as const, label: "OpenRouter", color: "bg-violet-50 border-violet-200" },
  { id: "openai"     as const, label: "OpenAI",     color: "bg-green-50 border-green-200" },
  { id: "anthropic"  as const, label: "Anthropic",  color: "bg-orange-50 border-orange-200" },
  { id: "gemini"     as const, label: "Gemini",     color: "bg-blue-50 border-blue-200" },
];

interface Connection { id: string; provider: string; kind: string; tier_id?: string; status: string }

export function ProviderConnect({ connections }: { connections: Connection[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [spend, setSpend] = useState<Record<string, string>>({});

  const connFor = (pid: string) => connections.find(c => c.provider === pid);

  async function handleApiKey(pid: string) {
    const key = keys[pid];
    if (!key) return;
    setLoading(pid + "_key");
    const res = await connectApiKey(pid as never, key);
    setLoading(null);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success(
      res.isStub
        ? `${pid} connected (demo data in PoC — real connector coming soon)`
        : `${pid} connected`,
    );
    setKeys(k => ({ ...k, [pid]: "" }));
  }

  async function handleTier(pid: string) {
    const tierId = tiers[pid];
    if (!tierId) return;
    setLoading(pid + "_tier");
    await connectTier(pid as never, tierId);
    setLoading(null);
    toast.success("Subscription tier saved");
  }

  async function handleManual(pid: string) {
    const s = parseFloat(spend[pid] || "0");
    if (!s) { toast.error("Enter a spend amount"); return; }
    setLoading(pid + "_manual");
    const period = periodDateString(previousPeriod(new Date()));
    await addManualUsage(pid as never, period, s, 0, 0);
    setLoading(null);
    toast.success("Manual usage recorded");
    setSpend(k => ({ ...k, [pid]: "" }));
  }

  async function handleRemove(id: string) {
    await removeConnection(id);
    toast.success("Connection removed");
  }

  return (
    <div className="space-y-4">
      {PROVIDERS.map(({ id: pid, label, color }) => {
        const conn = connFor(pid);
        const provTiers = TIER_ESTIMATES.filter(t => t.provider === pid);
        return (
          <div key={pid} className={`rounded-xl border p-5 ${color}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{label}</h3>
                {conn && (
                  <Badge variant={conn.status === "error" ? "destructive" : "secondary"} className="text-xs">
                    {conn.status === "error" ? <AlertCircle className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {conn.status === "error" ? "Error — reconnect" : conn.kind}
                  </Badge>
                )}
              </div>
              {conn && (
                <button onClick={() => handleRemove(conn.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Tabs defaultValue="api_key">
              <TabsList className="mb-3 bg-white/70">
                <TabsTrigger value="api_key" className="text-xs">API key</TabsTrigger>
                {provTiers.length > 0 && <TabsTrigger value="tier" className="text-xs">Subscription</TabsTrigger>}
                <TabsTrigger value="manual" className="text-xs">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="api_key" className="space-y-2">
                {pid !== "openrouter" && (
                  <p className="text-xs text-muted-foreground mb-2">Demo data in PoC — real API connector coming soon.</p>
                )}
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={`${label} API key`}
                    value={keys[pid] ?? ""}
                    onChange={e => setKeys(k => ({ ...k, [pid]: e.target.value }))}
                    className="bg-white text-sm h-8"
                  />
                  <Button size="sm" className="h-8 shrink-0" onClick={() => handleApiKey(pid)} disabled={loading === pid + "_key"}>
                    {loading === pid + "_key" ? "…" : "Connect"}
                  </Button>
                </div>
              </TabsContent>

              {provTiers.length > 0 && (
                <TabsContent value="tier" className="space-y-2">
                  <div className="flex gap-2">
                    <Select onValueChange={(v: string | null) => { if (v) setTiers((t: Record<string, string>) => ({ ...t, [pid]: v })); }}>
                      <SelectTrigger className="bg-white text-sm h-8">
                        <SelectValue placeholder="Pick your plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {provTiers.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-sm">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 shrink-0" onClick={() => handleTier(pid)} disabled={loading === pid + "_tier"}>
                      {loading === pid + "_tier" ? "…" : "Save"}
                    </Button>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="manual" className="space-y-2">
                <Label className="text-xs text-muted-foreground">Last month API spend ($)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number" min="0" step="0.01"
                    placeholder="e.g. 12.50"
                    value={spend[pid] ?? ""}
                    onChange={e => setSpend(s => ({ ...s, [pid]: e.target.value }))}
                    className="bg-white text-sm h-8"
                  />
                  <Button size="sm" className="h-8 shrink-0" onClick={() => handleManual(pid)} disabled={loading === pid + "_manual"}>
                    {loading === pid + "_manual" ? "…" : "Add"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
      })}
    </div>
  );
}
