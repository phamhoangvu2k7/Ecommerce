<script setup lang="ts">
import { ref } from 'vue'
import CartItem from '~/components/CartItem.vue'
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
const router = useRouter()

const updatingId = ref<string | null>(null)
const promoCode = ref('')
const promoApplied = ref(false)
const promoDiscount = ref(0)

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
    alert(err.message)
  }
  finally {
    updatingId.value = null
  }
}

async function handleRemoveItem(productId: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?'))
    return
  updatingId.value = productId
  try {
    await cartStore.removeFromCart(productId)
  }
  catch (err: any) {
    alert(err.message)
  }
  finally {
    updatingId.value = null
  }
}

function applyPromo() {
  if (promoCode.value.trim().toUpperCase() === 'NITRO2026') {
    promoApplied.value = true
    promoDiscount.value = Math.round(cartStore.totalAmount * 0.1)
  }
  else {
    alert('Mã giảm giá không hợp lệ. Thử mã "NITRO2026" để giảm 10%!')
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

function proceedToCheckout() {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('Vui lòng đăng nhập tài khoản để tiến hành thanh toán đơn hàng.')
    router.push('/login')
    return
  }
  router.push('/checkout')
}
</script>

<template>
  <div class="cart-page container">
    <!-- Progress Steps Header -->
    <div class="steps-progress-bar mb-8">
      <div class="step-item step-active">
        <div class="step-icon">
          1
        </div>
        <span class="step-title">Giỏ hàng</span>
      </div>
      <div class="step-line" />
      <div class="step-item">
        <div class="step-icon">
          2
        </div>
        <span class="step-title">Thanh toán</span>
      </div>
      <div class="step-line" />
      <div class="step-item">
        <div class="step-icon">
          3
        </div>
        <span class="step-title">Hoàn tất</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="cartStore.products.length === 0"
      class="empty-cart-state glass-panel fade-in-item"
    >
      <div class="empty-icon-box mb-4">
        <SvgIcon name="cart" :size="48" color="var(--text-dim)" />
      </div>
      <h2 class="empty-title">
        Giỏ hàng của bạn đang trống
      </h2>
      <p class="empty-text mb-6">
        Hãy khám phá các sản phẩm công nghệ hot nhất và thêm vào giỏ hàng ngay.
      </p>
      <NuxtLink to="/products" class="btn btn-primary btn-lg">
        <span>Khám phá sản phẩm ngay</span>
        <SvgIcon name="arrow-right" :size="18" />
      </NuxtLink>
    </div>

    <!-- Cart Layout -->
    <div v-else class="cart-layout">
      <!-- Items List -->
      <div class="cart-items-section">
        <div class="section-title-row mb-4">
          <h2 class="section-title">
            Sản phẩm trong giỏ hàng ({{ cartStore.products.length }})
          </h2>
        </div>

        <CartItem
          v-for="item in cartStore.products"
          :key="item.product_id"
          :item="item"
          :updating-id="updatingId"
          @update-qty="handleUpdateQty"
          @remove="handleRemoveItem"
        />
      </div>

      <!-- Sticky Order Summary Card -->
      <aside class="summary-section">
        <div class="premium-card summary-card">
          <h3 class="summary-title">
            Tóm Tắt Đơn Hàng
          </h3>

          <!-- Promo Code Input -->
          <div class="promo-box mb-4">
            <label class="input-label">Mã ưu đãi / Voucher</label>
            <div class="flex gap-2">
              <input
                v-model="promoCode"
                type="text"
                placeholder="Nhập NITRO2026..."
                class="premium-input promo-input"
                :disabled="promoApplied"
              >
              <button
                class="btn btn-secondary btn-sm"
                :disabled="promoApplied || !promoCode"
                @click="applyPromo"
              >
                {{ promoApplied ? 'Đã áp dụng' : 'Áp dụng' }}
              </button>
            </div>
          </div>

          <div class="summary-row">
            <span>Tạm tính</span>
            <span class="summary-val">{{ formatPrice(cartStore.totalAmount) }}</span>
          </div>

          <div v-if="promoApplied" class="summary-row promo-row">
            <span>Giảm giá (NITRO2026)</span>
            <span class="promo-val">-{{ formatPrice(promoDiscount) }}</span>
          </div>

          <div class="summary-row">
            <span>Phí vận chuyển</span>
            <span class="success-text">Miễn phí ⚡</span>
          </div>

          <div class="summary-divider" />

          <div class="summary-row total-row">
            <span>Tổng thanh toán</span>
            <span class="total-price">{{
              formatPrice(cartStore.totalAmount - promoDiscount)
            }}</span>
          </div>

          <button
            class="btn btn-accent btn-lg btn-checkout w-full mt-5"
            @click="proceedToCheckout"
          >
            <span>Tiến hành thanh toán</span>
            <SvgIcon name="arrow-right" :size="18" />
          </button>

          <NuxtLink
            to="/products"
            class="btn btn-secondary w-full mt-3 text-center"
          >
            Tiếp tục mua hàng
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mb-8 { margin-bottom: 2.5rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-5 { margin-top: 1.25rem; }
.mt-3 { margin-top: 0.65rem; }

/* Progress Steps */
.steps-progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto 2.5rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
}

.step-active {
  opacity: 1;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--bg-card);
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.step-active .step-icon {
  background-color: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
  box-shadow: 0 0 12px hsl(var(--hsl-primary-500) / 0.4);
}

.step-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

.step-line {
  flex: 1;
  height: 2px;
  background-color: var(--border-color);
  margin: 0 1rem;
  max-width: 80px;
}

/* Empty State */
.empty-cart-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 540px;
  margin: 1.5rem auto;
  border-radius: var(--radius-xl);
}

.empty-icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background-color: rgba(255, 255, 255, 0.04);
}

.empty-title {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.empty-text {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Cart Layout */
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

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.015em;
}

/* Summary Card */
.summary-section {
  flex: 1;
}

.summary-card {
  position: sticky;
  top: 85px;
  border-radius: var(--radius-lg);
}

.summary-title {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--text-main);
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.promo-input {
  font-size: 0.825rem;
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

.promo-row {
  color: var(--accent);
}

.promo-val {
  font-weight: 700;
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
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--accent);
}

.flex {
  display: flex;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
