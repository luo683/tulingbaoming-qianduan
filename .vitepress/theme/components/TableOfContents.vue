<template>
  <aside v-if="headings.length > 0" class="toc-sidebar">
    <div class="toc-header">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
      <span>目录</span>
    </div>
    <nav class="toc-nav">
      <a
        v-for="h in headings"
        :key="h.id"
        :href="`#${h.id}`"
        :class="['toc-link', `toc-level-${h.level}`, { active: activeId === h.id }]"
        @click.prevent="scrollTo(h.id)"
      >
        {{ h.text }}
      </a>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'

interface Heading {
  id: string
  text: string
  level: number
}

const headings = ref<Heading[]>([])
const activeId = ref('')
let observer: IntersectionObserver | null = null

function collectHeadings() {
  const article = document.querySelector('.vp-doc') || document.querySelector('article')
  if (!article) return
  const els = article.querySelectorAll('h2, h3, h4')
  headings.value = Array.from(els)
    .filter((el): el is HeadingElement => {
      if (!el.id && !el.textContent) return false
      if (!el.id) el.id = el.textContent!.trim().replace(/\s+/g, '-').toLowerCase()
      return true
    })
    .map(el => ({
      id: el.id,
      text: el.textContent!.trim(),
      level: Number(el.tagName.charAt(1)),
    }))
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function observeHeadings() {
  observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  )
  headings.value.forEach(h => {
    const el = document.getElementById(h.id)
    if (el) observer!.observe(el)
  })
}

onMounted(() => {
  collectHeadings()
  if (headings.value.length > 0) {
    observeHeadings()
  }
  nextTick(() => {
    gsap.from('.toc-sidebar', { x: 20, opacity: 0, duration: 0.6, ease: 'power2.out' })
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.toc-sidebar {
  position: fixed;
  top: 100px;
  right: calc((100vw - var(--vp-layout-max-width, 1440px)) / 2 + 24px);
  width: 220px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  z-index: 10;
}

.toc-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-border);
}

.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toc-link {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  text-decoration: none;
  padding: 3px 0 3px 12px;
  border-left: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-link:hover {
  color: var(--vp-c-text-2);
}

.toc-link.active {
  color: var(--vp-c-brand-1);
  border-left-color: var(--vp-c-brand-1);
  font-weight: 500;
}

.toc-level-3 {
  padding-left: 24px;
}

.toc-level-4 {
  padding-left: 36px;
  font-size: 0.75rem;
}

/* 平板：缩小侧边栏 */
@media (max-width: 1280px) and (min-width: 1025px) {
  .toc-sidebar {
    width: 180px;
    right: calc((100vw - min(var(--vp-layout-max-width, 1440px), 100vw)) / 2 + 16px);
    top: 90px;
    max-height: calc(100vh - 130px);
  }
  .toc-header {
    font-size: 0.78rem;
  }
  .toc-link {
    font-size: 0.75rem;
  }
}

/* 手机/小平板：隐藏 */
@media (max-width: 1024px) {
  .toc-sidebar {
    display: none;
  }
}
</style>
