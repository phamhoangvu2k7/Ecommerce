<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

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

// Selection state
const selectedIds = ref<string[]>([])

// Modal View Detail State
const selectedOrder = ref<Order | null>(null)
const showDetailModal = ref(false)

onMounted(async () => {
  await fetchOrders()
})

async function fetchOrders() {
  loading.value = true
  errorMsg.value = ''
  selectedIds.value = []
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

// Select All Toggle
const isAllSelected = computed(() => {
  if (orders.value.length === 0)
    return false
  return orders.value.every(o => selectedIds.value.includes(o.id))
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  }
  else {
    selectedIds.value = orders.value.map(o => o.id)
  }
}

function toggleSelect(id: string) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  }
  else {
    selectedIds.value.push(id)
  }
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
      successMsg.value = data.message || 'Cập nhật trạng thái đơn hàng thành công!'
      await fetchOrders()

      if (selectedOrder.value && selectedOrder.value.id === orderId) {
        selectedOrder.value.status = newStatus as any
      }

      setTimeout(() => (successMsg.value = ''), 3000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi cập nhật trạng thái.')
    }
  }
  catch {
    alert('Lỗi kết nối máy chủ.')
  }
}

async function handleBatchStatusUpdate(status: string) {
  if (selectedIds.value.length === 0)
    return
  try {
    for (const id of selectedIds.value) {
      await updateOrderStatus(id, status)
    }
    successMsg.value = `Đã cập nhật trạng thái ${selectedIds.value.length} đơn hàng!`
    selectedIds.value = []
    setTimeout(() => (successMsg.value = ''), 3000)
  }
  catch {
    alert('Lỗi cập nhật hàng loạt.')
  }
}

function openDetailModal(order: Order) {
  selectedOrder.value = order
  showDetailModal.value = true
}

function calculateOrderTotal(order: Order): number {
  if (!order.products || !Array.isArray(order.products))
    return 0
  return order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(dateStr?: string): string {
  if (!dateStr)
    return 'N/A'
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
    case 'pending': return 'badge-warning'
    case 'processing': return 'badge-primary'
    case 'shipping': return 'badge-primary'
    case 'completed': return 'badge-active'
    case 'cancelled': return 'badge-danger'
    default: return ''
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Chờ duyệt'
    case 'processing': return 'Đang xử lý'
    case 'shipping': return 'Đang giao'
    case 'completed': return 'Hoàn thành'
    case 'cancelled': return 'Đã hủy'
    default: return status
  }
}
</script>

<template>
  <div class="admin-orders-page">
    <!-- Header -->
    <div class="page-header mb-6">
      <h1 class="page-title">
        Quản Lý Đơn Hàng
      </h1>
      <p class="text-muted">
        Duyệt đơn, cập nhật tiến độ giao hàng và xử lý toàn bộ đơn đặt hàng.
      </p>
    </div>

    <!-- Alert Messages -->
    <div v-if="successMsg" class="alert alert-success fade-in-item mb-4">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="alert alert-error mb-4">
      {{ errorMsg }}
    </div>

    <!-- Filter Tabs Card -->
    <div class="premium-card filter-card mb-6">
      <div class="status-tabs flex gap-2">
        <button class="tab-btn" :class="{ 'tab-active': activeTab === 'all' }" @click="handleTabChange('all')">
          Tất cả
        </button>
        <button class="tab-btn" :class="{ 'tab-active': activeTab === 'pending' }" @click="handleTabChange('pending')">
          Chờ duyệt
        </button>
        <button class="tab-btn" :class="{ 'tab-active': activeTab === 'processing' }" @click="handleTabChange('processing')">
          Đang xử lý
        </button>
        <button class="tab-btn" :class="{ 'tab-active': activeTab === 'shipping' }" @click="handleTabChange('shipping')">
          Đang giao
        </button>
        <button class="tab-btn" :class="{ 'tab-active': activeTab === 'completed' }" @click="handleTabChange('completed')">
          Hoàn thành
        </button>
        <button class="tab-btn" :class="{ 'tab-active': activeTab === 'cancelled' }" @click="handleTabChange('cancelled')">
          Đã hủy
        </button>
      </div>
    </div>

    <!-- Clean Data Table Card -->
    <div class="premium-card table-card overflow-x">
      <table class="clean-data-table">
        <thead>
          <tr>
            <th width="40" class="text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                class="cursor-pointer"
                @change="toggleSelectAll"
              >
            </th>
            <th>Mã Đơn</th>
            <th>Khách Hàng</th>
            <th>Ngày Đặt</th>
            <th>Tổng Thanh Toán</th>
            <th>Trạng Thái</th>
            <th width="240" class="text-center">
              Cập Nhật & Thao Tác
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading && orders.length === 0">
            <td colspan="7" class="text-center py-8 text-muted">
              Đang tải danh sách đơn hàng...
            </td>
          </tr>

          <tr v-else-if="orders.length === 0">
            <td colspan="7" class="text-center py-8 text-muted">
              Không tìm thấy đơn hàng nào.
            </td>
          </tr>

          <tr
            v-for="order in orders"
            :key="order.id"
            class="table-row"
            :class="{ 'row-selected': selectedIds.includes(order.id) }"
          >
            <td class="text-center">
              <input
                type="checkbox"
                :checked="selectedIds.includes(order.id)"
                class="cursor-pointer"
                @change="toggleSelect(order.id)"
              >
            </td>

            <td class="font-bold text-primary">
              #{{ order.id.slice(0, 8) }}
            </td>

            <td>
              <div class="user-cell">
                <span class="user-name font-bold">{{ order.userInfo?.fullName || 'Khách vãng lai' }}</span>
                <span class="user-phone text-muted">{{ order.userInfo?.phone || '' }}</span>
              </div>
            </td>

            <td class="text-muted">
              {{ formatDate(order.createdAt) }}
            </td>

            <td class="font-extrabold text-accent">
              {{ formatPrice(calculateOrderTotal(order)) }}
            </td>

            <td>
              <span class="badge" :class="getStatusBadgeClass(order.status)">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>

            <td class="text-center">
              <div class="action-buttons flex justify-center gap-1">
                <!-- Direct Status Progression Buttons -->
                <button
                  v-if="order.status === 'pending'"
                  class="btn btn-sm btn-accent"
                  title="Duyệt đơn hàng"
                  @click="updateOrderStatus(order.id, 'processing')"
                >
                  <SvgIcon name="check" :size="13" />
                  <span>Duyệt</span>
                </button>

                <button
                  v-else-if="order.status === 'processing'"
                  class="btn btn-sm btn-primary"
                  title="Chuyển Giao hàng"
                  @click="updateOrderStatus(order.id, 'shipping')"
                >
                  <SvgIcon name="truck" :size="13" />
                  <span>Giao hàng</span>
                </button>

                <button
                  v-else-if="order.status === 'shipping'"
                  class="btn btn-sm btn-accent"
                  title="Hoàn thành đơn"
                  @click="updateOrderStatus(order.id, 'completed')"
                >
                  <SvgIcon name="check" :size="13" />
                  <span>Hoàn thành</span>
                </button>

                <button
                  class="btn btn-secondary btn-sm"
                  title="Xem chi tiết"
                  @click="openDetailModal(order)"
                >
                  <SvgIcon name="eye" :size="14" />
                </button>

                <button
                  v-if="order.status !== 'completed' && order.status !== 'cancelled'"
                  class="btn btn-secondary btn-sm btn-cancel"
                  title="Hủy đơn hàng"
                  @click="updateOrderStatus(order.id, 'cancelled')"
                >
                  <SvgIcon name="x" :size="14" color="var(--danger)" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Floating Batch Actions Bar -->
    <div v-if="selectedIds.length > 0" class="batch-actions-bar glass-panel fade-in-item">
      <span class="batch-count">Đã chọn <strong>{{ selectedIds.length }}</strong> đơn hàng</span>

      <div class="batch-buttons flex gap-2">
        <button class="btn btn-secondary btn-sm" @click="handleBatchStatusUpdate('processing')">
          <SvgIcon name="check" :size="14" color="var(--primary)" />
          <span>Duyệt (Processing)</span>
        </button>

        <button class="btn btn-secondary btn-sm" @click="handleBatchStatusUpdate('shipping')">
          <SvgIcon name="truck" :size="14" color="var(--accent)" />
          <span>Đang giao (Shipping)</span>
        </button>

        <button class="btn btn-secondary btn-sm" @click="handleBatchStatusUpdate('completed')">
          <SvgIcon name="check" :size="14" color="var(--success)" />
          <span>Hoàn tất (Completed)</span>
        </button>

        <button class="btn btn-danger btn-sm" @click="handleBatchStatusUpdate('cancelled')">
          <SvgIcon name="x" :size="14" />
          <span>Hủy đơn</span>
        </button>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="showDetailModal && selectedOrder" class="modal-backdrop">
      <div class="modal-content premium-card glass-panel fade-in-item">
        <div class="modal-header">
          <h3 class="modal-title">
            Chi Tiết Đơn Hàng #{{ selectedOrder.id }}
          </h3>
          <button class="btn btn-secondary btn-close-modal" @click="showDetailModal = false">
            <SvgIcon name="x" :size="16" />
          </button>
        </div>

        <div class="order-detail-body">
          <!-- Status Changer inside modal -->
          <div class="detail-section status-change-box mb-4">
            <label class="font-bold text-main">Trạng thái đơn hàng:</label>
            <select
              :value="selectedOrder.status"
              class="premium-input select-input status-select"
              @change="updateOrderStatus(selectedOrder.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="pending">
                Chờ duyệt (Pending)
              </option>
              <option value="processing">
                Đang xử lý (Processing)
              </option>
              <option value="shipping">
                Đang giao hàng (Shipping)
              </option>
              <option value="completed">
                Hoàn thành (Completed)
              </option>
              <option value="cancelled">
                Đã hủy đơn (Cancelled)
              </option>
            </select>
          </div>

          <!-- Customer Info -->
          <div class="detail-section mb-4">
            <h4 class="section-title">
              Thông Tin Người Nhận
            </h4>
            <div class="info-grid">
              <div><strong>Họ tên:</strong> {{ selectedOrder.userInfo?.fullName || 'N/A' }}</div>
              <div><strong>Số điện thoại:</strong> {{ selectedOrder.userInfo?.phone || 'N/A' }}</div>
              <div class="col-span-2">
                <strong>Địa chỉ giao:</strong> {{ selectedOrder.userInfo?.address || 'N/A' }}
              </div>
            </div>
          </div>

          <!-- Items list -->
          <div class="detail-section">
            <h4 class="section-title">
              Danh Sách Sản Phẩm
            </h4>
            <div class="products-list mb-4">
              <div v-for="item in selectedOrder.products" :key="item.id" class="product-item">
                <img :src="item.thumbnail || '/placeholder.png'" class="product-thumb" alt="Product">
                <div class="product-info">
                  <div class="product-name font-bold">
                    {{ item.title }}
                  </div>
                  <div class="product-price text-muted">
                    {{ formatPrice(item.price) }} × {{ item.quantity }}
                  </div>
                </div>
                <div class="product-subtotal font-extrabold text-accent">
                  {{ formatPrice(item.price * item.quantity) }}
                </div>
              </div>
            </div>

            <div class="order-total-summary">
              <span>Tổng tiền thanh toán:</span>
              <span class="total-price font-extrabold text-accent">{{ formatPrice(calculateOrderTotal(selectedOrder)) }}</span>
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

.page-title {
  font-family: var(--font-heading);
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Tabs */
.filter-card {
  padding: 0.85rem 1.25rem;
}

.status-tabs {
  display: flex;
  overflow-x: auto;
}

.tab-btn {
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.tab-active, .tab-btn:hover {
  color: var(--text-main);
  background-color: rgba(255, 255, 255, 0.06);
}

.tab-active {
  color: var(--primary) !important;
  border-color: var(--border-color);
  background-color: var(--primary-glow) !important;
}

/* Data Table */
.table-card {
  border-radius: var(--radius-lg);
  padding: 0;
  overflow: hidden;
}

.clean-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.clean-data-table th {
  padding: 0.85rem 1rem;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.15);
}

.clean-data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.table-row:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.row-selected {
  background-color: var(--primary-glow) !important;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: var(--text-main);
}

.user-phone {
  font-size: 0.775rem;
}

.btn-cancel:hover {
  background-color: rgba(239, 68, 68, 0.15);
}

/* Floating Batch Actions Bar */
.batch-actions-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: var(--shadow-lg);
  z-index: 900;
  border: 1px solid var(--primary);
  background: var(--bg-glass);
}

.batch-count {
  font-size: 0.875rem;
  color: var(--text-main);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
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
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.75rem;
  border-radius: var(--radius-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
}

.modal-title {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
}

.btn-close-modal {
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-sm);
}

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
  background-color: rgba(0, 0, 0, 0.15);
  padding: 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.col-span-2 { grid-column: span 2; }

.status-change-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--primary-glow);
  padding: 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid hsl(var(--hsl-primary-500) / 0.3);
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
  padding: 0.5rem 0.75rem;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-md);
}

.product-thumb {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  background-color: rgba(0, 0, 0, 0.1);
}

.product-info { flex: 1; }
.product-name { font-size: 0.875rem; color: var(--text-main); }
.product-price { font-size: 0.8rem; }

.order-total-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  font-size: 1.05rem;
  font-weight: 700;
}

.flex { display: flex; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.items-center { align-items: center; }
.flex-wrap { flex-wrap: wrap; }
.gap-4 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }
.gap-1 { gap: 0.25rem; }
.text-accent { color: var(--accent); }
.text-primary { color: var(--primary); }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
</style>
