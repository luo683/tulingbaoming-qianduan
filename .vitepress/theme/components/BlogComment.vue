<template>
  <div class="blog-comment">
    <h2 class="comment-title">评论与讨论</h2>
    <p class="comment-hint">
      无需登录，填写昵称即可参与讨论。作者会收到通知并及时回复。
    </p>
    <div ref="cusdis" id="cusdis_thread" class="cusdis-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'
import { gsap } from 'gsap'

/*
 * 使用 Cusdis 轻量评论系统 — 无需登录，匿名可评
 *
 * 配置步骤：
 * 1. 访问 https://cusdis.com 注册账号
 * 2. 创建一个 Project，获取 App ID
 * 3. 将下面的 APP_ID 替换为你的实际值
 */

const APP_ID = 'your-cusdis-app-id'  // TODO: 替换为你的 Cusdis App ID

const { isDark, page } = useData()
const cusdis = ref<HTMLElement>()

function loadCusdis() {
  if (typeof window === 'undefined') return

  // Remove previous widget
  const existing = document.querySelector('#cusdis_thread iframe')
  if (existing) existing.remove()

  // Re-render placeholder
  const container = cusdis.value
  if (!container) return
  container.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://cusdis.com/js/cusdis.es.js'
  script.async = true
  script.defer = true

  // Cusdis reads these from window
  ;(window as any).CUSDIS = {
    host: 'https://cusdis.com',
    appId: APP_ID,
    pageId: page.value.relativePath,
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    pageTitle: page.value.title,
    theme: isDark.value ? 'dark' : 'light',
  }

  script.onload = () => {
    ;(window as any).renderCusdis?.()
  }

  document.head.appendChild(script)
}

onMounted(() => {
  loadCusdis()
  nextTick(() => {
    gsap.from('.blog-comment', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' })
  })
})

watch(isDark, () => {
  loadCusdis()
})
</script>

<style scoped>
.blog-comment {
  margin-top: 3rem;
  padding-top: 1.75rem;
  border-top: 1px solid var(--vp-c-border);
}

.comment-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: var(--vp-c-text-1);
}

.comment-hint {
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.cusdis-container {
  min-height: 200px;
}

.cusdis-container :deep(iframe) {
  max-width: 100%;
}

@media (max-width: 480px) {
  .blog-comment {
    margin-top: 2rem;
    padding-top: 1.25rem;
  }

  .comment-title {
    font-size: 1.05rem;
  }

  .comment-hint {
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }

  .cusdis-container {
    min-height: 160px;
  }
}
</style>
