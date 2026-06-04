import { useEffect, useRef, useState } from 'react';
import { STAT_LABELS, STAT_NAMES, STAT_MAX_VALUES } from '../types';
import type { SlotState, StatName } from '../types';

interface Props {
  slots: SlotState[];
  total: number;
  highScore: number;
  isNewRecord: boolean;
  onPlayAgain: () => void;
}

interface AssignedSlot {
  statName: StatName;
  pokemonName: string;
  pokemonSprite: string;
  value: number;
  pokemonId: number;
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getOptimalAssignment(slots: SlotState[]): { slots: AssignedSlot[]; total: number } {
  const pokemons = slots
    .map((s) => ({
      id: s.pokemonId,
      name: s.pokemonName,
      sprite: s.pokemonSprite,
      stats: s.pokemonStats,
    }))
    .filter((p) => p.stats !== null) as {
    id: number;
    name: string;
    sprite: string;
    stats: Record<StatName, number>;
  }[];

  if (pokemons.length < 6) {
    return { slots: [], total: 0 };
  }

  const permutations: number[][] = [];
  const indices = [0, 1, 2, 3, 4, 5];

  function permute(arr: number[], m: number[] = []) {
    if (arr.length === 0) {
      permutations.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr, m.concat(next));
      }
    }
  }
  permute(indices);

  let maxScore = -1;
  let bestPerm: number[] = [];

  for (const p of permutations) {
    let score = 0;
    for (let i = 0; i < 6; i++) {
      const statName = STAT_NAMES[i];
      const pokeIdx = p[i];
      score += pokemons[pokeIdx].stats[statName];
    }
    if (score > maxScore) {
      maxScore = score;
      bestPerm = p;
    }
  }

  const assignedSlots: AssignedSlot[] = STAT_NAMES.map((statName, i) => {
    const pokeIdx = bestPerm[i];
    const pokemon = pokemons[pokeIdx];
    return {
      statName,
      pokemonName: pokemon.name,
      pokemonSprite: pokemon.sprite,
      value: pokemon.stats[statName],
      pokemonId: pokemon.id,
    };
  });

  return { slots: assignedSlots, total: maxScore };
}

export default function GameOver({
  slots,
  total,
  highScore,
  isNewRecord,
  onPlayAgain,
}: Props) {
  const { slots: bestSlots, total: maxPossible } = getOptimalAssignment(slots);
  const achievedMax = total === maxPossible;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showBars, setShowBars] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShowBars(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!achievedMax || !canvasRef.current) return;

    let animId: number;
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; life: number; maxLife: number;
    }[] = [];
    const colors = ['#06b6d4', '#a855f7', '#facc15', '#ef4444', '#22c55e', '#f97316'];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function burst(x: number, y: number) {
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          size: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0,
          maxLife: 60 + Math.random() * 40,
        });
      }
    }

    burst(canvas.width * 0.3, canvas.height * 0.3);
    burst(canvas.width * 0.7, canvas.height * 0.4);
    burst(canvas.width * 0.5, canvas.height * 0.2);

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alive = particles.filter((p) => p.life < p.maxLife);
      for (const p of alive) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life++;
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6);
      }
      ctx.globalAlpha = 1;
      if (alive.length > 0) animId = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animId);
  }, [achievedMax]);

  return (
    <>
      {achievedMax && (
        <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-300">

          {/* Header */}
          <div className="p-6 text-center border-b border-slate-700">
            <h2 className="text-3xl font-bold text-slate-100">Game Over!</h2>
            {isNewRecord && (
              <p className="mt-2 text-lg font-bold text-yellow-400 animate-pulse">New High Score!</p>
            )}
            {achievedMax && (
              <p className="mt-2 text-lg font-bold text-cyan-400 animate-bounce">Perfect Draft!</p>
            )}
            <div className="mt-4 flex items-center justify-center gap-8">
              <div>
                <span className="text-4xl font-bold text-cyan-400">{total.toLocaleString()}</span>
                <p className="text-slate-400 text-xs mt-1">Your Score</p>
              </div>
              <div className="text-2xl text-slate-600">/</div>
              <div>
                <span className="text-4xl font-bold text-purple-400">{maxPossible.toLocaleString()}</span>
                <p className="text-slate-400 text-xs mt-1">Best Possible</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Record: <span className="text-yellow-400 font-semibold">{highScore.toLocaleString()}</span>
            </p>
          </div>

          {/* Two columns */}
          <div className="p-6 grid grid-cols-2 gap-4">

            {/* LEFT — User Choices */}
            <div>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3 text-center">
                User Choices
              </h3>
              <div className="space-y-2">
                {slots.map((slot, i) => {
                  const best = bestSlots[i];
                  const isOptimal = best && best.pokemonId === slot.pokemonId;
                  const maxVal = STAT_MAX_VALUES[slot.statName];
                  const pct = (slot.value / maxVal) * 100;
                  return (
                    <div
                      key={slot.statName}
                      className={`rounded-xl border p-2.5 transition-all duration-300 ${
                        isOptimal
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'bg-slate-900/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={slot.pokemonSprite}
                          alt={slot.pokemonName}
                          className="w-8 h-8 object-contain shrink-0 rounded-full bg-slate-700/50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{capitalize(slot.pokemonName)}</p>
                          <p className="text-[10px] text-slate-500">{STAT_LABELS[slot.statName]}</p>
                        </div>
                        <span className="text-base font-bold text-cyan-400 tabular-nums">{slot.value}</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: showBars ? `${Math.max(pct, 4)}%` : '0%', backgroundColor: '#06b6d4', transitionDelay: `${i * 80}ms` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-600 mt-0.5 tabular-nums">{Math.round(pct)}% of max</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — Best Choices */}
            <div>
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3 text-center">
                Best Choices
              </h3>
              <div className="space-y-2">
                {bestSlots.map((best, i) => {
                  const slot = slots[i];
                  const isOptimal = best && best.pokemonId === slot.pokemonId;
                  const maxVal = STAT_MAX_VALUES[best.statName];
                  const pct = (best.value / maxVal) * 100;
                  return (
                    <div
                      key={best.statName}
                      className={`rounded-xl border p-2.5 transition-all duration-300 ${
                        isOptimal
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'bg-slate-900/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={best.pokemonSprite}
                          alt={best.pokemonName}
                          className="w-8 h-8 object-contain shrink-0 rounded-full bg-slate-700/50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{capitalize(best.pokemonName)}</p>
                          <p className="text-[10px] text-slate-500">{STAT_LABELS[best.statName]}</p>
                        </div>
                        <span className="text-base font-bold text-purple-400 tabular-nums">{best.value}</span>
                      </div>
                      <div className="mt-1.5 h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: showBars ? `${Math.max(pct, 4)}%` : '0%', backgroundColor: '#a855f7', transitionDelay: `${i * 80}ms` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-600 mt-0.5 tabular-nums">{Math.round(pct)}% of max</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Final Score */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between bg-slate-900/80 rounded-xl p-4 border border-slate-600">
              <span className="text-slate-300 font-semibold">Final Score</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">
                  Max: <span className="text-purple-400 font-semibold">{maxPossible.toLocaleString()}</span>
                </span>
                <span className="text-2xl font-bold text-cyan-400 tabular-nums">{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0">
            <button
              onClick={onPlayAgain}
              className="w-full py-3 text-lg font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98]"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
