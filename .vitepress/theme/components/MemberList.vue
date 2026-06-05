<template>
  <div class="member-page">

    <!-- Loading -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error -->
    <div v-else-if="error" class="error">
      ❌ 加载失败 <button @click="loadData">重试</button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- 社长团 — 永远在最上面 -->
      <div class="leader-block">
        <div class="leader-grid">
          <div
            v-for="(m, idx) in leaders"
            :key="m.name"
            class="leader-card"
            :ref="el => { if (el) leaderRefs[idx] = el }"
          >
            <div class="leader-avatar" :style="{ background: m.gradient }">
              <span class="leader-avatar-text">{{ m.name[0] }}</span>
            </div>
            <div class="leader-info">
              <h3 class="leader-name">{{ m.name }}</h3>
              <span class="leader-role">{{ m.role }}</span>
              <p class="leader-bio">{{ m.bio }}</p>
              <div class="leader-tags">
                <span v-for="t in m.tags" :key="t" class="leader-tag">{{ t }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 各部门 -->
      <div v-for="(dept, dIdx) in departments" :key="dept.name" class="dept-block">
        <h2 class="dept-title">
          <span class="dept-icon">{{ dept.icon }}</span>
          {{ dept.name }}
        </h2>

        <!-- 部长 + 副部长（始终显示） -->
        <div class="dept-lead-grid">
          <div
            v-for="(m, mIdx) in dept.leads"
            :key="m.name"
            class="dept-member-card lead-card"
            :ref="el => { if (el) deptCardRefs[`${dIdx}-${mIdx}`] = el }"
          >
            <div class="dm-avatar" :style="{ background: m.gradient }">
              {{ m.name[0] }}
            </div>
            <div class="dm-info">
              <h4 class="dm-name">{{ m.name }}</h4>
              <span class="dm-role-badge" :class="m.roleClass">{{ m.role }}</span>
              <p class="dm-bio">{{ m.bio }}</p>
              <div class="dm-tags">
                <span v-for="t in m.tags" :key="t" class="dm-tag">{{ t }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 其他成员（可折叠） -->
        <div v-if="dept.others.length" class="others-section">
          <button class="others-toggle" @click="toggleDept(dIdx)">
            <span class="toggle-icon">{{ expandedDepts[dIdx] ? '▾' : '▸' }}</span>
            <span>其他成员（{{ dept.others.length }}人）</span>
          </button>

          <transition name="expand">
            <div v-if="expandedDepts[dIdx]" class="others-grid" :ref="el => { if (el) othersRefs[dIdx] = el }">
              <div
                v-for="m in dept.others"
                :key="m.name"
                class="dept-member-card other-card"
              >
                <div class="dm-avatar small" :style="{ background: m.gradient }">
                  {{ m.name[0] }}
                </div>
                <div class="dm-info">
                  <h4 class="dm-name">{{ m.name }}</h4>
                  <span class="dm-role-badge other-role">{{ m.role }}</span>
                  <p class="dm-bio">{{ m.bio }}</p>
                  <div class="dm-tags">
                    <span v-for="t in m.tags" :key="t" class="dm-tag">{{ t }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface Member {
  name: string
  role: string
  roleClass?: string
  bio: string
  tags: string[]
  gradient: string
}

interface Department {
  icon: string
  name: string
  leads: Member[]
  others: Member[]
}

interface ApiMember {
  name: string
  role: string
  department: string
  grade: string
  bio: string
  tags: string
  avatarGradient: string
  isLead: boolean
  sortOrder: number
}

// ── 部门图标映射 ──
function getDeptIcon(name: string): string {
  const map: Record<string, string> = {
    '社长团': '🏛️',
    '技术部': '💻',
    '学术部': '📚',
    '实践部': '🔬',
    '宣传部': '📢',
    '办公室': '📋',
    '组织部': '🏗️',
    '外联部': '🤝',
    '运营部': '🎨',
    '文艺部': '🎭',
    '体育部': '⚽',
  }
  return map[name] || '📌'
}

// ── 部门排序权重 ──
const DEPT_ORDER: Record<string, number> = {
  '技术部': 1,
  '学术部': 2,
  '实践部': 3,
  '宣传部': 4,
  '组织部': 5,
  '外联部': 6,
  '办公室': 7,
  '运营部': 8,
  '文艺部': 9,
  '体育部': 10,
}

function getDeptOrder(name: string): number {
  return DEPT_ORDER[name] ?? 99
}

// ── 根据 role 推算样式类名 ──
function getRoleClass(role: string): string {
  if (role.includes('副社长')) return 'vp'
  if (role.includes('社长')) return 'president'
  if (role.includes('副部长')) return 'vice-minister'
  if (role.includes('部长')) return 'minister'
  return ''
}

// ── 将 API 数据转换为展示用的 Member ──
function toMember(api: ApiMember): Member {
  return {
    name: api.name,
    role: api.role,
    roleClass: getRoleClass(api.role),
    bio: api.grade ? `${api.grade} · ${api.bio}` : api.bio,
    tags: api.tags ? api.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
    gradient: api.avatarGradient,
  }
}

// ── 状态 ──
const loading = ref(true)
const error = ref(false)
const leaders = ref<Member[]>([])
const departments = ref<Department[]>([])

// ── 展开/折叠状态 ──
const expandedDepts = reactive<Record<number, boolean>>({})

function toggleDept(idx: number) {
  const wasExpanded = expandedDepts[idx]
  expandedDepts[idx] = !wasExpanded

  // 展开时播放入场动画
  if (!wasExpanded) {
    nextTick(() => {
      const container = othersRefs.value[idx]
      if (!container) return
      const cards = container.querySelectorAll('.other-card')
      gsap.from(cards, {
        y: 20,
        opacity: 0,
        duration: 0.35,
        stagger: 0.08,
        ease: 'power2.out',
      })
    })
  }
}

// ── 动画 ──
const leaderRefs = ref<Record<number, HTMLElement>>({})
const deptCardRefs = ref<Record<string, HTMLElement>>({})
const othersRefs = ref<Record<number, HTMLElement>>({})

function runAnimations() {
  nextTick(() => {
    // 社长团
    Object.values(leaderRefs.value).forEach((el, i) => {
      if (!el) return
      gsap.from(el, {
        y: 30, opacity: 0, scale: 0.95,
        duration: 0.5, delay: i * 0.15, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      })
    })

    // 部门标题
    gsap.utils.toArray('.dept-title').forEach((el: any) => {
      gsap.from(el, {
        x: -15, opacity: 0, duration: 0.4, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      })
    })

    // 部长/副部长
    Object.values(deptCardRefs.value).forEach((el, i) => {
      if (!el) return
      gsap.from(el, {
        y: 25, opacity: 0, duration: 0.45, delay: (i % 3) * 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      })
    })
  })
}

// ── 数据加载 ──
async function loadData() {
  loading.value = true
  error.value = false
  try {
    const res = await fetch('http://localhost:8080/api/members')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: ApiMember[] = await res.json()

    // 社长团
    const presidentMembers = data
      .filter(m => m.department === '社长团')
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toMember)
    leaders.value = presidentMembers

    // 各部门（排除社长团）
    const deptMap = new Map<string, ApiMember[]>()
    for (const m of data) {
      if (m.department === '社长团') continue
      const list = deptMap.get(m.department) || []
      list.push(m)
      deptMap.set(m.department, list)
    }

    // 按预设顺序排列部门
    const deptNames = Array.from(deptMap.keys()).sort(
      (a, b) => getDeptOrder(a) - getDeptOrder(b)
    )

    departments.value = deptNames.map(name => {
      const members = deptMap.get(name)!
      const sorted = [...members].sort((a, b) => a.sortOrder - b.sortOrder)
      return {
        icon: getDeptIcon(name),
        name,
        leads: sorted.filter(m => m.isLead).map(toMember),
        others: sorted.filter(m => !m.isLead).map(toMember),
      }
    })

    loading.value = false
    runAnimations()
  } catch (e) {
    loading.value = false
    error.value = true
    console.error('Failed to fetch members:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.member-page {
  margin: 1.5rem 0;
}

/* ── 加载 / 错误状态 ── */
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

/* ── 社长团 ── */
.leader-block {
  margin-bottom: 3rem;
}

.leader-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.leader-card {
  display: flex;
  gap: 1.5rem;
  padding: 1.75rem 2rem;
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  position: relative;
  overflow: hidden;
}

.dark .leader-card {
  background: rgba(30, 30, 50, 0.65);
}

.leader-card::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 80px; height: 80px;
  background: var(--vp-c-brand-soft);
  border-radius: 0 14px 0 80px;
  opacity: 0.3;
  transition: opacity 0.3s;
}

.leader-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(252, 85, 49, 0.12);
  border-color: var(--vp-c-brand-1);
}

.leader-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.leader-avatar-text {
  color: #fff;
  font-size: 2rem;
  font-weight: 800;
}

.leader-info {
  flex: 1;
  min-width: 0;
}

.leader-name {
  margin: 0 0 0.1rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.leader-role {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #fff;
  background: var(--vp-c-brand-1);
  padding: 0.15rem 0.55rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.leader-bio {
  font-size: 0.87rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0 0 0.5rem;
}

.leader-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.leader-tag {
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

/* ── 部门 ── */
.dept-block {
  margin-bottom: 2.5rem;
}

.dept-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--vp-c-brand-1);
}

.dept-icon {
  margin-right: 0.4rem;
}

.dept-lead-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 0.75rem;
}

/* ── 部员卡片 ── */
.dept-member-card {
  display: flex;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  transition: transform 0.2s, box-shadow 0.2s;
}

.dark .dept-member-card {
  background: rgba(30, 30, 48, 0.55);
}

.dept-member-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.lead-card {
  border-left: 3px solid var(--vp-c-brand-1);
}

.dm-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.dm-avatar.small {
  width: 40px;
  height: 40px;
  font-size: 0.95rem;
}

.dm-info {
  flex: 1;
  min-width: 0;
}

.dm-name {
  margin: 0 0 0.1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.dm-role-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 3px;
  margin-bottom: 0.35rem;
}

.dm-role-badge:is(.minister) {
  background: rgba(103, 194, 58, 0.12);
  color: #67c23a;
}

.dm-role-badge:is(.vice-minister) {
  background: rgba(230, 162, 60, 0.12);
  color: #e6a23c;
}

.dm-role-badge:is(.other-role) {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-3);
}

.dm-bio {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
  margin: 0 0 0.45rem;
}

.dm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.dm-tag {
  font-size: 0.68rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

/* ── 其他成员折叠 ── */
.others-section {
  margin-top: 0.5rem;
}

.others-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px dashed var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.others-toggle:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.toggle-icon {
  font-size: 0.7rem;
  width: 16px;
  text-align: center;
}

.others-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

/* ── 展开动画 ── */
.expand-enter-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 600px;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .leader-grid {
    grid-template-columns: 1fr;
  }

  .leader-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
    gap: 1rem;
  }

  .leader-avatar {
    width: 60px;
    height: 60px;
  }

  .leader-avatar-text {
    font-size: 1.6rem;
  }

  .leader-tags {
    justify-content: center;
  }

  .dept-lead-grid {
    grid-template-columns: 1fr;
  }

  .dept-member-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .dm-tags {
    justify-content: center;
  }

  .others-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .leader-card {
    padding: 1.25rem 1rem;
    border-radius: 10px;
  }

  .leader-name {
    font-size: 1.05rem;
  }

  .leader-bio {
    font-size: 0.8rem;
  }

  .dept-title {
    font-size: 1.15rem;
  }

  .dept-member-card {
    padding: 0.85rem 1rem;
  }

  .dm-name {
    font-size: 0.92rem;
  }

  .dm-bio {
    font-size: 0.78rem;
  }
}
</style>
