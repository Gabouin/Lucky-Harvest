// Squelettes de types — logique ajoutée en session 2

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface GameSymbol {
  id: string;
  name: string;
  /** Index de frame dans le spritesheet */
  sprite: number;
  rarity: Rarity;
  baseValue: number;
  tags: string[];
  effects: Effect[];
}

export interface Effect {
  type: string;
  value?: number;
  /** Cible : 'adjacent' | 'row' | 'col' | 'all' | id de symbole */
  target?: string;
  condition?: string;
}

export interface GridState {
  /** cells[row][col] — null = case vide */
  cells: (GameSymbol | null)[][];
  width: number;
  height: number;
}
