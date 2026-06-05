<template>
  <div class="events-page">
    <!-- Loading state -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error state -->
    <div v-else-if="error" class="error">❌ 加载失败 <button @click="loadEvents">重试</button></div>

    <!-- Content -->
    <template v-else>
      <!-- Upcoming highlight -->
      <div v-if="upcoming.length > 0" class="upcoming-section">
        <h2 class="section-title">即将到来</h2>
        <div v-for="ev in upcoming" :key="ev.title" class="upcoming-card">
          <div class="upcoming-date">
            <span class="date-day">{{ ev.day }}</span>
            <span class="date-month">{{ ev.month }}</span>
          </div>
          <div class="upcoming-info">
            <h3>{{ ev.title }}</h3>
            <p>{{ ev.description }}</p>
            <div class="upcoming-meta">
              <span>{{ ev.time }}</span>
              <span class="dot">·</span>
              <span>{{ ev.location }}</span>
              <span v-if="ev.status === 'open'" class="status-open">报名中</span>
              <span v-else-if="ev.status === 'soon'" class="status-soon">即将开始</span>
            </div>

            <!-- Registration area -->
            <div v-if="ev.status === 'open'" class="register-area">
              <!-- When not logged in: show lock card -->
              <div v-if="!auth.isLoggedIn.value" class="reg-locked">
                <span>🔒</span>
                <p>登录后即可报名参加活动</p>
                <button @click="openLoginIfNeeded" class="btn-login">👤 立即登录</button>
              </div>
              <!-- When logged in: show normal registration -->
              <template v-else>
                <template v-if="!isRegistered(ev.title)">
                  <button class="btn-register" @click="toggleForm(ev.title)">
                    {{ showForm === ev.title ? '收起' : '立即报名' }}
                  </button>
                  <span class="reg-count">{{ getRegistrations(ev.title).length }} 人已报名</span>
                </template>
                <template v-else>
                  <span class="reg-done">✓ 已报名</span>
                  <button class="btn-cancel-reg" @click="cancelRegistration(ev.title)">取消报名</button>
                </template>

                <!-- Registration form -->
                <div v-if="showForm === ev.title" class="reg-form">
                  <input v-model="regForm.name" type="text" placeholder="姓名 *" class="reg-input reg-input-full" />
                  <div class="reg-row">
                    <input v-model="regForm.phone" type="text" placeholder="手机号 *" class="reg-input" />
                    <input v-model="regForm.email" type="email" placeholder="邮箱 *" class="reg-input" />
                  </div>
                  <div class="reg-actions">
                    <button class="btn-submit-reg" @click="submitRegistration(ev)" :disabled="!canSubmit">确认报名</button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Past events timeline -->
      <h2 class="section-title">往期活动</h2>
      <div class="timeline">
        <div v-for="ev in pastEvents" :key="ev.title" class="t-item">
          <div class="t-date">{{ ev.dateStr }}</div>
          <div class="t-card">
            <h3>{{ ev.title }}</h3>
            <p>{{ ev.description }}</p>
            <div class="t-meta">
              <span>{{ ev.location }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../auth'

const auth = useAuth()

interface Event {
  id?: string | number
  title: string
  description: string
  date: string
  day: string
  month: string
  dateStr: string
  time: string
  location: string
  status?: 'open' | 'soon' | 'past'
}

interface Registration {
  eventTitle: string
  name: string
  phone: string
  email: string
  date: string
}

const STORAGE_KEY = 'turing-event-registrations'
const API_BASE = 'http://localhost:8080/api/events'

const props = defineProps<{
  events: Event[]
}>()

const apiEvents = ref<Event[]>([])
const loading = ref(false)
const error = ref(false)

const allEvents = computed(() => {
  if (props.events && props.events.length > 0) return props.events
  return apiEvents.value
})

const upcoming = computed(() => allEvents.value.filter(e => e.status === 'open' || e.status === 'soon'))
const pastEvents = computed(() => allEvents.value.filter(e => e.status === 'past'))

const showForm = ref<string | null>(null)
const registrations = ref<Registration[]>([])
const regForm = ref({ name: '', phone: '', email: '' })

const canSubmit = computed(() => regForm.value.name.trim() && regForm.value.phone.trim() && regForm.value.email.trim())

// ===== Login guard =====
function openLoginIfNeeded() {
  ;(window as any).__openLogin?.()
}

onMounted(() => {
  // Load saved registrations from localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) registrations.value = JSON.parse(stored)
  } catch { /* ignore */ }

  // Use prop data if available, otherwise fetch from API
  if (props.events && props.events.length > 0) {
    runAnimations()
  } else {
    loadEvents()
  }
})

function runAnimations() {
  nextTick(() => {
    // 即将到来卡片动画
    if (document.querySelector('.upcoming-card')) {
      gsap.from('.upcoming-card', {
        y: 30, opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.upcoming-section', start: 'top 82%', toggleActions: 'play none none none' }
      })
      gsap.from('.upcoming-date', {
        scale: 0.5, duration: 0.5, ease: 'elastic.out(1, 0.4)',
        scrollTrigger: { trigger: '.upcoming-section', start: 'top 82%', toggleActions: 'play none none none' }
      })
    }

    // 往期时间线动画
    if (document.querySelector('.timeline')) {
      gsap.from('.t-item', {
        x: -20, opacity: 0, duration: 0.5, stagger: 0.2, ease: 'power2.out',
        scrollTrigger: { trigger: '.timeline', start: 'top 82%', toggleActions: 'play none none none' }
      })
    }
  })
}

async function loadEvents() {
  loading.value = true
  error.value = false
  try {
    const res = await fetch(API_BASE)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    apiEvents.value = Array.isArray(data) ? data : (data.data || data.events || [])
    runAnimations()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations.value))
}

function isRegistered(eventTitle: string) {
  return registrations.value.some(r => r.eventTitle === eventTitle)
}

function getRegistrations(eventTitle: string) {
  return registrations.value.filter(r => r.eventTitle === eventTitle)
}

function toggleForm(eventTitle: string) {
  showForm.value = showForm.value === eventTitle ? null : eventTitle
  regForm.value = { name: '', phone: '', email: '' }
}

async function submitRegistration(ev: Event) {
  if (!canSubmit.value) return
  if (!auth.isLoggedIn.value) {
    ;(window as any).__openLogin?.()
    return
  }

  const payload = {
    name: regForm.value.name.trim(),
    phone: regForm.value.phone.trim(),
    email: regForm.value.email.trim(),
  }

  const eventId = ev.id || ev.title

  // Try API first
  try {
    const res = await fetch(`${API_BASE}/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch {
    // API failed — fall back to localStorage
  }

  // Always save locally (works even when API succeeds, as local cache)
  const now = new Date()
  registrations.value.push({
    eventTitle: ev.title,
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  })
  persist()
  showForm.value = null
  regForm.value = { name: '', phone: '', email: '' }
}

function cancelRegistration(eventTitle: string) {
  registrations.value = registrations.value.filter(r => r.eventTitle !== eventTitle)
  persist()
}
</script>

<style scoped>
.events-page {
  margin: 1.5rem 0;
}

.loading {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
}

.error {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1rem;
  color: #f56c6c;
}

.error button {
  margin-left: 0.5rem;
  padding: 0.3rem 0.8rem;
  border: 1px solid #f56c6c;
  border-radius: 4px;
  background: transparent;
  color: #f56c6c;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.error button:hover {
  background: rgba(245, 108, 108, 0.1);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 1rem;
}

/* Upcoming */
.upcoming-section {
  margin-bottom: 2.5rem;
}

.upcoming-card {
  display: flex;
  gap: 1.5rem;
  background: var(--vp-c-brand-soft);
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 0.75rem;
}

.upcoming-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 60px;
  background: var(--vp-c-brand-1);
  border-radius: 6px;
  color: #fff;
  flex-shrink: 0;
}

.date-day {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
}

.date-month {
  font-size: 0.75rem;
  font-weight: 500;
}

.upcoming-info {
  flex: 1;
}

.upcoming-info h3 {
  margin: 0 0 0.35rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.upcoming-info p {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.upcoming-meta {
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dot {
  color: var(--vp-c-text-3);
}

.status-open {
  color: #fff;
  background: #67c23a;
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  font-size: 0.72rem;
  font-weight: 600;
}

.status-soon {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  font-size: 0.72rem;
  font-weight: 600;
}

/* ===== Registration ===== */
.register-area {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--vp-c-border);
}

.btn-register {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 1.1rem;
  border-radius: 4px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.btn-register:hover {
  background: var(--vp-c-brand-2);
}

.reg-count {
  margin-left: 0.75rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.reg-done {
  color: #67c23a;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-cancel-reg {
  margin-left: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 3px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.btn-cancel-reg:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.06);
}

/* Registration form */
.reg-form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reg-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.reg-input {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.reg-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.reg-input::placeholder {
  color: var(--vp-c-text-3);
}

.reg-input-full {
  width: 100%;
}

.reg-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-submit-reg {
  padding: 0.45rem 1.25rem;
  border-radius: 4px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.btn-submit-reg:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.btn-submit-reg:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ===== Locked registration card ===== */
.reg-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.25rem 1rem;
  background: var(--vp-c-bg);
  border: 1px dashed var(--vp-c-border);
  border-radius: 8px;
  gap: 0.5rem;
}

.reg-locked span {
  font-size: 1.6rem;
}

.reg-locked p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
}

.btn-login {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 1.25rem;
  border-radius: 4px;
  border: none;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.btn-login:hover {
  background: var(--vp-c-brand-2);
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 2rem;
  margin-top: 1rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--vp-c-border);
}

.t-item {
  position: relative;
  margin-bottom: 1.75rem;
}

.t-item::before {
  content: '';
  position: absolute;
  left: -1.65rem;
  top: 0.3rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  border: 2px solid var(--vp-c-bg-soft);
}

.t-date {
  font-size: 0.78rem;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.t-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.t-card h3 {
  margin: 0 0 0.3rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.t-card p {
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.t-meta {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

@media (max-width: 768px) {
  .upcoming-card {
    flex-direction: column;
    gap: 0.75rem;
  }
  .upcoming-date {
    flex-direction: row;
    gap: 0.4rem;
    width: fit-content;
    height: auto;
    padding: 0.4rem 0.8rem;
  }
  .reg-row {
    grid-template-columns: 1fr;
  }
}
</style>
