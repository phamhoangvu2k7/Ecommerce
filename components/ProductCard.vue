<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  product: {
    _id: string
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
        :src="product.thumbnail || 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'"
        :alt="product.title"
        class="product-img"
      >
      <div v-if="product.discountPercentage && product.discountPercentage > 0" class="discount-badge">
        -{{ product.discountPercentage }}%
      </div>
    </div>
    <div class="product-details">
      <h3 class="product-title">
        {{ product.title }}
      </h3>
      <p class="product-category">
        {{ product.product_category_id?.title }}
      </p>

      <div class="product-prices">
        <span class="price-new">
          {{ formatPrice(product.priceNew || Math.round(product.price * (1 - (product.discountPercentage || 0) / 100))) }}
        </span>
        <span v-if="product.discountPercentage && product.discountPercentage > 0" class="price-old">
          {{ formatPrice(product.price) }}
        </span>
      </div>

      <div class="product-actions">
        <RouterLink :to="`/products/${product._id}`" class="btn btn-secondary w-full">
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
}

.product-image-container {
  height: 200px;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
}

.product-card:hover .product-img {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--danger);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.product-details {
  padding-top: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.25rem;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.product-category {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.product-prices {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  margin-top: auto;
}

.price-new {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.price-old {
  font-size: 0.9rem;
  text-decoration: line-through;
  color: var(--text-muted);
}

.w-full {
  width: 100%;
}
</style>
