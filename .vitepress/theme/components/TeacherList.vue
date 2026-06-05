<template>
  <div class="teacher-page">

    <!-- Loading -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error -->
    <div v-else-if="error" class="error">
      ❌ 加载失败 <button @click="loadData">重试</button>
    </div>

    <!-- Content -->
    <template v-else>
      <div class="teacher-grid">
        <div
          v-for="(teacher, idx) in teachersWithGradient"
          :key="teacher.name"
          class="teacher-card"
          :ref="el => { if (el) cardRefs[idx] = el }"
        >
          <div class="card-left">
            <div class="avatar-frame">
              <div class="avatar-inner" :style="{ background: teacher.gradient }">
                <span class="avatar-text">{{ teacher.name[0] }}</span>
              </div>
              <div class="avatar-ring" />
            </div>
          </div>

          <div class="card-right">
            <div class="t-header">
              <h3 class="t-name">{{ teacher.name }}</h3>
              <span class="t-title">{{ teacher.title }}</span>
            </div>
            <p class="t-dept">{{ teacher.dept }}</p>

            <blockquote v-if="teacher.quote" class="t-quote">
              « {{ teacher.quote }} »
            </blockquote>

            <p v-if="teacher.research" class="t-research">{{ teacher.research }}</p>

            <div v-if="teacher.tags.length" class="t-tags">
              <span v-for="tag in teacher.tags" :key="tag" class="t-tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface Teacher {
  name: string
  title: string
  dept: string
  quote: string
  research: string
  tags: string[]
  gradient?: string
}

interface ApiTeacher {
  name: string
  title: string
  dept: string
  quote: string
  research: string
  tags: string
  avatarGradient?: string
  sortOrder: number
}

// 自动分配渐变色
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
]

const loading = ref(true)
const error = ref(false)
const teachersWithGradient = ref<Teacher[]>([])
const cardRefs = ref<Record<number, HTMLElement>>({})

function runAnimations() {
  nextTick(() => {
    // 标题渐入
    gsap.from('.teacher-section-title', {
      y: -20, opacity: 0, duration: 0.5, ease: 'power2.out'
    })
    gsap.from('.teacher-section-sub', {
      y: -10, opacity: 0, duration: 0.5, delay: 0.1, ease: 'power2.out'
    })

    // 卡片依次弹出
    Object.values(cardRefs.value).forEach((el, i) => {
      if (!el) return
      gsap.from(el, {
        y: 40,
        opacity: 0,
        scale: 0.95,
        duration: 0.6,
        delay: i * 0.15,
        ease: 'back.out(1.3)',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      })
    })
  })
}

async function loadData() {
  loading.value = true
  error.value = false
  try {
    const res = await fetch('http://localhost:8080/api/teachers')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: ApiTeacher[] = await res.json()

    const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder)
    teachersWithGradient.value = sorted.map((t, i) => ({
      name: t.name,
      title: t.title,
      dept: t.dept,
      quote: t.quote || '',
      research: t.research || '',
      tags: t.tags ? t.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      gradient: t.avatarGradient || GRADIENTS[i % GRADIENTS.length],
    }))

    loading.value = false
    runAnimations()
  } catch (e) {
    loading.value = false
    error.value = true
    console.error('Failed to fetch teachers:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.teacher-page {
  margin: 1.5rem 0;
}

/* ── 加载 / 错误状态 ── */
.loading,
.error {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
}

.error button {
  margin-left: 0.75rem;
  padding: 0.35rem 1rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.error button:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.teacher-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── 卡片 ── */
.teacher-card {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
}

.dark .teacher-card {
  background: rgba(30, 30, 50, 0.6);
}

.teacher-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.3s;
}

.teacher-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(252, 85, 49, 0.1);
  border-color: var(--vp-c-brand-1);
}

.teacher-card:hover::before {
  opacity: 1;
}

/* ── 左侧头像 ── */
.card-left {
  flex-shrink: 0;
}

.avatar-frame {
  position: relative;
  width: 100px;
  height: 100px;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.avatar-text {
  color: #fff;
  font-size: 2.4rem;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid var(--vp-c-brand-1);
  opacity: 0.3;
  animation: ring-pulse 3s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.08); opacity: 0.6; }
}

/* ── 右侧信息 ── */
.card-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.t-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.t-name {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.t-title {
  font-size: 0.88rem;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  background: var(--vp-c-brand-soft);
  padding: 0.15rem 0.6rem;
  border-radius: 4px;
}

.t-dept {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  margin: 0 0 0.75rem;
}

.t-quote {
  margin: 0 0 0.75rem;
  padding: 0.5rem 1rem;
  border-left: 3px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border-radius: 0 6px 6px 0;
  font-size: 0.95rem;
  font-style: italic;
  color: var(--vp-c-text-2);
  line-height: 1.7;
}

.t-research {
  margin: 0 0 0.75rem;
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.t-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.t-tag {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-brand-1);
  font-weight: 500;
  border: 1px solid var(--vp-c-border);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .teacher-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
    padding: 1.5rem;
  }

  .avatar-frame {
    width: 80px;
    height: 80px;
  }

  .avatar-text {
    font-size: 2rem;
  }

  .t-header {
    justify-content: center;
  }

  .t-name {
    font-size: 1.2rem;
  }

  .t-quote {
    text-align: center;
  }

  .t-tags {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .teacher-card {
    padding: 1.25rem 1rem;
    border-radius: 12px;
  }

  .avatar-frame {
    width: 64px;
    height: 64px;
  }

  .avatar-text {
    font-size: 1.6rem;
  }

  .t-name {
    font-size: 1.1rem;
  }

  .t-title {
    font-size: 0.78rem;
  }

  .t-dept {
    font-size: 0.78rem;
  }

  .t-quote {
    font-size: 0.88rem;
    padding: 0.4rem 0.75rem;
  }

  .t-research {
    font-size: 0.82rem;
  }
}
</style>
