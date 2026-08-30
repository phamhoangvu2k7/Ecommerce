<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()

const isMenuOpen = ref(false)
const isDarkMode = ref(true)

watch(() => route.path, () => {
  isMenuOpen.value = false
})

onMounted(() => {
  cartStore.fetchCart()

  // Initialize theme from localStorage or system preferred
  const savedTheme = localStorage.getItem('nitro_theme') || 'dark'
  isDarkMode.value = savedTheme === 'dark'
  applyTheme(savedTheme)
})

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  const newTheme = isDarkMode.value ? 'dark' : 'light'
  localStorage.setItem('nitro_theme', newTheme)
  applyTheme(newTheme)
}

function applyTheme(theme: string) {
  if (process.client) {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

const cartCount = computed(() => {
  return cartStore.products.reduce((sum, item) => sum + item.quantity, 0)
})

function handleLogout() {
  authStore.logout()
  cartStore.clearCart()
  router.push('/login')
}
</script>

<template>
  <div class="client-layout">
    <!-- Main Header Bar -->
    <header class="premium-nav">
      <div class="container nav-container">
        <!-- Logo -->
        <NuxtLink to="/" class="nav-logo">
          <div class="logo-badge">
            <SvgIcon name="zap" :size="20" color="#ffffff" />
          </div>
          <span class="logo-text">NitroStore</span>
        </NuxtLink>

        <!-- Navigation Links (Desktop) -->
        <nav class="nav-links" :class="{ 'menu-active': isMenuOpen }">
          <NuxtLink to="/" class="nav-link">
            Trang chủ
          </NuxtLink>
          <NuxtLink to="/products" class="nav-link">
            Sản phẩm
          </NuxtLink>
          <NuxtLink to="/cart" class="nav-link style-cart-link">
            <SvgIcon name="cart" :size="18" />
            <span>Giỏ hàng</span>
            <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </NuxtLink>

          <!-- User Authentication Links -->
          <template v-if="authStore.user">
            <NuxtLink to="/orders" class="nav-link">
              Đơn hàng
            </NuxtLink>
            <NuxtLink to="/profile" class="nav-link user-profile-link">
              <SvgIcon name="user" :size="16" />
              <span>{{ authStore.user.fullName }}</span>
            </NuxtLink>
            <button class="btn btn-secondary btn-logout-sm" title="Đăng xuất" @click="handleLogout">
              <SvgIcon name="logout" :size="15" />
              <span>Đăng xuất</span>
            </button>
          </template>

          <template v-else>
            <NuxtLink to="/login" class="nav-link">
              Đăng nhập
            </NuxtLink>
            <NuxtLink to="/register" class="btn btn-primary btn-sm">
              Đăng ký
            </NuxtLink>
          </template>
        </nav>

        <!-- Header Actions: Theme Switcher & Mobile Menu Toggle -->
        <div class="header-actions">
          <button
            class="btn-icon-toggle"
            :title="isDarkMode ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'"
            aria-label="Toggle Theme"
            @click="toggleTheme"
          >
            <SvgIcon v-if="isDarkMode" name="sun" :size="20" color="#f59e0b" />
            <SvgIcon v-else name="moon" :size="20" color="#6366f1" />
          </button>

          <button
            class="mobile-toggle"
            :class="{ 'toggle-active': isMenuOpen }"
            aria-label="Toggle navigation"
            @click="isMenuOpen = !isMenuOpen"
          >
            <SvgIcon :name="isMenuOpen ? 'x' : 'menu'" :size="22" />
          </button>
        </div>
      </div>
    </header>

    <!-- Page Content -->
    <main class="client-content fade-in-item">
      <slot />
    </main>

    <!-- Footer Section -->
    <footer class="client-footer">
      <div class="container">
        <!-- Trust Badges -->
        <div class="trust-grid">
          <div class="trust-item">
            <div class="trust-icon">
              <SvgIcon name="truck" :size="24" color="var(--primary)" />
            </div>
            <div>
              <h4 class="trust-title">
                Giao hàng toàn quốc
              </h4>
              <p class="trust-desc">
                Miễn phí vận chuyển đơn từ 500k
              </p>
            </div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">
              <SvgIcon name="shield-check" :size="24" color="var(--accent)" />
            </div>
            <div>
              <h4 class="trust-title">
                Chính hãng 100%
              </h4>
              <p class="trust-desc">
                Cam kết chất lượng chuẩn nhà sản xuất
              </p>
            </div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">
              <SvgIcon name="refresh" :size="24" color="#f59e0b" />
            </div>
            <div>
              <h4 class="trust-title">
                Đổi trả trong 7 ngày
              </h4>
              <p class="trust-desc">
                Thủ tục nhanh chóng, linh hoạt
              </p>
            </div>
          </div>
        </div>

        <div class="footer-divider" />

        <div class="footer-bottom">
          <div class="footer-brand">
            <NuxtLink to="/" class="nav-logo">
              <div class="logo-badge">
                <SvgIcon name="zap" :size="18" color="#ffffff" />
              </div>
              <span class="logo-text">NitroStore</span>
            </NuxtLink>
            <p class="footer-copy">
              &copy; 2026 NitroStore E-commerce &middot; Đạt chuẩn thiết kế UI/UX Premium.
            </p>
          </div>
        </div>
      </div>
    </footer>

    <!-- AI Chat Widget Component -->
    <AiChatWidget />
  </div>
</template>

<style scoped>
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.premium-nav {
  height: 68px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.nav-logo {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-badge {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px hsl(var(--hsl-primary-500) / 0.3);
}

.logo-text {
  font-family: var(--font-heading);
  font-weight: 800;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav-link {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.nav-link:hover, .router-link-exact-active {
  color: var(--text-main);
  background-color: rgba(255, 255, 255, 0.06);
}

[data-theme="light"] .nav-link:hover, [data-theme="light"] .router-link-exact-active {
  background-color: rgba(0, 0, 0, 0.05);
}

.router-link-exact-active {
  color: var(--primary) !important;
}

.style-cart-link {
  position: relative;
}

.cart-badge {
  background-color: var(--accent);
  color: #ffffff;
  font-size: 0.725rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-full);
  line-height: 1.2;
}

.user-profile-link {
  color: var(--text-main);
  font-weight: 600;
}

.btn-logout-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.825rem;
  border-radius: var(--radius-md);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-icon-toggle {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

[data-theme="light"] .btn-icon-toggle {
  background: rgba(0, 0, 0, 0.04);
}

.btn-icon-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--border-color-hover);
}

.mobile-toggle {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-main);
  cursor: pointer;
}

.client-content {
  flex: 1;
  padding: 2.25rem 0;
}

.client-footer {
  border-top: 1px solid var(--border-color);
  padding: 3rem 0 2rem;
  background-color: rgba(0, 0, 0, 0.2);
}

[data-theme="light"] .client-footer {
  background-color: rgba(0, 0, 0, 0.02);
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.trust-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background-color: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trust-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.15rem;
}

.trust-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.footer-divider {
  height: 1px;
  background-color: var(--border-color);
  margin-bottom: 2rem;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-copy {
  color: var(--text-dim);
  font-size: 0.85rem;
  margin-top: 0.4rem;
}

@media (max-width: 768px) {
  .mobile-toggle {
    display: flex;
  }

  .nav-links {
    position: absolute;
    top: 68px;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 1.5rem;
    box-shadow: var(--shadow-lg);
    display: none;
  }

  .nav-links.menu-active {
    display: flex;
    animation: fadeIn 0.2s ease-out;
  }

  .nav-link {
    font-size: 1rem;
    padding: 0.65rem 1rem;
  }
}
</style>
