import { describe, it, expect } from 'vitest';
import { createGame, endRound, spinGrid, createRng, buySymbol, removeSymbol, enterShop } from '../src/engine/game';
import type { GameState } from '../src/engine/game';
import { QUOTAS, SPINS_PER_ROUND, BUYS_PER_SHOP, REMOVALS_PER_SHOP, MIN_RESERVE, FINAL_ROUND } from '../src/data/config';

// ── Boucle de base ──────────────────────────────────────────────────────────

describe('game loop', () => {
  it('transition de manche réussie — round++, coins déduits, spinsLeft réinitialisé', () => {
    const { state } = createGame(1);
    const withCoins = { ...state, coins: QUOTAS[0]! + 3 };
    const { state: next, outcome } = endRound(withCoins);
    expect(outcome).toBe('continue');
    expect(next.round).toBe(2);
    expect(next.coins).toBe(3);
    expect(next.spinsLeft).toBe(SPINS_PER_ROUND);
    expect(next.phase).toBe('idle');
  });

  it('game over quand les pièces sont insuffisantes', () => {
    const { state } = createGame(1);
    const { state: dead, outcome } = endRound(state);
    expect(outcome).toBe('gameover');
    expect(dead.phase).toBe('gameover');
  });

  it('spinGrid est déterministe avec le même seed', () => {
    const { state } = createGame(1);
    const ids = (grid: ReturnType<typeof spinGrid>) =>
      grid.flat().map(sym => sym?.id ?? null);
    expect(ids(spinGrid(state.reserve, createRng(42)))).toEqual(
      ids(spinGrid(state.reserve, createRng(42))),
    );
  });

  it('victoire déclenchée exactement à FINAL_ROUND', () => {
    const { state } = createGame(1);
    const finalState = { ...state, round: FINAL_ROUND, coins: 999 };
    const { outcome, state: next } = endRound(finalState);
    expect(outcome).toBe('victory');
    expect(next.phase).toBe('victory');
  });

  it('pas de victoire avant FINAL_ROUND', () => {
    const { state } = createGame(1);
    const beforeFinal = { ...state, round: FINAL_ROUND - 1, coins: 999 };
    const { outcome } = endRound(beforeFinal);
    expect(outcome).toBe('continue');
  });
});

// ── Boutique ────────────────────────────────────────────────────────────────

function makeShopState(overrides: Partial<GameState> = {}): GameState {
  const { state } = createGame(1);
  return {
    ...state,
    phase: 'shop',
    shopOffer: [
      { symbolId: 'carotte', cost: 3 },
      { symbolId: 'fer',     cost: 6 },
      { symbolId: 'or',      cost: 12 },
    ],
    buysLeft: BUYS_PER_SHOP,
    removalsLeft: REMOVALS_PER_SHOP,
    ...overrides,
  };
}

describe('boutique — achat', () => {
  it('buySymbol déduit les pièces et ajoute à la réserve', () => {
    const state = makeShopState({ coins: 10 });
    const next = buySymbol(state, 0); // carotte à 3
    expect(next.coins).toBe(7);
    expect(next.reserve).toContain('carotte');
    expect(next.buysLeft).toBe(0);
  });

  it('buySymbol refuse si trop cher — no-op (même référence)', () => {
    const state = makeShopState({ coins: 2 }); // carotte coûte 3
    expect(buySymbol(state, 0)).toBe(state);
  });

  it('buySymbol refuse si buysLeft = 0', () => {
    const state = makeShopState({ buysLeft: 0, coins: 99 });
    expect(buySymbol(state, 0)).toBe(state);
  });
});

describe('boutique — retrait', () => {
  it('removeSymbol retire un exemplaire et décrémente removalsLeft', () => {
    const state = makeShopState();
    // reserve = ['patate','patate','patate','patate','vache','poule'] — 6 éléments > MIN_RESERVE(4)
    const next = removeSymbol(state, 'patate');
    expect(next.reserve.length).toBe(5);
    expect(next.removalsLeft).toBe(0);
    expect(next.reserve.filter(id => id === 'patate').length).toBe(3);
  });

  it('removeSymbol no-op si removalsLeft = 0', () => {
    const state = makeShopState({ removalsLeft: 0 });
    expect(removeSymbol(state, 'patate')).toBe(state);
  });

  it('removeSymbol respecte le plancher MIN_RESERVE', () => {
    // Reserve exactement au minimum
    const minReserve = Array<string>(MIN_RESERVE).fill('patate');
    const state = makeShopState({ reserve: minReserve });
    expect(removeSymbol(state, 'patate')).toBe(state);
  });
});

describe('boutique — tirage', () => {
  it('enterShop produit des offres de symboles buyable uniquement', () => {
    const { state, rng } = createGame(42);
    const shopState = enterShop({ ...state, round: 2, spinsLeft: 0, phase: 'idle' as const }, rng);
    expect(shopState.phase).toBe('shop');
    expect(shopState.shopOffer.length).toBeGreaterThan(0);
    // Vérifier que les ids tirés ne sont ni 'oeuf' ni 'laine' (non-buyable)
    for (const item of shopState.shopOffer) {
      expect(item.symbolId).not.toBe('oeuf');
      expect(item.symbolId).not.toBe('laine');
    }
  });
});
