import assert from 'node:assert/strict';
import { test } from 'node:test';

import { leaflets } from '../data/leaflets.ts';
import { ingredients, products } from '../data/medicines.ts';
import { calculateLeafletDose, formatAmount, calculateDose, pieceUnit, sanitizeWeightText, parseWeight } from './dosage.ts';

function dose(productId: number, weight: number) {
  const product = products.find((p) => p.id === productId)!;
  return calculateDose(weight, product, ingredients[product.ingredient]);
}

test('sirup se zaokrouhluje dolů na desetinu ml', () => {
  const nurofen = dose(1, 12);
  assert.equal(nurofen.status, 'ok');
  assert.deepEqual(
    nurofen.status === 'ok' && [nurofen.amount, nurofen.unit, nurofen.actualMg],
    [6, 'ml', 120],
  );

  // 7 kg × 15 mg = 105 mg; 105 / 24 = 4,375 ml → 4,3 ml → 103 mg
  const panadol = dose(5, 7);
  assert.deepEqual(
    panadol.status === 'ok' && [panadol.amount, panadol.actualMg, panadol.instruction],
    [4.3, 103, 'Naberte 4,3 ml do dávkovací stříkačky.'],
  );
});

test('čípky se dělí na poloviny, tablety na čtvrtiny', () => {
  // 10 kg × 15 mg = 150 mg; čípek 100 mg → 1,5 čípku
  const paralen = dose(10, 10);
  assert.deepEqual(
    paralen.status === 'ok' && [paralen.amount, paralen.unit, paralen.actualMg, paralen.coverage],
    [1.5, 'čípku', 150, 100],
  );
  assert.equal(
    paralen.status === 'ok' && paralen.instruction,
    'Aplikujte 1,5 čípku (lze seříznout).',
  );

  // 15 kg × 10 mg = 150 mg; tableta 200 mg → 0,75 tablety = 150 mg
  const ibalgin = dose(9, 15);
  assert.deepEqual(
    ibalgin.status === 'ok' && [ibalgin.amount, ibalgin.unit, ibalgin.actualMg],
    [0.75, 'tablety', 150],
  );

  // 14 kg × 10 mg = 140 mg; čípek 125 mg → 1 čípek, kryje 89 %
  const nurofen = dose(4, 14);
  assert.deepEqual(
    nurofen.status === 'ok' && [nurofen.amount, nurofen.unit, nurofen.coverage],
    [1, 'čípek', 89],
  );
});

test('příliš nízká dávka pro pevnou formu', () => {
  // 4 kg × 10 mg = 40 mg; čtvrtka tablety 200 mg je 50 mg
  assert.equal(dose(9, 4).status, 'unsuitable');
  // 5 kg × 15 mg = 75 mg; půlka čípku 250 mg je 125 mg
  assert.equal(dose(7, 5).status, 'unsuitable');
});

test('skloňování jednotek', () => {
  assert.equal(pieceUnit(1, 'tablet'), 'tabletu');
  assert.equal(pieceUnit(2, 'tablet'), 'tablety');
  assert.equal(pieceUnit(5, 'tablet'), 'tablet');
  assert.equal(pieceUnit(0.5, 'suppository'), 'čípku');
  assert.equal(pieceUnit(3, 'suppository'), 'čípky');
  assert.equal(pieceUnit(5, 'suppository'), 'čípků');
});

test('vstup hmotnosti', () => {
  assert.equal(sanitizeWeightText('12.5'), '12,5');
  assert.equal(sanitizeWeightText('1a2,,5kg'), '12,5');
  assert.equal(sanitizeWeightText('12345,678'), '123,67');
  assert.equal(parseWeight('12,5'), 12.5);
  assert.equal(parseWeight(''), 0);
  assert.equal(parseWeight(','), 0);
});

function leafletDose(productId: number, weight: number) {
  const product = products.find((p) => p.id === productId)!;
  return calculateLeafletDose(weight, product, leaflets[productId]);
}

function summary(productId: number, weight: number) {
  const dose = leafletDose(productId, weight);
  return dose.status === 'ok'
    ? `${formatAmount(dose)} ${dose.unit}, ${dose.schedule.maxPerDay}×`
    : dose.status;
}

test('leták: každý přípravek má tabulku', () => {
  for (const product of products) assert.ok(leaflets[product.id], product.name);
});

test('leták: hmotnostní pásma sirupů', () => {
  // Panadol 24 mg/ml
  assert.equal(summary(5, 4.9), 'unsuitable');
  assert.equal(summary(5, 5), '3 ml, 4×');
  assert.equal(summary(5, 12.5), '6 ml, 4×');
  assert.equal(summary(5, 40), '20 ml, 4×');
  assert.equal(summary(5, 41), 'unsuitable');
  // Ibalgin Baby
  assert.equal(summary(8, 12.5), '4 ml, 4×');
  assert.equal(summary(8, 18), '7 ml, 3×');
  assert.equal(summary(8, 35), '10–15 ml, 3×');
  // Nurofen 40 mg/ml až od 20 kg
  assert.equal(summary(2, 19), 'unsuitable');
  assert.equal(summary(2, 25), '5 ml, 3×');
  assert.equal(summary(2, 32), '7,5 ml, 3×');
});

test('leták: hmotnost mezi pásmy a na hranici patří do nižšího pásma', () => {
  // Panadol: mezi "7–8 kg" (4 ml) a "9–10 kg" (5 ml)
  assert.equal(summary(5, 8.5), '4 ml, 4×');
  // Ibalgin Baby: 20 kg je v pásmech "17–20" (7 ml) i "20–30" (8 ml)
  assert.equal(summary(8, 20), '7 ml, 3×');
  assert.equal(summary(8, 20.5), '8 ml, 3×');
  // Nurofen čípky 60 mg: 8 kg je v obou pásmech, nižší dovoluje jen 3 čípky denně
  assert.equal(summary(3, 8), '1 čípek, 3×');
  assert.equal(summary(3, 10), '1 čípek, 4×');
  assert.equal(summary(3, 13), 'unsuitable');
});

test('leták: čípky a tablety', () => {
  assert.equal(summary(6, 8), 'unsuitable');
  assert.equal(summary(6, 12.5), '1 čípek, 4×');
  assert.equal(summary(6, 16), '2 čípky, 4×');
  assert.equal(summary(7, 35), '1–2 čípky, 4×');
  assert.equal(summary(10, 15), '2 čípky, 4×');
  assert.equal(summary(11, 14), '1,5 tablety, 4×');
  assert.equal(summary(11, 30), '2–3 tablety, 4×');
  // Ibalgin 200: do 30 kg nejvýše 2 tablety denně
  assert.equal(summary(9, 15), 'unsuitable');
  assert.equal(summary(9, 25), '1 tabletu, 2×');
  assert.equal(summary(9, 35), '1 tabletu, 3×');
});

test('leták: Nurofen 20 mg/ml z denní dávky 20–30 mg/kg ve 3 dávkách', () => {
  // 12,5 kg: 250–375 mg denně → 83–125 mg na dávku → 4,1–6,2 ml
  assert.equal(summary(1, 12.5), '4,1–6,2 ml, 3×');
  // 20 kg: 400 mg až strop 500 mg denně → 6,6–8,3 ml
  assert.equal(summary(1, 20), '6,6–8,3 ml, 3×');
  // 30 kg: obě meze narazí na strop 500 mg denně
  assert.equal(summary(1, 30), '8,3 ml, 3×');
  assert.equal(summary(1, 4), 'unsuitable');
  assert.equal(summary(1, 31), 'unsuitable');
});
