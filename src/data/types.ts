export type Rarity = 'common' | 'uncommon' | 'rare';

// WHEN an effect fires
export type Trigger =
  | { kind: 'onResolve' }
  | { kind: 'onAdjacentTag'; tag: string }  // ≥1 voisin non-détruit avec ce tag
  | { kind: 'everyNRounds'; n: number };    // round % n === 0, manche 1-indexée

// WHAT the effect does
export type Action =
  | { kind: 'addCoins'; amount: number }
  | { kind: 'addCoinsPerAdjacentTag'; tag: string; amount: number }
  | { kind: 'multiplyOwnValue'; factor: number }
  | { kind: 'multiplyAdjacentTagValue'; tag: string; factor: number }
  | { kind: 'produceSymbol'; symbolId: string }
  | { kind: 'destroyAdjacentTag'; tag: string };

export interface Effect {
  trigger: Trigger;
  action: Action;
}

export interface SpriteRef {
  key: string;       // clé Phaser enregistrée dans preload
  frame?: number;    // index de frame dans le spritesheet (absent = image statique)
  fw: number;        // largeur source de la frame en px
  fh: number;        // hauteur source de la frame en px
}

export interface GameSymbol {
  id: string;
  name: string;
  spriteRef: SpriteRef;
  rarity: Rarity;
  baseValue: number;
  tags: string[];
  effects: Effect[];
  buyable: boolean; // false = produit (oeuf, laine) — jamais proposé en boutique
}

// Grille 4×4 — null = case vide
export type GridState = (GameSymbol | null)[][];

export type ResolutionEvent =
  | { type: 'gain'; row: number; col: number; amount: number; sourceId: string }
  | { type: 'destroy'; row: number; col: number; symbolId: string }
  | { type: 'produce'; symbolId: string };

export interface ResolutionContext {
  round: number; // 1-indexé
}

export interface ResolutionResult {
  totalCoins: number;
  events: ResolutionEvent[];      // destroy < gain < produce
  producedSymbolIds: string[];    // géré par la couche manche, pas par le moteur
}
