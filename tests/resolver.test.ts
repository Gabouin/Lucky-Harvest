import { describe, it, expect } from 'vitest';
import { resolve } from '../src/engine/resolver';
import { SYMBOL_MAP } from '../src/data/symbols';
import type { GridState, ResolutionContext } from '../src/data/types';

// Construit une grille 4×4 à partir d'un tableau d'ids (null = case vide)
function makeGrid(layout: (string | null)[][]): GridState {
  return layout.map(row =>
    row.map(id => (id !== null ? (SYMBOL_MAP.get(id) ?? null) : null)),
  );
}

const R1: ResolutionContext = { round: 1 };

// Grille vide 4×4 de base
const EMPTY: (string | null)[][] = [
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
  [null, null, null, null],
];

function withCells(cells: [number, number, string][]): (string | null)[][] {
  const g = EMPTY.map(row => [...row]);
  for (const [r, c, id] of cells) g[r][c] = id;
  return g;
}

describe('resolve', () => {
  it('3 Blé → total = 3', () => {
    const grid = makeGrid(withCells([[0, 0, 'ble'], [0, 1, 'ble'], [0, 2, 'ble']]));
    const result = resolve(grid, R1);
    expect(result.totalCoins).toBe(3);
    expect(result.events.filter(e => e.type === 'gain')).toHaveLength(3);
  });

  it('Vache adjacente à 2 Blé → Vache rapporte 7 (3 base + 2×2)', () => {
    // Vache en (0,0), Blé en (0,1) et (1,0)
    const grid = makeGrid(withCells([[0, 0, 'vache'], [0, 1, 'ble'], [1, 0, 'ble']]));
    const result = resolve(grid, R1);
    // Total = Vache(7) + Blé(1) + Blé(1) = 9
    expect(result.totalCoins).toBe(9);
    const vacheGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'vache');
    expect(vacheGain).toMatchObject({ type: 'gain', amount: 7 });
  });

  it('Renard adjacent à une Poule → Poule détruite, ne compte pas', () => {
    const grid = makeGrid(withCells([[0, 0, 'renard'], [0, 1, 'poule']]));
    const result = resolve(grid, R1);
    // Event destroy en premier
    expect(result.events[0]).toMatchObject({ type: 'destroy', symbolId: 'poule' });
    // Poule n'a pas de gain event
    const pouleGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'poule');
    expect(pouleGain).toBeUndefined();
    // Seul Renard rapporte ses pièces
    expect(result.totalCoins).toBe(4);
  });

  it("Mineur adjacent à un Or → l'Or vaut 16 (8 × 2)", () => {
    const grid = makeGrid(withCells([[0, 0, 'mineur'], [0, 1, 'or']]));
    const result = resolve(grid, R1);
    const orGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'or');
    expect(orGain).toMatchObject({ type: 'gain', amount: 16 });
    // Total = Mineur(1) + Or(16) = 17
    expect(result.totalCoins).toBe(17);
  });

  it('Poule à la manche 3 → produit un Oeuf', () => {
    const grid = makeGrid(withCells([[0, 0, 'poule']]));
    const result = resolve(grid, { round: 3 });
    const produceEvent = result.events.find(e => e.type === 'produce');
    expect(produceEvent).toMatchObject({ type: 'produce', symbolId: 'oeuf' });
    expect(result.producedSymbolIds).toContain('oeuf');
    // À la manche 1, pas de production
    const resultR1 = resolve(grid, R1);
    expect(resultR1.events.find(e => e.type === 'produce')).toBeUndefined();
  });
});
