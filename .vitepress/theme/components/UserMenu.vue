<template>
  <div class="user-menu">
    <!-- 未登录：显示登录按钮 -->
    <button v-if="!auth.isLoggedIn.value" class="btn-login-entry" @click="openLogin" title="登录">
      <span class="login-icon-text">👤 登录</span>
    </button>

    <!-- 已登录：显示用户头像 + 下拉菜单 -->
    <div v-else class="user-dropdown" ref="dropdownRef">
      <button class="btn-user-avatar" @click="toggleDropdown" :title="auth.user.value?.username">
        <span class="avatar-emoji">{{ auth.user.value?.avatar }}</span>
        <span class="avatar-name">{{ auth.user.value?.username }}</span>
        <span class="avatar-arrow" :class="{ open: dropdownOpen }">▾</span>
      </button>

      <transition name="dropdown">
        <div v-if="dropdownOpen" class="dropdown-panel">
          <div class="dropdown-header">
            <span class="header-avatar">{{ auth.user.value?.avatar }}</span>
            <div>
              <div class="header-name">{{ auth.user.value?.username }}</div>
              <div class="header-role" :class="{ admin: auth.isAdmin.value }">
                {{ auth.isAdmin.value ? '🛡️ 管理员' : '🧑‍🎓 普通用户' }}
              </div>
            </div>
          </div>
          <div class="dropdown-divider" />
          <button class="dropdown-item" @click="openLogin">
            👤 个人信息
          </button>
          <button v-if="auth.isAdmin.value" class="dropdown-item admin-item" @click="goAdmin">
            ⚙️ 管理面板
          </button>
          <div class="dropdown-divider" />
          <button class="dropdown-item logout" @click="handleLogout">
            🚪 退出登录
          </button>
        </div>
      </transition>
    </div>

    <!-- 登录弹窗 -->
    <LoginModal ref="loginModalRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../auth'
import LoginModal from './LoginModal.vue'

const auth = useAuth()
const loginModalRef = ref<InstanceType<typeof LoginModal>>()
const dropdownRef = ref<HTMLElement>()
const dropdownOpen = ref(false)

function openLogin() {
  dropdownOpen.value = false
  loginModalRef.value?.open()
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function handleLogout() {
  if (auth.logout()) {
    dropdownOpen.value = false
  }
}

function goAdmin() {
  dropdownOpen.value = false
  window.location.href = '/admin/knowledge.html'
}

// 点击外部关闭下拉
function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
/* ── 容器：位于导航栏右侧（流式布局，不再使用固定定位） ── */
.user-menu {
  display: flex;
  align-items: center;
  margin-left: 12px;
  flex-shrink: 0;
}

/* ── 登录入口按钮 ── */
.btn-login-entry {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}

.btn-login-entry:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.login-icon-text {
  line-height: 1;
}

/* ── 用户头像 ── */
.user-dropdown {
  position: relative;
}

.btn-user-avatar {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}

.btn-user-avatar:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 8px var(--vp-c-brand-soft);
}

.avatar-emoji { font-size: 1.1rem; line-height: 1; }
.avatar-name { max-width: 80px; overflow: hidden; text-overflow: ellipsis; }
.avatar-arrow { font-size: 0.65rem; color: var(--vp-c-text-3); transition: transform 0.2s; }
.avatar-arrow.open { transform: rotate(180deg); }

/* ── 下拉菜单 ── */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
}

.header-avatar { font-size: 1.5rem; }
.header-name { font-size: 0.88rem; font-weight: 600; color: var(--vp-c-text-1); }
.header-role { font-size: 0.72rem; color: var(--vp-c-text-3); margin-top: 0.1rem; }
.header-role.admin { color: #f0932b; }

.dropdown-divider {
  height: 1px;
  background: var(--vp-c-border);
  margin: 0 0.5rem;
}

.dropdown-item {
  width: 100%;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.dropdown-item:hover { background: var(--vp-c-bg-mute); }
.dropdown-item.logout:hover {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.06);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 移动端 */
@media (max-width: 768px) {
  .user-menu {
    margin-left: 8px;
  }

  .btn-login-entry {
    padding: 0.25rem 0.55rem;
    font-size: 0.72rem;
    border-radius: 12px;
  }

  .avatar-name { display: none; }

  .btn-user-avatar {
    padding: 0.2rem 0.35rem;
    border-radius: 12px;
  }

  .dropdown-panel { right: 0; }
}
</style>
