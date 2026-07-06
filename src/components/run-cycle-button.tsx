"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runCycleNow } from "@/lib/actions";
import { toast } from "sonner";
import { usd } from "@/lib/format";
import { RefreshCw } from "lucide-react";

export function RunCycleButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    setLoading(true);
    const result = await runCycleNow();
    setLoading(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    if (result.ok) {
      toast.success(
        (result.donationUsd ?? 0) > 0
          ? `Synced — ${usd(result.donationUsd ?? 0)} accrued for this month so far`
          : "Synced — no usage found this month yet",
      );
      router.refresh();
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRun} disabled={loading}>
      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Syncing…" : "Sync now"}
    </Button>
  );
}
