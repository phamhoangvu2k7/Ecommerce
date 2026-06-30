<template>
  <div class="detail-container animate-pulse" aria-busy="true" aria-label="Đang tải chi tiết sản phẩm...">
    <!-- Image Column -->
    <div class="image-column glass-panel">
      <div class="skeleton-image"></div>
    </div>

    <!-- Info Column -->
    <div class="info-column">
      <div class="skeleton-line skeleton-bread"></div>
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-category"></div>
      <div class="skeleton-badge"></div>
      
      <div class="skeleton-price-section">
        <div class="skeleton-line skeleton-price-new"></div>
        <div class="skeleton-line skeleton-price-old"></div>
      </div>

      <div class="skeleton-actions-block">
        <div class="skeleton-qty"></div>
        <div class="skeleton-button"></div>
      </div>

      <div class="skeleton-desc-section">
        <div class="skeleton-line skeleton-desc-title"></div>
        <div class="skeleton-line skeleton-desc-text-1"></div>
        <div class="skeleton-line skeleton-desc-text-2"></div>
        <div class="skeleton-line skeleton-desc-text-3"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-container {
  display: flex;
  gap: 3rem;
  margin-top: 1rem;
  pointer-events: none;
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

.skeleton-image {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.05);
}

/* Info Column */
.info-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
}

.skeleton-line {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.skeleton-bread {
  height: 0.85rem;
  width: 150px;
  margin-bottom: 1.5rem;
}

.skeleton-title {
  height: 2.25rem;
  width: 90%;
  margin-bottom: 0.5rem;
}

.skeleton-category {
  height: 0.95rem;
  width: 250px;
  margin-bottom: 1rem;
}

.skeleton-badge {
  height: 22px;
  width: 90px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.05);
  margin-bottom: 1.5rem;
}

.skeleton-price-section {
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.skeleton-price-new {
  height: 1.75rem;
  width: 150px;
  margin-bottom: 0;
}

.skeleton-price-old {
  height: 1.1rem;
  width: 80px;
  margin-bottom: 0;
}

.skeleton-actions-block {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.skeleton-qty {
  width: 130px;
  height: 48px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.05);
}

.skeleton-button {
  flex: 1;
  height: 48px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.05);
}

.skeleton-desc-section {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.skeleton-desc-title {
  height: 1.1rem;
  width: 120px;
  margin-bottom: 0.75rem;
}

.skeleton-desc-text-1 {
  height: 0.95rem;
  width: 100%;
}

.skeleton-desc-text-2 {
  height: 0.95rem;
  width: 95%;
}

.skeleton-desc-text-3 {
  height: 0.95rem;
  width: 80%;
  margin-bottom: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 768px) {
  .detail-container {
    flex-direction: column;
    gap: 2rem;
  }
  .image-column {
    max-width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    padding: 1.5rem;
  }
  .skeleton-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .skeleton-price-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .skeleton-actions-block {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .skeleton-qty {
    width: 100%;
  }
}
</style>
