<template>
  <div class="premium-card skeleton-card animate-pulse" aria-busy="true" aria-label="Đang tải sản phẩm...">
    <div class="skeleton-image"></div>
    <div class="skeleton-details">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-category"></div>
      <div class="skeleton-row">
        <div class="skeleton-line skeleton-price-new"></div>
        <div class="skeleton-line skeleton-price-old"></div>
      </div>
      <div class="skeleton-button"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  display: flex;
  flex-direction: column;
  pointer-events: none;
  background-color: var(--bg-card);
}

.skeleton-image {
  height: 200px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.05);
}

.skeleton-details {
  padding-top: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.skeleton-line {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.skeleton-title {
  height: 1.2rem;
  width: 80%;
}

.skeleton-category {
  height: 0.85rem;
  width: 50%;
  margin-bottom: 1.25rem;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
  margin-bottom: 1.25rem;
}

.skeleton-price-new {
  height: 1.25rem;
  width: 40%;
  margin-bottom: 0;
}

.skeleton-price-old {
  height: 0.9rem;
  width: 25%;
  margin-bottom: 0;
}

.skeleton-button {
  height: 38px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.05);
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
</style>
