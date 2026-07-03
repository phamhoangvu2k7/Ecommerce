<script setup lang="ts">
import { ref } from "vue";
const router = useRouter();

const fullName = ref("");
const email = ref("");
const password = ref("");
const phone = ref("");

const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

async function handleRegister() {
  if (!fullName.value || !email.value || !password.value) {
    errorMsg.value = "Vui lòng điền các trường bắt buộc (*).";
    return;
  }

  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";

  try {
    const res = await fetch("/api/client/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.value,
        email: email.value,
        password: password.value,
        phone: phone.value
      })
    });

    const data = await res.json();
    if (data.success) {
      successMsg.value = "Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...";
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      errorMsg.value = data.message || data.statusMessage || "Đăng ký tài khoản thất bại.";
    }
  } catch (err: any) {
    errorMsg.value = "Có lỗi xảy ra khi kết nối máy chủ.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="register-page container">
    <div class="register-card premium-card glass-panel fade-in-item">
      <h2 class="card-title">Đăng ký tài khoản</h2>
      <p class="card-subtitle">Tạo tài khoản mới để trải nghiệm mua sắm đẳng cấp</p>

      <div v-if="successMsg" class="alert alert-success">
        {{ successMsg }}
      </div>
      <div v-if="errorMsg" class="alert alert-error">
        {{ errorMsg }}
      </div>

      <form v-if="!successMsg" @submit.prevent="handleRegister">
        <div class="input-group">
          <label class="input-label">Họ và tên *</label>
          <input v-model="fullName" type="text" placeholder="Nhập họ tên của bạn" class="premium-input" required />
        </div>

        <div class="input-group">
          <label class="input-label">Địa chỉ Email *</label>
          <input v-model="email" type="email" placeholder="example@gmail.com" class="premium-input" required />
        </div>

        <div class="input-group">
          <label class="input-label">Mật khẩu * (Tối thiểu 6 ký tự)</label>
          <input v-model="password" type="password" placeholder="Nhập mật khẩu bảo mật" class="premium-input" required minlength="6" />
        </div>

        <div class="input-group">
          <label class="input-label">Số điện thoại</label>
          <input v-model="phone" type="tel" placeholder="Nhập số điện thoại" class="premium-input" />
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary w-full mt-4">
          {{ loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản' }}
        </button>
      </form>

      <div class="card-footer">
        Đã có tài khoản? <RouterLink to="/login" class="login-link">Đăng nhập</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.register-card {
  width: 100%;
  max-width: 440px;
  padding: 2.5rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.25rem;
  text-align: center;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 2rem;
}

.card-footer {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.login-link {
  color: var(--primary);
  font-weight: 600;
}

.login-link:hover {
  text-decoration: underline;
}

.w-full {
  width: 100%;
}

.mt-4 {
  margin-top: 1rem;
}

@media (max-width: 576px) {
  .register-card {
    padding: 1.5rem;
  }
}
</style>
