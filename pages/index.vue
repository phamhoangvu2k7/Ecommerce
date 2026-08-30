<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ProductCard from '~/components/ProductCard.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'

const featuredProducts = ref<any[]>([])
const flashSaleProducts = ref<any[]>([])
const categories = ref<any[]>([])
const loading = ref(true)

// Flash Sale Countdown State
const hours = ref(5)
const minutes = ref(42)
const seconds = ref(18)
let countdownInterval: any = null

function startCountdown() {
  countdownInterval = setInterval(() => {
    if (seconds.value > 0) {
      seconds.value--
    }
    else {
      seconds.value = 59
      if (minutes.value > 0) {
        minutes.value--
      }
      else {
        minutes.value = 59
        if (hours.value > 0) {
          hours.value--
        }
        else {
          hours.value = 12 // reset timer
        }
      }
    }
  }, 1000)
}

onMounted(async () => {
  startCountdown()
  try {
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/client/products?limit=8'),
      fetch('/api/client/categories'),
    ])

    const prodData = await prodRes.json()
    const catData = await catRes.json()

    if (prodData.success) {
      featuredProducts.value = prodData.data.products
      // Flash sale products (first 4 items)
      flashSaleProducts.value = prodData.data.products.slice(0, 4)
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

onBeforeUnmount(() => {
  if (countdownInterval)
    clearInterval(countdownInterval)
})

// Sample Testimonials for Social Proof
const testimonials = [
  {
    id: 1,
    name: 'Nguyễn Văn Minh',
    role: 'Khách hàng thân thiết',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    comment: 'Sản phẩm giao hàng siêu nhanh, đóng gói cẩn thận. Rất hài lòng với chất lượng dịch vụ của NitroStore!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Trần Thị Thu Hà',
    role: 'Nhà thiết kế Đồ họa',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    comment: 'Laptop và phụ kiện công nghệ ở đây chính hãng 100%, bảo hành uy tín. Đã giới thiệu cho cả nhóm mua cùng.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Lê Hoàng Nam',
    role: 'Lập trình viên Senior',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    comment: 'Giá cả cạnh tranh nhất thị trường. Đặc biệt khối Flash Sale giảm giá cực sâu!',
    rating: 5,
  },
]
</script>

<template>
  <div class="home-page container">
    <!-- Hero Section -->
    <section class="hero-section glass-panel fade-in-item">
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
          Khám phá hệ sinh thái sản phẩm chính hãng với ưu đãi đặc quyền, bảo hành uy tín và giao hàng siêu tốc 2H.
        </p>

        <div class="hero-actions">
          <NuxtLink to="/products" class="btn btn-accent btn-lg">
            <span>Mua sắm ngay</span>
            <SvgIcon name="arrow-right" :size="18" />
          </NuxtLink>

          <a href="#flash-sale" class="btn btn-secondary btn-lg">
            <SvgIcon name="clock" :size="18" />
            <span>Săn Flash Sale</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Categories Grid -->
    <section class="categories-section mb-12">
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

    <!-- Flash Sale Section with Live Countdown -->
    <section id="flash-sale" class="flash-sale-section glass-panel mb-12">
      <div class="flash-header">
        <div class="flash-title-group">
          <div class="flash-icon-box">
            <SvgIcon name="zap" :size="22" color="#ffffff" />
          </div>
          <div>
            <h2 class="flash-title">
              FLASH SALE GIỜ VÀNG
            </h2>
            <p class="flash-sub">
              Ưu đãi số lượng có hạn &middot; Nhanh tay săn ngay
            </p>
          </div>
        </div>

        <!-- Timer Widget -->
        <div class="countdown-widget">
          <span class="timer-label">Kết thúc sau:</span>
          <div class="timer-boxes">
            <div class="timer-box">
              {{ String(hours).padStart(2, '0') }}
            </div>
            <span class="timer-colon">:</span>
            <div class="timer-box">
              {{ String(minutes).padStart(2, '0') }}
            </div>
            <span class="timer-colon">:</span>
            <div class="timer-box">
              {{ String(seconds).padStart(2, '0') }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="grid-products">
        <SkeletonCard v-for="i in 4" :key="i" />
      </div>

      <div v-else class="grid-products">
        <ProductCard
          v-for="product in flashSaleProducts"
          :key="product.id"
          :product="{ ...product, discountPercentage: product.discountPercentage || 25, featured: true }"
        />
      </div>
    </section>

    <!-- Featured / Best Sellers Products -->
    <section class="featured-section mb-12">
      <div class="section-header">
        <h2 class="section-title">
          Sản Phẩm Bán Chạy
        </h2>
        <p class="section-subtitle">
          Những lựa chọn được yêu thích nhất từ cộng đồng người dùng
        </p>
      </div>

      <div v-if="loading" class="grid-products">
        <SkeletonCard v-for="i in 8" :key="i" />
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

    <!-- Customer Reviews / Social Proof -->
    <section class="testimonials-section mb-12">
      <div class="section-header">
        <h2 class="section-title">
          Đánh Giá Từ Khách Hàng
        </h2>
        <p class="section-subtitle">
          Hơn 10,000+ khách hàng đã tin tưởng trải nghiệm NitroStore
        </p>
      </div>

      <div class="testimonials-grid">
        <div v-for="item in testimonials" :key="item.id" class="premium-card testimonial-card">
          <div class="testimonial-stars">
            <SvgIcon v-for="i in item.rating" :key="i" name="star" :size="16" color="#f59e0b" />
          </div>
          <p class="testimonial-comment">
            "{{ item.comment }}"
          </p>
          <div class="testimonial-user">
            <img :src="item.avatar" :alt="item.name" class="user-avatar-img">
            <div>
              <h4 class="user-name">
                {{ item.name }}
              </h4>
              <span class="user-role">{{ item.role }}</span>
            </div>
          </div>
        </div>
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
  margin-bottom: 3.5rem;
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

/* Flash Sale Section */
.flash-sale-section {
  padding: 2rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(19, 27, 46, 0.8) 100%);
}

.flash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.flash-title-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.flash-icon-box {
  width: 44px;
  height: 44px;
  background-color: var(--danger);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.flash-title {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.flash-sub {
  font-size: 0.825rem;
  color: var(--text-muted);
}

/* Countdown Widget */
.countdown-widget {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.timer-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.timer-boxes {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.timer-box {
  background-color: var(--danger);
  color: #ffffff;
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 800;
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  min-width: 36px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.timer-colon {
  font-weight: 800;
  color: var(--danger);
}

/* Testimonials */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.testimonial-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.testimonial-stars {
  display: flex;
  gap: 0.2rem;
  margin-bottom: 0.85rem;
}

.testimonial-comment {
  font-size: 0.925rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 1.25rem;
  flex: 1;
  font-style: italic;
}

.testimonial-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-img {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--primary);
}

.user-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

.user-role {
  font-size: 0.775rem;
  color: var(--text-dim);
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2.5rem 1.5rem;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .flash-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
