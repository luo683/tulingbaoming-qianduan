---
layout: page
title: AI 智能问答
---

<script setup>
import AiChat from '../.vitepress/theme/components/AiChat.vue'
</script>

<div class="chat-page-wrapper">
  <AiChat />
</div>

<style>
/* 问答页面全屏聊天布局 */
.chat-page-wrapper {
  margin: -24px -24px 0;
  padding: 0;
}

/* 隐藏该页面的标题和 footer */
.VPDoc .container > .content .content-container > main > h1,
.VPDoc .container > .content .content-container > main > h2 {
  display: none;
}
</style>
