import { isJwtExpired, refreshAdminToken } from '~/composables/useAdminFetch'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.client) {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      return navigateTo('/admin/login')
    }

    if (isJwtExpired(adminToken)) {
      const refreshed = await refreshAdminToken()
      if (!refreshed) {
        const authStore = useAuthStore()
        authStore.logoutAdmin()
        return navigateTo('/admin/login')
      }
    }
  }
})

