/**
 * Dávkování podle příbalových informací z databáze léků SÚKL
 * (https://prehledy.sukl.cz), staženo 13. 10. 2026. U každého přípravku je
 * kód SÚKL a označení dokumentu, ze kterého tabulka pochází. Při aktualizaci
 * letáku je potřeba tabulku zkontrolovat znovu.
 */

export type LeafletBand = {
  /** Hmotnostní pásmo tak, jak ho uvádí leták (včetně obou krajních hodnot). */
  fromKg: number;
  toKg: number;
  /** Jednotlivá dávka v ml nebo v kusech; `amountMax` je horní mez rozmezí. */
  amount: number;
  amountMax?: number;
  maxPerDay: number;
  /** Věk, který leták k pásmu uvádí. */
  age?: string;
};

export type Leaflet = {
  suklCode: string;
  document: string;
  /** Nejkratší odstup mezi dávkami v hodinách, se kterým počítá deníček. */
  hours: number;
  /** Co leták říká o odstupu mezi dávkami. */
  intervalNote: string;
  belowNote: string;
  aboveNote: string;
  /** Upozornění k podání, které leták výslovně uvádí. */
  note?: string;
} & (
  | { kind: 'bands'; bands: LeafletBand[] }
  | {
      /** Leták udává jen denní dávku na kilogram, kterou je třeba rozdělit. */
      kind: 'daily';
      fromKg: number;
      toKg: number;
      dailyMgPerKgMin: number;
      dailyMgPerKgMax: number;
      maxDailyMg: number;
      dosesPerDay: number;
    }
);

const IBUPROFEN_INTERVAL = 'Leták uvádí odstup mezi dávkami 6–8 hodin.';
const PANADOL_INTERVAL = 'Leták doporučuje odstup 6 hodin, nejméně musí být 4 hodiny.';

/** Klíčem je `id` přípravku z `medicines.ts`. */
export const leaflets: Record<number, Leaflet> = {
  // Nurofen pro děti Jahoda 20 mg/ml perorální suspenze
  1: {
    suklCode: '0237376',
    document: 'PI215155',
    kind: 'daily',
    fromKg: 5,
    toKg: 30,
    dailyMgPerKgMin: 20,
    dailyMgPerKgMax: 30,
    maxDailyMg: 500,
    dosesPerDay: 3,
    hours: 6,
    intervalNote:
      'Leták udává denní dávku 20–30 mg/kg rozdělenou do 3–4 dávek s odstupem 6–8 hodin. Tady je rozdělená do 3 dávek.',
    belowNote: 'Podle letáku není určen pro děti mladší 3 měsíců ani lehčí než 5 kg.',
    aboveNote:
      'Leták uvádí dávku podle hmotnosti jen do 30 kg. Pro děti 8–12 let udává 5–10 ml 3–4× denně.',
  },
  // Nurofen pro děti jahoda 40 mg/ml perorální suspenze
  2: {
    suklCode: '0238187',
    document: 'PI236538',
    kind: 'bands',
    bands: [
      { fromKg: 20, toKg: 29, amount: 5, maxPerDay: 3, age: '6–9 let' },
      { fromKg: 30, toKg: 40, amount: 7.5, maxPerDay: 3, age: '10–12 let' },
    ],
    hours: 6,
    intervalNote: IBUPROFEN_INTERVAL,
    belowNote: 'Podle letáku není určen pro děti mladší 6 let ani lehčí než 20 kg.',
    aboveNote: 'Leták uvádí dávky jen do 40 kg.',
  },
  // Nurofen pro děti 60 mg čípky
  3: {
    suklCode: '0241120',
    document: 'PI236535',
    kind: 'bands',
    bands: [
      { fromKg: 6, toKg: 8, amount: 1, maxPerDay: 3, age: '3–9 měsíců' },
      { fromKg: 8, toKg: 12.5, amount: 1, maxPerDay: 4, age: '9 měsíců až 2 roky' },
    ],
    hours: 6,
    intervalNote: 'Další čípek podle letáku nejdříve po 6 hodinách.',
    belowNote: 'Podle letáku jen pro děti starší 3 měsíců s hmotností nejméně 6 kg.',
    aboveNote: 'Leták uvádí dávky jen do 12,5 kg. Pro těžší děti jsou určené čípky 125 mg.',
  },
  // Nurofen pro děti 125 mg čípky
  4: {
    suklCode: '0238177',
    document: 'PI236544',
    kind: 'bands',
    bands: [
      { fromKg: 12.5, toKg: 17, amount: 1, maxPerDay: 3, age: '2–4 roky' },
      { fromKg: 17, toKg: 20.5, amount: 1, maxPerDay: 4, age: '4–6 let' },
    ],
    hours: 6,
    intervalNote: 'Další čípek podle letáku nejdříve po 6 hodinách.',
    belowNote: 'Podle letáku jen pro děti starší 2 let s hmotností nejméně 12,5 kg.',
    aboveNote: 'Leták uvádí dávky jen do 20,5 kg.',
  },
  // Panadol pro děti jahoda 24 mg/ml perorální suspenze
  5: {
    suklCode: '0267048',
    document: 'PI230308',
    kind: 'bands',
    bands: [
      { fromKg: 5, toKg: 6, amount: 3, maxPerDay: 4, age: '3–6 měsíců' },
      { fromKg: 7, toKg: 8, amount: 4, maxPerDay: 4, age: '3–6 měsíců' },
      { fromKg: 9, toKg: 10, amount: 5, maxPerDay: 4, age: '6–12 měsíců' },
      { fromKg: 11, toKg: 13, amount: 6, maxPerDay: 4, age: '1–2 roky' },
      { fromKg: 14, toKg: 16, amount: 8, maxPerDay: 4, age: '2–3 roky' },
      { fromKg: 17, toKg: 20, amount: 10, maxPerDay: 4, age: '3–6 let' },
      { fromKg: 21, toKg: 25, amount: 13, maxPerDay: 4, age: '6–12 let' },
      { fromKg: 26, toKg: 33, amount: 16, maxPerDay: 4, age: '6–12 let' },
      { fromKg: 34, toKg: 40, amount: 20, maxPerDay: 4, age: '6–12 let' },
    ],
    hours: 6,
    intervalNote: PANADOL_INTERVAL,
    belowNote:
      'Tabulka v letáku začíná na 5 kg (od 3 měsíců). Mladším dětem jen po poradě s lékařem.',
    aboveNote: 'Leták uvádí dávky jen do 40 kg.',
  },
  // Panadol Baby 125 mg čípky
  6: {
    suklCode: '0208840',
    document: 'PI219392',
    kind: 'bands',
    bands: [
      { fromKg: 9, toKg: 14, amount: 1, maxPerDay: 4 },
      { fromKg: 15, toKg: 20, amount: 2, maxPerDay: 4 },
    ],
    hours: 6,
    intervalNote: PANADOL_INTERVAL,
    belowNote: 'Podle letáku se nemá podávat dětem lehčím než 9 kg.',
    aboveNote: 'Leták uvádí dávky jen do 20 kg. Pro těžší děti jsou určené čípky 250 mg.',
  },
  // Panadol Junior 250 mg čípky
  7: {
    suklCode: '0208841',
    document: 'PI219386',
    kind: 'bands',
    bands: [
      { fromKg: 15, toKg: 30, amount: 1, maxPerDay: 4 },
      { fromKg: 30, toKg: 999, amount: 1, amountMax: 2, maxPerDay: 4 },
    ],
    hours: 6,
    intervalNote: PANADOL_INTERVAL,
    belowNote: 'Podle letáku se nemá podávat dětem lehčím než 15 kg.',
    aboveNote: '',
  },
  // Ibalgin Baby 20 mg/ml perorální suspenze
  8: {
    suklCode: '0254306',
    document: 'PI226791',
    kind: 'bands',
    bands: [
      { fromKg: 6, toKg: 8, amount: 2.5, maxPerDay: 4, age: '3–6 měsíců' },
      { fromKg: 9, toKg: 10, amount: 3, maxPerDay: 4, age: '6–12 měsíců' },
      { fromKg: 11, toKg: 13, amount: 4, maxPerDay: 4, age: '1–2 roky' },
      { fromKg: 14, toKg: 16, amount: 5, maxPerDay: 4, age: '2–3 roky' },
      { fromKg: 17, toKg: 20, amount: 7, maxPerDay: 3, age: '3–6 let' },
      { fromKg: 20, toKg: 30, amount: 8, maxPerDay: 3, age: '6–12 let' },
      { fromKg: 30, toKg: 40, amount: 10, amountMax: 15, maxPerDay: 3, age: '6–12 let' },
    ],
    hours: 6,
    intervalNote: IBUPROFEN_INTERVAL,
    belowNote: 'Podle letáku se nepodává dětem do 3 měsíců ani lehčím než 6 kg.',
    aboveNote: 'Leták uvádí dávky jen do 40 kg.',
    note: 'U dětí do 30 kg leták nedoporučuje překročit 25 ml suspenze denně.',
  },
  // Ibalgin 200 mg potahované tablety. Leták dávkuje děti jen podle věku
  // (6–12 let); hmotnost 20–40 kg pro tento věk je převzatá z tabulky
  // v letáku Ibalgin Baby téhož výrobce.
  9: {
    suklCode: '0254291',
    document: 'PI226793',
    kind: 'bands',
    bands: [
      { fromKg: 20, toKg: 30, amount: 1, maxPerDay: 2, age: '6–12 let' },
      { fromKg: 30, toKg: 40, amount: 1, maxPerDay: 3, age: '6–12 let' },
    ],
    hours: 6,
    intervalNote: 'Leták doporučuje odstup mezi dávkami 6–8 hodin.',
    belowNote: 'Leták uvádí dávkování až pro děti od 6 let.',
    aboveNote: 'Dávkování pro dospívající a dospělé najdete v letáku.',
    note: 'Tablety se podle letáku polykají celé. Dětem do 30 kg nejvýše 2 tablety denně.',
  },
  // PARALEN 100 mg čípky
  10: {
    suklCode: '0254421',
    document: 'PI224018',
    kind: 'bands',
    bands: [
      { fromKg: 7, toKg: 13, amount: 1, maxPerDay: 4 },
      { fromKg: 14, toKg: 20, amount: 2, maxPerDay: 4 },
    ],
    hours: 6,
    intervalNote: 'Leták udává 3–4× denně s odstupem nejméně 6 hodin.',
    belowNote: 'Leták uvádí dávky až od 7 kg.',
    aboveNote: 'Leták uvádí dávky jen do 20 kg.',
  },
  // PARALEN 125 mg tablety
  11: {
    suklCode: '0254422',
    document: 'PI224020',
    kind: 'bands',
    bands: [
      { fromKg: 9, toKg: 12, amount: 1, maxPerDay: 4, age: 'do 6 let' },
      { fromKg: 13, toKg: 16, amount: 1.5, maxPerDay: 4, age: 'do 6 let' },
      { fromKg: 17, toKg: 20, amount: 2, maxPerDay: 4, age: 'do 6 let' },
      { fromKg: 21, toKg: 25, amount: 2, maxPerDay: 4, age: '6–12 let' },
      { fromKg: 26, toKg: 32, amount: 2, amountMax: 3, maxPerDay: 4, age: '6–12 let' },
      { fromKg: 33, toKg: 40, amount: 3, amountMax: 4, maxPerDay: 4, age: '6–12 let' },
    ],
    hours: 6,
    intervalNote:
      'Leták udává 3–4× denně po 6 hodinách; odstup lze zkrátit na 4 hodiny, pokud se nepřekročí denní dávka.',
    belowNote: 'Leták uvádí dávky až od 9 kg.',
    aboveNote: 'Leták uvádí dětské dávky jen do 40 kg.',
  },
};
