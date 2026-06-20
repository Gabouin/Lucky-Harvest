export const STARTING_COINS = 0;

export const STARTING_RESERVE: string[] = [
  'ble', 'ble', 'ble', 'ble',
  'vache', 'poule',
];

export const SPINS_PER_ROUND = 1;

// Quota à atteindre par manche (croissant). Dépasser l'index = plateau sur la dernière valeur.
export const QUOTAS: number[] = [5, 8, 12, 17, 23, 30, 38, 47, 57, 68];

export const GRID_SIZE = 4;

// ── Boutique ────────────────────────────────────────────────────────────────
export const SHOP_OFFER_SIZE = 3;
export const BUYS_PER_SHOP = 1;
export const REMOVALS_PER_SHOP = 1;
export const MIN_RESERVE = 4; // on ne peut pas retirer en dessous de ce seuil

// Poids de tirage par rareté (non-buyable jamais dans le pool)
export const RARITY_WEIGHTS: Record<string, number> = {
  common:   100,
  uncommon:  30,
  rare:       8,
};

// Coût d'achat par rareté
export const COSTS: Record<string, number> = {
  common:    3,
  uncommon:  6,
  rare:      12,
};

// ── Progression ─────────────────────────────────────────────────────────────
export const FINAL_ROUND = 12; // réussir cette manche = victoire
