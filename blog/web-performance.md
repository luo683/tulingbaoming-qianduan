---
title: 前端性能优化实战
date: 2026-04-15
author: 王五
tags: [前端, 性能优化]
description: 从首屏加载到运行时优化，分享我们在学社官网重构中的实践经验。
---

# 前端性能优化实战

前端性能直接影响用户体验和搜索引擎排名。本文记录我们在重构学社官网时的性能优化实践。

## 首屏加载优化

### 1. 资源体积

构建产物的体积是加载速度的决定性因素。我们做了以下几件事：

```js
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router'],
          'ui': ['@some-ui-lib'],
        }
      }
    }
  }
}
```

通过拆包，首屏只需加载当前页面需要的代码，其余模块按需加载。

### 2. 图片优化

- **WebP 格式**: 比 JPEG 小 25-35%
- **响应式图片**: 用 `<picture>` + `srcset` 根据屏幕宽度加载不同尺寸
- **懒加载**: `loading="lazy"` 让视口外的图片延迟加载

```html
<picture>
  <source srcset="/hero.webp" type="image/webp">
  <img src="/hero.jpg" alt="hero" loading="lazy" width="1200" height="600">
</picture>
```

## 运行时优化

### 避免不必要的重渲染

用 Chrome DevTools 的 **Performance** 面板录制交互过程，查看火焰图定位瓶颈：

- 使用 `React.memo` / `computed` 缓存计算结果
- 列表虚拟化（仅渲染可视区内的 DOM 节点）
- 节流/防抖高频事件（scroll、resize）

### Core Web Vitals 指标

| 指标 | 目标 | 说明 |
|------|------|------|
| LCP | < 2.5s | 最大内容绘制 |
| FID | < 100ms | 首次输入延迟 |
| CLS | < 0.1 | 累积布局偏移 |

## 总结

性能优化是持续的工程。先从测量开始（Lighthouse / WebPageTest），找到瓶颈后再针对性优化，而不是凭直觉瞎调。

<RelatedPosts currentTitle="前端性能优化实战" :currentTags='["前端", "性能优化"]' />

<AskQuestion />
