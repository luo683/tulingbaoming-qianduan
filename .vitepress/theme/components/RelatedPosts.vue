<template>
  <div v-if="related.length > 0" class="related-posts">
    <h3 class="related-title">相关文章</h3>
    <div class="related-grid">
      <a v-for="post in related" :key="post.url" :href="post.url" class="related-card">
        <div class="related-tags">
          <span v-for="tag in post.tags.slice(0, 2)" :key="tag" class="related-tag">{{ tag }}</span>
        </div>
        <h4>{{ post.title }}</h4>
        <div class="related-meta">
          <span>{{ post.date }}</span>
          <span class="dot">·</span>
          <span>阅读 {{ post.readingTime }} 分钟</span>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick } from 'vue'
import { posts } from '../posts'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const props = defineProps<{
  currentTitle: string
  currentTags: string[]
}>()

const related = computed(() => {
  return posts
    .filter(p => p.title !== props.currentTitle)
    .map(p => {
      const common = p.tags.filter(t => props.currentTags.includes(t)).length
      return { ...p, _score: common }
    })
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
})

onMounted(() => {
  nextTick(() => {
    if (document.querySelector('.related-posts')) {
      gsap.from('.related-card', {
        y: 25, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: '.related-posts', start: 'top 85%', toggleActions: 'play none none none' }
      })
    }
  })
})
</script>

<style scoped>
.related-posts {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-border);
}

.related-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 1rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.related-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 1rem 1.2rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.related-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(252, 85, 49, 0.08);
}

.related-tags {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.related-tag {
  font-size: 0.68rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.related-card h4 {
  margin: 0 0 0.5rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.related-meta {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dot {
  color: var(--vp-c-text-3);
}

@media (max-width: 500px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
