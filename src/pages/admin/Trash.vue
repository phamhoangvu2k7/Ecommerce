<script setup lang="ts">
import { ref, onMounted } from "vue";

const deletedProducts = ref<any[]>([]);
const deletedCategories = ref<any[]>([]);

const loading = ref(true);
const successMsg = ref("");
const currentTab = ref("products"); // 'products' or 'categories'

onMounted(async () => {
  await fetchTrash();
});

async function fetchTrash() {
  loading.value = true;
  try {
    const adminToken = localStorage.getItem("adminToken");
    const headers: any = {};
    if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

    const res = await fetch("/api/admin/trash", { headers });
    const data = await res.json();
    if (data.success) {
      deletedProducts.value = data.products;
      deletedCategories.value = data.categories;
    }
  } catch (err) {
    console.error("Error loading trash data:", err);
  } finally {
    loading.value = false;
  }
}

async function handleRestore(type: string, id: string) {
  let confirmMsg = "Bạn có chắc muốn khôi phục sản phẩm này?";
  if (type === "category") {
    confirmMsg = "Bạn có chắc muốn khôi phục danh mục này? Tất cả danh mục cha liên quan cũng sẽ tự động được khôi phục.";
  }

  if (!confirm(confirmMsg)) return;

  try {
    const adminToken = localStorage.getItem("adminToken");
    const headers: any = { "Content-Type": "application/json" };
    if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;

    const res = await fetch("/api/admin/trash/restore", {
      method: "POST",
      headers,
      body: JSON.stringify({ type, id })
    });
    const data = await res.json();
    if (data.success) {
      successMsg.value = "Khôi phục dữ liệu thành công!";
      await fetchTrash();
      setTimeout(() => (successMsg.value = ""), 4000);
    } else {
      alert(data.statusMessage || "Lỗi khôi phục dữ liệu.");
    }
  } catch (err) {
    alert("Lỗi kết nối máy chủ.");
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}
</script>

<template>
  <div class="admin-trash-page">
    <div class="page-header mb-8">
      <h1 class="h1-title">Thùng rác hệ thống</h1>
      <p class="text-muted">Quản lý và khôi phục dữ liệu đã bị xóa mềm.</p>
    </div>

    <!-- Success Feedback Alert -->
    <div v-if="successMsg" class="alert alert-success fade-in-item">
      {{ successMsg }}
    </div>

    <!-- Tabs switcher header -->
    <div class="trash-tabs mb-6">
      <button
        @click="currentTab = 'products'"
        :class="['tab-btn', currentTab === 'products' ? 'active-tab' : '']"
      >
        📦 Sản phẩm đã xóa ({{ deletedProducts.length }})
      </button>
      <button
        @click="currentTab = 'categories'"
        :class="['tab-btn', currentTab === 'categories' ? 'active-tab' : '']"
      >
        🗂️ Danh mục đã xóa ({{ deletedCategories.length }})
      </button>
    </div>

    <!-- Loading screen -->
    <div v-if="loading" class="text-center py-6 text-muted">
      Đang tải dữ liệu từ Thùng rác...
    </div>

    <!-- Products Tab -->
    <div v-else-if="currentTab === 'products'" class="tab-content fade-in-item">
      <div class="premium-card table-card overflow-x">
        <table class="premium-table">
          <thead>
            <tr>
              <th width="80">Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục gốc</th>
              <th>Giá lúc xóa</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="deletedProducts.length === 0">
              <td colspan="5" class="text-center py-6 text-muted">Không có sản phẩm nào trong thùng rác.</td>
            </tr>
            <tr v-for="product in deletedProducts" :key="product._id" class="table-row">
              <td>
                <img :src="product.thumbnail || 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'" :alt="product.title" class="table-thumbnail" />
              </td>
              <td class="font-semibold text-white">{{ product.title }}</td>
              <td class="text-muted">{{ product.product_category_id?.title || 'Không danh mục' }}</td>
              <td>{{ formatPrice(product.price) }}</td>
              <td>
                <button @click="handleRestore('product', product._id)" class="btn btn-primary btn-restore">
                  🔄 Khôi phục
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Categories Tab -->
    <div v-else-if="currentTab === 'categories'" class="tab-content fade-in-item">
      <div class="premium-card table-card overflow-x">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Mô tả</th>
              <th>Vị trí cũ</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="deletedCategories.length === 0">
              <td colspan="4" class="text-center py-6 text-muted">Không có danh mục nào trong thùng rác.</td>
            </tr>
            <tr v-for="cat in deletedCategories" :key="cat._id" class="table-row">
              <td class="font-semibold text-white">🗂️ {{ cat.title }}</td>
              <td class="text-muted">{{ cat.description || 'Không mô tả' }}</td>
              <td>{{ cat.position }}</td>
              <td>
                <button @click="handleRestore('category', cat._id)" class="btn btn-primary btn-restore">
                  🔄 Khôi phục
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-8 { margin-bottom: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }
.text-muted { color: var(--text-muted); font-size: 0.9rem; }
.text-center { text-align: center; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }

/* Tabs switcher styling */
.trash-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-family);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all var(--transition-speed);
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: white;
}

.active-tab {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Table duplicates */
.overflow-x {
  overflow-x: auto;
}
.premium-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.premium-table th {
  padding: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}
.premium-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.95rem;
}
.table-row:hover {
  background-color: rgba(255, 255, 255, 0.01);
}
.table-thumbnail {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.02);
}
.btn-restore {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  border-radius: 6px;
}
</style>
