<script setup lang="ts">
import { resolveImageUrl } from '~/composables/useImageUrl'

defineProps<{
  order: {
    id: string
    createdAt: string
    status: string
    products: Array<{
      product_id?: {
        id: string
        title: string
        thumbnail?: string
      }
      price: number
      discountPercentage: number
      quantity: number
    }>
    userInfo: {
      fullName: string
      phone: string
      address: string
    }
  }
}>()

const emit = defineEmits<{
  (e: 'cancel', orderId: string): void
}>()

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function calculateOrderTotal(products: any[]) {
  return products.reduce((sum, p) => {
    const finalPrice = Math.round(p.price * (1 - p.discountPercentage / 100))
    return sum + finalPrice * p.quantity
  }, 0)
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Chờ xác nhận'
    case 'processing':
      return 'Đang xử lý'
    case 'shipping':
      return 'Đang giao hàng'
    case 'delivered':
      return 'Đã giao hàng'
    case 'cancelled':
      return 'Đã hủy'
    default:
      return status
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'pending':
      return 'badge-pending'
    case 'processing':
      return 'badge-processing'
    case 'shipping':
      return 'badge-shipping'
    case 'delivered':
      return 'badge-active'
    case 'cancelled':
      return 'badge-inactive'
    default:
      return ''
  }
}
</script>

<template>
  <div class="premium-card order-card fade-in-item">
    <!-- Order Header -->
    <div class="order-header">
      <div class="order-meta">
        <span class="order-id">Mã đơn: <strong>#{{ order.id }}</strong></span>
        <span class="order-date">Ngày đặt: {{ new Date(order.createdAt).toLocaleDateString("vi-VN") }}</span>
      </div>
      <div class="order-status">
        <span class="badge" :class="[getStatusClass(order.status)]">
          {{ getStatusLabel(order.status) }}
        </span>
      </div>
    </div>

    <!-- Products in Order -->
    <div class="order-products">
      <div v-for="item in order.products" :key="item.product_id?.id" class="order-product-item">
        <div class="prod-img-box">
          <img
            :src="resolveImageUrl(item.product_id?.thumbnail)"
            :alt="item.product_id?.title || 'Sản phẩm'"
            class="prod-img"
            loading="lazy"
          >
        </div>
        <div class="prod-details">
          <h4 class="prod-title">
            {{ item.product_id?.title || 'Sản phẩm đã bị xóa' }}
          </h4>
          <div class="prod-price-qty">
            <span>{{ formatPrice(Math.round(item.price * (1 - item.discountPercentage / 100))) }} &times; {{ item.quantity }}</span>
          </div>
        </div>
        <div class="prod-total">
          {{ formatPrice(Math.round(item.price * (1 - item.discountPercentage / 100)) * item.quantity) }}
        </div>
      </div>
    </div>

    <!-- Order Footer -->
    <div class="order-footer">
      <div class="shipping-info">
        <p class="shipping-recipient">📍 {{ order.userInfo.fullName }} <span class="phone-tag">({{ order.userInfo.phone }})</span></p>
        <p class="shipping-address">🏠 {{ order.userInfo.address }}</p>
      </div>
      <div class="order-action-total">
        <div class="order-total-price">
          <span class="total-label">Tổng thanh toán:</span>
          <strong class="total-val">{{ formatPrice(calculateOrderTotal(order.products)) }}</strong>
        </div>

        <button
          v-if="order.status === 'pending'"
          class="btn btn-secondary btn-cancel-order"
          aria-label="Hủy đơn hàng"
          @click="emit('cancel', order.id)"
        >
          Hủy đơn hàng
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-card {
  padding: 1.35rem;
  border-radius: 14px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.85rem;
  margin-bottom: 1rem;
}

.order-meta {
  display: flex;
  gap: 1.25rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  align-items: center;
}

.order-id {
  color: var(--text-main);
  font-weight: 600;
}

.order-id strong {
  font-family: monospace;
  font-size: 0.925rem;
}

.order-date {
  font-size: 0.825rem;
}

/* Custom Status Badges */
.badge-pending {
  background-color: rgba(245, 158, 11, 0.12);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.badge-processing {
  background-color: rgba(79, 70, 229, 0.12);
  color: var(--primary);
  border: 1px solid rgba(79, 70, 229, 0.25);
}

.badge-shipping {
  background-color: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.25);
}

/* Order Products list */
.order-products {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.15rem;
}

.order-product-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
}

.order-product-item:last-child {
  border-bottom: none;
}

.prod-img-box {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  flex-shrink: 0;
}

.prod-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.prod-details {
  flex: 1;
  min-width: 0;
}

.prod-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prod-price-qty {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

.prod-total {
  font-weight: 800;
  color: var(--text-main);
  font-size: 0.925rem;
}

/* Order Footer details */
.order-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.25rem;
}

.shipping-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.shipping-recipient {
  font-weight: 700;
  color: var(--text-main);
}

.phone-tag {
  font-weight: 500;
  color: var(--text-muted);
}

.shipping-address {
  font-size: 0.8rem;
  color: var(--text-dim);
  margin-top: 0.2rem;
}

.order-action-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.65rem;
}

.order-total-price {
  font-size: 0.9rem;
  color: var(--text-muted);
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.total-val {
  color: var(--text-main);
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.btn-cancel-order {
  padding: 0.35rem 0.85rem;
  font-size: 0.8rem;
  border-radius: 8px;
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-cancel-order:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.35);
}

@media (max-width: 576px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .order-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .order-action-total {
    align-items: flex-start;
    width: 100%;
  }

  .btn-cancel-order {
    width: 100%;
  }
}
</style>
