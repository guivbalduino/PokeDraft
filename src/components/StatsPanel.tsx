import { STAT_LABELS } from '../types';
import type { SlotState, StatName } from '../types';

interface Props {
  slots: SlotState[];
  onSelect: (stat: StatName) => void;
  disabled: boolean;
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function StatsPanel({ slots, onSelect, disabled }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-400 text-center">
        Your Team Stats
      </h3>
      <div className="grid gap-3">
        {slots.map((slot) => (
          <div
            key={slot.statName}
            className={`rounded-xl border p-4 flex items-center gap-4 transition-all duration-300 ${
              slot.filled
                ? 'bg-slate-800/80 border-slate-600'
                : 'bg-slate-800/50 border-slate-700/50'
            }`}
          >
            <span className="w-28 text-sm font-semibold text-slate-300 shrink-0">
              {STAT_LABELS[slot.statName]}
            </span>

            <div className="flex-1 flex items-center gap-3 min-w-0">
              {slot.filled ? (
                <>
                  <img
                    src={slot.pokemonSprite}
                    alt={slot.pokemonName}
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <span className="text-sm text-slate-400 truncate">
                    {capitalize(slot.pokemonName)}
                  </span>
                  <span className="ml-auto text-xl font-bold text-cyan-400 tabular-nums">
                    {slot.value}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-slate-600 tabular-nums">
                  ???
                </span>
              )}
            </div>

            {!slot.filled && (
              <button
                onClick={() => onSelect(slot.statName)}
                disabled={disabled}
                className="shrink-0 px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95"
              >
                Choose
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-slate-500 pt-2">
        <span className="font-semibold text-slate-400">
          {slots.filter((s) => s.filled).length}
        </span>
        {' '}of 6 slots filled
      </div>
    </div>
  );
}
