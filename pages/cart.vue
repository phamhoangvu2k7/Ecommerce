<script setup lang="ts">
import CartItem from '~/components/CartItem.vue'
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
const router = useRouter()

const updatingId = ref<string | null>(null)

onMounted(() => {
  cartStore.fetchCart()
})

async function handleUpdateQty(
  productId: string,
  currentQty: number,
  offset: number,
  maxStock: number,
) {
  const newQty = currentQty + offset
  if (newQty < 0 || newQty > maxStock)
    return

  updatingId.value = productId
  try {
    await cartStore.updateQuantity(productId, newQty)
  }
  catch (err: any) {
    // eslint-disable-next-line no-alert
    alert(err.message)
  }
  finally {
    updatingId.value = null
  }
}

async function handleRemoveItem(productId: string) {
  // eslint-disable-next-line no-alert
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?'))
    return
  updatingId.value = productId
  try {
    await cartStore.removeFromCart(productId)
  }
  catch (err: any) {
    // eslint-disable-next-line no-alert
    alert(err.message)
  }
  finally {
    updatingId.value = null
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

function proceedToCheckout() {
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-page container">
    <h1 class="h1-title mb-6">
      Giỏ hàng của bạn
    </h1>

    <div
      v-if="cartStore.products.length === 0"
      class="empty-cart-state glass-panel fade-in-item"
    >
      <div class="empty-icon">
        🛒
      </div>
      <p class="empty-text">
        Giỏ hàng của bạn hiện đang trống.
      </p>
      <RouterLink to="/products" class="btn btn-primary">
        Khám phá sản phẩm ngay
      </RouterLink>
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
          <h3 class="summary-title">
            Tóm tắt đơn hàng
          </h3>

          <div class="summary-row">
            <span>Tạm tính</span>
            <span class="summary-val">{{ formatPrice(cartStore.totalAmount) }}</span>
          </div>
          <div class="summary-row">
            <span>Phí vận chuyển</span>
            <span class="success-text">Miễn phí</span>
          </div>
          <div class="summary-divider" />
          <div class="summary-row total-row">
            <span>Tổng thanh toán</span>
            <span class="total-price">{{
              formatPrice(cartStore.totalAmount)
            }}</span>
          </div>

          <button
            class="btn btn-primary btn-checkout w-full mt-5"
            @click="proceedToCheckout"
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
.mb-6 {
  margin-bottom: 1.75rem;
}

.empty-cart-state {
  text-align: center;
  padding: 3.5rem 2rem;
  max-width: 540px;
  margin: 1.5rem auto;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 3.25rem;
  margin-bottom: 0.75rem;
}

.empty-text {
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.cart-layout {
  display: flex;
  gap: 1.75rem;
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
  gap: 0.85rem;
}

/* Summary Card */
.summary-section {
  flex: 1;
}

.summary-card {
  position: sticky;
  top: 85px;
  border-radius: 14px;
}

.summary-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--text-main);
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.85rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.summary-val {
  color: var(--text-main);
  font-weight: 600;
}

.success-text {
  color: var(--success);
  font-weight: 700;
}

.summary-divider {
  border-bottom: 1px solid var(--border-color);
  margin: 1rem 0;
}

.total-row {
  color: var(--text-main);
  font-weight: 800;
  align-items: baseline;
}

.total-price {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
}

.mt-5 {
  margin-top: 1.25rem;
}

.mt-3 {
  margin-top: 0.65rem;
}

.btn-checkout {
  padding: 0.75rem;
  font-size: 0.95rem;
}

.w-full {
  width: 100%;
}
</style>
