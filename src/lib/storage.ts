import {
  BASE_JACKPOT,
  FAKE_NAMES,
  PRIZE_POOL,
  SYMBOLS,
  WIN_CHANCE,
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

const WINNING_PRIZES = SYMBOLS.filter((s) => !s.isLose)

export function randomSymbol(): SymbolId {
  return PRIZE_POOL[Math.floor(Math.random() * PRIZE_POOL.length)]
}

export function randomWinningPrize(): SymbolId {
  return WINNING_PRIZES[Math.floor(Math.random() * WINNING_PRIZES.length)].id
}

export function rollSpin(): { results: SymbolId[]; isWin: boolean } {
  if (Math.random() < WIN_CHANCE) {
    const symbol = randomWinningPrize()
    return { results: [symbol, symbol, symbol], isWin: true }
  }

  const a = randomSymbol()
  let b = randomSymbol()
  let c = randomSymbol()

  // Prefer near-miss tension: two matching often
  if (Math.random() < 0.45) {
    b = a
    do {
      c = randomSymbol()
    } while (c === a)
  } else {
    while (a === b && b === c) {
      c = randomSymbol()
    }
  }

  const isWin = a === b && b === c && a !== 'try_again'
  return { results: [a, b, c], isWin }
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
