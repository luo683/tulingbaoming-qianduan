---
title: 指导老师
---

<script setup>
import TeacherList from '../.vitepress/theme/components/TeacherList.vue'
</script>

<div class="teacher-section-header">
  <h1 class="teacher-section-title">🎓 指导老师</h1>
  <p class="teacher-section-sub">计算机学院 · 软件学院 · 人工智能学院</p>
</div>

<TeacherList />

<style scoped>
.teacher-section-header {
  text-align: center;
  margin: 2rem 0 2.5rem;
}

.teacher-section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.5rem;
}

.teacher-section-sub {
  font-size: 1rem;
  color: var(--vp-c-text-3);
  margin: 0;
}

@media (max-width: 480px) {
  .teacher-section-title {
    font-size: 1.5rem;
  }
}
</style>
