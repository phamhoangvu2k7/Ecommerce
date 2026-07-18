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
          <span class="bread-active">{{ product.product_category_id?.title }}</span>
        </nav>

        <h1 class="product-title">
          {{ product.title }}
        </h1>
        <p class="product-category">
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
            <button class="btn btn-secondary btn-qty" @click="quantity > 1 ? quantity-- : null">
              -
            </button>
            <input v-model="quantity" type="number" readonly class="qty-input">
            <button class="btn btn-secondary btn-qty" @click="quantity < product.stock ? quantity++ : null">
              +
            </button>
          </div>
          <button :disabled="addingToCart" class="btn btn-primary btn-add" @click="handleAddToCart">
            {{ addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng 🛒' }}
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
  gap: 3rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .detail-container {
    flex-direction: column;
    gap: 2rem;
  }
}

/* Image Column */
.image-column {
  flex: 1;
  max-width: 500px;
  height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.detail-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

/* Info Column */
.info-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
}

.breadcrumb {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.bread-link:hover {
  color: white;
}

.bread-active {
  color: var(--primary);
  font-weight: 500;
}

.product-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.product-category {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.status-stock {
  margin-bottom: 1.5rem;
}

/* Price block */
.price-section {
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prices {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.price-new {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--primary);
}

.price-old {
  font-size: 1.1rem;
  text-decoration: line-through;
  color: var(--text-muted);
}

.discount-label {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

/* Cart action selectors */
.cart-actions-block {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.qty-selector {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  height: 48px;
  background-color: rgba(15, 23, 42, 0.6);
}

.btn-qty {
  width: 40px;
  height: 100%;
  border-radius: 0;
  padding: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.qty-input {
  width: 50px;
  border: none;
  background: transparent;
  color: white;
  text-align: center;
  font-weight: 700;
  outline: none;
  font-family: var(--font-family);
  font-size: 1rem;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.btn-add {
  flex: 1;
  height: 48px;
}

/* Description Section */
.description-section {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.75rem;
}

.description-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
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
    font-size: 1.75rem;
  }

  .image-column {
    max-width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .product-title {
    font-size: 1.5rem;
  }

  .price-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
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
