export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      return navigateTo('/admin/login')
    }
  }
})
