<template>
  <div class="resource-page">
    <!-- Loading -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error -->
    <div v-if="error" class="error">❌ 加载失败 <button @click="loadData">重试</button></div>

    <!-- Toolbar: search + upload -->
    <div v-if="!loading" class="resource-toolbar">
      <div class="toolbar-row">
        <div class="resource-search">
          <input
            v-model="search"
            type="text"
            placeholder="搜索资源名称或描述..."
            class="search-input"
          />
        </div>
        <button class="btn-upload" @click="showForm = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          上传资源
        </button>
      </div>
      <div class="category-bar">
        <button
          class="cat-chip"
          :class="{ active: activeCat === null }"
          @click="activeCat = null"
        >全部</button>
        <button
          v-for="cat in categories"
          :key="cat"
          class="cat-chip"
          :class="{ active: activeCat === cat }"
          @click="activeCat = cat"
        >{{ cat }}</button>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="!loading" class="resource-count">
      共 <strong>{{ filteredResources.length }}</strong> 个资源
      <span v-if="activeCat"> · 分类：{{ activeCat }}</span>
      <span v-if="search"> · 搜索：{{ search }}</span>
      <span v-if="userResources.length > 0"> · 其中 <strong>{{ userResources.length }}</strong> 个来自社区上传</span>
    </div>

    <!-- Resource grid -->
    <div v-if="!loading && filteredResources.length > 0" class="resource-grid">
      <div v-for="res in filteredResources" :key="res._id" class="resource-card" :class="{ 'is-user': res._user }">
        <div class="res-header">
          <span class="res-icon">{{ fileIcon(res.fileType) }}</span>
          <div class="res-header-right">
            <span v-if="res._user" class="res-user-badge">社区</span>
            <span class="res-category">{{ res.category }}</span>
          </div>
        </div>
        <h3 class="res-title">{{ res.title }}</h3>
        <p class="res-desc">{{ res.description }}</p>
        <div class="res-meta">
          <span v-if="res.resourceType" class="res-type-badge">{{ res.resourceType }}</span>
          <span>{{ res.fileType }}</span>
          <span v-if="res.fileSize" class="res-sep">·</span>
          <span v-if="res.fileSize">{{ res.fileSize }}</span>
          <span class="res-sep">·</span>
          <span>{{ res.date }}</span>
        </div>
        <div class="res-actions">
          <!-- Download button: locked for unauthenticated users -->
          <a
            v-if="auth.isLoggedIn.value"
            :href="res.link"
            target="_blank"
            class="btn-download"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            网盘下载
          </a>
          <a
            v-else
            href="#"
            class="btn-download locked"
            @click.prevent="openLoginIfNeeded"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            🔒 登录后下载
          </a>
          <button
            v-if="res.code && auth.isLoggedIn.value"
            class="btn-code"
            :class="{ copied: copiedCode === res.code }"
            @click="copyCode(res.code!)"
          >
            {{ copiedCode === res.code ? '已复制 ✓' : `提取码: ${res.code}` }}
          </button>
          <button v-if="res._user" class="btn-delete" @click="removeResource(res._id)" title="删除此资源">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button
            class="btn-like"
            :class="{ liked: isLiked(res._id) }"
            :data-like-id="res._id"
            @click="toggleLike(res._id)"
            :title="isLiked(res._id) ? '取消点赞' : '点赞'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span class="like-count">{{ getLikeCount(res._id) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="!loading && filteredResources.length === 0 && !error" class="resource-empty">
      <p>没有找到匹配的资源</p>
      <p class="empty-hint">试试更换分类或搜索词</p>
    </div>

    <!-- Upload Modal -->
    <Teleport to="body">
      <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
        <div class="modal-panel">
          <div class="modal-header">
            <h2>上传资源</h2>
            <button class="modal-close" @click="showForm = false">&times;</button>
          </div>
          <form class="modal-body" @submit.prevent="submitUpload">
            <label class="form-field">
              <span class="field-label">资源名称 <em>*</em></span>
              <input v-model="form.title" type="text" required placeholder="例如：Python 入门教程" class="field-input" />
            </label>
            <label class="form-field">
              <span class="field-label">简介 <em>*</em></span>
              <textarea v-model="form.description" required rows="2" placeholder="简要描述资源内容和用途" class="field-input field-textarea" />
            </label>
            <div class="form-row">
              <label class="form-field">
                <span class="field-label">资源类型 <em>*</em></span>
                <select v-model="form.resourceType" required class="field-input">
                  <option value="网盘">网盘</option>
                  <option value="GitHub">GitHub</option>
                  <option value="文档">文档</option>
                  <option value="视频">视频</option>
                  <option value="其他">其他</option>
                </select>
              </label>
              <label class="form-field">
                <span class="field-label">分类 <em>*</em></span>
                <select v-model="form.category" required class="field-input">
                  <option value="" disabled>请选择</option>
                  <option>讲座讲义</option>
                  <option>代码项目</option>
                  <option>竞赛资料</option>
                  <option>学习资料</option>
                  <option>其他</option>
                </select>
              </label>
            </div>
            <div class="form-row">
              <label class="form-field">
                <span class="field-label">文件类型 <em>*</em></span>
                <input v-model="form.fileType" type="text" required placeholder="PDF / ZIP / 文件夹..." class="field-input" />
              </label>
              <label class="form-field">
                <span class="field-label">文件大小</span>
                <input v-model="form.fileSize" type="text" placeholder="例如：2.3MB" class="field-input" />
              </label>
            </div>
            <label class="form-field">
              <span class="field-label">网盘链接 <em>*</em></span>
              <input v-model="form.link" type="url" required placeholder="https://pan.baidu.com/s/..." class="field-input" />
            </label>
            <label class="form-field">
              <span class="field-label">提取码</span>
              <input v-model="form.code" type="text" placeholder="选填" class="field-input" />
            </label>
            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="showForm = false">取消</button>
              <button type="submit" class="btn-submit">发布资源</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../auth'
import { API_BASE as API_BASE_ROOT } from '../api/config'

const auth = useAuth()

export interface Resource {
  title: string
  description: string
  category: string
  resourceType?: string
  fileType: string
  fileSize?: string
  date: string
  link: string
  code?: string
  _id: string
  _user?: boolean
}

const API_BASE = API_BASE_ROOT
const STORAGE_KEY = 'turing-uploaded-resources'
const LIKES_KEY = 'turing-resource-likes'
const USER_ID_KEY = 'turing-user-id'

const search = ref('')
const activeCat = ref<string | null>(null)
const copiedCode = ref<string | null>(null)
const showForm = ref(false)
const loading = ref(true)
const error = ref(false)
const apiResources = ref<Resource[]>([])
const userResources = ref<Resource[]>([])

const emptyForm = () => ({
  title: '',
  description: '',
  resourceType: '网盘',
  category: '',
  fileType: '',
  fileSize: '',
  code: '',
  link: '',
})
const form = ref(emptyForm())

// ===== User ID =====
// 已登录用户使用后端返回的真实 id；未登录时回退到本地匿名标识（保证点赞/上传可用）
function getUserId(): number {
  const loggedIn = auth.user.value
  if (loggedIn && typeof loggedIn.id === 'number') {
    return loggedIn.id
  }
  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return parseInt(stored, 10)
  const id = Date.now()
  localStorage.setItem(USER_ID_KEY, String(id))
  return id
}

// ===== Date formatting =====
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

// ===== API → Resource mapping =====
function mapApiResource(api: any): Resource {
  const now = new Date()
  const fallbackDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return {
    _id: String(api.id ?? api._id),
    title: api.title ?? '',
    description: api.description ?? '',
    category: api.category ?? '',
    resourceType: api.resourceType ?? undefined,
    fileType: api.fileType ?? '',
    fileSize: api.fileSize ?? undefined,
    date: api.createdAt ? formatDate(api.createdAt) : fallbackDate,
    link: api.link ?? '',
    code: api.extractCode ?? api.code ?? undefined,
    _user: false,
  }
}

// ===== Data loading =====
async function loadData() {
  loading.value = true
  error.value = false

  try {
    const res = await fetch(`${API_BASE}/resources`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.data ?? data.resources ?? [])
    apiResources.value = list.map(mapApiResource)

    // Fetch like info for all resources
    await loadAllLikeInfo()
  } catch {
    error.value = true
    apiResources.value = []
    // Fall back to localStorage likes
    loadLikesFromStorage()
  } finally {
    loading.value = false
  }
}

// ===== Likes =====
const likes = ref<Record<string, number>>({})
const likedByMe = ref<Record<string, boolean>>({})

function persistLikes() {
  localStorage.setItem(LIKES_KEY, JSON.stringify(likes.value))
  localStorage.setItem(LIKES_KEY + '-me', JSON.stringify(likedByMe.value))
}

function loadLikesFromStorage() {
  try {
    const storedLikes = localStorage.getItem(LIKES_KEY)
    if (storedLikes) likes.value = JSON.parse(storedLikes)
    const storedLiked = localStorage.getItem(LIKES_KEY + '-me')
    if (storedLiked) likedByMe.value = JSON.parse(storedLiked)
  } catch { /* ignore */ }
}

async function loadAllLikeInfo() {
  const userId = getUserId()
  const ids = apiResources.value.map(r => r._id)
  const results = await Promise.allSettled(
    ids.map(id =>
      fetch(`${API_BASE}/resources/${id}/likes?userId=${userId}`)
        .then(r => r.ok ? r.json() : null)
    )
  )
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value) {
      const data = result.value
      const id = ids[i]
      likes.value[id] = data.likeCount ?? data.count ?? 0
      likedByMe.value[id] = data.liked ?? data.isLiked ?? false
    }
  })
  // Also seed likeCount from apiResources if like-info API didn't return counts
  for (const r of apiResources.value) {
    if (!(r._id in likes.value) && (r as any).likeCount !== undefined) {
      likes.value[r._id] = (r as any).likeCount
    }
  }
  persistLikes()
}

function getLikeCount(id: string): number {
  return likes.value[id] || 0
}

function isLiked(id: string): boolean {
  return !!likedByMe.value[id]
}

async function toggleLike(id: string) {
  const userId = getUserId()
  const wasLiked = likedByMe.value[id]

  // Optimistic update
  if (wasLiked) {
    likedByMe.value[id] = false
    likes.value[id] = Math.max((likes.value[id] || 1) - 1, 0)
  } else {
    likedByMe.value[id] = true
    likes.value[id] = (likes.value[id] || 0) + 1
  }
  persistLikes()

  // Like animation
  nextTick(() => {
    const btn = document.querySelector(`[data-like-id="${id}"]`)
    if (btn) {
      gsap.timeline()
        .to(btn, { scale: 1.3, duration: 0.1 })
        .to(btn, { scale: 0.9, duration: 0.1 })
        .to(btn, { scale: 1, duration: 0.15 })
    }
  })

  // API call
  try {
    if (wasLiked) {
      const res = await fetch(`${API_BASE}/resources/${id}/like?userId=${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Unlike failed')
    } else {
      const res = await fetch(`${API_BASE}/resources/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error('Like failed')
    }
  } catch {
    // Revert on API failure — fall back to localStorage state
    if (wasLiked) {
      likedByMe.value[id] = true
      likes.value[id] = (likes.value[id] || 0) + 1
    } else {
      likedByMe.value[id] = false
      likes.value[id] = Math.max((likes.value[id] || 1) - 1, 0)
    }
    persistLikes()
  }
}

// ===== Login guard =====
function openLoginIfNeeded() {
  ;(window as any).__openLogin?.()
}

// ===== Lifecycle =====
onMounted(() => {
  // Load user resources from localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      userResources.value = JSON.parse(stored)
    }
  } catch { /* ignore */ }

  // Load likes from localStorage as initial fallback
  loadLikesFromStorage()

  // Fetch from API
  loadData()

  // GSAP entrance animations
  nextTick(() => {
    gsap.from('.resource-toolbar', { y: -15, opacity: 0, duration: 0.5, ease: 'power2.out' })
    gsap.from('.cat-chip', { x: -8, opacity: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out' })
    gsap.from('.resource-card', {
      y: 30, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: '.resource-grid', start: 'top 82%', toggleActions: 'play none none none' }
    })
  })
})

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userResources.value))
}

// Merge API + user resources
const allResources = computed<Resource[]>(() => {
  return [...apiResources.value, ...userResources.value]
})

const categories = computed(() => {
  const set = new Set<string>()
  for (const r of allResources.value) set.add(r.category)
  return [...set]
})

const filteredResources = computed(() => {
  let list = allResources.value
  if (activeCat.value) {
    list = list.filter(r => r.category === activeCat.value)
  }
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
  }
  return list
})

// ===== Upload =====
async function submitUpload() {
  if (!auth.isLoggedIn.value) {
    ;(window as any).__openLogin?.()
    return
  }
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    category: form.value.category,
    fileType: form.value.fileType.trim(),
    fileSize: form.value.fileSize.trim() || undefined,
    link: form.value.link.trim(),
    extractCode: form.value.code.trim() || undefined,
    resourceType: form.value.resourceType,
    uploaderId: getUserId(),
  }

  // Try API first
  let apiSuccess = false
  try {
    const res = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      apiSuccess = true
      // Refresh list from API
      await loadData()
    }
  } catch { /* fall through to localStorage */ }

  // Fallback: store locally
  if (!apiSuccess) {
    const newRes: Resource = {
      _id: 'user-' + Date.now(),
      _user: true,
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      resourceType: form.value.resourceType,
      category: form.value.category,
      fileType: form.value.fileType.trim(),
      fileSize: form.value.fileSize.trim() || undefined,
      date: dateStr,
      link: form.value.link.trim(),
      code: form.value.code.trim() || undefined,
    }
    userResources.value.unshift(newRes)
    persist()
  }

  form.value = emptyForm()
  showForm.value = false
}

function removeResource(id: string) {
  userResources.value = userResources.value.filter(r => r._id !== id)
  persist()
}

function fileIcon(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('pdf')) return '📄'
  if (t.includes('zip') || t.includes('rar') || t.includes('7z')) return '📦'
  if (t.includes('ppt') || t.includes('pptx')) return '📊'
  if (t.includes('doc') || t.includes('docx')) return '📝'
  if (t.includes('xls') || t.includes('xlsx')) return '📈'
  if (t.includes('文件夹') || t.includes('目录')) return '📁'
  if (t.includes('mp4') || t.includes('视频')) return '🎬'
  if (t.includes('mp3') || t.includes('音频')) return '🎵'
  if (t.includes('jpg') || t.includes('png') || t.includes('图片')) return '🖼️'
  return '📎'
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    setTimeout(() => { if (copiedCode.value === code) copiedCode.value = null }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = code
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedCode.value = code
    setTimeout(() => { if (copiedCode.value === code) copiedCode.value = null }, 2000)
  }
}
</script>

<style scoped>
.resource-page {
  margin: 1.5rem 0;
}

/* Loading */
.loading {
  text-align: center;
  padding: 4rem 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
}

/* Error */
.error {
  text-align: center;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  border-radius: 6px;
  background: rgba(245, 108, 108, 0.08);
  color: #f56c6c;
  font-size: 0.95rem;
}

.error button {
  margin-left: 0.75rem;
  padding: 0.3rem 0.9rem;
  border-radius: 4px;
  border: 1px solid #f56c6c;
  background: transparent;
  color: #f56c6c;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.error button:hover {
  background: rgba(245, 108, 108, 0.15);
}

/* Toolbar */
.resource-toolbar {
  margin-bottom: 1.25rem;
}

.toolbar-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.resource-search {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.25rem;
  border-radius: 4px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #FFFFFF;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-upload:hover {
  background: var(--vp-c-brand-2);
}

/* Category chips */
.category-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cat-chip {
  font-size: 0.82rem;
  padding: 0.35rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.cat-chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.cat-chip.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #FFFFFF;
}

/* Count */
.resource-count {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  margin-bottom: 1.25rem;
}

.resource-count strong {
  color: var(--vp-c-brand-1);
}

/* Grid */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* Card */
.resource-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  position: relative;
}

.resource-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(252, 85, 49, 0.1);
}

.resource-card.is-user {
  border-left: 3px solid var(--vp-c-brand-1);
}

.res-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.res-header-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.res-icon {
  font-size: 1.4rem;
}

.res-user-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.45rem;
  border-radius: 3px;
  background: rgba(103, 194, 58, 0.12);
  color: #67c23a;
  font-weight: 600;
}

.res-category {
  font-size: 0.72rem;
  padding: 0.15rem 0.55rem;
  border-radius: 3px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.res-title {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}

.res-desc {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.75rem;
  line-height: 1.6;
  flex: 1;
}

.res-meta {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.res-sep {
  color: var(--vp-c-text-3);
}

.res-type-badge {
  font-size: 0.68rem;
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
  font-weight: 600;
}

.res-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-border);
  flex-wrap: wrap;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1.1rem;
  border-radius: 4px;
  background: var(--vp-c-brand-1);
  color: #FFFFFF;
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
  font-family: inherit;
  white-space: nowrap;
}

.btn-download:hover {
  background: var(--vp-c-brand-2);
  color: #FFFFFF;
  text-decoration: none;
}

.btn-download.locked {
  opacity: 0.6;
  cursor: pointer;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-3);
  border: 1px dashed var(--vp-c-border);
}

.btn-download.locked:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
  border-color: var(--vp-c-brand-1);
}

.btn-code {
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  border: 1px dashed var(--vp-c-border);
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-code:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.btn-code.copied {
  border-color: #67c23a;
  color: #67c23a;
  background: rgba(103, 194, 58, 0.08);
}

.btn-delete {
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

.btn-delete:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.06);
}

.btn-like {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  border-radius: 4px;
  border: 1px solid var(--vp-c-border);
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  margin-left: auto;
}

.btn-like:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.btn-like.liked {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.btn-like svg {
  width: 14px;
  height: 14px;
}

.btn-like.liked svg {
  fill: var(--vp-c-brand-1);
}

/* Empty */
.resource-empty {
  text-align: center;
  padding: 4rem 0;
  color: var(--vp-c-text-2);
}

.resource-empty p {
  margin: 0.25rem 0;
}

.empty-hint {
  font-size: 0.88rem;
  color: var(--vp-c-text-3);
}

@media (max-width: 768px) {
  .resource-grid {
    grid-template-columns: 1fr;
  }
  .toolbar-row {
    flex-direction: column;
  }
  .btn-upload {
    justify-content: center;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .res-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-code {
    text-align: center;
  }
  .btn-delete {
    margin-left: 0;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .resource-card {
    padding: 1rem;
  }

  .res-title {
    font-size: 0.98rem;
  }

  .res-desc {
    font-size: 0.82rem;
  }

  .cat-chip {
    font-size: 0.76rem;
    padding: 0.3rem 0.75rem;
  }

  .btn-download {
    width: 100%;
    justify-content: center;
  }

  .btn-code {
    width: 100%;
  }

  .btn-delete {
    width: 100%;
  }

  .btn-like {
    margin-left: 0;
  }

  .resource-empty {
    padding: 2.5rem 1rem;
  }
}
</style>

<style>
/* Modal styles — unscoped so Teleport content gets styled */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-panel {
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modal-in 0.25s ease;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--vp-c-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.modal-close:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.field-label em {
  color: #f56c6c;
  font-style: normal;
}

.field-input {
  padding: 0.55rem 0.85rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.field-input::placeholder {
  color: var(--vp-c-text-3);
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

.btn-cancel {
  padding: 0.55rem 1.25rem;
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.88rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: var(--vp-c-text-2);
  color: var(--vp-c-text-1);
}

.btn-submit {
  padding: 0.55rem 1.5rem;
  border-radius: 6px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: var(--vp-c-brand-2);
}
</style>
