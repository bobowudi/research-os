// ==================== Pinia 认证状态管理 ====================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/shared/api/client'
import type { UserRole } from '@research-os/shared'

interface UserInfo {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
}

interface TenantInfo {
  id: string
  name: string
  slug: string
  plan: string
}

export const useAuthStore = defineStore('auth', () => {
  // ====== 状态 ======
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const user = ref<UserInfo | null>(null)
  const tenant = ref<TenantInfo | null>(null)
  const initialized = ref(false)

  // ====== 计算属性 ======
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role ?? 'viewer')
  const isAdmin = computed(() => user.value?.role === 'admin')

  // ====== 操作 ======

  /** 从 localStorage 恢复会话 */
  async function initFromStorage() {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefresh = localStorage.getItem('refreshToken')

    if (storedToken) {
      accessToken.value = storedToken
      refreshToken.value = storedRefresh

      try {
        const res = await apiClient.get('/api/auth/me')
        user.value = res.data.data.user
        tenant.value = res.data.data.tenant
      } catch {
        // 令牌无效，清除
        clearAuth()
      }
    }

    initialized.value = true
  }

  /** 登录 */
  async function login(email: string, password: string) {
    const res = await apiClient.post('/api/auth/login', { email, password })
    const data = res.data.data

    setTokens(data.accessToken, data.refreshToken)

    // 获取用户信息
    const meRes = await apiClient.get('/api/auth/me')
    user.value = meRes.data.data.user
    tenant.value = meRes.data.data.tenant
  }

  /** 注册 */
  async function register(input: {
    email: string
    password: string
    name: string
    orgName: string
    orgSlug: string
    industry?: string
    teamSize?: string
  }) {
    const res = await apiClient.post('/api/auth/register', input)
    const data = res.data.data

    setTokens(data.accessToken, data.refreshToken)

    const meRes = await apiClient.get('/api/auth/me')
    user.value = meRes.data.data.user
    tenant.value = meRes.data.data.tenant
  }

  /** 登出 */
  async function logout() {
    try {
      await apiClient.post('/api/auth/logout')
    } catch {
      // 即使请求失败也要清除本地状态
    }
    clearAuth()
  }

  /** 刷新令牌 */
  async function doRefreshToken(): Promise<boolean> {
    if (!refreshToken.value) return false

    try {
      const res = await apiClient.post('/api/auth/refresh', {
        refreshToken: refreshToken.value,
      })
      const data = res.data.data
      setTokens(data.accessToken, data.refreshToken)
      return true
    } catch {
      clearAuth()
      return false
    }
  }

  /** 设置令牌 */
  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  /** 清除认证状态 */
  function clearAuth() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    tenant.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return {
    // 状态
    accessToken,
    refreshToken,
    user,
    tenant,
    initialized,
    // 计算
    isLoggedIn,
    userRole,
    isAdmin,
    // 操作
    initFromStorage,
    login,
    register,
    logout,
    doRefreshToken,
    clearAuth,
  }
})
