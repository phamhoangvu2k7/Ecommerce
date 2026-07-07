<script setup lang="ts">
import CategoryNode from '~/components/CategoryNode.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const categoryTree = ref<any[]>([])
const flatCategories = ref<any[]>([])

const loading = ref(true)
const successMsg = ref('')

// Mode status
const isEditing = ref(false)
const editingId = ref<string | null>(null)

// Form Fields
const formTitle = ref('')
const formParent = ref('')
const formDescription = ref('')
const formStatus = ref('active')
const formPosition = ref(0)

onMounted(async () => {
  await fetchCategories()
})

async function fetchCategories() {
  loading.value = true
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/categories', { headers })
    const data = await res.json()
    if (data.success) {
      categoryTree.value = data.tree
      flatCategories.value = flattenTree(data.tree)
    }
  }
  catch (err) {
    console.error('Error fetching categories:', err)
  }
  finally {
    loading.value = false
  }
}

function flattenTree(nodes: any[]): any[] {
  let list: any[] = []
  for (const node of nodes) {
    list.push(node)
    if (node.children && node.children.length > 0) {
      list = [...list, ...flattenTree(node.children)]
    }
  }
  return list
}

function resetForm() {
  formTitle.value = ''
  formParent.value = ''
  formDescription.value = ''
  formStatus.value = 'active'
  formPosition.value = 0
  isEditing.value = false
  editingId.value = null
}

function editCategory(cat: any) {
  isEditing.value = true
  editingId.value = cat._id
  formTitle.value = cat.title
  formParent.value = cat.parent_id || ''
  formDescription.value = cat.description || ''
  formStatus.value = cat.status
  formPosition.value = cat.position
}

async function handleSaveCategory() {
  if (!formTitle.value) {
    alert('Vui lòng điền tiêu đề danh mục.')
    return
  }

  // Prevent self parent loop
  if (isEditing.value && editingId.value === formParent.value) {
    alert('Danh mục cha không thể là chính nó.')
    return
  }

  const payload = {
    title: formTitle.value,
    parent_id: formParent.value || null,
    description: formDescription.value,
    status: formStatus.value,
    position: Number(formPosition.value),
  }

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = { 'Content-Type': 'application/json' }
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    let res
    if (isEditing.value && editingId.value) {
      res = await fetch(`/api/admin/categories/${editingId.value}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })
    }
    else {
      res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
    }

    const data = await res.json()
    if (data.success) {
      successMsg.value = isEditing.value ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục mới thành công!'
      resetForm()
      await fetchCategories()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi lưu danh mục.')
    }
  }
  catch (err) {
    alert('Không thể lưu danh mục.')
  }
}

async function handleDeleteCategory(id: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa danh mục này? Nó sẽ được đưa vào Thùng rác.'))
    return

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers,
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Xóa danh mục thành công!'
      resetForm()
      await fetchCategories()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi xóa danh mục.')
    }
  }
  catch (err) {
    alert('Lỗi kết nối máy chủ.')
  }
}
</script>

<template>
  <div class="admin-categories-page">
    <div class="page-header mb-8">
      <h1 class="h1-title">
        Quản lý danh mục
      </h1>
      <p class="text-muted">
        Xem cấu trúc phân cấp danh mục sản phẩm dạng cây.
      </p>
    </div>

    <div v-if="successMsg" class="alert alert-success fade-in-item">
      {{ successMsg }}
    </div>

    <div class="categories-layout">
      <!-- Left side: Category Tree -->
      <div class="categories-tree-section premium-card">
        <h3 class="section-title border-b">
          Cấu trúc cây danh mục
        </h3>

        <div v-if="loading" class="text-center py-6 text-muted">
          Đang tải cấu trúc cây...
        </div>
        <div v-else-if="categoryTree.length === 0" class="text-center py-6 text-muted">
          Chưa có danh mục nào.
        </div>

        <div v-else class="tree-container">
          <ul class="tree-root">
            <CategoryNode
              v-for="node in categoryTree"
              :key="node._id"
              :node="node"
              @edit="editCategory"
              @delete="handleDeleteCategory"
            />
          </ul>
        </div>
      </div>

      <!-- Right side: Create/Edit Form panel -->
      <div class="category-form-section premium-card">
        <h3 class="section-title border-b">
          {{ isEditing ? '✏️ Chỉnh sửa danh mục' : '➕ Tạo danh mục mới' }}
        </h3>

        <form class="category-form" @submit.prevent="handleSaveCategory">
          <div class="input-group">
            <label class="input-label">Tên danh mục *</label>
            <input v-model="formTitle" type="text" class="premium-input" placeholder="Tên danh mục" required>
          </div>

          <div class="input-group">
            <label class="input-label">Danh mục cha</label>
            <select v-model="formParent" class="premium-input">
              <option value="">
                Không có (Danh mục gốc)
              </option>
              <!-- Exclude editing category from parent choices to avoid self-loop -->
              <option
                v-for="cat in flatCategories.filter(c => c._id !== editingId)"
                :key="cat._id"
                :value="cat._id"
              >
                {{ cat.title }}
              </option>
            </select>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Trạng thái hoạt động</label>
              <select v-model="formStatus" class="premium-input">
                <option value="active">
                  Hoạt động
                </option>
                <option value="inactive">
                  Dừng hoạt động
                </option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Vị trí sắp xếp</label>
              <input v-model="formPosition" type="number" class="premium-input">
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">Mô tả danh mục</label>
            <textarea v-model="formDescription" rows="4" class="premium-input text-area-input" placeholder="Mô tả danh mục" />
          </div>

          <div class="form-actions">
            <button v-if="isEditing" type="button" class="btn btn-secondary" @click="resetForm">
              Hủy chỉnh sửa
            </button>
            <button type="submit" class="btn btn-primary">
              {{ isEditing ? 'Lưu cập nhật' : 'Tạo mới' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-8 { margin-bottom: 2rem; }
.text-muted { color: var(--text-muted); font-size: 0.9rem; }
.border-b { border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1.5rem; }

.categories-layout {
  display: flex;
  gap: 2rem;
}

@media (max-width: 992px) {
  .categories-layout {
    flex-direction: column;
  }
}

.categories-tree-section {
  flex: 1.3;
  padding: 1.5rem;
}

.category-form-section {
  flex: 1;
  padding: 1.5rem;
  align-self: flex-start;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
}

.category-form {
  display: flex;
  flex-direction: column;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.text-area-input {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Tree Component styles */
.tree-container {
  max-height: 500px;
  overflow-y: auto;
}

.tree-root {
  list-style: none;
  padding-left: 0;
}
</style>
