<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const products = ref<any[]>([])
const categories = ref<any[]>([])
const totalProducts = ref(0)
const totalPages = ref(1)

const loading = ref(true)
const errorMsg = ref('')
const successMsg = ref('')

// Search & Filter parameters
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

// Modal states
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

// Form Fields
const formTitle = ref('')
const formCategory = ref('')
const formDescription = ref('')
const formPrice = ref(0)
const formDiscount = ref(0)
const formStock = ref(0)
const formThumbnail = ref('')
const formStatus = ref('active')
const formPosition = ref(0)

onMounted(async () => {
  await fetchCategories()
  await fetchProducts()
})

async function fetchCategories() {
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/categories', { headers })
    const data = await res.json()
    if (data.success) {
      categories.value = flattenTree(data.tree)
    }
  }
  catch (err) {
    console.error('Error loading categories:', err)
  }
}

function flattenTree(nodes: any[]): any[] {
  let list: any[] = []
  for (const node of nodes) {
    list.push(node)
    if (node.children && node.children.length > 0) {
      list = [...list, ...flattenTree(node.children)]
    }
  }
  return list
}

async function fetchProducts() {
  loading.value = true
  errorMsg.value = ''
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const params = new URLSearchParams()
    if (searchQuery.value)
      params.append('q', searchQuery.value)
    if (statusFilter.value)
      params.append('status', statusFilter.value)
    params.append('page', String(currentPage.value))
    params.append('limit', '10')

    const res = await fetch(`/api/admin/products?${params.toString()}`, { headers })
    const data = await res.json()
    if (data.success) {
      products.value = data.data.products
      totalProducts.value = data.data.total
      totalPages.value = data.data.pages
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi tải danh sách sản phẩm.'
    }
  }
  catch (err) {
    errorMsg.value = 'Lỗi kết nối máy chủ.'
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchProducts()
}

function resetForm() {
  formTitle.value = ''
  formCategory.value = ''
  formDescription.value = ''
  formPrice.value = 0
  formDiscount.value = 0
  formStock.value = 0
  formThumbnail.value = ''
  formStatus.value = 'active'
  formPosition.value = 0
  editingId.value = null
}

function openCreateModal() {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

async function openEditModal(productId: string) {
  loading.value = true
  isEditing.value = true
  editingId.value = productId

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch(`/api/admin/products/${productId}`, { headers })
    const data = await res.json()
    if (data.success) {
      const p = data.product
      formTitle.value = p.title
      formCategory.value = p.product_category_id?.id || ''
      formDescription.value = p.description || ''
      formPrice.value = p.price
      formDiscount.value = p.discountPercentage
      formStock.value = p.stock
      formThumbnail.value = p.thumbnail || ''
      formStatus.value = p.status
      formPosition.value = p.position
      showModal.value = true
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi tải thông tin sản phẩm.')
    }
  }
  catch (err) {
    alert('Lỗi kết nối máy chủ.')
  }
  finally {
    loading.value = false
  }
}

async function handleSaveProduct() {
  if (!formTitle.value || formPrice.value < 0 || formStock.value < 0) {
    alert('Vui lòng điền đầy đủ các thông tin hợp lệ.')
    return
  }

  const payload = {
    title: formTitle.value,
    product_category_id: formCategory.value || null,
    description: formDescription.value,
    price: Number(formPrice.value),
    discountPercentage: Number(formDiscount.value),
    stock: Number(formStock.value),
    thumbnail: formThumbnail.value,
    status: formStatus.value,
    position: Number(formPosition.value),
  }

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = { 'Content-Type': 'application/json' }
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    let res
    if (isEditing.value && editingId.value) {
      res = await fetch(`/api/admin/products/${editingId.value}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })
    }
    else {
      res = await fetch('/api/admin/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
    }

    const data = await res.json()
    if (data.success) {
      successMsg.value = isEditing.value ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm mới thành công!'
      showModal.value = false
      resetForm()
      await fetchProducts()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi lưu sản phẩm.')
    }
  }
  catch (err) {
    alert('Có lỗi xảy ra khi lưu sản phẩm.')
  }
}

async function handleDeleteProduct(productId: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Sản phẩm sẽ được đưa vào thùng rác.'))
    return

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers,
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Đã chuyển sản phẩm vào Thùng rác!'
      await fetchProducts()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi xóa sản phẩm.')
    }
  }
  catch (err) {
    alert('Lỗi kết nối máy chủ.')
  }
}

const uploading = ref(false)

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0)
    return

  const file = target.files[0]
  const formData = new FormData()
  formData.append('file', file)

  uploading.value = true
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers,
      body: formData,
    })
    const data = await res.json()
    if (data.success) {
      formThumbnail.value = data.url
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi tải ảnh lên Cloudflare R2.')
    }
  }
  catch (err) {
    alert('Không thể kết nối tải ảnh lên R2.')
  }
  finally {
    uploading.value = false
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value)
    return
  currentPage.value = page
  fetchProducts()
}
</script>

<template>
  <div class="admin-products-page">
    <div class="page-header mb-8">
      <div class="title-block">
        <h1 class="h1-title">
          Quản lý sản phẩm
        </h1>
        <p class="text-muted">
          Danh sách sản phẩm kinh doanh trên toàn hệ thống.
        </p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        ➕ Thêm sản phẩm mới
      </button>
    </div>

    <!-- Feedback messages -->
    <div v-if="successMsg" class="alert alert-success fade-in-item">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <!-- Filters Header -->
    <div class="premium-card filter-card mb-6">
      <div class="filters-row">
        <div class="filter-item search-item">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            class="premium-input"
            @keyup.enter="handleSearch"
          >
        </div>
        <div class="filter-item select-item">
          <select v-model="statusFilter" class="premium-input" @change="handleSearch">
            <option value="">
              Tất cả trạng thái
            </option>
            <option value="active">
              Hoạt động
            </option>
            <option value="inactive">
              Dừng hoạt động
            </option>
          </select>
        </div>
        <button class="btn btn-secondary" @click="handleSearch">
          🔍 Tìm kiếm
        </button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="premium-card table-card overflow-x">
      <table class="premium-table">
        <thead>
          <tr>
            <th width="80">
              Ảnh
            </th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá gốc</th>
            <th width="100">
              Khuyến mãi
            </th>
            <th width="100">
              Kho
            </th>
            <th>Trạng thái</th>
            <th width="150" class="text-center">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && products.length === 0">
            <td colspan="8" class="text-center py-6 text-muted">
              Đang tải danh sách sản phẩm...
            </td>
          </tr>
          <tr v-else-if="products.length === 0">
            <td colspan="8" class="text-center py-6 text-muted">
              Không tìm thấy sản phẩm nào.
            </td>
          </tr>
          <tr v-for="product in products" :key="product.id" class="table-row">
            <td>
              <img :src="product.thumbnail || 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'" :alt="product.title" class="table-thumbnail">
            </td>
            <td>
              <div class="product-title-cell">
                <span class="product-title-text">{{ product.title }}</span>
                <span class="product-position-text">Vị trí: {{ product.position }}</span>
              </div>
            </td>
            <td class="text-muted">
              {{ product.product_category_id?.title || 'Không danh mục' }}
            </td>
            <td class="font-semibold">
              {{ formatPrice(product.price) }}
            </td>
            <td class="text-center">
              <span class="discount-percent">-{{ product.discountPercentage }}%</span>
            </td>
            <td class="text-center">
              {{ product.stock }}
            </td>
            <td>
              <span class="badge" :class="[product.status === 'active' ? 'badge-active' : 'badge-inactive']">
                {{ product.status === 'active' ? 'Hoạt động' : 'Dừng' }}
              </span>
            </td>
            <td class="text-center">
              <div class="table-actions">
                <button class="btn btn-secondary btn-action" title="Sửa" @click="openEditModal(product.id)">
                  ✏️
                </button>
                <button class="btn btn-danger btn-action" title="Xóa" @click="handleDeleteProduct(product.id)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-container mt-6">
      <button :disabled="currentPage === 1" class="btn btn-secondary btn-pag" @click="changePage(currentPage - 1)">
        Trước
      </button>
      <span class="pag-info">Trang {{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" class="btn btn-secondary btn-pag" @click="changePage(currentPage + 1)">
        Sau
      </button>
    </div>

    <!-- Modal Form (Create/Edit) -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content premium-card glass-panel fade-in-item">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới' }}
          </h3>
          <button class="btn btn-secondary btn-close-modal" @click="showModal = false">
            ✖
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleSaveProduct">
          <div class="input-group">
            <label class="input-label">Tên sản phẩm *</label>
            <input v-model="formTitle" type="text" class="premium-input" placeholder="Tên sản phẩm" required>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Danh mục sản phẩm</label>
              <select v-model="formCategory" class="premium-input">
                <option value="">
                  Chọn danh mục
                </option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.title }}
                </option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Trạng thái hoạt động</label>
              <select v-model="formStatus" class="premium-input">
                <option value="active">
                  Hoạt động
                </option>
                <option value="inactive">
                  Dừng hoạt động
                </option>
              </select>
            </div>
          </div>

          <div class="form-row-3">
            <div class="input-group">
              <label class="input-label">Giá gốc (VND) *</label>
              <input v-model="formPrice" type="number" min="0" class="premium-input" required>
            </div>
            <div class="input-group">
              <label class="input-label">Khuyến mãi (%)</label>
              <input v-model="formDiscount" type="number" min="0" max="100" class="premium-input">
            </div>
            <div class="input-group">
              <label class="input-label">Số lượng kho *</label>
              <input v-model="formStock" type="number" min="0" class="premium-input" required>
            </div>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Ảnh sản phẩm (URL hoặc tải lên)</label>
              <div class="upload-input-wrapper">
                <input v-model="formThumbnail" type="text" class="premium-input" placeholder="URL hình ảnh">
                <label class="btn btn-secondary btn-upload">
                  📸 Tải ảnh
                  <input type="file" accept="image/*" class="file-hidden" @change="handleFileUpload">
                </label>
              </div>
              <span v-if="uploading" class="text-uploading">Đang tải ảnh lên Cloudflare R2...</span>
            </div>
            <div class="input-group">
              <label class="input-label">Vị trí sắp xếp (Thứ tự)</label>
              <input v-model="formPosition" type="number" class="premium-input">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">Mô tả sản phẩm</label>
            <textarea v-model="formDescription" rows="4" class="premium-input text-area-input" placeholder="Nhập mô tả sản phẩm" />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">
              Hủy
            </button>
            <button type="submit" class="btn btn-primary">
              Lưu lại
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-8 { margin-bottom: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-6 { margin-top: 1.5rem; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Filters Card */
.filter-card {
  padding: 1rem;
}
.filters-row {
  display: flex;
  gap: 1rem;
}
.search-item { flex: 1.5; }
.select-item { flex: 1; }

/* Table styling */
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
  width: 50px;
  height: 50px;
  object-fit: contain;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.02);
}
.product-title-cell {
  display: flex;
  flex-direction: column;
}
.product-title-text {
  font-weight: 600;
  color: #fff;
}
.product-position-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}
.discount-percent {
  color: var(--danger);
  font-weight: 700;
}
.table-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
.btn-action {
  padding: 0.4rem;
  border-radius: 6px;
}

/* Pagination */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}
.btn-pag { padding: 0.5rem 1rem; font-size: 0.85rem; }
.pag-info { font-size: 0.9rem; color: var(--text-muted); }

/* Modal Backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}
.btn-close-modal {
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
}
.modal-form {
  display: flex;
  flex-direction: column;
}
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-row-3 {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr;
  gap: 1rem;
}
.text-area-input {
  resize: vertical;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.upload-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.btn-upload {
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.file-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.text-uploading {
  font-size: 0.8rem;
  color: var(--primary);
  margin-top: 0.25rem;
  display: block;
}
</style>
