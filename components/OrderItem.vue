<script setup lang="ts">
const props = defineProps<{
  order: {
    _id: string;
    createdAt: string;
    status: string;
    products: Array<{
      product_id?: {
        _id: string;
        title: string;
        thumbnail?: string;
      };
      price: number;
      discountPercentage: number;
      quantity: number;
    }>;
    userInfo: {
      fullName: string;
      phone: string;
      address: string;
    };
  }
}>();

const emit = defineEmits<{
  (e: "cancel", orderId: string): void;
}>();

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function calculateOrderTotal(products: any[]) {
  return products.reduce((sum, p) => {
    const finalPrice = Math.round(p.price * (1 - p.discountPercentage / 100));
    return sum + finalPrice * p.quantity;
  }, 0);
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "processing":
      return "Đang xử lý";
    case "shipping":
      return "Đang giao hàng";
    case "delivered":
      return "Đã giao hàng";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "badge-pending";
    case "processing":
      return "badge-processing";
    case "shipping":
      return "badge-shipping";
    case "delivered":
      return "badge-active";
    case "cancelled":
      return "badge-inactive";
    default:
      return "";
  }
}
</script>

<template>
  <div class="premium-card order-card fade-in-item">
    <!-- Order Header -->
    <div class="order-header">
      <div class="order-meta">
        <span class="order-id">Mã đơn: <strong>{{ order._id }}</strong></span>
        <span class="order-date">Ngày đặt: {{ new Date(order.createdAt).toLocaleDateString("vi-VN") }}</span>
      </div>
      <div class="order-status">
        <span :class="['badge', getStatusClass(order.status)]">
          {{ getStatusLabel(order.status) }}
        </span>
      </div>
    </div>

    <!-- Products in Order -->
    <div class="order-products">
      <div v-for="item in order.products" :key="item.product_id?._id" class="order-product-item">
        <img 
          :src="item.product_id?.thumbnail || 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'" 
          :alt="item.product_id?.title || 'Sản phẩm'" 
          class="prod-img" 
        />
        <div class="prod-details">
          <h4 class="prod-title">{{ item.product_id?.title || 'Sản phẩm đã bị xóa' }}</h4>
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
        <p>📍 Người nhận: <strong>{{ order.userInfo.fullName }}</strong> ({{ order.userInfo.phone }})</p>
        <p>🏠 Địa chỉ: {{ order.userInfo.address }}</p>
      </div>
      <div class="order-action-total">
        <div class="order-total-price">
          Tổng thanh toán: <strong>{{ formatPrice(calculateOrderTotal(order.products)) }}</strong>
        </div>
        
        <button
          v-if="order.status === 'pending'"
          @click="emit('cancel', order._id)"
          class="btn btn-danger btn-cancel-order"
          aria-label="Hủy đơn hàng"
        >
          Hủy đơn hàng 🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-card {
  padding: 1.5rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.order-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.order-id {
  color: #fff;
}

/* Custom Status Badges */
.badge-pending {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--warning);
}

.badge-processing {
  background-color: rgba(99, 102, 241, 0.15);
  color: var(--primary);
}

.badge-shipping {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

/* Order Products list */
.order-products {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.order-product-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.prod-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.02);
}

.prod-details {
  flex: 1;
}

.prod-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
}

.prod-price-qty {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.prod-total {
  font-weight: 600;
  color: #fff;
  font-size: 0.95rem;
}

/* Order Footer details */
.order-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.shipping-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.order-action-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.order-total-price {
  font-size: 1.05rem;
  color: var(--text-muted);
}

.order-total-price strong {
  color: var(--primary);
  font-size: 1.25rem;
}

.btn-cancel-order {
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  border-radius: 8px;
}

@media (max-width: 576px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .order-meta {
    flex-direction: column;
    gap: 0.25rem;
  }

  .order-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .order-action-total {
    align-items: flex-start;
    width: 100%;
  }

  .btn-cancel-order {
    width: 100%;
    max-width: 200px;
  }
}
</style>
