export type StatName =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed';

export interface PokemonData {
  id: number;
  name: string;
  sprite: string;
  stats: Record<StatName, number>;
}

export interface SlotState {
  statName: StatName;
  pokemonName: string;
  pokemonSprite: string;
  value: number;
  filled: boolean;
  pokemonId: number;
  pokemonStats: Record<StatName, number> | null;
}

export const STAT_LABELS: Record<StatName, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
};

export const STAT_NAMES: StatName[] = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
];
