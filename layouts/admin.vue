<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSidebarOpen = ref(false)

watch(() => route.path, () => {
  isSidebarOpen.value = false
})

function handleLogout() {
  authStore.logoutAdmin()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar Overlay for mobile -->
    <div
      v-if="isSidebarOpen"
      class="sidebar-overlay"
      @click="isSidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <div class="sidebar-brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">Control Panel</span>
      </div>

      <!-- Admin Profile info -->
      <div v-if="authStore.admin" class="sidebar-user">
        <div class="user-avatar">
          {{ authStore.admin.fullName.charAt(0) }}
        </div>
        <div class="user-info">
          <div class="user-name">
            {{ authStore.admin.fullName }}
          </div>
          <div class="user-role">
            {{ authStore.admin.role?.title || 'Quản trị viên' }}
          </div>
        </div>
      </div>

      <nav class="sidebar-menu">
        <NuxtLink to="/admin/dashboard" class="menu-item">
          <span class="menu-icon">📊</span>
          <span>Tổng quan</span>
        </NuxtLink>
        <NuxtLink to="/admin/products" class="menu-item">
          <span class="menu-icon">📦</span>
          <span>Sản phẩm</span>
        </NuxtLink>
        <NuxtLink to="/admin/categories" class="menu-item">
          <span class="menu-icon">🗂️</span>
          <span>Danh mục</span>
        </NuxtLink>
        <NuxtLink to="/admin/trash" class="menu-item">
          <span class="menu-icon">🗑️</span>
          <span>Thùng rác</span>
        </NuxtLink>
        <NuxtLink to="/admin/roles" class="menu-item">
          <span class="menu-icon">🔑</span>
          <span>Nhóm quyền</span>
        </NuxtLink>
        <NuxtLink to="/admin/accounts" class="menu-item">
          <span class="menu-icon">👥</span>
          <span>Tài khoản Admin</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-secondary w-full btn-logout" @click="handleLogout">
          🚪 Đăng xuất
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <button
            class="admin-toggle"
            aria-label="Toggle sidebar"
            @click="isSidebarOpen = !isSidebarOpen"
          >
            ☰
          </button>
          <div class="header-title">
            Hệ thống Quản lý
          </div>
        </div>
        <div class="header-status">
          <span class="badge badge-active">🟢 Live System</span>
        </div>
      </header>

      <div class="admin-content fade-in-item">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-app);
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background-color: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem;
  flex-shrink: 0;
}

.sidebar-brand {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 1.25rem;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background-color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #ffffff;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.user-role {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-dim);
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all var(--transition-speed) ease;
}

.menu-icon {
  font-size: 0.95rem;
}

.menu-item:hover, .router-link-active {
  color: var(--text-main);
  background-color: rgba(255, 255, 255, 0.06);
}

.router-link-active {
  border-left: 3px solid var(--primary);
  padding-left: calc(0.85rem - 3px);
  background-color: rgba(79, 70, 229, 0.12);
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
}

.btn-logout {
  font-size: 0.85rem;
  padding: 0.55rem;
  border-radius: 8px;
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
  height: 64px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  background-color: var(--bg-card);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-toggle {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.header-title {
  font-weight: 700;
  letter-spacing: -0.015em;
  font-size: 1.05rem;
  color: var(--text-main);
}

.admin-content {
  flex: 1;
  padding: 1.75rem;
  background-color: var(--bg-app);
}

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 998;
}

/* Responsive styles */
@media (max-width: 992px) {
  .admin-toggle {
    display: block;
  }

  .admin-sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .admin-sidebar.sidebar-open {
    transform: translateX(0);
  }

  .admin-header {
    padding: 0 1.15rem;
  }

  .admin-content {
    padding: 1.15rem;
  }
}
</style>
