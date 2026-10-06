/**
 * A small fireworks engine on one canvas: rockets climb with a spark trail,
 * then burst into shells that fall, drag and fade. Shapes include a "rings"
 * shell that echoes the three habit rings.
 */

export type Shell = 'peony' | 'ring' | 'rings' | 'willow' | 'crackle'

interface Rocket {
  x: number
  y: number
  vx: number
  vy: number
  shell: Shell
  colors: string[]
  trail: { x: number; y: number }[]
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  decay: number
  drag: number
  gravity: number
  size: number
  twinkle: boolean
  trail: { x: number; y: number }[]
  trailLength: number
}

interface Flash {
  x: number
  y: number
  color: string
  life: number
}

const GRAVITY = 0.09

export class Fireworks {
  private ctx: CanvasRenderingContext2D
  private rockets: Rocket[] = []
  private sparks: Spark[] = []
  private flashes: Flash[] = []
  private frame = 0
  private last = 0
  private width = 0
  private height = 0
  private scale = 1

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.resize()
    window.addEventListener('resize', this.resize)
    this.frame = requestAnimationFrame(this.tick)
  }

  destroy() {
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.resize)
  }

  /** Launch a rocket from the bottom edge towards (x, y), both 0–1 of the viewport. */
  launch(x: number, y: number, shell: Shell, colors: string[]) {
    const startX = x * this.width + (Math.random() - 0.5) * this.width * 0.12
    const targetY = y * this.height
    const climb = this.height - targetY
    const vy = -Math.sqrt(2 * GRAVITY * climb)
    const flight = -vy / GRAVITY
    this.rockets.push({
      x: startX,
      y: this.height,
      vx: (x * this.width - startX) / flight,
      vy,
      shell,
      colors,
      trail: [],
    })
  }

  /** Burst a shell right away at (x, y), both 0–1 of the viewport. */
  burst(x: number, y: number, shell: Shell, colors: string[]) {
    this.explode(x * this.width, y * this.height, shell, colors)
  }

  get busy(): boolean {
    return this.rockets.length > 0 || this.sparks.length > 0
  }

  private resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = this.width * dpr
    this.canvas.height = this.height * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Shells are sized for a ~1000px tall screen and scale from there.
    this.scale = Math.max(0.55, Math.min(1.4, Math.min(this.width, this.height * 1.4) / 1000))
  }

  private spark(x: number, y: number, angle: number, speed: number, color: string, extra: Partial<Spark> = {}) {
    this.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed * this.scale,
      vy: Math.sin(angle) * speed * this.scale,
      color,
      life: 1,
      decay: 0.011 + Math.random() * 0.008,
      drag: 0.965,
      gravity: GRAVITY * 0.45,
      size: 2.2,
      twinkle: false,
      trail: [],
      trailLength: 6,
      ...extra,
    })
  }

  private explode(x: number, y: number, shell: Shell, colors: string[]) {
    const pick = () => colors[Math.floor(Math.random() * colors.length)]
    this.flashes.push({ x, y, color: colors[0], life: 1 })

    switch (shell) {
      case 'peony': {
        const count = 110
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 7.5
          this.spark(x, y, angle, speed, pick())
        }
        break
      }
      case 'ring': {
        const count = 72
        const tilt = Math.random() * Math.PI
        const squash = 0.45 + Math.random() * 0.55
        const color = pick()
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2
          const rx = Math.cos(a)
          const ry = Math.sin(a) * squash
          const angle = Math.atan2(rx * Math.sin(tilt) + ry * Math.cos(tilt), rx * Math.cos(tilt) - ry * Math.sin(tilt))
          const speed = 7.5 * Math.hypot(rx, ry)
          this.spark(x, y, angle, speed, color, { decay: 0.012, size: 2.6 })
        }
        // A glittering heart in the middle.
        for (let i = 0; i < 30; i++) {
          this.spark(x, y, Math.random() * Math.PI * 2, Math.random() * 2.2, '#fff6d6', { twinkle: true, size: 1.6 })
        }
        break
      }
      case 'rings': {
        // Three concentric rings, outer to inner, in the habit colours.
        colors.slice(0, 3).forEach((color, ring) => {
          const count = 80 - ring * 18
          const speed = 9 - ring * 2.4
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + ring * 0.2
            this.spark(x, y, a, speed, color, { decay: 0.009, size: 2.8, drag: 0.958, gravity: GRAVITY * 0.3, trailLength: 8 })
          }
        })
        for (let i = 0; i < 40; i++) {
          this.spark(x, y, Math.random() * Math.PI * 2, Math.random() * 1.6, '#ffffff', { twinkle: true, size: 1.6, decay: 0.008 })
        }
        break
      }
      case 'willow': {
        const count = 90
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 1.5 + Math.random() * 6
          this.spark(x, y, angle, speed, '#ffc95a', {
            decay: 0.0055 + Math.random() * 0.003,
            drag: 0.955,
            gravity: GRAVITY * 0.32,
            size: 1.8,
            trailLength: 16,
          })
        }
        break
      }
      case 'crackle': {
        const count = 70
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 6
          this.spark(x, y, angle, speed, pick(), { twinkle: true, decay: 0.013, size: 2 })
        }
        break
      }
    }
  }

  private tick = (now: number) => {
    const dt = this.last ? Math.min(3, (now - this.last) / 16.67) : 1
    this.last = now
    const ctx = this.ctx

    ctx.clearRect(0, 0, this.width, this.height)
    ctx.globalCompositeOperation = 'lighter'
    ctx.lineCap = 'round'

    for (const flash of this.flashes) {
      const r = 160 * this.scale * (1.4 - flash.life * 0.4)
      const glow = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, r)
      glow.addColorStop(0, withAlpha(flash.color, 0.55 * flash.life))
      glow.addColorStop(1, withAlpha(flash.color, 0))
      ctx.fillStyle = glow
      ctx.fillRect(flash.x - r, flash.y - r, r * 2, r * 2)
      flash.life -= 0.06 * dt
    }
    this.flashes = this.flashes.filter((f) => f.life > 0)

    for (const rocket of this.rockets) {
      rocket.trail.push({ x: rocket.x, y: rocket.y })
      if (rocket.trail.length > 10) rocket.trail.shift()
      rocket.x += rocket.vx * dt
      rocket.y += rocket.vy * dt
      rocket.vy += GRAVITY * dt
      // Fizz off the tail as it climbs.
      if (Math.random() < 0.6) {
        this.spark(rocket.x, rocket.y, Math.PI / 2 + (Math.random() - 0.5) * 0.8, Math.random() * 1.2, '#ffd9a0', {
          decay: 0.05,
          size: 1.3,
          trailLength: 2,
        })
      }
      ctx.strokeStyle = 'rgba(255, 230, 190, 0.9)'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.moveTo(rocket.trail[0].x, rocket.trail[0].y)
      for (const p of rocket.trail) ctx.lineTo(p.x, p.y)
      ctx.lineTo(rocket.x, rocket.y)
      ctx.stroke()
      if (rocket.vy >= -0.4) this.explode(rocket.x, rocket.y, rocket.shell, rocket.colors)
    }
    this.rockets = this.rockets.filter((r) => r.vy < -0.4)

    for (const s of this.sparks) {
      s.trail.push({ x: s.x, y: s.y })
      if (s.trail.length > s.trailLength) s.trail.shift()
      const drag = Math.pow(s.drag, dt)
      s.vx *= drag
      s.vy = s.vy * drag + s.gravity * dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= s.decay * dt

      const alpha = Math.max(0, s.life) * (s.twinkle ? (Math.random() < 0.5 ? 1 : 0.15) : 1)
      if (alpha <= 0) continue
      ctx.strokeStyle = withAlpha(s.color, alpha)
      ctx.lineWidth = s.size * this.scale * (0.6 + s.life * 0.4)
      ctx.beginPath()
      ctx.moveTo(s.trail[0].x, s.trail[0].y)
      for (const p of s.trail) ctx.lineTo(p.x, p.y)
      ctx.lineTo(s.x, s.y)
      ctx.stroke()
    }
    this.sparks = this.sparks.filter((s) => s.life > 0 && s.y < this.height + 40)

    this.frame = requestAnimationFrame(this.tick)
  }
}

const alphaCache = new Map<string, [number, number, number]>()

function withAlpha(color: string, alpha: number): string {
  let rgb = alphaCache.get(color)
  if (!rgb) {
    const hex = color.replace('#', '')
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
    rgb = [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
    alphaCache.set(color, rgb)
  }
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`
}
