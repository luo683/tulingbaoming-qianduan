<template>
  <div class="ask-section">
    <!-- Loading state -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      ❌ 加载失败 <button @click="loadData">重试</button>
    </div>

    <!-- Loaded state -->
    <template v-else>
      <h2 class="ask-title">💬 提出你的问题</h2>
      <p class="ask-hint">填写下方表单，学社成员会尽快回复。问题将公开发布在此页面。</p>

      <!-- Submit form -->
      <form class="ask-form" @submit.prevent="submitQuestion">
        <div class="form-row-2">
          <label class="form-field">
            <span class="field-label">昵称 <em>*</em></span>
            <input v-model="form.nickname" type="text" required placeholder="你的昵称" class="field-input" />
          </label>
          <label class="form-field">
            <span class="field-label">联系方式</span>
            <input v-model="form.contact" type="text" placeholder="QQ / 微信 / 邮箱（选填）" class="field-input" />
          </label>
        </div>
        <label class="form-field">
          <span class="field-label">问题标题 <em>*</em></span>
          <input v-model="form.title" type="text" required placeholder="简明扼要地描述你的问题" class="field-input" />
        </label>
        <label class="form-field">
          <span class="field-label">问题详情</span>
          <textarea v-model="form.content" rows="4" placeholder="详细描述你的问题背景、已尝试的方法、相关代码片段等..." class="field-input field-textarea" />
        </label>
        <div class="form-submit-row">
          <span class="form-note">提交即表示你同意将问题公开发布</span>
          <button type="submit" class="btn-submit">发布问题</button>
        </div>
      </form>

      <!-- Submitted questions list -->
      <div v-if="questions.length > 0" class="questions-list">
        <h3 class="questions-count">社区提问（{{ questions.length }}）</h3>

        <div v-for="q in questions" :key="q._id" class="question-card">
          <!-- Question header -->
          <div class="q-header">
            <div class="q-user">
              <span class="q-avatar">{{ q.nickname.charAt(0) }}</span>
              <div>
                <span class="q-nickname">{{ q.nickname }}</span>
                <span class="q-date">{{ q.date }}</span>
              </div>
            </div>
            <button class="q-delete" @click="removeQuestion(q._id)" title="删除">删除</button>
          </div>
          <h4 class="q-title">
            {{ q.title }}
            <span class="q-status" :class="q.status === 'replied' ? 'replied' : 'pending'">
              {{ q.status === 'replied' ? '已回复' : '待回复' }}
            </span>
          </h4>
          <p v-if="q.content" class="q-content">{{ q.content }}</p>
          <div v-if="q.contact" class="q-contact">联系方式：{{ q.contact }}</div>

          <!-- Replies -->
          <div v-if="q.replies && q.replies.length > 0" class="q-replies">
            <div v-for="r in q.replies" :key="r._id" class="reply-item">
              <div class="reply-header">
                <span class="reply-nickname">{{ r.nickname }}</span>
                <span class="reply-date">{{ r.date }}</span>
                <button class="reply-delete" @click="removeReply(q._id, r._id)" title="删除回复">删除</button>
              </div>
              <p class="reply-content">{{ r.content }}</p>
            </div>
          </div>
          <div v-else class="q-pending">暂无回复，来第一个回复吧</div>

          <!-- Reply form -->
          <div class="reply-form">
            <div class="reply-form-row">
              <input v-model="replyForms[q._id].nickname" type="text" placeholder="你的昵称" class="reply-input reply-input-name" />
              <input v-model="replyForms[q._id].content" type="text" placeholder="写下你的回复..." class="reply-input reply-input-content" @keyup.enter="submitReply(q._id)" />
              <button class="btn-reply" @click="submitReply(q._id)" :disabled="!replyForms[q._id].nickname || !replyForms[q._id].content">回复</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '../auth'

const auth = useAuth()

interface Reply {
  _id: string
  nickname: string
  content: string
  date: string
}

interface Question {
  _id: string
  nickname: string
  contact?: string
  title: string
  content?: string
  date: string
  status: string
  replies: Reply[]
}

const API_BASE = 'http://localhost:8080/api/faqs'
const STORAGE_KEY = 'turing-asked-questions'

const emptyForm = () => ({
  nickname: '',
  contact: '',
  title: '',
  content: '',
})
const form = ref(emptyForm())
const questions = ref<Question[]>([])
const loading = ref(true)
const error = ref(false)
const replyForms = reactive<Record<string, { nickname: string; content: string }>>({})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions.value))
}

function initReplyForms() {
  for (const q of questions.value) {
    if (!replyForms[q._id]) {
      replyForms[q._id] = { nickname: '', content: '' }
    }
  }
}

async function fetchRepliesForQuestion(q: Question) {
  try {
    const rRes = await fetch(`${API_BASE}/questions/${q._id}/replies`)
    if (!rRes.ok) return
    const rData = await rRes.json()
    const replies = Array.isArray(rData) ? rData : (rData.data || [])
    q.replies = replies.map((r: any) => ({
      _id: r._id || r.id,
      nickname: r.nickname || '',
      content: r.content || '',
      date: r.createdAt ? formatDate(r.createdAt) : '',
    }))
  } catch {
    // Silently ignore per-question reply fetch errors
  }
}

async function loadData() {
  loading.value = true
  error.value = false
  let apiSucceeded = false

  try {
    const res = await fetch(`${API_BASE}/questions`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.data || [])
    questions.value = list.map((item: any) => ({
      _id: item._id || item.id,
      nickname: item.nickname || '',
      contact: item.contact || undefined,
      title: item.title || '',
      content: item.content || undefined,
      date: item.createdAt ? formatDate(item.createdAt) : '',
      status: item.status || 'pending',
      replies: [],
    }))
    apiSucceeded = true

    // Fetch replies for all questions in parallel
    await Promise.allSettled(
      questions.value.map(q => fetchRepliesForQuestion(q)),
    )
  } catch (e) {
    console.error('Failed to fetch questions from API, trying localStorage:', e)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        questions.value = JSON.parse(stored)
        for (const q of questions.value) {
          if (!q.replies) q.replies = []
          if (!q.status) q.status = 'pending'
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
    // Only show error if both API and localStorage have no data
    if (questions.value.length === 0) {
      error.value = true
    }
  } finally {
    loading.value = false
  }

  initReplyForms()
}

async function submitQuestion() {
  if (!auth.isLoggedIn.value) {
    ;(window as any).__openLogin?.()
    return
  }
  const payload = {
    nickname: form.value.nickname.trim(),
    title: form.value.title.trim(),
    content: form.value.content.trim() || undefined,
    contact: form.value.contact.trim() || undefined,
  }

  try {
    const res = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const created = await res.json()
    const q: Question = {
      _id: created._id || created.id,
      nickname: created.nickname || payload.nickname,
      contact: created.contact || payload.contact,
      title: created.title || payload.title,
      content: created.content || payload.content,
      date: created.createdAt ? formatDate(created.createdAt) : formatDate(new Date().toISOString()),
      status: created.status || 'pending',
      replies: [],
    }
    questions.value.unshift(q)
    replyForms[q._id] = { nickname: '', content: '' }
  } catch (e) {
    console.error('API submit failed, falling back to localStorage:', e)
    // Fallback to localStorage
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const q: Question = {
      _id: 'q-' + Date.now(),
      nickname: payload.nickname,
      contact: payload.contact,
      title: payload.title,
      content: payload.content,
      date: dateStr,
      status: 'pending',
      replies: [],
    }
    questions.value.unshift(q)
    replyForms[q._id] = { nickname: '', content: '' }
    persist()
  }

  form.value = emptyForm()
}

function removeQuestion(id: string) {
  questions.value = questions.value.filter(q => q._id !== id)
  delete replyForms[id]
  persist()
}

async function submitReply(questionId: string) {
  if (!auth.isLoggedIn.value) {
    ;(window as any).__openLogin?.()
    return
  }
  const rf = replyForms[questionId]
  if (!rf || !rf.nickname.trim() || !rf.content.trim()) return

  const payload = {
    nickname: rf.nickname.trim(),
    content: rf.content.trim(),
  }

  try {
    const res = await fetch(`${API_BASE}/questions/${questionId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const created = await res.json()
    const reply: Reply = {
      _id: created._id || created.id,
      nickname: created.nickname || payload.nickname,
      content: created.content || payload.content,
      date: created.createdAt ? formatDate(created.createdAt) : formatDate(new Date().toISOString()),
    }
    const q = questions.value.find(q => q._id === questionId)
    if (q) {
      if (!q.replies) q.replies = []
      q.replies.push(reply)
      // Update status after successful reply
      if (q.status === 'pending') {
        q.status = 'replied'
      }
    }
  } catch (e) {
    console.error('API reply failed, falling back to localStorage:', e)
    // Fallback to localStorage
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const reply: Reply = {
      _id: 'r-' + Date.now(),
      nickname: payload.nickname,
      content: payload.content,
      date: dateStr,
    }
    const q = questions.value.find(q => q._id === questionId)
    if (q) {
      if (!q.replies) q.replies = []
      q.replies.push(reply)
      if (q.status === 'pending') {
        q.status = 'replied'
      }
      persist()
    }
  }

  rf.nickname = ''
  rf.content = ''
}

function removeReply(questionId: string, replyId: string) {
  const q = questions.value.find(q => q._id === questionId)
  if (q && q.replies) {
    q.replies = q.replies.filter(r => r._id !== replyId)
    persist()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.ask-section {
  margin-top: 2.5rem;
}

.loading {
  text-align: center;
  padding: 2rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
}

.error {
  text-align: center;
  padding: 2rem 0;
  color: #f56c6c;
  font-size: 0.95rem;
}

.error button {
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #f56c6c;
  border-radius: 4px;
  background: transparent;
  color: #f56c6c;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
}

.error button:hover {
  background: rgba(245, 108, 108, 0.1);
}

.ask-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--vp-c-text-1);
}

.ask-hint {
  font-size: 0.88rem;
  color: var(--vp-c-text-3);
  margin-bottom: 1.5rem;
}

/* ===== Status badge ===== */
.q-status {
  display: inline-block;
  padding: 0.12rem 0.45rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  margin-left: 0.5rem;
  vertical-align: middle;
}

.q-status.pending {
  background: rgba(255, 193, 7, 0.15);
  color: #e6a817;
}

.q-status.replied {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

/* ===== Question form ===== */
.ask-form {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.field-label em {
  color: var(--vp-c-brand-1);
  font-style: normal;
}

.field-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
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
  min-height: 80px;
}

.form-submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-note {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.btn-submit {
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #FFFFFF;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: var(--vp-c-brand-2);
}

/* ===== Questions list ===== */
.questions-list {
  margin-top: 0.5rem;
}

.questions-count {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 1rem;
}

.question-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.q-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.q-user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.q-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
}

.q-nickname {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  display: block;
}

.q-date {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.q-delete {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.q-delete:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.06);
}

.q-title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.q-content {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.7;
  margin: 0 0 0.75rem;
  white-space: pre-wrap;
}

.q-contact {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-bottom: 0.75rem;
}

.q-pending {
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
  font-style: italic;
  margin: 0.75rem 0;
}

/* ===== Replies ===== */
.q-replies {
  border-top: 1px solid var(--vp-c-border);
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.reply-item {
  background: var(--vp-c-bg-mute);
  border-radius: 6px;
  padding: 0.75rem 1rem;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.reply-nickname {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.reply-date {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}

.reply-delete {
  margin-left: auto;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.reply-delete:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.06);
}

.reply-content {
  margin: 0;
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.65;
}

/* ===== Reply form ===== */
.reply-form {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-border);
}

.reply-form-row {
  display: flex;
  gap: 0.5rem;
}

.reply-input {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.reply-input:focus {
  border-color: var(--vp-c-brand-1);
}

.reply-input::placeholder {
  color: var(--vp-c-text-3);
}

.reply-input-name {
  width: 110px;
  flex-shrink: 0;
}

.reply-input-content {
  flex: 1;
}

.btn-reply {
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: #FFFFFF;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-reply:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.btn-reply:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
  .form-submit-row {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  .btn-submit {
    text-align: center;
  }
  .reply-form-row {
    flex-wrap: wrap;
  }
  .reply-input-name {
    width: 100%;
  }
  .reply-input-content {
    flex: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .ask-section {
    margin-top: 1.5rem;
  }

  .ask-title {
    font-size: 1.15rem;
  }

  .ask-hint {
    font-size: 0.82rem;
    margin-bottom: 1rem;
  }

  .ask-form {
    padding: 1rem;
    gap: 0.75rem;
  }

  .question-card {
    padding: 1rem;
  }

  .q-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .q-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.78rem;
  }

  .q-title {
    font-size: 0.92rem;
  }

  .q-content {
    font-size: 0.85rem;
  }

  .reply-item {
    padding: 0.6rem 0.75rem;
  }

  .reply-form-row {
    flex-direction: column;
  }

  .btn-reply {
    width: 100%;
    text-align: center;
  }
}
</style>
