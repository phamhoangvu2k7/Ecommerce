<template>
  <div class="premium-card skeleton-order animate-pulse" aria-busy="true" aria-label="Đang tải thông tin đơn hàng...">
    <div class="skeleton-header">
      <div class="skeleton-line skeleton-meta" />
      <div class="skeleton-status" />
    </div>

    <div class="skeleton-products">
      <div v-for="i in 2" :key="i" class="skeleton-product-item">
        <div class="skeleton-image" />
        <div class="skeleton-product-details">
          <div class="skeleton-line skeleton-prod-title" />
          <div class="skeleton-line skeleton-prod-qty" />
        </div>
        <div class="skeleton-line skeleton-prod-total" />
      </div>
    </div>

    <div class="skeleton-footer">
      <div class="skeleton-shipping">
        <div class="skeleton-line skeleton-ship-line-1" />
        <div class="skeleton-line skeleton-ship-line-2" />
      </div>
      <div class="skeleton-action-total">
        <div class="skeleton-line skeleton-total-price" />
        <div class="skeleton-button" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-order {
  padding: 1.5rem;
  background-color: var(--bg-card);
  margin-bottom: 1.5rem;
  pointer-events: none;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.skeleton-meta {
  height: 1.1rem;
  width: 250px;
}

.skeleton-status {
  height: 22px;
  width: 100px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.05);
}

.skeleton-products {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.skeleton-product-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.skeleton-image {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.05);
}

.skeleton-product-details {
  flex: 1;
}

.skeleton-prod-title {
  height: 1rem;
  width: 60%;
}

.skeleton-prod-qty {
  height: 0.85rem;
  width: 30%;
  margin-bottom: 0;
}

.skeleton-prod-total {
  height: 1rem;
  width: 80px;
}

.skeleton-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.skeleton-shipping {
  flex: 1;
}

.skeleton-ship-line-1 {
  height: 0.9rem;
  width: 80%;
}

.skeleton-ship-line-2 {
  height: 0.9rem;
  width: 90%;
  margin-bottom: 0;
}

.skeleton-action-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.skeleton-total-price {
  height: 1.25rem;
  width: 180px;
}

.skeleton-button {
  height: 32px;
  width: 120px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
}

.skeleton-line {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 0.5rem;
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

@media (max-width: 576px) {
  .skeleton-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .skeleton-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .skeleton-action-total {
    align-items: flex-start;
    width: 100%;
  }
}
</style>
