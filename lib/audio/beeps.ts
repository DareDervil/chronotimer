'use client'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function ring() {
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
}

export const beep = {
  /** Completion fanfare */
  done() {
    const ctx = getAudioContext()
    const playTone = (frequency: number, duration: number, gain = 0.4) => {
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
    playTone(523, 0.15)
    setTimeout(() => playTone(659, 0.15), 180)
    setTimeout(() => playTone(784, 0.3), 360)
  },
  /** One or three bell rings, ~220ms apart — 1 for entering rest, 3 for starting work */
  bell(times: 1 | 3) {
    for (let i = 0; i < times; i++) {
      setTimeout(ring, i * 220)
    }
  },
}
