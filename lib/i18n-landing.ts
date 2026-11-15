import type { Lang } from "./i18n.ts";

// Landing page (/) strings. Shared labels (language, theme, start, checking,
// booth code) come from lib/i18n.ts.

const en = {
  tagline: "Skills over CVs at job fairs",
  candidateTitle: "I'm a candidate",
  candidateLine: "Type the code from your booth card. No name or CV needed.",
  recruiterTitle: "I'm a recruiter",
  recruiterLine: "Use the PIN from the fair organiser.",
  pinLabel: "Company PIN",
  openBooth: "Open my booth",
  wrongPin: "Wrong PIN.",
  footer: "Concept for Junction 2026, Rethinking Recruitment, City of Espoo challenge",
};

export type LandingKey = keyof typeof en;

const fi: Record<LandingKey, string> = {
  tagline: "Taidot CV:n sijaan työmessuilla",
  candidateTitle: "Olen työnhakija",
  candidateLine: "Kirjoita osastokortin koodi. Nimeä tai CV:tä ei tarvita.",
  recruiterTitle: "Olen rekrytoija",
  recruiterLine: "Käytä messujen järjestäjältä saamaasi PIN-koodia.",
  pinLabel: "Yrityksen PIN-koodi",
  openBooth: "Avaa osastoni",
  wrongPin: "Väärä PIN-koodi.",
  footer: "Konsepti: Junction 2026, Rethinking Recruitment, Espoon kaupungin haaste",
};

const sv: Record<LandingKey, string> = {
  tagline: "Färdigheter före CV på jobbmässor",
  candidateTitle: "Jag är kandidat",
  candidateLine: "Skriv koden från monterkortet. Inget namn eller CV behövs.",
  recruiterTitle: "Jag är rekryterare",
  recruiterLine: "Använd PIN-koden från mässarrangören.",
  pinLabel: "Företagets PIN-kod",
  openBooth: "Öppna min monter",
  wrongPin: "Fel PIN-kod.",
  footer: "Koncept för Junction 2026, Rethinking Recruitment, Esbo stads utmaning",
};

const MESSAGES: Record<Lang, Record<LandingKey, string>> = { en, fi, sv };

export function lt(lang: Lang, key: LandingKey) {
  return MESSAGES[lang][key];
}
