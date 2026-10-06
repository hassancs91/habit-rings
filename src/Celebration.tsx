import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { motion, useReducedMotion } from 'motion/react'
import { Fireworks, type Shell } from './fireworks'
import { HABITS } from './habits'

// Let the third ring finish closing before the show starts.
const LEAD_IN = 550
// The show itself, then the card lingers a moment before leaving on its own.
const SHOW = 9800
const STAY = 13500

const SHELLS: Shell[] = ['peony', 'ring', 'crackle', 'peony', 'willow', 'ring', 'crackle']

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function palette() {
  const rings = HABITS.map((habit) => cssVar(habit.color.slice(4, -1)))
  const flame = [cssVar('--flame-mid'), cssVar('--flame-tip')]
  return { rings, all: [...rings, ...flame, '#ffffff'] }
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

interface CelebrationProps {
  streak: number
  onDone: () => void
}

export function Celebration({ streak, onDone }: CelebrationProps) {
  const reduce = useReducedMotion()
  const sky = useRef<HTMLCanvasElement>(null)
  const air = useRef<HTMLCanvasElement>(null)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, LEAD_IN + ms))
    const close = () => done.current()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    timers.push(window.setTimeout(close, LEAD_IN + STAY))

    if (reduce || !sky.current || !air.current) {
      return () => {
        timers.forEach(clearTimeout)
        window.removeEventListener('keydown', onKey)
      }
    }

    const { rings, all } = palette()
    const fireworks = new Fireworks(sky.current)
    const shoot = confetti.create(air.current, { resize: true })
    let stream = 0

    // Two cannons from the bottom corners, aimed at the middle.
    const cannons = (count: number, velocity: number) => {
      for (const side of [0, 1]) {
        shoot({
          particleCount: count,
          angle: side ? 120 : 60,
          spread: 55,
          startVelocity: velocity,
          gravity: 0.85,
          ticks: 320,
          scalar: 1.15,
          colors: all,
          origin: { x: side, y: 1 },
        })
      }
    }

    // A steady stream from both sides while the fireworks get going.
    const streamUntil = (ms: number) => {
      const end = performance.now() + ms
      const frame = () => {
        for (const side of [0, 1]) {
          shoot({
            particleCount: 3,
            angle: side ? 125 : 55,
            spread: 60,
            startVelocity: random(45, 70),
            ticks: 280,
            colors: all,
            origin: { x: side, y: random(0.55, 0.85) },
          })
        }
        if (performance.now() < end) stream = requestAnimationFrame(frame)
      }
      stream = requestAnimationFrame(frame)
    }

    // Stars and ribbons drifting down from above.
    const rain = (count: number) => {
      for (let i = 0; i < count; i++) {
        shoot({
          particleCount: 8,
          angle: 270,
          spread: 90,
          startVelocity: random(4, 14),
          gravity: 0.55,
          drift: random(-0.6, 0.6),
          ticks: 520,
          scalar: random(1, 1.5),
          shapes: ['star', 'square', 'circle'],
          colors: all,
          origin: { x: random(0, 1), y: -0.08 },
        })
      }
    }

    // Opening: the cannons fire and a three-ring shell bursts overhead.
    at(0, () => {
      cannons(160, 72)
      fireworks.burst(0.5, 0.3, 'rings', rings)
    })
    at(250, () => streamUntil(3200))
    at(400, () => {
      fireworks.launch(0.22, 0.28, 'peony', all)
      fireworks.launch(0.78, 0.26, 'peony', all)
    })

    // The main show: a rocket every beat, alternating sides, with the odd double.
    let t = 1100
    for (let i = 0; t < SHOW - 2600; i++) {
      const x = i % 2 ? random(0.55, 0.88) : random(0.12, 0.45)
      const shell = SHELLS[i % SHELLS.length]
      const colors = shell === 'ring' ? [rings[i % rings.length]] : all
      at(t, () => fireworks.launch(x, random(0.14, 0.4), shell, colors))
      if (i % 4 === 3) at(t + 140, () => fireworks.launch(random(0.3, 0.7), random(0.1, 0.25), 'crackle', all))
      t += random(360, 520)
    }
    at(2800, () => rain(10))
    at(4600, () => cannons(90, 64))

    // Finale: a rapid salvo across the sky, a curtain of stars, then the big one.
    const finale = SHOW - 2600
    for (let i = 0; i < 14; i++) {
      at(finale + i * 110, () =>
        fireworks.launch(0.08 + (i / 13) * 0.84, random(0.12, 0.34), i % 3 ? 'peony' : 'crackle', all),
      )
    }
    at(finale + 300, () => rain(18))
    at(finale + 900, () => cannons(200, 80))
    at(finale + 1700, () => {
      fireworks.launch(0.5, 0.26, 'rings', rings)
      fireworks.launch(0.25, 0.34, 'willow', all)
      fireworks.launch(0.75, 0.34, 'willow', all)
    })

    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(stream)
      window.removeEventListener('keydown', onKey)
      fireworks.destroy()
      shoot.reset()
    }
  }, [reduce])

  const lead = reduce ? 0 : LEAD_IN / 1000

  return (
    <motion.div
      className="celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      onClick={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, delay: lead } }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <canvas ref={sky} className="celebration-canvas" aria-hidden="true" />
      <motion.div
        className="celebration-card"
        onClick={(event) => event.stopPropagation()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduce ? { delay: lead } : { type: 'spring', stiffness: 170, damping: 14, delay: lead + 0.25 }}
      >
        <BigRings reduce={!!reduce} delay={lead + 0.4} />
        <h2 id="celebration-title" className="celebration-title">
          Day closed
        </h2>
        <p className="celebration-text">All three rings, done.</p>
        {streak > 0 && (
          <motion.p
            className="celebration-streak"
            initial={reduce ? false : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 12, delay: lead + 1.5 }}
          >
            <b>{streak}</b> {streak === 1 ? 'day' : 'days'} in a row
          </motion.p>
        )}
        <button type="button" className="celebration-close" onClick={onDone} autoFocus>
          Keep it up
        </button>
      </motion.div>
      <canvas ref={air} className="celebration-canvas is-front" aria-hidden="true" />
    </motion.div>
  )
}

/** The three rings drawing themselves closed, one after another. */
function BigRings({ reduce, delay }: { reduce: boolean; delay: number }) {
  return (
    <motion.svg
      className="celebration-rings"
      viewBox="0 0 120 120"
      aria-hidden="true"
      initial={reduce ? false : { rotate: -120 }}
      animate={{ rotate: 0 }}
      transition={{ type: 'spring', stiffness: 40, damping: 12, delay }}
    >
      {HABITS.map((habit, i) => {
        const r = 52 - i * 15
        return (
          <g key={habit.id} style={{ color: habit.color }} transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="11" opacity="0.18" />
            <motion.circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="11"
              strokeLinecap="round"
              className="celebration-ring"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ type: 'spring', stiffness: 50, damping: 14, delay: delay + i * 0.25 }}
            />
          </g>
        )
      })}
    </motion.svg>
  )
}
