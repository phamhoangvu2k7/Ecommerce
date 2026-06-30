<script setup lang="ts">
import { useAuthStore } from "../../stores/auth.ts";

const authStore = useAuthStore();
</script>

<template>
  <div class="profile-page container">
    <h1 class="h1-title mb-8">Thông tin cá nhân</h1>

    <div v-if="authStore.user" class="profile-card premium-card glass-panel fade-in-item">
      <div class="profile-header">
        <div class="profile-avatar">
          {{ authStore.user.fullName.charAt(0) }}
        </div>
        <div class="profile-title-block">
          <h2 class="profile-name">{{ authStore.user.fullName }}</h2>
          <p class="profile-role">Khách hàng thành viên</p>
        </div>
      </div>

      <div class="profile-details-grid">
        <div class="detail-row">
          <span class="detail-label">Họ và tên:</span>
          <span class="detail-value">{{ authStore.user.fullName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Địa chỉ Email:</span>
          <span class="detail-value">{{ authStore.user.email }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Số điện thoại:</span>
          <span class="detail-value">{{ authStore.user.phone || 'Chưa cung cấp' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Trạng thái tài khoản:</span>
          <span class="detail-value">
            <span class="badge badge-active">Đang hoạt động</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-8 {
  margin-bottom: 2rem;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
  padding: 2.5rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.5rem;
}

.profile-avatar {
  width: 70px;
  height: 70px;
  background-color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.profile-role {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.profile-details-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.95rem;
}

.detail-value {
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
}

@media (max-width: 576px) {
  .profile-card {
    padding: 1.5rem;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .detail-value {
    word-break: break-all;
  }
}
</style>
