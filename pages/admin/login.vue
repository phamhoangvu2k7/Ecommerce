<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.ts'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMsg.value = 'Vui lòng nhập đầy đủ thông tin.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json()
    if (data.success) {
      // Save adminToken in localStorage
      localStorage.setItem('adminToken', data.token)
      authStore.setAdmin(data.user)

      // Redirect to Dashboard
      router.push('/admin/dashboard')
    }
    else {
      errorMsg.value = data.statusMessage || 'Đăng nhập thất bại.'
    }
  }
  catch (err: any) {
    errorMsg.value = 'Lỗi kết nối đến máy chủ.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-login-page">
    <div class="login-card premium-card glass-panel fade-in-item">
      <h2 class="card-title">
        ⚡ Control Panel
      </h2>
      <p class="card-subtitle">
        Đăng nhập tài khoản quản lý của bạn
      </p>

      <div v-if="errorMsg" class="alert alert-error">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label class="input-label">Tài khoản Email</label>
          <input v-model="email" type="email" placeholder="admin@example.com" class="premium-input" required>
        </div>

        <div class="input-group">
          <label class="input-label">Mật khẩu</label>
          <input v-model="password" type="password" placeholder="Nhập mật khẩu" class="premium-input" required>
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary w-full mt-4">
          {{ loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.admin-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--bg-app);
}

.login-card {
  width: 100%;
  max-width: 410px;
  padding: 2.25rem 2rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
  margin-bottom: 0.25rem;
  text-align: center;
}

.card-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 1.75rem;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
