import type {
  GridState,
  GameSymbol,
  ResolutionContext,
  ResolutionResult,
  ResolutionEvent,
  Trigger,
} from '../data/types';

const ROWS = 4;
const COLS = 4;
// N → E → S → W (ordre fixe pour le déterminisme)
const DIRS: readonly [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

type Neighbor = { row: number; col: number; symbol: GameSymbol };

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

function getNeighbors(
  grid: GridState,
  row: number,
  col: number,
  destroyed: ReadonlySet<string>,
): Neighbor[] {
  const result: Neighbor[] = [];
  for (const [dr, dc] of DIRS) {
    const r = row + dr;
    const c = col + dc;
    if (!inBounds(r, c)) continue;
    const sym = grid[r][c];
    if (sym === null || destroyed.has(cellKey(r, c))) continue;
    result.push({ row: r, col: c, symbol: sym });
  }
  return result;
}

function triggerFires(
  trigger: Trigger,
  context: ResolutionContext,
  neighbors: Neighbor[],
): boolean {
  switch (trigger.kind) {
    case 'onResolve':
      return true;
    case 'onAdjacentTag':
      return neighbors.some(n => n.symbol.tags.includes(trigger.tag));
    case 'everyNRounds':
      return context.round % trigger.n === 0;
  }
}

interface CellState {
  base: number;
  addBonus: number;
  multFactor: number;
}

export function resolve(grid: GridState, context: ResolutionContext): ResolutionResult {
  const events: ResolutionEvent[] = [];
  const producedSymbolIds: string[] = [];

  // ── Phase 1 : Destructions ───────────────────────────────────────────────
  // Chaque destructeur cherche sa première proie (N→E→S→W).
  // Deux renards sur la même proie → détruite une seule fois (Set).
  const destroyed = new Set<string>();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sym = grid[row][col];
      if (!sym) continue;
      const neighbors = getNeighbors(grid, row, col, new Set());
      for (const { trigger, action } of sym.effects) {
        if (action.kind !== 'destroyAdjacentTag') continue;
        if (!triggerFires(trigger, context, neighbors)) continue;
        for (const [dr, dc] of DIRS) {
          const r = row + dr;
          const c = col + dc;
          if (!inBounds(r, c)) continue;
          const neighbor = grid[r][c];
          if (neighbor && neighbor.tags.includes(action.tag)) {
            destroyed.add(cellKey(r, c));
            break; // une seule proie par destructeur
          }
        }
      }
    }
  }

  // Destroy events avant tous les gain events
  for (const k of destroyed) {
    const [r, c] = k.split(',').map(Number);
    events.push({ type: 'destroy', row: r, col: c, symbolId: grid[r][c]!.id });
  }

  // ── Phase 2 : Collecte des modificateurs ────────────────────────────────
  // valeur = (base + Σ additifs) × Π multiplicateurs
  // Les multiplicateurs d'un symbole s'appliquent sur ses voisins ciblés.
  const states = new Map<string, CellState>();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sym = grid[row][col];
      if (!sym || destroyed.has(cellKey(row, col))) continue;
      states.set(cellKey(row, col), { base: sym.baseValue, addBonus: 0, multFactor: 1 });
    }
  }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sym = grid[row][col];
      if (!sym || destroyed.has(cellKey(row, col))) continue;
      const neighbors = getNeighbors(grid, row, col, destroyed);
      const selfState = states.get(cellKey(row, col))!;

      for (const { trigger, action } of sym.effects) {
        if (action.kind === 'destroyAdjacentTag' || action.kind === 'produceSymbol') continue;
        if (!triggerFires(trigger, context, neighbors)) continue;

        switch (action.kind) {
          case 'addCoins':
            selfState.addBonus += action.amount;
            break;
          case 'addCoinsPerAdjacentTag': {
            const count = neighbors.filter(n => n.symbol.tags.includes(action.tag)).length;
            selfState.addBonus += count * action.amount;
            break;
          }
          case 'multiplyOwnValue':
            selfState.multFactor *= action.factor;
            break;
          case 'multiplyAdjacentTagValue': {
            const targets = neighbors.filter(n => n.symbol.tags.includes(action.tag));
            for (const t of targets) {
              states.get(cellKey(t.row, t.col))!.multFactor *= action.factor;
            }
            break;
          }
        }
      }
    }
  }

  // ── Phase 3 : Finalisation + gain events ────────────────────────────────
  let totalCoins = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sym = grid[row][col];
      if (!sym || destroyed.has(cellKey(row, col))) continue;
      const state = states.get(cellKey(row, col))!;
      const amount = (state.base + state.addBonus) * state.multFactor;
      totalCoins += amount;
      events.push({ type: 'gain', row, col, amount, sourceId: sym.id });
    }
  }

  // ── Phase 4 : Productions ───────────────────────────────────────────────
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const sym = grid[row][col];
      if (!sym || destroyed.has(cellKey(row, col))) continue;
      const neighbors = getNeighbors(grid, row, col, destroyed);
      for (const { trigger, action } of sym.effects) {
        if (action.kind !== 'produceSymbol') continue;
        if (!triggerFires(trigger, context, neighbors)) continue;
        events.push({ type: 'produce', symbolId: action.symbolId });
        producedSymbolIds.push(action.symbolId);
      }
    }
  }

  return { totalCoins, events, producedSymbolIds };
}
