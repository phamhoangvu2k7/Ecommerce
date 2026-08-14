import { useAuthStore } from '~/stores/auth'

export function isJwtExpired(token: string): boolean {
  if (!token)
    return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3)
      return true
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp)
      return false
    return Date.now() >= payload.exp * 1000
  }
  catch {
    return true
  }
}

export async function refreshAdminToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('adminRefreshToken') || ''
    const res = await fetch('/api/admin/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const data = await res.json()
    if (data.success && data.token) {
      localStorage.setItem('adminToken', data.token)
      if (data.refreshToken) {
        localStorage.setItem('adminRefreshToken', data.refreshToken)
      }
      return true
    }
  }
  catch {
    // Ignore error
  }
  return false
}

export async function useAdminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authStore = useAuthStore()
  let adminToken = localStorage.getItem('adminToken')

  if (adminToken && isJwtExpired(adminToken)) {
    const refreshed = await refreshAdminToken()
    if (refreshed) {
      adminToken = localStorage.getItem('adminToken')
    }
    else {
      authStore.logoutAdmin()
      if (import.meta.client) {
        navigateTo('/admin/login')
      }
      throw new Error('Phiên đăng nhập đã hết hạn.')
    }
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`
  }

  let res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    const refreshed = await refreshAdminToken()
    if (refreshed) {
      adminToken = localStorage.getItem('adminToken')
      if (adminToken) {
        headers.Authorization = `Bearer ${adminToken}`
      }
      res = await fetch(url, { ...options, headers })
    }

    if (res.status === 401) {
      authStore.logoutAdmin()
      if (import.meta.client) {
        navigateTo('/admin/login')
      }
    }
  }

  return res
}
