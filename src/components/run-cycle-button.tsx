"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runCycleNow } from "@/lib/actions";
import { toast } from "sonner";
import { usd } from "@/lib/format";
import { RefreshCw } from "lucide-react";

export function RunCycleButton() {
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    setLoading(true);
    const result = await runCycleNow();
    setLoading(false);
    if (result.ok) {
      toast.success(
        result.donationUsd > 0
          ? `Cycle complete — would donate ${usd(result.donationUsd)} this month`
          : "Cycle complete — no usage found yet",
      );
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRun} disabled={loading}>
      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Running…" : "Run cycle now"}
    </Button>
  );
}
