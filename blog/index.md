---
layout: page
title: 博客
---

<script setup>
import BlogIndex from '../.vitepress/theme/components/BlogIndex.vue'
import { posts } from '../.vitepress/theme/posts'
</script>

<BlogIndex :posts="posts" />
