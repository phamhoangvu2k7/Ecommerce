<script setup lang="ts">
import { onMounted, computed } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.ts";
import { useCartStore } from "../stores/cart.ts";

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();

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
        <nav class="nav-links">
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
</style>
