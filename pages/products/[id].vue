<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import SkeletonDetail from '~/components/SkeletonDetail.vue'
import { resolveImageUrl } from '~/composables/useImageUrl'
import { useCartStore } from '~/stores/cart'

const route = useRoute()
const cartStore = useCartStore()

const product = ref<any>(null)
const loading = ref(true)
const errorMsg = ref('')
const successMsg = ref('')

const quantity = ref(1)
const addingToCart = ref(false)

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await fetch(`/api/client/products/${id}`)
    const data = await res.json()
    if (data.success) {
      product.value = data.product
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi tải chi tiết sản phẩm.'
    }
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err) {
    errorMsg.value = 'Không thể kết nối đến máy chủ.'
  }
  finally {
    loading.value = false
  }
})

async function handleAddToCart() {
  if (!product.value || quantity.value <= 0)
    return
  addingToCart.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    await cartStore.addToCart(product.value.id, quantity.value)
    successMsg.value = `Đã thêm ${quantity.value} sản phẩm '${product.value.title}' vào giỏ hàng thành công!`
    quantity.value = 1
    // Auto clear success message
    setTimeout(() => {
      successMsg.value = ''
    }, 4000)
  }
  catch (err: any) {
    errorMsg.value = err.message || 'Không thể thêm vào giỏ hàng.'
  }
  finally {
    addingToCart.value = false
  }
}

function formatPrice(value: number) {
  if (!value)
    return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>

<template>
  <div class="product-detail-page container">
    <div v-if="loading">
      <SkeletonDetail />
    </div>

    <div v-else-if="errorMsg && !product" class="alert alert-error">
      {{ errorMsg }}
      <RouterLink to="/products" class="btn btn-secondary mt-4 block text-center">
        Quay lại danh sách
      </RouterLink>
    </div>

    <div v-else-if="product" class="detail-container">
      <!-- Image Column -->
      <div class="image-column glass-panel">
        <img :src="resolveImageUrl(product.thumbnail)" :alt="product.title" class="detail-img">
      </div>

      <!-- Info Column -->
      <div class="info-column">
        <nav class="breadcrumb">
          <RouterLink to="/products" class="bread-link">
            Sản phẩm
          </RouterLink>
          <span class="bread-sep">/</span>
          <span class="bread-active">{{ product.product_category_id?.title || 'Chi tiết' }}</span>
        </nav>

        <h1 class="product-title">
          {{ product.title }}
        </h1>
        <p class="product-category" v-if="product.product_category_id?.title">
          Danh mục: <strong>{{ product.product_category_id?.title }}</strong>
        </p>

        <!-- Status stock badge -->
        <div class="status-stock">
          <span v-if="product.stock > 0" class="badge badge-active">Còn hàng ({{ product.stock }})</span>
          <span v-else class="badge badge-inactive">Đã hết hàng</span>
        </div>

        <div class="price-section">
          <div class="prices">
            <span class="price-new">{{ formatPrice(product.priceNew) }}</span>
            <span v-if="product.discountPercentage > 0" class="price-old">
              {{ formatPrice(product.price) }}
            </span>
          </div>
          <div v-if="product.discountPercentage > 0" class="discount-label">
            Tiết kiệm {{ product.discountPercentage }}%
          </div>
        </div>

        <!-- Feedback Messages -->
        <div v-if="successMsg" class="alert alert-success">
          {{ successMsg }}
        </div>
        <div v-if="errorMsg" class="alert alert-error">
          {{ errorMsg }}
        </div>

        <!-- Add to cart block -->
        <div v-if="product.stock > 0" class="cart-actions-block">
          <div class="qty-selector">
            <button class="btn-qty" aria-label="Giảm số lượng" @click="quantity > 1 ? quantity-- : null">
              -
            </button>
            <input v-model="quantity" type="number" readonly class="qty-input" aria-label="Số lượng sản phẩm">
            <button class="btn-qty" aria-label="Tăng số lượng" @click="quantity < product.stock ? quantity++ : null">
              +
            </button>
          </div>
          <button :disabled="addingToCart" class="btn btn-primary btn-add" @click="handleAddToCart">
            {{ addingToCart ? 'Đang xử lý...' : 'Thêm vào giỏ hàng 🛒' }}
          </button>
        </div>

        <div class="description-section">
          <h3 class="section-title">
            Mô tả sản phẩm
          </h3>
          <p class="description-text">
            {{ product.description || 'Không có mô tả chi tiết cho sản phẩm này.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-container {
  display: flex;
  gap: 2.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .detail-container {
    flex-direction: column;
    gap: 1.75rem;
  }
}

/* Image Column */
.image-column {
  flex: 1;
  max-width: 480px;
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.75rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: rgba(19, 27, 46, 0.6);
}

.detail-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.35s ease;
}

.image-column:hover .detail-img {
  transform: scale(1.03);
}

/* Info Column */
.info-column {
  flex: 1.25;
  display: flex;
  flex-direction: column;
}

.breadcrumb {
  display: flex;
  gap: 0.4rem;
  font-size: 0.825rem;
  color: var(--text-dim);
  margin-bottom: 1.25rem;
  align-items: center;
}

.bread-link {
  color: var(--text-muted);
  font-weight: 500;
  transition: color var(--transition-speed) ease;
}

.bread-link:hover {
  color: var(--text-main);
}

.bread-active {
  color: var(--text-main);
  font-weight: 700;
}

.product-title {
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  line-height: 1.2;
  margin-bottom: 0.4rem;
}

.product-category {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 0.85rem;
}

.status-stock {
  margin-bottom: 1.35rem;
}

/* Price block */
.price-section {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  padding: 1.15rem 1.35rem;
  border-radius: 12px;
  margin-bottom: 1.35rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prices {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
}

.price-new {
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
}

.price-old {
  font-size: 1.05rem;
  text-decoration: line-through;
  color: var(--text-muted);
  font-weight: 500;
}

.discount-label {
  background-color: rgba(239, 68, 68, 0.12);
  color: var(--danger);
  font-size: 0.775rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

/* Cart action selectors */
.cart-actions-block {
  display: flex;
  gap: 0.85rem;
  margin-bottom: 1.75rem;
}

.qty-selector {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  height: 46px;
  background-color: rgba(0, 0, 0, 0.2);
  align-items: center;
}

.btn-qty {
  width: 40px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--text-main);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color var(--transition-speed) ease;
}

.btn-qty:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.qty-input {
  width: 48px;
  border: none;
  background: transparent;
  color: var(--text-main);
  text-align: center;
  font-weight: 800;
  outline: none;
  font-family: var(--font-family);
  font-size: 0.95rem;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.btn-add {
  flex: 1;
  height: 46px;
  font-size: 0.95rem;
}

/* Description Section */
.description-section {
  border-top: 1px solid var(--border-color);
  padding-top: 1.35rem;
  margin-top: 1rem;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--text-main);
  margin-bottom: 0.65rem;
}

.description-text {
  color: var(--text-muted);
  font-size: 0.925rem;
  line-height: 1.65;
  white-space: pre-line;
}

.mt-4 {
  margin-top: 1rem;
}

.block {
  display: block;
}

@media (max-width: 768px) {
  .product-title {
    font-size: 1.7rem;
  }

  .image-column {
    max-width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .product-title {
    font-size: 1.45rem;
  }

  .price-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .cart-actions-block {
    flex-direction: column;
    gap: 0.75rem;
  }

  .qty-selector {
    width: 100%;
    justify-content: space-between;
  }

  .btn-qty {
    flex: 1;
  }

  .qty-input {
    flex: 1.5;
  }
}
</style>
