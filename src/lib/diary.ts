import type { Ingredient, IngredientId } from '../data/medicines';

export type DiaryEntry = {
  id: string;
  /** Čas podání v milisekundách. */
  time: number;
  ingredient: IngredientId;
  /** Název přípravku včetně značky. */
  label: string;
  /** Podané množství, např. "6,2 ml". */
  amount: string;
  mg: number;
  weight: number;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Lék s jinou účinnou látkou lze podat nejdříve po 4 hodinách. */
export const HOURS_BEFORE_OTHER_INGREDIENT = 4;
/** Starší záznamy se z deníčku samy odmazávají. */
export const KEEP_DAYS = 7;

/**
 * Nejbližší čas, kdy lze látku znovu podat. Hlídá odstup od poslední dávky
 * stejné látky, denní maximum (v posledních 24 hodinách) a 4 hodiny od
 * poslední dávky jiné látky. Čas v minulosti znamená, že lze podat hned.
 */
export function nextDoseTime(entries: DiaryEntry[], ingredient: Ingredient): number {
  const newestFirst = [...entries].sort((a, b) => b.time - a.time);
  const same = newestFirst.filter((e) => e.ingredient === ingredient.id);
  const other = newestFirst.filter((e) => e.ingredient !== ingredient.id);

  let earliest = 0;
  if (same.length > 0) {
    earliest = Math.max(earliest, same[0].time + ingredient.hoursBetweenDoses * HOUR);
  }
  if (same.length >= ingredient.maxPerDay) {
    earliest = Math.max(earliest, same[ingredient.maxPerDay - 1].time + DAY);
  }
  if (other.length > 0) {
    earliest = Math.max(earliest, other[0].time + HOURS_BEFORE_OTHER_INGREDIENT * HOUR);
  }
  return earliest;
}

export function lastDoseTime(entries: DiaryEntry[], ingredientId: IngredientId): number | null {
  const times = entries.filter((e) => e.ingredient === ingredientId).map((e) => e.time);
  return times.length > 0 ? Math.max(...times) : null;
}

export function pruneOld(entries: DiaryEntry[], now: number): DiaryEntry[] {
  return entries.filter((e) => now - e.time < KEEP_DAYS * DAY);
}

function dayStart(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * "18:30", u jiného dne "zítra 18:30", "včera 18:30" nebo "12. 10. 18:30".
 * S předložkou pro použití ve větě: "v 18:30", "zítra v 18:30".
 */
export function formatClock(time: number, now: number, withPreposition = false): string {
  const date = new Date(time);
  const clock = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  const at = withPreposition ? `v\u00a0${clock}` : clock;
  const days = Math.round((dayStart(time) - dayStart(now)) / DAY);
  if (days === 0) return at;
  if (days === 1) return `zítra ${at}`;
  if (days === -1) return `včera ${at}`;
  return `${date.getDate()}. ${date.getMonth() + 1}. ${at}`;
}

/** Zbývající čas slovy, např. "za 2 h 15 min". */
export function formatRemaining(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `za ${rest} min`;
  if (rest === 0) return `za ${hours} h`;
  return `za ${hours} h ${rest} min`;
}
