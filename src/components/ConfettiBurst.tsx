import { useMemo } from 'react'

const COLORS = ['#d4a017', '#9e1a28', '#f0c94d', '#f5e6b8', '#c4283a', '#e8a317']

interface ConfettiBurstProps {
  active: boolean
}

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        delay: `${(i % 12) * 0.05}s`,
        duration: `${2.2 + (i % 7) * 0.18}s`,
        color: COLORS[i % COLORS.length],
        drift: `${((i % 9) - 4) * 28}px`,
        width: 8 + (i % 5),
        height: 10 + (i % 6),
        rotate: i * 23,
      })),
    [],
  )

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            width: p.width,
            height: p.height,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ['--drift' as string]: p.drift,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
