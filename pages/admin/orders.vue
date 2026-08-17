<script setup lang="ts">
import { onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

interface OrderItem {
  id: string
  title: string
  price: number
  quantity: number
  thumbnail?: string
}

interface UserInfo {
  fullName: string
  phone: string
  address: string
}

interface Order {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled'
  products: OrderItem[]
  userInfo: UserInfo | null
  totalPrice?: number
  createdAt?: string
}

const orders = ref<Order[]>([])
const loading = ref(true)
const activeTab = ref<string>('all')
const successMsg = ref('')
const errorMsg = ref('')

// Modal View Detail State
const selectedOrder = ref<Order | null>(null)
const showDetailModal = ref(false)

onMounted(async () => {
  await fetchOrders()
})

async function fetchOrders() {
  loading.value = true
  errorMsg.value = ''
  try {
    const url = activeTab.value === 'all'
      ? '/api/admin/orders'
      : `/api/admin/orders?status=${activeTab.value}`

    const res = await useAdminFetch(url)
    const data = await res.json()

    if (data.success) {
      orders.value = data.orders
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi tải danh sách đơn hàng.'
    }
  }
  catch {
    errorMsg.value = 'Lỗi kết nối máy chủ.'
  }
  finally {
    loading.value = false
  }
}

function handleTabChange(status: string) {
  activeTab.value = status
  fetchOrders()
}

async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const res = await useAdminFetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()

    if (data.success) {
      successMsg.value = data.message
      await fetchOrders()

      if (selectedOrder.value && selectedOrder.value.id === orderId) {
        selectedOrder.value.status = newStatus as any
      }

      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi cập nhật trạng thái đơn hàng.')
    }
  }
  catch {
    alert('Lỗi kết nối máy chủ.')
  }
}

function openDetailModal(order: Order) {
  selectedOrder.value = order
  showDetailModal.value = true
}

function calculateOrderTotal(order: Order): number {
  if (!order.products || !Array.isArray(order.products)) return 0
  return order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  catch {
    return dateStr
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'badge-pending'
    case 'processing': return 'badge-processing'
    case 'shipping': return 'badge-shipping'
    case 'completed': return 'badge-completed'
    case 'cancelled': return 'badge-cancelled'
    default: return ''
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return '🟡 Chờ xác nhận'
    case 'processing': return '🔵 Đang xử lý'
    case 'shipping': return '🚚 Đang giao hàng'
    case 'completed': return '🟢 Hoàn thành'
    case 'cancelled': return '❌ Đã hủy'
    default: return status
  }
}
</script>

<template>
  <div class="admin-orders-page">
    <div class="page-header mb-6">
      <div class="title-block">
        <h1 class="h1-title">
          Quản lý Đơn hàng
        </h1>
        <p class="text-muted">
          Duyệt đơn, cập nhật tiến độ giao hàng và quản lý tất cả đơn đặt hàng.
        </p>
      </div>
    </div>

    <!-- Alert Success / Error -->
    <div v-if="successMsg" class="alert alert-success fade-in-item">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs mb-4">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'all' }"
        @click="handleTabChange('all')"
      >
        Tất cả
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'pending' }"
        @click="handleTabChange('pending')"
      >
        🟡 Chờ xác nhận
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'processing' }"
        @click="handleTabChange('processing')"
      >
        🔵 Đang xử lý
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'shipping' }"
        @click="handleTabChange('shipping')"
      >
        🚚 Đang giao
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'completed' }"
        @click="handleTabChange('completed')"
      >
        🟢 Hoàn thành
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'cancelled' }"
        @click="handleTabChange('cancelled')"
      >
        ❌ Đã hủy
      </button>
    </div>

    <!-- Table Card -->
    <div class="premium-card table-card overflow-x">
      <table class="premium-table">
        <thead>
          <tr>
            <th>Mã đơn hàng</th>
            <th>Khách hàng</th>
            <th>Ngày đặt</th>
            <th>Tổng thanh toán</th>
            <th>Trạng thái</th>
            <th width="220" class="text-center">
              Thao tác / Cập nhật
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && orders.length === 0">
            <td colspan="6" class="text-center py-6 text-muted">
              Đang tải danh sách đơn hàng...
            </td>
          </tr>
          <tr v-else-if="orders.length === 0">
            <td colspan="6" class="text-center py-6 text-muted">
              Không tìm thấy đơn hàng nào.
            </td>
          </tr>
          <tr v-for="order in orders" :key="order.id" class="table-row">
            <td class="font-bold text-main">
              #{{ order.id.slice(0, 8) }}...
            </td>
            <td>
              <div class="user-cell">
                <span class="user-name font-semibold">{{ order.userInfo?.fullName || 'Khách hàng' }}</span>
                <span class="user-phone text-muted">{{ order.userInfo?.phone || '' }}</span>
              </div>
            </td>
            <td class="text-muted">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="font-bold text-primary">
              {{ formatPrice(calculateOrderTotal(order)) }}
            </td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(order.status)">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td class="text-center">
              <div class="action-buttons">
                <!-- Direct Approve Button for Pending Orders -->
                <button
                  v-if="order.status === 'pending'"
                  class="btn btn-sm btn-primary"
                  title="Duyệt xác nhận đơn"
                  @click="updateOrderStatus(order.id, 'processing')"
                >
                  ✓ Duyệt đơn
                </button>

                <button
                  v-else-if="order.status === 'processing'"
                  class="btn btn-sm btn-info"
                  title="Chuyển sang Đang giao"
                  @click="updateOrderStatus(order.id, 'shipping')"
                >
                  🚚 Giao hàng
                </button>

                <button
                  v-else-if="order.status === 'shipping'"
                  class="btn btn-sm btn-success"
                  title="Xác nhận đã hoàn thành"
                  @click="updateOrderStatus(order.id, 'completed')"
                >
                  🟢 Hoàn thành
                </button>

                <button
                  class="btn btn-sm btn-secondary"
                  title="Xem chi tiết"
                  @click="openDetailModal(order)"
                >
                  👁️ Chi tiết
                </button>

                <!-- Cancel Button for active orders -->
                <button
                  v-if="order.status !== 'completed' && order.status !== 'cancelled'"
                  class="btn btn-sm btn-danger"
                  title="Hủy đơn hàng này"
                  @click="updateOrderStatus(order.id, 'cancelled')"
                >
                  ✕ Hủy
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="showDetailModal && selectedOrder" class="modal-backdrop">
      <div class="modal-content premium-card glass-panel fade-in-item">
        <div class="modal-header">
          <h3 class="modal-title">
            Chi tiết đơn hàng #{{ selectedOrder.id }}
          </h3>
          <button class="btn btn-secondary btn-close-modal" @click="showDetailModal = false">
            ✕
          </button>
        </div>

        <div class="order-detail-body">
          <!-- Status Dropdown inside modal -->
          <div class="detail-section status-change-box mb-4">
            <label class="font-bold text-main">Trạng thái đơn hàng:</label>
            <select
              :value="selectedOrder.status"
              class="premium-input status-select"
              @change="updateOrderStatus(selectedOrder.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="pending">
                🟡 Chờ xác nhận (Pending)
              </option>
              <option value="processing">
                🔵 Đã xác nhận / Đang xử lý (Processing)
              </option>
              <option value="shipping">
                🚚 Đang giao hàng (Shipping)
              </option>
              <option value="completed">
                🟢 Hoàn thành (Completed)
              </option>
              <option value="cancelled">
                ❌ Đã hủy đơn (Cancelled)
              </option>
            </select>
          </div>

          <!-- Customer Info -->
          <div class="detail-section mb-4">
            <h4 class="section-title">
              📍 Thông tin người nhận
            </h4>
            <div class="info-grid">
              <div><strong>Họ tên:</strong> {{ selectedOrder.userInfo?.fullName || 'N/A' }}</div>
              <div><strong>Số điện thoại:</strong> {{ selectedOrder.userInfo?.phone || 'N/A' }}</div>
              <div class="col-span-2">
                <strong>Địa chỉ:</strong> {{ selectedOrder.userInfo?.address || 'N/A' }}
              </div>
            </div>
          </div>

          <!-- Product List -->
          <div class="detail-section">
            <h4 class="section-title">
              📦 Sản phẩm đặt mua
            </h4>
            <div class="products-list">
              <div v-for="item in selectedOrder.products" :key="item.id" class="product-item">
                <img :src="item.thumbnail || '/placeholder.png'" class="product-thumb" alt="Product">
                <div class="product-info">
                  <div class="product-name font-semibold">
                    {{ item.title }}
                  </div>
                  <div class="product-price text-muted">
                    {{ formatPrice(item.price) }} × {{ item.quantity }}
                  </div>
                </div>
                <div class="product-subtotal font-bold">
                  {{ formatPrice(item.price * item.quantity) }}
                </div>
              </div>
            </div>
            <div class="order-total-summary">
              <span>Tổng tiền đơn hàng:</span>
              <span class="total-price font-bold">{{ formatPrice(calculateOrderTotal(selectedOrder)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.text-center { text-align: center; }
.text-main { color: var(--text-main); }
.text-muted { color: var(--text-muted); font-size: 0.875rem; }
.text-primary { color: var(--primary, #6366f1); }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-btn:hover, .tab-btn.active {
  color: var(--text-main);
  background-color: rgba(255, 255, 255, 0.08);
  border-color: var(--primary);
}

.tab-btn.active {
  background-color: rgba(99, 102, 241, 0.15);
}

.table-card {
  border-radius: 14px;
  padding: 0;
}
.overflow-x { overflow-x: auto; }

.premium-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.premium-table th {
  padding: 0.85rem 1.15rem;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.15);
}
.premium-table td {
  padding: 0.85rem 1.15rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.3rem 0.6rem;
  font-size: 0.775rem;
  border-radius: 6px;
}

.btn-info {
  background-color: #0284c7;
  color: #ffffff;
}

.btn-success {
  background-color: #16a34a;
  color: #ffffff;
}

/* Badges */
.badge-pending { background-color: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.3); }
.badge-processing { background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
.badge-shipping { background-color: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); }
.badge-completed { background-color: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
.badge-cancelled { background-color: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  width: 100%;
  max-width: 620px;
  padding: 1.75rem;
  border-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
}
.modal-title { font-size: 1.2rem; font-weight: 800; color: var(--text-main); }
.btn-close-modal { padding: 0.25rem 0.5rem; border-radius: 6px; }

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.85rem;
  border-radius: 8px;
  font-size: 0.875rem;
}
.col-span-2 { grid-column: span 2; }

.status-change-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(99, 102, 241, 0.1);
  padding: 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}
.status-select {
  flex: 1;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}
.product-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}
.product-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
}
.product-info { flex: 1; }
.product-name { font-size: 0.875rem; color: var(--text-main); }
.product-price { font-size: 0.8rem; }
.product-subtotal { font-size: 0.9rem; color: var(--primary, #6366f1); }

.order-total-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 1.05rem;
  font-weight: 700;
}
.total-price { color: var(--primary, #6366f1); font-size: 1.2rem; }
</style>
