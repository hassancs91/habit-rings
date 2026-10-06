import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Dial, ringTop } from './Dial'
import { Streak } from './Streak'
import { MiniRings, Week } from './Week'
import { HABITS, dayKey, dayPercent, fraction, loadHistory, saveHistory, streak, type Habit } from './habits'
import { useTheme } from './theme'

const TODAY_LABEL = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

function cssColor(habit: Habit): string {
  const name = habit.color.slice(4, -1)
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export default function App() {
  const [history, setHistory] = useState(loadHistory)
  const [pulses, setPulses] = useState<Record<string, number>>({})
  const [theme, toggleTheme] = useTheme()
  const dialRef = useRef<HTMLDivElement>(null)
  const todayKey = dayKey(new Date())
  const today = history[todayKey]

  useEffect(() => saveHistory(history), [history])

  function burst(habit: Habit, index: number) {
    const box = dialRef.current?.getBoundingClientRect()
    if (!box) return
    const top = ringTop(index)
    const color = cssColor(habit)
    confetti({
      particleCount: 48,
      spread: 70,
      startVelocity: 30,
      gravity: 0.9,
      scalar: 0.9,
      ticks: 150,
      colors: [color, color, '#ffffff'],
      origin: {
        x: (box.left + top.x * box.width) / window.innerWidth,
        y: (box.top + top.y * box.height) / window.innerHeight,
      },
      disableForReducedMotion: true,
    })
  }

  function log(habit: Habit, index: number) {
    const before = today[habit.id]
    const after = Math.min(habit.goal, before + habit.step)
    if (after === before) return
    setHistory((prev) => ({ ...prev, [todayKey]: { ...prev[todayKey], [habit.id]: after } }))
    setPulses((prev) => ({ ...prev, [habit.id]: (prev[habit.id] ?? 0) + 1 }))
    if (after >= habit.goal) burst(habit, index)
  }

  function unlog(habit: Habit) {
    const before = today[habit.id]
    const after = Math.max(0, before - habit.step)
    if (after === before) return
    setHistory((prev) => ({ ...prev, [todayKey]: { ...prev[todayKey], [habit.id]: after } }))
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <MiniRings fractions={[0.78, 0.6, 0.42]} size={44} />
          <span className="wordmark">Rings</span>
        </div>
        <div className="top-end">
          <time className="today" dateTime={todayKey}>
            {TODAY_LABEL.format(new Date())}
          </time>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="main">
        <div ref={dialRef} className="dial-wrap">
          <Dial values={today} pulses={pulses} percent={dayPercent(today)} />
          <Streak {...streak(history)} />
        </div>

        <ul className="habits">
          {HABITS.map((habit, i) => {
            const value = today[habit.id]
            const closed = value >= habit.goal
            return (
              <li key={habit.id} className={closed ? 'habit is-closed' : 'habit'} style={{ color: habit.color }}>
                <MiniRings fractions={[fraction(habit, today)]} colors={[habit.color]} size={56} />
                <div className="habit-text">
                  <span className="habit-name">{habit.name}</span>
                  <span className="habit-count">
                    <b>{value}</b> / {habit.goal} {habit.unit}
                  </span>
                </div>
                <div className="habit-actions">
                  <button
                    type="button"
                    className="habit-undo"
                    onClick={() => unlog(habit)}
                    hidden={value === 0}
                    aria-label={`Undo ${habit.stepLabel}`}
                    title={`Undo ${habit.stepLabel}`}
                  >
                    −
                  </button>
                  {closed ? (
                    <span className="habit-done">Closed</span>
                  ) : (
                    <button type="button" className="habit-log" onClick={() => log(habit, i)}>
                      {habit.stepLabel}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </main>

      <Week history={history} />
    </div>
  )
}
