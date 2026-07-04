"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveSettings } from "@/lib/actions";
import { toast } from "sonner";
import { Info } from "lucide-react";

export function CardFormStub({ onDone }: { onDone?: () => void }) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  async function handleSave() {
    const digits = number.replace(/\s/g, "");
    if (digits.length < 16) { toast.error("Enter a 16-digit card number"); return; }
    setLoading(true);
    await saveSettings({ cardLast4: digits.slice(-4) });
    setLoading(false);
    toast.success("Card saved (last 4 only — no real data stored)");
    onDone?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Proof of concept — only the last 4 digits are stored. No real charges. Production uses Every.org for payment processing.</span>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Card number</Label>
        <Input
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={number}
          onChange={e => setNumber(formatCard(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Expiry</Label>
          <Input inputMode="numeric" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">CVC</Label>
          <Input inputMode="numeric" placeholder="123" maxLength={4} value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} />
        </div>
      </div>
      <Button className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? "Saving…" : "Save card"}
      </Button>
    </div>
  );
}
