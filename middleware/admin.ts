export default defineNuxtRouteMiddleware((to, from) => {
  if (process.client) {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      return navigateTo('/admin/login')
    }
  }
})
