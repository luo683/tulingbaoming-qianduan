<template>
  <canvas ref="canvas" class="particles" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()

const canvas = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let animId = 0
let width = 0
let height = 0

// ── Config ─────────────────────────────
interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number
  alpha: number
  alphaSpeed: number
  hue: number
}

function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua)
  const cores = navigator.hardwareConcurrency || 4
  const memory = (navigator as any).deviceMemory || 8
  return isMobile || cores <= 2 || memory <= 4
}

const PERFORMANCE = isLowEndDevice()
const PARTICLE_COUNT = PERFORMANCE ? 40 : 100

let particles: Particle[] = []

function hsl(h: number, s: number, l: number, a: number = 1): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`
}

// ── Init ───────────────────────────────
function createParticles() {
  particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * Math.max(width, height) * 0.65
    particles.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2.5 + 0.8,
      alpha: Math.random(),
      alphaSpeed: 0.003 + Math.random() * 0.015,
      hue: 200 + Math.random() * 60, // blue ~ cyan range
    })
  }
}

// ── Resize ─────────────────────────────
function resize() {
  const c = canvas.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  c.width = width * dpr
  c.height = height * dpr
  c.style.width = width + 'px'
  c.style.height = height + 'px'
  if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr) }
}

function init() {
  resize()
  createParticles()
}

// ── Draw ───────────────────────────────
function bgColor(): string {
  // 跟随 VitePress 主题：深色 / 浅色
  return isDark.value ? '#0a0a1a' : '#f0f2f5'
}

function particleColor(alpha: number): string {
  // 深色主题：亮粒子；浅色主题：品牌色粒子
  return isDark.value
    ? `rgba(255, 255, 255, ${alpha})`
    : `rgba(252, 85, 49, ${alpha * 0.5})`
}

function drawBackground() {
  if (!ctx) return
  ctx.fillStyle = bgColor()
  ctx.fillRect(0, 0, width, height)

  // 中心微光
  const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) * 0.5)
  const glowColor = isDark.value ? '255, 255, 255' : '252, 85, 49'
  glow.addColorStop(0, `rgba(${glowColor}, 0.03)`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
}

function drawParticles() {
  if (!ctx) return
  const cx = width / 2
  const cy = height / 2

  for (const p of particles) {
    // 粒子绕中心缓慢旋转
    const dist = Math.hypot(p.x, p.y)
    const baseAngle = Math.atan2(p.y, p.x)
    const angle = baseAngle + 0.003 * (1 + dist * 0.0002)
    p.x = Math.cos(angle) * dist
    p.y = Math.sin(angle) * dist

    // 浮动（小幅漂移）
    p.y += p.vy
    p.x += p.vx

    // 边界反弹
    if (Math.abs(p.x) > Math.max(width, height) * 0.7) p.vx *= -1
    if (Math.abs(p.y) > Math.max(width, height) * 0.7) p.vy *= -1

    // 透明度呼吸
    p.alpha += p.alphaSpeed
    if (p.alpha > 1 || p.alpha < 0.15) p.alphaSpeed *= -1

    const sx = cx + p.x
    const sy = cy + p.y

    if (sx < -10 || sx > width + 10 || sy < -10 || sy > height + 10) continue

    // 粒子 glow
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.r * 4)
    const glowAlpha = p.alpha * 0.5
    g.addColorStop(0, particleColor(glowAlpha * 0.9))
    g.addColorStop(0.5, particleColor(glowAlpha * 0.2))
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(sx, sy, p.r * 4, 0, Math.PI * 2)
    ctx.fill()

    // 粒子核心
    ctx.fillStyle = particleColor(p.alpha * 0.8)
    ctx.beginPath()
    ctx.arc(sx, sy, p.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 连接线（近距离粒子之间）
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const d = Math.hypot(dx, dy)
      if (d < 60) {
        ctx.strokeStyle = particleColor((1 - d / 60) * 0.08)
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(cx + particles[i].x, cy + particles[i].y)
        ctx.lineTo(cx + particles[j].x, cy + particles[j].y)
        ctx.stroke()
      }
    }
  }
}

// ── Main loop ──────────────────────────
function draw() {
  if (!ctx || !canvas.value) return

  drawBackground()
  drawParticles()

  animId = requestAnimationFrame(draw)
}

// ── Theme change → repaint immediately ──
import { watch } from 'vue'
watch(isDark, () => {
  // 主题切换时立即重绘背景
  if (ctx && canvas.value) {
    drawBackground()
  }
})

// ── Events ─────────────────────────────
onMounted(() => {
  const c = canvas.value
  if (!c) return
  ctx = c.getContext('2d')
  init()
  draw()
  window.addEventListener('resize', () => { resize(); createParticles() })
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
})
</script>

<style scoped>
.particles {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  pointer-events: none;
  z-index: 0;
}
</style>
