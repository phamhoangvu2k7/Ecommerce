<script setup lang="ts">
import ProductCard from '~/components/ProductCard.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'

const featuredProducts = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('/api/client/products?limit=3')
    const data = await res.json()
    if (data.success) {
      featuredProducts.value = data.data.products
    }
  }
  catch (err) {
    console.error('Error loading featured products:', err)
  }
  finally {
    loading.value = false
  }
})

function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>

<template>
  <div class="home-page container">
    <!-- Hero Section -->
    <section class="hero-section glass-panel fade-in-item">
      <div class="hero-content">
        <h1 class="hero-title">
          Trải nghiệm Mua sắm Premium
        </h1>
        <p class="hero-subtitle">
          Khám phá thế giới công nghệ đẳng cấp với các sản phẩm chính hãng, ưu đãi độc quyền và dịch vụ giao hàng siêu tốc.
        </p>
        <div class="hero-actions">
          <RouterLink to="/products" class="btn btn-primary">
            Mua sắm ngay 🚀
          </RouterLink>
          <a href="#featured" class="btn btn-secondary">Xem sản phẩm nổi bật</a>
        </div>
      </div>
      <div class="hero-glowing-blob" />
    </section>

    <!-- Featured Products -->
    <section id="featured" class="featured-section">
      <div class="section-header">
        <h2 class="section-title">
          Sản Phẩm Mới Nhất
        </h2>
        <p class="section-subtitle">
          Đừng bỏ lỡ các siêu phẩm công nghệ hot nhất vừa cập bến cửa hàng.
        </p>
      </div>

      <div v-if="loading" class="grid-products">
        <SkeletonCard v-for="i in 3" :key="i" />
      </div>

      <div v-else class="grid-products">
        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
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
