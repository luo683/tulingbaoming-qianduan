<template>
  <div class="project-showcase">
    <!-- Loading state -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- Error state -->
    <div v-else-if="error" class="error">❌ 加载失败 <button @click="loadProjects">重试</button></div>

    <!-- Content -->
    <template v-else>
      <h2 class="showcase-title">分类 - 项目</h2>

      <div v-for="(group, idx) in groupedProjects" :key="idx" class="year-group">
        <div class="year-label">{{ group.year }}</div>
        <div class="project-list">
          <a
            v-for="(project, pIdx) in group.projects"
            :key="project.slug"
            :href="auth.isLoggedIn.value ? (project.githubLink || project.demoLink || '/projects/' + project.slug) : '#'"
            class="project-card"
            :class="{ 'card-locked': !auth.isLoggedIn.value }"
            :title="!auth.isLoggedIn.value ? '🔒 登录后查看' : undefined"
            @click="handleProjectClick"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="project-cover">
              <!-- Use GitHub/Demo link preview or coverEmoji as placeholder -->
              <div class="cover-placeholder">{{ project.coverEmoji || project.title[0] }}</div>
            </div>
            <div class="project-info">
              <h3 class="project-name">{{ project.title }}</h3>
              <div class="project-tags">
                <span v-for="tag in project.tags" :key="tag" class="tag">#{{ tag }}</span>
              </div>
              <p v-if="project.description" class="project-desc">{{ project.description }}</p>
              <div class="project-stats">
                <span v-if="project.starCount !== undefined" class="stat">
                  ⭐ {{ project.starCount }}
                </span>
                <span v-if="project.memberCount !== undefined" class="stat">
                  👥 {{ project.memberCount }}
                </span>
                <span v-if="project.status" class="stat stat-status" :class="'status-' + project.status">
                  {{ project.status === 'active' ? '活跃' : project.status === 'completed' ? '已完成' : project.status === 'maintaining' ? '维护中' : project.status }}
                </span>
              </div>
            </div>
            <div class="project-index">{{ getGlobalIndex(idx, pIdx) }}</div>
          </a>
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

interface Project {
  title: string
  slug: string
  cover?: string
  coverEmoji?: string
  tags: string[]
  year: number
  date: string
  description: string
  githubLink?: string
  demoLink?: string
  memberCount?: number
  starCount?: number
  status?: string
}

const API_URL = 'http://192.168.2.120:8080/api/projects'

const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref(false)

const groupedProjects = computed(() => {
  const groups: Record<number, Project[]> = {}
  for (const p of projects.value) {
    if (!groups[p.year]) groups[p.year] = []
    groups[p.year].push(p)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, pjs]) => ({
      year: Number(year),
      projects: pjs.sort((a, b) => b.date.localeCompare(a.date)),
    }))
})

function getGlobalIndex(groupIdx: number, projectIdx: number): number {
  let count = 0
  for (let i = 0; i < groupIdx; i++) {
    count += groupedProjects.value[i].projects.length
  }
  return count + projectIdx + 1
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ===== Login guard =====
function openLoginIfNeeded() {
  ;(window as any).__openLogin?.()
}

function handleProjectClick(e: MouseEvent) {
  if (!auth.isLoggedIn.value) {
    e.preventDefault()
    openLoginIfNeeded()
  }
}

onMounted(() => {
  loadProjects()
})

async function loadProjects() {
  loading.value = true
  error.value = false
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list: any[] = Array.isArray(data) ? data : (data.data || data.projects || [])

    const currentYear = new Date().getFullYear()
    const currentDate = new Date().toISOString().slice(0, 10)

    projects.value = list.map((item: any) => ({
      title: item.name || '',
      slug: item.slug || slugify(item.name || ''),
      cover: item.cover || undefined,
      coverEmoji: item.coverEmoji || undefined,
      tags: item.techTags
        ? item.techTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : (item.tags || []),
      year: item.year || (item.createdAt ? new Date(item.createdAt).getFullYear() : currentYear),
      date: item.date || (item.createdAt ? item.createdAt.slice(0, 10) : currentDate),
      description: item.description || '',
      githubLink: item.githubLink || undefined,
      demoLink: item.demoLink || undefined,
      memberCount: item.memberCount,
      starCount: item.starCount,
      status: item.status || undefined,
    }))

    runAnimations()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function runAnimations() {
  nextTick(() => {
    const groups = document.querySelectorAll('.year-group')
    groups.forEach((group) => {
      gsap.from(group.querySelector('.year-label'), {
        x: -15, opacity: 0, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: group, start: 'top 82%', toggleActions: 'play none none none' }
      })
      gsap.from(group.querySelectorAll('.project-card'), {
        x: -30, opacity: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: group, start: 'top 82%', toggleActions: 'play none none none' }
      })
      gsap.from(group.querySelectorAll('.project-index'), {
        opacity: 0, scale: 1.3, duration: 0.4, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: group, start: 'top 82%', toggleActions: 'play none none none' }
      })
    })
  })
}
</script>

<style scoped>
.project-showcase {
  margin-top: 1rem;
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

.showcase-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--vp-c-text-1);
}

.year-group {
  margin-bottom: 2rem;
}

.year-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--vp-c-border);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  border: 1px solid var(--vp-c-border);
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  position: relative;
}

.dark .project-card {
  background: rgba(30, 30, 32, 0.7);
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Locked card styling */
.project-card.card-locked {
  opacity: 0.65;
  cursor: pointer;
  border: 1px dashed var(--vp-c-border);
}

.project-card.card-locked:hover {
  opacity: 0.8;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: none;
}

.project-cover {
  width: 140px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
}

.project-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-weight: 400;
}

.project-desc {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.stat {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.stat-status {
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  font-size: 0.72rem;
  font-weight: 600;
}

.stat-status.status-active {
  color: #fff;
  background: #67c23a;
}

.stat-status.status-completed {
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
}

.stat-status.status-maintaining {
  color: #fff;
  background: var(--vp-c-brand-1);
}

.project-index {
  font-size: 3rem;
  font-weight: 700;
  color: var(--vp-c-text-3);
  opacity: 0.3;
  flex-shrink: 0;
  min-width: 50px;
  text-align: right;
}

@media (max-width: 768px) {
  .project-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .project-cover {
    width: 100%;
    height: 140px;
  }
  .project-index {
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    font-size: 2rem;
  }
}
</style>
