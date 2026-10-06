import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { HABITS, type Habit } from './habits'

const SIZE = 640
const C = SIZE / 2
const STROKE = 52
const RING_GAP = 10
const SEGMENT_GAP = 7
const OUTER = C - 28 - STROKE / 2

export function ringRadius(index: number): number {
  return OUTER - index * (STROKE + RING_GAP)
}

/** Where a ring starts and ends (12 o'clock), as a fraction of the dial's box. */
export function ringTop(index: number): { x: number; y: number } {
  return { x: 0.5, y: (C - ringRadius(index)) / SIZE }
}

function arc(r: number, a0: number, a1: number): string {
  const point = (a: number) => `${(C + r * Math.sin(a)).toFixed(2)} ${(C - r * Math.cos(a)).toFixed(2)}`
  return `M ${point(a0)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${point(a1)}`
}

interface RingProps {
  habit: Habit
  index: number
  value: number
  pulse: number
}

function Ring({ habit, index, value, pulse }: RingProps) {
  const reduce = useReducedMotion()
  const mounted = useRef(false)
  const glow = useMotionValue(0.6)
  const segments = habit.goal / habit.step
  const filled = Math.min(value, habit.goal) / habit.step
  const r = ringRadius(index)
  const gap = SEGMENT_GAP / r
  const span = (Math.PI * 2) / segments

  useEffect(() => {
    mounted.current = true
  }, [])

  useEffect(() => {
    if (pulse === 0 || reduce) return
    const controls = animate(glow, [1, 0.6], { duration: 1.4, ease: 'easeOut' })
    return () => controls.stop()
  }, [pulse, reduce, glow])

  const paths = Array.from({ length: segments }, (_, k) => arc(r, k * span + gap / 2, (k + 1) * span - gap / 2))

  const fill = (k: number) => {
    const target = Math.max(0, Math.min(1, filled - k))
    const transition = reduce
      ? { duration: 0 }
      : mounted.current
        ? { type: 'spring' as const, stiffness: 160, damping: 17 }
        : { type: 'spring' as const, stiffness: 70, damping: 14, delay: 0.25 + index * 0.18 + k * 0.07 }
    return { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: target, opacity: target > 0 ? 1 : 0 }, transition }
  }

  return (
    <g style={{ color: habit.color }}>
      {paths.map((d, k) => (
        <path key={`track-${k}`} d={d} className="dial-track" strokeWidth={STROKE} />
      ))}
      <motion.g style={{ opacity: glow }} filter="url(#dial-glow)">
        {paths.map((d, k) => (
          <motion.path key={`glow-${k}`} d={d} stroke="currentColor" strokeWidth={STROKE} fill="none" {...fill(k)} />
        ))}
      </motion.g>
      {paths.map((d, k) => (
        <motion.path key={`fill-${k}`} d={d} stroke="currentColor" strokeWidth={STROKE} fill="none" {...fill(k)} />
      ))}
    </g>
  )
}

function Percent({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 60, damping: 18 })
  const text = useTransform(spring, (v) => String(Math.round(v)))
  useEffect(() => {
    spring.set(value)
  }, [spring, value])
  return <motion.span>{text}</motion.span>
}

interface DialProps {
  values: Record<string, number>
  pulses: Record<string, number>
  percent: number
}

export function Dial({ values, pulses, percent }: DialProps) {
  return (
    <div className="dial">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Today ${percent}% done`}>
        <defs>
          <filter id="dial-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        {HABITS.map((habit, i) => (
          <Ring key={habit.id} habit={habit} index={i} value={values[habit.id] ?? 0} pulse={pulses[habit.id] ?? 0} />
        ))}
      </svg>
      <div className="dial-center" aria-hidden="true">
        <span className="dial-percent">
          <Percent value={percent} />
          <small>%</small>
        </span>
        <span className="dial-label">today</span>
      </div>
    </div>
  )
}
