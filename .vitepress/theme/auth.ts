import { ref, computed } from 'vue'

export type Role = 'admin' | 'user' | null

export interface User {
  username: string
  role: Role
  avatar: string
}

const STORAGE_KEY = 'turing-user'
const TOKEN_KEY = 'turing-token'

// 后端 API 地址
const API_BASE = 'http://192.168.2.120:8080/api/auth'

// SSR 安全：服务端渲染时无 localStorage
const isBrowser = typeof window !== 'undefined'

// 全局响应式状态
const currentUser = ref<User | null>(loadUser())

function loadUser(): User | null {
  if (!isBrowser) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user: User | null, token?: string) {
  if (user && isBrowser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    if (token) localStorage.setItem(TOKEN_KEY, token)
  } else if (!user && isBrowser) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }
  currentUser.value = user
}

export function useAuth() {
  const isLoggedIn = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const user = computed(() => currentUser.value)

  /** 调用后端登录 API */
  async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()

      if (!data.ok) {
        return { ok: false, error: data.error || '登录失败' }
      }

      saveUser({
        username: data.username,
        role: data.role,
        avatar: data.avatar,
      }, data.token)

      return { ok: true }
    } catch (e) {
      return { ok: false, error: '无法连接服务器，请检查网络' }
    }
  }

  /** 调用后端注册 API */
  async function register(username: string, password: string, extra?: { college: string; studentId: string; major: string; grade: string }): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, ...extra }),
      })
      const data = await res.json()

      if (!data.ok) {
        return { ok: false, error: data.error || '注册失败' }
      }

      saveUser({
        username: data.username,
        role: data.role,
        avatar: data.avatar,
      }, data.token)

      return { ok: true }
    } catch (e) {
      return { ok: false, error: '无法连接服务器，请检查网络' }
    }
  }

  /** 调用后端修改密码 API */
  async function changePassword(oldPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
    if (!currentUser.value) return { ok: false, error: '请先登录' }
    try {
      const res = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.value.username,
          oldPassword,
          newPassword,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        return { ok: false, error: data.error || '修改失败' }
      }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: '无法连接服务器，请检查网络' }
    }
  }

  function logout(confirmFirst = true): boolean {
    if (confirmFirst && isBrowser && !window.confirm('确定要退出登录吗？')) {
      return false
    }
    saveUser(null)
    return true
  }

  return { isLoggedIn, isAdmin, user, login, logout, register, changePassword }
}
