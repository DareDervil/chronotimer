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

let doneAudio: HTMLAudioElement | null = null
let goAudio: HTMLAudioElement | null = null
let exerciseEndAudio: HTMLAudioElement | null = null
let halfwayAudio: HTMLAudioElement | null = null
let tickAudio: HTMLAudioElement | null = null
const countAudio: Partial<Record<3 | 2 | 1, HTMLAudioElement>> = {}
const countSrc: Record<3 | 2 | 1, string> = {
  3: '/sounds/count-three.mp3',
  2: '/sounds/count-two.mp3',
  1: '/sounds/count-one.mp3',
}

export const beep = {
  /** Completion fanfare ("Level Up 03" by Universfield, Pixabay Content License) */
  done() {
    if (!doneAudio) {
      doneAudio = new Audio('/sounds/workout-complete.mp3')
    }
    doneAudio.currentTime = 0
    doneAudio.play().catch(() => {})
  },
  /** Three bell rings, ~220ms apart — for starting work */
  bell(times: 3) {
    for (let i = 0; i < times; i++) {
      setTimeout(ring, i * 220)
    }
  },
  /** Exercise-end cue ("Opening Bell" by u_7xr5ffk4oq, Pixabay Content License) */
  exerciseEnd() {
    if (!exerciseEndAudio) {
      exerciseEndAudio = new Audio('/sounds/exercise-end-bell.mp3')
    }
    exerciseEndAudio.currentTime = 0
    exerciseEndAudio.play().catch(() => {})
  },
  /** "Go!" cue — boxing bell, first second only ("Boxing Bell" by Universfield, Pixabay Content License) */
  go() {
    if (!goAudio) {
      goAudio = new Audio('/sounds/go-bell.mp3')
    }
    goAudio.currentTime = 0
    goAudio.play().catch(() => {})
  },
  /** Countdown voice — "Three"/"Two"/"One" ("Casual Voice Man Says N" by floraphonic, Pixabay Content License) */
  count(n: 3 | 2 | 1) {
    if (!countAudio[n]) {
      countAudio[n] = new Audio(countSrc[n])
    }
    const audio = countAudio[n]!
    audio.currentTime = 0
    audio.play().catch(() => {})
  },
  /** Halfway-through cue ("Flight announcement tannoy - single tone" by YUSUF_SFX, Pixabay Content License) */
  halfway() {
    if (!halfwayAudio) {
      halfwayAudio = new Audio('/sounds/halfway-tone.mp3')
    }
    halfwayAudio.currentTime = 0
    halfwayAudio.play().catch(() => {})
  },
  /** Subtle tick — fired at 3, 2, 1 seconds remaining on any step ("Soft UI Click" by Universfield, Pixabay Content License) */
  tick() {
    if (!tickAudio) {
      tickAudio = new Audio('/sounds/tick.mp3')
    }
    tickAudio.currentTime = 0
    tickAudio.play().catch(() => {})
  },
}
