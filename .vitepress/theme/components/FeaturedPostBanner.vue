<template>
  <section class="featured-section" ref="sectionRef">
    <div class="section-header">
      <div>
        <h2 class="section-title">🔥 精选文章</h2>
        <p class="section-subtitle">不容错过的优质内容</p>
      </div>
      <a href="/blog/" class="btn btn-outline">更多文章 →</a>
    </div>
    <div v-if="!featured" class="empty-state">暂无精选文章</div>
    <a v-else :href="featured.url" class="featured-banner">
      <div class="banner-visual">
        <div class="banner-emoji">{{ bannerIcon }}</div>
        <div class="banner-glow"></div>
      </div>
      <div class="banner-content">
        <div class="banner-badge">📌 编辑精选</div>
        <h3>{{ featured.title }}</h3>
        <p>{{ featured.description }}</p>
        <div class="banner-tags">
          <span v-for="tag in featured.tags" :key="tag" class="banner-tag">{{ tag }}</span>
        </div>
        <div class="banner-meta">
          <span class="banner-author">{{ featured.author }}</span><span>·</span>
          <span>{{ featured.date }}</span><span>·</span>
          <span>{{ featured.readingTime }} 分钟阅读</span>
        </div>
      </div>
    </a>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import { posts } from '../posts'
import { gsap } from 'gsap'

const sectionRef = ref<HTMLElement>()
const featured = computed(() => posts.length > 0 ? posts[0] : null)
const BANNER_ICONS = ['🚀', '💡', '🎯', '🔬', '⚙️']
const bannerIcon = computed(() => {
  if (!featured.value) return '📝'
  const hash = featured.value.title.split('').reduce((s:number,c:string) => s + c.charCodeAt(0), 0)
  return BANNER_ICONS[hash % BANNER_ICONS.length]
})

onMounted(() => {
  nextTick(() => {
    if (!sectionRef.value) return
    gsap.from(sectionRef.value.querySelector('.featured-banner'), {
      y: 30, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.value, start: 'top 85%', toggleActions: 'play none none none' },
    })
  })
})
</script>

<style scoped>
.featured-section { padding: 3rem 0; }
.section-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.5rem; }
.section-title { font-size: 1.75rem; font-weight: 700; color: var(--vp-c-text-1); margin-bottom: 0.25rem; }
.section-subtitle { color: var(--vp-c-text-2); font-size: 1rem; margin: 0; }
.empty-state { text-align: center; padding: 2rem; color: var(--vp-c-text-3); background: var(--vp-c-bg-soft); border-radius: 8px; }
.featured-banner { display: flex; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-border); border-radius: 12px; overflow: hidden; text-decoration: none; color: inherit; transition: all 0.3s ease; }
.featured-banner:hover { border-color: var(--vp-c-brand-1); box-shadow: 0 8px 32px var(--vp-c-brand-soft); transform: translateY(-2px); }
.banner-visual { width: 200px; min-width: 200px; background: linear-gradient(135deg, #ff6b4a 0%, #fc5531 50%, #e64a2e 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.banner-emoji { font-size: 3.5rem; position: relative; z-index: 1; animation: float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
.banner-glow { position: absolute; width: 150px; height: 150px; background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.banner-content { padding: 1.5rem 2rem; flex: 1; display: flex; flex-direction: column; }
.banner-badge { display: inline-block; font-size: 0.78rem; font-weight: 600; color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); padding: 0.2rem 0.7rem; border-radius: 4px; margin-bottom: 0.75rem; width: fit-content; }
.banner-content h3 { font-size: 1.3rem; margin: 0 0 0.5rem; color: var(--vp-c-text-1); line-height: 1.5; }
.banner-content p { color: var(--vp-c-text-2); font-size: 0.92rem; margin: 0 0 0.75rem; line-height: 1.7; }
.banner-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.banner-tag { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 3px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.banner-meta { margin-top: auto; font-size: 0.8rem; color: var(--vp-c-text-3); display: flex; align-items: center; gap: 0.5rem; }
.banner-author { font-weight: 600; color: var(--vp-c-brand-1); }
@media (max-width: 768px) { .featured-banner { flex-direction: column; } .banner-visual { width: 100%; min-width: unset; height: 100px; } .banner-emoji { font-size: 2.5rem; } .banner-content { padding: 1.25rem; } .section-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; } }
@media (max-width: 480px) { .section-title { font-size: 1.35rem; } .banner-visual { height: 80px; } .banner-emoji { font-size: 2rem; } .banner-content { padding: 1rem; } .banner-content h3 { font-size: 1.1rem; } .banner-content p { font-size: 0.85rem; } }
</style>