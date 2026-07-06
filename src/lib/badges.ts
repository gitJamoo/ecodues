// Streaks & badges computed from committed cycle data. Pure functions — no I/O.

export interface BadgeInfo {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

/**
 * Longest run of consecutive months ending at the most recent period.
 * Periods are "YYYY-MM-01" date strings (one per committed cycle).
 */
export function computeStreak(periods: string[]): number {
  const months = [...new Set(periods.map((p) => p.slice(0, 7)))].sort();
  if (months.length === 0) return 0;
  let streak = 1;
  for (let i = months.length - 1; i > 0; i--) {
    const [y, m] = months[i].split("-").map(Number);
    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
    if (months[i - 1] === prev) streak++;
    else break;
  }
  return streak;
}

export function computeBadges(opts: {
  periods: string[];
  totalKgCo2e: number;
  anyPaid: boolean;
  multiplier: number;
}): BadgeInfo[] {
  const streak = computeStreak(opts.periods);
  return [
    {
      id: "first-offset",
      label: "First offset",
      description: "Made your first donation",
      earned: opts.anyPaid,
    },
    {
      id: "streak-3",
      label: "3-month streak",
      description: "Three consecutive months of tracked cycles",
      earned: streak >= 3,
    },
    {
      id: "streak-6",
      label: "6-month streak",
      description: "Six consecutive months of tracked cycles",
      earned: streak >= 6,
    },
    {
      id: "kg-1",
      label: "1 kg tracked",
      description: "Tracked 1 kg of CO₂e from your AI usage",
      earned: opts.totalKgCo2e >= 1,
    },
    {
      id: "kg-10",
      label: "10 kg tracked",
      description: "Tracked 10 kg of CO₂e from your AI usage",
      earned: opts.totalKgCo2e >= 10,
    },
    {
      id: "net-positive",
      label: "Net-positive",
      description: "Donated at a multiplier of 1× or more",
      earned: opts.anyPaid && opts.multiplier >= 1,
    },
  ];
}
