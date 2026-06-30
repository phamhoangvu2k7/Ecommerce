<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "../../stores/cart.ts";

const cartStore = useCartStore();
const router = useRouter();

const fullName = ref("");
const phone = ref("");
const address = ref("");

const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

onMounted(async () => {
  await cartStore.fetchCart();
  if (cartStore.products.length === 0) {
    router.push("/cart");
  }

  // Pre-fill user data if logged in
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    const user = JSON.parse(savedUser);
    fullName.value = user.fullName || "";
    phone.value = user.phone || "";
  }
});

async function handleCheckout() {
  if (!fullName.value || !phone.value || !address.value) {
    errorMsg.value = "Vui lòng nhập đầy đủ thông tin giao hàng.";
    return;
  }

  if (!cartStore.cartId) {
    errorMsg.value = "Giỏ hàng không hợp lệ. Vui lòng quay lại giỏ hàng và thử lại.";
    return;
  }

  if (cartStore.products.length === 0) {
    errorMsg.value = "Giỏ hàng của bạn đang trống.";
    router.push("/cart");
    return;
  }

  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";

  try {
    const token = localStorage.getItem("token");
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/client/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify({
        cartId: cartStore.cartId,
        fullName: fullName.value,
        phone: phone.value,
        address: address.value
      })
    });

    const data = await res.json();
    if (data.success) {
      successMsg.value = "Đặt hàng thành công! Cảm ơn bạn đã tin tưởng.";
      cartStore.clearCart();
      
      // Navigate to orders or homepage after 3 seconds
      setTimeout(() => {
        router.push("/orders");
      }, 3000);
    } else {
      errorMsg.value = data.message || data.statusMessage || "Lỗi đặt hàng, vui lòng kiểm tra tồn kho.";
    }
  } catch (err: any) {
    errorMsg.value = "Có lỗi xảy ra trong quá trình đặt hàng.";
  } finally {
    loading.value = false;
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}
</script>

<template>
  <div class="checkout-page container">
    <h1 class="h1-title mb-8">Thanh toán đơn hàng</h1>

    <div v-if="successMsg" class="alert alert-success max-w-xl mx-auto text-center py-6 fade-in-item">
      <div class="success-icon">🎉</div>
      <p class="font-semibold text-lg">{{ successMsg }}</p>
      <p class="text-sm mt-2 text-muted">Đang chuyển hướng về trang Đơn hàng cá nhân...</p>
    </div>

    <div v-else class="checkout-layout">
      <!-- Shipping form -->
      <div class="shipping-section glass-panel fade-in-item">
        <h3 class="section-title">Thông tin giao hàng</h3>

        <div v-if="errorMsg" class="alert alert-error">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleCheckout">
          <div class="input-group">
            <label class="input-label">Họ và tên người nhận</label>
            <input v-model="fullName" type="text" placeholder="Nhập đầy đủ họ tên" class="premium-input" required />
          </div>

          <div class="input-group">
            <label class="input-label">Số điện thoại nhận hàng</label>
            <input v-model="phone" type="tel" placeholder="Nhập số điện thoại liên lạc" class="premium-input" required />
          </div>

          <div class="input-group">
            <label class="input-label">Địa chỉ nhận hàng</label>
            <textarea
              v-model="address"
              placeholder="Ghi rõ số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              class="premium-input text-area-input"
              rows="4"
              required
            ></textarea>
          </div>

          <button type="submit" :disabled="loading" class="btn btn-primary btn-submit-checkout w-full mt-6">
            {{ loading ? 'Đang xử lý đặt hàng...' : 'Xác nhận Đặt hàng (Thanh toán COD) 📦' }}
          </button>
        </form>
      </div>

      <!-- Checkout Summary -->
      <aside class="summary-section fade-in-item">
        <div class="premium-card summary-card">
          <h3 class="section-title border-b">Chi tiết sản phẩm</h3>

          <div class="summary-items-list">
            <div v-for="item in cartStore.products" :key="item.product_id" class="summary-item">
              <img :src="item.thumbnail || 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'" :alt="item.title" class="sum-item-img" />
              <div class="sum-item-details">
                <h4 class="sum-item-title">{{ item.title }}</h4>
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
              <span>{{ formatPrice(cartStore.totalAmount) }}</span>
            </div>
            <div class="summary-row">
              <span>Giao hàng</span>
              <span class="success-text">Miễn phí</span>
            </div>
            <div class="summary-divider"></div>
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
.mb-8 {
  margin-bottom: 2rem;
}

.max-w-xl {
  max-width: 36rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.py-6 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.checkout-layout {
  display: flex;
  gap: 2rem;
}

@media (max-width: 992px) {
  .checkout-layout {
    flex-direction: column;
  }
}

.shipping-section {
  flex: 1.5;
  padding: 2rem;
}

.text-area-input {
  resize: vertical;
}

.summary-section {
  flex: 1;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
}

.border-b {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

/* Products in list */
.summary-items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
  padding-right: 0.25rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sum-item-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.02);
}

.sum-item-details {
  flex: 1;
}

.sum-item-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.15rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 200px;
}

.sum-item-qty-price {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.sum-item-total {
  font-weight: 600;
  color: #fff;
}

/* Pricing summary rows */
.pricing-rows {
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.success-text {
  color: var(--success);
  font-weight: 600;
}

.summary-divider {
  border-bottom: 1px solid var(--border-color);
  margin: 1rem 0;
}

.total-row {
  color: #fff;
  font-weight: 700;
}

.total-price {
  font-size: 1.3rem;
  color: var(--primary);
}

.w-full {
  width: 100%;
}

.mt-6 {
  margin-top: 1.5rem;
}

@media (max-width: 576px) {
  .shipping-section {
    padding: 1.25rem;
  }
  
  .section-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
  
  .sum-item-title {
    max-width: 150px;
  }
}
</style>
