import { isJwtExpired } from '~/composables/useAdminFetch'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    const token = localStorage.getItem('token')
    if (!token || isJwtExpired(token)) {
      return navigateTo('/login')
    }
  }
})

