import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ConfettiBurst } from './components/ConfettiBurst'
import { PlayButton } from './components/PlayButton'
import { Reels } from './components/Reels'
import { WinnersPanel } from './components/WinnersPanel'
import {
  JACKPOT_GROWTH_PER_SPIN,
  SPIN_RESULT_MS,
  buildReelStrip,
  type ReelStrip,
  type SymbolId,
  type Winner,
} from './lib/constants'
import {
  playLoseTone,
  playPressSound,
  playReelStop,
  playSpinTick,
  playWinFanfare,
} from './lib/audio'
import {
  formatMoney,
  getSymbol,
  loadJackpot,
  loadWinners,
  makeWinner,
  rollSpin,
  saveJackpot,
  saveWinners,
} from './lib/storage'

type Phase = 'idle' | 'spinning' | 'result'

const INITIAL: SymbolId[] = ['smart_watch', 'cash_10000', 'wireless_headphone']

export default function App() {
  const [jackpot, setJackpot] = useState(() => loadJackpot())
  const [winners, setWinners] = useState<Winner[]>(() => loadWinners())
  const [phase, setPhase] = useState<Phase>('idle')
  const [strips, setStrips] = useState<ReelStrip[]>(() => INITIAL.map(buildReelStrip))
  const [spinKey, setSpinKey] = useState(0)
  const [isWin, setIsWin] = useState(false)
  const [winPrize, setWinPrize] = useState<SymbolId | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const amountRef = useRef<HTMLSpanElement>(null)
  const busyRef = useRef(false)
  const pendingWinRef = useRef(false)
  const pendingPrizeRef = useRef<SymbolId | null>(null)
  const pendingResultsRef = useRef<SymbolId[]>(INITIAL)
  const finishedSpinRef = useRef<number | null>(null)
  const tickTimer = useRef<number | null>(null)
  const resultTimer = useRef<number | null>(null)

  useEffect(() => {
    saveJackpot(jackpot)
  }, [jackpot])

  useEffect(() => {
    saveWinners(winners)
  }, [winners])

  useEffect(() => {
    if (phase !== 'idle') return
    const id = window.setInterval(() => {
      setJackpot((v) => v + 1)
    }, 1800)
    return () => clearInterval(id)
  }, [phase])

  const shakeAndFlash = useCallback(() => {
    const root = rootRef.current
    const flash = flashRef.current
    if (!root || !flash) return

    gsap.fromTo(
      flash,
      { opacity: 0.75 },
      { opacity: 0, duration: 0.4, ease: 'power2.out' },
    )

    gsap.fromTo(
      root,
      { x: 0, y: 0 },
      {
        duration: 0.45,
        keyframes: [
          { x: -8, y: 3 },
          { x: 7, y: -4 },
          { x: -5, y: 2 },
          { x: 4, y: -2 },
          { x: 0, y: 0 },
        ],
        ease: 'power1.out',
      },
    )
  }, [])

  const pressButtonAnim = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    gsap.fromTo(
      btn,
      { y: 0, scale: 1 },
      {
        y: 8,
        scale: 0.94,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      },
    )
  }, [])

  const finishRound = useCallback((key: number) => {
    if (finishedSpinRef.current === key) return
    finishedSpinRef.current = key

    const won = pendingWinRef.current
    const prizeId = pendingPrizeRef.current
    const spun = pendingResultsRef.current

    setIsWin(won)
    setWinPrize(prizeId)
    setShowResult(true)
    setPhase('result')

    if (won && prizeId) {
      setConfetti(true)
      playWinFanfare()
      setWinners((prev) => [makeWinner(prizeId, spun), ...prev].slice(0, 8))
      setJackpot((v) => Math.max(2500, Math.round(v * 0.35) + 400))

      if (amountRef.current) {
        gsap.fromTo(
          amountRef.current,
          { scale: 1.25 },
          { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' },
        )
      }
    } else {
      playLoseTone()
    }

    window.setTimeout(() => {
      setConfetti(false)
      setShowResult(false)
      setPhase('idle')
      busyRef.current = false
    }, won ? 3400 : 2200)
  }, [])

  const handleReelStop = useCallback((index: number) => {
    playReelStop()
    if (index === 2 && tickTimer.current) {
      window.clearInterval(tickTimer.current)
      tickTimer.current = null
    }
  }, [])

  const play = useCallback(() => {
    if (busyRef.current || phase === 'spinning') return
    busyRef.current = true

    playPressSound()
    pressButtonAnim()
    shakeAndFlash()

    const { results: next, isWin: won } = rollSpin()
    const nextStrips = next.map(buildReelStrip)
    const nextKey = spinKey + 1

    pendingWinRef.current = won
    pendingPrizeRef.current = won ? next[0] : null
    pendingResultsRef.current = next

    setStrips(nextStrips)
    setSpinKey(nextKey)
    setIsWin(false)
    setWinPrize(null)
    setShowResult(false)
    setConfetti(false)
    setPhase('spinning')
    setJackpot((v) => v + JACKPOT_GROWTH_PER_SPIN)

    if (tickTimer.current) window.clearInterval(tickTimer.current)
    tickTimer.current = window.setInterval(() => playSpinTick(), 140)

    if (resultTimer.current) window.clearTimeout(resultTimer.current)
    resultTimer.current = window.setTimeout(() => {
      if (tickTimer.current) {
        window.clearInterval(tickTimer.current)
        tickTimer.current = null
      }
      finishRound(nextKey)
    }, SPIN_RESULT_MS)
  }, [phase, spinKey, pressButtonAnim, shakeAndFlash, finishRound])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        play()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [play])

  useEffect(() => {
    return () => {
      if (tickTimer.current) window.clearInterval(tickTimer.current)
      if (resultTimer.current) window.clearTimeout(resultTimer.current)
    }
  }, [])

  const busy = phase === 'spinning' || phase === 'result'
  const wonPrize = winPrize ? getSymbol(winPrize) : null

  return (
    <div ref={rootRef} className="arcade-bg relative min-h-svh overflow-hidden">
      <div ref={flashRef} className="screen-flash" />
      <ConfettiBurst active={confetti} />

      <div className="relative z-10 flex min-h-svh w-full flex-col px-1 py-2 sm:px-2 sm:py-3 lg:px-2 lg:py-3">
        <header className="mb-2 shrink-0 text-center sm:mb-3">
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[rgba(240,201,77,0.75)] sm:text-xs">
            Digitech · Dashain 2082
          </p>
          <h1 className="font-display gold-text text-5xl leading-none sm:text-6xl md:text-7xl lg:text-8xl">
            DIGITECH DASHAIN OFFER
          </h1>
          {/* <p className="mt-1.5 text-sm text-white/50 sm:text-base">
            Celebrate the season — match three prizes and claim your reward
          </p> */}
        </header>

        <div className="grid min-h-0 flex-1 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid min-h-0 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_220px]">
            <main className="flex min-h-0 flex-col">
              <div className="marquee-shine machine-frame relative flex min-h-[72svh] flex-1 flex-col rounded-2xl p-2 sm:min-h-[76svh] sm:rounded-[24px] sm:p-4 md:p-5 lg:min-h-0">
                <div className="mb-2 shrink-0 text-center sm:mb-3">
                  {/* <p className="font-display text-sm tracking-[0.35em] text-[rgba(240,201,77,0.7)] sm:text-base">
                    CURRENT JACKPOT
                  </p> */}
                  <p className="jackpot-amount font-display gold-text mt-0.5 text-5xl sm:text-6xl md:text-7xl">
                    Rs.10000 Samma Jitne OFFER
                    {/* <span ref={amountRef}>{formatMoney(jackpot)}</span> */}
                  </p>
                </div>

                <div
                  className={`relative flex min-h-0 flex-1 items-center ${
                    phase === 'idle' ? 'idle-float' : ''
                  }`}
                >
                  <Reels
                    strips={strips}
                    spinning={phase === 'spinning'}
                    spinKey={spinKey}
                    onReelStop={handleReelStop}
                  />
                </div>

                {showResult && (
                  <div
                    className={`result-banner mt-2 shrink-0 rounded-xl border px-4 py-3 text-center sm:mt-3 sm:rounded-2xl sm:py-4 ${
                      isWin
                        ? 'border-[rgba(212,160,23,0.5)] bg-gradient-to-b from-[rgba(240,201,77,0.18)] to-[rgba(158,26,40,0.28)]'
                        : 'border-white/12 bg-black/40'
                    }`}
                    role="status"
                  >
                    {isWin && wonPrize ? (
                      <>
                        <p className="font-display text-4xl tracking-[0.12em] text-[rgba(240,201,77,0.95)] sm:text-5xl">
                          YOU WON!
                        </p>
                        <p
                          className="font-display mt-1 text-2xl tracking-[0.04em] sm:text-3xl"
                          style={{
                            color: wonPrize.color,
                            textShadow: `0 0 20px ${wonPrize.glow}`,
                          }}
                        >
                          {wonPrize.label}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-4xl tracking-[0.12em] text-white/85 sm:text-5xl">
                          TRY AGAIN
                        </p>
                        <p className="mt-1 text-sm text-white/50 sm:text-base">
                          So close — press play for another shot
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </main>

            <aside className="flex items-center justify-center lg:items-stretch">
              <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-[rgba(212,160,23,0.25)] bg-[rgba(20,8,12,0.65)] px-3 py-5 backdrop-blur-md sm:px-4 lg:min-h-0 lg:flex-1">
                <PlayButton ref={buttonRef} disabled={busy} onPress={play} />
              </div>
            </aside>
          </div>

          <div className="lg:self-stretch">
            <WinnersPanel winners={winners} />
          </div>
        </div>

        <footer className="mt-2 shrink-0 text-center text-[0.65rem] text-white/25 sm:mt-3 sm:text-xs">
          Digitech Dashain Offer · Terms apply
        </footer>
      </div>
    </div>
  )
}
