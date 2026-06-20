import { describe, it, expect } from 'vitest';
import { createGame, endRound, spinGrid, createRng } from '../src/engine/game';
import { QUOTAS, SPINS_PER_ROUND } from '../src/data/config';

describe('game loop', () => {
  it('transition de manche réussie — round++, coins déduits, spinsLeft réinitialisé', () => {
    const { state } = createGame(1);
    const quota = QUOTAS[0]!;
    const withCoins = { ...state, coins: quota + 3 }; // exactement quota + bonus
    const { state: next, outcome } = endRound(withCoins);
    expect(outcome).toBe('continue');
    expect(next.round).toBe(2);
    expect(next.coins).toBe(3);              // surplus conservé
    expect(next.spinsLeft).toBe(SPINS_PER_ROUND);
    expect(next.phase).toBe('idle');
  });

  it('game over quand les pièces sont insuffisantes', () => {
    const { state } = createGame(1);
    // coins=0 < QUOTAS[0]=5
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
});
