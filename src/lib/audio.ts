let ctx: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null
let masterGain: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let reverb: ConvolverNode | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()

    // ── Master bus: compressor → gain → destination ──────────
    compressor = ctx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-12, ctx.currentTime)
    compressor.knee.setValueAtTime(24, ctx.currentTime)
    compressor.ratio.setValueAtTime(6, ctx.currentTime)
    compressor.attack.setValueAtTime(0.003, ctx.currentTime)
    compressor.release.setValueAtTime(0.25, ctx.currentTime)

    masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(2.4, ctx.currentTime) // loud master

    compressor.connect(masterGain)
    masterGain.connect(ctx.destination)

    // ── Simple reverb impulse (short room tail) ───────────────
    reverb = ctx.createConvolver()
    reverb.buffer = makeImpulse(ctx, 1.4, 2.2)
    const reverbGain = ctx.createGain()
    reverbGain.gain.setValueAtTime(0.18, ctx.currentTime)
    reverb.connect(reverbGain)
    reverbGain.connect(compressor)
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

function makeImpulse(audio: AudioContext, duration: number, decay: number): AudioBuffer {
  const rate = audio.sampleRate
  const len = Math.floor(rate * duration)
  const buf = audio.createBuffer(2, len, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return buf
}

function getNoiseBuffer(audio: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer
  const length = audio.sampleRate * 1.5
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  noiseBuffer = buffer
  return buffer
}

/** Route a node to the master bus AND a touch of reverb. */
function routeOut(node: AudioNode, audio: AudioContext, wet = 0.15) {
  if (!compressor || !reverb) return
  const dry = audio.createGain()
  dry.gain.setValueAtTime(1 - wet, audio.currentTime)
  node.connect(dry)
  dry.connect(compressor)

  if (wet > 0) {
    const send = audio.createGain()
    send.gain.setValueAtTime(wet, audio.currentTime)
    node.connect(send)
    send.connect(reverb)
  }
}

// ─────────────────────────────────────────────────────────────
// CORE SYNTH HELPERS
// ─────────────────────────────────────────────────────────────

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.15,
  startAt = 0,
  detune = 0,
  wet = 0.12,
) {
  const audio = getCtx()
  if (!audio) return

  const now = audio.currentTime + startAt
  const osc = audio.createOscillator()
  const amp = audio.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, now)
  if (detune) osc.detune.setValueAtTime(detune, now)

  amp.gain.setValueAtTime(0.0001, now)
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc.connect(amp)
  routeOut(amp, audio, wet)
  osc.start(now)
  osc.stop(now + duration + 0.03)
}

/** Two detuned oscillators on top of each other = fat brass/lead. */
function fatTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sawtooth',
  gain = 0.12,
  startAt = 0,
) {
  tone(frequency, duration, type, gain, startAt, -10, 0.14)
  tone(frequency, duration, type, gain * 0.9, startAt, +10, 0.14)
  // Sub one octave down for weight
  tone(frequency / 2, duration * 1.05, 'sine', gain * 0.6, startAt, 0, 0.05)
}

/** Sub-bass hit. The chest-thump. */
function subBass(frequency = 55, duration = 0.4, gain = 0.3, startAt = 0) {
  tone(frequency, duration, 'sine', gain, startAt, 0, 0.02)
  tone(frequency * 0.5, duration * 1.1, 'sine', gain * 0.7, startAt, 0, 0.02)
}

function noiseBurst(
  duration: number,
  gain = 0.12,
  startAt = 0,
  filterFreq = 900,
  type: BiquadFilterType = 'bandpass',
  q = 0.9,
  wet = 0.14,
) {
  const audio = getCtx()
  if (!audio) return

  const now = audio.currentTime + startAt
  const src = audio.createBufferSource()
  src.buffer = getNoiseBuffer(audio)

  const filter = audio.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(filterFreq, now)
  filter.Q.setValueAtTime(q, now)

  const amp = audio.createGain()
  amp.gain.setValueAtTime(0.0001, now)
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.006)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  src.connect(filter)
  filter.connect(amp)
  routeOut(amp, audio, wet)
  src.start(now)
  src.stop(now + duration + 0.03)
}

/** Filtered noise sweep for whooshes and cymbal-like tails. */
function sweep(
  duration: number,
  startFreq: number,
  endFreq: number,
  gain = 0.1,
  startAt = 0,
  type: BiquadFilterType = 'bandpass',
) {
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime + startAt
  const src = audio.createBufferSource()
  src.buffer = getNoiseBuffer(audio)

  const filter = audio.createBiquadFilter()
  filter.type = type
  filter.Q.setValueAtTime(1.2, now)
  filter.frequency.setValueAtTime(startFreq, now)
  filter.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), now + duration)

  const amp = audio.createGain()
  amp.gain.setValueAtTime(0.0001, now)
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.02)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  src.connect(filter)
  filter.connect(amp)
  routeOut(amp, audio, 0.2)
  src.start(now)
  src.stop(now + duration + 0.05)
}

// ─────────────────────────────────────────────────────────────
// DRUM KIT
// ─────────────────────────────────────────────────────────────

function thud(startAt = 0, gain = 0.4) {
  subBass(60, 0.35, gain, startAt)
  tone(90, 0.22, 'triangle', gain * 0.5, startAt, 0, 0.05)
  noiseBurst(0.1, gain * 0.5, startAt, 220, 'lowpass', 0.7)
}

function coinClink(startAt = 0, gain = 0.09) {
  tone(2000 + Math.random() * 600, 0.09, 'square', gain, startAt, 0, 0.25)
  tone(2700 + Math.random() * 700, 0.07, 'triangle', gain * 0.7, startAt + 0.015, 0, 0.3)
  tone(3400 + Math.random() * 800, 0.05, 'sine', gain * 0.4, startAt + 0.03, 0, 0.35)
  noiseBurst(0.04, gain * 0.6, startAt, 4500, 'highpass', 1, 0.3)
}

function drumHit(startAt = 0, kind: 'kick' | 'snare' | 'tom' | 'crash' = 'kick') {
  if (kind === 'kick') {
    subBass(55, 0.32, 0.5, startAt)
    tone(85, 0.14, 'triangle', 0.22, startAt, 0, 0.05)
    noiseBurst(0.06, 0.14, startAt, 160, 'lowpass', 0.7)
    return
  }
  if (kind === 'snare') {
    noiseBurst(0.16, 0.22, startAt, 1600, 'bandpass', 1.1, 0.22)
    noiseBurst(0.05, 0.12, startAt, 4000, 'highpass', 1, 0.15)
    tone(200, 0.08, 'triangle', 0.12, startAt, 0, 0.05)
    return
  }
  if (kind === 'tom') {
    subBass(120, 0.22, 0.32, startAt)
    tone(180, 0.16, 'triangle', 0.16, startAt, 0, 0.1)
    noiseBurst(0.08, 0.08, startAt, 500, 'lowpass', 0.7)
    return
  }
  // crash
  sweep(1.1, 6000, 800, 0.14, startAt, 'highpass')
  noiseBurst(0.6, 0.12, startAt, 3000, 'highpass', 0.7, 0.3)
}

// ─────────────────────────────────────────────────────────────
// PUBLIC SOUNDS
// ─────────────────────────────────────────────────────────────

export function playPressSound() {
  thud(0, 0.5)
  noiseBurst(0.07, 0.22, 0, 700, 'lowpass', 1)
  fatTone(110, 0.16, 'sawtooth', 0.14, 0.015)
  sweep(0.12, 200, 900, 0.1, 0, 'bandpass')
}

export function playSpinTick() {
  const pitch = 200 + Math.random() * 140
  tone(pitch, 0.035, 'square', 0.09, 0, 0, 0.06)
  tone(pitch * 1.5, 0.03, 'triangle', 0.05, 0.005, 0, 0.06)
  noiseBurst(0.025, 0.09, 0, 1200 + Math.random() * 800, 'bandpass', 1.2, 0.1)
}

export function playReelStop() {
  thud(0, 0.45)
  noiseBurst(0.1, 0.2, 0, 400, 'lowpass', 0.9, 0.2)
  fatTone(140, 0.13, 'square', 0.14, 0.015)
  tone(85, 0.2, 'triangle', 0.12, 0.03)
  // metallic click tail
  tone(1400, 0.05, 'square', 0.05, 0.01, 0, 0.25)
}

/** Fast drumroll followed by a big reveal hit. Call this when a spin is about to reveal. */
export function playRevealDrumroll(duration = 1.4, startAt = 0) {
  const hits = Math.floor(duration / 0.045)
  for (let i = 0; i < hits; i++) {
    const t = startAt + i * 0.045
    const intensity = 0.1 + (i / hits) * 0.18
    noiseBurst(0.04, intensity, t, 1500, 'bandpass', 1.4, 0.15)
    if (i % 4 === 0) {
      tone(180, 0.03, 'triangle', 0.06, t, 0, 0.05)
    }
  }
  // Final crash + boom at the end
  drumHit(startAt + duration, 'crash')
  drumHit(startAt + duration, 'kick')
}

export function playWinFanfare() {
  // ── Massive slot jackpot: drumroll → brass stabs → coin cascade ──

  // 1. Drumroll intro (0 – 1.0s)
  for (let i = 0; i < 22; i++) {
    const t = i * 0.045
    const g = 0.08 + (i / 22) * 0.14
    noiseBurst(0.04, g, t, 1600, 'bandpass', 1.3, 0.12)
  }
  drumHit(0.95, 'crash')
  drumHit(0.95, 'kick')

  // 2. Main drum pattern (starting at 1.0s)
  const pattern: Array<{ t: number; kind: 'kick' | 'snare' | 'tom' | 'crash' }> = [
    { t: 1.0, kind: 'kick' },
    { t: 1.18, kind: 'snare' },
    { t: 1.36, kind: 'kick' },
    { t: 1.5, kind: 'tom' },
    { t: 1.68, kind: 'snare' },
    { t: 1.86, kind: 'kick' },
    { t: 2.04, kind: 'snare' },
    { t: 2.22, kind: 'kick' },
    { t: 2.4, kind: 'tom' },
    { t: 2.58, kind: 'snare' },
    { t: 2.76, kind: 'crash' },
    { t: 2.9, kind: 'kick' },
    { t: 3.05, kind: 'snare' },
    { t: 3.2, kind: 'kick' },
  ]
  pattern.forEach(({ t, kind }) => drumHit(t, kind))

  // 3. Room rumble / crowd bed
  noiseBurst(3.2, 0.09, 0.05, 240, 'lowpass', 0.7, 0.3)
  sweep(2.4, 400, 4000, 0.05, 0.3, 'bandpass')
  sweep(1.6, 3000, 800, 0.05, 1.4, 'bandpass')

  // 4. Cascading coin hits — louder, denser, spread over 2.5s
  for (let i = 0; i < 32; i++) {
    coinClink(0.15 + i * 0.075 + Math.random() * 0.04, 0.08 + Math.random() * 0.04)
  }

  // 5. Fat brass stabs — big, layered, detuned
  const stabs = [110, 146.83, 164.81, 220, 277.18, 329.63]
  stabs.forEach((n, i) => {
    const t = 0.08 + i * 0.24
    fatTone(n, 0.42, 'sawtooth', 0.16, t)
    fatTone(n * 2, 0.32, 'square', 0.09, t + 0.02)
    subBass(n / 2, 0.5, 0.18, t)
  })

  // 6. Big final boom + shimmer (2.9s onward)
  subBass(45, 0.8, 0.42, 2.9)
  tone(55, 0.7, 'sine', 0.3, 2.9, 0, 0.1)
  noiseBurst(0.6, 0.2, 2.9, 350, 'lowpass', 0.8, 0.3)
  drumHit(2.9, 'crash')

  // Shimmering high coins in the tail
  for (let i = 0; i < 20; i++) {
    coinClink(2.95 + i * 0.06 + Math.random() * 0.03, 0.05)
  }

  // Final long sub tail
  subBass(38, 1.4, 0.3, 3.3)
}

export function playLoseTone() {
  // Not sad-cute — a heavy "aah" thud with descending weight.
  thud(0, 0.38)
  fatTone(150, 0.3, 'sawtooth', 0.12, 0.02)
  fatTone(110, 0.4, 'sawtooth', 0.1, 0.15)
  fatTone(82, 0.55, 'triangle', 0.12, 0.3)
  subBass(60, 0.7, 0.22, 0.05)
  noiseBurst(0.3, 0.09, 0.1, 260, 'lowpass', 0.8)
  // Long descending sweep
  sweep(0.7, 900, 120, 0.06, 0.1, 'lowpass')
}