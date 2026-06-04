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

export const STAT_MAX_VALUES: Record<StatName, number> = {
  hp: 255,
  attack: 190,
  defense: 230,
  'special-attack': 194,
  'special-defense': 230,
  speed: 200,
};

export const STAT_COLORS: Record<StatName, string> = {
  hp: 'rose',
  attack: 'orange',
  defense: 'amber',
  'special-attack': 'blue',
  'special-defense': 'emerald',
  speed: 'violet',
};
