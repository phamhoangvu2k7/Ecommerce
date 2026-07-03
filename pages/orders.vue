<script setup lang="ts">
import OrderItem from "~/components/OrderItem.vue";
import SkeletonOrder from "~/components/SkeletonOrder.vue";

definePageMeta({
  middleware: ["auth"]
});

const orders = ref<any[]>([]);
const loading = ref(true);
const errorMsg = ref("");

onMounted(async () => {
  await fetchOrders();
});

async function fetchOrders() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const token = localStorage.getItem("token");
    const headers: any = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/client/user/orders", { headers });
    const data = await res.json();
    if (data.success) {
      orders.value = data.orders;
    } else {
      errorMsg.value = data.message || data.statusMessage || "Lỗi tải lịch sử đơn hàng.";
    }
  } catch (err) {
    errorMsg.value = "Lỗi kết nối máy chủ.";
  } finally {
    loading.value = false;
  }
}

async function handleCancelOrder(orderId: string) {
  if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này? Số lượng tồn kho sản phẩm sẽ được cộng trả lại cửa hàng.")) return;

  try {
    const token = localStorage.getItem("token");
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/client/user/orders/${orderId}/cancel`, {
      method: "POST",
      headers
    });
    const data = await res.json();
    if (data.success) {
      alert("Hủy đơn hàng thành công!");
      await fetchOrders();
    } else {
      alert(data.message || data.statusMessage || "Không thể hủy đơn hàng.");
    }
  } catch (err) {
    alert("Có lỗi xảy ra khi gửi yêu cầu hủy đơn.");
  }
}

</script>

<template>
  <div class="orders-page container">
    <h1 class="h1-title mb-8">Lịch sử đơn hàng</h1>

    <div v-if="loading" class="orders-list">
      <SkeletonOrder v-for="i in 2" :key="i" />
    </div>

    <div v-else-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <div v-else-if="orders.length === 0" class="empty-orders glass-panel fade-in-item">
      <div class="empty-icon">📦</div>
      <p class="empty-text">Bạn chưa thực hiện bất kỳ đơn hàng nào.</p>
      <RouterLink to="/products" class="btn btn-primary">Mua sắm ngay</RouterLink>
    </div>

    <div v-else class="orders-list">
      <OrderItem v-for="order in orders" :key="order._id" :order="order" @cancel="handleCancelOrder" />
    </div>
  </div>
</template>

<style scoped>
.mb-8 {
  margin-bottom: 2rem;
}

.loading-state, .empty-orders {
  text-align: center;
  color: var(--text-muted);
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

</style>
