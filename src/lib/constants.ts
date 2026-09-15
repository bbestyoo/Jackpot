export type SymbolId =
  | 'charger'
  | 'wireless_earphone'
  | 'typec_earphone'
  | 'lv_speaker'
  | 'smart_watch'
  | 'cash_10000'
  | 'wireless_headphone'
  | 'glass_cover'
  | 'keypad_mobile'
  | 'cashback_3'
  | 'cashback_5'
  | 'keyboard'
  | 'mouse'
  | 'try_again'

export type PrizeIcon =
  | 'cable'
  | 'earbuds'
  | 'earphone'
  | 'speaker'
  | 'watch'
  | 'cash'
  | 'headphones'
  | 'shield'
  | 'phone'
  | 'percent3'
  | 'percent5'
  | 'keyboard'
  | 'mouse'
  | 'retry'

export interface SlotSymbol {
  id: SymbolId
  label: string
  shortLabel: string
  icon: PrizeIcon
  color: string
  glow: string
  accent: string
  isLose?: boolean
}

export const SYMBOLS: SlotSymbol[] = [
  {
    id: 'charger',
    label: 'Type C Charger Set',
    shortLabel: 'Type C Charger-Set',
    icon: 'cable',
    color: '#7dd3fc',
    glow: 'rgba(125, 211, 252, 0.5)',
    accent: 'from-sky-400/25 to-sky-900/40',
  },
  {
    id: 'wireless_earphone',
    label: 'Wireless Earphone',
    shortLabel: 'Wireless Buds',
    icon: 'earbuds',
    color: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.5)',
    accent: 'from-violet-400/25 to-violet-900/40',
  },
  {
    id: 'typec_earphone',
    label: 'Type C Earphone',
    shortLabel: 'Type-C Buds',
    icon: 'earphone',
    color: '#67e8f9',
    glow: 'rgba(103, 232, 249, 0.5)',
    accent: 'from-cyan-400/25 to-cyan-900/40',
  },
  {
    id: 'lv_speaker',
    label: 'LV Speaker',
    shortLabel: 'LV Speaker',
    icon: 'speaker',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.55)',
    accent: 'from-amber-400/30 to-amber-900/40',
  },
  {
    id: 'smart_watch',
    label: 'Smart Watch',
    shortLabel: 'Smart Watch',
    icon: 'watch',
    color: '#34d399',
    glow: 'rgba(52, 211, 153, 0.5)',
    accent: 'from-emerald-400/25 to-emerald-900/40',
  },
  {
    id: 'cash_10000',
    label: '10000 Cash Back',
    shortLabel: '₹10,000 Cash Back',
    icon: 'cash',
    color: '#f5c518',
    glow: 'rgba(245, 197, 24, 0.6)',
    accent: 'from-yellow-300/35 to-amber-800/45',
  },
  {
    id: 'wireless_headphone',
    label: 'Wireless Headphone',
    shortLabel: 'Wireless Headphones',
    icon: 'headphones',
    color: '#fb7185',
    glow: 'rgba(251, 113, 133, 0.5)',
    accent: 'from-rose-400/25 to-rose-900/40',
  },
  {
    id: 'glass_cover',
    label: 'Glass Cover',
    shortLabel: 'Glass Cover',
    icon: 'shield',
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.45)',
    accent: 'from-slate-300/20 to-slate-800/40',
  },
  {
    id: 'keypad_mobile',
    label: 'Keypad Mobile',
    shortLabel: 'Keypad Phone',
    icon: 'phone',
    color: '#fdba74',
    glow: 'rgba(253, 186, 116, 0.5)',
    accent: 'from-orange-300/25 to-orange-900/40',
  },
  {
    id: 'cashback_3',
    label: 'Cashback 3%',
    shortLabel: '3% Cashback',
    icon: 'percent3',
    color: '#86efac',
    glow: 'rgba(134, 239, 172, 0.5)',
    accent: 'from-green-300/25 to-green-900/40',
  },
  {
    id: 'cashback_5',
    label: 'Cashback 5%',
    shortLabel: '5% Cashback',
    icon: 'percent5',
    color: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.55)',
    accent: 'from-green-400/30 to-green-900/45',
  },
  {
    id: 'keyboard',
    label: 'Keyboard',
    shortLabel: 'Keyboard',
    icon: 'keyboard',
    color: '#c4b5fd',
    glow: 'rgba(196, 181, 253, 0.5)',
    accent: 'from-purple-300/25 to-purple-900/40',
  },
  {
    id: 'mouse',
    label: 'Mouse',
    shortLabel: 'Mouse',
    icon: 'mouse',
    color: '#f9a8d4',
    glow: 'rgba(249, 168, 212, 0.5)',
    accent: 'from-pink-300/25 to-pink-900/40',
  },
  {
    id: 'try_again',
    label: 'Try Again',
    shortLabel: 'Try Again',
    icon: 'retry',
    color: '#f87171',
    glow: 'rgba(248, 113, 113, 0.45)',
    accent: 'from-red-400/20 to-red-950/50',
    isLose: true,
  },
]

/** Prize pool with try again weighted twice so it shows up more often */
export const PRIZE_POOL: SymbolId[] = [
  ...SYMBOLS.filter((s) => !s.isLose).map((s) => s.id),
  'try_again',
  'try_again',
]

export const REEL_COUNT = 3
export const BASE_JACKPOT = 12_500
export const JACKPOT_GROWTH_PER_SPIN = 75
export const WIN_CHANCE = 0.18
export const REEL_CELL = 240
export const REEL_WINDOW = 690
export const REEL_COPIES = 10
/**
 * Slow suspenseful spin:
 * reel 3 ≈ delay 1.1 + spin 5.1 + stop 2.6 ≈ 8.8s
 */
export const SPIN_RESULT_MS = 9200

export interface Winner {
  id: string
  name: string
  prizeId: SymbolId
  prizeLabel: string
  symbols: SymbolId[]
  at: number
}

export const FAKE_NAMES = [
  'Alex M.',
  'Jordan K.',
  'Sam R.',
  'Casey L.',
  'Riley P.',
  'Taylor S.',
  'Morgan V.',
  'Quinn H.',
]

export interface ReelStrip {
  strip: SymbolId[]
  landIndex: number
}

export function buildReelStrip(finalSymbol: SymbolId): ReelStrip {
  const strip: SymbolId[] = []
  for (let i = 0; i < REEL_COPIES * SYMBOLS.length; i++) {
    strip.push(PRIZE_POOL[Math.floor(Math.random() * PRIZE_POOL.length)])
  }
  const landIndex = strip.length - SYMBOLS.length - 1
  strip[landIndex] = finalSymbol
  return { strip, landIndex }
}
