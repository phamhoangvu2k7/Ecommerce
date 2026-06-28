<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.ts";

const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logoutAdmin();
  router.push("/admin/login");
}
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        ⚡ Control Panel
      </div>

      <!-- Admin Profile info -->
      <div v-if="authStore.admin" class="sidebar-user">
        <div class="user-avatar">
          {{ authStore.admin.fullName.charAt(0) }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ authStore.admin.fullName }}</div>
          <div class="user-role">{{ authStore.admin.role?.title || 'Quản trị viên' }}</div>
        </div>
      </div>

      <nav class="sidebar-menu">
        <RouterLink to="/admin/dashboard" class="menu-item">
          📊 Tổng quan
        </RouterLink>
        <RouterLink to="/admin/products" class="menu-item">
          📦 Sản phẩm
        </RouterLink>
        <RouterLink to="/admin/categories" class="menu-item">
          🗂️ Danh mục
        </RouterLink>
        <RouterLink to="/admin/trash" class="menu-item">
          🗑️ Thùng rác
        </RouterLink>
        <RouterLink to="/admin/roles" class="menu-item">
          🔑 Nhóm quyền
        </RouterLink>
        <RouterLink to="/admin/accounts" class="menu-item">
          👥 Tài khoản Admin
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="btn btn-secondary w-full">
          🚪 Đăng xuất
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <header class="admin-header">
        <div class="header-title">Hệ thống Quản lý</div>
        <div class="header-status">
          <span class="badge badge-active">Hệ thống Đang Chạy</span>
        </div>
      </header>

      <div class="admin-content fade-in-item">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #0b0f19;
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background-color: #0e1626;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  flex-shrink: 0;
}

.sidebar-brand {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2rem;
  text-align: center;
  background: linear-gradient(to right, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background-color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 1.2rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--text-muted);
  font-weight: 500;
  border-radius: 8px;
  transition: all var(--transition-speed);
}

.menu-item:hover, .router-link-active {
  color: white;
  background-color: rgba(99, 102, 241, 0.1);
  border-left: 3px solid var(--primary);
  padding-left: calc(1rem - 3px);
}

.sidebar-footer {
  margin-top: auto;
}

.w-full {
  width: 100%;
}

/* Main Content Area */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.admin-header {
  height: 70px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  background-color: #0e1626;
}

.header-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #fff;
}

.admin-content {
  flex: 1;
  padding: 2rem;
  background-color: #0b0f19;
}
</style>
