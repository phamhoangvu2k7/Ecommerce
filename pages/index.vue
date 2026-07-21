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

</script>

<template>
  <div class="home-page container">
    <!-- Hero Section -->
    <section class="hero-section glass-panel fade-in-item">
      <div class="hero-content">
        <div class="hero-pill">✨ Tuyển chọn sản phẩm chính hãng 2026</div>
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
          <a href="#featured" class="btn btn-secondary">Xem sản phẩm mới</a>
        </div>
      </div>
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
  padding: 4rem 3.5rem;
  margin-bottom: 3.5rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  background: rgba(19, 27, 46, 0.6);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 620px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--primary);
  background-color: var(--primary-glow);
  border: 1px solid rgba(79, 70, 229, 0.25);
  border-radius: 999px;
  margin-bottom: 1.25rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.15;
  margin-bottom: 1.25rem;
  color: var(--text-main);
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

.featured-section {
  margin-bottom: 4rem;
}

.section-header {
  margin-bottom: 2.25rem;
  text-align: center;
}

.section-title {
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  margin-bottom: 0.4rem;
}

.section-subtitle {
  color: var(--text-muted);
  font-size: 0.925rem;
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
    font-size: 2.1rem;
    margin-bottom: 1rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
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
