import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const admin = ref<any>(null)

  function setUser(u: any) {
    user.value = u
    if (u) {
      localStorage.setItem('user', JSON.stringify(u))
    }
    else {
      localStorage.removeItem('user')
    }
  }

  function setAdmin(a: any) {
    admin.value = a
    if (a) {
      localStorage.setItem('admin', JSON.stringify(a))
    }
    else {
      localStorage.removeItem('admin')
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Clear cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  function logoutAdmin() {
    admin.value = null
    localStorage.removeItem('admin')
    localStorage.removeItem('adminToken')
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  // Load from local storage on init
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('user')
    if (savedUser)
      user.value = JSON.parse(savedUser)

    const savedAdmin = localStorage.getItem('admin')
    if (savedAdmin)
      admin.value = JSON.parse(savedAdmin)
  }

  return {
    user,
    admin,
    setUser,
    setAdmin,
    logout,
    logoutAdmin,
  }
})
