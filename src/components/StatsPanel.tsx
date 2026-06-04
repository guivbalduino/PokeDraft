import { STAT_LABELS, STAT_MAX_VALUES, STAT_COLORS } from '../types';
import type { SlotState, StatName } from '../types';

interface Props {
  slots: SlotState[];
  onSelect: (stat: StatName) => void;
  disabled: boolean;
}

const HEX_COLORS: Record<string, string> = {
  rose: '#f43f5e',
  orange: '#f97316',
  amber: '#d97706',
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
};

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function StatsPanel({ slots, onSelect, disabled }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-400 text-center">
        Your Team Stats
      </h3>
      <div className="grid gap-2.5">
        {slots.map((slot) => {
          const color = STAT_COLORS[slot.statName];
          const hex = HEX_COLORS[color];
          const maxVal = STAT_MAX_VALUES[slot.statName];
          const pct = slot.filled ? (slot.value / maxVal) * 100 : 0;
          const dimmedHex = hex + '80';

          return (
            <div
              key={slot.statName}
              className={`rounded-xl border p-3.5 flex items-center gap-3 transition-all duration-300 ${
                slot.filled
                  ? 'bg-slate-800/80 border-slate-600'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              {/* Stat label */}
              <span
                className="w-24 text-xs font-semibold shrink-0 uppercase tracking-wider"
                style={{ color: dimmedHex }}
              >
                {STAT_LABELS[slot.statName]}
              </span>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                {slot.filled ? (
                  <div className="flex items-center gap-2">
                    <img
                      src={slot.pokemonSprite}
                      alt={slot.pokemonName}
                      className="w-7 h-7 object-contain shrink-0 rounded-full bg-slate-700/50"
                    />
                    <span className="text-xs text-slate-500 truncate flex-1">
                      {capitalize(slot.pokemonName)}
                    </span>
                    <span className="text-lg font-bold tabular-nums leading-none">
                      {slot.value}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-slate-600/60 tabular-nums">
                      ???
                    </span>
                  </div>
                )}

                {/* Progress bar - always rendered for smooth grow animation */}
                <div className="mt-1.5 h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: slot.filled ? `${Math.max(pct, 4)}%` : '0%',
                      backgroundColor: slot.filled ? hex : 'transparent',
                    }}
                  />
                </div>

                {slot.filled && (
                  <p className="text-[10px] text-slate-600/80 mt-0.5 tabular-nums">
                    {Math.round(pct)}% of max
                  </p>
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
          );
        })}
      </div>

      <div className="text-center text-sm text-slate-500 pt-1">
        <span className="font-semibold text-slate-400">
          {slots.filter((s) => s.filled).length}
        </span>
        {' '}of 6 slots filled
      </div>
    </div>
  );
}
