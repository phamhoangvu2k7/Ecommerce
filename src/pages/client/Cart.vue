<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useCartStore } from "../../stores/cart.ts";

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
        <div
          v-for="item in cartStore.products"
          :key="item.product_id"
          class="premium-card cart-item fade-in-item"
        >
          <img
            :src="
              item.thumbnail ||
              'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'
            "
            :alt="item.title"
            class="item-img"
          />

          <div class="item-details">
            <h3 class="item-title">{{ item.title }}</h3>
            <div class="item-prices">
              <span class="price-new">{{ formatPrice(item.priceNew) }}</span>
              <span v-if="item.discountPercentage > 0" class="price-old">
                {{ formatPrice(item.price) }}
              </span>
            </div>
            <div class="item-stock-warning" v-if="item.stock <= 5">
              Chỉ còn {{ item.stock }} sản phẩm trong kho!
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="item-qty-actions">
            <div class="qty-selector">
              <button
                @click="
                  handleUpdateQty(
                    item.product_id,
                    item.quantity,
                    -1,
                    item.stock,
                  )
                "
                :disabled="updatingId === item.product_id || item.quantity <= 1"
                class="btn btn-secondary btn-qty"
              >
                -
              </button>
              <span class="qty-display">{{ item.quantity }}</span>
              <button
                @click="
                  handleUpdateQty(item.product_id, item.quantity, 1, item.stock)
                "
                :disabled="
                  updatingId === item.product_id || item.quantity >= item.stock
                "
                class="btn btn-secondary btn-qty"
              >
                +
              </button>
            </div>
          </div>

          <div class="item-total-price">
            {{ formatPrice(item.totalPrice) }}
          </div>

          <button
            @click="handleRemoveItem(item.product_id)"
            :disabled="updatingId === item.product_id"
            class="btn btn-danger btn-remove"
            title="Xóa sản phẩm"
          >
            🗑️
          </button>
        </div>
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

/* Cart Item Card */
.cart-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem;
}

@media (max-width: 576px) {
  .cart-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem 1rem;
  }

  .item-total-price {
    text-align: center;
    min-width: unset;
    margin: 0.5rem 0;
  }

  .qty-selector {
    margin: 0 auto;
  }

  .btn-remove {
    width: 100%;
    max-width: 120px;
    margin: 0 auto;
  }
}

.item-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.02);
}

.item-details {
  flex: 1;
}

.item-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.25rem;
}

.item-prices {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.price-new {
  font-weight: 700;
  color: var(--primary);
}

.price-old {
  font-size: 0.85rem;
  text-decoration: line-through;
  color: var(--text-muted);
}

.item-stock-warning {
  color: var(--warning);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Qty Selector */
.qty-selector {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(15, 23, 42, 0.6);
  height: 36px;
  align-items: center;
}

.btn-qty {
  width: 32px;
  height: 100%;
  border-radius: 0;
  padding: 0;
}

.qty-display {
  width: 36px;
  text-align: center;
  font-weight: 700;
  color: #fff;
  font-size: 0.95rem;
}

.item-total-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  min-width: 100px;
  text-align: right;
}

.btn-remove {
  padding: 0.5rem;
  font-size: 0.9rem;
  border-radius: 8px;
  flex-shrink: 0;
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
