<template>
  <div class="about-timeline">
    <div class="timeline">
      <div v-for="(item, idx) in items" :key="idx" class="timeline-item">
        <div class="year">{{ item.year }}</div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const items = [
  { year: '2020', title: '学社成立', desc: '由 5 名计算机学院大三学生发起，第一期招募 30 人。' },
  { year: '2021', title: '首次 ACM 区域赛获奖', desc: '学社竞赛队获得 ICPC 亚洲区域赛铜牌，实现零的突破。' },
  { year: '2022', title: '举办首届校内 Hackathon', desc: '联合校团委举办"48 小时 Hackathon"，吸引 200+ 名参赛者。' },
  { year: '2023', title: '开源项目破千星', desc: '学社孵化的开源课程评价平台在 GitHub 突破 1000 Star。' },
  { year: '2024', title: '成员突破 200 人', desc: '覆盖本硕博三个层次，成为校内最具影响力的技术社团之一。' },
]

onMounted(() => {
  nextTick(() => {
    // 时间线逐项入场
    gsap.from('.timeline-item', {
      x: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.25,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })

    gsap.from('.timeline-item .year', {
      y: -10,
      opacity: 0,
      duration: 0.4,
      stagger: 0.25,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })
  })
})
</script>

<style scoped>
.timeline {
  position: relative;
  padding-left: 2rem;
  margin: 2rem 0;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--vp-c-brand-1);
  opacity: 0.3;
}

.timeline-item {
  position: relative;
  padding-bottom: 2rem;
  padding-left: 1rem;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -1.65rem;
  top: 0.5rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

.year {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.25rem;
}

.timeline-item h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.timeline-item p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.92rem;
  line-height: 1.6;
}

@media (max-width: 480px) {
  .timeline {
    padding-left: 1.5rem;
    margin: 1.5rem 0;
  }

  .timeline::before {
    left: 0.35rem;
  }

  .timeline-item {
    padding-bottom: 1.5rem;
    padding-left: 0.75rem;
  }

  .timeline-item::before {
    left: -1.2rem;
    width: 8px;
    height: 8px;
  }

  .timeline-item h3 {
    font-size: 1rem;
  }

  .timeline-item p {
    font-size: 0.85rem;
  }

}
</style>
