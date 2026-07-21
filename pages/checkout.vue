<script setup lang="ts">
import { resolveImageUrl } from '~/composables/useImageUrl'
import { useCartStore } from '~/stores/cart'

definePageMeta({
  middleware: ['auth'],
})

const cartStore = useCartStore()
const router = useRouter()

const fullName = ref('')
const phone = ref('')
const address = ref('')

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(async () => {
  await cartStore.fetchCart()
  if (cartStore.products.length === 0) {
    router.push('/cart')
  }

  // Pre-fill user data if logged in
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    const user = JSON.parse(savedUser)
    fullName.value = user.fullName || ''
    phone.value = user.phone || ''
  }
})

async function handleCheckout() {
  if (!fullName.value || !phone.value || !address.value) {
    errorMsg.value = 'Vui lòng nhập đầy đủ thông tin giao hàng.'
    return
  }

  if (!cartStore.cartId) {
    errorMsg.value = 'Giỏ hàng không hợp lệ. Vui lòng quay lại giỏ hàng và thử lại.'
    return
  }

  if (cartStore.products.length === 0) {
    errorMsg.value = 'Giỏ hàng của bạn đang trống.'
    router.push('/cart')
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const token = localStorage.getItem('token')
    const headers: any = { 'Content-Type': 'application/json' }
    if (token)
      headers.Authorization = `Bearer ${token}`

    const res = await fetch('/api/client/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        cartId: cartStore.cartId,
        fullName: fullName.value,
        phone: phone.value,
        address: address.value,
      }),
    })

    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Đặt hàng thành công! Cảm ơn bạn đã tin tưởng.'
      cartStore.clearCart()

      // Navigate to orders or homepage after 3 seconds
      setTimeout(() => {
        router.push('/orders')
      }, 3000)
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi đặt hàng, vui lòng kiểm tra tồn kho.'
    }
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err: any) {
    errorMsg.value = 'Có lỗi xảy ra trong quá trình đặt hàng.'
  }
  finally {
    loading.value = false
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>

<template>
  <div class="checkout-page container">
    <h1 class="h1-title mb-6">
      Thanh toán đơn hàng
    </h1>

    <div v-if="successMsg" class="alert alert-success max-w-xl mx-auto text-center py-6 fade-in-item">
      <div class="success-icon">
        🎉
      </div>
      <p class="font-semibold text-lg text-main">
        {{ successMsg }}
      </p>
      <p class="text-sm mt-2 text-dim">
        Đang chuyển hướng về trang Đơn hàng cá nhân...
      </p>
    </div>

    <div v-else class="checkout-layout">
      <!-- Shipping form -->
      <div class="shipping-section glass-panel fade-in-item">
        <h3 class="section-title">
          Thông tin giao hàng
        </h3>

        <div v-if="errorMsg" class="alert alert-error">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleCheckout">
          <div class="input-group">
            <label class="input-label">Họ và tên người nhận</label>
            <input v-model="fullName" type="text" placeholder="Nhập đầy đủ họ tên" class="premium-input" required>
          </div>

          <div class="input-group">
            <label class="input-label">Số điện thoại nhận hàng</label>
            <input v-model="phone" type="tel" placeholder="Nhập số điện thoại liên lạc" class="premium-input" required>
          </div>

          <div class="input-group">
            <label class="input-label">Địa chỉ nhận hàng</label>
            <textarea
              v-model="address"
              placeholder="Ghi rõ số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              class="premium-input text-area-input"
              rows="4"
              required
            />
          </div>

          <button type="submit" :disabled="loading" class="btn btn-primary btn-submit-checkout w-full mt-5">
            {{ loading ? 'Đang xử lý đặt hàng...' : 'Xác nhận Đặt hàng (Thanh toán COD) 📦' }}
          </button>
        </form>
      </div>

      <!-- Checkout Summary -->
      <aside class="summary-section fade-in-item">
        <div class="premium-card summary-card">
          <h3 class="section-title border-b">
            Chi tiết sản phẩm
          </h3>

          <div class="summary-items-list">
            <div v-for="item in cartStore.products" :key="item.product_id" class="summary-item">
              <div class="sum-img-box">
                <img :src="resolveImageUrl(item.thumbnail)" :alt="item.title" class="sum-item-img">
              </div>
              <div class="sum-item-details">
                <h4 class="sum-item-title">
                  {{ item.title }}
                </h4>
                <div class="sum-item-qty-price">
                  <span>{{ formatPrice(item.priceNew) }} &times; {{ item.quantity }}</span>
                  <span class="sum-item-total">{{ formatPrice(item.totalPrice) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pricing-rows">
            <div class="summary-row">
              <span>Tạm tính</span>
              <span class="summary-val">{{ formatPrice(cartStore.totalAmount) }}</span>
            </div>
            <div class="summary-row">
              <span>Giao hàng</span>
              <span class="success-text">Miễn phí</span>
            </div>
            <div class="summary-divider" />
            <div class="summary-row total-row">
              <span>Tổng thanh toán</span>
              <span class="total-price">{{ formatPrice(cartStore.totalAmount) }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mb-6 {
  margin-bottom: 1.75rem;
}

.max-w-xl {
  max-width: 34rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.py-6 {
  padding-top: 1.75rem;
  padding-bottom: 1.75rem;
}

.success-icon {
  font-size: 2.75rem;
  margin-bottom: 0.5rem;
}

.text-main {
  color: var(--text-main);
  font-size: 1.1rem;
}

.text-dim {
  color: var(--text-dim);
}

.checkout-layout {
  display: flex;
  gap: 1.75rem;
}

@media (max-width: 992px) {
  .checkout-layout {
    flex-direction: column;
  }
}

.shipping-section {
  flex: 1.5;
  padding: 1.75rem;
  border-radius: 16px;
}

.text-area-input {
  resize: vertical;
}

.summary-section {
  flex: 1;
}

.summary-card {
  border-radius: 14px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--text-main);
  margin-bottom: 1.25rem;
}

.border-b {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

/* Products in list */
.summary-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 1.25rem;
  padding-right: 0.25rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sum-img-box {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  flex-shrink: 0;
}

.sum-item-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.sum-item-details {
  flex: 1;
  min-width: 0;
}

.sum-item-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.15rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.sum-item-qty-price {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.sum-item-total {
  font-weight: 700;
  color: var(--text-main);
}

/* Pricing summary rows */
.pricing-rows {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.65rem;
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
  margin: 0.85rem 0;
}

.total-row {
  color: var(--text-main);
  font-weight: 800;
  align-items: baseline;
}

.total-price {
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
}

.btn-submit-checkout {
  padding: 0.75rem;
  font-size: 0.95rem;
}

.w-full {
  width: 100%;
}

.mt-5 {
  margin-top: 1.25rem;
}

@media (max-width: 576px) {
  .shipping-section {
    padding: 1.15rem;
  }

  .section-title {
    font-size: 1.05rem;
    margin-bottom: 0.9rem;
  }
}
</style>
