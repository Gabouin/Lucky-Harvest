import { GRID_SIZE, QUOTAS, SPINS_PER_ROUND, STARTING_COINS, STARTING_RESERVE } from '../data/config';
import { SYMBOL_MAP } from '../data/symbols';
import type { GridState, ResolutionResult } from '../data/types';

export interface GameState {
  coins: number;
  reserve: string[];   // ids des symboles du joueur
  round: number;       // 1-indexé
  spinsLeft: number;
  phase: 'idle' | 'gameover';
}

// mulberry32 — PRNG seedable, rapide, qualité suffisante pour un jeu de jam
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Partial Fisher-Yates : sélectionne n éléments de arr sans remise
function sampleN(arr: readonly string[], n: number, rng: () => number): string[] {
  const copy = [...arr];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function createGame(seed?: number): { state: GameState; rng: () => number } {
  return {
    state: {
      coins: STARTING_COINS,
      reserve: [...STARTING_RESERVE],
      round: 1,
      spinsLeft: SPINS_PER_ROUND,
      phase: 'idle',
    },
    rng: createRng(seed ?? Date.now()),
  };
}

export function spinGrid(reserve: readonly string[], rng: () => number): GridState {
  const CELLS = GRID_SIZE * GRID_SIZE;

  // 16 emplacements : symboles tirés + cases vides
  const slots: (string | null)[] = Array<string | null>(CELLS).fill(null);
  const source = reserve.length <= CELLS ? [...reserve] : sampleN(reserve, CELLS, rng);
  for (let i = 0; i < source.length; i++) slots[i] = source[i];

  // Fisher-Yates sur les 16 emplacements → placement aléatoire dans toute la grille
  for (let i = CELLS - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  const grid: GridState = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const id = slots[row * GRID_SIZE + col];
      grid[row][col] = id !== null ? (SYMBOL_MAP.get(id) ?? null) : null;
    }
  }
  return grid;
}

export function applyResolution(state: GameState, result: ResolutionResult): GameState {
  return {
    ...state,
    coins: state.coins + result.totalCoins,
    reserve: [...state.reserve, ...result.producedSymbolIds],
    spinsLeft: state.spinsLeft - 1,
  };
}

export function endRound(state: GameState): { state: GameState; outcome: 'continue' | 'gameover' } {
  const idx = Math.min(state.round - 1, QUOTAS.length - 1);
  const quota = QUOTAS[idx]!;
  if (state.coins >= quota) {
    return {
      state: {
        ...state,
        coins: state.coins - quota,
        round: state.round + 1,
        spinsLeft: SPINS_PER_ROUND,
        phase: 'idle',
      },
      outcome: 'continue',
    };
  }
  return {
    state: { ...state, phase: 'gameover' },
    outcome: 'gameover',
  };
}
