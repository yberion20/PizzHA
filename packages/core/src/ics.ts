import type { Schedule } from "./schedule.js";

const icsDate = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

/** Kalenderdatei (RFC 5545) mit einem Termin und einer Erinnerung pro Schritt. */
export function scheduleToIcs(schedule: Schedule, title = "Pizzateig", alarmMinutesBefore = 0): string {
  const stamp = icsDate(new Date().toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//pizza-dough//DE", "CALSCALE:GREGORIAN"];
  schedule.steps.forEach((s, i) => {
    const next = schedule.steps[i + 1];
    const end = next && next.at > s.at ? next.at : new Date(new Date(s.at).getTime() + 15 * 60_000).toISOString();
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsDate(schedule.start)}-${s.id}@pizza-dough`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(s.at)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${esc(`🍕 ${s.title}`)}`,
      `DESCRIPTION:${esc(`${title}: ${s.description}`)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(s.title)}`,
      `TRIGGER:-PT${Math.max(0, Math.round(alarmMinutesBefore))}M`,
      "END:VALARM",
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
