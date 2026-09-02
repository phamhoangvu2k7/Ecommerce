<script setup lang="ts">
import { ref } from 'vue'
import { resolveImageUrl } from '~/composables/useImageUrl'
import { useCartStore } from '~/stores/cart'

const props = defineProps<{
  product: {
    id: string
    title: string
    thumbnail?: string
    discountPercentage?: number
    price: number
    priceNew?: number
    featured?: boolean
    product_category_id?: {
      title: string
    }
  }
}>()

const cartStore = useCartStore()
const isAdding = ref(false)
const addedSuccess = ref(false)

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

async function handleQuickAddToCart(e: Event) {
  e.preventDefault()
  e.stopPropagation()

  try {
    isAdding.value = true
    await cartStore.addToCart(props.product.id, 1)
    addedSuccess.value = true
    setTimeout(() => {
      addedSuccess.value = false
    }, 2000)
  }
  catch (err) {
    console.error('Quick add to cart failed:', err)
  }
  finally {
    isAdding.value = false
  }
}
</script>

<template>
  <div class="premium-card product-card cursor-pointer group">
    <!-- Image container -->
    <div class="product-image-container">
      <NuxtLink :to="`/products/${product.id}`" class="block w-full h-full">
        <img
          :src="resolveImageUrl(product.thumbnail)"
          :alt="product.title"
          class="product-img"
          loading="lazy"
        >
      </NuxtLink>

      <!-- Badges -->
      <div class="badges-row">
        <span v-if="product.discountPercentage && product.discountPercentage > 0" class="discount-badge">
          -{{ product.discountPercentage }}%
        </span>
        <span v-if="product.featured" class="hot-badge">
          HOT
        </span>
      </div>

      <!-- Quick Add Overlay button -->
      <button
        class="quick-add-btn"
        :class="{ 'btn-success': addedSuccess }"
        :disabled="isAdding"
        title="Thêm nhanh vào giỏ hàng"
        @click="handleQuickAddToCart"
      >
        <SvgIcon v-if="addedSuccess" name="check" :size="18" color="#ffffff" />
        <SvgIcon v-else name="cart" :size="18" />
        <span>{{ addedSuccess ? 'Đã thêm!' : (isAdding ? 'Đang thêm...' : 'Thêm vào giỏ') }}</span>
      </button>
    </div>

    <!-- Product details -->
    <div class="product-details">
      <div v-if="product.product_category_id?.title" class="product-category">
        {{ product.product_category_id?.title }}
      </div>

      <NuxtLink :to="`/products/${product.id}`">
        <h3 class="product-title" :title="product.title">
          {{ product.title }}
        </h3>
      </NuxtLink>

      <div class="product-prices">
        <span class="price-new">
          {{ formatPrice(product.priceNew || Math.round(product.price * (1 - (product.discountPercentage || 0) / 100))) }}
        </span>
        <span v-if="product.discountPercentage && product.discountPercentage > 0" class="price-old">
          {{ formatPrice(product.price) }}
        </span>
      </div>

      <div class="product-actions">
        <NuxtLink :to="`/products/${product.id}`" class="btn btn-secondary w-full product-btn">
          <span>Xem chi tiết</span>
          <SvgIcon name="arrow-right" :size="15" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-color-hover);
  box-shadow: var(--shadow-lg);
}

.product-image-container {
  height: 220px;
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  background-color: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

[data-theme="light"] .product-image-container {
  background-color: rgba(0, 0, 0, 0.02);
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform var(--transition-slow);
}

.product-card:hover .product-img {
  transform: scale(1.08);
}

.badges-row {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.discount-badge {
  background-color: var(--danger);
  color: #ffffff;
  font-size: 0.725rem;
  font-weight: 800;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

.hot-badge {
  background-color: var(--accent);
  color: #ffffff;
  font-size: 0.725rem;
  font-weight: 800;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

/* Quick Add Button Overlay */
.quick-add-btn {
  position: absolute;
  bottom: -45px;
  left: 10px;
  right: 10px;
  height: 38px;
  background-color: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.825rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  box-shadow: 0 4px 12px hsl(var(--hsl-primary-500) / 0.35);
  transition: all var(--transition-normal);
  opacity: 0;
}

.product-card:hover .quick-add-btn {
  bottom: 10px;
  opacity: 1;
}

.quick-add-btn:hover {
  background-color: var(--primary-hover);
}

.btn-success {
  background-color: var(--accent) !important;
}

.product-details {
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  margin-bottom: 0.2rem;
}

.product-title {
  font-size: 0.975rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
  transition: color var(--transition-fast);
}

.product-card:hover .product-title {
  color: var(--primary);
}

.product-prices {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 1rem;
  margin-top: auto;
}

.price-new {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--accent);
}

.price-old {
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: line-through;
  color: var(--text-dim);
}

.product-btn {
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  padding: 0.5rem;
}
</style>
