export interface PokemonStat {
  name: string;
  value: number;
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  image: string;
  stats: PokemonStat[];
  moves: string[];
  height: number;
  weight: number;
  abilities: string[];
}

// ... existing interfaces ...

export interface EvolutionStage {
  id: number;
  name: string;
  image: string;
  isCurrent?: boolean;
}