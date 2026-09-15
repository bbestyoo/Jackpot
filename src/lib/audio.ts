let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.08,
  startAt = 0,
) {
  const audio = getCtx()
  if (!audio) return

  const now = audio.currentTime + startAt
  const osc = audio.createOscillator()
  const amp = audio.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, now)

  amp.gain.setValueAtTime(0.0001, now)
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc.connect(amp)
  amp.connect(audio.destination)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playPressSound() {
  tone(180, 0.08, 'square', 0.09)
  tone(90, 0.12, 'sawtooth', 0.05, 0.02)
}

export function playSpinTick() {
  tone(420 + Math.random() * 80, 0.04, 'triangle', 0.035)
}

export function playReelStop() {
  tone(220, 0.1, 'square', 0.07)
  tone(140, 0.14, 'triangle', 0.04, 0.04)
}

export function playWinFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((n, i) => {
    tone(n, 0.22, 'square', 0.07, i * 0.1)
    tone(n / 2, 0.28, 'triangle', 0.04, i * 0.1)
  })
}

export function playLoseTone() {
  tone(220, 0.18, 'sawtooth', 0.05)
  tone(165, 0.28, 'triangle', 0.04, 0.12)
}
