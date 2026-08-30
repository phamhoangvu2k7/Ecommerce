<script setup lang="ts">
import { ref } from 'vue'
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
const paymentMethod = ref('cod') // 'cod' or 'bank'

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('Vui lòng đăng nhập tài khoản để tiến hành thanh toán đơn hàng.')
    router.push('/login')
    return
  }

  await cartStore.fetchCart()
  if (cartStore.products.length === 0) {
    router.push('/cart')
  }

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
        paymentMethod: paymentMethod.value,
      }),
    })

    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận.'
      cartStore.clearCart()

      setTimeout(() => {
        router.push('/orders')
      }, 2500)
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi đặt hàng, vui lòng kiểm tra lại.'
    }
  }
  catch {
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
    <!-- Progress Steps Header -->
    <div class="steps-progress-bar mb-8">
      <div class="step-item">
        <div class="step-icon">
          <SvgIcon name="check" :size="16" />
        </div>
        <span class="step-title">Giỏ hàng</span>
      </div>
      <div class="step-line active-line" />
      <div class="step-item step-active">
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

    <!-- Success Message -->
    <div v-if="successMsg" class="alert alert-success max-w-xl mx-auto text-center py-8 fade-in-item">
      <div class="success-icon-box mb-3">
        <SvgIcon name="check" :size="36" color="#ffffff" />
      </div>
      <h2 class="font-semibold text-xl text-main mb-2">
        {{ successMsg }}
      </h2>
      <p class="text-sm text-dim">
        Tự động chuyển hướng về lịch sử Đơn hàng sau vài giây...
      </p>
    </div>

    <!-- Main Checkout Form -->
    <div v-else class="checkout-layout">
      <!-- Shipping & Payment Form -->
      <div class="shipping-section glass-panel fade-in-item">
        <h3 class="section-title">
          1. Thông tin người nhận
        </h3>

        <div v-if="errorMsg" class="alert alert-error mb-4">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleCheckout">
          <div class="input-group">
            <label class="input-label">Họ và tên người nhận *</label>
            <input v-model="fullName" type="text" placeholder="Nguyễn Văn A" class="premium-input" required>
          </div>

          <div class="input-group">
            <label class="input-label">Số điện thoại nhận hàng *</label>
            <input v-model="phone" type="tel" placeholder="0901234567" class="premium-input" required>
          </div>

          <div class="input-group">
            <label class="input-label">Địa chỉ giao hàng chi tiết *</label>
            <textarea
              v-model="address"
              placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
              class="premium-input text-area-input"
              rows="3"
              required
            />
          </div>

          <h3 class="section-title mt-6">
            2. Phương thức thanh toán
          </h3>

          <div class="payment-methods-grid mb-6">
            <label class="payment-card cursor-pointer" :class="{ 'payment-selected': paymentMethod === 'cod' }">
              <input v-model="paymentMethod" type="radio" value="cod" class="hidden-radio">
              <div class="payment-icon">
                <SvgIcon name="truck" :size="20" color="var(--primary)" />
              </div>
              <div>
                <h4 class="payment-name">Thanh toán khi nhận hàng (COD)</h4>
                <p class="payment-sub">Thanh toán tiền mặt cho shipper khi nhận gói hàng</p>
              </div>
            </label>

            <label class="payment-card cursor-pointer" :class="{ 'payment-selected': paymentMethod === 'bank' }">
              <input v-model="paymentMethod" type="radio" value="bank" class="hidden-radio">
              <div class="payment-icon">
                <SvgIcon name="zap" :size="20" color="var(--accent)" />
              </div>
              <div>
                <h4 class="payment-name">Chuyển khoản Ngân hàng / QR</h4>
                <p class="payment-sub">Quét mã QR VietQR nhận hàng siêu tốc</p>
              </div>
            </label>
          </div>

          <button type="submit" :disabled="loading" class="btn btn-accent btn-lg w-full">
            <span>{{ loading ? 'Đang xử lý tạo đơn...' : 'Xác nhận Đặt Hàng Ngay' }}</span>
            <SvgIcon name="arrow-right" :size="18" />
          </button>
        </form>
      </div>

      <!-- Checkout Items Summary -->
      <aside class="summary-section fade-in-item">
        <div class="premium-card summary-card">
          <h3 class="section-title border-b">
            Sản phẩm đặt mua ({{ cartStore.products.length }})
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
              <span>Phí vận chuyển</span>
              <span class="success-text">Miễn phí ⚡</span>
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
.mb-8 { margin-bottom: 2.5rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-6 { margin-top: 1.5rem; }

/* Steps */
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

.active-line {
  background-color: var(--primary);
}

/* Success icon */
.success-icon-box {
  width: 64px;
  height: 64px;
  background-color: var(--accent);
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  border-radius: var(--radius-lg);
}

.section-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 1.25rem;
}

.border-b {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.text-area-input {
  resize: vertical;
}

/* Payment Card Selector */
.payment-methods-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
}

.payment-selected {
  border-color: var(--primary);
  background-color: var(--primary-glow);
}

.hidden-radio {
  display: none;
}

.payment-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.payment-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.15rem;
}

.payment-sub {
  font-size: 0.775rem;
  color: var(--text-muted);
}

/* Summary Card */
.summary-section {
  flex: 1;
}

.summary-card {
  border-radius: var(--radius-lg);
  position: sticky;
  top: 85px;
}

.summary-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 1.25rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sum-img-box {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  flex-shrink: 0;
}

.sum-item-img {
  width: 100%;
  height: 100%;
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
  color: var(--accent);
}

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
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--accent);
}
</style>
