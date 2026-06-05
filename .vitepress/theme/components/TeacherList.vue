<template>
  <div class="teacher-page">

    <!-- Loading -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error -->
    <div v-else-if="error" class="error">
      ❌ 加载失败 <button @click="loadData">重试</button>
    </div>

    <!-- Content -->
    <template v-else>
      <div v-for="dept in departments" :key="dept.name" class="dept-section">
        <h2 class="dept-title">
          <span class="dept-icon">{{ dept.icon }}</span>
          {{ dept.name }}
          <span class="dept-count">（{{ dept.teachers.length }}人）</span>
        </h2>

        <div class="teacher-list">
          <div
            v-for="teacher in dept.teachers"
            :key="teacher.name"
            class="teacher-item"
            :class="{ expanded: expandedTeacher === teacher.name }"
          >
            <div class="teacher-header" @click="toggle(teacher.name)">
              <div class="teacher-avatar" :style="{ background: teacher.gradient }">
                {{ teacher.name[0] }}
              </div>
              <span class="teacher-name">{{ teacher.name }}</span>
              <span class="teacher-title-badge">{{ teacher.title }}</span>
              <span class="expand-arrow">{{ expandedTeacher === teacher.name ? '▾' : '▸' }}</span>
            </div>

            <transition name="detail">
              <div v-if="expandedTeacher === teacher.name" class="teacher-detail">
                <p class="detail-text">{{ teacher.quote }}</p>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Teacher {
  name: string
  title: string
  dept: string
  quote: string
  gradient: string
}

interface Department {
  name: string
  icon: string
  teachers: Teacher[]
}

interface ApiTeacher {
  name: string
  title: string
  dept: string
  quote: string
  avatarGradient?: string
  sortOrder: number
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
]

const DEPT_ICONS: Record<string, string> = {
  '大数据系': '📊',
  '信息工程系': '📡',
  '计算机系': '💻',
  '实验室': '🔬',
}

const DEPT_ORDER = ['大数据系', '信息工程系', '计算机系', '实验室']

const loading = ref(true)
const error = ref(false)
const departments = ref<Department[]>([])
const expandedTeacher = ref<string | null>(null)

function toggle(name: string) {
  expandedTeacher.value = expandedTeacher.value === name ? null : name
}

async function loadData() {
  loading.value = true
  error.value = false
  try {
    const res = await fetch('http://192.168.2.120:8080/api/teachers')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: ApiTeacher[] = await res.json()

    // 按系分组
    const deptMap = new Map<string, ApiTeacher[]>()
    for (const t of data) {
      const list = deptMap.get(t.dept) || []
      list.push(t)
      deptMap.set(t.dept, list)
    }

    // 按预定义顺序构建
    let globalIdx = 0
    departments.value = DEPT_ORDER
      .filter(name => deptMap.has(name))
      .map(name => {
        const teachers = deptMap.get(name)!
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(t => {
            const teacher: Teacher = {
              name: t.name,
              title: t.title || '',
              dept: t.dept,
              quote: t.quote || '暂无简介',
              gradient: t.avatarGradient || GRADIENTS[globalIdx % GRADIENTS.length],
            }
            globalIdx++
            return teacher
          })
        return {
          name,
          icon: DEPT_ICONS[name] || '📌',
          teachers,
        }
      })

    loading.value = false
  } catch (e) {
    loading.value = false
    error.value = true
    console.error('Failed to fetch teachers:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.teacher-page {
  margin: 1.5rem 0;
}

.loading,
.error {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
}

.error button {
  margin-left: 0.75rem;
  padding: 0.35rem 1rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.error button:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}

/* ── 系别区块 ── */
.dept-section {
  margin-bottom: 2.5rem;
}

.dept-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--vp-c-brand-1);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.dept-icon {
  font-size: 1.2rem;
}

.dept-count {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--vp-c-text-3);
  margin-left: 0.3rem;
}

/* ── 教师列表 ── */
.teacher-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.teacher-item {
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.dark .teacher-item {
  background: rgba(30, 30, 48, 0.55);
}

.teacher-item:hover {
  border-color: var(--vp-c-brand-1);
}

.teacher-item.expanded {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 12px rgba(252, 85, 49, 0.08);
}

/* ── 教师头部（点击区域） ── */
.teacher-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.teacher-header:hover {
  background: var(--vp-c-brand-soft);
}

.teacher-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  flex-shrink: 0;
}

.teacher-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.teacher-title-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.expand-arrow {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  transition: transform 0.2s;
}

/* ── 详情区域 ── */
.teacher-detail {
  padding: 0 1.25rem 1rem 4rem;
}

.detail-text {
  margin: 0;
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  line-height: 1.7;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-mute);
  border-radius: 8px;
  border-left: 3px solid var(--vp-c-brand-1);
}

/* ── 展开动画 ── */
.detail-enter-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.detail-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.detail-enter-from,
.detail-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.detail-enter-to,
.detail-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .teacher-header {
    padding: 0.65rem 1rem;
    gap: 0.6rem;
  }

  .teacher-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .teacher-name {
    font-size: 0.92rem;
  }

  .teacher-detail {
    padding: 0 1rem 0.75rem 1rem;
  }

  .detail-text {
    font-size: 0.82rem;
    padding: 0.6rem 0.8rem;
  }

  .dept-title {
    font-size: 1.15rem;
  }
}

@media (max-width: 480px) {
  .teacher-header {
    padding: 0.6rem 0.75rem;
    gap: 0.5rem;
  }

  .teacher-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }

  .teacher-name {
    font-size: 0.85rem;
  }

  .teacher-title-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
  }
}
</style>
