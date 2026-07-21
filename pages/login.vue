<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMsg.value = 'Vui lòng điền đầy đủ email và mật khẩu.'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await fetch('/api/client/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json()
    if (data.success) {
      // Save token & user context
      localStorage.setItem('token', data.token)
      authStore.setUser(data.user)

      // Re-fetch cart (to sync merged cart)
      await cartStore.fetchCart()

      // Redirect to home
      router.push('/')
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Đăng nhập thất bại.'
    }
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err: any) {
    errorMsg.value = 'Có lỗi xảy ra khi kết nối máy chủ.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page container">
    <div class="login-card premium-card glass-panel fade-in-item">
      <h2 class="card-title">
        Đăng nhập tài khoản
      </h2>
      <p class="card-subtitle">
        Nhập email và mật khẩu để tiếp tục mua sắm
      </p>

      <div v-if="errorMsg" class="alert alert-error">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label class="input-label">Địa chỉ Email</label>
          <input v-model="email" type="email" placeholder="example@gmail.com" class="premium-input" required>
        </div>

        <div class="input-group">
          <label class="input-label">Mật khẩu</label>
          <input v-model="password" type="password" placeholder="Nhập mật khẩu" class="premium-input" required>
        </div>

        <div class="form-options">
          <RouterLink to="/forgot-password" class="forgot-link">
            Quên mật khẩu?
          </RouterLink>
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary w-full mt-2">
          {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
      </form>

      <div class="card-footer">
        Chưa có tài khoản? <RouterLink to="/register" class="register-link">
          Đăng ký ngay
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 0;
}

.login-card {
  width: 100%;
  max-width: 410px;
  padding: 2.25rem 2rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
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

.form-options {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.25rem;
}

.forgot-link {
  font-size: 0.825rem;
  color: var(--text-muted);
  font-weight: 500;
  transition: color var(--transition-speed) ease;
}

.forgot-link:hover {
  color: var(--text-main);
  text-decoration: underline;
}

.card-footer {
  text-align: center;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-muted);
}

.register-link {
  color: var(--text-main);
  font-weight: 700;
}

.register-link:hover {
  text-decoration: underline;
}

.w-full {
  width: 100%;
}

.mt-2 {
  margin-top: 0.5rem;
}

@media (max-width: 576px) {
  .login-card {
    padding: 1.5rem 1.25rem;
  }
}
</style>
