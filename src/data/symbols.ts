import type { GameSymbol } from './types';

export const SYMBOLS: readonly GameSymbol[] = [
  {
    id: 'ble',
    name: 'Blé',
    sprite: 'ble',
    rarity: 'common',
    baseValue: 1,
    tags: ['culture'],
    effects: [],
  },
  {
    id: 'carotte',
    name: 'Carotte',
    sprite: 'carotte',
    rarity: 'common',
    baseValue: 1,
    tags: ['culture'],
    effects: [],
  },
  {
    id: 'vache',
    name: 'Vache',
    sprite: 'vache',
    rarity: 'common',
    baseValue: 3,
    tags: ['animal'],
    effects: [
      {
        trigger: { kind: 'onAdjacentTag', tag: 'culture' },
        action: { kind: 'addCoinsPerAdjacentTag', tag: 'culture', amount: 2 },
      },
    ],
  },
  {
    id: 'poule',
    name: 'Poule',
    sprite: 'poule',
    rarity: 'common',
    baseValue: 2,
    tags: ['animal', 'proie'],
    effects: [
      {
        trigger: { kind: 'everyNRounds', n: 3 },
        action: { kind: 'produceSymbol', symbolId: 'oeuf' },
      },
    ],
  },
  {
    id: 'oeuf',
    name: 'Oeuf',
    sprite: 'oeuf',
    rarity: 'common',
    baseValue: 1,
    tags: ['proie'],
    effects: [],
  },
  {
    id: 'mouton',
    name: 'Mouton',
    sprite: 'mouton',
    rarity: 'common',
    baseValue: 2,
    tags: ['animal'],
    effects: [
      {
        trigger: { kind: 'everyNRounds', n: 4 },
        action: { kind: 'produceSymbol', symbolId: 'laine' },
      },
    ],
  },
  {
    id: 'laine',
    name: 'Laine',
    sprite: 'laine',
    rarity: 'uncommon',
    baseValue: 3,
    tags: [],
    effects: [],
  },
  {
    id: 'renard',
    name: 'Renard',
    sprite: 'renard',
    rarity: 'uncommon',
    baseValue: 4,
    tags: ['animal'],
    effects: [
      {
        trigger: { kind: 'onResolve' },
        action: { kind: 'destroyAdjacentTag', tag: 'proie' },
      },
    ],
  },
  {
    id: 'mineur',
    name: 'Mineur',
    sprite: 'mineur',
    rarity: 'common',
    baseValue: 1,
    tags: ['humain'],
    effects: [
      {
        trigger: { kind: 'onAdjacentTag', tag: 'minerai' },
        action: { kind: 'multiplyAdjacentTagValue', tag: 'minerai', factor: 2 },
      },
    ],
  },
  {
    id: 'charbon',
    name: 'Charbon',
    sprite: 'charbon',
    rarity: 'common',
    baseValue: 1,
    tags: ['minerai'],
    effects: [],
  },
  {
    id: 'fer',
    name: 'Fer',
    sprite: 'fer',
    rarity: 'uncommon',
    baseValue: 4,
    tags: ['minerai'],
    effects: [],
  },
  {
    id: 'or',
    name: 'Or',
    sprite: 'or',
    rarity: 'rare',
    baseValue: 8,
    tags: ['minerai'],
    effects: [],
  },
];

export const SYMBOL_MAP = new Map<string, GameSymbol>(
  SYMBOLS.map(s => [s.id, s]),
);
