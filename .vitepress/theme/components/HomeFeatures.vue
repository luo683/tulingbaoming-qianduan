<template>
  <section class="section" ref="sectionRef">
    <h2 class="section-title">我们在做什么</h2>
    <p class="section-subtitle">从课堂到产业，让每一位成员都能找到自己的技术方向</p>
    <div class="card-grid">
      <div class="card">
        <div class="card-icon">📚</div>
        <h3>技术讲座</h3>
        <p>
          每周邀请学长学姐或行业前辈分享技术经验，涵盖前后端、AI、系统、安全等多个方向，
          帮你打破信息差。
        </p>
      </div>
      <div class="card">
        <div class="card-icon">🏆</div>
        <h3>竞赛战队</h3>
        <p>
          ACM 程序设计竞赛、蓝桥杯、CTF 安全赛、Kaggle 数据科学赛——
          组队参赛，以赛促学，积累实战经验。
        </p>
      </div>
      <div class="card">
        <div class="card-icon">🛠️</div>
        <h3>项目实战</h3>
        <p>
          从开源工具到课程大作业，从 Hackathon 到创业项目——
          在真实项目中锻炼工程能力，打造你的作品集。
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const sectionRef = ref<HTMLElement>()

onMounted(() => {
  nextTick(() => {
    if (!sectionRef.value) return
    const cards = sectionRef.value.querySelectorAll('.card')
    const icons = sectionRef.value.querySelectorAll('.card-icon')

    gsap.from(cards, {
      y: 50,
      opacity: 0,
      duration: 0.7,
      stagger: 0.2,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })

    gsap.from(icons, {
      scale: 0,
      duration: 0.5,
      stagger: 0.2,
      ease: 'back.out(2)',
      scrollTrigger: {
        trigger: sectionRef.value,
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })
  })
})
</script>

<style scoped>
.section {
  padding: 3.5rem 0;
}

.section-title {
  text-align: center;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.section-subtitle {
  text-align: center;
  color: var(--vp-c-text-2);
  margin-bottom: 2.5rem;
  font-size: 1rem;
}

.card-icon {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 768px) {
  .section {
    padding: 2.5rem 0;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 0.92rem;
    margin-bottom: 1.75rem;
  }

  .card-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
}

@media (max-width: 480px) {
  .section {
    padding: 2rem 0;
  }

  .section-title {
    font-size: 1.35rem;
  }

  .section-subtitle {
    font-size: 0.88rem;
    margin-bottom: 1.5rem;
    padding: 0 0.5rem;
  }

  .card-icon {
    font-size: 1.35rem;
  }
}
</style>
