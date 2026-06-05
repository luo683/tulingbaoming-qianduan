---
layout: page
title: 活动日历
description: 图灵学社活动日历 — 技术讲座、Workshop、Hackathon、竞赛集训、招新活动。
---

<script setup>
import EventTimeline from '../.vitepress/theme/components/EventTimeline.vue'
import events from '../data/events.json'
</script>

# 📅 活动日历

学社的每一次活动都在这里记录。技术讲座、Workshop、Hackathon、竞赛集训、招新活动——不错过任何精彩。

---

<EventTimeline :events="events" />
