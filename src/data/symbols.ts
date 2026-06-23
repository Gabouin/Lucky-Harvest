import type { GameSymbol } from './types';

export const SYMBOLS: readonly GameSymbol[] = [
  // ── Cultures ─────────────────────────────────────────────────────────────
  {
    id: 'patate', name: 'Potato', description: 'A basic crop.',
    spriteRef: { key: 'icons', frame: 17, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['culture'], effects: [], buyable: true,
  },
  {
    id: 'carotte', name: 'Carrot', description: 'A basic crop.',
    spriteRef: { key: 'icons', frame: 16, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['culture'], effects: [], buyable: true,
  },
  {
    id: 'panais', name: 'Parsnip', description: 'A basic crop.',
    spriteRef: { key: 'icons', frame: 18, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['culture'], effects: [], buyable: true,
  },
  {
    id: 'citrouille', name: 'Pumpkin', description: 'A hearty crop worth extra coins.',
    spriteRef: { key: 'icons', frame: 19, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 4, tags: ['culture'], effects: [], buyable: true,
  },

  // ── Animaux ──────────────────────────────────────────────────────────────
  {
    id: 'vache', name: 'Cow',
    description: 'Earns +2 per adjacent crop. Produces Milk every 3 rounds.',
    spriteRef: { key: 'cow', frame: 0, fw: 32, fh: 32 },
    rarity: 'common', baseValue: 3, tags: ['animal'], buyable: true,
    effects: [
      {
        trigger: { kind: 'onAdjacentTag', tag: 'culture' },
        action: { kind: 'addCoinsPerAdjacentTag', tag: 'culture', amount: 2 },
      },
      {
        trigger: { kind: 'everyNRounds', n: 3 },
        action: { kind: 'produceSymbol', symbolId: 'lait' },
      },
    ],
  },
  {
    id: 'poule', name: 'Chicken', description: 'Lays an Egg every 3 rounds.',
    spriteRef: { key: 'chicken', frame: 0, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 2, tags: ['animal', 'proie'], buyable: true,
    effects: [
      {
        trigger: { kind: 'everyNRounds', n: 3 },
        action: { kind: 'produceSymbol', symbolId: 'oeuf' },
      },
    ],
  },
  {
    id: 'mouton', name: 'Sheep', description: 'Produces Wool every 4 rounds.',
    spriteRef: { key: 'sheep', frame: 0, fw: 32, fh: 32 },
    rarity: 'common', baseValue: 2, tags: ['animal'], buyable: true,
    effects: [
      {
        trigger: { kind: 'everyNRounds', n: 4 },
        action: { kind: 'produceSymbol', symbolId: 'laine' },
      },
    ],
  },
  {
    id: 'rat', name: 'Rat', description: 'Eats an adjacent prey (Hen or Egg).',
    spriteRef: { key: 'rat', frame: 0, fw: 32, fh: 32 },
    rarity: 'uncommon', baseValue: 4, tags: ['animal'], buyable: true,
    effects: [
      {
        trigger: { kind: 'onResolve' },
        action: { kind: 'destroyAdjacentTag', tag: 'proie' },
      },
    ],
  },
  {
    id: 'canard', name: 'Duck', description: 'Lays an Egg every 3 rounds.',
    spriteRef: { key: 'duck', frame: 0, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 2, tags: ['animal'], buyable: true,
    effects: [
      { trigger: { kind: 'everyNRounds', n: 3 }, action: { kind: 'produceSymbol', symbolId: 'oeuf' } },
    ],
  },
  {
    id: 'oie', name: 'Goose', description: 'Drops a Feather every 4 rounds.',
    spriteRef: { key: 'goose', frame: 0, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 3, tags: ['animal'], buyable: true,
    effects: [
      { trigger: { kind: 'everyNRounds', n: 4 }, action: { kind: 'produceSymbol', symbolId: 'plume' } },
    ],
  },
  {
    id: 'poisson', name: 'Fish', description: 'A valuable aquatic creature.',
    spriteRef: { key: 'fish', frame: 0, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 3, tags: ['animal'], effects: [], buyable: true,
  },

  // ── Produits (non-buyable) ────────────────────────────────────────────────
  {
    id: 'oeuf', name: 'Egg', description: 'Laid by Hens and Ducks. Prey for Rats.',
    spriteRef: { key: 'eggs', frame: 0, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['proie'], effects: [], buyable: false,
  },
  {
    id: 'laine', name: 'Wool', description: 'Produced by Sheep every 4 rounds.',
    spriteRef: { key: 'placeholder', frame: 0, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 3, tags: [], effects: [], buyable: false,
  },
  {
    id: 'lait', name: 'Milk', description: 'Produced by Cows every 3 rounds.',
    spriteRef: { key: 'icons', frame: 9, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 3, tags: [], effects: [], buyable: false,
  },
  {
    id: 'plume', name: 'Feather', description: 'Dropped by Geese every 4 rounds.',
    spriteRef: { key: 'icons', frame: 44, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 2, tags: [], effects: [], buyable: false,
  },

  // ── Minerais ─────────────────────────────────────────────────────────────
  {
    id: 'charbon', name: 'Coal', description: 'A common ore.',
    spriteRef: { key: 'icons', frame: 33, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'cuivre', name: 'Copper', description: 'An ore of moderate value.',
    spriteRef: { key: 'icons', frame: 36, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 3, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'fer', name: 'Iron', description: 'A solid ore.',
    spriteRef: { key: 'icons', frame: 37, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 4, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'or', name: 'Gold', description: 'A precious ore.',
    spriteRef: { key: 'icons', frame: 38, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 8, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'emeraude', name: 'Emerald', description: 'A gem of significant value.',
    spriteRef: { key: 'icons', frame: 30, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 6, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'rubis', name: 'Ruby', description: 'A rare and valuable gem.',
    spriteRef: { key: 'icons', frame: 43, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 12, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'diamant', name: 'Diamond', description: 'The most valuable ore.',
    spriteRef: { key: 'icons', frame: 41, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 15, tags: ['minerai'], effects: [], buyable: true,
  },

  // ── Outils ───────────────────────────────────────────────────────────────
  {
    id: 'pioche', name: 'Pickaxe', description: 'Doubles the value of an adjacent ore.',
    spriteRef: { key: 'icons', frame: 5, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['humain'], buyable: true,
    effects: [
      {
        trigger: { kind: 'onAdjacentTag', tag: 'minerai' },
        action: { kind: 'multiplyAdjacentTagValue', tag: 'minerai', factor: 2 },
      },
    ],
  },
  {
    id: 'arrosoir', name: 'Watering Can', description: 'Doubles the value of an adjacent crop.',
    spriteRef: { key: 'icons', frame: 8, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 1, tags: ['outil'], buyable: true,
    effects: [
      {
        trigger: { kind: 'onAdjacentTag', tag: 'culture' },
        action: { kind: 'multiplyAdjacentTagValue', tag: 'culture', factor: 2 },
      },
    ],
  },

  // ── Monstres ─────────────────────────────────────────────────────────────
  {
    id: 'slime', name: 'Slime', description: 'Destroys one adjacent crop each spin.',
    spriteRef: { key: 'slime', frame: 0, fw: 32, fh: 32 },
    rarity: 'uncommon', baseValue: 6, tags: ['monstre'], buyable: true,
    effects: [
      { trigger: { kind: 'onResolve' }, action: { kind: 'destroyAdjacentTag', tag: 'culture' } },
    ],
  },
  {
    id: 'squelette', name: 'Skeleton', description: 'Destroys one adjacent animal each spin.',
    spriteRef: { key: 'skeleton', frame: 0, fw: 32, fh: 32 },
    rarity: 'rare', baseValue: 7, tags: ['monstre'], buyable: true,
    effects: [
      { trigger: { kind: 'onResolve' }, action: { kind: 'destroyAdjacentTag', tag: 'animal' } },
    ],
  },

  // ── Humains ──────────────────────────────────────────────────────────────
  {
    id: 'marchand', name: 'Merchant', description: 'Earns 2 extra coins each spin.',
    spriteRef: { key: 'char1', frame: 0, fw: 32, fh: 32 },
    rarity: 'uncommon', baseValue: 1, tags: ['humain'], buyable: true,
    effects: [
      { trigger: { kind: 'onResolve' }, action: { kind: 'addCoins', amount: 2 } },
    ],
  },
  {
    id: 'berger', name: 'Shepherd', description: 'Earns +3 coins per adjacent animal.',
    spriteRef: { key: 'char2', frame: 0, fw: 32, fh: 32 },
    rarity: 'uncommon', baseValue: 1, tags: ['humain'], buyable: true,
    effects: [
      {
        trigger: { kind: 'onAdjacentTag', tag: 'animal' },
        action: { kind: 'addCoinsPerAdjacentTag', tag: 'animal', amount: 3 },
      },
    ],
  },

  // ── Trésors ──────────────────────────────────────────────────────────────
  {
    id: 'couronne', name: 'Crown', description: 'A valuable treasure.',
    spriteRef: { key: 'icons', frame: 27, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 10, tags: ['tresor'], effects: [], buyable: true,
  },
];

export const SYMBOL_MAP = new Map<string, GameSymbol>(
  SYMBOLS.map(s => [s.id, s]),
);
