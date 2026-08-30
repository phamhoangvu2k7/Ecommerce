<script setup lang="ts">
import { onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const stats = ref<any>(null)
const loading = ref(true)
const errorMsg = ref('')

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
</script>

<template>
  <div class="admin-dashboard-page">
    <div class="dashboard-header mb-6 flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 class="dashboard-title">
          Tổng Quan Hoạt Động
        </h1>
        <p class="text-muted">
          Báo cáo doanh thu và chỉ số kinh doanh thực tế từ cơ sở dữ liệu.
        </p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Đang tải số liệu thống kê từ hệ thống...
    </div>

    <div v-else-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <div v-else-if="stats" class="dashboard-body flex flex-col gap-6">
      <!-- 4 Real Stat Cards Grid -->
      <div class="dashboard-grid">
        <!-- Revenue Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-revenue">
              <SvgIcon name="dollar" :size="22" color="#ffffff" />
            </div>
          </div>
          <div class="stat-label">
            Tổng Doanh Thu
          </div>
          <div class="stat-value text-accent">
            {{ formatPrice(stats.orders.revenue) }}
          </div>
          <div class="stat-sub">
            Tính trên tất cả các đơn hàng hợp lệ
          </div>
        </div>

        <!-- Orders Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-orders">
              <SvgIcon name="cart" :size="22" color="#ffffff" />
            </div>
          </div>
          <div class="stat-label">
            Tổng Đơn Hàng
          </div>
          <div class="stat-value">
            {{ stats.orders.total }} <span class="unit">đơn</span>
          </div>
          <div class="stat-sub">
            Tổng số đơn hàng đã ghi nhận
          </div>
        </div>

        <!-- Active Products Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-products">
              <SvgIcon name="package" :size="22" color="#ffffff" />
            </div>
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

        <!-- Users Card -->
        <div class="premium-card stat-card fade-in-item">
          <div class="stat-top">
            <div class="stat-icon icon-users">
              <SvgIcon name="users" :size="22" color="#ffffff" />
            </div>
          </div>
          <div class="stat-label">
            Khách Hàng Đăng Ký
          </div>
          <div class="stat-value">
            {{ stats.usersCount }} <span class="unit">tài khoản</span>
          </div>
          <div class="stat-sub">
            Tài khoản mua hàng trên hệ thống
          </div>
        </div>
      </div>

      <!-- Real System Summary Card -->
      <div class="premium-card quick-info-card fade-in-item">
        <h3 class="card-section-title mb-4">
          Thông Tin Kết Nối Trạng Thái Server
        </h3>

        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Tài khoản Khách hàng:</span>
            <span class="info-val font-bold">{{ stats.usersCount }} tài khoản</span>
          </div>

          <div class="info-item">
            <span class="info-label">Tổng Danh mục sản phẩm:</span>
            <span class="info-val font-bold">{{ stats.categoriesCount }} danh mục</span>
          </div>

          <div class="info-item">
            <span class="info-label">Sản phẩm tạm dừng:</span>
            <span class="info-val font-bold text-danger">{{ stats.products.inactive }} sản phẩm</span>
          </div>

          <div class="info-item">
            <span class="info-label">Tổng Đơn hàng đã ghi nhận:</span>
            <span class="info-val font-bold text-accent">{{ stats.orders.total }} đơn hàng</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
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

/* Info Widget */
.quick-info-card {
  padding: 1.5rem;
}

.card-section-title {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  background-color: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
}

.info-label {
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 600;
}

.info-val {
  font-size: 1.05rem;
  color: var(--text-main);
}

.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.gap-4 { gap: 1rem; }
.text-accent { color: var(--accent); }
.text-danger { color: var(--danger); }
.font-bold { font-weight: 700; }
</style>
