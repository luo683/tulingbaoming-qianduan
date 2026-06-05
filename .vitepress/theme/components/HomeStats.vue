<template>
  <section class="stats">
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number" data-target="200">0</span>
        <span class="stat-suffix">+</span>
        <span class="stat-label">注册成员</span>
      </div>
      <div class="stat-item">
        <span class="stat-number" data-target="50">0</span>
        <span class="stat-suffix">+</span>
        <span class="stat-label">技术讲座</span>
      </div>
      <div class="stat-item">
        <span class="stat-number" data-target="30">0</span>
        <span class="stat-suffix">+</span>
        <span class="stat-label">竞赛获奖</span>
      </div>
      <div class="stat-item">
        <span class="stat-number" data-target="1000">0</span>
        <span class="stat-suffix">+</span>
        <span class="stat-label">GitHub Stars</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

onMounted(() => {
  nextTick(() => {
    gsap.from('.stats-grid', {
      y: 40,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stats',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })

    // 数字滚动计数
    document.querySelectorAll('.stat-number').forEach((el) => {
      const target = parseInt((el as HTMLElement).dataset.target || '0')
      const obj = { value: 0 }
      gsap.to(obj, {
        value: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.stats',
          start: 'top 82%',
          toggleActions: 'play none none none'
        },
        onUpdate: () => {
          (el as HTMLElement).textContent = Math.round(obj.value).toString()
        }
      })
    })

    // 标签错峰出现
    gsap.from('.stat-label', {
      y: 10,
      opacity: 0,
      duration: 0.5,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stats',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })
  })
})
</script>

<style scoped>
.stats {
  padding: 3rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  display: inline;
}

.stat-suffix {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.stat-label {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  .stat-number {
    font-size: 2rem;
  }
  .stat-suffix {
    font-size: 1.6rem;
  }
}

@media (max-width: 480px) {
  .stats {
    padding: 2rem 0;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
  .stat-number {
    font-size: 1.6rem;
  }
  .stat-suffix {
    font-size: 1.3rem;
  }
  .stat-label {
    font-size: 0.78rem;
  }
}
</style>
