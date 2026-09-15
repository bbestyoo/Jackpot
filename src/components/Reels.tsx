import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import {
  REEL_CELL,
  REEL_WINDOW,
  type ReelStrip,
  type SymbolId,
} from '../lib/constants'
import { getSymbol } from '../lib/storage'

interface ReelsProps {
  strips: ReelStrip[]
  spinning: boolean
  spinKey: number
  onReelStop?: (index: number) => void
}

function SymbolFace({ id }: { id: SymbolId }) {
  const symbol = getSymbol(id)
  const isLose = Boolean(symbol.isLose)

  return (
    <div className="flex h-full w-full items-center justify-center px-1 py-1.5 sm:px-1.5 sm:py-2">
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-xl border px-1.5 py-2 text-center sm:rounded-2xl sm:px-2.5 sm:py-3 ${
          isLose ? 'border-red-400/20 bg-red-950/35' : 'border-white/10 bg-black/30'
        }`}
        style={{
          boxShadow: isLose
            ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
            : `0 0 28px ${symbol.glow}, inset 0 1px 0 rgba(255,248,235,0.1)`,
          backgroundImage: isLose
            ? undefined
            : `linear-gradient(180deg, rgba(255,248,235,0.07), transparent 55%)`,
        }}
      >
        <p
          className="prize-name text-[clamp(1.85rem,3.6vw,3.75rem)]"
          style={{
            color: symbol.color,
            textShadow: `
              0 0 18px ${symbol.glow},
              0 0 36px ${symbol.glow},
              0 3px 0 rgba(0,0,0,0.55),
              0 1px 0 rgba(255,255,255,0.12)
            `,
          }}
        >
          {symbol.label}
        </p>
      </div>
    </div>
  )
}

function centerY(landIndex: number) {
  return -(landIndex * REEL_CELL) + (REEL_WINDOW - REEL_CELL) / 2
}

export function Reels({ strips, spinning, spinKey, onReelStop }: ReelsProps) {
  const reelRefs = useRef<(HTMLDivElement | null)[]>([])
  const onReelStopRef = useRef(onReelStop)
  const stripsRef = useRef(strips)

  useLayoutEffect(() => {
    onReelStopRef.current = onReelStop
    stripsRef.current = strips
  }, [onReelStop, strips])

  useLayoutEffect(() => {
    if (spinning) return
    strips.forEach((data, index) => {
      const el = reelRefs.current[index]
      if (!el) return
      gsap.killTweensOf(el)
      gsap.set(el, { y: centerY(data.landIndex) })
    })
  }, [spinning, strips, spinKey])

  useLayoutEffect(() => {
    if (!spinning) return

    const timelines: gsap.core.Timeline[] = []
    const active = stripsRef.current

    active.forEach((data, index) => {
      const el = reelRefs.current[index]
      if (!el) return

      gsap.killTweensOf(el)
      const finalY = centerY(data.landIndex)
      gsap.set(el, { y: (REEL_WINDOW - REEL_CELL) / 2 })

      // Slow, staggered spin with long suspenseful deceleration
      const tl = gsap.timeline({
        delay: index * 0.55,
        onComplete: () => onReelStopRef.current?.(index),
      })

      tl.to(el, {
        y: finalY - REEL_CELL * 8,
        duration: 3.4 + index * 0.85,
        ease: 'none',
      }).to(el, {
        y: finalY,
        duration: 1.9 + index * 0.35,
        ease: 'power3.out',
      })

      timelines.push(tl)
    })

    return () => {
      timelines.forEach((t) => t.kill())
    }
  }, [spinning, spinKey])

  return (
    <div className="relative mx-auto grid h-full w-full grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {strips.map((data, reelIndex) => (
        <div
          key={reelIndex}
          className="reel-window relative min-h-0 overflow-hidden rounded-xl sm:rounded-2xl"
          style={{ height: REEL_WINDOW }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/85 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-black/85 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-[calc(50%-115px)] left-0 right-0 z-[5] border-y-2 border-[rgba(212,160,23,0.4)]"
            aria-hidden
          />
          <div
            ref={(node) => {
              reelRefs.current[reelIndex] = node
            }}
            className="reel-strip absolute inset-x-0 top-0"
          >
            {data.strip.map((symbolId, i) => (
              <div
                key={`${spinKey}-${reelIndex}-${i}`}
                className="flex w-full items-center justify-center"
                style={{ height: REEL_CELL }}
              >1
                <SymbolFace id={symbolId} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
