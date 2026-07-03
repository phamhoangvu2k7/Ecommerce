<template>
  <div class="not-found-page container text-center">
    <div class="not-found-card glass-panel fade-in-item">
      <div class="error-code">404</div>
      <h1 class="h1-title mb-4">Không tìm thấy trang</h1>
      <p class="error-msg mb-8">Trang bạn đang truy cập không tồn tại hoặc đã được di chuyển đi nơi khác.</p>
      <RouterLink to="/" class="btn btn-primary">Quay lại trang chủ 🏠</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
}

.not-found-card {
  max-width: 500px;
  padding: 3rem 2rem;
}

.error-code {
  font-size: 6rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
  margin-bottom: 1.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-8 {
  margin-bottom: 2rem;
}

.error-msg {
  color: var(--text-muted);
}

.text-center {
  text-align: center;
}
</style>
