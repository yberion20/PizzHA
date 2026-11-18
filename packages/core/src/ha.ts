/**
 * Prüft, ob der Browser die eingetragene Home-Assistant-Adresse von der aktuellen Seite aus erreichen darf.
 * Gibt eine verständliche Fehlermeldung zurück oder null, wenn alles passt.
 */
export function haUrlProblem(url: string, pageProtocol: string): string | null {
  if (!url.trim()) return "Bitte zuerst die Home-Assistant-Adresse eintragen.";
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return "Die Home-Assistant-Adresse ist ungültig. Beispiel: https://meinhaus.ui.nabu.casa";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Die Home-Assistant-Adresse muss mit https:// (oder http://) beginnen.";
  }
  if (pageProtocol === "https:" && parsed.protocol === "http:") {
    return (
      "Diese Seite läuft über https, deshalb blockiert der Browser die unverschlüsselte Adresse " +
      `${parsed.origin}. Trage eine https-Adresse ein, z. B. deine Nabu-Casa-Adresse oder eine eigene Domain.`
    );
  }
  return null;
}
