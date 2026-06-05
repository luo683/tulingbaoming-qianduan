<template>
  <button v-show="visible" class="back-to-top" @click="scrollToTop" title="返回顶部">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { gsap } from 'gsap'

const visible = ref(false)
const btnEl = ref<HTMLElement>()

function onScroll() {
  visible.value = window.scrollY > 400
}

function scrollToTop() {
  gsap.to(window, { scrollTo: { y: 0 }, duration: 0.8, ease: 'power2.inOut' })
}

// 显隐动画
watch(visible, (val) => {
  const el = document.querySelector('.back-to-top') as HTMLElement
  if (!el) return
  if (val) {
    gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
  } else {
    gsap.to(el, { y: 20, opacity: 0, duration: 0.3, ease: 'power2.in' })
  }
})

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 2rem;
  right: 1.5rem;
  z-index: 100;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.25s;
}

.back-to-top:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(252, 85, 49, 0.15);
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .back-to-top {
    bottom: 1.25rem;
    right: 0.75rem;
    width: 40px;
    height: 40px;
  }
}
</style>
