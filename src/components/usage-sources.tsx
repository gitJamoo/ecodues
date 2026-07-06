import { Badge } from "@/components/ui/badge";
import { ProviderLogo } from "@/components/provider-logo";
import { NextSyncCountdown } from "@/components/next-sync-countdown";
import { co2, usd } from "@/lib/format";
import Link from "next/link";

const LOGO_SUPPORTED = new Set(["openai", "anthropic", "openrouter", "gemini"]);

export interface UsageSourceEntry {
  id: string;
  provider: string;
  providerLabel: string;
  name: string;
  kind: "api_key" | "tier" | "manual";
  status: "active" | "error";
  kgCo2e: number;
  damageUsd: number;
  spendUsd: number;
  isEstimate: boolean;
  note: string;
}

const KIND_LABEL: Record<UsageSourceEntry["kind"], string> = {
  api_key: "API key",
  tier: "Plan",
  manual: "Manual",
};

export function UsageSources({ entries }: { entries: UsageSourceEntry[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-medium">Usage by source</h2>
        <NextSyncCountdown />
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No usage sources yet —{" "}
            <Link href="/providers" className="underline underline-offset-2 hover:text-foreground">
              connect a provider
            </Link>{" "}
            to start tracking.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {entries.map((e) => (
            <div key={e.id} className="px-4 py-3 border-b border-border last:border-0">
              {/* Row 1 on mobile (shared): logo + name + badges; desktop also shows stats inline */}
              <div className="flex items-center gap-3">
                {LOGO_SUPPORTED.has(e.provider) ? (
                  <ProviderLogo provider={e.provider as never} size={18} />
                ) : (
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded bg-foreground text-background font-semibold text-[9px] shrink-0">
                    {e.providerLabel[0]}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {e.providerLabel}
                    <span className="text-muted-foreground font-normal"> · {e.name}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{e.note}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{KIND_LABEL[e.kind]}</Badge>
                  {e.status === "error" && (
                    <Badge variant="destructive" className="text-[10px]">Sync error</Badge>
                  )}
                  {e.isEstimate && e.status !== "error" && (
                    <Badge variant="secondary" className="text-[10px]">Estimate</Badge>
                  )}
                </div>
                {/* Stats: desktop only — right-aligned fixed columns */}
                <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs tabular-nums">
                  <span className="text-muted-foreground w-20 text-right">{co2(e.kgCo2e)}</span>
                  <span className="w-16 text-right font-medium">{usd(e.damageUsd)}</span>
                  <span className="text-muted-foreground w-16 text-right">
                    {e.spendUsd > 0 ? `${usd(e.spendUsd)} spent` : "—"}
                  </span>
                </div>
              </div>
              {/* Row 2: stats on mobile only — spread across full width */}
              <div className="flex items-center justify-between mt-2 sm:hidden text-xs tabular-nums">
                <span className="text-muted-foreground">{co2(e.kgCo2e)}</span>
                <span className="font-medium">{usd(e.damageUsd)}</span>
                <span className="text-muted-foreground">
                  {e.spendUsd > 0 ? `${usd(e.spendUsd)} spent` : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Month-to-date impact per source. API keys re-sync automatically every day; plan estimates accrue
        gradually through the month.
      </p>
    </div>
  );
}
