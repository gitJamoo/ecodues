"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { downloadIcs, buildGoogleCalendarUrl, type ReminderOptions } from "@/lib/calendar";
import { CalendarDays, Download, ExternalLink } from "lucide-react";

const DAY_OPTIONS = [1, 5, 10, 15, 20, 25, 28];
const HOUR_OPTIONS = [
  { value: 8,  label: "8:00 AM" },
  { value: 9,  label: "9:00 AM" },
  { value: 10, label: "10:00 AM" },
  { value: 11, label: "11:00 AM" },
  { value: 12, label: "12:00 PM" },
  { value: 13, label: "1:00 PM" },
  { value: 14, label: "2:00 PM" },
  { value: 15, label: "3:00 PM" },
  { value: 17, label: "5:00 PM" },
  { value: 18, label: "6:00 PM" },
];

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

interface Provider { label: string; dashboardUrl: string; usageHint: string }

interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  providers: Provider[];
}

export function ReminderModal({ open, onClose, providers }: ReminderModalProps) {
  const [dayOfMonth, setDayOfMonth] = useState(25);
  const [hour, setHour] = useState(9);

  const opts: ReminderOptions = { dayOfMonth, hour, providers };

  function handleDownload() {
    downloadIcs(opts);
    onClose();
  }

  function handleGoogle() {
    window.open(buildGoogleCalendarUrl(opts), "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Set a monthly reminder
          </DialogTitle>
          <DialogDescription>
            Get a recurring calendar reminder to log your usage before the 1st-of-month donation cycle runs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Timing pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Day of month</Label>
              <Select
                value={String(dayOfMonth)}
                onValueChange={(v: string | null) => { if (v) setDayOfMonth(Number(v)); }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map(d => (
                    <SelectItem key={d} value={String(d)} className="text-sm">
                      {ordinal(d)} of the month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Select
                value={String(hour)}
                onValueChange={(v: string | null) => { if (v) setHour(Number(v)); }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map(h => (
                    <SelectItem key={h.value} value={String(h.value)} className="text-sm">
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2">
            <p className="text-xs font-medium">What the invite includes</p>
            <p className="text-xs text-muted-foreground">
              Repeats every month on the <span className="font-medium text-foreground">{ordinal(dayOfMonth)}</span> at <span className="font-medium text-foreground">{HOUR_OPTIONS.find(h => h.value === hour)?.label ?? `${hour}:00`}</span> · 15 min block
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pt-1">
              {providers.map(p => (
                <li key={p.label} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">·</span>
                  <span>
                    <span className="font-medium text-foreground">{p.label}</span>
                    {" — "}
                    <span className="font-mono text-[10px]">{p.dashboardUrl}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-start gap-1.5">
                <span className="text-primary mt-0.5">·</span>
                <span>Link back to your EcoDues providers page</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full gap-2" onClick={handleGoogle}>
              <ExternalLink className="w-4 h-4" />
              Add to Google Calendar
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              Download .ics (Apple / Outlook / any app)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
