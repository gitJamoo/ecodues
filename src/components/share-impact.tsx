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
  avatarUrl?: string | null;
}

export function ShareImpact(props: ShareImpactProps) {
  const { periodLabel, kgCo2e, kwh, damageUsd, donationUsd, multiplier, displayName, avatarUrl } = props;

  const { relativeUrl, shareUrl, tweetUrl } = useMemo(() => {
    const params = new URLSearchParams({
      period: periodLabel,
      kg: kgCo2e.toFixed(3),
      kwh: kwh.toFixed(2),
      damage: damageUsd.toFixed(2),
      donated: donationUsd.toFixed(2),
      mult: multiplier.toFixed(1),
    });
    if (displayName?.trim()) params.set("name", displayName.trim());
    if (avatarUrl) params.set("avatar", avatarUrl);
    const relativeUrl = `/api/share-card?${params.toString()}`;
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.org";
    // Social platforms can't attach a raw image URL — they render the card
    // from the og/twitter metadata of an HTML page, so share /share.
    const shareUrl = `${base}/share?${params.toString()}`;
    const text = `My AI usage caused ${kgCo2e.toFixed(2)} kg of CO₂e (${periodLabel}) — and I'm offsetting it. Track yours at ecodues.org`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    return { relativeUrl, shareUrl, tweetUrl };
  }, [periodLabel, kgCo2e, kwh, damageUsd, donationUsd, multiplier, displayName, avatarUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied");
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
            A snapshot of your AI footprint and the offset you&apos;re making. Copy the link to share it anywhere, or download the image.
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

        {/* Mobile: stacked full-width; sm+: inline row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto">Post on X</Button>
          </a>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={copyLink}>Copy share link</Button>
          <a href={relativeUrl} download={`ecodues-${periodLabel.replace(/\s+/g, "-").toLowerCase()}.png`} className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">Download image</Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
