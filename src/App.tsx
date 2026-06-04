import { useState, useEffect, useRef } from 'react';
import { STAT_NAMES } from './types';
import type { PokemonData, SlotState, StatName } from './types';
import PokemonCard from './components/PokemonCard';
import StatsPanel from './components/StatsPanel';
import GameOver from './components/GameOver';

const LS_KEY = 'pokedraft-highscore';
const SPIN_COUNT = 12;
const SPIN_MS = 60;
const FLY_MS = 500;

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
  const [flyAnim, setFlyAnim] = useState<{
    sprite: string;
    from: { left: number; top: number; width: number; height: number };
    to: { left: number; top: number; width: number; height: number };
  } | null>(null);

  const maxIdRef = useRef(1025);
  const spinRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const genRef = useRef(0);
  const flyRef = useRef<HTMLImageElement>(null);
  const pendingRef = useRef<{ statName: StatName; pokemon: PokemonData } | null>(null);
  const flyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  // Apply fly animation when flyAnim changes
  useEffect(() => {
    if (!flyAnim || !flyRef.current) return;

    const el = flyRef.current;

    // Set initial position at source (no transition)
    el.style.transition = 'none';
    el.style.left = `${flyAnim.from.left}px`;
    el.style.top = `${flyAnim.from.top}px`;
    el.style.width = `${flyAnim.from.width}px`;
    el.style.height = `${flyAnim.from.height}px`;
    el.style.opacity = '1';

    // Force layout
    el.getBoundingClientRect();

    // Trigger transition to target
    requestAnimationFrame(() => {
      el.style.transition = `all ${FLY_MS}ms cubic-bezier(0.25, 0.25, 0.2, 1)`;
      el.style.left = `${flyAnim.to.left}px`;
      el.style.top = `${flyAnim.to.top}px`;
      el.style.width = `${flyAnim.to.width}px`;
      el.style.height = `${flyAnim.to.height}px`;
      el.style.opacity = '0.85';
      el.style.borderRadius = '9999px';
    });

    const timer = setTimeout(() => {
      flyTimerRef.current = undefined;
      setFlyAnim(null);
      completePending();
    }, FLY_MS + 50);

    flyTimerRef.current = timer;
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyAnim]);

  function completePending() {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    const { statName, pokemon } = pending;

    const newSlots = slots.map((slot) => {
      if (slot.statName === statName && !slot.filled) {
        return {
          ...slot,
          pokemonName: pokemon.name,
          pokemonSprite: pokemon.sprite,
          value: pokemon.stats[statName],
          filled: true,
          pokemonId: pokemon.id,
          pokemonStats: pokemon.stats,
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

  async function loadNextPokemon() {
    const gen = ++genRef.current;
    clearInterval(spinRef.current);

    setLoading(true);
    setCurrentPokemon(null);
    setIsSpinning(true);

    const finalId = getRandomId();
    const finalPokemon = await fetchWithRetry(finalId);
    if (gen !== genRef.current) return;

    if (!finalPokemon) {
      setIsSpinning(false);
      setLoading(false);
      return;
    }

    const spinIds = Array.from({ length: SPIN_COUNT }, () => getRandomId());
    const spinners = (await Promise.all(
      spinIds.map((id) => fetchOne(id)),
    )).filter(Boolean) as PokemonData[];
    if (gen !== genRef.current) return;

    setLoading(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectSlot(statName: StatName) {
    if (!currentPokemon || loading || isSpinning || flyAnim) return;

    // Get source position from the big card image
    const cardImg = document.getElementById('poke-card-img');
    if (!cardImg) return;

    const from = cardImg.getBoundingClientRect();

    // Get target position from the slot
    const slotEl = document.getElementById(`slot-target-${statName}`);
    if (!slotEl) return;

    const to = slotEl.getBoundingClientRect();

    // Target is the sprite area within the slot
    const targetRect = {
      left: to.left + 4,
      top: to.top + 4,
      width: 28,
      height: 28,
    };

    // Store pending choice
    pendingRef.current = { statName, pokemon: currentPokemon };

    // Start fly animation (the big image stays visible during animation)
    setFlyAnim({
      sprite: currentPokemon.sprite,
      from: {
        left: from.left,
        top: from.top,
        width: from.width,
        height: from.height,
      },
      to: targetRect,
    });
  }

  function resetGame() {
    clearTimeout(flyTimerRef.current);
    clearInterval(spinRef.current);
    pendingRef.current = null;
    setFlyAnim(null);
    setSlots(createEmptySlots());
    setCurrentPokemon(null);
    setGameOver(false);
    setTotalScore(0);
    loadNextPokemon();
  }

  const blockActions = loading || isSpinning || gameOver || !!flyAnim;

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

      {/* Flying image overlay */}
      {flyAnim && (
        <img
          ref={flyRef}
          src={flyAnim.sprite}
          alt=""
          className="fixed z-[100] pointer-events-none object-contain"
          style={{
            left: flyAnim.from.left,
            top: flyAnim.from.top,
            width: flyAnim.from.width,
            height: flyAnim.from.height,
            borderRadius: '12px',
          }}
        />
      )}
    </div>
  );
}
