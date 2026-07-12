'use client'

let doneAudio: HTMLAudioElement | null = null
let exerciseStartAudio: HTMLAudioElement | null = null
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
  /** Exercise-start cue ("Opening Bell" by u_7xr5ffk4oq, Pixabay Content License) */
  exerciseStart() {
    if (!exerciseStartAudio) {
      exerciseStartAudio = new Audio('/sounds/exercise-start-bell.mp3')
    }
    exerciseStartAudio.currentTime = 0
    exerciseStartAudio.play().catch(() => {})
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
