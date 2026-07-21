<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { resolveImageUrl } from '~/composables/useImageUrl'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const deletedProducts = ref<any[]>([])
const deletedCategories = ref<any[]>([])

const loading = ref(true)
const successMsg = ref('')
const currentTab = ref('products') // 'products' or 'categories'

onMounted(async () => {
  await fetchTrash()
})

async function fetchTrash() {
  loading.value = true
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/trash', { headers })
    const data = await res.json()
    if (data.success) {
      deletedProducts.value = data.products
      deletedCategories.value = data.categories
    }
  }
  catch (err) {
    console.error('Error loading trash data:', err)
  }
  finally {
    loading.value = false
  }
}

async function handleRestore(type: string, id: string) {
  let confirmMsg = 'Bạn có chắc muốn khôi phục sản phẩm này?'
  if (type === 'category') {
    confirmMsg = 'Bạn có chắc muốn khôi phục danh mục này? Tất cả danh mục cha liên quan cũng sẽ tự động được khôi phục.'
  }

  if (!confirm(confirmMsg))
    return

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = { 'Content-Type': 'application/json' }
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/trash/restore', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, id }),
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Khôi phục dữ liệu thành công!'
      await fetchTrash()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi khôi phục dữ liệu.')
    }
  }
  catch (err) {
    alert('Lỗi kết nối máy chủ.')
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>

<template>
  <div class="admin-trash-page">
    <div class="page-header mb-6">
      <h1 class="h1-title">
        Thùng rác hệ thống
      </h1>
      <p class="text-muted">
        Quản lý và khôi phục dữ liệu đã bị xóa mềm.
      </p>
    </div>

    <!-- Success Feedback Alert -->
    <div v-if="successMsg" class="alert alert-success fade-in-item">
      {{ successMsg }}
    </div>

    <!-- Tabs switcher header -->
    <div class="trash-tabs mb-6">
      <button
        class="tab-btn" :class="[currentTab === 'products' ? 'active-tab' : '']"
        @click="currentTab = 'products'"
      >
        📦 Sản phẩm đã xóa ({{ deletedProducts.length }})
      </button>
      <button
        class="tab-btn" :class="[currentTab === 'categories' ? 'active-tab' : '']"
        @click="currentTab = 'categories'"
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
              <th width="80">
                Ảnh
              </th>
              <th>Tên sản phẩm</th>
              <th>Danh mục gốc</th>
              <th>Giá lúc xóa</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="deletedProducts.length === 0">
              <td colspan="5" class="text-center py-6 text-muted">
                Không có sản phẩm nào trong thùng rác.
              </td>
            </tr>
            <tr v-for="product in deletedProducts" :key="product.id" class="table-row">
              <td>
                <div class="table-img-box">
                  <img :src="resolveImageUrl(product.thumbnail)" :alt="product.title" class="table-thumbnail">
                </div>
              </td>
              <td class="font-bold text-main">
                {{ product.title }}
              </td>
              <td class="text-muted">
                {{ product.product_category_id?.title || 'Không danh mục' }}
              </td>
              <td class="font-bold">{{ formatPrice(product.price) }}</td>
              <td>
                <button class="btn btn-primary btn-restore" @click="handleRestore('product', product.id)">
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
              <td colspan="4" class="text-center py-6 text-muted">
                Không có danh mục nào trong thùng rác.
              </td>
            </tr>
            <tr v-for="cat in deletedCategories" :key="cat.id" class="table-row">
              <td class="font-bold text-main">
                🗂️ {{ cat.title }}
              </td>
              <td class="text-muted">
                {{ cat.description || 'Không mô tả' }}
              </td>
              <td>{{ cat.position }}</td>
              <td>
                <button class="btn btn-primary btn-restore" @click="handleRestore('category', cat.id)">
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
.mb-6 { margin-bottom: 1.5rem; }
.text-muted { color: var(--text-muted); font-size: 0.9rem; }
.text-main { color: var(--text-main); }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }

/* Tabs switcher styling */
.trash-tabs {
  display: flex;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-family);
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--text-main);
}

.active-tab {
  color: var(--text-main);
  border-bottom-color: var(--primary);
}

/* Table duplicates */
.overflow-x {
  overflow-x: auto;
}
.table-card {
  border-radius: 14px;
  padding: 0;
}
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
.table-row:hover {
  background-color: rgba(255, 255, 255, 0.02);
}
.table-img-box {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
}
.table-thumbnail {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.btn-restore {
  padding: 0.35rem 0.75rem;
  font-size: 0.825rem;
  border-radius: 8px;
}
</style>
