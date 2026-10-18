<script setup lang="ts">
import { API_BASE as API_BASE_ROOT } from '../api/config'
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../auth'

const { isAdmin } = useAuth()

interface Event {
  id: number
  title: string
  eventDate: string
  location: string
  maxParticipants: number
}

interface EventWithStats extends Event {
  stats?: {
    totalRegistered: number
    totalAttended: number
    totalCancelled: number
    full: boolean
  }
}

const events = ref<EventWithStats[]>([])
const loading = ref(false)

async function loadStats() {
  if (loading.value) return
  loading.value = true
  try {
    // 1. 获取所有活动
    const res = await fetch(API_BASE_ROOT + '/events')
    if (!res.ok) throw new Error('加载活动列表失败')
    const data = await res.json()
    events.value = data

    // 2. 为每个活动获取报名统计
    await Promise.all(
      events.value.map(async (event) => {
        try {
          const statsRes = await fetch(`${API_BASE_ROOT}/events/${event.id}/registrations/stats`)
          const statsData = await statsRes.json()
          if (statsData.ok) {
            event.stats = statsData.data
          }
        } catch (e) {
          console.error(`获取活动 ${event.id} 统计失败:`, e)
        }
      })
    )
  } catch (e) {
    console.error('加载活动列表失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
  window.addEventListener('focus', loadStats)
})
onUnmounted(() => window.removeEventListener('focus', loadStats))

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="registration-stats">
    <button type="button" :disabled="loading" @click="loadStats">刷新统计</button>
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="events.length === 0" class="empty">
      暂无活动数据
    </div>

    <div v-else class="events-list">
      <div v-for="event in events" :key="event.id" class="event-card">
        <div class="event-header">
          <h3>{{ event.title }}</h3>
          <div class="event-meta">
            <span>📅 {{ formatDate(event.eventDate) }}</span>
            <span>📍 {{ event.location }}</span>
          </div>
        </div>

        <div v-if="event.stats" class="event-stats">
          <div class="stat-row">
            <span class="stat-label">已报名：</span>
            <span class="stat-value">
              {{ event.stats.totalRegistered }}
              <template v-if="event.maxParticipants > 0">
                / {{ event.maxParticipants }}
              </template>
            </span>
            <span v-if="event.stats.full" class="badge full">已满</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">已参加：</span>
            <span class="stat-value">{{ event.stats.totalAttended }}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">已取消：</span>
            <span class="stat-value">{{ event.stats.totalCancelled }}</span>
          </div>
        </div>

        <div class="event-actions">
          <a :href="`/events/#event-${event.id}`" class="btn-view">查看详情</a>
          <a v-if="isAdmin" :href="`/admin/registrations/${event.id}`" class="btn-manage">
            管理报名
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.registration-stats {
  padding: 2rem 0;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: var(--vp-c-text-2);
}

.events-list {
  display: grid;
  gap: 1.5rem;
}

.event-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  transition: all 0.3s;
}

.event-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.event-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
}

.event-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.event-stats {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-label {
  color: var(--vp-c-text-2);
  min-width: 80px;
}

.stat-value {
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.badge.full {
  background: var(--vp-c-red-soft);
  color: var(--vp-c-red-1);
}

.event-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-view, .btn-manage {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-view {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.btn-view:hover {
  background: var(--vp-c-brand-1);
  color: white;
}

.btn-manage {
  background: transparent;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.btn-manage:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
