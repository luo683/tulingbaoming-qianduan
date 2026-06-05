<template>
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">图灵学社</h1>
      <p class="hero-desc">
        探索计算机科学的无限可能——从算法到系统，从理论到实践，
        与志同道合的人一起打造未来。
      </p>
      <div class="hero-search">
        <input
          v-model="query"
          type="text"
          placeholder="搜索文章、话题、问答..."
          class="search-input"
          @keyup.enter="goSearch"
        />
        <button class="search-btn" @click="goSearch">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>
      <div class="hero-actions">
        <a href="/about"  class="btn btn-primary">了解我们</a>
        <a href="/about#join" class="btn btn-outline">加入我们</a>
      </div>
    </div>
    <div class="hero-code">
      <pre><code><span class="kw">fn</span> <span class="fn">main</span>() {
    <span class="macro">println!</span>(<span class="str">"Hello, Turing!"</span>);
}</code></pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'

const query = ref('')

function goSearch() {
  const q = query.value.trim()
  if (q) {
    window.location.href = `/blog/?q=${encodeURIComponent(q)}`
  }
}

onMounted(() => {
  nextTick(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    tl.from('.hero-title', { y: 40, opacity: 0, duration: 0.8 })
      .from('.hero-desc', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero-search', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
      .from('.hero-actions .btn', { scale: 0.8, opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.2')
      .from('.hero-code', { x: 60, opacity: 0, duration: 0.8, ease: 'power4.out' }, '-=0.4')

    // 代码块逐行打字机效果
    const codeLines = document.querySelectorAll('.hero-code code')
    if (codeLines.length) {
      const codeEl = codeLines[0] as HTMLElement
      const html = codeEl.innerHTML
      const lines = html.split('\n')
      codeEl.innerHTML = lines.map(l => `<span class="code-line" style="display:block;opacity:0">${l}</span>`).join('')
      tl.to('.hero-code .code-line', {
        opacity: 1,
        duration: 0.3,
        stagger: 0.12,
        ease: 'none'
      }, '-=0.5')
    }
  })
})
</script>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
  padding: 3rem 0 2.5rem;
  position: relative;
}

.hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--vp-c-border);
}

.hero-content {
  flex: 1;
  max-width: 540px;
}

.hero-title {
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1);
  letter-spacing: -0.02em;
}

.hero-desc {
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.hero-search {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 1.25rem;
  max-width: 440px;
}

.search-input {
  flex: 1;
  height: 42px;
  padding: 0 1rem;
  border: 1px solid var(--vp-c-border);
  border-right: none;
  border-radius: 4px 0 0 4px;
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.search-btn {
  height: 42px;
  width: 48px;
  border: 1px solid var(--vp-c-border);
  border-left: none;
  border-radius: 0 4px 4px 0;
  background: var(--vp-c-brand-1);
  color: #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.search-btn:hover {
  background: var(--vp-c-brand-2);
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
}

.hero-code {
  flex-shrink: 0;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1.25rem 1.75rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.hero-code pre {
  margin: 0;
  background: transparent !important;
}

.hero-code code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.88rem;
  line-height: 1.8;
}

.hero-code .kw { color: var(--vp-c-brand-1); }
.hero-code .fn { color: var(--vp-c-accent-1); }
.hero-code .macro { color: #e6a23c; }
.hero-code .str { color: #67c23a; }

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    padding: 2rem 0 1.5rem;
    text-align: center;
  }
  .hero-content {
    max-width: 100%;
  }
  .hero-title {
    font-size: 2rem;
  }
  .hero-search {
    max-width: 100%;
  }
  .hero-actions {
    justify-content: center;
  }
  .hero-code {
    display: none;
  }
}
</style>
