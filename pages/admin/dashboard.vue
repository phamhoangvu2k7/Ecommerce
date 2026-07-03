<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["admin"]
});

const stats = ref<any>(null);
const loading = ref(true);
const errorMsg = ref("");

onMounted(async () => {
  try {
    const adminToken = localStorage.getItem("adminToken");
    const headers: any = {};
    if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

    const res = await fetch("/api/admin/dashboard", { headers });
    const data = await res.json();
    if (data.success) {
      stats.value = data.data;
    } else {
      errorMsg.value = data.message || data.statusMessage || "Lỗi tải số liệu thống kê.";
    }
  } catch (err) {
    errorMsg.value = "Lỗi kết nối máy chủ.";
  } finally {
    loading.value = false;
  }
});

function formatPrice(value: number) {
  if (!value) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}
</script>

<template>
  <div class="admin-dashboard-page">
    <div class="dashboard-header mb-8">
      <h1 class="h1-title">Tổng quan số liệu</h1>
      <p class="text-muted">Báo cáo hoạt động kinh doanh tổng hợp theo thời gian thực.</p>
    </div>

    <div v-if="loading" class="loading-state">
      Đang tải số liệu thống kê...
    </div>

    <div v-else-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <div v-else-if="stats" class="dashboard-grid">
      <!-- Total Revenue -->
      <div class="premium-card stat-card card-revenue fade-in-item">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-label">Tổng doanh thu</div>
          <div class="stat-value text-glow-indigo">{{ formatPrice(stats.orders.revenue) }}</div>
        </div>
      </div>

      <!-- Orders count -->
      <div class="premium-card stat-card card-orders fade-in-item">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-label">Tổng số đơn hàng</div>
          <div class="stat-value">{{ stats.orders.total }}</div>
        </div>
      </div>

      <!-- Total products count -->
      <div class="premium-card stat-card card-products fade-in-item">
        <div class="stat-icon">🛍️</div>
        <div class="stat-content">
          <div class="stat-label">Sản phẩm (Đang bán)</div>
          <div class="stat-value">
            {{ stats.products.active }}
            <span class="sub-value">/ {{ stats.products.total }}</span>
          </div>
        </div>
      </div>

      <!-- Categories count -->
      <div class="premium-card stat-card card-categories fade-in-item">
        <div class="stat-icon">🗂️</div>
        <div class="stat-content">
          <div class="stat-label">Danh mục sản phẩm</div>
          <div class="stat-value">{{ stats.categoriesCount }}</div>
        </div>
      </div>

      <!-- Users count -->
      <div class="premium-card stat-card card-users fade-in-item">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-label">Khách đăng ký</div>
          <div class="stat-value">{{ stats.usersCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-8 {
  margin-bottom: 2rem;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  color: var(--text-muted);
  padding: 4rem 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

@media (min-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem 1.5rem;
}

.stat-icon {
  width: 56px;
  height: 56px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.text-glow-indigo {
  color: #818cf8;
}

.sub-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-muted);
}
</style>
