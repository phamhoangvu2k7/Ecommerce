<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";

const featuredProducts = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch("/api/client/products?limit=3");
    const data = await res.json();
    if (data.success) {
      featuredProducts.value = data.data.products;
    }
  } catch (err) {
    console.error("Error loading featured products:", err);
  } finally {
    loading.value = false;
  }
});

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}
</script>

<template>
  <div class="home-page container">
    <!-- Hero Section -->
    <section class="hero-section glass-panel fade-in-item">
      <div class="hero-content">
        <h1 class="hero-title">Trải nghiệm Mua sắm Premium</h1>
        <p class="hero-subtitle">Khám phá thế giới công nghệ đẳng cấp với các sản phẩm chính hãng, ưu đãi độc quyền và dịch vụ giao hàng siêu tốc.</p>
        <div class="hero-actions">
          <RouterLink to="/products" class="btn btn-primary">Mua sắm ngay 🚀</RouterLink>
          <a href="#featured" class="btn btn-secondary">Xem sản phẩm nổi bật</a>
        </div>
      </div>
      <div class="hero-glowing-blob"></div>
    </section>

    <!-- Featured Products -->
    <section id="featured" class="featured-section">
      <div class="section-header">
        <h2 class="section-title">Sản Phẩm Mới Nhất</h2>
        <p class="section-subtitle">Đừng bỏ lỡ các siêu phẩm công nghệ hot nhất vừa cập bến cửa hàng.</p>
      </div>

      <div v-if="loading" class="loading-state">
        Đang tải sản phẩm...
      </div>

      <div v-else class="grid-products">
        <div v-for="product in featuredProducts" :key="product._id" class="premium-card product-card">
          <div class="product-image-container">
            <img :src="product.thumbnail || 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=500'" :alt="product.title" class="product-img" />
            <div v-if="product.discountPercentage > 0" class="discount-badge">
              -{{ product.discountPercentage }}%
            </div>
          </div>
          <div class="product-details">
            <h3 class="product-title">{{ product.title }}</h3>
            <p class="product-category">{{ product.product_category_id?.title }}</p>
            
            <div class="product-prices">
              <span class="price-new">{{ formatPrice(product.priceNew) }}</span>
              <span v-if="product.discountPercentage > 0" class="price-old">
                {{ formatPrice(product.price) }}
              </span>
            </div>

            <div class="product-actions">
              <RouterLink :to="`/products/${product._id}`" class="btn btn-secondary w-full">
                Chi tiết sản phẩm
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-section {
  position: relative;
  padding: 4rem 3rem;
  margin-bottom: 4rem;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 600px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff 40%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

.hero-glowing-blob {
  position: absolute;
  top: -20%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(192, 132, 252, 0.05) 70%, transparent 100%);
  filter: blur(40px);
  z-index: 1;
}

.featured-section {
  margin-bottom: 5rem;
}

.section-header {
  margin-bottom: 2.5rem;
  text-align: center;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  color: var(--text-muted);
  padding: 3rem 0;
}

/* Product Card */
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

@media (max-width: 768px) {
  .hero-section {
    padding: 2.5rem 1.5rem;
    margin-bottom: 2.5rem;
    text-align: center;
    justify-content: center;
  }
  
  .hero-content {
    max-width: 100%;
  }
  
  .hero-title {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .hero-actions .btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>
