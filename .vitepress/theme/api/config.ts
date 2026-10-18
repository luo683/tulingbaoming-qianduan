/**
 * 后端 API 基址的唯一来源。
 *
 * 背景：此前 `192.168.2.120:8080` 被硬编码在 12 个文件、40 多处，换个网络环境
 * 就整体不可用（fetch 超时 → 请求静默失败）。现在改为运行时推导。
 *
 * 解析优先级（从高到低）：
 *   1. VITE_API_BASE 环境变量（构建/启动时注入，部署到别的机器用它）
 *   2. 浏览器当前访问的 hostname + 后端端口 8080
 *   3. 构建期（SSR / 无 window）回退到 localhost
 *
 * 这样本地用 localhost 打开、局域网用 192.168.x.x 打开、域名反代打开，都能自动对上。
 */

/** 后端服务端口，与 tulin/application.yml 的 server.port 保持一致 */
const BACKEND_PORT = 8080

/** 是否显式关闭"跟随当前 hostname"的行为，强制走 VITE_API_BASE */
const envBase = import.meta.env?.VITE_API_BASE as string | undefined

function resolveOrigin(): string {
  if (envBase) return envBase.replace(/\/+$/, '')

  // SSR / 构建期没有 window，用一个安全的占位
  if (typeof window === 'undefined') return `http://localhost:${BACKEND_PORT}`

  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:${BACKEND_PORT}`
}

/** 后端根地址，例如 http://localhost:8080 */
export const API_ORIGIN = resolveOrigin()

/** 后端 API 根地址，例如 http://localhost:8080/api */
export const API_BASE = `${API_ORIGIN}/api`

/**
 * 拼一个完整的 API 地址。
 * @example apiUrl('/events')        → http://localhost:8080/api/events
 * @example apiUrl('/events/1/stats')
 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}
