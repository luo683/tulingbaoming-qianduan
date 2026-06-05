<template>
  <section class="featured-project-section">
    <div class="section-header">
      <div>
        <h2 class="section-title">项目精选</h2>
        <p class="section-subtitle">社团成员的实战项目与开源作品</p>
      </div>
      <a href="/projects/" class="btn btn-outline">全部项目 →</a>
    </div>

    <div class="featured-card">
      <!-- 左侧视觉区 -->
      <div class="card-visual">
        <div class="terminal">
          <div class="terminal-bar">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
            <span class="terminal-title">system-architecture</span>
          </div>
          <pre class="terminal-body"><code><span class="comment">// 终点小说网 - 微服务架构</span>

┌─────────────┐
│  <span class="highlight">Vue3 前端</span>   │
└──────┬──────┘
       │
┌──────▼──────┐
│  <span class="highlight">API Gateway</span> │  Spring Cloud Gateway
└──┬───┬───┬──┘
   │   │   │
┌──▼┐┌─▼─┐┌▼──┐
│<span class="kw">用户</span>││<span class="kw">小说</span>││<span class="kw">搜索</span>│  微服务集群
└──┬┘└─┬─┘└┬──┘
   │   │   │
┌──▼───▼───▼──┐
│ <span class="str">Redis</span> │ <span class="str">MySQL</span> │  数据层
│ <span class="str">MQ</span>  │  <span class="str">ES</span>   │
└─────────────┘</code></pre>
        </div>
      </div>

      <!-- 右侧文本区 -->
      <div class="card-text">
        <div class="project-badge">🔥 Featured</div>
        <h3 class="project-title">终点小说网</h3>
        <p class="project-desc">
          基于微服务架构的在线小说阅读平台，支持海量小说在线阅读、全文检索、智能推荐及用户互动。
          采用 Spring Cloud 全家桶 + Vue3 前后端分离架构。
        </p>
        <div class="project-stats">
          <div class="stat">
            <span class="stat-value">7</span>
            <span class="stat-label">微服务</span>
          </div>
          <div class="stat">
            <span class="stat-value">50k+</span>
            <span class="stat-label">代码行</span>
          </div>
          <div class="stat">
            <span class="stat-value">3</span>
            <span class="stat-label">开发者</span>
          </div>
        </div>
        <div class="project-tech">
          <span class="tech-tag" v-for="tag in tags" :key="tag">{{ tag }}</span>
        </div>
        <a href="/projects/novel-website" class="project-link">查看详情 →</a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const tags = ['Vue3', 'Spring Cloud', 'MyBatis-Plus', 'Redis', 'RabbitMQ', 'ElasticSearch']

onMounted(() => {
  nextTick(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.featured-card',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    })

    tl.from('.card-visual', { x: -30, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.terminal-bar', { y: -20, opacity: 0, duration: 0.4 }, '-=0.3')
      .from('.terminal-body', { opacity: 0, duration: 0.5 }, '-=0.2')
      .from('.project-badge', { x: -10, opacity: 0, duration: 0.4 }, '-=0.3')
      .from('.project-title', { y: 20, opacity: 0, duration: 0.4 }, '-=0.2')
      .from('.project-desc', { y: 20, opacity: 0, duration: 0.4 }, '-=0.2')
      .from('.project-stats .stat', { scale: 0.5, opacity: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(2)' }, '-=0.2')
      .from('.tech-tag', { y: 10, opacity: 0, duration: 0.3, stagger: 0.06 }, '-=0.2')
      .from('.project-link', { opacity: 0, duration: 0.3 }, '-=0.1')
  })
})
</script>

<style scoped>
.featured-project-section {
  padding: 3.5rem 0;
  border-bottom: 1px solid var(--vp-c-border);
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.75rem;
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

.featured-card {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  border: 1px solid var(--vp-c-border);
  transition: transform 0.2s, box-shadow 0.2s;
}

.dark .featured-card {
  background: rgba(30, 30, 32, 0.75);
}

.featured-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 左侧终端 */
.card-visual {
  flex: 1;
  min-width: 0;
}

.terminal {
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e2e;
  border: 1px solid #313244;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.terminal-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 0.85rem;
  background: #181825;
  border-bottom: 1px solid #313244;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.red { background: #f38ba8; }
.dot.yellow { background: #f9e2af; }
.dot.green { background: #a6e3a1; }

.terminal-title {
  margin-left: 0.5rem;
  font-size: 0.72rem;
  color: #6c7086;
  font-family: var(--vp-font-family-mono);
}

.terminal-body {
  margin: 0;
  padding: 1rem;
  font-size: 0.78rem;
  line-height: 1.6;
  color: #cdd6f4;
  font-family: var(--vp-font-family-mono);
  overflow-x: auto;
  flex: 1;
}

.terminal-body .comment { color: #6c7086; }
.terminal-body .highlight { color: #89b4fa; font-weight: 600; }
.terminal-body .kw { color: #f38ba8; }
.terminal-body .str { color: #a6e3a1; }

/* 右侧文本 */
.card-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.project-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  background: rgba(252, 85, 49, 0.1);
  color: var(--vp-c-brand-1);
  margin-bottom: 0.75rem;
  width: fit-content;
}

.project-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.75rem;
}

.project-desc {
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0 0 1.25rem;
}

.project-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.25rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-top: 0.15rem;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.tech-tag {
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
  border-radius: 3px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.project-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: opacity 0.2s;
}

.project-link:hover {
  opacity: 0.75;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .featured-card {
    flex-direction: column;
    gap: 1.25rem;
  }
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .project-stats {
    gap: 1.25rem;
  }
}

@media (max-width: 480px) {
  .featured-card {
    padding: 1rem;
    gap: 1rem;
  }

  .project-title {
    font-size: 1.25rem;
  }

  .project-desc {
    font-size: 0.85rem;
  }

  .project-stats {
    gap: 1rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .terminal-body {
    font-size: 0.7rem;
    padding: 0.75rem;
  }
}
</style>
