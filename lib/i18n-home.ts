// Landing page strings (EN / FI / SV). Kept apart from the candidate strings
// in i18n.ts; same languages, same cookie. "­" is a soft hyphen so long
// Finnish and Swedish words in the big headline can wrap on a phone.

import type { Lang } from "./i18n.ts";

const en = {
  metaTitle: "SkillScan - skills over CVs at Espoo recruitment events",
  metaDescription:
    "Candidates show what they can do in quick tasks. Recruiters talk to the right people, and a human decides every step. No CV needed.",
  eyebrow: "Espoo recruitment events",
  heroTitle: "More signal, less noise at recruitment events.",
  heroSub:
    "Candidates show what they can do in quick tasks. Recruiters talk to the right people, and a human decides every step. No CV needed.",
  ctaCandidate: "I'm a candidate",
  ctaRecruiter: "I'm a recruiter",
  whyLabel: "Why",
  whyProblem: "CVs and applications are increasingly written by AI and read by AI.",
  whyAnswer: "SkillScan puts a short task round and a live conversation about the answers in between.",
  flowLabel: "Before, during, after",
  before: "Before",
  beforeBody: "The company sets up its booth.",
  during: "During",
  duringCode: "Get a booth code",
  duringTasks: "Solve 10–15 quick visual tasks on your phone",
  duringTalk: "Talk with the recruiter about your answers",
  after: "After",
  afterBody: "Contact details are shared only if both sides want to continue, and only with the candidate's consent.",
  whoLabel: "Who it helps",
  seekersTitle: "Jobseekers",
  seekersBody:
    "Tasks are visual: pictures, ordering, logic. The interface is in English, Finnish and Swedish. We do not ask for a CV, nationality or education.",
  companiesTitle: "Companies",
  companiesBody: "A short list of anonymous candidates with facts, not a flood of approaches. You decide who to invite.",
  organisersTitle: "Event organisers",
  organisersBody: "Made for in-person events. Minimal data, deleted with the event.",
  responsibleLabel: "Responsible by design",
  noRanking: "No automated ranking, profiling or rejection.",
  noTracking: "No tab, location or screen tracking. Flags are informational only.",
  consent: "Contact data only with explicit consent, deleted after the event.",
  synthetic: "Synthetic data in this demo.",
  aiAct: "Designed with the EU AI Act in mind.",
  footConcept: "Concept for Junction 2026",
  footChallenge: "Rethinking Recruitment",
  footEspoo: "City of Espoo challenge",
  footDemo: "Demo with synthetic data only",
};
export type HomeKey = keyof typeof en;

const fi: Record<HomeKey, string> = {
  metaTitle: "SkillScan - osaaminen ennen CV:tä Espoon rekrytointitapahtumissa",
  metaDescription:
    "Hakijat näyttävät lyhyissä tehtävissä, mitä osaavat. Rekrytoijat juttelevat oikeiden ihmisten kanssa, ja ihminen päättää joka vaiheessa. CV:tä ei tarvita.",
  eyebrow: "Espoon rekrytointitapahtumat",
  heroTitle: "Enemmän signaalia, vähemmän kohinaa rekrytointi­tapahtumissa.",
  heroSub:
    "Hakijat näyttävät lyhyissä tehtävissä, mitä osaavat. Rekrytoijat juttelevat oikeiden ihmisten kanssa, ja ihminen päättää joka vaiheessa. CV:tä ei tarvita.",
  ctaCandidate: "Olen hakija",
  ctaRecruiter: "Olen rekrytoija",
  whyLabel: "Miksi",
  whyProblem: "Yhä useampi CV ja hakemus on tekoälyn kirjoittama ja tekoälyn lukema.",
  whyAnswer: "SkillScan tuo väliin lyhyen tehtäväkierroksen ja keskustelun vastauksista paikan päällä.",
  flowLabel: "Ennen, aikana, jälkeen",
  before: "Ennen",
  beforeBody: "Yritys valmistelee osastonsa.",
  during: "Aikana",
  duringCode: "Saat osastokoodin",
  duringTasks: "Ratkaiset puhelimellasi 10–15 nopeaa kuvallista tehtävää",
  duringTalk: "Keskustelet rekrytoijan kanssa vastauksistasi",
  after: "Jälkeen",
  afterBody: "Yhteystiedot jaetaan vain, jos molemmat osapuolet haluavat jatkaa, ja vain hakijan suostumuksella.",
  whoLabel: "Keitä se auttaa",
  seekersTitle: "Työnhakijat",
  seekersBody:
    "Tehtävät ovat kuvallisia: kuvia, järjestyksiä, logiikkaa. Käyttöliittymä on englanniksi, suomeksi ja ruotsiksi. Emme kysy CV:tä, kansalaisuutta tai koulutusta.",
  companiesTitle: "Yritykset",
  companiesBody: "Lyhyt lista nimettömiä hakijoita ja faktoja, ei yhteydenottojen tulvaa. Sinä päätät, kenet kutsut.",
  organisersTitle: "Tapahtumajärjestäjät",
  organisersBody: "Tehty kasvokkain järjestettäviin tapahtumiin. Mahdollisimman vähän tietoa, ja se poistetaan tapahtuman jälkeen.",
  responsibleLabel: "Vastuullisesti suunniteltu",
  noRanking: "Ei automaattista paremmuusjärjestystä, profilointia tai hylkäämistä.",
  noTracking: "Ei välilehtien, sijainnin tai näytön seurantaa. Merkinnät ovat vain tiedoksi.",
  consent: "Yhteystiedot vain nimenomaisella suostumuksella, ja ne poistetaan tapahtuman jälkeen.",
  synthetic: "Tämä demo käyttää synteettistä dataa.",
  aiAct: "Suunniteltu EU:n tekoälysäädös huomioiden.",
  footConcept: "Konsepti Junction 2026 -tapahtumaan",
  footChallenge: "Rethinking Recruitment",
  footEspoo: "Espoon kaupungin haaste",
  footDemo: "Demo käyttää vain synteettistä dataa",
};

const sv: Record<HomeKey, string> = {
  metaTitle: "SkillScan - kompetens före CV på rekryteringsevenemang i Esbo",
  metaDescription:
    "Kandidater visar vad de kan i snabba uppgifter. Rekryterare pratar med rätt personer, och en människa beslutar i varje steg. Inget CV behövs.",
  eyebrow: "Rekryteringsevenemang i Esbo",
  heroTitle: "Mer signal, mindre brus på rekryterings­evenemang.",
  heroSub:
    "Kandidater visar vad de kan i snabba uppgifter. Rekryterare pratar med rätt personer, och en människa beslutar i varje steg. Inget CV behövs.",
  ctaCandidate: "Jag är kandidat",
  ctaRecruiter: "Jag är rekryterare",
  whyLabel: "Varför",
  whyProblem: "Allt fler CV:n och ansökningar skrivs av AI och läses av AI.",
  whyAnswer: "SkillScan lägger en kort uppgiftsrunda och ett samtal på plats om svaren däremellan.",
  flowLabel: "Före, under, efter",
  before: "Före",
  beforeBody: "Företaget förbereder sin monter.",
  during: "Under",
  duringCode: "Du får en monterkod",
  duringTasks: "Du löser 10–15 snabba bilduppgifter i mobilen",
  duringTalk: "Du pratar med rekryteraren om dina svar",
  after: "Efter",
  afterBody: "Kontaktuppgifter delas bara om båda parter vill gå vidare, och bara med kandidatens samtycke.",
  whoLabel: "Vem det hjälper",
  seekersTitle: "Arbetssökande",
  seekersBody:
    "Uppgifterna är visuella: bilder, ordningsföljd, logik. Gränssnittet finns på engelska, finska och svenska. Vi frågar inte efter CV, nationalitet eller utbildning.",
  companiesTitle: "Företag",
  companiesBody: "En kort lista med anonyma kandidater och fakta, inte en flod av kontakter. Du bestämmer vem du bjuder in.",
  organisersTitle: "Evenemangsarrangörer",
  organisersBody: "Gjort för evenemang på plats. Minimalt med data, som raderas med evenemanget.",
  responsibleLabel: "Ansvarsfull design",
  noRanking: "Ingen automatisk rangordning, profilering eller avvisning.",
  noTracking: "Ingen spårning av flikar, plats eller skärm. Flaggor är endast information.",
  consent: "Kontaktuppgifter bara med uttryckligt samtycke, raderas efter evenemanget.",
  synthetic: "Syntetiska data i den här demon.",
  aiAct: "Utformat med EU:s AI-förordning i åtanke.",
  footConcept: "Koncept för Junction 2026",
  footChallenge: "Rethinking Recruitment",
  footEspoo: "Esbo stads utmaning",
  footDemo: "Demo med endast syntetiska data",
};

export const HOME: Record<Lang, Record<HomeKey, string>> = { en, fi, sv };
