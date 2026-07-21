<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.ts'

definePageMeta({
  middleware: ['auth'],
})

const authStore = useAuthStore()
</script>

<template>
  <div class="profile-page container">
    <h1 class="h1-title mb-6">
      Thông tin cá nhân
    </h1>

    <div v-if="authStore.user" class="profile-card premium-card glass-panel fade-in-item">
      <div class="profile-header">
        <div class="profile-avatar">
          {{ authStore.user.fullName.charAt(0) }}
        </div>
        <div class="profile-title-block">
          <h2 class="profile-name">
            {{ authStore.user.fullName }}
          </h2>
          <p class="profile-role">
            Khách hàng thành viên
          </p>
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
            <span class="badge badge-active">Hoạt động</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-6 {
  margin-bottom: 1.75rem;
}

.profile-card {
  max-width: 540px;
  margin: 0 auto;
  padding: 2.25rem 2rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.35rem;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  background-color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
}

.profile-name {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
  margin-bottom: 0.15rem;
}

.profile-role {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.profile-details-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
}

.detail-label {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.875rem;
}

.detail-value {
  color: var(--text-main);
  font-weight: 700;
  font-size: 0.9rem;
}

@media (max-width: 576px) {
  .profile-card {
    padding: 1.5rem 1.25rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 0.85rem;
    margin-bottom: 1.35rem;
    padding-bottom: 1.15rem;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .detail-value {
    word-break: break-all;
  }
}
</style>
