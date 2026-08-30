<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { resolveImageUrl } from '~/composables/useImageUrl'

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

// Selection & Batch Action state
const selectedIds = ref<string[]>([])

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
const uploading = ref(false)

onMounted(async () => {
  await fetchCategories()
  await fetchProducts()
})

async function fetchCategories() {
  try {
    const res = await useAdminFetch('/api/admin/categories')
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
  selectedIds.value = []
  try {
    const params = new URLSearchParams()
    if (searchQuery.value)
      params.append('q', searchQuery.value)
    if (statusFilter.value)
      params.append('status', statusFilter.value)
    params.append('page', String(currentPage.value))
    params.append('limit', '10')

    const res = await useAdminFetch(`/api/admin/products?${params.toString()}`)
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

// Select All Toggle
const isAllSelected = computed(() => {
  if (products.value.length === 0)
    return false
  return products.value.every(p => selectedIds.value.includes(p.id))
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  }
  else {
    selectedIds.value = products.value.map(p => p.id)
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

// Batch Actions
async function handleBatchStatusChange(status: string) {
  if (selectedIds.value.length === 0)
    return
  try {
    const res = await useAdminFetch('/api/admin/products/change-multi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds.value, status }),
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = `Đã cập nhật trạng thái ${selectedIds.value.length} sản phẩm!`
      await fetchProducts()
      setTimeout(() => (successMsg.value = ''), 3000)
    }
  }
  catch {
    alert('Lỗi cập nhật hàng loạt.')
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0)
    return
  if (!confirm(`Bạn có chắc muốn đưa ${selectedIds.value.length} sản phẩm vào thùng rác?`))
    return
  try {
    const res = await useAdminFetch('/api/admin/products/delete-multi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds.value }),
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = `Đã chuyển ${selectedIds.value.length} sản phẩm vào Thùng rác!`
      await fetchProducts()
      setTimeout(() => (successMsg.value = ''), 3000)
    }
  }
  catch {
    alert('Lỗi xóa hàng loạt.')
  }
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
    const res = await useAdminFetch(`/api/admin/products/${productId}`)
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

function handleDuplicateProduct(product: any) {
  resetForm()
  isEditing.value = false
  formTitle.value = `${product.title} (Bản sao)`
  formCategory.value = product.product_category_id?.id || ''
  formDescription.value = product.description || ''
  formPrice.value = product.price
  formDiscount.value = product.discountPercentage
  formStock.value = product.stock
  formThumbnail.value = product.thumbnail || ''
  formStatus.value = 'active'
  showModal.value = true
}

async function handleSaveProduct() {
  if (!formTitle.value || formPrice.value < 0 || formStock.value < 0) {
    alert('Vui lòng điền đầy đủ thông tin hợp lệ.')
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
    let res
    if (isEditing.value && editingId.value) {
      res = await useAdminFetch(`/api/admin/products/${editingId.value}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    else {
      res = await useAdminFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    const data = await res.json()
    if (data.success) {
      successMsg.value = isEditing.value ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm mới thành công!'
      showModal.value = false
      resetForm()
      await fetchProducts()
      setTimeout(() => (successMsg.value = ''), 3000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi lưu sản phẩm.')
    }
  }
  catch {
    alert('Có lỗi xảy ra khi lưu sản phẩm.')
  }
}

async function handleDeleteProduct(productId: string) {
  if (!confirm('Bạn có chắc muốn đưa sản phẩm này vào thùng rác?'))
    return

  try {
    const res = await useAdminFetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Đã chuyển sản phẩm vào Thùng rác!'
      await fetchProducts()
      setTimeout(() => (successMsg.value = ''), 3000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi xóa sản phẩm.')
    }
  }
  catch {
    alert('Lỗi kết nối máy chủ.')
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0)
    return

  const file = target.files[0]
  const formData = new FormData()
  formData.append('file', file)

  uploading.value = true
  try {
    const res = await useAdminFetch('/api/admin/upload', {
      method: 'POST',
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
  catch {
    alert('Không thể kết nối tải ảnh.')
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
    <!-- Title Header -->
    <div class="page-header mb-6 flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 class="page-title">
          Quản Lý Sản Phẩm
        </h1>
        <p class="text-muted">
          Tổng hợp {{ totalProducts }} sản phẩm kinh doanh trên toàn hệ thống
        </p>
      </div>

      <button class="btn btn-primary" @click="openCreateModal">
        <SvgIcon name="plus" :size="16" />
        <span>Thêm sản phẩm mới</span>
      </button>
    </div>

    <!-- Alert Feedbacks -->
    <div v-if="successMsg" class="alert alert-success fade-in-item mb-4">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="alert alert-error mb-4">
      {{ errorMsg }}
    </div>

    <!-- Filters & Status Tabs -->
    <div class="premium-card filter-card mb-6">
      <div class="filter-controls-row flex justify-between items-center flex-wrap gap-4">
        <!-- Status Filter Tabs -->
        <div class="status-tabs flex gap-2">
          <button
            class="tab-btn"
            :class="{ 'tab-active': statusFilter === '' }"
            @click="statusFilter = ''; handleSearch()"
          >
            Tất cả
          </button>

          <button
            class="tab-btn"
            :class="{ 'tab-active': statusFilter === 'active' }"
            @click="statusFilter = 'active'; handleSearch()"
          >
            Hoạt động
          </button>

          <button
            class="tab-btn"
            :class="{ 'tab-active': statusFilter === 'inactive' }"
            @click="statusFilter = 'inactive'; handleSearch()"
          >
            Tạm dừng
          </button>
        </div>

        <!-- Search Bar -->
        <div class="search-box-wrapper flex gap-2">
          <div class="input-with-icon">
            <SvgIcon name="search" :size="16" color="var(--text-dim)" class="icon-input" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              class="premium-input search-input"
              @keyup.enter="handleSearch"
            >
          </div>

          <button class="btn btn-secondary" @click="handleSearch">
            <SvgIcon name="search" :size="16" />
          </button>
        </div>
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
            <th width="70">
              Ảnh
            </th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá bán</th>
            <th width="90">
              Giảm %
            </th>
            <th width="90">
              Kho
            </th>
            <th width="110">
              Trạng thái
            </th>
            <th width="130" class="text-center">
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading && products.length === 0">
            <td colspan="9" class="text-center py-8 text-muted">
              Đang tải dữ liệu sản phẩm...
            </td>
          </tr>

          <tr v-else-if="products.length === 0">
            <td colspan="9" class="text-center py-8 text-muted">
              Không tìm thấy sản phẩm nào khớp với điều kiện lọc.
            </td>
          </tr>

          <tr
            v-for="product in products"
            :key="product.id"
            class="table-row"
            :class="{ 'row-selected': selectedIds.includes(product.id) }"
          >
            <td class="text-center">
              <input
                type="checkbox"
                :checked="selectedIds.includes(product.id)"
                class="cursor-pointer"
                @change="toggleSelect(product.id)"
              >
            </td>

            <td>
              <div class="table-img-box">
                <img :src="resolveImageUrl(product.thumbnail)" :alt="product.title" class="table-thumbnail">
              </div>
            </td>

            <td>
              <div class="product-title-cell">
                <span class="product-title-text" :title="product.title">{{ product.title }}</span>
                <span class="product-pos-text">Vị trí: {{ product.position }}</span>
              </div>
            </td>

            <td class="text-muted">
              {{ product.product_category_id?.title || 'Chưa phân loại' }}
            </td>

            <td class="font-bold text-accent">
              {{ formatPrice(product.priceNew || Math.round(product.price * (1 - (product.discountPercentage || 0)/100))) }}
            </td>

            <td class="text-center font-bold text-danger">
              -{{ product.discountPercentage }}%
            </td>

            <td class="text-center font-bold">
              {{ product.stock }}
            </td>

            <td>
              <span class="badge" :class="[product.status === 'active' ? 'badge-active' : 'badge-inactive']">
                {{ product.status === 'active' ? 'Hoạt động' : 'Tạm dừng' }}
              </span>
            </td>

            <td class="text-center">
              <div class="table-actions flex justify-center gap-1">
                <button
                  class="btn btn-secondary btn-icon-sm"
                  title="Chỉnh sửa"
                  @click="openEditModal(product.id)"
                >
                  <SvgIcon name="edit" :size="14" />
                </button>

                <button
                  class="btn btn-secondary btn-icon-sm"
                  title="Bản sao (Duplicate)"
                  @click="handleDuplicateProduct(product)"
                >
                  <SvgIcon name="copy" :size="14" />
                </button>

                <button
                  class="btn btn-secondary btn-icon-sm btn-action-delete"
                  title="Chuyển Thùng rác"
                  @click="handleDeleteProduct(product.id)"
                >
                  <SvgIcon name="trash" :size="14" color="var(--danger)" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Floating Batch Actions Bar (Nổi khi tick chọn checkbox) -->
    <div v-if="selectedIds.length > 0" class="batch-actions-bar glass-panel fade-in-item">
      <span class="batch-count">Đã chọn <strong>{{ selectedIds.length }}</strong> sản phẩm</span>

      <div class="batch-buttons flex gap-2">
        <button class="btn btn-secondary btn-sm" @click="handleBatchStatusChange('active')">
          <SvgIcon name="check" :size="14" color="var(--success)" />
          <span>Kích hoạt</span>
        </button>

        <button class="btn btn-secondary btn-sm" @click="handleBatchStatusChange('inactive')">
          <SvgIcon name="x" :size="14" color="var(--warning)" />
          <span>Tạm dừng</span>
        </button>

        <button class="btn btn-danger btn-sm" @click="handleBatchDelete">
          <SvgIcon name="trash" :size="14" />
          <span>Xóa vào Thùng rác</span>
        </button>
      </div>
    </div>

    <!-- Pagination Footer -->
    <div v-if="totalPages > 1" class="pagination-container mt-6">
      <button :disabled="currentPage === 1" class="btn btn-secondary btn-pag" @click="changePage(currentPage - 1)">
        <SvgIcon name="chevron-left" :size="14" />
        <span>Trang trước</span>
      </button>

      <span class="pag-info">Trang {{ currentPage }} / {{ totalPages }}</span>

      <button :disabled="currentPage === totalPages" class="btn btn-secondary btn-pag" @click="changePage(currentPage + 1)">
        <span>Trang sau</span>
        <SvgIcon name="chevron-right" :size="14" />
      </button>
    </div>

    <!-- Create / Edit Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content premium-card glass-panel fade-in-item">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới' }}
          </h3>

          <button class="btn btn-secondary btn-close-modal" @click="showModal = false">
            <SvgIcon name="x" :size="16" />
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleSaveProduct">
          <div class="input-group">
            <label class="input-label">Tên sản phẩm *</label>
            <input v-model="formTitle" type="text" class="premium-input" placeholder="Tên sản phẩm..." required>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Danh mục sản phẩm</label>
              <select v-model="formCategory" class="premium-input select-input">
                <option value="">
                  Chọn danh mục
                </option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.title }}
                </option>
              </select>
            </div>

            <div class="input-group">
              <label class="input-label">Trạng thái kinh doanh</label>
              <select v-model="formStatus" class="premium-input select-input">
                <option value="active">
                  Hoạt động
                </option>
                <option value="inactive">
                  Tạm dừng
                </option>
              </select>
            </div>
          </div>

          <div class="form-row-3">
            <div class="input-group">
              <label class="input-label">Giá niêm yết (VNĐ) *</label>
              <input v-model="formPrice" type="number" min="0" class="premium-input" required>
            </div>

            <div class="input-group">
              <label class="input-label">Giảm giá (%)</label>
              <input v-model="formDiscount" type="number" min="0" max="100" class="premium-input">
            </div>

            <div class="input-group">
              <label class="input-label">Tồn kho *</label>
              <input v-model="formStock" type="number" min="0" class="premium-input" required>
            </div>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Ảnh sản phẩm (URL / Cloud R2 Upload)</label>
              <div class="upload-input-wrapper">
                <input v-model="formThumbnail" type="text" class="premium-input" placeholder="https://...">
                <label class="btn btn-secondary btn-upload">
                  <span>Tải ảnh</span>
                  <input type="file" accept="image/*" class="file-hidden" @change="handleFileUpload">
                </label>
              </div>
              <span v-if="uploading" class="text-uploading">Đang tải ảnh lên Cloudflare R2...</span>
            </div>

            <div class="input-group">
              <label class="input-label">Vị trí sắp xếp</label>
              <input v-model="formPosition" type="number" class="premium-input">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">Mô tả sản phẩm</label>
            <textarea v-model="formDescription" rows="4" class="premium-input text-area-input" placeholder="Mô tả chi tiết sản phẩm..." />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">
              Hủy
            </button>
            <button type="submit" class="btn btn-primary">
              Lưu dữ liệu
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-6 { margin-top: 1.5rem; }

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

.input-with-icon {
  position: relative;
  width: 260px;
}

.icon-input {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  padding-left: 2.25rem;
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

.table-img-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
}

.table-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.product-title-cell {
  display: flex;
  flex-direction: column;
}

.product-title-text {
  font-weight: 700;
  color: var(--text-main);
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-pos-text {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.btn-icon-sm {
  padding: 0.35rem;
  border-radius: var(--radius-sm);
}

.btn-action-delete:hover {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
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

/* Pagination */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
}

.btn-pag { padding: 0.5rem 1rem; font-size: 0.85rem; border-radius: var(--radius-md); }
.pag-info { font-size: 0.875rem; color: var(--text-muted); font-weight: 600; }

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
  max-width: 680px;
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

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr;
  gap: 0.85rem;
}

.text-area-input {
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.upload-input-wrapper {
  display: flex;
  gap: 0.4rem;
}

.btn-upload {
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  padding: 0.55rem 0.85rem;
}

.file-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.text-uploading {
  font-size: 0.775rem;
  color: var(--primary);
  margin-top: 0.25rem;
  display: block;
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
.text-danger { color: var(--danger); }
.font-bold { font-weight: 700; }
</style>
