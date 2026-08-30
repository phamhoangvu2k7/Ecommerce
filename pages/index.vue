<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ProductCard from '~/components/ProductCard.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'

const featuredProducts = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/client/products?limit=8'),
      fetch('/api/client/categories'),
    ])

    const prodData = await prodRes.json()
    const catData = await catRes.json()

    if (prodData.success) {
      featuredProducts.value = prodData.data.products
    }

    if (catData.success && catData.tree) {
      categories.value = catData.tree.slice(0, 6)
    }
  }
  catch (err) {
    console.error('Error loading homepage data:', err)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home-page container">
    <!-- Hero Section -->
    <section class="hero-section glass-panel fade-in-item mb-12">
      <div class="hero-content">
        <div class="hero-pill">
          <SvgIcon name="zap" :size="15" color="var(--primary)" />
          <span>Tuyển Chọn Công Nghệ Đỉnh Cao 2026</span>
        </div>

        <h1 class="hero-title">
          Trải Nghiệm Mua Sắm <br>
          <span class="text-gradient">Thế Hệ Mới</span>
        </h1>

        <p class="hero-subtitle">
          Khám phá hệ sinh thái sản phẩm chính hãng với ưu đãi đặc quyền, bảo hành uy tín và dịch vụ giao hàng siêu tốc.
        </p>

        <div class="hero-actions">
          <NuxtLink to="/products" class="btn btn-accent btn-lg">
            <span>Khám phá sản phẩm</span>
            <SvgIcon name="arrow-right" :size="18" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Categories Grid (Real DB Categories) -->
    <section v-if="categories.length > 0" class="categories-section mb-12">
      <div class="section-header">
        <h2 class="section-title">
          Danh Mục Nổi Bật
        </h2>
        <p class="section-subtitle">
          Tìm kiếm theo loại sản phẩm bạn quan tâm
        </p>
      </div>

      <div class="categories-grid">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.id"
          :to="`/products?category=${cat.slug}`"
          class="category-card"
        >
          <div class="category-icon">
            <SvgIcon name="box" :size="24" color="var(--primary)" />
          </div>
          <span class="category-name">{{ cat.title }}</span>
          <SvgIcon name="chevron-right" :size="16" color="var(--text-dim)" />
        </NuxtLink>
      </div>
    </section>

    <!-- Featured / Latest Products Grid (Real DB Products) -->
    <section class="featured-section mb-12">
      <div class="section-header">
        <h2 class="section-title">
          Sản Phẩm Mới Nhất
        </h2>
        <p class="section-subtitle">
          Khám phá các siêu phẩm công nghệ vừa cập bến cửa hàng
        </p>
      </div>

      <div v-if="loading" class="grid-products">
        <SkeletonCard v-for="i in 8" :key="i" />
      </div>

      <div v-else-if="featuredProducts.length === 0" class="empty-state">
        <p>Hiện chưa có sản phẩm nào.</p>
      </div>

      <div v-else class="grid-products">
        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
      </div>

      <div class="text-center mt-8">
        <NuxtLink to="/products" class="btn btn-secondary btn-lg">
          <span>Xem tất cả sản phẩm</span>
          <SvgIcon name="arrow-right" :size="18" />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mb-12 {
  margin-bottom: 3.5rem;
}

.mt-8 {
  margin-top: 2rem;
}

.text-center {
  text-align: center;
}

/* Hero Section */
.hero-section {
  position: relative;
  padding: 4.5rem 3.5rem;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: linear-gradient(135deg, rgba(19, 27, 46, 0.9) 0%, rgba(9, 13, 22, 0.95) 100%);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-glow);
}

[data-theme="light"] .hero-section {
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
}

.hero-content {
  max-width: 680px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  background-color: var(--primary-glow);
  border: 1px solid hsl(var(--hsl-primary-500) / 0.3);
  border-radius: var(--radius-full);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: 3.2rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.12;
  margin-bottom: 1.25rem;
  color: var(--text-main);
}

.text-gradient {
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 2.25rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Section Header */
.section-header {
  margin-bottom: 2rem;
  text-align: center;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  margin-bottom: 0.35rem;
}

.section-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
}

.category-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-color: var(--primary-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.category-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
  flex: 1;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 3rem;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2.5rem 1.5rem;
  }

  .hero-title {
    font-size: 2.2rem;
  }
}
</style>
