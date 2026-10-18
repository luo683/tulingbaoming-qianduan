import { ref, computed } from 'vue'
import { useAuth } from '../auth'
import * as regApi from '../api/registration'
import type { Registration, RegistrationData, RegistrationStats } from '../api/registration'

export function useEventRegistration(eventId: number) {
  const { user, isLoggedIn } = useAuth()

  const stats = ref<RegistrationStats | null>(null)
  const myRegistration = ref<Registration | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 是否已报名
  const isRegistered = computed(() => {
    return myRegistration.value !== null && myRegistration.value.status !== 'cancelled'
  })

  // 是否已满
  const isFull = computed(() => stats.value?.isFull || false)

  // 可以报名
  const canRegister = computed(() => {
    return isLoggedIn.value && !isRegistered.value && !isFull.value
  })

  // 加载统计和报名状态
  async function loadData() {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
      // 获取统计数据
      const statsData = await regApi.getRegistrationStats(eventId)
      stats.value = statsData

      // 获取我的报名记录
      const registrations = await regApi.getMyRegistrations(user.value.id)
      myRegistration.value = registrations.find(r => r.eventId === eventId) || null
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      console.error('加载报名数据失败:', e)
    } finally {
      loading.value = false
    }
  }

  // 报名
  async function register(data: RegistrationData) {
    if (!user.value) {
      error.value = '请先登录'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const registration = await regApi.registerForEvent(eventId, user.value.id, data)
      myRegistration.value = registration

      // 更新统计
      if (stats.value) {
        stats.value.totalRegistered++
        stats.value.isFull =
          stats.value.maxParticipants > 0 &&
          stats.value.totalRegistered >= stats.value.maxParticipants
      }

      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '报名失败'
      return false
    } finally {
      loading.value = false
    }
  }

  // 取消报名
  async function cancel() {
    if (!user.value) {
      error.value = '请先登录'
      return false
    }

    const confirmed = confirm('确定要取消报名吗？')
    if (!confirmed) return false

    loading.value = true
    error.value = null

    try {
      await regApi.cancelRegistration(eventId, user.value.id)

      if (myRegistration.value) {
        myRegistration.value.status = 'cancelled'
      }

      // 更新统计
      if (stats.value) {
        stats.value.totalRegistered--
        stats.value.totalCancelled++
        stats.value.isFull = false
      }

      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : '取消失败'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    myRegistration,
    loading,
    error,
    isRegistered,
    isFull,
    canRegister,
    loadData,
    register,
    cancel,
  }
}
