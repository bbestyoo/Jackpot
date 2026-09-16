import { useMemo } from 'react'

const COLORS = [
  '#d4a017',
  '#9e1a28',
  '#f0c94d',
  '#f5e6b8',
  '#c4283a',
  '#e8a317',
  '#fff4c4',
  '#ff6b3d',
  '#ffd76a',
  '#8b1e2d',
]

interface ConfettiBurstProps {
  active: boolean
}

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 160 }, (_, i) => {
        const isRibbon = i % 5 === 0
        return {
          id: i,
          left: `${(i * 11 + (i % 7) * 3) % 100}%`,
          delay: `${(i % 20) * 0.04}s`,
          duration: `${2.4 + (i % 9) * 0.22}s`,
          color: COLORS[i % COLORS.length],
          drift: `${((i % 13) - 6) * 42}px`,
          width: isRibbon ? 4 + (i % 3) : 8 + (i % 7),
          height: isRibbon ? 18 + (i % 10) : 10 + (i % 8),
          rotate: i * 17,
          opacity: 0.75 + (i % 4) * 0.06,
        }
      }),
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
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ['--drift' as string]: p.drift,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      {/* Second wave from mid-screen for denser jackpot burst */}
      {pieces.slice(0, 70).map((p) => (
        <span
          key={`wave2-${p.id}`}
          className="confetti-piece confetti-piece--burst"
          style={{
            left: `${20 + (p.id * 9) % 60}%`,
            top: '35%',
            background: p.color,
            width: p.width + 2,
            height: p.height + 2,
            animationDelay: `${0.15 + (p.id % 12) * 0.03}s`,
            animationDuration: `${2.1 + (p.id % 6) * 0.2}s`,
            ['--drift' as string]: `${((p.id % 11) - 5) * 55}px`,
            transform: `rotate(${p.rotate + 40}deg)`,
          }}
        />
      ))}
    </div>
  )
}
