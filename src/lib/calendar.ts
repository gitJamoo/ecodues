export interface ReminderOptions {
  dayOfMonth: number;   // 1–28
  hour: number;         // 0–23 (local time)
  providers: Array<{ label: string; dashboardUrl: string; usageHint: string }>;
}

function nextOccurrence(dayOfMonth: number, hour: number): Date {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hour, 0, 0);
  if (candidate <= now) candidate.setMonth(candidate.getMonth() + 1);
  return candidate;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function toIcsDate(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function buildDescription(providers: ReminderOptions["providers"]): string {
  const lines = [
    "Time to log your AI usage in EcoDues so your monthly donation is accurate.",
    "",
    "Open each dashboard, copy your usage, and paste it at:",
    "https://ecodues.org/providers",
    "",
    ...providers.flatMap(p => [
      `${p.label}`,
      `  → ${p.dashboardUrl}`,
      `  ${p.usageHint}`,
      "",
    ]),
    "Questions? Visit https://ecodues.org/methodology",
  ];
  return lines.join("\n");
}

export function buildIcs(opts: ReminderOptions): string {
  const start = nextOccurrence(opts.dayOfMonth, opts.hour);
  const end   = new Date(start.getTime() + 15 * 60 * 1000); // 15-min block
  const desc  = buildDescription(opts.providers).replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EcoDues//EN",
    "BEGIN:VEVENT",
    `SUMMARY:Log AI usage in EcoDues`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `RRULE:FREQ=MONTHLY;BYMONTHDAY=${opts.dayOfMonth}`,
    `DESCRIPTION:${desc}`,
    `URL:https://ecodues.org/providers`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildGoogleCalendarUrl(opts: ReminderOptions): string {
  const start = nextOccurrence(opts.dayOfMonth, opts.hour);
  const end   = new Date(start.getTime() + 15 * 60 * 1000);

  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Log AI usage in EcoDues",
    details: buildDescription(opts.providers),
    dates: `${fmt(start)}/${fmt(end)}`,
    recur: `RRULE:FREQ=MONTHLY;BYMONTHDAY=${opts.dayOfMonth}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(opts: ReminderOptions) {
  const content = buildIcs(opts);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "ecodues-reminder.ics";
  a.click();
  URL.revokeObjectURL(url);
}
