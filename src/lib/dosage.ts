import type { Leaflet } from '../data/leaflets';
import type { Ingredient, Product, ProductForm } from '../data/medicines';

export type DosingMode = 'leaflet' | 'pediatric';

/** Jak často lze dávku opakovat; s těmito hodnotami počítá i deníček. */
export type Schedule = {
  hours: number;
  maxPerDay: number;
  text: string;
  note?: string;
};

export type Dose =
  | {
      status: 'ok';
      /** Počet ml (sirup) nebo kusů (čípky, tablety). */
      amount: number;
      /** Horní mez, pokud leták udává rozmezí. */
      amountMax?: number;
      unit: string;
      /** Počet kusů pro vykreslení; u sirupu 0. */
      pieces: number;
      actualMg: number;
      actualMgMax?: number;
      /** Jen při výpočtu na kilogram: vypočtená dávka a kolik procent z ní podané množství pokrývá. */
      idealMg?: number;
      coverage?: number;
      instruction: string;
      schedule: Schedule;
      /** Věk, pro který leták dávku uvádí, a další upozornění z letáku. */
      age?: string;
      note?: string;
      /** Označení dokumentu SÚKL, ze kterého dávka pochází. */
      source?: string;
    }
  | {
      status: 'unsuitable';
      idealMg?: number;
      instruction: string;
      source?: string;
    };

export function formatNumber(value: number): string {
  return value.toString().replace('.', ',');
}

/** Množství jako "6,2" nebo rozmezí "1–2". */
export function formatAmount(dose: { amount: number; amountMax?: number }): string {
  return dose.amountMax !== undefined && dose.amountMax !== dose.amount
    ? `${formatNumber(dose.amount)}–${formatNumber(dose.amountMax)}`
    : formatNumber(dose.amount);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Převede text z pole pro hmotnost ("12,5") na číslo; neplatný vstup je 0. */
export function parseWeight(text: string): number {
  return parseFloat(text.replace(',', '.')) || 0;
}

/** Ponechá jen číslice a jednu desetinnou čárku, nejvýše 3 + 2 místa. */
export function sanitizeWeightText(text: string): string {
  const cleaned = text.replace(/\./g, ',').replace(/[^0-9,]/g, '');
  const [whole, ...rest] = cleaned.split(',');
  const trimmedWhole = whole.slice(0, 3);
  if (rest.length === 0) return trimmedWhole;
  return `${trimmedWhole},${rest.join('').slice(0, 2)}`;
}

export function pieceUnit(amount: number, form: ProductForm): string {
  const suppository = form === 'suppository';
  if (amount % 1 !== 0 || amount === 0) return suppository ? 'čípku' : 'tablety';
  if (amount === 1) return suppository ? 'čípek' : 'tabletu';
  if (amount >= 2 && amount <= 4) return suppository ? 'čípky' : 'tablety';
  return suppository ? 'čípků' : 'tablet';
}

export function pediatricSchedule(ingredient: Ingredient): Schedule {
  return {
    hours: ingredient.hoursBetweenDoses,
    maxPerDay: ingredient.maxPerDay,
    text: `Max. ${ingredient.maxPerDay}× denně po ${ingredient.hoursBetweenDoses} hodinách`,
  };
}

export function calculateDose(weight: number, product: Product, ingredient: Ingredient): Dose {
  const idealMg = weight * ingredient.mgPerKg;

  if (product.form === 'syrup') {
    const ml = Math.floor((idealMg / product.mgPerMl) * 10) / 10;
    if (ml === 0) {
      return {
        status: 'unsuitable',
        idealMg,
        instruction: 'Dávka vychází příliš nízká na to, aby šla odměřit stříkačkou.',
      };
    }
    const actualMg = Math.floor(ml * product.mgPerMl);
    return {
      status: 'ok',
      amount: ml,
      unit: 'ml',
      pieces: 0,
      actualMg,
      idealMg,
      coverage: Math.round((actualMg / idealMg) * 100),
      instruction: `Naberte ${formatNumber(ml)} ml do dávkovací stříkačky.`,
      schedule: pediatricSchedule(ingredient),
    };
  }

  // Tablety lze dělit na čtvrtiny, čípky jen na poloviny; vždy se zaokrouhluje dolů.
  const divisionStep = product.form === 'tablet' ? 4 : 2;
  const pieces = Math.floor((idealMg / product.mgPerPiece) * divisionStep) / divisionStep;

  if (pieces === 0) {
    return {
      status: 'unsuitable',
      idealMg,
      instruction:
        'Dávka pro tuto formu je příliš nízká. Použijte sirup pro přesné odměření stříkačkou.',
    };
  }

  const unit = pieceUnit(pieces, product.form);
  const actualMg = Math.round(pieces * product.mgPerPiece * 100) / 100;
  const action = product.form === 'suppository' ? 'Aplikujte' : 'Podejte';
  const note =
    pieces % 1 !== 0 ? (product.form === 'suppository' ? ' (lze seříznout)' : ' (lze rozdělit)') : '';

  return {
    status: 'ok',
    amount: pieces,
    unit,
    pieces,
    actualMg,
    idealMg,
    coverage: Math.round((actualMg / idealMg) * 100),
    instruction: `${action} ${formatNumber(pieces)} ${unit}${note}.`,
    schedule: pediatricSchedule(ingredient),
  };
}

/**
 * Dávka podle příbalového letáku. Leták dávkuje po hmotnostních pásmech;
 * hmotnost mezi dvěma pásmy (např. 8,5 kg mezi "7–8 kg" a "9–10 kg") i na
 * společné hranici dvou pásem spadá do nižšího z nich.
 */
export function calculateLeafletDose(weight: number, product: Product, leaflet: Leaflet): Dose {
  const source = leaflet.document;
  const strength = product.form === 'syrup' ? product.mgPerMl : product.mgPerPiece;

  let amount: number;
  let amountMax: number | undefined;
  let maxPerDay: number;
  let age: string | undefined;

  if (leaflet.kind === 'daily') {
    if (weight < leaflet.fromKg) return { status: 'unsuitable', instruction: leaflet.belowNote, source };
    if (weight > leaflet.toKg) return { status: 'unsuitable', instruction: leaflet.aboveNote, source };
    const perDose = (mgPerKg: number) =>
      Math.floor((Math.min(weight * mgPerKg, leaflet.maxDailyMg) / leaflet.dosesPerDay / strength) * 10) / 10;
    amount = perDose(leaflet.dailyMgPerKgMin);
    amountMax = perDose(leaflet.dailyMgPerKgMax);
    maxPerDay = leaflet.dosesPerDay;
  } else {
    const { bands } = leaflet;
    if (weight < bands[0].fromKg) return { status: 'unsuitable', instruction: leaflet.belowNote, source };
    const band = bands.find(
      (b, index) => weight <= b.toKg || (index + 1 < bands.length && weight < bands[index + 1].fromKg),
    );
    if (!band) return { status: 'unsuitable', instruction: leaflet.aboveNote, source };
    ({ amount, amountMax, maxPerDay, age } = band);
  }

  if (amountMax === amount) amountMax = undefined;
  const range = { amount, amountMax };
  const unit = product.form === 'syrup' ? 'ml' : pieceUnit(amountMax ?? amount, product.form);
  const instruction =
    product.form === 'syrup'
      ? `Naberte ${formatAmount(range)} ml do dávkovací stříkačky.`
      : `${product.form === 'suppository' ? 'Aplikujte' : 'Podejte'} ${formatAmount(range)} ${unit}${
          amount % 1 !== 0 ? ' (lze rozdělit)' : ''
        }.`;

  return {
    status: 'ok',
    amount,
    amountMax,
    unit,
    pieces: product.form === 'syrup' ? 0 : amount,
    actualMg: round2(amount * strength),
    actualMgMax: amountMax === undefined ? undefined : round2(amountMax * strength),
    instruction,
    schedule: {
      hours: leaflet.hours,
      maxPerDay,
      text: `Max. ${maxPerDay}× denně, nejdříve po ${leaflet.hours} hodinách`,
      note: leaflet.intervalNote,
    },
    age,
    note: leaflet.note,
    source,
  };
}
