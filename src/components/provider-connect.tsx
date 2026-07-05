"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { PROVIDER_CATALOG, featuredProviders, otherProviders, providerById, type ProviderMeta, type ProviderCategory } from "@/lib/providers/catalog";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, X, ExternalLink, ClipboardPaste, Info, CalendarDays, Plus, Sparkles } from "lucide-react";

interface Connection { id: string; provider: string; kind: string; tier_id?: string; status: string }

// Non-featured provider groupings for the "Add another AI service" dropdown.
const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  api: "AI providers",
  coding: "Coding assistants",
  search: "Search & assistants",
  social: "Social & consumer",
  inference: "Inference-as-a-service",
  cloud: "Cloud (Vertex / Azure / Bedrock)",
};

const CATEGORY_ORDER: ProviderCategory[] = ["coding", "search", "social", "inference", "cloud"];

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
  // Non-featured providers the user has explicitly added to their connect view.
  const [addedProviders, setAddedProviders] = useState<Set<string>>(() => {
    // Auto-add any connections that aren't featured so they show up on return visits.
    const featuredIds = new Set(featuredProviders.map(p => p.id));
    return new Set(
      connections.filter(c => !featuredIds.has(c.provider as never)).map(c => c.provider),
    );
  });
  const [customName, setCustomName] = useState("");

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
    toast.success(`Subscription saved (${pct}% usage) — will auto-add each month`);
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

  async function handleCustomSubmit() {
    const name = customName.trim();
    if (!name) { toast.error("Give this service a name"); return; }
    const s = parseFloat(spend["__custom"] || "0");
    const inTok = parseInt(inputTok["__custom"] || "0", 10);
    const outTok = parseInt(outputTok["__custom"] || "0", 10);
    if (!s && !inTok && !outTok) { toast.error("Enter a spend amount or token counts"); return; }
    setLoading("__custom");
    // Slugify so it's DB-safe and predictable across cycles.
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    await addManualUsage(slug as never, period, s, inTok, outTok);
    setLoading(null);
    toast.success(`Recorded usage for "${name}"`);
    setCustomName("");
    setSpend(k => ({ ...k, __custom: "" }));
    setInputTok(k => ({ ...k, __custom: "" }));
    setOutputTok(k => ({ ...k, __custom: "" }));
    markSaved(slug);
  }

  function addProvider(pid: string) {
    if (!pid || pid === "__none") return;
    setAddedProviders(prev => new Set([...prev, pid]));
  }

  // Which non-featured providers to render as cards right now.
  const visibleOtherProviders = useMemo(
    () => otherProviders.filter(p => addedProviders.has(p.id)),
    [addedProviders],
  );

  const providersForReminder = useMemo(() => {
    const ids = new Set([...featuredProviders.map(p => p.id), ...addedProviders]);
    return PROVIDER_CATALOG.filter(p => ids.has(p.id) && savedProviders.has(p.id));
  }, [savedProviders, addedProviders]);

  // Group non-featured providers by category for the dropdown.
  const groupedOthers = useMemo(() => {
    const groups: Record<ProviderCategory, ProviderMeta[]> = {
      api: [], coding: [], search: [], social: [], inference: [], cloud: [],
    };
    for (const p of otherProviders) groups[p.category].push(p);
    return groups;
  }, []);

  return (
    <div className="space-y-4">
      {/* No-API-key banner */}
      <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <span className="font-medium text-primary">Pick a plan or paste an API key — that&rsquo;s it.</span>
          <span className="text-muted-foreground"> Subscriptions auto-add the same amount each month. API keys auto-pull last month&rsquo;s usage. Manual entry stacks on top if you want to be exact.</span>
        </div>
      </div>

      {/* Featured providers — always visible */}
      {featuredProviders.map((meta) => (
        <ProviderCard
          key={meta.id}
          meta={meta}
          conn={connFor(meta.id)}
          keys={keys} setKeys={setKeys}
          tiers={tiers} setTiers={setTiers}
          tierPct={tierPct} setTierPct={setTierPct}
          spend={spend} setSpend={setSpend}
          inputTok={inputTok} setInputTok={setInputTok}
          outputTok={outputTok} setOutputTok={setOutputTok}
          pasteText={pasteText} setPasteText={setPasteText}
          parsed={parsed} setParsed={setParsed}
          loading={loading}
          onApiKey={handleApiKey}
          onTier={handleTier}
          onManual={handleManual}
          onParse={handleParse}
          onPasteSubmit={handlePasteSubmit}
          onRemove={handleRemove}
        />
      ))}

      {/* Added non-featured providers render inline with the same UI */}
      {visibleOtherProviders.map((meta) => (
        <ProviderCard
          key={meta.id}
          meta={meta}
          conn={connFor(meta.id)}
          keys={keys} setKeys={setKeys}
          tiers={tiers} setTiers={setTiers}
          tierPct={tierPct} setTierPct={setTierPct}
          spend={spend} setSpend={setSpend}
          inputTok={inputTok} setInputTok={setInputTok}
          outputTok={outputTok} setOutputTok={setOutputTok}
          pasteText={pasteText} setPasteText={setPasteText}
          parsed={parsed} setParsed={setParsed}
          loading={loading}
          onApiKey={handleApiKey}
          onTier={handleTier}
          onManual={handleManual}
          onParse={handleParse}
          onPasteSubmit={handlePasteSubmit}
          onRemove={handleRemove}
        />
      ))}

      {/* "Don't see your provider?" — dropdown to add non-featured services */}
      <div className="rounded-xl border border-dashed border-border p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Don&rsquo;t see your provider? Add another AI service</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Coding assistants, search AIs, image gens, inference APIs — pick one and it&rsquo;ll show up as a card above.
          Most work via tier estimate (auto-recurring) or paste-in.
        </p>
        <Select onValueChange={(v: string | null) => v && addProvider(v)}>
          <SelectTrigger className="text-sm h-9">
            <SelectValue placeholder="Choose a provider to add…" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_ORDER.map((cat) => {
              const items = groupedOthers[cat].filter(p => !addedProviders.has(p.id));
              if (items.length === 0) return null;
              return (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat]}</SelectLabel>
                  {items.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">{p.label}</SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Custom / freeform — for anything not in the catalog at all */}
      <div className="rounded-xl border border-border bg-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium">Still not listed? Log any AI usage manually</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Internal LLMs, self-hosted models, private beta tools — give it a name and enter last month&rsquo;s numbers.
          <a href="https://github.com/gitJamoo/ecodues/issues" target="_blank" rel="noopener noreferrer"
             className="text-primary hover:underline ml-1">
            Suggest a first-class provider →
          </a>
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Service name</Label>
            <Input
              placeholder="e.g. Bedrock Claude · internal RAG · Ollama"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="text-sm h-8"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 sm:col-span-1">
              <Label className="text-[11px] text-muted-foreground mb-1 block">Monthly spend ($)</Label>
              <Input
                type="number" min="0" step="0.01" placeholder="e.g. 12.50"
                value={spend["__custom"] ?? ""}
                onChange={e => setSpend(s => ({ ...s, __custom: e.target.value }))}
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Input tokens</Label>
              <Input
                type="number" min="0" placeholder="e.g. 1200000"
                value={inputTok["__custom"] ?? ""}
                onChange={e => setInputTok(t => ({ ...t, __custom: e.target.value }))}
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Output tokens</Label>
              <Input
                type="number" min="0" placeholder="e.g. 350000"
                value={outputTok["__custom"] ?? ""}
                onChange={e => setOutputTok(t => ({ ...t, __custom: e.target.value }))}
                className="text-sm h-8"
              />
            </div>
          </div>
          <Button size="sm" className="h-8" onClick={handleCustomSubmit} disabled={loading === "__custom"}>
            {loading === "__custom" ? "Saving…" : "Log usage"}
          </Button>
        </div>
      </div>

      {/* Reminder banner — appears after first provider saved */}
      {savedProviders.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-primary shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-primary">Set a monthly reminder</span>
              <span className="text-muted-foreground"> — so you don&apos;t forget to log usage before the 1st.</span>
            </div>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => setReminderOpen(true)}>
            <CalendarDays className="w-3.5 h-3.5" />
            Set reminder
          </Button>
        </div>
      )}

      <ReminderModal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        providers={providersForReminder}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// A single provider card. Renders whichever of the four modes the provider
// actually supports (apiKeySupported flag + tier availability).
// ─────────────────────────────────────────────────────────────────────────
interface ProviderCardProps {
  meta: ProviderMeta;
  conn: Connection | undefined;
  keys: Record<string, string>;
  setKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  tiers: Record<string, string>;
  setTiers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  tierPct: Record<string, number>;
  setTierPct: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  spend: Record<string, string>;
  setSpend: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  inputTok: Record<string, string>;
  setInputTok: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  outputTok: Record<string, string>;
  setOutputTok: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pasteText: Record<string, string>;
  setPasteText: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  parsed: Record<string, ReturnType<typeof parseStatement>>;
  setParsed: React.Dispatch<React.SetStateAction<Record<string, ReturnType<typeof parseStatement>>>>;
  loading: string | null;
  onApiKey: (pid: string) => void;
  onTier: (pid: string) => void;
  onManual: (pid: string) => void;
  onParse: (pid: string) => void;
  onPasteSubmit: (pid: string) => void;
  onRemove: (id: string) => void;
}

// Providers that get a themed logo. Anything else falls back to the label initial.
const LOGO_SUPPORTED = new Set(["openai", "anthropic", "openrouter", "gemini"]);

function ProviderCard(props: ProviderCardProps) {
  const {
    meta, conn, keys, setKeys, tiers, setTiers, tierPct, setTierPct,
    spend, setSpend, inputTok, setInputTok, outputTok, setOutputTok,
    pasteText, setPasteText, parsed, setParsed, loading,
    onApiKey, onTier, onManual, onParse, onPasteSubmit, onRemove,
  } = props;
  const pid = meta.id;
  const provTiers = TIER_ESTIMATES.filter(t => t.provider === pid);
  const p = parsed[pid];
  const hasLogo = LOGO_SUPPORTED.has(pid);
  const defaultTab = provTiers.length > 0 ? "tier" : "easy";

  return (
    <div className={`rounded-xl border p-5 ${meta.color}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {hasLogo ? (
            <ProviderLogo provider={pid as never} size={28} className="rounded-lg overflow-hidden" />
          ) : (
            <span
              className="inline-flex items-center justify-center rounded-lg bg-foreground text-background font-semibold text-xs shrink-0"
              style={{ width: 28, height: 28 }}
            >
              {meta.label[0]}
            </span>
          )}
          <h3 className="font-medium text-sm">{meta.label}</h3>
          {conn && (
            <Badge variant={conn.status === "error" ? "destructive" : "secondary"} className="text-xs">
              {conn.status === "error"
                ? <><AlertCircle className="w-3 h-3 mr-1" />Error — reconnect</>
                : <><CheckCircle2 className="w-3 h-3 mr-1" />{conn.kind}</>}
            </Badge>
          )}
        </div>
        {conn && (
          <button onClick={() => onRemove(conn.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <Tabs defaultValue={defaultTab}>
        <div className="overflow-x-auto mb-3">
          <TabsList className="bg-muted">
            {provTiers.length > 0 && <TabsTrigger value="tier" className="text-xs">Subscription</TabsTrigger>}
            <TabsTrigger value="easy" className="text-xs">Easy entry</TabsTrigger>
            <TabsTrigger value="paste" className="text-xs">Paste & parse</TabsTrigger>
            {meta.apiKeySupported && <TabsTrigger value="api_key" className="text-xs">API key</TabsTrigger>}
          </TabsList>
        </div>

        {/* ── Subscription tier tab (first because it's most set-and-forget) ── */}
        {provTiers.length > 0 && (() => {
          const selectedTier = TIER_ESTIMATES.find(t => t.id === tiers[pid]);
          const pct = tierPct[pid] ?? 100;
          const scaledIn  = selectedTier ? Math.round(selectedTier.monthlyInputTokens  * pct / 100) : 0;
          const scaledOut = selectedTier ? Math.round(selectedTier.monthlyOutputTokens * pct / 100) : 0;
          const estimate  = selectedTier ? estimateFromTokens(selectedTier.modelClass, scaledIn, scaledOut) : null;
          return (
            <TabsContent value="tier" className="space-y-3">
              <p className="text-xs text-muted-foreground">Pick your plan. We&rsquo;ll auto-add this amount every month — no need to come back.</p>

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

              <Button size="sm" className="h-8" onClick={() => onTier(pid)} disabled={loading === pid + "_tier" || !tiers[pid]}>
                {loading === pid + "_tier" ? "Saving…" : "Save plan"}
              </Button>
            </TabsContent>
          );
        })()}

        {/* ── Easy entry tab ── */}
        <TabsContent value="easy" className="space-y-3">
          <div className="rounded-lg bg-muted border border-border px-3 py-2.5 text-xs text-muted-foreground space-y-1">
            <p>{meta.usageHint}</p>
            <a
              href={meta.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              Open {meta.dashboardLabel} <ExternalLink className="w-3 h-3" />
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
          <Button size="sm" className="h-8" onClick={() => onManual(pid)} disabled={loading === pid + "_manual"}>
            {loading === pid + "_manual" ? "Saving…" : "Save usage"}
          </Button>
        </TabsContent>

        {/* ── Paste & parse tab ── */}
        <TabsContent value="paste" className="space-y-3">
          <div className="rounded-lg bg-muted border border-border px-3 py-2.5 text-xs text-muted-foreground space-y-1">
            <p>Open your usage dashboard, select all the text on the page, copy it, and paste it below. We&apos;ll extract the numbers automatically.</p>
            <a
              href={meta.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              Open {meta.dashboardLabel} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <textarea
            className="w-full rounded-lg border border-border bg-card text-xs p-3 h-28 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={`Paste anything from your ${meta.label} dashboard here — billing summary, usage breakdown, even a screenshot's copied text…`}
            value={pasteText[pid] ?? ""}
            onChange={e => {
              setPasteText(t => ({ ...t, [pid]: e.target.value }));
              setParsed(q => ({ ...q, [pid]: null }));
            }}
          />

          {!p && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => onParse(pid)}>
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
                <Button size="sm" className="h-7 text-xs" onClick={() => onPasteSubmit(pid)} disabled={loading === pid + "_paste"}>
                  {loading === pid + "_paste" ? "Saving…" : "Looks right — save it"}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setParsed(q => ({ ...q, [pid]: null }))}>
                  Try again
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── API key tab ── */}
        {meta.apiKeySupported && (
          <TabsContent value="api_key" className="space-y-2">
            <p className="text-xs text-muted-foreground">{meta.apiKeyHint}</p>
            {meta.apiKeyLink && (
              <a
                href={meta.apiKeyLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
              >
                {meta.apiKeyLink.label} <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder={`${meta.label} API key`}
                value={keys[pid] ?? ""}
                onChange={e => setKeys(k => ({ ...k, [pid]: e.target.value }))}
                className="text-sm h-8"
              />
              <Button size="sm" className="h-8 shrink-0" onClick={() => onApiKey(pid)} disabled={loading === pid + "_key"}>
                {loading === pid + "_key" ? "…" : "Connect"}
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Silence the "providerById unused" warning if we don't wind up needing it directly.
void providerById;
