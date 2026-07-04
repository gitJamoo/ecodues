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
import { estimateFromTokens, donationForDamage } from "@/lib/emissions/engine";
import { periodDateString, previousPeriod } from "@/lib/cycle";
import { parseStatement } from "@/lib/parse-statement";
import { usd, co2, tokens } from "@/lib/format";
import { ReminderModal } from "@/components/reminder-modal";
import { Slider } from "@/components/ui/slider";
import { ProviderLogo } from "@/components/provider-logo";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, X, ExternalLink, ClipboardPaste, Info, CalendarDays } from "lucide-react";

interface ProviderMeta {
  id: "openrouter" | "openai" | "anthropic" | "gemini";
  label: string;
  color: string;
  dashboardUrl: string;
  dashboardLabel: string;
  usageHint: string;
  apiKeySupported: boolean;
  apiKeyHint: string;
  apiKeyLink?: { url: string; label: string };
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    color: "bg-violet-50 border-violet-200",
    dashboardUrl: "https://openrouter.ai/credits",
    dashboardLabel: "openrouter.ai/credits",
    usageHint: "Click your avatar → Activity. You'll see credits used per day and model.",
    apiKeySupported: true,
    apiKeyHint: "OpenRouter API key — we'll pull your usage automatically each month.",
    apiKeyLink: { url: "https://openrouter.ai/keys", label: "openrouter.ai/keys" },
  },
  {
    id: "openai",
    label: "OpenAI",
    color: "bg-green-50 border-green-200",
    dashboardUrl: "https://platform.openai.com/usage",
    dashboardLabel: "platform.openai.com/usage",
    usageHint: "Shows your monthly spend broken down by model. Copy the total or paste the whole page.",
    apiKeySupported: true,
    apiKeyHint: "Requires an Admin API key (sk-admin-…), NOT a regular API key. We use it to pull org-wide usage.",
    apiKeyLink: { url: "https://platform.openai.com/settings/organization/admin-keys", label: "Create admin key" },
  },
  {
    id: "anthropic",
    label: "Anthropic",
    color: "bg-orange-50 border-orange-200",
    dashboardUrl: "https://console.anthropic.com/settings/billing",
    dashboardLabel: "console.anthropic.com/settings/billing",
    usageHint: "Go to Billing → Usage. Shows token counts and cost by model per month.",
    apiKeySupported: true,
    apiKeyHint: "Requires an Admin API key (sk-ant-admin01-…). Regular API keys don't have usage-report access.",
    apiKeyLink: { url: "https://console.anthropic.com/settings/admin-keys", label: "Create admin key" },
  },
  {
    id: "gemini",
    label: "Google Gemini",
    color: "bg-blue-50 border-blue-200",
    dashboardUrl: "https://aistudio.google.com/billing",
    dashboardLabel: "aistudio.google.com/billing",
    usageHint: "Open AI Studio → Settings → Billing, or check Google Cloud console for API usage costs.",
    apiKeySupported: false,
    apiKeyHint: "Google doesn't expose a per-project usage API — please log Gemini usage via Easy entry or Paste & parse instead.",
  },
];

interface Connection { id: string; provider: string; kind: string; tier_id?: string; status: string }

export function ProviderConnect({ connections }: { connections: Connection[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [tierPct, setTierPct] = useState<Record<string, number>>({});
  const [spend, setSpend] = useState<Record<string, string>>({});
  const [inputTok, setInputTok] = useState<Record<string, string>>({});
  const [outputTok, setOutputTok] = useState<Record<string, string>>({});
  const [pasteText, setPasteText] = useState<Record<string, string>>({});
  const [parsed, setParsed] = useState<Record<string, ReturnType<typeof parseStatement>>>({});
  const [savedProviders, setSavedProviders] = useState<Set<string>>(
    () => new Set(connections.map(c => c.provider))
  );
  const [reminderOpen, setReminderOpen] = useState(false);

  const connFor = (pid: string) => connections.find(c => c.provider === pid);
  const period = periodDateString(previousPeriod(new Date()));

  function markSaved(pid: string) {
    setSavedProviders(prev => new Set([...prev, pid]));
  }

  async function handleApiKey(pid: string) {
    const key = keys[pid];
    if (!key) return;
    setLoading(pid + "_key");
    const res = await connectApiKey(pid as never, key);
    setLoading(null);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    toast.success(res.isStub ? `${pid} connected (demo data in PoC)` : `${pid} connected`);
    setKeys(k => ({ ...k, [pid]: "" }));
    markSaved(pid);
  }

  async function handleTier(pid: string) {
    const tierId = tiers[pid];
    if (!tierId) return;
    const pct = tierPct[pid] ?? 100;
    const encoded = pct < 100 ? `${tierId}:${pct}` : tierId;
    setLoading(pid + "_tier");
    await connectTier(pid as never, encoded);
    setLoading(null);
    toast.success(`Subscription saved (${pct}% usage)`);
    markSaved(pid);
  }

  async function handleManual(pid: string) {
    const s = parseFloat(spend[pid] || "0");
    const inTok = parseInt(inputTok[pid] || "0", 10);
    const outTok = parseInt(outputTok[pid] || "0", 10);
    if (!s && !inTok && !outTok) { toast.error("Enter a spend amount or token counts"); return; }
    setLoading(pid + "_manual");
    await addManualUsage(pid as never, period, s, inTok, outTok);
    setLoading(null);
    toast.success("Usage recorded");
    setSpend(k => ({ ...k, [pid]: "" }));
    setInputTok(k => ({ ...k, [pid]: "" }));
    setOutputTok(k => ({ ...k, [pid]: "" }));
    markSaved(pid);
  }

  function handleParse(pid: string) {
    const result = parseStatement(pasteText[pid] ?? "");
    if (!result) {
      toast.error("Couldn't find any numbers — try pasting more of the dashboard text.");
      return;
    }
    setParsed(p => ({ ...p, [pid]: result }));
  }

  async function handlePasteSubmit(pid: string) {
    const p = parsed[pid];
    if (!p) return;
    setLoading(pid + "_paste");
    await addManualUsage(pid as never, period, p.spendUsd, p.inputTokens, p.outputTokens);
    setLoading(null);
    toast.success("Usage recorded from pasted statement");
    setPasteText(t => ({ ...t, [pid]: "" }));
    setParsed(q => ({ ...q, [pid]: null }));
    markSaved(pid);
  }

  async function handleRemove(id: string) {
    await removeConnection(id);
    toast.success("Connection removed");
  }

  return (
    <div className="space-y-4">
      {/* No-API-key banner */}
      <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-primary">No API key required.</span>
          <span className="text-muted-foreground"> You can use your subscription tier or just type in last month&apos;s spend — or paste your dashboard text and we&apos;ll parse it automatically.</span>
        </div>
      </div>

      {PROVIDERS.map(({ id: pid, label, color, dashboardUrl, dashboardLabel, usageHint, apiKeySupported, apiKeyHint, apiKeyLink }) => {
        const conn = connFor(pid);
        const provTiers = TIER_ESTIMATES.filter(t => t.provider === pid);
        const p = parsed[pid];

        return (
          <div key={pid} className={`rounded-xl border p-5 ${color}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <ProviderLogo provider={pid} size={28} className="rounded-lg overflow-hidden" />
                <h3 className="font-medium text-sm">{label}</h3>
                {conn && (
                  <Badge variant={conn.status === "error" ? "destructive" : "secondary"} className="text-xs">
                    {conn.status === "error"
                      ? <><AlertCircle className="w-3 h-3 mr-1" />Error — reconnect</>
                      : <><CheckCircle2 className="w-3 h-3 mr-1" />{conn.kind}</>}
                  </Badge>
                )}
              </div>
              {conn && (
                <button onClick={() => handleRemove(conn.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Tabs defaultValue="easy">
              <TabsList className="mb-3 bg-muted">
                <TabsTrigger value="easy" className="text-xs">Easy entry</TabsTrigger>
                <TabsTrigger value="paste" className="text-xs">Paste & parse</TabsTrigger>
                {provTiers.length > 0 && <TabsTrigger value="tier" className="text-xs">Subscription</TabsTrigger>}
                {apiKeySupported && <TabsTrigger value="api_key" className="text-xs">API key</TabsTrigger>}
              </TabsList>

              {/* ── Easy entry tab ── */}
              <TabsContent value="easy" className="space-y-3">
                <div className="rounded-lg bg-muted border border-border px-3 py-2.5 text-xs text-muted-foreground space-y-1">
                  <p>{usageHint}</p>
                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                  >
                    Open {dashboardLabel} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Monthly spend ($)</Label>
                    <Input
                      type="number" min="0" step="0.01" placeholder="e.g. 12.50"
                      value={spend[pid] ?? ""}
                      onChange={e => setSpend(s => ({ ...s, [pid]: e.target.value }))}
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Input tokens</Label>
                    <Input
                      type="number" min="0" placeholder="e.g. 1200000"
                      value={inputTok[pid] ?? ""}
                      onChange={e => setInputTok(t => ({ ...t, [pid]: e.target.value }))}
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Output tokens</Label>
                    <Input
                      type="number" min="0" placeholder="e.g. 350000"
                      value={outputTok[pid] ?? ""}
                      onChange={e => setOutputTok(t => ({ ...t, [pid]: e.target.value }))}
                      className="text-sm h-8"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Fill in spend <em>or</em> token counts — either is enough.</p>
                <Button size="sm" className="h-8" onClick={() => handleManual(pid)} disabled={loading === pid + "_manual"}>
                  {loading === pid + "_manual" ? "Saving…" : "Save usage"}
                </Button>
              </TabsContent>

              {/* ── Paste & parse tab ── */}
              <TabsContent value="paste" className="space-y-3">
                <div className="rounded-lg bg-muted border border-border px-3 py-2.5 text-xs text-muted-foreground space-y-1">
                  <p>Open your usage dashboard, select all the text on the page, copy it, and paste it below. We&apos;ll extract the numbers automatically.</p>
                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                  >
                    Open {dashboardLabel} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <textarea
                  className="w-full rounded-lg border border-border bg-card text-xs p-3 h-28 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={`Paste anything from your ${label} dashboard here — billing summary, usage breakdown, even a screenshot's copied text…`}
                  value={pasteText[pid] ?? ""}
                  onChange={e => {
                    setPasteText(t => ({ ...t, [pid]: e.target.value }));
                    setParsed(q => ({ ...q, [pid]: null }));
                  }}
                />

                {!p && (
                  <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => handleParse(pid)}>
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    Parse it
                  </Button>
                )}

                {p && (
                  <div className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      Parsed {p.confidence === "high" ? "successfully" : "with low confidence"}
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {p.notes.map((n, i) => <li key={i}>· {n}</li>)}
                    </ul>
                    {p.confidence === "low" && (
                      <p className="text-xs text-amber-600">Low confidence — double-check the numbers look right before saving.</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handlePasteSubmit(pid)} disabled={loading === pid + "_paste"}>
                        {loading === pid + "_paste" ? "Saving…" : "Looks right — save it"}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setParsed(q => ({ ...q, [pid]: null }))}>
                        Try again
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Subscription tier tab ── */}
              {provTiers.length > 0 && (() => {
                const selectedTier = TIER_ESTIMATES.find(t => t.id === tiers[pid]);
                const pct = tierPct[pid] ?? 100;
                const scaledIn  = selectedTier ? Math.round(selectedTier.monthlyInputTokens  * pct / 100) : 0;
                const scaledOut = selectedTier ? Math.round(selectedTier.monthlyOutputTokens * pct / 100) : 0;
                const estimate  = selectedTier ? estimateFromTokens(selectedTier.modelClass, scaledIn, scaledOut) : null;
                return (
                  <TabsContent value="tier" className="space-y-3">
                    <p className="text-xs text-muted-foreground">Pick your consumer plan. Adjust the usage slider to match how heavily you use it.</p>

                    <Select onValueChange={(v: string | null) => { if (v) setTiers(t => ({ ...t, [pid]: v })); }}>
                      <SelectTrigger className="text-sm h-8">
                        <SelectValue placeholder="Pick your plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {provTiers.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-sm">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedTier && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <Label className="text-[11px] text-muted-foreground">How much do you use it?</Label>
                          <span className="font-semibold tabular-nums text-foreground">{pct}%</span>
                        </div>
                        <Slider
                          min={5} max={100} step={5}
                          value={[pct]}
                          onValueChange={(vals) => setTierPct(p => ({ ...p, [pid]: (vals as number[])[0] }))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Light user</span>
                          <span>Average</span>
                          <span>Heavy user</span>
                        </div>
                      </div>
                    )}

                    {estimate && (
                      <div className="rounded-lg bg-card border border-border px-3 py-2.5 text-xs space-y-1">
                        <p className="font-medium text-foreground">Estimated monthly impact</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                          <span>Input tokens</span>  <span className="tabular-nums text-right">{tokens(scaledIn)}</span>
                          <span>Output tokens</span> <span className="tabular-nums text-right">{tokens(scaledOut)}</span>
                          <span>CO₂e</span>          <span className="tabular-nums text-right">{co2(estimate.kgCo2e)}</span>
                          <span>Damage</span>         <span className="tabular-nums text-right font-medium text-foreground">{usd(estimate.damageUsd)}</span>
                          <span>Donation (2×)</span>  <span className="tabular-nums text-right font-semibold text-primary">{usd(donationForDamage(estimate.damageUsd, 2))}</span>
                        </div>
                      </div>
                    )}

                    <Button size="sm" className="h-8" onClick={() => handleTier(pid)} disabled={loading === pid + "_tier" || !tiers[pid]}>
                      {loading === pid + "_tier" ? "Saving…" : "Save plan"}
                    </Button>
                  </TabsContent>
                );
              })()}

              {/* ── API key tab ── */}
              {apiKeySupported && (
                <TabsContent value="api_key" className="space-y-2">
                  <p className="text-xs text-muted-foreground">{apiKeyHint}</p>
                  {apiKeyLink && (
                    <a
                      href={apiKeyLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      {apiKeyLink.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder={`${label} API key`}
                      value={keys[pid] ?? ""}
                      onChange={e => setKeys(k => ({ ...k, [pid]: e.target.value }))}
                      className="text-sm h-8"
                    />
                    <Button size="sm" className="h-8 shrink-0" onClick={() => handleApiKey(pid)} disabled={loading === pid + "_key"}>
                      {loading === pid + "_key" ? "…" : "Connect"}
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        );
      })}

      {/* Reminder banner — appears after first provider saved */}
      {savedProviders.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-primary">Set a monthly reminder</span>
              <span className="text-muted-foreground"> — so you don&apos;t forget to log usage before the 1st.</span>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5 ml-4" onClick={() => setReminderOpen(true)}>
            <CalendarDays className="w-3.5 h-3.5" />
            Set reminder
          </Button>
        </div>
      )}

      <ReminderModal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        providers={PROVIDERS.filter(p => savedProviders.has(p.id))}
      />
    </div>
  );
}
