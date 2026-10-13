import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ingredients } from '../data/medicines.ts';
import { formatClock, formatRemaining, nextDoseTime, pruneOld, type DiaryEntry } from './diary.ts';

const HOUR = 60 * 60 * 1000;
const T0 = new Date(2026, 9, 13, 8, 0).getTime();

function entry(ingredient: 'ibu' | 'par', hoursAfterStart: number): DiaryEntry {
  return {
    id: `${ingredient}-${hoursAfterStart}`,
    time: T0 + hoursAfterStart * HOUR,
    ingredient,
    label: 'Lék',
    amount: '5 ml',
    mg: 100,
    weight: 10,
  };
}

test('bez záznamů lze podat hned', () => {
  assert.equal(nextDoseTime([], ingredients.ibu), 0);
});

test('stejná látka až po jejím intervalu', () => {
  const entries = [entry('ibu', 0)];
  assert.equal(nextDoseTime(entries, ingredients.ibu), T0 + 8 * HOUR);
  assert.equal(nextDoseTime([entry('par', 0)], ingredients.par), T0 + 6 * HOUR);
});

test('druhá látka nejdříve po 4 hodinách', () => {
  assert.equal(nextDoseTime([entry('ibu', 0)], ingredients.par), T0 + 4 * HOUR);
});

test('při střídání platí přísnější z obou pravidel', () => {
  // ibuprofen v 8:00, paracetamol ve 12:00
  const entries = [entry('ibu', 0), entry('par', 4)];
  // ibuprofen: 8 h od ibuprofenu (16:00) i 4 h od paracetamolu (16:00)
  assert.equal(nextDoseTime(entries, ingredients.ibu), T0 + 8 * HOUR);
  // paracetamol: 6 h od paracetamolu (18:00)
  assert.equal(nextDoseTime(entries, ingredients.par), T0 + 10 * HOUR);

  // ibuprofen v 8:00, paracetamol až ve 14:00 → ibuprofen nejdříve v 18:00
  assert.equal(
    nextDoseTime([entry('ibu', 0), entry('par', 6)], ingredients.ibu),
    T0 + 10 * HOUR,
  );
});

test('denní maximum se počítá za posledních 24 hodin', () => {
  // paracetamol 4× po 6 hodinách: 8:00, 14:00, 20:00, 2:00 → další v 8:00
  const regular = [0, 6, 12, 18].map((h) => entry('par', h));
  assert.equal(nextDoseTime(regular, ingredients.par), T0 + 24 * HOUR);

  // ibuprofen podaný dřív než po 8 hodinách: 8:00, 14:00, 20:00
  // interval by dovolil 4:00, ale čtvrtá dávka smí být až 24 h po první
  const early = [0, 6, 12].map((h) => entry('ibu', h));
  assert.equal(nextDoseTime(early, ingredients.ibu), T0 + 24 * HOUR);
});

test('staré záznamy se odmazávají', () => {
  const now = T0 + 8 * 24 * HOUR;
  const kept = pruneOld([entry('ibu', 0), entry('par', 7 * 24)], now);
  assert.deepEqual(kept.map((e) => e.id), ['par-168']);
});

test('zbývající čas slovy', () => {
  assert.equal(formatRemaining(15 * 60000), 'za 15 min');
  assert.equal(formatRemaining(2 * HOUR), 'za 2 h');
  assert.equal(formatRemaining(2 * HOUR + 15 * 60000), 'za 2 h 15 min');
  assert.equal(formatRemaining(20000), 'za 1 min');
});

test('čas podání slovy', () => {
  assert.equal(formatClock(T0 + 10.5 * HOUR, T0), '18:30');
  assert.equal(formatClock(T0 + 10.5 * HOUR, T0, true), 'v\u00a018:30');
  assert.equal(formatClock(T0 + 18 * HOUR, T0, true), 'zítra v\u00a02:00');
  assert.equal(formatClock(T0 - 10 * HOUR, T0), 'včera 22:00');
});
