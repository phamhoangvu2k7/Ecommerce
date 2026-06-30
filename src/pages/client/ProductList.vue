<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProductCard from "../../components/ProductCard.vue";
import SkeletonCard from "../../components/SkeletonCard.vue";

const route = useRoute();
const router = useRouter();

const products = ref<any[]>([]);
const categories = ref<any[]>([]);
const totalProducts = ref(0);
const totalPages = ref(1);

const loading = ref(true);

// Filter states
const searchQuery = ref((route.query.q as string) || "");
const selectedCategory = ref((route.query.category as string) || "");
const priceMin = ref((route.query.price_min as string) || "");
const priceMax = ref((route.query.price_max as string) || "");
const sortOrder = ref((route.query.sort as string) || "position_desc");
const currentPage = ref(parseInt(route.query.page as string) || 1);
const showMobileFilters = ref(false);

onMounted(async () => {
  await fetchCategories();
  await fetchProducts();
});

async function fetchCategories() {
  try {
    const res = await fetch("/api/client/categories");
    const data = await res.json();
    if (data.success) {
      categories.value = flattenTree(data.tree);
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
  }
}

function flattenTree(nodes: any[]): any[] {
  let list: any[] = [];
  for (const node of nodes) {
    list.push(node);
    if (node.children && node.children.length > 0) {
      list = [...list, ...flattenTree(node.children)];
    }
  }
  return list;
}

async function fetchProducts() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value) params.append("q", searchQuery.value);
    if (selectedCategory.value) params.append("category_slug", selectedCategory.value);
    if (priceMin.value) params.append("price_min", priceMin.value);
    if (priceMax.value) params.append("price_max", priceMax.value);
    if (sortOrder.value) params.append("sort", sortOrder.value);
    params.append("page", String(currentPage.value));
    params.append("limit", "9");

    const res = await fetch(`/api/client/products?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      products.value = data.data.products;
      totalProducts.value = data.data.total;
      totalPages.value = data.data.pages;
    }
  } catch (err) {
    console.error("Error fetching products:", err);
  } finally {
    loading.value = false;
  }
}

// Watch filters and trigger query
watch([selectedCategory, sortOrder, currentPage], () => {
  updateQueryParams();
  fetchProducts();
});

function handleSearch() {
  currentPage.value = 1;
  updateQueryParams();
  fetchProducts();
}

function handlePriceFilter() {
  currentPage.value = 1;
  updateQueryParams();
  fetchProducts();
}

function updateQueryParams() {
  const query: any = {};
  if (searchQuery.value) query.q = searchQuery.value;
  if (selectedCategory.value) query.category = selectedCategory.value;
  if (priceMin.value) query.price_min = priceMin.value;
  if (priceMax.value) query.price_max = priceMax.value;
  if (sortOrder.value) query.sort = sortOrder.value;
  query.page = String(currentPage.value);
  
  router.push({ query });
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}
</script>

<template>
  <div class="product-list-page container">
    <div class="list-layout">
      <!-- Sidebar Filters -->
      <aside class="sidebar-filters glass-panel" :class="{ 'mobile-show': showMobileFilters }">
        <h3 class="filter-header">Bộ lọc tìm kiếm</h3>

        <!-- Categories Filter -->
        <div class="filter-group">
          <label class="input-label">Danh mục</label>
          <select v-model="selectedCategory" class="premium-input">
            <option value="">Tất cả danh mục</option>
            <option v-for="cat in categories" :key="cat._id" :value="cat.slug">
              {{ cat.title }}
            </option>
          </select>
        </div>

        <!-- Price Range Filter -->
        <div class="filter-group">
          <label class="input-label">Khoảng giá (Triệu VND)</label>
          <div class="price-range-inputs">
            <input v-model="priceMin" type="number" placeholder="Từ" class="premium-input price-input" />
            <span class="price-sep">-</span>
            <input v-model="priceMax" type="number" placeholder="Đến" class="premium-input price-input" />
          </div>
          <button @click="handlePriceFilter" class="btn btn-secondary btn-apply-price w-full">
            Áp dụng giá
          </button>
        </div>

        <!-- Sorting -->
        <div class="filter-group">
          <label class="input-label">Sắp xếp theo</label>
          <select v-model="sortOrder" class="premium-input">
            <option value="position_desc">Nổi bật nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="title_asc">Tên A-Z</option>
            <option value="title_desc">Tên Z-A</option>
          </select>
        </div>
      </aside>

      <!-- Main Section -->
      <div class="products-main">
        <!-- Mobile Filter Toggle Button -->
        <button 
          @click="showMobileFilters = !showMobileFilters" 
          class="btn btn-secondary btn-filter-toggle-mobile w-full"
        >
          {{ showMobileFilters ? '✕ Đóng bộ lọc' : '🔍 Bộ lọc & Sắp xếp' }}
        </button>

        <!-- Search bar -->
        <div class="search-bar-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            class="premium-input search-input"
            @keyup.enter="handleSearch"
          />
          <button @click="handleSearch" class="btn btn-primary btn-search">Tìm kiếm</button>
        </div>

        <!-- Results Grid -->
        <div v-if="loading" class="grid-products">
          <SkeletonCard v-for="i in 6" :key="i" />
        </div>

        <div v-else-if="products.length === 0" class="empty-state">
          Không tìm thấy sản phẩm nào khớp với bộ lọc của bạn.
        </div>

        <div v-else>
          <div class="grid-products">
            <ProductCard v-for="product in products" :key="product._id" :product="product" />
          </div>

          <!-- Pagination Footer -->
          <div class="pagination-container">
            <button
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
              class="btn btn-secondary btn-pag"
            >
              Trước
            </button>
            <span class="pag-info">Trang {{ currentPage }} / {{ totalPages }}</span>
            <button
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
              class="btn btn-secondary btn-pag"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-layout {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

/* Sidebar */
.sidebar-filters {
  width: 280px;
  padding: 1.5rem;
  align-self: flex-start;
  flex-shrink: 0;
}

.filter-header {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #fff;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.price-range-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.price-input {
  flex: 1;
  text-align: center;
}

.price-sep {
  color: var(--text-muted);
}

.btn-apply-price {
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
}

/* Main Section */
.products-main {
  flex: 1;
}

.search-bar-container {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
}

.btn-search {
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 4rem 0;
}

/* Pagination */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 3rem;
  margin-bottom: 2rem;
}

.btn-pag {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.pag-info {
  font-size: 0.95rem;
  color: var(--text-muted);
  font-weight: 500;
}

.w-full {
  width: 100%;
}

.btn-filter-toggle-mobile {
  display: none;
  margin-bottom: 1.5rem;
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
    font-size: 0.95rem;
  }
  
  .sidebar-filters {
    width: 100%;
    display: none;
    align-self: stretch;
    margin-bottom: 1rem;
  }
  
  .sidebar-filters.mobile-show {
    display: block;
    animation: fadeIn 0.3s ease-out;
  }
  
  .search-bar-container {
    margin-bottom: 1.5rem;
  }
}
</style>
