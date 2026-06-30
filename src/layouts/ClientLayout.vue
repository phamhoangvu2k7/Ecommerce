<script setup lang="ts">
import { onMounted, computed, ref, watch } from "vue";
import { RouterLink, RouterView, useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth.ts";
import { useCartStore } from "../stores/cart.ts";

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();
const route = useRoute();

const isMenuOpen = ref(false);

watch(() => route.path, () => {
  isMenuOpen.value = false;
});

onMounted(() => {
  cartStore.fetchCart();
});

const cartCount = computed(() => {
  return cartStore.products.reduce((sum, item) => sum + item.quantity, 0);
});

function handleLogout() {
  authStore.logout();
  cartStore.clearCart();
  router.push("/login");
}

</script>

<template>
  <div class="client-layout">
    <header class="premium-nav">
      <div class="container nav-container">
        <RouterLink to="/" class="nav-logo">⚡ Premium Store</RouterLink>

        <!-- Mobile Menu Toggle Button -->
        <button 
          @click="isMenuOpen = !isMenuOpen" 
          class="mobile-toggle" 
          :class="{ 'toggle-active': isMenuOpen }"
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav class="nav-links" :class="{ 'menu-active': isMenuOpen }">

          <RouterLink to="/" class="nav-link">Trang chủ</RouterLink>
          <RouterLink to="/products" class="nav-link">Sản phẩm</RouterLink>
          <RouterLink to="/cart" class="nav-link style-cart-link">
            Giỏ hàng
            <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </RouterLink>

          <!-- User State -->
          <template v-if="authStore.user">
            <RouterLink to="/orders" class="nav-link">Đơn hàng</RouterLink>
            <RouterLink to="/profile" class="nav-link user-profile-link">
              👋 {{ authStore.user.fullName }}
            </RouterLink>
            <button @click="handleLogout" class="btn btn-secondary btn-logout-sm">Đăng xuất</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="nav-link">Đăng nhập</RouterLink>
            <RouterLink to="/register" class="btn btn-primary btn-sm">Đăng ký</RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="client-content fade-in-item">
      <RouterView />
    </main>

    <footer class="client-footer">
      <div class="container footer-content">
        <p>&copy; 2026 Premium Product Management. Powered by Nitro & Vue.</p>
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

.client-content {
  flex: 1;
  padding: 2rem 0;
}

.style-cart-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cart-badge {
  background-color: var(--primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
}

.user-profile-link {
  color: var(--primary);
  font-weight: 600;
}

.btn-logout-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  border-radius: 6px;
}

.btn-sm {
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  border-radius: 8px;
}

.client-footer {
  border-top: 1px solid var(--border-color);
  padding: 1.5rem 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  background-color: rgba(11, 15, 25, 0.5);
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
    top: 70px;
    left: 0;
    right: 0;
    background: rgba(11, 15, 25, 0.98);
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
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  }

  .nav-links.menu-active {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .nav-link {
    font-size: 1.1rem;
  }
}
</style>
