/** Deutsche Zahl mit fester Anzahl Nachkommastellen. */
export const fmtNumber = (v: number, digits = 1) =>
  v.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtGrams = (v: number, digits = 1) => `${fmtNumber(v, digits)} g`;

export const fmtDateTime = (iso: string, timeZone?: string) =>
  new Date(iso).toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });

/** Wert für <input type="datetime-local"> in lokaler Zeit. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDuration(ms: number): string {
  const neg = ms < 0;
  let m = Math.round(Math.abs(ms) / 60_000);
  const d = Math.floor(m / 1440);
  m -= d * 1440;
  const h = Math.floor(m / 60);
  m -= h * 60;
  const parts = [d ? `${d} T` : "", h ? `${h} h` : "", `${m} min`].filter(Boolean);
  return (neg ? "vor " : "") + parts.join(" ");
}
