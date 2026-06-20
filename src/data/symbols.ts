import type { GameSymbol } from './types';

export const SYMBOLS: readonly GameSymbol[] = [
  // ── Cultures ─────────────────────────────────────────────────────────────
  {
    id: 'patate', name: 'Potato',
    spriteRef: { key: 'icons', frame: 17, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['culture'], effects: [], buyable: true,
  },
  {
    id: 'carotte', name: 'Carrot',
    spriteRef: { key: 'icons', frame: 16, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['culture'], effects: [], buyable: true,
  },
  {
    id: 'panais', name: 'Parsnip',
    spriteRef: { key: 'icons', frame: 18, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['culture'], effects: [], buyable: true,
  },
  {
    id: 'citrouille', name: 'Pumpkin',
    spriteRef: { key: 'icons', frame: 19, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 4, tags: ['culture'], effects: [], buyable: true,
  },

  // ── Animaux ──────────────────────────────────────────────────────────────
  {
    id: 'vache', name: 'Cow',
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
    id: 'poule', name: 'Hen',
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
    id: 'mouton', name: 'Sheep',
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
    id: 'rat', name: 'Rat',
    spriteRef: { key: 'rat', frame: 0, fw: 32, fh: 32 },
    rarity: 'uncommon', baseValue: 4, tags: ['animal'], buyable: true,
    effects: [
      {
        trigger: { kind: 'onResolve' },
        action: { kind: 'destroyAdjacentTag', tag: 'proie' },
      },
    ],
  },

  // ── Produits (non-buyable) ────────────────────────────────────────────────
  {
    id: 'oeuf', name: 'Egg',
    spriteRef: { key: 'eggs', frame: 0, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['proie'], effects: [], buyable: false,
  },
  {
    id: 'laine', name: 'Wool',
    spriteRef: { key: 'placeholder', frame: 0, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 3, tags: [], effects: [], buyable: false,
  },
  {
    id: 'lait', name: 'Milk',
    spriteRef: { key: 'icons', frame: 9, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 3, tags: [], effects: [], buyable: false,
  },

  // ── Minerais ─────────────────────────────────────────────────────────────
  {
    id: 'charbon', name: 'Coal',
    spriteRef: { key: 'icons', frame: 33, fw: 16, fh: 16 },
    rarity: 'common', baseValue: 1, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'cuivre', name: 'Copper',
    spriteRef: { key: 'icons', frame: 36, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 3, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'fer', name: 'Iron',
    spriteRef: { key: 'icons', frame: 37, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 4, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'or', name: 'Gold',
    spriteRef: { key: 'icons', frame: 38, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 8, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'emeraude', name: 'Emerald',
    spriteRef: { key: 'icons', frame: 30, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 6, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'rubis', name: 'Ruby',
    spriteRef: { key: 'icons', frame: 43, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 12, tags: ['minerai'], effects: [], buyable: true,
  },
  {
    id: 'diamant', name: 'Diamond',
    spriteRef: { key: 'icons', frame: 41, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 15, tags: ['minerai'], effects: [], buyable: true,
  },

  // ── Outils ───────────────────────────────────────────────────────────────
  {
    id: 'pioche', name: 'Pickaxe',
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
    id: 'arrosoir', name: 'Watering Can',
    spriteRef: { key: 'icons', frame: 8, fw: 16, fh: 16 },
    rarity: 'uncommon', baseValue: 1, tags: ['outil'], buyable: true,
    effects: [
      {
        trigger: { kind: 'onAdjacentTag', tag: 'culture' },
        action: { kind: 'multiplyAdjacentTagValue', tag: 'culture', factor: 2 },
      },
    ],
  },

  // ── Trésors ──────────────────────────────────────────────────────────────
  {
    id: 'couronne', name: 'Crown',
    spriteRef: { key: 'icons', frame: 27, fw: 16, fh: 16 },
    rarity: 'rare', baseValue: 10, tags: ['tresor'], effects: [], buyable: true,
  },
];

export const SYMBOL_MAP = new Map<string, GameSymbol>(
  SYMBOLS.map(s => [s.id, s]),
);
