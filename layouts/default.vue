<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()

const isMenuOpen = ref(false)

watch(() => route.path, () => {
  isMenuOpen.value = false
})

onMounted(() => {
  cartStore.fetchCart()
})

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
    <header class="premium-nav">
      <div class="container nav-container">
        <NuxtLink to="/" class="nav-logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">NitroStore</span>
        </NuxtLink>

        <!-- Mobile Menu Toggle Button -->
        <button
          class="mobile-toggle"
          :class="{ 'toggle-active': isMenuOpen }"
          aria-label="Toggle navigation"
          @click="isMenuOpen = !isMenuOpen"
        >
          <span />
          <span />
          <span />
        </button>

        <nav class="nav-links" :class="{ 'menu-active': isMenuOpen }">
          <NuxtLink to="/" class="nav-link">
            Trang chủ
          </NuxtLink>
          <NuxtLink to="/products" class="nav-link">
            Sản phẩm
          </NuxtLink>
          <NuxtLink to="/cart" class="nav-link style-cart-link">
            <span>Giỏ hàng</span>
            <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </NuxtLink>

          <!-- User State -->
          <template v-if="authStore.user">
            <NuxtLink to="/orders" class="nav-link">
              Đơn hàng
            </NuxtLink>
            <NuxtLink to="/profile" class="nav-link user-profile-link">
              👋 {{ authStore.user.fullName }}
            </NuxtLink>
            <button class="btn btn-secondary btn-logout-sm" @click="handleLogout">
              Đăng xuất
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
      </div>
    </header>

    <main class="client-content fade-in-item">
      <slot />
    </main>

    <footer class="client-footer">
      <div class="container footer-content">
        <p>&copy; 2026 NitroStore Commerce &middot; Crafted with Hallmark Aesthetics</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.logo-icon {
  font-size: 1.25rem;
}

.logo-text {
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.client-content {
  flex: 1;
  padding: 2.25rem 0;
}

.style-cart-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.cart-badge {
  background-color: var(--primary);
  color: #ffffff;
  font-size: 0.725rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  line-height: 1.2;
}

.user-profile-link {
  color: var(--text-main);
  font-weight: 600;
}

.btn-logout-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.825rem;
  border-radius: 8px;
}

.btn-sm {
  padding: 0.35rem 0.9rem;
  font-size: 0.825rem;
  border-radius: 8px;
}

.client-footer {
  border-top: 1px solid var(--border-color);
  padding: 1.75rem 0;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.85rem;
  font-weight: 500;
  background-color: rgba(9, 13, 22, 0.6);
}

/* Mobile Toggle (Hamburger) */
.mobile-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 101;
}

.mobile-toggle span {
  width: 100%;
  height: 2px;
  background-color: var(--text-main);
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Transform Hamburger to X when active */
.mobile-toggle.toggle-active span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.mobile-toggle.toggle-active span:nth-child(2) {
  opacity: 0;
}

.mobile-toggle.toggle-active span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

@media (max-width: 768px) {
  .premium-nav {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .mobile-toggle {
    display: flex;
  }

  .nav-links {
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: rgba(9, 13, 22, 0.98);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2rem;
    z-index: 99;
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
  }

  .nav-links.menu-active {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-link {
    font-size: 1.05rem;
  }
}
</style>
