<template>
  <div ref="el" class="fade-in" :class="{ visible: isVisible }">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const el = ref<HTMLElement>()
const isVisible = ref(false)

onMounted(() => {
  if (!el.value) return
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isVisible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(el.value)
})
</script>

<style scoped>
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
