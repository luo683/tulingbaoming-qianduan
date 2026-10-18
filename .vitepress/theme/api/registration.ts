import { API_BASE } from './config'

export interface RegistrationData {
  realName: string
  phone: string
  email?: string
  notes?: string
}

export interface Registration {
  id: number
  eventId: number
  userId: number
  username: string
  studentId?: string
  realName: string
  phone: string
  email?: string
  status: 'registered' | 'attended' | 'cancelled'
  attendedAt?: string
  certificateGenerated: boolean
  certificateUrl?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface RegistrationStats {
  eventId: number
  totalRegistered: number
  totalAttended: number
  totalCancelled: number
  maxParticipants: number
  isFull: boolean
}

/**
 * 获取活动报名统计
 */
export async function getRegistrationStats(eventId: number): Promise<RegistrationStats> {
  const res = await fetch(`${API_BASE}/events/${eventId}/registrations/stats`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '获取统计失败')
  return data.data
}

/**
 * 报名活动
 */
export async function registerForEvent(
  eventId: number,
  userId: number,
  data: RegistrationData
): Promise<Registration> {
  const res = await fetch(`${API_BASE}/events/${eventId}/registrations?userId=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await res.json()
  if (!result.ok) throw new Error(result.error || '报名失败')
  return result.data
}

/**
 * 取消报名
 */
export async function cancelRegistration(eventId: number, userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}/registrations?userId=${userId}`, {
    method: 'DELETE',
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '取消失败')
}

/**
 * 获取我的报名记录
 */
export async function getMyRegistrations(userId: number): Promise<Registration[]> {
  const res = await fetch(`${API_BASE}/registrations/my?userId=${userId}`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '获取失败')
  return data.data
}

/**
 * 检查是否已报名
 */
export async function checkRegistration(eventId: number, userId: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/events/${eventId}/registrations/check?userId=${userId}`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '检查失败')
  return data.isRegistered
}

/**
 * 管理员：获取活动报名列表
 */
export async function getEventRegistrations(eventId: number): Promise<Registration[]> {
  const res = await fetch(`${API_BASE}/events/${eventId}/registrations/admin`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '获取失败')
  return data.data
}

/**
 * 管理员：标记签到
 */
export async function markAttendance(registrationId: number): Promise<Registration> {
  const res = await fetch(`${API_BASE}/registrations/${registrationId}/attend`, {
    method: 'PUT',
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '签到失败')
  return data.data
}

/**
 * 管理员：生成证明
 */
export async function generateCertificate(
  registrationId: number,
  certificateUrl: string
): Promise<Registration> {
  const res = await fetch(`${API_BASE}/registrations/${registrationId}/certificate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ certificateUrl }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '生成失败')
  return data.data
}
