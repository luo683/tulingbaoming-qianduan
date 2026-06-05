<template>
  <div style="display:none" />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

function addCopyButtons() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.code-copy-btn')) return

    const btn = document.createElement('button')
    btn.className = 'code-copy-btn'
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
    btn.title = '复制代码'

    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')
      if (!code) return
      const text = code.textContent || ''
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      btn.classList.add('copied')
      setTimeout(() => {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
        btn.classList.remove('copied')
      }, 2000)
    })

    pre.style.position = pre.style.position || 'relative'
    pre.appendChild(btn)
  })
}

onMounted(() => addCopyButtons())
watch(() => route.path, () => setTimeout(addCopyButtons, 100))
</script>

<style>
/* Global styles for copy button */
pre {
  position: relative;
}

.code-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  padding: 5px 7px;
  border-radius: 4px;
  border: 1px solid rgba(128, 128, 128, 0.2);
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  opacity: 0;
  font-family: inherit;
}

pre:hover .code-copy-btn {
  opacity: 1;
}

.code-copy-btn:hover {
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

.code-copy-btn.copied {
  border-color: #67c23a;
  color: #67c23a;
  background: rgba(103, 194, 58, 0.15);
}

/* 触摸屏始终显示复制按钮 */
@media (hover: none) and (pointer: coarse) {
  .code-copy-btn {
    opacity: 0.7;
    padding: 7px 9px;
  }
}

/* 小屏移动端 */
@media (max-width: 480px) {
  .code-copy-btn {
    opacity: 0.6;
    top: 4px;
    right: 4px;
    padding: 6px 8px;
  }
}
</style>
