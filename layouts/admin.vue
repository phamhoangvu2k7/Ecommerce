<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSidebarOpen = ref(false)
const isCollapsed = ref(false)
const isDarkMode = ref(true)

watch(() => route.path, () => {
  isSidebarOpen.value = false
})

onMounted(() => {
  const savedTheme = localStorage.getItem('nitro_admin_theme') || 'dark'
  isDarkMode.value = savedTheme === 'dark'
  applyTheme(savedTheme)
})

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  const newTheme = isDarkMode.value ? 'dark' : 'light'
  localStorage.setItem('nitro_admin_theme', newTheme)
  applyTheme(newTheme)
}

function applyTheme(theme: string) {
  if (process.client) {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

function toggleSidebarCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function handleLogout() {
  authStore.logoutAdmin()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': isCollapsed }">
    <!-- Sidebar Overlay for mobile -->
    <div
      v-if="isSidebarOpen"
      class="sidebar-overlay"
      @click="isSidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ 'sidebar-open': isSidebarOpen, 'collapsed-state': isCollapsed }">
      <!-- Sidebar Brand -->
      <div class="sidebar-brand">
        <div class="brand-logo-icon">
          <SvgIcon name="zap" :size="20" color="#ffffff" />
        </div>
        <span v-if="!isCollapsed" class="brand-name">Control Panel</span>
      </div>

      <!-- Admin Profile pill -->
      <div v-if="authStore.admin && !isCollapsed" class="sidebar-user fade-in-item">
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

      <!-- Sidebar Menu -->
      <nav class="sidebar-menu">
        <NuxtLink to="/admin/dashboard" class="menu-item" :title="isCollapsed ? 'Tổng quan' : ''">
          <SvgIcon name="chart" :size="18" />
          <span v-if="!isCollapsed">Tổng quan</span>
        </NuxtLink>

        <NuxtLink to="/admin/orders" class="menu-item" :title="isCollapsed ? 'Đơn hàng' : ''">
          <SvgIcon name="cart" :size="18" />
          <span v-if="!isCollapsed">Đơn hàng</span>
        </NuxtLink>

        <NuxtLink to="/admin/products" class="menu-item" :title="isCollapsed ? 'Sản phẩm' : ''">
          <SvgIcon name="package" :size="18" />
          <span v-if="!isCollapsed">Sản phẩm</span>
        </NuxtLink>

        <NuxtLink to="/admin/categories" class="menu-item" :title="isCollapsed ? 'Danh mục' : ''">
          <SvgIcon name="folder" :size="18" />
          <span v-if="!isCollapsed">Danh mục</span>
        </NuxtLink>

        <NuxtLink to="/admin/trash" class="menu-item" :title="isCollapsed ? 'Thùng rác' : ''">
          <SvgIcon name="trash" :size="18" />
          <span v-if="!isCollapsed">Thùng rác</span>
        </NuxtLink>

        <NuxtLink to="/admin/roles" class="menu-item" :title="isCollapsed ? 'Nhóm quyền' : ''">
          <SvgIcon name="shield" :size="18" />
          <span v-if="!isCollapsed">Nhóm quyền</span>
        </NuxtLink>

        <NuxtLink to="/admin/accounts" class="menu-item" :title="isCollapsed ? 'Tài khoản Admin' : ''">
          <SvgIcon name="users" :size="18" />
          <span v-if="!isCollapsed">Tài khoản Admin</span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <button
          class="btn btn-secondary w-full btn-collapse-toggle mb-2"
          :title="isCollapsed ? 'Mở rộng Menu' : 'Thu gọn Menu'"
          @click="toggleSidebarCollapse"
        >
          <SvgIcon :name="isCollapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
          <span v-if="!isCollapsed">Thu gọn</span>
        </button>

        <button class="btn btn-secondary w-full btn-logout" :title="isCollapsed ? 'Đăng xuất' : ''" @click="handleLogout">
          <SvgIcon name="logout" :size="16" color="var(--danger)" />
          <span v-if="!isCollapsed">Đăng xuất</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <button
            class="admin-toggle cursor-pointer"
            aria-label="Toggle sidebar"
            @click="isSidebarOpen = !isSidebarOpen"
          >
            <SvgIcon name="menu" :size="22" />
          </button>

          <!-- Quick Search -->
          <div class="admin-quick-search">
            <SvgIcon name="search" :size="16" color="var(--text-dim)" class="search-icon" />
            <input type="text" placeholder="Tìm kiếm hệ thống (Ctrl + K)..." class="premium-input search-input">
          </div>
        </div>

        <div class="header-right">
          <!-- Notification Bell -->
          <button class="header-action-btn" title="Thông báo mới">
            <SvgIcon name="bell" :size="20" />
            <span class="bell-badge">3</span>
          </button>

          <!-- Theme Toggle -->
          <button
            class="header-action-btn"
            :title="isDarkMode ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'"
            @click="toggleTheme"
          >
            <SvgIcon v-if="isDarkMode" name="sun" :size="20" color="#f59e0b" />
            <SvgIcon v-else name="moon" :size="20" color="#6366f1" />
          </button>

          <span class="badge badge-active flex items-center gap-1">
            <span class="status-dot pulse" />
            <span>System Live</span>
          </span>
        </div>
      </header>

      <div class="admin-content fade-in-item">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.mb-2 { margin-bottom: 0.5rem; }

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
  transition: width var(--transition-normal);
}

.admin-sidebar.collapsed-state {
  width: 78px;
  padding: 1.25rem 0.5rem;
}

.sidebar-brand {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.brand-logo-icon {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  background-color: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background-color: var(--primary);
  border-radius: var(--radius-full);
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
  font-weight: 600;
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
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.collapsed-state .menu-item {
  justify-content: center;
  padding: 0.65rem 0;
}

.menu-item:hover, .router-link-active {
  color: var(--text-main);
  background-color: rgba(255, 255, 255, 0.06);
}

.router-link-active {
  border-left: 3px solid var(--primary);
  background-color: var(--primary-glow);
  color: var(--primary) !important;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
}

.btn-collapse-toggle {
  font-size: 0.8rem;
  padding: 0.5rem;
}

.btn-logout {
  font-size: 0.85rem;
  padding: 0.5rem;
}

/* Main Content Area */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-width: 0;
}

.admin-header {
  height: 68px;
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
  flex: 1;
}

.admin-toggle {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-main);
}

.admin-quick-search {
  position: relative;
  max-width: 320px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  padding-left: 2.25rem;
  font-size: 0.85rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-action-btn {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast);
}

.header-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: var(--border-color-hover);
}

.bell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--danger);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-card);
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: var(--success);
  border-radius: var(--radius-full);
  display: inline-block;
}

.admin-content {
  flex: 1;
  padding: 1.75rem;
  background-color: var(--bg-app);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 998;
}

@media (max-width: 992px) {
  .admin-toggle {
    display: block;
  }

  .admin-quick-search {
    display: none;
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
}
</style>
