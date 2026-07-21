<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

defineProps({
  node: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete'])
</script>

<script lang="ts">
export default {
  name: 'CategoryNode',
}
</script>

<!-- Define component name for recursive invocation -->
<template>
  <li class="tree-node">
    <div class="node-wrapper">
      <span class="node-title">
        <span class="folder-icon">📁</span>
        <span class="title-text">{{ node.title }}</span>
        <span class="node-pos">(Vị trí: {{ node.position }})</span>
        <span class="badge node-status" :class="[node.status === 'active' ? 'badge-active' : 'badge-inactive']">
          {{ node.status === 'active' ? 'Hoạt động' : 'Tạm dừng' }}
        </span>
      </span>

      <div class="node-actions">
        <button class="btn btn-secondary btn-action" title="Chỉnh sửa" @click="emit('edit', node)">
          ✏️
        </button>
        <button class="btn btn-danger btn-action" title="Xóa" @click="emit('delete', node.id)">
          🗑️
        </button>
      </div>
    </div>

    <!-- Recursive render of child nodes -->
    <ul v-if="node.children && node.children.length > 0" class="tree-children">
      <CategoryNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @edit="(n) => emit('edit', n)"
        @delete="(id) => emit('delete', id)"
      />
    </ul>
  </li>
</template>

<style scoped>
.tree-node {
  margin: 0.4rem 0;
  list-style: none;
}

.node-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.85rem;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all var(--transition-speed) ease;
}

.node-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: var(--border-color-hover);
}

.node-title {
  color: var(--text-main);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
}

.folder-icon {
  font-size: 0.95rem;
}

.title-text {
  letter-spacing: -0.01em;
}

.node-pos {
  font-size: 0.775rem;
  font-weight: 500;
  color: var(--text-dim);
}

.node-status {
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.node-actions {
  display: flex;
  gap: 0.35rem;
}

.btn-action {
  padding: 0.25rem 0.45rem;
  border-radius: 6px;
  font-size: 0.8rem;
  line-height: 1;
}

.tree-children {
  padding-left: 1.25rem;
  border-left: 1px dashed var(--border-color);
  margin-left: 0.85rem;
  margin-top: 0.2rem;
}
</style>
