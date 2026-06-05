<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="visible" class="login-overlay" @click.self="close" @keydown.esc="close">
        <div class="login-panel" ref="panelRef">
          <!-- 关闭按钮 -->
          <button class="modal-close" @click="close" title="关闭（ESC）">✕</button>

          <!-- 未登录：登录/注册表单 -->
          <template v-if="!auth.isLoggedIn.value">
            <div class="login-header">
              <div class="login-icon">🔐</div>
              <h2>{{ isRegister ? '注册账号' : '登录图灵学社' }}</h2>
              <p class="login-hint">
                {{ isRegister ? '注册后即可使用问答社区等功能' : '登录后可使用问答社区、资源下载等功能' }}
              </p>
            </div>

            <!-- 成功提示 -->
            <div v-if="successMsg" class="login-success">{{ successMsg }}</div>

            <!-- 错误提示 -->
            <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>

            <form class="login-form" @submit.prevent="handleSubmit" @keydown.esc="close">
              <label class="form-field">
                <span class="field-label">用户名</span>
                <input
                  ref="usernameInput"
                  v-model="username"
                  type="text"
                  class="field-input"
                  placeholder="请输入用户名"
                  autocomplete="username"
                  :disabled="loading"
                  @keydown.enter="focusPassword"
                />
              </label>

              <label class="form-field">
                <span class="field-label">密码</span>
                <input
                  ref="passwordInput"
                  v-model="password"
                  type="password"
                  class="field-input"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  :disabled="loading"
                  @keydown.enter="isRegister && confirmPassword !== undefined ? $refs.confirmInput?.focus() : handleSubmit()"
                />
              </label>

              <!-- 注册时显示确认密码 -->
              <label v-if="isRegister" class="form-field">
                <span class="field-label">确认密码</span>
                <input
                  ref="confirmInput"
                  v-model="confirmPassword"
                  type="password"
                  class="field-input"
                  placeholder="请再次输入密码"
                  :disabled="loading"
                />
              </label>

              <!-- 注册时显示额外信息 -->
              <label v-if="isRegister" class="form-field">
                <span class="field-label">学院</span>
                <input
                  v-model="college"
                  type="text"
                  class="field-input"
                  placeholder="请输入学院"
                  :disabled="loading"
                />
              </label>

              <label v-if="isRegister" class="form-field">
                <span class="field-label">学号</span>
                <input
                  v-model="studentId"
                  type="text"
                  class="field-input"
                  placeholder="请输入学号"
                  :disabled="loading"
                />
              </label>

              <label v-if="isRegister" class="form-field">
                <span class="field-label">专业</span>
                <input
                  v-model="major"
                  type="text"
                  class="field-input"
                  placeholder="请输入专业"
                  :disabled="loading"
                />
              </label>

              <label v-if="isRegister" class="form-field">
                <span class="field-label">年级</span>
                <input
                  v-model="grade"
                  type="text"
                  class="field-input"
                  placeholder="例如：2024级"
                  :disabled="loading"
                  @keydown.enter="handleSubmit"
                />
              </label>

              <button type="submit" class="btn-login" :disabled="loading || !canSubmit">
                {{ loading ? '处理中…' : (isRegister ? '注 册' : '登 录') }}
              </button>
            </form>



            <div class="login-switch">
              {{ isRegister ? '已有账号？' : '没有账号？' }}
              <button type="button" class="btn-switch" @click="toggleMode">
                {{ isRegister ? '去登录' : '去注册' }}
              </button>
            </div>
          </template>

          <!-- 已登录：个人信息 + 修改密码 -->
          <template v-else>
            <div class="login-header">
              <div class="user-avatar-large">{{ auth.user.value?.avatar }}</div>
              <h2>{{ auth.user.value?.username }}</h2>
              <p class="user-role">
                {{ auth.isAdmin.value ? '🛡️ 管理员' : '🧑‍🎓 普通用户' }}
              </p>
            </div>

            <!-- 提示信息 -->
            <div v-if="successMsg" class="login-success">{{ successMsg }}</div>
            <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>

            <div class="user-actions">
              <!-- 修改密码表单 -->
              <div v-if="showChangePwd" class="change-pwd-section">
                <h3 class="section-subtitle">🔒 修改密码</h3>
                <form @submit.prevent="handleChangePwd">
                  <label class="form-field">
                    <span class="field-label">原密码</span>
                    <input v-model="oldPwd" type="password" class="field-input" placeholder="输入原密码" />
                  </label>
                  <label class="form-field">
                    <span class="field-label">新密码</span>
                    <input v-model="newPwd" type="password" class="field-input" placeholder="输入新密码" />
                  </label>
                  <label class="form-field">
                    <span class="field-label">确认新密码</span>
                    <input v-model="newPwdConfirm" type="password" class="field-input" placeholder="再次输入新密码" />
                  </label>
                  <div class="pwd-actions">
                    <button type="button" class="btn-cancel-mini" @click="showChangePwd = false">取消</button>
                    <button type="submit" class="btn-save-mini" :disabled="!canChangePwd">保存</button>
                  </div>
                </form>
              </div>

              <!-- 用户信息卡片 -->
              <div v-else class="user-info-card">
                <div class="info-row">
                  <span class="info-label">用户名</span>
                  <span class="info-value">{{ auth.user.value?.username }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">角色</span>
                  <span class="info-value" :class="{ 'text-admin': auth.isAdmin.value }">
                    {{ auth.isAdmin.value ? '管理员' : '普通用户' }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="info-label">注册时间</span>
                  <span class="info-value">刚刚</span>
                </div>
              </div>

              <div class="user-buttons">
                <button class="btn-outline-action" @click="showChangePwd = !showChangePwd; clearMessages()">
                  🔒 {{ showChangePwd ? '返回' : '修改密码' }}
                </button>
                <button class="btn-logout" @click="handleLogout">
                  🚪 退出登录
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { useAuth } from '../auth'

const auth = useAuth()

const visible = ref(false)
const isRegister = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const college = ref('')
const studentId = ref('')
const major = ref('')
const grade = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const panelRef = ref<HTMLElement>()
const usernameInput = ref<HTMLInputElement>()
const passwordInput = ref<HTMLInputElement>()
const showChangePwd = ref(false)
const oldPwd = ref('')
const newPwd = ref('')
const newPwdConfirm = ref('')

const canSubmit = computed(() => {
  if (!username.value.trim() || !password.value.trim()) return false
  if (isRegister.value && password.value !== confirmPassword.value) return false
  if (isRegister.value && (!college.value.trim() || !studentId.value.trim() || !major.value.trim() || !grade.value.trim())) return false
  return true
})

const canChangePwd = computed(() => {
  return oldPwd.value && newPwd.value.length >= 4 && newPwd.value === newPwdConfirm.value
})

function clearMessages() {
  errorMsg.value = ''
  successMsg.value = ''
}

function toggleMode() {
  isRegister.value = !isRegister.value
  clearMessages()
  nextTick(() => usernameInput.value?.focus())
}

function focusPassword() {
  passwordInput.value?.focus()
}

function quickFill(user: string, pass: string) {
  username.value = user
  password.value = pass
  errorMsg.value = ''
}

function open() {
  visible.value = true
  errorMsg.value = ''
  successMsg.value = ''
  showChangePwd.value = false
  nextTick(() => {
    if (panelRef.value) {
      gsap.from(panelRef.value, { scale: 0.92, opacity: 0, duration: 0.3, ease: 'back.out(1.4)' })
    }
    if (auth.isLoggedIn.value) return
    usernameInput.value?.focus()
  })
}

function close() {
  visible.value = false
  isRegister.value = false
  errorMsg.value = ''
  successMsg.value = ''
  showChangePwd.value = false
}

async function handleSubmit() {
  if (!canSubmit.value) {
    if (isRegister.value && password.value !== confirmPassword.value) {
      errorMsg.value = '两次输入的密码不一致'
    }
    return
  }
  errorMsg.value = ''
  loading.value = true

  const result = isRegister.value
    ? await auth.register(username.value.trim(), password.value.trim(), {
        college: college.value.trim(),
        studentId: studentId.value.trim(),
        major: major.value.trim(),
        grade: grade.value.trim()
      })
    : await auth.login(username.value.trim(), password.value.trim())

  loading.value = false

  if (!result.ok) {
    errorMsg.value = result.error || '操作失败'
    return
  }

  successMsg.value = isRegister.value ? '🎉 注册成功！' : '✅ 登录成功！'
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  college.value = ''
  studentId.value = ''
  major.value = ''
  grade.value = ''

  setTimeout(() => close(), 1500)
}

async function handleChangePwd() {
  if (!canChangePwd.value) {
    errorMsg.value = '请确保新密码至少 4 位且两次输入一致'
    return
  }
  const result = await auth.changePassword(oldPwd.value, newPwd.value)
  if (!result.ok) {
    errorMsg.value = result.error || '修改失败'
    return
  }
  successMsg.value = '✅ 密码修改成功'
  oldPwd.value = ''
  newPwd.value = ''
  newPwdConfirm.value = ''
  setTimeout(() => {
    successMsg.value = ''
    showChangePwd.value = false
  }, 1500)
}

function handleLogout() {
  auth.logout()
  setTimeout(() => close(), 300)
}

// ESC 关闭
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && visible.value) {
    close()
  }
}

onMounted(() => {
  ;(window as any).__openLogin = open
  document.addEventListener('keydown', onKeydown)
})

// 暴露给父组件
defineExpose({ open, close })
</script>

<style scoped>
/* Overlay */
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Panel */
.login-panel {
  position: relative;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  padding: 2.5rem 2rem 2rem;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.modal-close:hover {
  background: var(--vp-c-bg-mute);
  color: var(--vp-c-text-1);
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.user-avatar-large { font-size: 3rem; margin-bottom: 0.5rem; }

.login-header h2 {
  margin: 0 0 0.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.login-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.user-role {
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

/* Messages */
.login-error {
  background: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.3);
  color: #f56c6c;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  text-align: center;
}

.login-success {
  background: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.3);
  color: #67c23a;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  text-align: center;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.field-input {
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.field-input::placeholder { color: var(--vp-c-text-3); }
.field-input:disabled { opacity: 0.6; }

.btn-login {
  padding: 0.65rem;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, transform 0.1s;
  margin-top: 0.25rem;
}

.btn-login:hover:not(:disabled) { background: var(--vp-c-brand-2); }
.btn-login:active:not(:disabled) { transform: scale(0.98); }
.btn-login:disabled { opacity: 0.5; cursor: not-allowed; }

/* Preset accounts */
.login-accounts {
  margin-bottom: 1.25rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.login-accounts summary {
  cursor: pointer;
  user-select: none;
  padding: 0.35rem 0;
  color: var(--vp-c-text-2);
}

.login-accounts summary:hover { color: var(--vp-c-brand-1); }

.accounts-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  background: var(--vp-c-bg-mute);
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s;
}

.account-row:hover {
  background: var(--vp-c-brand-soft);
}

.account-role {
  font-weight: 600;
  font-size: 0.78rem;
}

.account-role.admin { color: #f0932b; }
.account-role.user { color: #409eff; }

.account-row code {
  font-size: 0.75rem;
  background: transparent;
  color: var(--vp-c-text-2);
}

/* Switch */
.login-switch {
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.btn-switch {
  border: none;
  background: none;
  color: var(--vp-c-brand-1);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
  margin-left: 0.25rem;
}

.btn-switch:hover { text-decoration: underline; }

/* User info */
.user-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-info-card {
  background: var(--vp-c-bg-mute);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label { font-size: 0.85rem; color: var(--vp-c-text-3); }

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.text-admin { color: #f0932b !important; }

.user-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.btn-outline-action {
  padding: 0.6rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-outline-action:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.btn-logout {
  padding: 0.6rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-logout:hover {
  border-color: #f56c6c;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.06);
}

/* Change password */
.section-subtitle {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.75rem;
}

.change-pwd-section .form-field {
  margin-bottom: 0.75rem;
}

.pwd-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
}

.btn-cancel-mini {
  padding: 0.4rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
  cursor: pointer;
  font-family: inherit;
}

.btn-save-mini {
  padding: 0.4rem 1.25rem;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-save-mini:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transition */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* 移动端 */
@media (max-width: 480px) {
  .login-panel {
    padding: 1.75rem 1.25rem 1.5rem;
    border-radius: 12px;
    max-width: 100%;
  }
  .login-header h2 { font-size: 1.15rem; }
  .account-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
