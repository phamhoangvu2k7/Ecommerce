<script setup lang="ts">
import { onMounted, ref } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

interface Role {
  id: string
  title: string
  description: string
  permissions: string[]
  deleted?: boolean
}

const roles = ref<Role[]>([])
const selectedRole = ref<Role | null>(null)
const loading = ref(true)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// New Role form state
const showCreateModal = ref(false)
const newRoleTitle = ref('')
const newRoleDesc = ref('')

// Perm categories
const permissionCategories = [
  {
    title: '📊 Tổng quan',
    perms: [
      { key: 'dashboard_view', label: 'Truy cập Dashboard' },
    ],
  },
  {
    title: '📦 Quản lý Sản phẩm',
    perms: [
      { key: 'products_view', label: 'Xem sản phẩm' },
      { key: 'products_create', label: 'Tạo sản phẩm mới' },
      { key: 'products_edit', label: 'Chỉnh sửa sản phẩm' },
      { key: 'products_delete', label: 'Xóa sản phẩm (mềm)' },
    ],
  },
  {
    title: '🗂️ Quản lý Danh mục',
    perms: [
      { key: 'categories_view', label: 'Xem danh mục' },
      { key: 'categories_create', label: 'Tạo danh mục mới' },
      { key: 'categories_edit', label: 'Chỉnh sửa danh mục' },
      { key: 'categories_delete', label: 'Xóa danh mục' },
    ],
  },
  {
    title: '🗑️ Thùng rác hệ thống',
    perms: [
      { key: 'trash_view', label: 'Xem dữ liệu đã xóa' },
      { key: 'trash_restore', label: 'Khôi phục dữ liệu' },
    ],
  },
  {
    title: '🔑 Quản lý Nhóm quyền (Roles)',
    perms: [
      { key: 'roles_view', label: 'Xem danh sách nhóm quyền' },
      { key: 'roles_create', label: 'Tạo nhóm quyền mới' },
      { key: 'roles_edit', label: 'Sửa thông tin nhóm quyền' },
      { key: 'roles_permissions', label: 'Cấu hình ma trận phân quyền' },
      { key: 'roles_delete', label: 'Xóa nhóm quyền' },
    ],
  },
  {
    title: '👥 Quản lý Tài khoản Admin',
    perms: [
      { key: 'accounts_view', label: 'Xem danh sách tài khoản' },
      { key: 'accounts_create', label: 'Tạo tài khoản quản lý' },
      { key: 'accounts_edit', label: 'Chỉnh sửa tài khoản' },
      { key: 'accounts_delete', label: 'Xóa tài khoản quản lý' },
    ],
  },
]

onMounted(async () => {
  await fetchRoles()
})

async function fetchRoles() {
  loading.value = true
  errorMsg.value = ''
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/roles', { headers })
    const data = await res.json()
    if (data.success) {
      roles.value = data.roles.filter((r: Role) => !r.deleted)
      if (roles.value.length > 0) {
        // Keep selection if exists, else select first
        if (selectedRole.value) {
          const found = roles.value.find(r => r.id === selectedRole.value?.id)
          selectedRole.value = found ? { ...found } : { ...roles.value[0] }
        }
        else {
          selectedRole.value = { ...roles.value[0] }
        }
      }
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi tải nhóm quyền.'
    }
  }
  catch (err) {
    errorMsg.value = 'Lỗi kết nối máy chủ.'
  }
  finally {
    loading.value = false
  }
}

function selectRole(role: Role) {
  selectedRole.value = { ...role }
}

function togglePermission(permKey: string) {
  if (!selectedRole.value)
    return
  const idx = selectedRole.value.permissions.indexOf(permKey)
  if (idx > -1) {
    selectedRole.value.permissions.splice(idx, 1)
  }
  else {
    selectedRole.value.permissions.push(permKey)
  }
}

async function handleSavePermissions() {
  if (!selectedRole.value)
    return
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = { 'Content-Type': 'application/json' }
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch(`/api/admin/roles/${selectedRole.value.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        title: selectedRole.value.title,
        description: selectedRole.value.description,
        permissions: selectedRole.value.permissions,
      }),
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Cập nhật nhóm quyền thành công!'
      await fetchRoles()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Không thể cập nhật.'
    }
  }
  catch (err) {
    errorMsg.value = 'Lỗi kết nối máy chủ.'
  }
  finally {
    saving.value = false
  }
}

async function handleCreateRole() {
  if (!newRoleTitle.value.trim()) {
    alert('Vui lòng nhập tên nhóm quyền.')
    return
  }
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = { 'Content-Type': 'application/json' }
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: newRoleTitle.value,
        description: newRoleDesc.value,
        permissions: [],
      }),
    })
    const data = await res.json()
    if (data.success) {
      showCreateModal.value = false
      newRoleTitle.value = ''
      newRoleDesc.value = ''
      successMsg.value = 'Thêm nhóm quyền mới thành công!'
      await fetchRoles()
      // Select the new role
      const newRole = roles.value.find(r => r.id === data.role.id)
      if (newRole)
        selectedRole.value = { ...newRole }
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi tạo nhóm quyền.')
    }
  }
  catch (err) {
    alert('Lỗi kết nối máy chủ.')
  }
}

async function handleDeleteRole() {
  if (!selectedRole.value)
    return
  if (selectedRole.value.title === 'Admin') {
    alert('Không thể xóa nhóm quyền hệ thống tối cao.')
    return
  }
  if (!confirm(`Bạn có chắc chắn muốn xóa nhóm quyền "${selectedRole.value.title}"?`))
    return

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch(`/api/admin/roles/${selectedRole.value.id}`, {
      method: 'DELETE',
      headers,
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Xóa nhóm quyền thành công!'
      selectedRole.value = null
      await fetchRoles()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Không thể xóa.'
    }
  }
  catch (err) {
    errorMsg.value = 'Lỗi kết nối máy chủ.'
  }
}
</script>

<template>
  <div class="roles-page">
    <div class="page-header mb-8">
      <div class="title-block">
        <h1 class="h1-title">
          Nhóm quyền & Phân quyền
        </h1>
        <p class="text-muted">
          Cấu hình vai trò và ma trận chức năng truy cập hệ thống.
        </p>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">
        ➕ Thêm nhóm quyền
      </button>
    </div>

    <!-- Alerts -->
    <div v-if="successMsg" class="alert alert-success fade-in-item">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <div v-if="loading && roles.length === 0" class="text-center py-6 text-muted">
      Đang tải danh sách nhóm quyền...
    </div>

    <div v-else class="roles-layout">
      <!-- Left List of Roles -->
      <div class="roles-sidebar">
        <div class="premium-card list-card">
          <h3 class="list-title mb-4">
            Danh sách vai trò
          </h3>
          <div class="role-items">
            <div
              v-for="role in roles"
              :key="role.id"
              class="role-item-btn" :class="[selectedRole?.id === role.id ? 'active-role' : '']"
              @click="selectRole(role)"
            >
              <div class="role-item-title">
                {{ role.title }}
              </div>
              <div class="role-item-desc text-muted">
                {{ role.description || 'Không mô tả' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Permissions Matrix Editor -->
      <div v-if="selectedRole" class="permissions-editor">
        <div class="premium-card editor-card">
          <div class="editor-header mb-6">
            <div class="editor-title-block">
              <h2 class="role-details-title">
                {{ selectedRole.title }}
              </h2>
              <p class="text-muted">
                Cấu hình quyền hạn truy cập của nhóm.
              </p>
            </div>
            <div class="editor-actions">
              <button
                v-if="selectedRole.title !== 'Admin'"
                class="btn btn-danger"
                @click="handleDeleteRole"
              >
                🗑️ Xóa vai trò
              </button>
              <button
                :disabled="saving"
                class="btn btn-primary"
                @click="handleSavePermissions"
              >
                {{ saving ? 'Đang lưu...' : '💾 Lưu cấu hình' }}
              </button>
            </div>
          </div>

          <!-- Edit Role Metadata inline -->
          <div class="metadata-fields mb-6">
            <div class="form-row-2">
              <div class="input-group">
                <label class="input-label">Tên nhóm quyền *</label>
                <input
                  v-model="selectedRole.title"
                  :disabled="selectedRole.title === 'Admin'"
                  type="text"
                  class="premium-input"
                >
              </div>
              <div class="input-group">
                <label class="input-label">Mô tả chi tiết</label>
                <input
                  v-model="selectedRole.description"
                  type="text"
                  class="premium-input"
                  placeholder="Ghi chú vai trò..."
                >
              </div>
            </div>
          </div>

          <!-- Permission Matrix Grid Categories -->
          <div class="matrix-sections">
            <div
              v-for="cat in permissionCategories"
              :key="cat.title"
              class="matrix-category mb-6"
            >
              <h4 class="category-heading mb-3">
                {{ cat.title }}
              </h4>
              <div class="matrix-checkbox-grid">
                <div
                  v-for="perm in cat.perms"
                  :key="perm.key"
                  class="checkbox-tile" :class="[selectedRole.permissions.includes(perm.key) ? 'tile-checked' : '']"
                  @click="togglePermission(perm.key)"
                >
                  <div class="tile-icon">
                    {{ selectedRole.permissions.includes(perm.key) ? '✅' : '⬛' }}
                  </div>
                  <div class="tile-label">
                    {{ perm.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Role Modal -->
    <div v-if="showCreateModal" class="modal-backdrop">
      <div class="modal-content premium-card glass-panel fade-in-item">
        <div class="modal-header">
          <h3 class="modal-title">
            Thêm nhóm quyền mới
          </h3>
          <button class="btn btn-secondary btn-close-modal" @click="showCreateModal = false">
            ✖
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleCreateRole">
          <div class="input-group">
            <label class="input-label">Tên nhóm quyền *</label>
            <input v-model="newRoleTitle" type="text" class="premium-input" placeholder="Ví dụ: Staff, Manager" required>
          </div>

          <div class="input-group">
            <label class="input-label">Mô tả nhóm quyền</label>
            <textarea v-model="newRoleDesc" rows="3" class="premium-input" placeholder="Mô tả vai trò này trong hệ thống..." />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
              Hủy
            </button>
            <button type="submit" class="btn btn-primary">
              Tạo mới
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-8 { margin-bottom: 2rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.roles-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* Sidebar lists of roles */
.list-card {
  padding: 1.25rem;
}
.list-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}
.role-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.role-item-btn {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.01);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-speed);
}
.role-item-btn:hover {
  background-color: rgba(255, 255, 255, 0.03);
  border-color: rgba(99, 102, 241, 0.2);
}
.active-role {
  background-color: rgba(99, 102, 241, 0.1) !important;
  border-color: var(--primary) !important;
}
.role-item-title {
  font-weight: 600;
  color: #fff;
  font-size: 0.95rem;
}
.role-item-desc {
  font-size: 0.75rem;
  margin-top: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Editor Section */
.editor-card {
  padding: 2rem;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
.role-details-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}
.editor-actions {
  display: flex;
  gap: 0.75rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Matrix layout checkboxes grid */
.category-heading {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  border-left: 3px solid var(--primary);
  padding-left: 0.5rem;
}
.matrix-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}
.checkbox-tile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background-color: rgba(15, 23, 42, 0.4);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-speed);
  user-select: none;
}
.checkbox-tile:hover {
  background-color: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.15);
}
.tile-checked {
  background-color: rgba(16, 185, 129, 0.08) !important;
  border-color: rgba(16, 185, 129, 0.3) !important;
}
.tile-icon {
  font-size: 1.1rem;
}
.tile-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #fff;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  width: 100%;
  max-width: 500px;
  padding: 2rem;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.btn-close-modal {
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
}
</style>
