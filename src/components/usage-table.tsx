"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { usd, tokens } from "@/lib/format";
import { updateUsageRecord } from "@/lib/actions";
import { classifyModel } from "@/lib/emissions/models";
import { estimateFromTokens, estimateFromSpend, donationForDamage } from "@/lib/emissions/engine";

interface UsageRecord {
  id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  spend_usd: number;
  source: string;
}

function rowEmissions(u: UsageRecord) {
  const cls = classifyModel(u.model);
  const hasTokens = u.input_tokens > 0 || u.output_tokens > 0;
  return hasTokens
    ? estimateFromTokens(cls, u.input_tokens, u.output_tokens)
    : estimateFromSpend(cls, Number(u.spend_usd));
}

export function UsageTable({ usage, multiplier }: { usage: UsageRecord[]; multiplier: number }) {
  const [editing, setEditing] = useState<UsageRecord | null>(null);
  const [form, setForm] = useState({ provider: "", model: "", input_tokens: "", output_tokens: "", spend_usd: "" });
  const [saving, setSaving] = useState(false);

  function openEdit(row: UsageRecord) {
    setForm({
      provider: row.provider,
      model: row.model,
      input_tokens: String(row.input_tokens),
      output_tokens: String(row.output_tokens),
      spend_usd: String(row.spend_usd),
    });
    setEditing(row);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const result = await updateUsageRecord(editing.id, {
      provider: form.provider.trim() || undefined,
      model: form.model.trim() || undefined,
      input_tokens: Number(form.input_tokens),
      output_tokens: Number(form.output_tokens),
      spend_usd: Number(form.spend_usd),
    });
    setSaving(false);
    if (result.ok) {
      toast.success("Record updated");
      setEditing(null);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm min-w-[576px] sm:min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Provider</th>
              <th className="text-left px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Model</th>
              <th className="text-right px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Tokens in</th>
              <th className="text-right px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Tokens out</th>
              <th className="text-right px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Spend</th>
              <th className="text-right px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Est. damage</th>
              <th className="text-right px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Donation +</th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs font-medium text-muted-foreground">Source</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {usage.slice(0, 20).map((u) => {
              const est = rowEmissions(u);
              const donation = donationForDamage(est.damageUsd, multiplier);
              return (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 capitalize">{u.provider}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-muted-foreground font-mono text-xs">{u.model}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums text-muted-foreground">{tokens(u.input_tokens)}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums text-muted-foreground">{tokens(u.output_tokens)}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums">{usd(Number(u.spend_usd))}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums text-muted-foreground">{usd(est.damageUsd)}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-right tabular-nums text-primary font-medium">{usd(donation)}</td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <Badge variant="secondary" className="text-[10px]">{u.source}</Badge>
                  </td>
                  <td className="px-2 py-2.5 sm:py-3 text-right">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Edit record"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit usage record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Provider</Label>
                <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Model</Label>
                <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tokens in</Label>
                <Input type="number" min={0} value={form.input_tokens} onChange={e => setForm(f => ({ ...f, input_tokens: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Tokens out</Label>
                <Input type="number" min={0} value={form.output_tokens} onChange={e => setForm(f => ({ ...f, output_tokens: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Spend (USD)</Label>
              <Input type="number" min={0} step={0.01} value={form.spend_usd} onChange={e => setForm(f => ({ ...f, spend_usd: e.target.value }))} />
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
