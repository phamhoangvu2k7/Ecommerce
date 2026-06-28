<script setup lang="ts">
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";

const router = useRouter();

const step = ref(1); // 1: Email input, 2: OTP verify, 3: New Password

const email = ref("");
const otp = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const resetToken = ref("");

const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

// Step 1: Send OTP
async function handleSendOTP() {
  if (!email.value) {
    errorMsg.value = "Vui lòng nhập địa chỉ email.";
    return;
  }

  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";

  try {
    const res = await fetch("/api/client/user/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value })
    });
    const data = await res.json();
    if (data.success) {
      successMsg.value = data.message;
      step.value = 2;
    } else {
      errorMsg.value = data.message || data.statusMessage || "Lỗi gửi mã OTP.";
    }
  } catch (err: any) {
    errorMsg.value = "Có lỗi xảy ra khi kết nối máy chủ.";
  } finally {
    loading.value = false;
  }
}

// Step 2: Verify OTP
async function handleVerifyOTP() {
  if (!otp.value) {
    errorMsg.value = "Vui lòng nhập mã OTP.";
    return;
  }

  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";

  try {
    const res = await fetch("/api/client/user/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.value, otp: otp.value })
    });
    const data = await res.json();
    if (data.success) {
      resetToken.value = data.resetToken;
      successMsg.value = data.message;
      step.value = 3;
    } else {
      errorMsg.value = data.message || data.statusMessage || "Mã OTP không hợp lệ.";
    }
  } catch (err: any) {
    errorMsg.value = "Có lỗi xảy ra khi kết nối máy chủ.";
  } finally {
    loading.value = false;
  }
}

// Step 3: Reset Password
async function handleResetPassword() {
  if (!newPassword.value || !confirmPassword.value) {
    errorMsg.value = "Vui lòng nhập đầy đủ mật khẩu.";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = "Mật khẩu xác nhận không khớp.";
    return;
  }

  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";

  try {
    const res = await fetch("/api/client/user/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken: resetToken.value, password: newPassword.value })
    });
    const data = await res.json();
    if (data.success) {
      successMsg.value = "Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...";
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } else {
      errorMsg.value = data.message || data.statusMessage || "Lỗi khôi phục mật khẩu.";
    }
  } catch (err: any) {
    errorMsg.value = "Có lỗi xảy ra khi kết nối máy chủ.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="forgot-page container">
    <div class="forgot-card premium-card glass-panel fade-in-item">
      <h2 class="card-title">Khôi phục mật khẩu</h2>
      <p class="card-subtitle">
        <span v-if="step === 1">Nhập email để nhận mã xác thực OTP</span>
        <span v-else-if="step === 2">Nhập mã OTP 6 số đã được gửi tới email {{ email }}</span>
        <span v-else>Nhập mật khẩu mới của bạn</span>
      </p>

      <div v-if="successMsg" class="alert alert-success">
        {{ successMsg }}
      </div>
      <div v-if="errorMsg" class="alert alert-error">
        {{ errorMsg }}
      </div>

      <!-- Step 1: Input Email -->
      <form v-if="step === 1" @submit.prevent="handleSendOTP">
        <div class="input-group">
          <label class="input-label">Địa chỉ Email tài khoản</label>
          <input v-model="email" type="email" placeholder="example@gmail.com" class="premium-input" required />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-primary w-full mt-4">
          {{ loading ? 'Đang gửi mã...' : 'Nhận mã OTP' }}
        </button>
      </form>

      <!-- Step 2: Input OTP -->
      <form v-if="step === 2" @submit.prevent="handleVerifyOTP">
        <div class="input-group">
          <label class="input-label">Mã OTP (6 chữ số)</label>
          <input v-model="otp" type="text" placeholder="Nhập mã OTP" class="premium-input" required maxlength="6" />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-primary w-full mt-4">
          {{ loading ? 'Đang xác thực...' : 'Xác thực OTP' }}
        </button>
        <button type="button" @click="step = 1" class="btn btn-secondary w-full mt-2">
          Quay lại nhập email
        </button>
      </form>

      <!-- Step 3: Input New Password -->
      <form v-if="step === 3" @submit.prevent="handleResetPassword">
        <div class="input-group">
          <label class="input-label">Mật khẩu mới</label>
          <input v-model="newPassword" type="password" placeholder="Nhập mật khẩu mới" class="premium-input" required minlength="6" />
        </div>
        <div class="input-group">
          <label class="input-label">Xác nhận mật khẩu mới</label>
          <input v-model="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" class="premium-input" required minlength="6" />
        </div>
        <button type="submit" :disabled="loading" class="btn btn-primary w-full mt-4">
          {{ loading ? 'Đang cập nhật...' : 'Xác nhận Đổi mật khẩu' }}
        </button>
      </form>

      <div class="card-footer">
        Quay lại trang <RouterLink to="/login" class="login-link">Đăng nhập</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.forgot-card {
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

.mt-2 {
  margin-top: 0.5rem;
}
</style>
