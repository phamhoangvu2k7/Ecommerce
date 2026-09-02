<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ProductCard from '~/components/ProductCard.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'

const route = useRoute()
const router = useRouter()

const products = ref<any[]>([])
const categories = ref<any[]>([])
const totalProducts = ref(0)
const totalPages = ref(1)

const loading = ref(true)

// Filter states
const searchQuery = ref((route.query.q as string) || '')
const selectedCategory = ref((route.query.category as string) || '')
const priceMin = ref((route.query.price_min as string) || '')
const priceMax = ref((route.query.price_max as string) || '')
const sortOrder = ref((route.query.sort as string) || 'position_desc')
const currentPage = ref(parseInt(route.query.page as string) || 1)
const showMobileFilters = ref(false)

onMounted(async () => {
  await fetchCategories()
  await fetchProducts()
})

async function fetchCategories() {
  try {
    const res = await fetch('/api/client/categories')
    const data = await res.json()
    if (data.success) {
      categories.value = flattenTree(data.tree)
    }
  }
  catch (err) {
    console.error('Error fetching categories:', err)
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
  try {
    const params = new URLSearchParams()
    if (searchQuery.value)
      params.append('q', searchQuery.value)
    if (selectedCategory.value)
      params.append('category_slug', selectedCategory.value)
    if (priceMin.value)
      params.append('price_min', priceMin.value)
    if (priceMax.value)
      params.append('price_max', priceMax.value)
    if (sortOrder.value)
      params.append('sort', sortOrder.value)
    params.append('page', String(currentPage.value))
    params.append('limit', '12')

    const res = await fetch(`/api/client/products?${params.toString()}`)
    const data = await res.json()
    if (data.success) {
      products.value = data.data.products
      totalProducts.value = data.data.total
      totalPages.value = data.data.pages
    }
  }
  catch (err) {
    console.error('Error fetching products:', err)
  }
  finally {
    loading.value = false
  }
}

watch([selectedCategory, sortOrder, currentPage], () => {
  updateQueryParams()
  fetchProducts()
})

function handleSearch() {
  currentPage.value = 1
  updateQueryParams()
  fetchProducts()
}

function handlePriceFilter() {
  currentPage.value = 1
  updateQueryParams()
  fetchProducts()
}

function applyPricePreset(min: string, max: string) {
  priceMin.value = min
  priceMax.value = max
  handlePriceFilter()
}

function clearAllFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
  priceMin.value = ''
  priceMax.value = ''
  sortOrder.value = 'position_desc'
  currentPage.value = 1
  updateQueryParams()
  fetchProducts()
}

function updateQueryParams() {
  const query: any = {}
  if (searchQuery.value)
    query.q = searchQuery.value
  if (selectedCategory.value)
    query.category = selectedCategory.value
  if (priceMin.value)
    query.price_min = priceMin.value
  if (priceMax.value)
    query.price_max = priceMax.value
  if (sortOrder.value)
    query.sort = sortOrder.value
  query.page = String(currentPage.value)

  router.push({ query })
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value)
    return
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const activeFiltersCount = computed(() => {
  let count = 0
  if (selectedCategory.value)
    count++
  if (priceMin.value || priceMax.value)
    count++
  if (searchQuery.value)
    count++
  return count
})
</script>

<template>
  <div class="product-list-page container">
    <!-- Breadcrumb & Header -->
    <div class="catalog-header mb-6">
      <h1 class="catalog-title">
        Danh Mục Sản Phẩm
      </h1>
      <p class="catalog-sub">
        Hiển thị {{ totalProducts }} sản phẩm chính hãng sẵn sàng giao ngay
      </p>
    </div>

    <div class="list-layout">
      <!-- Sidebar Filters -->
      <aside class="sidebar-filters glass-panel" :class="{ 'mobile-show': showMobileFilters }">
        <div class="filter-header-row">
          <div class="flex items-center gap-2">
            <SvgIcon name="filter" :size="18" color="var(--primary)" />
            <h3 class="filter-header-title">
              Bộ Lọc Thông Minh
            </h3>
          </div>
          <button v-if="activeFiltersCount > 0" class="btn-clear-link" @click="clearAllFilters">
            Xóa tất cả
          </button>
        </div>

        <!-- Categories Filter -->
        <div class="filter-group">
          <label class="input-label">Danh mục sản phẩm</label>
          <select v-model="selectedCategory" class="premium-input select-input">
            <option value="">
              Tất cả danh mục
            </option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.slug">
              {{ cat.title }}
            </option>
          </select>
        </div>

        <!-- Price Range Filter -->
        <div class="filter-group">
          <label class="input-label">Khoảng giá (VNĐ)</label>

          <!-- Price Presets Chips -->
          <div class="preset-chips">
            <button class="preset-chip" @click="applyPricePreset('', '5000000')">
              &lt; 5tr
            </button>
            <button class="preset-chip" @click="applyPricePreset('5000000', '15000000')">
              5tr - 15tr
            </button>
            <button class="preset-chip" @click="applyPricePreset('15000000', '')">
              &gt; 15tr
            </button>
          </div>

          <div class="price-range-inputs">
            <input v-model="priceMin" type="number" placeholder="Từ" class="premium-input price-input">
            <span class="price-sep">&ndash;</span>
            <input v-model="priceMax" type="number" placeholder="Đến" class="premium-input price-input">
          </div>
          <button class="btn btn-secondary btn-apply-price w-full" @click="handlePriceFilter">
            Áp dụng khoảng giá
          </button>
        </div>

        <!-- Sorting -->
        <div class="filter-group">
          <label class="input-label">Sắp xếp ưu tiên</label>
          <select v-model="sortOrder" class="premium-input select-input">
            <option value="position_desc">
              Nổi bật nhất
            </option>
            <option value="price_asc">
              Giá: Thấp đến Cao
            </option>
            <option value="price_desc">
              Giá: Cao đến Thấp
            </option>
            <option value="title_asc">
              Tên A-Z
            </option>
            <option value="title_desc">
              Tên Z-A
            </option>
          </select>
        </div>
      </aside>

      <!-- Main Products Grid Container -->
      <div class="products-main">
        <!-- Mobile Filter Toggle Bar -->
        <button
          class="btn btn-secondary btn-filter-toggle-mobile w-full mb-4"
          @click="showMobileFilters = !showMobileFilters"
        >
          <SvgIcon :name="showMobileFilters ? 'x' : 'filter'" :size="18" />
          <span>{{ showMobileFilters ? 'Đóng bộ lọc' : 'Lọc & Sắp xếp sản phẩm' }}</span>
        </button>

        <!-- Search Bar Header -->
        <div class="search-bar-container">
          <div class="search-input-wrapper">
            <SvgIcon name="search" :size="18" color="var(--text-dim)" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu..."
              class="premium-input search-input"
              @keyup.enter="handleSearch"
            >
          </div>
          <button class="btn btn-primary btn-search" @click="handleSearch">
            <span>Tìm kiếm</span>
          </button>
        </div>

        <!-- Active Filter Badges Bar -->
        <div v-if="activeFiltersCount > 0" class="active-filters-bar mb-4">
          <span class="active-label">Đang lọc:</span>

          <span v-if="selectedCategory" class="filter-tag">
            Category: {{ selectedCategory }}
            <button class="tag-close" @click="selectedCategory = ''; fetchProducts()">&times;</button>
          </span>

          <span v-if="priceMin || priceMax" class="filter-tag">
            Giá: {{ priceMin || 0 }}₫ &ndash; {{ priceMax || 'Max' }}₫
            <button class="tag-close" @click="priceMin = ''; priceMax = ''; fetchProducts()">&times;</button>
          </span>

          <span v-if="searchQuery" class="filter-tag">
            Từ khóa: "{{ searchQuery }}"
            <button class="tag-close" @click="searchQuery = ''; fetchProducts()">&times;</button>
          </span>

          <button class="btn-clear-all-tags" @click="clearAllFilters">
            Xóa hết
          </button>
        </div>

        <!-- Products Grid -->
        <div v-if="loading" class="grid-products">
          <SkeletonCard v-for="i in 8" :key="i" />
        </div>

        <div v-else-if="products.length === 0" class="empty-state">
          <div class="empty-icon-box mb-3">
            <SvgIcon name="search" :size="36" color="var(--text-dim)" />
          </div>
          <h3 class="empty-title">
            Không tìm thấy sản phẩm nào
          </h3>
          <p class="empty-text">
            Thử thay đổi từ khóa hoặc bộ lọc khoảng giá của bạn.
          </p>
          <button class="btn btn-secondary mt-4" @click="clearAllFilters">
            Đặt lại bộ lọc
          </button>
        </div>

        <div v-else>
          <div class="grid-products">
            <ProductCard v-for="product in products" :key="product.id" :product="product" />
          </div>

          <!-- Pagination Footer -->
          <div v-if="totalPages > 1" class="pagination-container">
            <button
              :disabled="currentPage === 1"
              class="btn btn-secondary btn-pag"
              @click="changePage(currentPage - 1)"
            >
              <SvgIcon name="chevron-left" :size="16" />
              <span>Trang trước</span>
            </button>

            <div class="pag-pages">
              <button
                v-for="p in totalPages"
                :key="p"
                class="pag-num"
                :class="{ 'pag-num-active': p === currentPage }"
                @click="changePage(p)"
              >
                {{ p }}
              </button>
            </div>

            <button
              :disabled="currentPage === totalPages"
              class="btn btn-secondary btn-pag"
              @click="changePage(currentPage + 1)"
            >
              <span>Trang sau</span>
              <SvgIcon name="chevron-right" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mt-4 { margin-top: 1rem; }

.catalog-title {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.catalog-sub {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.list-layout {
  display: flex;
  gap: 1.75rem;
}

/* Sidebar */
.sidebar-filters {
  width: 280px;
  padding: 1.5rem;
  align-self: flex-start;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
}

.filter-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.85rem;
  margin-bottom: 1.25rem;
}

.filter-header-title {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
}

.btn-clear-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.filter-group {
  margin-bottom: 1.35rem;
}

.select-input {
  cursor: pointer;
}

.preset-chips {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.preset-chip {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-chip:hover {
  background-color: var(--primary-glow);
  border-color: var(--primary);
  color: var(--primary);
}

.price-range-inputs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.65rem;
}

.price-input {
  flex: 1;
  text-align: center;
  padding: 0.55rem 0.5rem;
  font-size: 0.85rem;
}

.price-sep {
  color: var(--text-dim);
  font-weight: 700;
}

.btn-apply-price {
  font-size: 0.825rem;
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-md);
}

/* Products Main */
.products-main {
  flex: 1;
  min-width: 0;
}

.search-bar-container {
  display: flex;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  padding-left: 2.35rem;
}

.btn-search {
  padding: 0.65rem 1.35rem;
  flex-shrink: 0;
}

/* Active Filters Bar */
.active-filters-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  background-color: var(--bg-card);
  padding: 0.65rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.active-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-dim);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: var(--primary-glow);
  color: var(--primary);
  border: 1px solid hsl(var(--hsl-primary-500) / 0.3);
  font-size: 0.775rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
}

.tag-close {
  background: none;
  border: none;
  color: currentColor;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.btn-clear-all-tags {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 0.775rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: auto;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 4rem 1.5rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.empty-icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background-color: rgba(255, 255, 255, 0.04);
}

.empty-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.empty-text {
  font-size: 0.9rem;
}

/* Pagination */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
}

.btn-pag {
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  border-radius: var(--radius-md);
}

.pag-pages {
  display: flex;
  gap: 0.35rem;
}

.pag-num {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pag-num-active, .pag-num:hover {
  background-color: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
}

.btn-filter-toggle-mobile {
  display: none;
}

@media (max-width: 768px) {
  .list-layout {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-filter-toggle-mobile {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 44px;
  }

  .sidebar-filters {
    width: 100%;
    display: none;
  }

  .sidebar-filters.mobile-show {
    display: block;
    animation: fadeIn 0.25s ease-out;
  }
}
</style>
