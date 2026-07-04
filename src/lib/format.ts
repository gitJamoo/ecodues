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
