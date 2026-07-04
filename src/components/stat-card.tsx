"use client";

import { useState } from "react";
import { InfoIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  info?: string[];
}

export function StatCard({ label, value, sub, accent, info }: StatCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-1 mb-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {info && (
            <button
              onClick={() => setShowInfo(v => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`About ${label}`}
            >
              <InfoIcon className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className={`text-3xl font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        {info && showInfo && (
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            {info.map((line, i) => (
              <p key={i} className="text-xs text-muted-foreground">{line}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
