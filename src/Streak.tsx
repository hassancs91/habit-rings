import { useEffect, useRef } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'

const OUTER =
  'M50 4 C58 26 86 42 86 80 C86 108 70 126 50 126 C30 126 14 108 14 80 C14 60 26 48 32 30 C37 44 43 51 48 53 C45 37 45 21 50 4 Z'
const INNER =
  'M50 56 C56 70 70 80 70 98 C70 113 61 122 50 122 C39 122 30 113 30 98 C30 86 38 79 43 68 C46 76 48 79 51 80 C49 72 48 65 50 56 Z'
const CORE = 'M50 88 C54 96 60 101 60 110 C60 117 56 121 50 121 C44 121 40 117 40 110 C40 103 46 98 50 88 Z'

interface StreakProps {
  days: number
  today: boolean
}

export function Streak({ days, today }: StreakProps) {
  const reduce = useReducedMotion()
  const flare = useMotionValue(1)
  const previous = useRef(days)
  const lit = days > 0
  const state = !lit ? 'is-out' : today ? 'is-lit' : 'is-waiting'

  // When the streak grows, the flame flares up before settling.
  useEffect(() => {
    const grew = days > previous.current
    previous.current = days
    if (!grew || reduce) return
    const controls = animate(flare, [1, 1.45, 0.92, 1], { duration: 0.9, ease: 'easeOut' })
    return () => controls.stop()
  }, [days, reduce, flare])

  const flicker = (amount: number, duration: number) =>
    reduce || !lit
      ? {}
      : {
          animate: {
            scaleY: [1, 1 + 0.08 * amount, 1 - 0.04 * amount, 1 + 0.05 * amount, 1],
            scaleX: [1, 1 - 0.03 * amount, 1 + 0.03 * amount, 1 - 0.02 * amount, 1],
            skewX: [0, -3 * amount, 2 * amount, -1 * amount, 0],
          },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' as const },
        }

  const origin = { originX: 0.5, originY: 1, transformBox: 'fill-box' as const }
  const label = !lit ? 'No streak yet' : `${days}-day streak${today ? '' : ', close today to keep it'}`

  return (
    <div className={`streak ${state}`} role="img" aria-label={label}>
      <motion.svg className="streak-flame" viewBox="0 0 100 130" style={{ scale: flare, originY: 1 }} aria-hidden="true">
        <defs>
          <linearGradient id="flame-outer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--flame-tip)" />
            <stop offset="1" stopColor="var(--flame-base)" />
          </linearGradient>
          <linearGradient id="flame-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--flame-mid)" />
            <stop offset="1" stopColor="var(--flame-core)" />
          </linearGradient>
          <filter id="flame-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        {lit && <path d={OUTER} className="streak-glow" filter="url(#flame-glow)" />}
        <motion.path d={OUTER} fill="url(#flame-outer)" style={origin} {...flicker(1, 1.7)} />
        <motion.path d={INNER} fill="url(#flame-inner)" style={origin} {...flicker(1.6, 1.15)} />
        {lit && <motion.path d={CORE} className="streak-core" style={origin} {...flicker(2, 0.8)} />}
      </motion.svg>
      <div className="streak-text" aria-hidden="true">
        <span className="streak-days">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={days}
              initial={reduce ? false : { y: '60%', opacity: 0, scale: 0.6 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { y: '-60%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              {days}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="streak-label">{days === 1 ? 'day' : 'days'} streak</span>
      </div>
    </div>
  )
}
