'use client'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, gain = 0.4) {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  gainNode.gain.setValueAtTime(gain, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

export const beep = {
  /** Bell — GO signal and work step transitions */
  go() {
    const ctx = getAudioContext()
    const partials = [
      { freq: 880, gain: 0.55, decay: 1.8 },
      { freq: 1320, gain: 0.25, decay: 1.2 },
      { freq: 2200, gain: 0.12, decay: 0.8 },
    ]
    partials.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gainNode.gain.setValueAtTime(gain, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + decay)
    })
  },
  /** Short descending chime — exercise end */
  end() {
    playTone(660, 0.12, 0.35)
    setTimeout(() => playTone(550, 0.2, 0.3), 130)
  },
  /** One long lower tone — rest/stop signal */
  rest() {
    playTone(440, 0.5)
  },
  /** Short tick — countdown */
  tick() {
    playTone(660, 0.08, 0.2)
  },
  /** Completion fanfare */
  done() {
    playTone(523, 0.15)
    setTimeout(() => playTone(659, 0.15), 180)
    setTimeout(() => playTone(784, 0.3), 360)
  },
}
