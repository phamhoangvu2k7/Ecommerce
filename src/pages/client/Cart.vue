<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useCartStore } from "../../stores/cart.ts";
import CartItem from "../../components/CartItem.vue";

const cartStore = useCartStore();
const router = useRouter();

const updatingId = ref<string | null>(null);

onMounted(() => {
  cartStore.fetchCart();
});

async function handleUpdateQty(
  productId: string,
  currentQty: number,
  offset: number,
  maxStock: number,
) {
  const newQty = currentQty + offset;
  if (newQty < 0 || newQty > maxStock) return;

  updatingId.value = productId;
  try {
    await cartStore.updateQuantity(productId, newQty);
  } catch (err: any) {
    alert(err.message);
  } finally {
    updatingId.value = null;
  }
}

async function handleRemoveItem(productId: string) {
  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) return;
  updatingId.value = productId;
  try {
    await cartStore.removeFromCart(productId);
  } catch (err: any) {
    alert(err.message);
  } finally {
    updatingId.value = null;
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function proceedToCheckout() {
  router.push("/checkout");
}
</script>

<template>
  <div class="cart-page container">
    <h1 class="h1-title mb-8">Giỏ hàng của bạn</h1>

    <div
      v-if="cartStore.products.length === 0"
      class="empty-cart-state glass-panel fade-in-item"
    >
      <div class="empty-icon">🛒</div>
      <p class="empty-text">Giỏ hàng của bạn đang trống.</p>
      <RouterLink to="/products" class="btn btn-primary"
        >Khám phá sản phẩm ngay</RouterLink
      >
    </div>

    <div v-else class="cart-layout">
      <!-- Items List -->
      <div class="cart-items-section">
        <CartItem
          v-for="item in cartStore.products"
          :key="item.product_id"
          :item="item"
          :updating-id="updatingId"
          @update-qty="handleUpdateQty"
          @remove="handleRemoveItem"
        />
      </div>

      <!-- Order Summary Card -->
      <aside class="summary-section">
        <div class="premium-card summary-card">
          <h3 class="summary-title">Tóm tắt đơn hàng</h3>

          <div class="summary-row">
            <span>Tạm tính</span>
            <span>{{ formatPrice(cartStore.totalAmount) }}</span>
          </div>
          <div class="summary-row">
            <span>Phí vận chuyển</span>
            <span class="success-text">Miễn phí</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row total-row">
            <span>Tổng cộng</span>
            <span class="total-price">{{
              formatPrice(cartStore.totalAmount)
            }}</span>
          </div>

          <button
            @click="proceedToCheckout"
            class="btn btn-primary btn-checkout w-full mt-6"
          >
            Tiến hành thanh toán 💳
          </button>

          <RouterLink
            to="/products"
            class="btn btn-secondary w-full mt-3 text-center"
          >
            Tiếp tục mua hàng
          </RouterLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mb-8 {
  margin-bottom: 2rem;
}

.empty-cart-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 2rem auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-text {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.cart-layout {
  display: flex;
  gap: 2rem;
}

@media (max-width: 992px) {
  .cart-layout {
    flex-direction: column;
  }
}

.cart-items-section {
  flex: 1.8;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Summary Card */
.summary-section {
  flex: 1;
}

.summary-card {
  position: sticky;
  top: 90px;
}

.summary-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.success-text {
  color: var(--success);
  font-weight: 600;
}

.summary-divider {
  border-bottom: 1px solid var(--border-color);
  margin: 1.25rem 0;
}

.total-row {
  color: #fff;
  font-weight: 700;
}

.total-price {
  font-size: 1.3rem;
  color: var(--primary);
}

.mt-6 {
  margin-top: 1.5rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.block-nav {
  display: block;
}

.w-full {
  width: 100%;
}
</style>
