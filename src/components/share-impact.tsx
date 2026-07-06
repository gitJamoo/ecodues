"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareImpactProps {
  periodLabel: string;
  kgCo2e: number;
  kwh: number;
  damageUsd: number;
  donationUsd: number;
  multiplier: number;
  displayName?: string | null;
}

export function ShareImpact(props: ShareImpactProps) {
  const { periodLabel, kgCo2e, kwh, damageUsd, donationUsd, multiplier, displayName } = props;

  const { relativeUrl, absoluteUrl, tweetUrl } = useMemo(() => {
    const params = new URLSearchParams({
      period: periodLabel,
      kg: kgCo2e.toFixed(3),
      kwh: kwh.toFixed(2),
      damage: damageUsd.toFixed(2),
      donated: donationUsd.toFixed(2),
      mult: multiplier.toFixed(1),
    });
    if (displayName?.trim()) params.set("name", displayName.trim());
    const relativeUrl = `/api/share-card?${params.toString()}`;
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.app";
    const absoluteUrl = `${base}${relativeUrl}`;
    const text = `My AI usage caused ${kgCo2e.toFixed(2)} kg of CO₂e (${periodLabel}) — and I'm offsetting it. Track yours at ecodues.app`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(absoluteUrl)}`;
    return { relativeUrl, absoluteUrl, tweetUrl };
  }, [periodLabel, kgCo2e, kwh, damageUsd, donationUsd, multiplier, displayName]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success("Image link copied");
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access");
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 className="w-3.5 h-3.5 mr-1.5" />
        Share your impact
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share your impact</DialogTitle>
          <DialogDescription>
            A snapshot of your AI footprint and the offset you&apos;re making — ready for X, LinkedIn, or anywhere else.
          </DialogDescription>
        </DialogHeader>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={relativeUrl}
          alt={`EcoDues impact card for ${periodLabel}`}
          className="w-full rounded-lg border border-border"
          width={1200}
          height={630}
        />

        <div className="flex flex-wrap gap-2">
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm">Post on X</Button>
          </a>
          <a href={relativeUrl} download={`ecodues-${periodLabel.replace(/\s+/g, "-").toLowerCase()}.png`}>
            <Button variant="outline" size="sm">Download image</Button>
          </a>
          <Button variant="outline" size="sm" onClick={copyLink}>Copy image link</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
