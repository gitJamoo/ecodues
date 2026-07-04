export const usd = (n: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: Math.max(digits, 4),
  }).format(n);

export const co2 = (kg: number) =>
  (kg < 1 ? `${(kg * 1000).toFixed(0)} g` : `${kg.toFixed(2)} kg`) + " CO₂e";

export const energy = (kwh: number) =>
  kwh < 1 ? `${(kwh * 1000).toFixed(0)} Wh` : `${kwh.toFixed(2)} kWh`;

export const water = (l: number) => `${l.toFixed(1)} L`;

export const monthLabel = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long", year: "numeric", timeZone: "UTC",
  });

export const tokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000    ? `${(n / 1000).toFixed(0)}k`
  : `${n}`;

// avg US car = 404 g CO₂/mile; avg tree absorbs 21.77 kg CO₂/year
export function co2Equivalents(kg: number): string[] {
  const miles = kg * (1000 / 404);
  const treeDays = kg * (365 / 21.77);
  const milesStr = miles < 0.1 ? `${(miles * 5280).toFixed(0)} ft` : `${miles.toFixed(2)} mi`;
  const daysStr  = treeDays < 1 ? "<1 day" : `${treeDays.toFixed(0)} day${treeDays >= 2 ? "s" : ""}`;
  return [
    `≈ ${milesStr} driven in an average car`,
    `≈ 1 tree absorbing CO₂ for ${daysStr}`,
  ];
}

// phone charge ≈ 12 Wh; laptop ≈ 45 W avg
export function kwhEquivalents(kwh: number): string[] {
  const charges = kwh * (1000 / 12);
  const laptopHrs = kwh * (1000 / 45);
  return [
    `≈ ${charges < 1 ? "<1" : charges.toFixed(0)} smartphone charge${charges >= 2 ? "s" : ""}`,
    `≈ ${laptopHrs.toFixed(1)} hrs of laptop use`,
  ];
}
