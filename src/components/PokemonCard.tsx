import type { PokemonData } from '../types';

interface Props {
  pokemon: PokemonData | null;
  loading: boolean;
  isSpinning?: boolean;
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function PokemonCard({ pokemon, loading, isSpinning }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-400 text-center">
        Current Pokémon
      </h3>
      {loading || !pokemon ? (
        <div className="w-full h-full bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 border border-slate-700">
          <div className="w-full aspect-square bg-slate-700 rounded-xl animate-pulse-slow" />
          <div className="h-6 w-32 bg-slate-700 rounded animate-pulse-slow" />
        </div>
      ) : (
        <div
          className={`bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 border transition-all duration-300 ${
            isSpinning
              ? 'border-cyan-500/50 animate-pulse shadow-lg shadow-cyan-500/10'
              : 'border-slate-700'
          }`}
        >
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-purple-500/10 rounded-xl" />
            <img
              key={pokemon.id}
              src={pokemon.sprite}
              alt={pokemon.name}
              className="w-full aspect-square object-contain relative z-10 drop-shadow-lg transition-opacity duration-75"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            {capitalize(pokemon.name)}
          </h2>
          <p className="text-sm text-slate-500">
            #{String(pokemon.id).padStart(4, '0')}
          </p>
        </div>
      )}
    </div>
  );
}
