<template>
  <section class="advisor-section">
    <div class="section-header">
      <h2 class="section-title">学术领航</h2>
      <p class="section-subtitle">指引方向的学术导师</p>
    </div>

    <div class="advisor-grid">
      <div
        v-for="advisor in advisors"
        :key="advisor.name"
        class="advisor-card"
      >
        <div class="card-glow"></div>
        <div class="card-inner">
          <!-- 左侧头像区 -->
          <div class="avatar-area">
            <div class="avatar-frame">
              <div class="avatar-placeholder">
                <svg class="avatar-icon" viewBox="0 0 80 80" fill="none">
                  <!-- 线稿风格人物轮廓 -->
                  <circle cx="40" cy="28" r="14" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M16 72c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <!-- 科技线条装饰 -->
                  <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4 6" opacity="0.4"/>
                  <path d="M10 40h6M64 40h6M40 10v6M40 64v6" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
                </svg>
                <span class="avatar-initial">{{ advisor.name[0] }}</span>
              </div>
            </div>
            <div class="avatar-dots">
              <span v-for="n in 5" :key="n" class="dot" :style="{ animationDelay: n * 0.3 + 's' }"></span>
            </div>
          </div>

          <!-- 右侧信息区 -->
          <div class="info-area">
            <div class="name-row">
              <h3 class="advisor-name">{{ advisor.name }}</h3>
              <span class="advisor-title">{{ advisor.title }}</span>
            </div>
            <div class="research-tags">
              <span v-for="tag in advisor.interests" :key="tag" class="research-badge">{{ tag }}</span>
            </div>
            <blockquote class="advisor-quote">
              "{{ advisor.quote }}"
            </blockquote>
            <div class="advisor-dept">{{ advisor.department }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface Advisor {
  name: string
  title: string
  department: string
  interests: string[]
  quote: string
}

const advisors: Advisor[] = [
  {
    name: '陈建国',
    title: '教授 / 博士生导师',
    department: '计算机学院 · 算法与理论方向',
    interests: ['人工智能', '分布式系统', '高并发架构'],
    quote: '从算法到系统，在这里看见技术的力量。',
  },
  {
    name: '刘明远',
    title: '副教授 / 硕士生导师',
    department: '软件学院 · 系统软件方向',
    interests: ['云原生', '微服务架构', 'DevOps'],
    quote: '写代码是手段，解决问题才是目的。',
  },
]

onMounted(() => {
  nextTick(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.advisor-section',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })

    tl.from('.advisor-card', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.3,
      ease: 'power3.out'
    })
    .from('.avatar-frame', {
      scale: 0.5,
      rotation: -10,
      duration: 0.6,
      stagger: 0.3,
      ease: 'back.out(1.7)'
    }, '-=0.6')
    .from('.avatar-dots .dot', {
      scale: 0,
      duration: 0.3,
      stagger: 0.05,
      ease: 'back.out(2)'
    }, '-=0.4')
    .from('.advisor-name, .advisor-title', {
      x: -15,
      opacity: 0,
      duration: 0.4,
      stagger: 0.1
    }, '-=0.3')
    .from('.research-badge', {
      y: 8,
      opacity: 0,
      duration: 0.3,
      stagger: 0.05
    }, '-=0.2')
    .from('.advisor-quote', {
      x: -15,
      opacity: 0,
      duration: 0.5
    }, '-=0.2')
  })
})
</script>

<style scoped>
.advisor-section {
  padding: 3.5rem 0;
  border-bottom: 1px solid var(--vp-c-border);
}

.section-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: var(--vp-c-text-1);
}

.section-subtitle {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  margin: 0;
}

.advisor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

/* 卡片主体 */
.advisor-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.advisor-card:hover {
  transform: translateY(-3px);
}

/* 悬停呼吸灯光效 */
.card-glow {
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(252, 85, 49, 0.15) 25%,
    transparent 50%,
    rgba(64, 158, 255, 0.15) 75%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: glow-rotate 6s linear infinite;
  z-index: 0;
}

.advisor-card:hover .card-glow {
  opacity: 1;
}

@keyframes glow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.card-inner {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid var(--vp-c-border);
}

.dark .card-inner {
  background: rgba(22, 22, 26, 0.8);
  border-color: rgba(255, 255, 255, 0.06);
}

/* 头像区 */
.avatar-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.avatar-frame {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(252, 85, 49, 0.08), rgba(64, 158, 255, 0.08));
  border: 1.5px solid var(--vp-c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.avatar-icon {
  position: absolute;
  width: 70%;
  height: 70%;
  color: var(--vp-c-text-3);
  opacity: 0.5;
}

.avatar-initial {
  position: relative;
  z-index: 1;
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  opacity: 0.85;
}

.avatar-dots {
  display: flex;
  gap: 4px;
}

.avatar-dots .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  opacity: 0.3;
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

/* 信息区 */
.info-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.advisor-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0;
}

.advisor-title {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.research-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.research-badge {
  font-size: 0.72rem;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(252, 85, 49, 0.08), rgba(64, 158, 255, 0.08));
  border: 1px solid rgba(252, 85, 49, 0.2);
  color: var(--vp-c-brand-1);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.dark .research-badge {
  background: linear-gradient(135deg, rgba(252, 85, 49, 0.12), rgba(64, 158, 255, 0.08));
  border-color: rgba(252, 85, 49, 0.25);
}

.advisor-quote {
  font-size: 1.05rem;
  font-style: italic;
  color: var(--vp-c-text-2);
  margin: 0 0 0.75rem;
  padding-left: 0.85rem;
  border-left: 3px solid var(--vp-c-brand-1);
  line-height: 1.7;
}

.advisor-dept {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

@media (max-width: 900px) {
  .advisor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .card-inner {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .name-row {
    justify-content: center;
  }
  .research-tags {
    justify-content: center;
  }
  .advisor-quote {
    border-left: none;
    padding-left: 0;
    text-align: center;
  }
}
</style>
