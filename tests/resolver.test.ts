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
  it('3 Patates → total = 3', () => {
    const grid = makeGrid(withCells([[0, 0, 'patate'], [0, 1, 'patate'], [0, 2, 'patate']]));
    const result = resolve(grid, R1);
    expect(result.totalCoins).toBe(3);
    expect(result.events.filter(e => e.type === 'gain')).toHaveLength(3);
  });

  it('Vache adjacente à 2 Patates → Vache rapporte 7 (3 base + 2×2)', () => {
    // Vache en (0,0), Patate en (0,1) et (1,0)
    const grid = makeGrid(withCells([[0, 0, 'vache'], [0, 1, 'patate'], [1, 0, 'patate']]));
    const result = resolve(grid, R1);
    // Total = Vache(7) + Patate(1) + Patate(1) = 9
    expect(result.totalCoins).toBe(9);
    const vacheGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'vache');
    expect(vacheGain).toMatchObject({ type: 'gain', amount: 7 });
  });

  it('Rat adjacent à une Poule → Poule détruite, ne compte pas', () => {
    const grid = makeGrid(withCells([[0, 0, 'rat'], [0, 1, 'poule']]));
    const result = resolve(grid, R1);
    // Event destroy en premier
    expect(result.events[0]).toMatchObject({ type: 'destroy', symbolId: 'poule' });
    // Poule n'a pas de gain event
    const pouleGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'poule');
    expect(pouleGain).toBeUndefined();
    // Seul Rat rapporte ses pièces
    expect(result.totalCoins).toBe(4);
  });

  it("Pioche adjacente à un Or → l'Or vaut 16 (8 × 2)", () => {
    const grid = makeGrid(withCells([[0, 0, 'pioche'], [0, 1, 'or']]));
    const result = resolve(grid, R1);
    const orGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'or');
    expect(orGain).toMatchObject({ type: 'gain', amount: 16 });
    // Total = Pioche(1) + Or(16) = 17
    expect(result.totalCoins).toBe(17);
  });

  it("Pioche adjacente à un Diamant → Diamant vaut 30 (15 × 2)", () => {
    const grid = makeGrid(withCells([[0, 0, 'pioche'], [0, 1, 'diamant']]));
    const result = resolve(grid, R1);
    const diamantGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'diamant');
    expect(diamantGain).toMatchObject({ type: 'gain', amount: 30 });
    // Total = Pickaxe(1) + Diamond(30) = 31
    expect(result.totalCoins).toBe(31);
  });

  it('Arrosoir adjacent à une Citrouille → Citrouille vaut 8 (4 × 2)', () => {
    const grid = makeGrid(withCells([[0, 0, 'arrosoir'], [0, 1, 'citrouille']]));
    const result = resolve(grid, R1);
    const citrGain = result.events.find(e => e.type === 'gain' && 'sourceId' in e && e.sourceId === 'citrouille');
    expect(citrGain).toMatchObject({ type: 'gain', amount: 8 });
    // Total = Watering Can(1) + Pumpkin(8) = 9
    expect(result.totalCoins).toBe(9);
  });

  it('Vache à la manche 3 → produit un Lait', () => {
    const grid = makeGrid(withCells([[0, 0, 'vache']]));
    const result = resolve(grid, { round: 3 });
    const produceEvent = result.events.find(e => e.type === 'produce');
    expect(produceEvent).toMatchObject({ type: 'produce', symbolId: 'lait' });
    expect(result.producedSymbolIds).toContain('lait');
    // No production at round 1
    const resultR1 = resolve(grid, R1);
    expect(resultR1.events.find(e => e.type === 'produce')).toBeUndefined();
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
