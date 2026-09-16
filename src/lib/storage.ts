import {
  BASE_JACKPOT,
  FAKE_NAMES,
  pickWeightedPrize,
  SYMBOLS,
  type SymbolId,
  type Winner,
} from './constants'

const JACKPOT_KEY = 'neon-jackpot-amount'
const WINNERS_KEY = 'neon-jackpot-winners-v2'

export function loadJackpot(): number {
  try {
    const raw = localStorage.getItem(JACKPOT_KEY)
    if (!raw) return BASE_JACKPOT
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : BASE_JACKPOT
  } catch {
    return BASE_JACKPOT
  }
}

export function saveJackpot(amount: number) {
  try {
    localStorage.setItem(JACKPOT_KEY, String(Math.round(amount)))
  } catch {
    // ignore
  }
}

export function loadWinners(): Winner[] {
  try {
    const raw = localStorage.getItem(WINNERS_KEY)
    if (!raw) return seedWinners()
    const parsed = JSON.parse(raw) as Winner[]
    if (!Array.isArray(parsed) || !parsed.every(isValidWinner)) return seedWinners()
    return parsed.slice(0, 8)
  } catch {
    return seedWinners()
  }
}

function isValidWinner(w: Winner): boolean {
  return Boolean(w?.id && w?.name && w?.prizeId && w?.prizeLabel && Array.isArray(w?.symbols))
}

export function saveWinners(winners: Winner[]) {
  try {
    localStorage.setItem(WINNERS_KEY, JSON.stringify(winners.slice(0, 8)))
  } catch {
    // ignore
  }
}

function seedWinners(): Winner[] {
  const seeded: Winner[] = [
    {
      id: 'seed-1',
      name: 'Alex M.',
      prizeId: 'smart_watch',
      prizeLabel: 'Smart Watch',
      symbols: ['smart_watch', 'smart_watch', 'smart_watch'],
      at: Date.now() - 1000 * 60 * 18,
    },
    {
      id: 'seed-2',
      name: 'Jordan K.',
      prizeId: 'cash_10000',
      prizeLabel: '10000 Cash Back',
      symbols: ['cash_10000', 'cash_10000', 'cash_10000'],
      at: Date.now() - 1000 * 60 * 47,
    },
    {
      id: 'seed-3',
      name: 'Sam R.',
      prizeId: 'wireless_headphone',
      prizeLabel: 'Wireless Headphone',
      symbols: ['wireless_headphone', 'wireless_headphone', 'wireless_headphone'],
      at: Date.now() - 1000 * 60 * 92,
    },
  ]
  saveWinners(seeded)
  return seeded
}

export function randomSymbol(): SymbolId {
  return pickWeightedPrize()
}

/**
 * Weighted-outcome spin. ONE roll decides everything.
 *
 *   rollSpin() calls pickWeightedPrize() exactly once.
 *   • If the roll lands on a prize symbol → guaranteed WIN.
 *     All three reels are set to that symbol.
 *   • If the roll lands on 'try_again'      → guaranteed LOSS.
 *     Three independent weighted symbols are shown (no forced
 *     near-miss, no engineered patterns — purely natural).
 *
 * Hit rate = 1 - P(try_again).
 *
 * With the default weights: P(win) = 30%  →  1 win per ~3.3 spins.
 * Adjust `try_again`'s weight in PRIZE_WEIGHTS to tune this.
 */
/**
 * Weighted-outcome spin. ONE roll decides everything.
 *
 *   rollSpin() calls pickWeightedPrize() exactly once.
 *   • If the roll lands on a prize symbol → guaranteed WIN.
 *     All three reels are set to that symbol.
 *   • If the roll lands on 'try_again'      → guaranteed LOSS.
 *     The loss is STAGED so it looks tense: the first two reels
 *     show a matching (or different) prize symbol, and only the
 *     third reel reveals 'try_again'. The underlying 12% win rate
 *     is unchanged — this is purely visual.
 *
 * Hit rate = 1 - P(try_again).
 */
/**
 * Weighted-outcome spin. ONE roll decides everything.
 *
 *   rollSpin() calls pickWeightedPrize() exactly once.
 *   • If the roll lands on a prize symbol → guaranteed WIN.
 *     All three reels are set to that symbol.
 *   • If the roll lands on 'try_again'      → guaranteed LOSS.
 *     The loss is STAGED with one of several patterns so the
 *     outcome never looks mechanically predictable.
 *
 * Hit rate = 1 - P(try_again).
 */
export function rollSpin(): { results: SymbolId[]; isWin: boolean } {
  const prize = pickWeightedPrize()

  if (prize !== 'try_again') {
    // WIN — the weighted roll decided the prize tier.
    return { results: [prize, prize, prize], isWin: true }
  }

  // LOSS — stage the visual reveal so it never looks the same twice.
  // Helper: pull a non-losing symbol.
  const pickTease = (): SymbolId => {
    let s: SymbolId
    do {
      s = pickWeightedPrize()
    } while (s === 'try_again')
    return s
  }

  const pattern = Math.random()

  // ── Pattern A (30%) — two matching + try_again on reel 3 ─────
  // Classic near-miss. Reels 1 & 2 match, reel 3 reveals the loss.
  if (pattern < 0.30) {
    const t = pickTease()
    return { results: [t, t, 'try_again'], isWin: false }
  }

  // ── Pattern B (20%) — try_again on reel 1, two prizes after ──
  // Loss revealed early; reels 2 & 3 are random teasers.
  if (pattern < 0.50) {
    const a = pickTease()
    let b: SymbolId
    do {
      b = pickTease()
    } while (b === a)
    return { results: ['try_again', a, b], isWin: false }
  }

  // ── Pattern C (20%) — try_again on reel 2, prizes on 1 & 3 ──
  // Loss revealed in the middle. Reels 1 & 3 look unrelated.
  if (pattern < 0.70) {
    const a = pickTease()
    let c: SymbolId
    do {
      c = pickTease()
    } while (c === a)
    return { results: [a, 'try_again', c], isWin: false }
  }

  // ── Pattern D (20%) — two matching prizes + different prize ──
  // No try_again shown at all. Looks like a normal miss.
  if (pattern < 0.90) {
    const t = pickTease()
    let other: SymbolId
    do {
      other = pickTease()
    } while (other === t)
    return { results: [t, t, other], isWin: false }
  }

  // ── Pattern E (10%) — three all-different prizes ─────────────
  // Pure variety. No try_again visible anywhere.
  const a = pickTease()
  let b: SymbolId
  do {
    b = pickTease()
  } while (b === a)
  let c: SymbolId
  do {
    c = pickTease()
  } while (c === a || c === b)
  return { results: [a, b, c], isWin: false }
}

export function makeWinner(prizeId: SymbolId, symbols: SymbolId[]): Winner {
  const prize = getSymbol(prizeId)
  return {
    id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
    prizeId,
    prizeLabel: prize.label,
    symbols,
    at: Date.now(),
  }
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getSymbol(id: SymbolId) {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0]
}