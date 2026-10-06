import { HABITS, dayKey, daysAgo, fraction, type History } from './habits'

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

export function MiniRings({ fractions, colors, size = 76 }: { fractions: number[]; colors?: string[]; size?: number }) {
  const stroke = 7
  return (
    <svg className="mini" width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      {fractions.map((f, i) => {
        const r = 34 - i * 9.5
        const length = 2 * Math.PI * r
        return (
          <g key={i} style={{ color: colors?.[i] ?? HABITS[i].color }} transform="rotate(-90 40 40)">
            <circle cx="40" cy="40" r={r} className="mini-track" strokeWidth={stroke} />
            {f > 0 && (
              <circle
                cx="40"
                cy="40"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${f * length} ${length}`}
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function Week({ history }: { history: History }) {
  const days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i))
  return (
    <section className="week" aria-label="This week">
      {days.map((date, i) => {
        const day = history[dayKey(date)]
        const isToday = i === days.length - 1
        return (
          <div key={dayKey(date)} className={isToday ? 'week-day is-today' : 'week-day'}>
            <span className="week-name">{isToday ? 'Today' : WEEKDAY.format(date)}</span>
            <MiniRings fractions={HABITS.map((habit) => fraction(habit, day))} />
            <span className="week-date">{date.getDate()}</span>
          </div>
        )
      })}
    </section>
  )
}
