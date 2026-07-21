<script setup lang="ts">
import { computed } from 'vue'
import { resolveImageUrl } from '~/composables/useImageUrl'

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
    <div class="item-img-wrapper">
      <img
        :src="resolveImageUrl(item.thumbnail)"
        :alt="item.title"
        class="item-img"
        loading="lazy"
      >
    </div>

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
        ⚠️ Chỉ còn {{ item.stock }} sản phẩm trong kho
      </div>
    </div>

    <!-- Quantity Selector -->
    <div class="item-qty-actions">
      <div class="qty-selector">
        <button
          :disabled="isUpdating || item.quantity <= 1"
          class="btn-qty"
          aria-label="Giảm số lượng"
          @click="emit('update-qty', item.product_id, item.quantity, -1, item.stock)"
        >
          -
        </button>
        <span class="qty-display" aria-live="polite" :aria-label="`Số lượng ${item.quantity}`">{{ item.quantity }}</span>
        <button
          :disabled="isUpdating || item.quantity >= item.stock"
          class="btn-qty"
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
      class="btn btn-secondary btn-remove"
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
  gap: 1.25rem;
  padding: 1.15rem 1.25rem;
  border-radius: 12px;
}

.item-img-wrapper {
  width: 76px;
  height: 76px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
}

.item-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 0.975rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text-main);
  margin-bottom: 0.35rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-prices {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.price-new {
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-main);
}

.price-old {
  font-size: 0.8rem;
  text-decoration: line-through;
  color: var(--text-muted);
}

.item-stock-warning {
  color: var(--warning);
  font-size: 0.775rem;
  margin-top: 0.35rem;
  font-weight: 600;
}

/* Qty Selector */
.qty-selector {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.2);
  height: 36px;
  align-items: center;
}

.btn-qty {
  width: 32px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-speed) ease;
}

.btn-qty:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

.btn-qty:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-display {
  width: 38px;
  text-align: center;
  font-weight: 700;
  color: var(--text-main);
  font-size: 0.9rem;
}

.item-total-price {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-main);
  min-width: 110px;
  text-align: right;
}

.btn-remove {
  padding: 0.45rem 0.65rem;
  font-size: 0.85rem;
  border-radius: 8px;
  flex-shrink: 0;
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-remove:hover {
  background-color: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: var(--danger);
}

@media (max-width: 576px) {
  .cart-item {
    flex-direction: column;
    text-align: center;
    gap: 0.9rem;
    padding: 1.15rem 1rem;
  }

  .item-title {
    white-space: normal;
  }

  .item-total-price {
    text-align: center;
    min-width: unset;
    margin: 0.25rem 0;
  }

  .qty-selector {
    margin: 0 auto;
  }

  .btn-remove {
    width: 100%;
    margin: 0 auto;
  }
}
</style>
