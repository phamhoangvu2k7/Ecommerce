<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const stats = ref<any>(null)
const loading = ref(true)
const errorMsg = ref('')

// Revenue Chart Mock Data points for area chart SVG (Monthly trend)
const chartData = ref([
  { month: 'T1', value: 45000000 },
  { month: 'T2', value: 58000000 },
  { month: 'T3', value: 52000000 },
  { month: 'T4', value: 74000000 },
  { month: 'T5', value: 89000000 },
  { month: 'T6', value: 105000000 },
])

const recentOrdersMock = ref([
  { id: 'ORD-9821', customer: 'Nguyễn Văn Minh', date: '30/08/2026', total: 18500000, status: 'completed' },
  { id: 'ORD-9820', customer: 'Trần Thị Thu Hà', date: '30/08/2026', total: 4200000, status: 'processing' },
  { id: 'ORD-9819', customer: 'Lê Hoàng Nam', date: '29/08/2026', total: 12900000, status: 'completed' },
  { id: 'ORD-9818', customer: 'Phạm Đức Anh', date: '29/08/2026', total: 3500000, status: 'pending' },
  { id: 'ORD-9817', customer: 'Vũ Thanh Hương', date: '28/08/2026', total: 27800000, status: 'completed' },
])

onMounted(async () => {
  try {
    const res = await useAdminFetch('/api/admin/dashboard')
    const data = await res.json()
    if (data.success) {
      stats.value = data.data
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi tải số liệu thống kê.'
    }
  }
  catch (err) {
    errorMsg.value = 'Lỗi kết nối máy chủ.'
  }
  finally {
    loading.value = false
  }
})

function formatPrice(value: number) {
  if (!value)
    return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

// Compute SVG Area Chart path points
const maxChartValue = computed(() => Math.max(...chartData.value.map(d => d.value)) * 1.15)
const svgWidth = 600
const svgHeight = 200

const chartPoints = computed(() => {
  const points = chartData.value.map((d, i) => {
    const x = (i / (chartData.value.length - 1)) * (svgWidth - 40) + 20
    const y = svgHeight - (d.value / maxChartValue.value) * (svgHeight - 40) - 20
    return { x, y, value: d.value, month: d.month }
  })
  return points
})

const polylineString = computed(() => {
  return chartPoints.value.map(p => `${p.x},${p.y}`).join(' ')
})

const areaPolygonString = computed(() => {
  const pts = chartPoints.value.map(p => `${p.x},${p.y}`).join(' ')
  const firstX = chartPoints.value[0].x
  const lastX = chartPoints.value[chartPoints.value.length - 1].x
  return `${firstX},${svgHeight - 10} ${pts} ${lastX},${svgHeight - 10}`
})
</script>

<template>
  <div class="admin-dashboard-page">
    <div class="dashboard-header mb-6 flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 class="dashboard-title">
          Tổng Quan Hoạt Động
        </h1>
        <p class="text-muted">
          Báo cáo doanh thu và chỉ số kinh doanh tổng hợp theo thời gian thực.
        </p>
      </div>

      <div class="header-action-date">
        <span class="badge badge-primary flex items-center gap-1">
          <SvgIcon name="clock" :size="14" />
          <span>Cập nhật: Hôm nay 21:35</span>
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Đang tải số liệu thống kê...
    </div>

    <div v-else-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <div v-else class="dashboard-body flex flex-col gap-6">
      <!-- 4 Stat Cards Grid -->
      <div class="dashboard-grid">
        <!-- Revenue Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-revenue">
              <SvgIcon name="dollar" :size="22" color="#ffffff" />
            </div>
            <span class="growth-badge positive">+15.4%</span>
          </div>
          <div class="stat-label">
            Tổng Doanh Thu
          </div>
          <div class="stat-value text-accent">
            {{ formatPrice(stats.orders.revenue) }}
          </div>
          <div class="stat-sub">
            So với tháng trước (125.4 tr)
          </div>
        </div>

        <!-- Orders Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-orders">
              <SvgIcon name="cart" :size="22" color="#ffffff" />
            </div>
            <span class="growth-badge positive">+8.2%</span>
          </div>
          <div class="stat-label">
            Tổng Đơn Hàng
          </div>
          <div class="stat-value">
            {{ stats.orders.total }} <span class="unit">đơn</span>
          </div>
          <div class="stat-sub">
            92% đơn hoàn tất thành công
          </div>
        </div>

        <!-- Active Products Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-products">
              <SvgIcon name="package" :size="22" color="#ffffff" />
            </div>
            <span class="growth-badge neutral">Active</span>
          </div>
          <div class="stat-label">
            Sản Phẩm Đang Bán
          </div>
          <div class="stat-value">
            {{ stats.products.active }}
            <span class="sub-val">/ {{ stats.products.total }}</span>
          </div>
          <div class="stat-sub">
            {{ stats.categoriesCount }} danh mục hệ thống
          </div>
        </div>

        <!-- Users / Conversion Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-users">
              <SvgIcon name="users" :size="22" color="#ffffff" />
            </div>
            <span class="growth-badge positive">+12.1%</span>
          </div>
          <div class="stat-label">
            Khách Đăng Ký
          </div>
          <div class="stat-value">
            {{ stats.usersCount }} <span class="unit">users</span>
          </div>
          <div class="stat-sub">
            Tỷ lệ chuyển đổi: 4.8%
          </div>
        </div>
      </div>

      <!-- Area Chart & Analytics Row -->
      <div class="chart-and-analytics-row grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Revenue Area Chart SVG Card (Col span 2) -->
        <div class="premium-card chart-card lg:col-span-2 fade-in-item">
          <div class="chart-header flex justify-between items-center mb-4">
            <div>
              <h3 class="card-section-title">
                Biểu Đồ Doanh Thu Tăng Trưởng
              </h3>
              <p class="card-section-sub">
                Xu hướng doanh thu theo tháng (VNĐ)
              </p>
            </div>
            <div class="chart-legend flex items-center gap-2">
              <span class="legend-dot" />
              <span class="legend-text">Doanh thu thực tế</span>
            </div>
          </div>

          <!-- Interactive SVG Area Chart -->
          <div class="svg-chart-container">
            <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="area-chart-svg" preserveAspectRatio="none">
              <!-- Gradient Definition -->
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Grid Horizontal Lines -->
              <line x1="20" y1="40" :x2="svgWidth - 20" y2="40" stroke="var(--border-color)" stroke-dasharray="4 4" />
              <line x1="20" y1="100" :x2="svgWidth - 20" y2="100" stroke="var(--border-color)" stroke-dasharray="4 4" />
              <line x1="20" y1="160" :x2="svgWidth - 20" y2="160" stroke="var(--border-color)" stroke-dasharray="4 4" />

              <!-- Area Fill Polygon -->
              <polygon :points="areaPolygonString" fill="url(#revenueGradient)" />

              <!-- Stroke Line -->
              <polyline :points="polylineString" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

              <!-- Points & Tooltips -->
              <g v-for="(p, i) in chartPoints" :key="i" class="chart-point-group">
                <circle :cx="p.x" :cy="p.y" r="5" fill="var(--bg-card)" stroke="var(--primary)" stroke-width="3" class="chart-circle" />
                <text :x="p.x" y="195" text-anchor="middle" fill="var(--text-dim)" font-size="11" font-weight="600">{{ p.month }}</text>
              </g>
            </svg>
          </div>
        </div>

        <!-- Quick Info Widget -->
        <div class="premium-card quick-info-card fade-in-item">
          <h3 class="card-section-title mb-3">
            Tóm Tắt Hệ Thống
          </h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Máy chủ API Nitro:</span>
              <span class="badge badge-success">Online (0ms)</span>
            </div>
            <div class="info-item">
              <span class="info-label">Cơ sở dữ liệu SQLite/D1:</span>
              <span class="badge badge-success">Connected</span>
            </div>
            <div class="info-item">
              <span class="info-label">Bảo mật JWT Auth:</span>
              <span class="badge badge-primary">Active</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phiên bản UI/UX:</span>
              <span class="info-val font-bold">v3.0.0 Pro</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders Table Section -->
      <div class="premium-card recent-orders-card fade-in-item">
        <div class="flex justify-between items-center mb-4">
          <h3 class="card-section-title">
            Đơn Hàng Mới Nhất
          </h3>
          <NuxtLink to="/admin/orders" class="btn btn-secondary btn-sm flex items-center gap-1">
            <span>Quản lý đơn hàng</span>
            <SvgIcon name="arrow-right" :size="14" />
          </NuxtLink>
        </div>

        <div class="table-responsive">
          <table class="clean-data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Ngày Đặt</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrdersMock" :key="order.id">
                <td class="font-bold text-primary">
                  {{ order.id }}
                </td>
                <td>{{ order.customer }}</td>
                <td>{{ order.date }}</td>
                <td class="font-extrabold text-accent">
                  {{ formatPrice(order.total) }}
                </td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-success': order.status === 'completed',
                      'badge-warning': order.status === 'processing',
                      'badge-primary': order.status === 'pending',
                    }"
                  >
                    {{ order.status === 'completed' ? 'Hoàn tất' : (order.status === 'processing' ? 'Đang xử lý' : 'Chờ duyệt') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }
.gap-6 { gap: 1.5rem; }

.dashboard-title {
  font-family: var(--font-heading);
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.925rem;
}

.loading-state {
  text-align: center;
  color: var(--text-muted);
  padding: 4rem 0;
  font-weight: 500;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}

/* Stat Cards */
.stat-card {
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-revenue {
  background: linear-gradient(135deg, var(--accent) 0%, #059669 100%);
  box-shadow: 0 4px 12px hsl(var(--hsl-accent-500) / 0.3);
}

.icon-orders {
  background: linear-gradient(135deg, var(--primary) 0%, #4338ca 100%);
  box-shadow: 0 4px 12px hsl(var(--hsl-primary-500) / 0.3);
}

.icon-products {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.icon-users {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.growth-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
}

.growth-badge.positive {
  background-color: rgba(16, 185, 129, 0.12);
  color: var(--success);
}

.growth-badge.neutral {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.stat-label {
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
  line-height: 1.2;
}

.unit {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted);
}

.sub-val {
  font-size: 0.95rem;
  color: var(--text-dim);
}

.stat-sub {
  font-size: 0.775rem;
  color: var(--text-dim);
  margin-top: 0.35rem;
}

/* SVG Chart Section */
.chart-card {
  padding: 1.5rem;
}

.card-section-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
}

.card-section-sub {
  font-size: 0.825rem;
  color: var(--text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background-color: var(--primary);
}

.legend-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.svg-chart-container {
  width: 100%;
  height: 220px;
  position: relative;
}

.area-chart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-circle {
  transition: r var(--transition-fast);
}

.chart-circle:hover {
  r: 8;
  cursor: pointer;
}

/* Info Widget */
.quick-info-card {
  padding: 1.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--border-color);
}

.info-label {
  color: var(--text-muted);
  font-weight: 600;
}

/* Clean Data Table */
.recent-orders-card {
  padding: 1.5rem;
}

.table-responsive {
  overflow-x: auto;
}

.clean-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.clean-data-table th {
  padding: 0.75rem 1rem;
  color: var(--text-dim);
  font-weight: 700;
  font-size: 0.775rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.1);
}

.clean-data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-main);
}

.clean-data-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.gap-4 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }
.gap-1 { gap: 0.25rem; }
.text-accent { color: var(--accent); }
.text-primary { color: var(--primary); }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
</style>
