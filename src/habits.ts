export type HabitId = 'water' | 'move' | 'read'

export interface Habit {
  id: HabitId
  name: string
  goal: number
  step: number
  unit: string
  stepLabel: string
  color: string
}

// Outer ring first. Each tap adds one step, so a ring has goal / step segments.
export const HABITS: Habit[] = [
  { id: 'water', name: 'Water', goal: 8, step: 1, unit: 'glasses', stepLabel: '+1 glass', color: 'var(--water)' },
  { id: 'move', name: 'Move', goal: 30, step: 5, unit: 'min', stepLabel: '+5 min', color: 'var(--move)' },
  { id: 'read', name: 'Read', goal: 20, step: 5, unit: 'pages', stepLabel: '+5 pages', color: 'var(--read)' },
]

export type Day = Record<HabitId, number>
export type History = Record<string, Day>

const STORAGE_KEY = 'rings.v1'

export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysAgo(n: number, from = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() - n)
  return d
}

export function fraction(habit: Habit, day: Day | undefined): number {
  return Math.min(1, (day?.[habit.id] ?? 0) / habit.goal)
}

export function dayPercent(day: Day | undefined): number {
  const sum = HABITS.reduce((total, habit) => total + fraction(habit, day), 0)
  return Math.round((sum / HABITS.length) * 100)
}

const EMPTY_DAY: Day = { water: 0, move: 0, read: 0 }

// A lived-in week: six past days, then today, half done.
const SEED_WEEK: Day[] = [
  { water: 6, move: 30, read: 10 },
  { water: 8, move: 20, read: 20 },
  { water: 8, move: 30, read: 20 },
  { water: 8, move: 30, read: 20 },
  { water: 8, move: 30, read: 20 },
  { water: 8, move: 30, read: 20 },
  { water: 5, move: 15, read: 5 },
]

function seed(): History {
  const history: History = {}
  SEED_WEEK.forEach((day, i) => {
    history[dayKey(daysAgo(SEED_WEEK.length - 1 - i))] = { ...day }
  })
  return history
}

function isDay(value: unknown): value is Day {
  if (typeof value !== 'object' || value === null) return false
  return HABITS.every((habit) => typeof (value as Record<string, unknown>)[habit.id] === 'number')
}

export function loadHistory(): History {
  let history: History | null = null
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof parsed === 'object' && parsed !== null && Object.values(parsed).every(isDay)) {
      history = parsed as History
    }
  } catch {
    history = null
  }
  history ??= seed()
  const today = dayKey(new Date())
  if (!history[today]) history[today] = { ...EMPTY_DAY }
  return history
}

export function saveHistory(history: History): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // Private mode or full storage: the app still works for this visit.
  }
}
