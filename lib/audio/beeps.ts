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
  /** Three short high beeps — go signal */
  go() {
    playTone(880, 0.1)
    setTimeout(() => playTone(880, 0.1), 150)
    setTimeout(() => playTone(1100, 0.2), 300)
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
