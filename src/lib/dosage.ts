import type { Ingredient, Product, ProductForm } from '../data/medicines';

export type Dose =
  | {
      status: 'ok';
      /** Počet ml (sirup) nebo kusů (čípky, tablety). */
      amount: number;
      unit: string;
      /** Počet kusů pro vykreslení; u sirupu 0. */
      pieces: number;
      actualMg: number;
      idealMg: number;
      /** Kolik procent vypočtené dávky podané množství pokrývá. */
      coverage: number;
      instruction: string;
    }
  | {
      status: 'tooLow';
      idealMg: number;
      instruction: string;
    };

export function formatNumber(value: number): string {
  return value.toString().replace('.', ',');
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

export function intervalText(ingredient: Ingredient): string {
  return `Max. ${ingredient.maxPerDay}× denně po ${ingredient.hoursBetweenDoses} hodinách`;
}

export function calculateDose(weight: number, product: Product, ingredient: Ingredient): Dose {
  const idealMg = weight * ingredient.mgPerKg;

  if (product.form === 'syrup') {
    const ml = Math.floor((idealMg / product.mgPerMl) * 10) / 10;
    if (ml === 0) {
      return {
        status: 'tooLow',
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
    };
  }

  // Tablety lze dělit na čtvrtiny, čípky jen na poloviny; vždy se zaokrouhluje dolů.
  const divisionStep = product.form === 'tablet' ? 4 : 2;
  const pieces = Math.floor((idealMg / product.mgPerPiece) * divisionStep) / divisionStep;

  if (pieces === 0) {
    return {
      status: 'tooLow',
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
  };
}
