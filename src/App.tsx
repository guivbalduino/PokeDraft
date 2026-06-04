import { useState, useEffect, useRef } from 'react';
import { STAT_NAMES } from './types';
import type { PokemonData, SlotState, StatName } from './types';
import PokemonCard from './components/PokemonCard';
import StatsPanel from './components/StatsPanel';
import GameOver from './components/GameOver';

const LS_KEY = 'pokedraft-highscore';
const SPIN_COUNT = 12;
const SPIN_MS = 60;

function createEmptySlots(): SlotState[] {
  return STAT_NAMES.map((name) => ({
    statName: name,
    pokemonName: '',
    pokemonSprite: '',
    value: 0,
    filled: false,
    pokemonId: 0,
    pokemonStats: null,
  }));
}

async function fetchOne(id: number): Promise<PokemonData | null> {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const stats: Record<string, number> = {};
    for (const s of data.stats) {
      stats[s.stat.name] = s.base_stat;
    }
    return {
      id: data.id,
      name: data.name,
      sprite: data.sprites.other['official-artwork'].front_default,
      stats: stats as PokemonData['stats'],
    };
  } catch {
    return null;
  }
}

async function fetchWithRetry(id: number, retries = 3): Promise<PokemonData | null> {
  for (let i = 0; i < retries; i++) {
    const result = await fetchOne(id);
    if (result) return result;
  }
  return null;
}

export default function App() {
  const [slots, setSlots] = useState<SlotState[]>(createEmptySlots);
  const [currentPokemon, setCurrentPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const maxIdRef = useRef(1025);
  const spinRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const genRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setHighScore(Number(saved));
  }, []);

  // Fetch max Pokémon count from API so we don't need manual updates
  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon-species/?limit=0')
      .then((res) => res.json())
      .then((data) => {
        if (data.count) maxIdRef.current = data.count;
      })
      .catch(() => {});
  }, []);

  function getRandomId(): number {
    return Math.floor(Math.random() * maxIdRef.current) + 1;
  }

  async function loadNextPokemon() {
    const gen = ++genRef.current;
    clearInterval(spinRef.current);

    setLoading(true);
    setCurrentPokemon(null);
    setIsSpinning(true);

    // 1. Fetch the final Pokémon
    const finalId = getRandomId();
    const finalPokemon = await fetchWithRetry(finalId);
    if (gen !== genRef.current) return;

    if (!finalPokemon) {
      setIsSpinning(false);
      setLoading(false);
      return;
    }

    // 2. Fetch a few spinners in parallel
    const spinIds = Array.from({ length: SPIN_COUNT }, () => getRandomId());
    const spinners = (await Promise.all(
      spinIds.map((id) => fetchOne(id)),
    )).filter(Boolean) as PokemonData[];
    if (gen !== genRef.current) return;

    setLoading(false);

    // 3. Cycle through spinners, then settle on final
    let idx = 0;
    spinRef.current = setInterval(() => {
      if (idx < spinners.length) {
        setCurrentPokemon(spinners[idx]);
        idx++;
      } else {
        clearInterval(spinRef.current);
        setCurrentPokemon(finalPokemon);
        setIsSpinning(false);
      }
    }, SPIN_MS);
  }

  useEffect(() => {
    loadNextPokemon();
  }, []);

  function handleSelectSlot(statName: StatName) {
    if (!currentPokemon || loading || isSpinning) return;

    const newSlots = slots.map((slot) => {
      if (slot.statName === statName && !slot.filled) {
        return {
          ...slot,
          pokemonName: currentPokemon.name,
          pokemonSprite: currentPokemon.sprite,
          value: currentPokemon.stats[statName],
          filled: true,
          pokemonId: currentPokemon.id,
          pokemonStats: currentPokemon.stats,
        };
      }
      return slot;
    });

    setSlots(newSlots);

    const filledCount = newSlots.filter((s) => s.filled).length;
    if (filledCount === 6) {
      const total = newSlots.reduce((sum, s) => sum + s.value, 0);
      setTotalScore(total);
      if (total > highScore) {
        localStorage.setItem(LS_KEY, String(total));
        setHighScore(total);
      }
      setGameOver(true);
    } else {
      loadNextPokemon();
    }
  }

  function resetGame() {
    setSlots(createEmptySlots());
    setCurrentPokemon(null);
    setGameOver(false);
    setTotalScore(0);
    loadNextPokemon();
  }

  const blockActions = loading || isSpinning || gameOver;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="text-center pt-8 pb-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          PokeDraft: Max Stats
        </h1>
      </header>

      <main className="flex-1 w-full mx-auto px-4 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start md:max-w-5xl lg:max-w-7xl xl:max-w-[90rem] 2xl:mx-auto">
        <PokemonCard pokemon={currentPokemon} loading={loading} isSpinning={isSpinning} />
        <StatsPanel slots={slots} onSelect={handleSelectSlot} disabled={blockActions} />
      </main>

      <footer className="text-center pb-10 pt-2">
        <p className="text-xl text-slate-500">
          High Score:{' '}
          <span className="text-3xl font-bold text-yellow-400">{highScore.toLocaleString()}</span>
        </p>
      </footer>

      {gameOver && (
        <GameOver
          slots={slots}
          total={totalScore}
          highScore={highScore}
          isNewRecord={totalScore >= highScore && totalScore > 0}
          onPlayAgain={resetGame}
        />
      )}
    </div>
  );
}
