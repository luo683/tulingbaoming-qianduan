<template>
  <div class="app-wrapper">
    <ParticleBackground />
    <Layout>
      <template #nav-bar-content-after>
        <UserMenu />
      </template>
    </Layout>
    <BackToTop />
    <CodeCopy />
  </div>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'
import { onMounted, nextTick } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { gsap } from 'gsap'
import ParticleBackground from './components/ParticleBackground.vue'
import UserMenu from './components/UserMenu.vue'
import BackToTop from './components/BackToTop.vue'
import CodeCopy from './components/CodeCopy.vue'

const { Layout } = DefaultTheme
const { page } = useData()
const isBlogPost = page.value.relativePath?.startsWith('blog/') && page.value.relativePath !== 'blog/index.md'

onMounted(() => {
  nextTick(() => {
    gsap.from('.app-wrapper', { opacity: 0, duration: 0.4, ease: 'power2.out' })
  })
})
</script>

<style>
.app-wrapper {
  position: relative;
}

.app-wrapper .Layout {
  position: relative;
  z-index: 1;
}
</style>
