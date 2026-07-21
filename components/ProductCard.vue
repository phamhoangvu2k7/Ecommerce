<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { resolveImageUrl } from '~/composables/useImageUrl'

defineProps<{
  product: {
    id: string
    title: string
    thumbnail?: string
    discountPercentage?: number
    price: number
    priceNew?: number
    product_category_id?: {
      title: string
    }
  }
}>()

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>

<template>
  <div class="premium-card product-card">
    <div class="product-image-container">
      <img
        :src="resolveImageUrl(product.thumbnail)"
        :alt="product.title"
        class="product-img"
        loading="lazy"
      >
      <div v-if="product.discountPercentage && product.discountPercentage > 0" class="discount-badge">
        -{{ product.discountPercentage }}%
      </div>
    </div>
    <div class="product-details">
      <div class="product-category" v-if="product.product_category_id?.title">
        {{ product.product_category_id?.title }}
      </div>
      <h3 class="product-title" :title="product.title">
        {{ product.title }}
      </h3>

      <div class="product-prices">
        <span class="price-new">
          {{ formatPrice(product.priceNew || Math.round(product.price * (1 - (product.discountPercentage || 0) / 100))) }}
        </span>
        <span v-if="product.discountPercentage && product.discountPercentage > 0" class="price-old">
          {{ formatPrice(product.price) }}
        </span>
      </div>

      <div class="product-actions">
        <RouterLink :to="`/products/${product.id}`" class="btn btn-secondary w-full product-btn">
          Xem chi tiết
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-image-container {
  height: 210px;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover .product-img {
  transform: scale(1.06);
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--danger);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.product-details {
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-category {
  font-size: 0.775rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  margin-bottom: 0.25rem;
}

.product-title {
  font-size: 1.025rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text-main);
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
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
  color: var(--text-main);
}

.price-old {
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: line-through;
  color: var(--text-muted);
}

.w-full {
  width: 100%;
}

.product-btn {
  border-radius: 8px;
  font-size: 0.875rem;
}
</style>
