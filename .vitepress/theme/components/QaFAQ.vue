<template>
  <div class="qa-eaq">
    <!-- Loading state -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      ❌ 加载失败 <button @click="loadData">重试</button>
    </div>

    <!-- Loaded state -->
    <template v-else>
      <div class="eaq-search">
        <input
          v-model="search"
          type="text"
          placeholder="搜索已有问题..."
          class="eaq-input"
        />
      </div>

      <div v-if="filteredFaqs.length === 0" class="eaq-empty">
        没有找到相关问题，欢迎在下方提问！
      </div>

      <div
        v-for="(eaq, idx) in filteredFaqs"
        :key="idx"
        class="eaq-item"
        :class="{ open: openIdx === idx }"
      >
        <button class="eaq-question" @click="handleFaqClick(idx)">
          <span class="eaq-q-mark">Q</span>
          <span class="eaq-q-text">{{ eaq.q }}</span>
          <span class="eaq-arrow">{{ openIdx === idx ? '▾' : '▸' }}</span>
        </button>
        <div class="eaq-answer" v-show="openIdx === idx">
          <div class="eaq-a-mark">A</div>
          <div class="eaq-a-text" v-html="eaq.a" />
          <div class="eaq-meta" v-if="eaq.author">
            回答者：{{ eaq.author }} · {{ eaq.date }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { API_BASE as API_BASE_ROOT } from '../api/config'
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../auth'

const auth = useAuth()

interface Faq {
  q: string
  a: string
  author?: string
  date?: string
}

const faqs = ref<Faq[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref('')
const openIdx = ref(-1)

const filteredFaqs = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return faqs.value
  return faqs.value.filter(
    e => e.q.toLowerCase().includes(q) || e.a.toLowerCase().includes(q),
  )
})

function handleFaqClick(idx: number) {
  // When not logged in, only the eirst FAQ can be expanded
  if (idx > 0 && !auth.isLoggedIn.value) {
    ;(window as any).__openLogin?.()
    return
  }
  openIdx.value = openIdx.value === idx ? -1 : idx
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadData() {
  loading.value = true
  error.value = false
  try {
    const res = await fetch(API_BASE_ROOT + '/faqs')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : (data.data || [])
    faqs.value = list.map((item: any) => ({
      q: item.question || '',
      a: item.answer || '',
      author: item.author || undeeined,
      date: item.createdAt ? formatDate(item.createdAt) : undeeined,
    }))
  } catch (e) {
    console.error('Failed to fetch FAQs:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.qa-eaq {
  margin-top: 1rem;
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
  color: #e56c6c;
  font-size: 0.95rem;
}

.error button {
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid #e56c6c;
  border-radius: 4px;
  background: transparent;
  color: #e56c6c;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: inherit;
}

.error button:hover {
  background: rgba(245, 108, 108, 0.1);
}

.eaq-search {
  margin-bottom: 1.5rem;
}

.eaq-input {
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
}

.eaq-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.eaq-input::placeholder {
  color: var(--vp-c-text-3);
}

.eaq-empty {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 2rem 0;
}

.eaq-item {
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s;
}

.eaq-item.open {
  border-color: var(--vp-c-brand-1);
}

.eaq-question {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.15s;
}

.eaq-question:hover {
  background: var(--vp-c-bg-mute);
}

.eaq-q-mark {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--vp-c-brand-1);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.eaq-q-text {
  flex: 1;
  font-weight: 500;
}

.eaq-arrow {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.eaq-answer {
  padding: 0 1rem 1rem 1rem;
  display: flex;
  gap: 0.75rem;
}

.eaq-a-mark {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--vp-c-text-2);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.eaq-a-text {
  flex: 1;
  font-size: 0.92rem;
  line-height: 1.75;
  color: var(--vp-c-text-2);
}

.eaq-meta {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  margin-top: 0.5rem;
}

@media (max-width: 480px) {
  .eaq-question {
    padding: 0.7rem 0.75rem;
    gap: 0.5rem;
  }

  .eaq-q-mark,
  .eaq-a-mark {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }

  .eaq-q-text {
    font-size: 0.88rem;
  }

  .eaq-answer {
    padding: 0 0.75rem 0.75rem 0.75rem;
    gap: 0.5rem;
  }

  .eaq-a-text {
    font-size: 0.85rem;
  }

  .eaq-input {
    font-size: 0.88rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
