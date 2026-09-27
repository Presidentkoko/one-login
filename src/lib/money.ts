export type Entry = {
  id: string;
  kind: "in" | "out";
  customer: string | null;
  description: string;
  amount_cents: number;
  created_at: string;
};

// The business runs on Australian time, so "this month" does too — on the
// server and the phone alike, which also keeps SSR and hydration in agreement.
export const TZ = "Australia/Sydney";

const monthKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
});
const monthNameFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, month: "long" });
const dayFmt = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, day: "numeric", month: "short" });

const dayOfMonthFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, day: "numeric" });

function yearMonth(d: Date | string) {
  const parts = monthKeyFmt.formatToParts(new Date(d));
  const get = (type: "year" | "month") => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month") };
}

/** "2026-9" — built from parts so every browser agrees on the format. */
export const monthKey = (d: Date | string) => {
  const { year, month } = yearMonth(d);
  return `${year}-${month}`;
};

/** Days left in the month, counting today. */
export function daysLeft(now: Date | string) {
  const { year, month } = yearMonth(now);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return daysInMonth - Number(dayOfMonthFmt.format(new Date(now))) + 1;
}
export const monthName = (d: Date | string) => monthNameFmt.format(new Date(d));
export const shortDay = (d: Date | string) => dayFmt.format(new Date(d));

const whole = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});
const exact = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
});

/** $1,240 — or $1,240.50 when there are cents worth showing. */
export function formatMoney(cents: number, { forceWhole = false } = {}) {
  const abs = Math.abs(cents);
  const text = forceWhole || abs % 100 === 0 ? whole.format(Math.round(abs / 100)) : exact.format(abs / 100);
  return cents < 0 ? `−${text}` : text;
}

/** "1,250.5" / "$1250" -> 125050. Returns 0 for anything unusable. */
export function parseMoney(input: string) {
  const n = Number.parseFloat(input.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

export function totals(entries: Entry[]) {
  let moneyIn = 0;
  let moneyOut = 0;
  for (const e of entries) {
    if (e.kind === "in") moneyIn += e.amount_cents;
    else moneyOut += e.amount_cents;
  }
  return { moneyIn, moneyOut, profit: moneyIn - moneyOut };
}
