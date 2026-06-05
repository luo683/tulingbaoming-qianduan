<template>
  <section class="tagcloud-section" ref="sectionRef">
    <div class="section-header">
      <div>
        <h2 class="section-title">🏷️ 热门标签</h2>
        <p class="section-subtitle">探索你感兴趣的技术领域</p>
      </div>
      <a href="/blog/" class="btn btn-outline">浏览全部 →</a>
    </div>

    <!-- Empty state -->
    <div v-if="tags.length === 0" class="empty-state">
      <div class="empty-icon">🏷️</div>
      <p>还没有标签，发表博文后这里会展示热门标签</p>
    </div>

    <!-- Tag cloud -->
    <div v-else class="tagcloud-wrapper">
      <div class="tagcloud-bg"></div>
      <div class="tagcloud" ref="cloudRef">
        <a
          v-for="(tag, idx) in tags"
          :key="tag.name"
          :href="`/blog/?tag=${encodeURIComponent(tag.name)}`"
          class="cloud-tag"
          :class="`tier-${tag.tier}`"
          :style="{ animationDelay: `${idx * 0.06}s` }"
        >
          <span class="tag-icon">{{ tag.icon }}</span>
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count-badge">{{ tag.count }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import { posts } from '../posts'
import { gsap } from 'gsap'

const sectionRef = ref<HTMLElement>()
const cloudRef = ref<HTMLElement>()

// Category icons mapped to common tech keywords
const ICON_MAP: Record<string, string> = {
  'rust': '🦀', 'python': '🐍', 'javascript': '🟨', 'typescript': '🔷',
  '前端': '🎨', '后端': '⚙️', '系统编程': '💻', '操作系统': '🐧',
  'linux': '🐧', '数据库': '🗄️', '算法': '🧮', 'ai': '🤖',
  '机器学习': '🧠', '数学': '📐', 'c': '⚡', '性能优化': '🚀',
  '安全': '🔒', '网络': '🌐', '移动端': '📱', '游戏': '🎮',
  'devops': '🔄', '云原生': '☁️', '容器': '📦', '微服务': '🔧',
}

function getIcon(tag: string): string {
  const lower = tag.toLowerCase()
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key) || tag.includes(key)) return icon
  }
  const HASH_ICONS = ['📌', '🔖', '📋', '💡', '🎯', '⚡', '🔥', '🌟']
  const hash = tag.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return HASH_ICONS[hash % HASH_ICONS.length]
}

const tags = computed(() => {
  const counts: Record<string, number> = {}
  for (const post of posts) {
    for (const tag of post.tags) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return []

  const maxCount = entries[0][1]
  return entries.map(([name, count]) => {
    const ratio = count / maxCount
    let tier = 1
    if (ratio >= 0.7) tier = 3
    else if (ratio >= 0.4) tier = 2
    return { name, count, icon: getIcon(name), tier }
  })
})

onMounted(() => {
  nextTick(() => {
    if (!cloudRef.value || !sectionRef.value) return
    const tagEls = cloudRef.value.querySelectorAll('.cloud-tag')
    if (tagEls.length === 0) return

    // Set initial state
    gsap.set(tagEls, { scale: 0, opacity: 0, y: 20 })

    // Use IntersectionObserver for reliable triggering
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(tagEls, {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: 'back.out(2)',
          })
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sectionRef.value)
  })
})
</script>

<style scoped>
.tagcloud-section {
  padding: 3.5rem 0;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.75rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.25rem;
}

.section-subtitle {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  margin: 0;
}

/* === Empty state === */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 2px dashed var(--vp-c-border);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 0.95rem;
  margin: 0;
}

/* === Tag cloud wrapper === */
.tagcloud-wrapper {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
}

.tagcloud-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(252,85,49,0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(102,126,234,0.04) 0%, transparent 50%);
  pointer-events: none;
}

.tagcloud {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
  padding: 2rem 1.5rem;
}

/* === Tag items === */
.cloud-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 24px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

/* Tier 1 — small */
.cloud-tag.tier-1 {
  font-size: 0.78rem;
  padding: 0.35rem 0.7rem;
  opacity: 0.75;
}

/* Tier 2 — medium */
.cloud-tag.tier-2 {
  font-size: 0.88rem;
  padding: 0.45rem 0.95rem;
}

/* Tier 3 — large / popular */
.cloud-tag.tier-3 {
  font-size: 0.98rem;
  padding: 0.55rem 1.1rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  font-weight: 700;
  box-shadow: 0 2px 10px var(--vp-c-brand-soft);
}

.tag-icon {
  font-size: 1.1em;
  line-height: 1;
}

.tag-name {
  line-height: 1;
}

.tag-count-badge {
  font-size: 0.65em;
  background: var(--vp-c-brand-1);
  color: #fff;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.35em;
  font-weight: 700;
  line-height: 1;
}

/* Hover */
.cloud-tag:hover {
  transform: translateY(-3px);
  background: var(--vp-c-brand-1) !important;
  color: #fff !important;
  border-color: var(--vp-c-brand-1) !important;
  box-shadow: 0 6px 20px rgba(252,85,49,0.25);
  opacity: 1 !important;
}

.cloud-tag:hover .tag-count-badge {
  background: rgba(255,255,255,0.3);
}

/* === Responsive === */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .tagcloud {
    padding: 1.25rem 1rem;
    gap: 0.5rem;
  }
  .cloud-tag.tier-3 { font-size: 0.9rem; padding: 0.45rem 0.9rem; }
  .cloud-tag.tier-2 { font-size: 0.82rem; padding: 0.4rem 0.75rem; }
  .cloud-tag.tier-1 { font-size: 0.74rem; padding: 0.3rem 0.6rem; }
}
</style>