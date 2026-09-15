import type { Winner } from '../lib/constants'
import { getSymbol } from '../lib/storage'

interface WinnersPanelProps {
  winners: Winner[]
}

export function WinnersPanel({ winners }: WinnersPanelProps) {
  return (
    <aside className="w-full rounded-2xl border border-[rgba(212,160,23,0.28)] bg-[rgba(20,8,12,0.75)] p-3.5 backdrop-blur-md sm:p-4">
      <div className="mb-3 border-b border-[rgba(212,160,23,0.2)] pb-2">
        <h2 className="font-display text-lg tracking-[0.18em] text-[rgba(240,201,77,0.9)] sm:text-xl">
          LATEST WINNERS
        </h2>
      </div>
      <ul className="space-y-3">
        {winners.slice(0, 6).map((winner) => {
          const prize = getSymbol(winner.prizeId)
          return (
            <li
              key={winner.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3"
            >
              <p className="text-[0.7rem] leading-snug text-white/45 sm:text-xs">
                Our latest customer
              </p>
              <p className="text-[0.7rem] leading-snug text-white/45 sm:text-xs">just won</p>
              <p
                className="font-display mt-1 text-xl leading-none tracking-[0.04em] sm:text-2xl"
                style={{
                  color: prize.color,
                  textShadow: `0 0 16px ${prize.glow}`,
                }}
              >
                {winner.prizeLabel}
              </p>
              <p className="mt-1 text-[0.7rem] leading-snug text-white/45 sm:text-xs">
                from Digitech
              </p>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
