import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ingredients, products } from '../data/medicines.ts';
import { calculateDose, pieceUnit, sanitizeWeightText, parseWeight } from './dosage.ts';

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
  assert.equal(dose(9, 4).status, 'tooLow');
  // 5 kg × 15 mg = 75 mg; půlka čípku 250 mg je 125 mg
  assert.equal(dose(7, 5).status, 'tooLow');
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
