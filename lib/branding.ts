// ============================================================
//  LOGOI LIGE I TIMOVA
// ============================================================
//  1) Ubaci sliku u public/logos/ (logo lige) ili public/logos/teams/ (timovi).
//     Preporuka: PNG sa providnom pozadinom ili SVG, kvadratni ili blizu kvadratnog.
//  2) Upiši putanju ispod (putanja počinje sa /, bez reči "public").
//  3) Push na git -> Vercel sam napravi novi deploy.
//
//  Tim bez upisanog loga i dalje prikazuje generisani monogram.
//  Ime tima mora biti ISTO kao u tabeli (npr. 'Better Collective').
// ============================================================

// Logo lige (zamenjuje ikonicu lopte u zaglavlju i podnožju). null = stara ikonica.
export const leagueLogo: string | null = '/logos/liga.png';

export const teamLogos: Record<string, string> = {
  SkySoft: '/logos/teams/skysoft.png',
  'Better Collective': '/logos/teams/better-collective.png',
  Boopro: '/logos/teams/boopro.png',
  Fazi: '/logos/teams/fazi.png',
  HTEC: '/logos/teams/htec.png',
  Ascalab: '/logos/teams/ascalab.png',
  Code: '/logos/teams/code.png',
  Diligent: '/logos/teams/diligent.png',
  'OIP Insurtech': '/logos/teams/oip-insurtech.png',
  Dualsoft: '/logos/teams/dualsoft.png',
  DMV: '/logos/teams/dmv.png',
  Logik: '/logos/teams/logik.png',
};

// ============================================================
//  VELIKE SLIKE NA POČETNOJ STRANI (smenjuju se same)
// ============================================================
//  1) Ubaci slike u public/hero/ (preporuka: JPG, širine oko 1600-2000 px,
//     do ~400 KB po slici da se sajt brzo učitava).
//  2) Upiši putanje u listu ispod, redom kojim treba da se smenjuju.
//  3) Sa jednom slikom nema smenjivanja.
// ============================================================
export const heroImages: string[] = [
  '/hero/1.jpg',
  '/hero/2.jpg',
  '/hero/3.jpg',
];

// Na koliko milisekundi se slika menja (5000 = 5 sekundi).
export const heroIntervalMs = 5000;

// ============================================================
//  LINK DO GLAVNOG SAJTA (gornja traka, pored "League workbook")
// ============================================================
//  Stavi null ako ne želiš da se prikazuje.
export const mainSiteUrl: string | null = 'https://itliganis.rs';
