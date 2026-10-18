<template>
  <section class="section" ref="sectionRef">
    <div class="section-header">
      <div>
        <h2 class="section-title">最新博文</h2>
        <p class="section-subtitle">成员的技术分享与学习笔记</p>
      </div>
      <a href="/blog/" class="btn btn-outline">查看全部 →</a>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div v-for="n in 3" :key="n" class="skeleton-card">
        <div class="skeleton-cover"></div>
        <div class="skeleton-body">
          <div class="skeleton-line skeleton-line--short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line--long"></div>
        </div>
      </div>
    </div>

    <div v-else-if="latestPosts.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p>还没有博文，快来写第一篇吧！</p>
    </div>
    <div v-else class="card-grid">
      <a v-for="(post, idx) in latestPosts" :key="post._id || idx" :href="post._fromApi || post._submitted ? '/blog/' : (post.url || '/blog/')" :class="['card', 'post-card', { 'is-submitted': post._submitted }]">
        <div class="card-cover" :style="{ background: coverGradient(idx) }">
          <span class="cover-emoji">{{ post.coverEmoji || coverEmoji(idx) }}</span>
        </div>
        <div class="card-body">
          <div class="post-tags">
            <span v-if="post._submitted" class="post-tag submitted-tag">投稿</span>
            <span v-for="tag in post.tags" :key="tag" class="post-tag" @click.prevent.stop="goTag(tag)">{{ tag }}</span>
          </div>
          <h3>{{ post.title }}</h3>
          <p>{{ post.description }}</p>
          <div class="post-meta">
            <span class="meta-author">{{ post.author }}</span><span class="meta-sep">·</span>
            <span class="meta-date">{{ post.date }}</span>
            <span class="meta-sep" v-if="post.readingTime">·</span>
            <span v-if="post.readingTime" class="reading-time">{{ post.readingTime }} 分钟阅读</span>
          </div>
        </div>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import { posts } from '../posts'
import type { Post } from '../posts'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { API_BASE as API_BASE_ROOT } from '../api/config'

const API_BASE = API_BASE_ROOT

const submittedPosts = ref<any[]>([])
const apiPosts = ref<any[]>([])
const sectionRef = ref<HTMLElement>()
const loading = ref(true)
const apiLoaded = ref(false)

/** Map a backend blog post object to the shape the component expects */
function mapApiPost(item: any) {
  const tags: string[] = typeof item.tags === 'string'
    ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : Array.isArray(item.tags)
      ? item.tags
      : []
  const content = item.content || ''
  const date = item.createdAt ? item.createdAt.slice(0, 10) : ''
  const slug = item.slug || ''
  return {
    _id: `api-${slug || item.id || Math.random().toString(36).slice(2)}`,
    title: item.title || '',
    slug,
    content,
    description: item.description || '',
    tags,
    author: item.authorName || '',
    coverEmoji: item.coverEmoji || '',
    status: item.status || '',
    viewCount: item.viewCount ?? 0,
    date,
    url: '',  // API posts link to /blog/ since .md files are separate
    readingTime: content ? Math.max(1, Math.round(content.replace(/[#*\->`|~\s]/g, '').length / 400)) : 1,
    _submitted: false,
    _fromApi: true,
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetch(API_BASE)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const items: any[] = Array.isArray(data) ? data : (data?.data || data?.posts || [])
    if (items.length > 0) {
      apiPosts.value = items.map(mapApiPost)
      apiLoaded.value = true
    }
  } catch {
    // apiLoaded stays false → fall back to static posts
  } finally {
    loading.value = false
  }
}

function loadLocalPosts() {
  try {
    const s = localStorage.getItem('turing-submitted-posts')
    if (s) submittedPosts.value = JSON.parse(s)
  } catch { /* localStorage unavailable */ }
}

const allPosts = computed(() => {
  const statics = apiLoaded.value
    ? apiPosts.value
    : posts.map(p => ({ ...p, _id: p.url, _submitted: false }))
  const submitted = submittedPosts.value.map(p => ({ ...p, _submitted: true, url: '' }))
  return [...statics, ...submitted].sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const latestPosts = computed(() => allPosts.value.slice(0, 6))

const COVERS = ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)','linear-gradient(135deg, #f093fb 0%, #f5576c 100%)','linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)','linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)','linear-gradient(135deg, #fa709a 0%, #fee140 100%)','linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)']
const EMOJIS = ['🦀','🐧','⚡','🔥','💻','🧠']
function coverGradient(idx:number){return COVERS[idx % COVERS.length]}
function coverEmoji(idx:number){return EMOJIS[idx % EMOJIS.length]}
function goTag(tag:string){window.location.href=`/blog/?tag=${encodeURIComponent(tag)}`}

function initAnimation() {
  if (!sectionRef.value) return
  const cards = sectionRef.value.querySelectorAll('.post-card')
  if (cards.length === 0) return
  gsap.from(cards, {
    y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: sectionRef.value, start: 'top 82%', toggleActions: 'play none none none' }
  })
}

onMounted(async () => {
  loadLocalPosts()
  await loadData()
  await nextTick()
  initAnimation()
})
</script>

<style scoped>
.section { padding: 3.5rem 0; }
.section-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.75rem; }
.section-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--vp-c-text-1); }
.section-subtitle { color: var(--vp-c-text-2); font-size: 1rem; margin: 0; }

/* Loading skeleton */
.loading-skeleton { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
.skeleton-card { background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-border); border-radius: 10px; overflow: hidden; }
.skeleton-cover { height: 120px; background: linear-gradient(90deg, var(--vp-c-bg-mute) 25%, var(--vp-c-bg-soft) 50%, var(--vp-c-bg-mute) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-body { padding: 18px 20px 16px; display: flex; flex-direction: column; gap: 0.6rem; }
.skeleton-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, var(--vp-c-bg-mute) 25%, var(--vp-c-bg-soft) 50%, var(--vp-c-bg-mute) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-line--short { width: 40%; }
.skeleton-line--long { width: 80%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.empty-state { text-align: center; padding: 3rem; color: var(--vp-c-text-3); background: var(--vp-c-bg-soft); border-radius: 8px; border: 1px dashed var(--vp-c-border); }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
.post-card { text-decoration: none; color: inherit; display: flex; flex-direction: column; overflow: hidden; padding: 0; transition: transform 0.25s ease, box-shadow 0.25s ease; }
.post-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(252,85,49,0.15); }
.card-cover { height: 120px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.cover-emoji { font-size: 2.8rem; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2)); transition: transform 0.3s ease; }
.post-card:hover .cover-emoji { transform: scale(1.15) rotate(-5deg); }
.card-cover::after { content:''; position:absolute; bottom:0; left:0; right:0; height:40px; background:linear-gradient(transparent,rgba(0,0,0,0.15)); }
.card-body { padding: 18px 20px 16px; flex:1; display:flex; flex-direction:column; }
.post-card.is-submitted { border-left: 3px solid #67c23a; }
.post-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
.post-tag { display: inline-block; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 3px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
.post-tag:hover { opacity: 0.75; }
.submitted-tag { background: rgba(103,194,58,0.12); color: #67c23a; font-weight: 600; cursor: default; }
.post-card h3 { margin: 0 0 0.4rem; font-size: 1.05rem; color: var(--vp-c-text-1); line-height: 1.5; }
.post-card p { color: var(--vp-c-text-2); font-size: 0.88rem; margin: 0 0 0.75rem; line-height: 1.6; flex: 1; }
.post-meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--vp-c-text-3); padding-top: 0.5rem; border-top: 1px solid var(--vp-c-border); }
.meta-author { font-weight: 600; color: var(--vp-c-brand-1); }
.meta-sep { color: var(--vp-c-text-3); }
.reading-time { color: var(--vp-c-text-3); font-size: 0.75rem; }
@media (max-width: 768px) { .section-header { flex-direction: column; align-items: flex-start; gap: 1rem; } .card-grid { grid-template-columns: 1fr; } .loading-skeleton { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .section { padding: 2rem 0; } .section-title { font-size: 1.35rem; } .card-cover { height: 100px; } .cover-emoji { font-size: 2.2rem; } .card-body { padding: 14px 16px 12px; } .post-card h3 { font-size: 0.98rem; } .section-header { gap: 0.5rem; } }
</style>