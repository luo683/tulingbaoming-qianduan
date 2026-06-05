<template>
  <div class="blog-index">
    <div class="blog-header">
      <div>
        <h1 class="blog-page-title">📝 技术博客</h1>
        <p class="blog-page-desc">成员的技术分享与学习笔记，共计 {{ allPosts.length }} 篇</p>
      </div>
      <button class="btn-submit-post" @click="showForm = true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
        </svg>投稿文章
      </button>
    </div>
    <div class="toolbar">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="searchQuery" type="text" placeholder="搜索文章标题或描述..." class="search-input" />
      </div>
      <select v-model="sortBy" class="sort-select"><option value="date">按时间排序</option><option value="title">按标题排序</option></select>
    </div>
    <div class="tag-bar">
      <button class="tag-chip" :class="{ active: activeTag === null }" @click="setTag(null)">全部</button>
      <button v-for="tag in allTags" :key="tag" class="tag-chip" :class="{ active: activeTag === tag }" @click="setTag(tag)">{{ tag }}<span class="tag-count">{{ tagCounts[tag] }}</span></button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载文章中...</p>
    </div>

    <!-- Error banner (non-blocking: content still shows via fallback) -->
    <div v-if="error && !loading" class="error-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>无法从服务器加载最新文章，已展示本地缓存内容</span>
    </div>

    <div v-if="!loading" class="post-grid">
      <article v-for="(post, idx) in sortedPosts" :key="post._id || idx" class="blog-card" :class="{ 'is-submitted': post._submitted }" @click="openPost(post)">
        <div class="blog-card-cover" :style="{ background: coverGradient(idx) }"><span class="blog-card-emoji">{{ post.coverEmoji || coverEmoji(idx) }}</span></div>
        <div class="blog-card-body">
          <div class="blog-tags">
            <span v-if="post._submitted" class="blog-tag submitted-badge">投稿</span>
            <span v-for="tag in post.tags" :key="tag" class="blog-tag" @click.stop="setTag(tag)">{{ tag }}</span>
          </div>
          <h3 class="blog-title">{{ post.title }}</h3>
          <p class="blog-desc">{{ post.description }}</p>
          <div class="blog-meta">
            <span class="blog-author">{{ post.author }}</span><span class="dot">·</span><span>{{ post.date }}</span>
            <span class="dot" v-if="post.readingTime">·</span><span v-if="post.readingTime" class="reading-time">{{ post.readingTime }} 分钟</span>
            <button v-if="post._submitted" class="btn-del-post" @click.stop="removePost(post._id || idx)" title="删除投稿">✕</button>
          </div>
        </div>
      </article>
    </div>
    <p v-if="!loading && sortedPosts.length === 0 && !searchQuery" class="empty">该标签下暂无文章</p>
    <p v-if="!loading && sortedPosts.length === 0 && searchQuery" class="empty">没有找到匹配的文章</p>

    <Teleport to="body">
      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal-panel">
          <div class="modal-header"><h2>投稿文章</h2><button class="modal-close" @click="showForm = false">&times;</button></div>
          <form class="modal-body" @submit.prevent="submitPost">
            <label class="form-field"><span class="field-label">文章标题 <em>*</em></span><input v-model="form.title" type="text" required placeholder="给你的文章起个标题" class="field-input" /></label>
            <div class="form-row">
              <label class="form-field"><span class="field-label">作者 <em>*</em></span><input v-model="form.author" type="text" required placeholder="你的名字" class="field-input" /></label>
              <label class="form-field"><span class="field-label">标签（用逗号分隔）</span><input v-model="form.tagsStr" type="text" placeholder="例如：Python, 入门, AI" class="field-input" /></label>
            </div>
            <label class="form-field"><span class="field-label">简介 <em>*</em></span><input v-model="form.description" type="text" required placeholder="一句话描述文章内容" class="field-input" /></label>
            <label class="form-field"><span class="field-label">正文（Markdown 格式）<em>*</em></span><textarea v-model="form.content" required rows="10" placeholder="支持 Markdown 语法" class="field-input field-textarea" /></label>
            <div class="form-actions"><button type="button" class="btn-cancel" @click="showForm = false">取消</button><button type="submit" class="btn-publish">发布文章</button></div>
          </form>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="readingPost" class="modal-overlay" @click.self="readingPost = null">
        <div class="modal-panel modal-read">
          <div class="modal-header"><h2>{{ readingPost.title }}</h2><button class="modal-close" @click="readingPost = null">&times;</button></div>
          <div class="modal-body read-body">
            <div class="read-meta"><span>{{ readingPost.author }}</span><span class="dot">·</span><span>{{ readingPost.date }}</span><span v-if="readingPost.tags && readingPost.tags.length">·</span><span v-for="tag in readingPost.tags" :key="tag" class="read-tag">{{ tag }}</span></div>
            <div class="read-content-wrapper" :class="{ 'content-locked': !showFullContent }">
              <div class="read-content" v-html="readingPost._rendered" />
              <div v-if="!showFullContent" class="lock-overlay">
                <div class="lock-card">
                  <div class="lock-icon">🔒</div>
                  <h3>登录后阅读全文</h3>
                  <p>登录图灵学社即可查看完整文章内容</p>
                  <button class="btn-join" @click.stop=";(window as any).__openLogin?.()">👤 立即登录</button>
                </div>
              </div>
            </div>
            <div class="read-footer"><span v-if="readingPost._submitted" class="submitted-note">※ 此为用户投稿内容，仅保存在本地浏览器中</span><span v-if="readingPost._fromApi && !readingPost._submitted" class="submitted-note">※ 此文章来自服务器数据库</span></div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { posts } from '../posts'
import type { Post } from '../posts'
import { useAuth } from '../auth'

const auth = useAuth()
const props = defineProps<{ posts?: Post[] }>()

const API_BASE = 'http://192.168.2.120:8080/api/blog/posts'

// --- Reactive state ---
const activeTag = ref<string | null>(null)
const submittedPosts = ref<any[]>([])
const apiPosts = ref<any[]>([])
const showForm = ref(false)
const readingPost = ref<any>(null)
const searchQuery = ref('')
const sortBy = ref('date')
const form = ref({ title:'', author:'', tagsStr:'', description:'', content:'' })
const loading = ref(true)
const error = ref<string | null>(null)
const apiLoaded = ref(false)

// --- Constants ---
const COVERS = ['linear-gradient(135deg, #667eea 0%, #764ba2 100%)','linear-gradient(135deg, #f093fb 0%, #f5576c 100%)','linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)','linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)','linear-gradient(135deg, #fa709a 0%, #fee140 100%)','linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)']
const EMOJIS = ['🦀','🐧','⚡','🧠','🔥','💻']
function coverGradient(idx:number){return COVERS[idx % COVERS.length]}
function coverEmoji(idx:number){return EMOJIS[idx % EMOJIS.length]}

// --- Auth-based computed ---

const showFullContent = computed(() => auth.isLoggedIn.value)

/** API posts with content truncated to 200 chars for unauthenticated visitors */
const displayApiPosts = computed(() => {
  if (auth.isLoggedIn.value) return apiPosts.value
  return apiPosts.value.map(p => ({
    ...p,
    content: p.content && p.content.length > 200
      ? p.content.substring(0, 200) + '...'
      : p.content
  }))
})

// --- API helpers ---

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
    url: slug ? `/blog/${slug}` : '',
    readingTime: content ? Math.max(1, Math.round(content.replace(/[#*\->`|~\s]/g, '').length / 400)) : 1,
    _submitted: false,
    _fromApi: true,
  }
}

// --- Data loading ---

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(API_BASE)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const items: any[] = Array.isArray(data) ? data : (data?.data || data?.posts || [])
    if (items.length > 0) {
      apiPosts.value = items.map(mapApiPost)
      apiLoaded.value = true
    }
  } catch (e: any) {
    error.value = e.message || '加载失败'
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

function saveLocalPosts() {
  try { localStorage.setItem('turing-submitted-posts', JSON.stringify(submittedPosts.value)) } catch { /* quota exceeded or unavailable */ }
}

// --- Computed ---

const allPosts = computed(() => {
  const statics = apiLoaded.value
    ? displayApiPosts.value
    : (props.posts || posts).map(p => ({ ...p, _id: p.url, _submitted: false }))
  const submitted = submittedPosts.value.map(p => ({ ...p, _submitted: true, url: '' }))
  return [...statics, ...submitted].sort((a:any,b:any) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const allTags = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of allPosts.value) { for (const tag of p.tags) { counts[tag] = (counts[tag] || 0) + 1 } }
  return Object.entries(counts).sort((a,b) => b[1] - a[1]).map(([tag]) => tag)
})

const tagCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of allPosts.value) { for (const tag of p.tags) { counts[tag] = (counts[tag] || 0) + 1 } }
  return counts
})

const filteredPosts = computed(() => {
  let result = allPosts.value
  if (activeTag.value) result = result.filter(p => p.tags.includes(activeTag.value!))
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) }
  return result
})

const sortedPosts = computed(() => {
  const items = [...filteredPosts.value]
  if (sortBy.value === 'title') items.sort((a,b) => a.title.localeCompare(b.title, 'zh'))
  return items
})

// --- Actions ---

function setTag(tag:string|null){activeTag.value = tag}

function openPost(post:any){
  // Navigate to VitePress page for static .md posts; show modal for API / submitted posts
  if (!post._submitted && !post._fromApi && post.url){window.location.href = post.url; return}
  const content = post.content || ''
  const rendered = content.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^- (.+)$/gm,'<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g,'<ul>$&</ul>').replace(/\n\n/g,'</p><p>').replace(/^(?!<[hul])/gm,'<p>')
  readingPost.value = { ...post, _rendered: rendered }
}

async function submitPost(){
  if (!auth.isLoggedIn.value) {
    ;(window as any).__openLogin?.()
    return
  }
  const tags = form.value.tagsStr.split(/[,，]/).map((t:string) => t.trim()).filter(Boolean)
  const postData = {
    title: form.value.title,
    content: form.value.content,
    description: form.value.description,
    tags: tags.join(','),
    authorName: form.value.author,
    coverEmoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  }

  // Try the API first
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })
    if (res.ok) {
      await loadData()
      showForm.value = false; form.value = { title:'', author:'', tagsStr:'', description:'', content:'' }
      return
    }
  } catch { /* API unavailable — fall through to localStorage */ }

  // Fallback: save locally
  const newPost = {
    _id: `submitted-${Date.now()}`,
    title: form.value.title,
    author: form.value.author,
    tags,
    description: form.value.description,
    content: form.value.content,
    date: new Date().toISOString().slice(0,10),
    readingTime: Math.max(1, Math.round(form.value.content.replace(/[#*\->`|~\s]/g,'').length / 400)),
  }
  submittedPosts.value.unshift(newPost)
  saveLocalPosts()
  showForm.value = false; form.value = { title:'', author:'', tagsStr:'', description:'', content:'' }
}

function removePost(id:string){
  submittedPosts.value = submittedPosts.value.filter(p => p._id !== id)
  saveLocalPosts()
}

// --- Lifecycle ---
onMounted(() => {
  loadLocalPosts()
  loadData()
})

if (typeof window !== 'undefined') { const params = new URLSearchParams(window.location.search); const tagParam = params.get('tag'); if (tagParam) activeTag.value = tagParam }
</script>

<style scoped>
.blog-index { max-width: 960px; margin: 0 auto; }
.blog-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 1.5rem; }
.blog-page-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.25rem; color: var(--vp-c-text-1); }
.blog-page-desc { color: var(--vp-c-text-2); font-size: 0.92rem; margin: 0; }
.btn-submit-post { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border-radius: 6px; border: 1px solid var(--vp-c-brand-1); background: transparent; color: var(--vp-c-brand-1); font-size: 0.85rem; cursor: pointer; font-family: inherit; transition: all 0.2s; white-space: nowrap; }
.btn-submit-post:hover { background: var(--vp-c-brand-soft); }
.toolbar { display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center; }
.search-box { flex: 1; position: relative; }
.search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--vp-c-text-3); pointer-events: none; }
.search-input { width: 100%; padding: 0.5rem 1rem 0.5rem 2.25rem; border: 1px solid var(--vp-c-border); border-radius: 6px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font-size: 0.88rem; outline: none; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s; }
.search-input:focus { border-color: var(--vp-c-brand-1); box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }
.sort-select { padding: 0.5rem 0.75rem; border: 1px solid var(--vp-c-border); border-radius: 6px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font-size: 0.85rem; cursor: pointer; font-family: inherit; outline: none; }
.tag-bar { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.tag-chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.75rem; border-radius: 20px; border: 1px solid var(--vp-c-border); background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); font-size: 0.8rem; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.tag-chip:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.tag-chip.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }
.tag-count { font-size: 0.65rem; opacity: 0.7; }

/* Loading / Error states */
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 0; gap: 0.75rem; color: var(--vp-c-text-3); }
.loading-spinner { width: 32px; height: 32px; border: 3px solid var(--vp-c-border); border-top-color: var(--vp-c-brand-1); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-banner { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; margin-bottom: 1rem; border-radius: 6px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); color: var(--vp-c-text-2); font-size: 0.82rem; }

.post-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
.blog-card { background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-border); border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; }
.blog-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px var(--vp-c-brand-soft); border-color: var(--vp-c-brand-1); }
.blog-card.is-submitted { border-left: 3px solid #67c23a; }
.blog-card-cover { height: 100px; display: flex; align-items: center; justify-content: center; }
.blog-card-emoji { font-size: 2.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); transition: transform 0.3s ease; }
.blog-card:hover .blog-card-emoji { transform: scale(1.2) rotate(-5deg); }
.blog-card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.blog-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.blog-tag { font-size: 0.68rem; padding: 0.12rem 0.45rem; border-radius: 3px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 500; transition: opacity 0.15s; }
.blog-tag:hover { opacity: 0.75; }
.submitted-badge { background: rgba(103,194,58,0.12); color: #67c23a; }
.blog-title { font-size: 1rem; margin: 0 0 0.35rem; color: var(--vp-c-text-1); line-height: 1.5; }
.blog-desc { font-size: 0.84rem; color: var(--vp-c-text-2); line-height: 1.6; margin: 0 0 0.75rem; flex: 1; }
.blog-meta { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--vp-c-text-3); padding-top: 0.5rem; border-top: 1px solid var(--vp-c-border); }
.blog-author { font-weight: 600; color: var(--vp-c-brand-1); }
.dot { color: var(--vp-c-text-3); }
.reading-time { color: var(--vp-c-text-3); }
.btn-del-post { margin-left: auto; padding: 0.15rem 0.45rem; border-radius: 3px; border: 1px solid transparent; background: transparent; color: var(--vp-c-text-3); font-size: 0.7rem; cursor: pointer; font-family: inherit; }
.btn-del-post:hover { border-color: #f56c6c; color: #f56c6c; }
.empty { text-align: center; padding: 3rem; color: var(--vp-c-text-3); font-size: 0.95rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal-panel { background: var(--vp-c-bg); border-radius: 10px; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
.modal-read { max-width: 780px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid var(--vp-c-border); position: sticky; top: 0; background: var(--vp-c-bg-soft); z-index: 1; }
.modal-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--vp-c-text-1); }
.modal-close { width: 32px; height: 32px; border-radius: 4px; border: none; background: transparent; color: var(--vp-c-text-2); font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: var(--vp-c-bg-mute); }
.modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 0.35rem; }
.field-label { font-size: 0.85rem; font-weight: 500; color: var(--vp-c-text-1); }
.field-label em { color: var(--vp-c-brand-1); font-style: normal; }
.field-input { padding: 0.5rem 0.75rem; border: 1px solid var(--vp-c-border); border-radius: 4px; background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 0.9rem; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
.field-input:focus { border-color: var(--vp-c-brand-1); box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }
.field-textarea { resize: vertical; min-height: 200px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
.btn-cancel { padding: 0.5rem 1.25rem; border-radius: 4px; border: 1px solid var(--vp-c-border); background: var(--vp-c-bg); color: var(--vp-c-text-2); font-size: 0.88rem; cursor: pointer; font-family: inherit; }
.btn-cancel:hover { border-color: var(--vp-c-text-3); }
.btn-publish { padding: 0.5rem 1.5rem; border-radius: 4px; border: none; background: var(--vp-c-brand-1); color: #fff; font-size: 0.88rem; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-publish:hover { background: var(--vp-c-brand-2); }
.read-body { gap: 0; }

/* Reading content wrapper & lock overlay */
.read-content-wrapper { position: relative; }
.content-locked .read-content {
  max-height: 200px;
  overflow: hidden;
}
.lock-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 200px;
  background: linear-gradient(transparent, var(--vp-c-bg) 70%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2rem;
}
.lock-card {
  text-align: center;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
.lock-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.lock-card h3 { margin: 0 0 0.5rem; font-size: 1rem; }
.lock-card p { color: var(--vp-c-text-3); font-size: 0.85rem; margin: 0 0 1rem; }
.btn-join { padding: 0.5rem 1.5rem; border-radius: 6px; border: none; background: var(--vp-c-brand-1); color: #fff; font-size: 0.9rem; cursor: pointer; font-family: inherit; }
.btn-join:hover { background: var(--vp-c-brand-2); }

.read-meta { font-size: 0.85rem; color: var(--vp-c-text-3); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.read-tag { font-size: 0.72rem; padding: 0.1rem 0.5rem; border-radius: 3px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.read-content :deep(h1){font-size:1.5rem;margin:1.5rem 0 0.75rem;color:var(--vp-c-text-1)}
.read-content :deep(h2){font-size:1.2rem;margin:1.25rem 0 0.5rem;color:var(--vp-c-text-1)}
.read-content :deep(h3){font-size:1.05rem;margin:1rem 0 0.5rem;color:var(--vp-c-text-1)}
.read-content :deep(p){font-size:0.92rem;line-height:1.8;color:var(--vp-c-text-2);margin:0 0 0.75rem}
.read-content :deep(code){font-size:0.85em;background:var(--vp-c-bg-mute);color:var(--vp-c-brand-1);padding:0.1rem 0.35rem;border-radius:3px}
.read-content :deep(pre){background:var(--vp-c-bg-mute);border:1px solid var(--vp-c-border);border-radius:6px;padding:1rem 1.25rem;overflow-x:auto;margin:1rem 0}
.read-content :deep(pre code){background:none;color:var(--vp-c-text-1);padding:0;font-size:0.85rem;line-height:1.7}
.read-content :deep(blockquote){border-left:3px solid var(--vp-c-brand-1);padding:0.5rem 1rem;margin:0.75rem 0;background:var(--vp-c-brand-soft);border-radius:0 4px 4px 0}
.read-content :deep(blockquote p){margin:0}
.read-content :deep(ul),.read-content :deep(ol){padding-left:1.5rem;margin:0.5rem 0}
.read-content :deep(li){font-size:0.92rem;line-height:1.7;color:var(--vp-c-text-2)}
.read-content :deep(hr){border:none;border-top:1px solid var(--vp-c-border);margin:1.5rem 0}
.read-content :deep(img){max-width:100%;border-radius:6px;margin:0.75rem 0}
.read-content :deep(a){color:var(--vp-c-brand-1)}
.read-footer{margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--vp-c-border)}
.submitted-note{font-size:0.82rem;color:var(--vp-c-text-3)}
@media(max-width:768px){.blog-header{flex-direction:column;align-items:flex-start;gap:0.75rem}.toolbar{flex-direction:column}.form-row{grid-template-columns:1fr}.modal-read{max-width:100%;border-radius:0;max-height:100vh}.post-grid{grid-template-columns:1fr}}
@media(max-width:480px){.blog-page-title{font-size:1.35rem}.blog-card-cover{height:80px}.blog-card-emoji{font-size:1.8rem}.blog-card-body{padding:12px}.blog-title{font-size:0.92rem}.blog-desc{font-size:0.8rem}.modal-panel{border-radius:6px}.modal-header{padding:0.75rem 1rem}.modal-body{padding:1rem}.read-content :deep(h1){font-size:1.3rem}.read-content :deep(h2){font-size:1.1rem}.read-content :deep(pre){padding:0.75rem;font-size:0.78rem}.btn-submit-post{font-size:0.8rem;padding:0.35rem 0.75rem}}
</style>