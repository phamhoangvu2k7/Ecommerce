<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  item: {
    product_id: string
    title: string
    thumbnail?: string
    priceNew: number
    price: number
    discountPercentage: number
    stock: number
    quantity: number
    totalPrice: number
  }
  updatingId: string | null
}>()

const emit = defineEmits<{
  (e: 'update-qty', productId: string, currentQty: number, offset: number, maxStock: number): void
  (e: 'remove', productId: string): void
}>()

const isUpdating = computed(() => props.updatingId === props.item.product_id)

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}
</script>

<template>
  <div class="premium-card cart-item fade-in-item">
    <img
      :src="item.thumbnail || 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'"
      :alt="item.title"
      class="item-img"
    >

    <div class="item-details">
      <h3 class="item-title">
        {{ item.title }}
      </h3>
      <div class="item-prices">
        <span class="price-new">{{ formatPrice(item.priceNew) }}</span>
        <span v-if="item.discountPercentage > 0" class="price-old">
          {{ formatPrice(item.price) }}
        </span>
      </div>
      <div v-if="item.stock <= 5" class="item-stock-warning">
        Chỉ còn {{ item.stock }} sản phẩm trong kho!
      </div>
    </div>

    <!-- Quantity Selector -->
    <div class="item-qty-actions">
      <div class="qty-selector">
        <button
          :disabled="isUpdating || item.quantity <= 1"
          class="btn btn-secondary btn-qty"
          aria-label="Giảm số lượng"
          @click="emit('update-qty', item.product_id, item.quantity, -1, item.stock)"
        >
          -
        </button>
        <span class="qty-display" aria-live="polite" :aria-label="`Số lượng ${item.quantity}`">{{ item.quantity }}</span>
        <button
          :disabled="isUpdating || item.quantity >= item.stock"
          class="btn btn-secondary btn-qty"
          aria-label="Tăng số lượng"
          @click="emit('update-qty', item.product_id, item.quantity, 1, item.stock)"
        >
          +
        </button>
      </div>
    </div>

    <div class="item-total-price">
      {{ formatPrice(item.totalPrice) }}
    </div>

    <button
      :disabled="isUpdating"
      class="btn btn-danger btn-remove"
      aria-label="Xóa sản phẩm khỏi giỏ hàng"
      title="Xóa sản phẩm"
      @click="emit('remove', item.product_id)"
    >
      🗑️
    </button>
  </div>
</template>

<style scoped>
.cart-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem;
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
</style>
