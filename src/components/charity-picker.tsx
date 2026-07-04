"use client";

import { ExternalLink } from "lucide-react";
import { CharityLogo } from "@/components/charity-logo";

interface Charity { id: string; name: string; description: string; category: string; url?: string }

interface CharityPickerProps {
  charities: Charity[];
  value: string | null;
  onChange: (id: string) => void;
}

export function CharityPicker({ charities, value, onChange }: CharityPickerProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {charities.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              value === c.id
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <CharityLogo name={c.name} url={c.url} size={36} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-sm font-medium leading-snug">{c.name}</p>
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">{c.category}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
              </div>
            </div>
            {c.url && (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium ml-12"
              >
                Learn more <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 text-center">
        <a
          href="https://github.com/gitJamoo/ecodues/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Missing some? Let us know!
        </a>
      </div>
    </>
  );
}
