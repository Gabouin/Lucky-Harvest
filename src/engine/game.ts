import {
  GRID_SIZE, QUOTAS, SPINS_PER_ROUND, STARTING_COINS, STARTING_RESERVE,
  SHOP_OFFER_SIZE, BUYS_PER_SHOP, REMOVALS_PER_SHOP, RARITY_WEIGHTS, COSTS,
  FINAL_ROUND, MIN_RESERVE,
} from '../data/config';
import { SYMBOLS, SYMBOL_MAP } from '../data/symbols';
import type { GameSymbol, GridState, ResolutionResult } from '../data/types';

export interface ShopItem {
  symbolId: string;
  cost: number;
}

export interface GameState {
  coins: number;
  reserve: string[];     // ids des symboles du joueur
  round: number;         // 1-indexé
  spinsLeft: number;
  phase: 'idle' | 'shop' | 'gameover' | 'victory';
  shopOffer: ShopItem[]; // vide hors de la phase 'shop'
  buysLeft: number;
  removalsLeft: number;
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

// Weighted pick sans remise depuis un pool de symboles
function weightedPick(pool: GameSymbol[], rng: () => number): { picked: GameSymbol; rest: GameSymbol[] } {
  const total = pool.reduce((sum, s) => sum + (RARITY_WEIGHTS[s.rarity] ?? 1), 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= RARITY_WEIGHTS[pool[i].rarity] ?? 1;
    if (r <= 0) return { picked: pool[i], rest: pool.filter((_, j) => j !== i) };
  }
  return { picked: pool[pool.length - 1], rest: pool.slice(0, -1) };
}

export function createGame(seed?: number): { state: GameState; rng: () => number } {
  return {
    state: {
      coins: STARTING_COINS,
      reserve: [...STARTING_RESERVE],
      round: 1,
      spinsLeft: SPINS_PER_ROUND,
      phase: 'idle',
      shopOffer: [],
      buysLeft: 0,
      removalsLeft: 0,
    },
    rng: createRng(seed ?? Date.now()),
  };
}

export function spinGrid(reserve: readonly string[], rng: () => number): GridState {
  const CELLS = GRID_SIZE * GRID_SIZE;
  const slots: (string | null)[] = Array<string | null>(CELLS).fill(null);
  const source = reserve.length <= CELLS ? [...reserve] : sampleN(reserve, CELLS, rng);
  for (let i = 0; i < source.length; i++) slots[i] = source[i];

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

export function endRound(state: GameState): {
  state: GameState;
  outcome: 'continue' | 'gameover' | 'victory';
} {
  const idx = Math.min(state.round - 1, QUOTAS.length - 1);
  const quota = QUOTAS[idx]!;
  if (state.coins >= quota) {
    const paid: GameState = {
      ...state,
      coins: state.coins - quota,
      round: state.round + 1,
      spinsLeft: SPINS_PER_ROUND,
    };
    if (state.round === FINAL_ROUND) {
      return { state: { ...paid, phase: 'victory' }, outcome: 'victory' };
    }
    return { state: { ...paid, phase: 'idle' }, outcome: 'continue' };
  }
  return { state: { ...state, phase: 'gameover' }, outcome: 'gameover' };
}

// ── Boutique ────────────────────────────────────────────────────────────────

export function enterShop(state: GameState, rng: () => number): GameState {
  let pool = SYMBOLS.filter(s => s.buyable);
  const offer: ShopItem[] = [];
  const size = Math.min(SHOP_OFFER_SIZE, pool.length);
  for (let i = 0; i < size; i++) {
    const { picked, rest } = weightedPick(pool, rng);
    pool = rest;
    offer.push({ symbolId: picked.id, cost: COSTS[picked.rarity] ?? 0 });
  }
  return {
    ...state,
    phase: 'shop',
    shopOffer: offer,
    buysLeft: BUYS_PER_SHOP,
    removalsLeft: REMOVALS_PER_SHOP,
  };
}

export function buySymbol(state: GameState, index: number): GameState {
  const item = state.shopOffer[index];
  if (!item || state.buysLeft <= 0 || state.coins < item.cost) return state;
  return {
    ...state,
    coins: state.coins - item.cost,
    reserve: [...state.reserve, item.symbolId],
    buysLeft: state.buysLeft - 1,
  };
}

export function removeSymbol(state: GameState, symbolId: string): GameState {
  if (state.removalsLeft <= 0) return state;
  if (state.reserve.length <= MIN_RESERVE) return state;
  const idx = state.reserve.indexOf(symbolId);
  if (idx === -1) return state;
  const newReserve = state.reserve.filter((_, i) => i !== idx);
  return { ...state, reserve: newReserve, removalsLeft: state.removalsLeft - 1 };
}

export function exitShop(state: GameState): GameState {
  return { ...state, phase: 'idle', shopOffer: [] };
}
