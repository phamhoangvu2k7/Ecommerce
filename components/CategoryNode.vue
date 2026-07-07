<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
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
        📁 {{ node.title }}
        <span class="node-pos">(Vị trí: {{ node.position }})</span>
        <span class="badge node-status" :class="[node.status === 'active' ? 'badge-active' : 'badge-inactive']">
          {{ node.status === 'active' ? 'Bán' : 'Dừng' }}
        </span>
      </span>

      <div class="node-actions">
        <button class="btn btn-secondary btn-action" title="Sửa" @click="emit('edit', node)">
          ✏️
        </button>
        <button class="btn btn-danger btn-action" title="Xóa" @click="emit('delete', node._id)">
          🗑️
        </button>
      </div>
    </div>

    <!-- Recursive render of child nodes -->
    <ul v-if="node.children && node.children.length > 0" class="tree-children">
      <CategoryNode
        v-for="child in node.children"
        :key="child._id"
        :node="child"
        @edit="(n) => emit('edit', n)"
        @delete="(id) => emit('delete', id)"
      />
    </ul>
  </li>
</template>

<style scoped>
.tree-node {
  margin: 0.5rem 0;
  list-style: none;
}

.node-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background-color var(--transition-speed);
}

.node-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.node-title {
  color: #fff;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.node-pos {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.node-status {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
}

.node-actions {
  display: flex;
  gap: 0.35rem;
}

.btn-action {
  padding: 0.25rem 0.35rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.tree-children {
  padding-left: 1.5rem;
  border-left: 1px dashed rgba(255, 255, 255, 0.1);
  margin-left: 0.75rem;
}
</style>
