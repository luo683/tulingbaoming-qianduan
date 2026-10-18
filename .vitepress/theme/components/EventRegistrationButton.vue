<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../auth'
import { useEventRegistration } from '../composables/useEventRegistration'

const props = defineProps<{
  eventId: number
}>()

const { isLoggedIn } = useAuth()
const {
  stats,
  isRegistered,
  canRegister,
  loading,
  error,
  loadData,
  register,
  cancel
} = useEventRegistration(props.eventId)

const showForm = ref(false)
const formData = ref({
  realName: '',
  phone: '',
  email: '',
  notes: '',
})

onMounted(() => {
  loadData()
})

async function handleRegister() {
  if (!formData.value.realName || !formData.value.phone) {
    alert('请填写姓名和电话')
    return
  }

  const success = await register(formData.value)
  if (success) {
    showForm.value = false
    formData.value = { realName: '', phone: '', email: '', notes: '' }
    alert('报名成功！')
  } else if (error.value) {
    alert(error.value)
  }
}

async function handleCancel() {
  const success = await cancel()
  if (success) {
    alert('已取消报名')
  } else if (error.value) {
    alert(error.value)
  }
}
</script>

<template>
  <div class="event-registration">
    <!-- 报名统计 -->
    <div v-if="stats" class="stats">
      <span class="stat-item">
        👥 已报名: {{ stats.totalRegistered }}
        <template v-if="stats.maxParticipants > 0">/ {{ stats.maxParticipants }}</template>
      </span>
      <span v-if="stats.isFull" class="full-badge">已满</span>
    </div>

    <!-- 未登录 -->
    <div v-if="!isLoggedIn" class="login-hint">
      <a href="/admin/">登录</a>后可报名
    </div>

    <!-- 已报名 -->
    <div v-else-if="isRegistered" class="registered">
      <span class="status-badge registered">✓ 已报名</span>
      <button @click="handleCancel" :disabled="loading" class="btn-cancel">
        取消报名
      </button>
    </div>

    <!-- 可报名 -->
    <div v-else-if="canRegister">
      <button @click="showForm = true" :disabled="loading" class="btn-register">
        立即报名
      </button>
    </div>

    <!-- 已满 -->
    <div v-else-if="stats?.isFull" class="full-hint">
      报名人数已满
    </div>

    <!-- 报名表单弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content">
        <h3>活动报名</h3>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>真实姓名 *</label>
            <input v-model="formData.realName" type="text" required placeholder="请输入真实姓名" />
          </div>

          <div class="form-group">
            <label>联系电话 *</label>
            <input v-model="formData.phone" type="tel" required placeholder="请输入手机号" />
          </div>

          <div class="form-group">
            <label>电子邮箱</label>
            <input v-model="formData.email" type="email" placeholder="选填" />
          </div>

          <div class="form-group">
            <label>备注</label>
            <textarea v-model="formData.notes" placeholder="其他信息（选填）"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" @click="showForm = false" class="btn-secondary">取消</button>
            <button type="submit" :disabled="loading" class="btn-primary">确认报名</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<style scoped>
.event-registration {
  margin: 1rem 0;
}

.stats {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.full-badge {
  padding: 0.2rem 0.5rem;
  background: var(--vp-c-danger);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.status-badge.registered {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-3);
}

.btn-register, .btn-cancel, .btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-register {
  background: var(--vp-c-brand-1);
  color: white;
}

.btn-register:hover {
  background: var(--vp-c-brand-2);
}

.btn-cancel {
  background: transparent;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  margin-left: 0.5rem;
}

.btn-cancel:hover {
  color: var(--vp-c-red-1);
  border-color: var(--vp-c-red-1);
}

.login-hint, .full-hint {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.login-hint a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: var(--vp-c-bg);
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: white;
}

.btn-primary:hover {
  background: var(--vp-c-brand-2);
}

.btn-secondary {
  background: transparent;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
}

.error-message {
  margin-top: 0.5rem;
  color: var(--vp-c-red-1);
  font-size: 0.9rem;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
