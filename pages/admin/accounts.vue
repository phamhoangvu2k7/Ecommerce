<script setup lang="ts">
import { useAuthStore } from '~/stores/auth.ts'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

interface Role {
  id: string
  title: string
}

interface Account {
  id: string
  fullName: string
  email: string
  phone: string
  avatar?: string
  role_id: Role | null
  status: 'active' | 'inactive'
  deleted?: boolean
}

const authStore = useAuthStore()
const accounts = ref<Account[]>([])
const roles = ref<Role[]>([])
const loading = ref(true)
const successMsg = ref('')
const errorMsg = ref('')

// Modal & Form States
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

// Form Fields
const formFullName = ref('')
const formEmail = ref('')
const formPassword = ref('')
const formPhone = ref('')
const formRole = ref('')
const formStatus = ref<'active' | 'inactive'>('active')

onMounted(async () => {
  await fetchRoles()
  await fetchAccounts()
})

async function fetchRoles() {
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/roles', { headers })
    const data = await res.json()
    if (data.success) {
      roles.value = data.roles.filter((r: any) => !r.deleted)
    }
  }
  catch (err) {
    console.error('Error loading roles:', err)
  }
}

async function fetchAccounts() {
  loading.value = true
  errorMsg.value = ''
  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch('/api/admin/accounts', { headers })
    const data = await res.json()
    if (data.success) {
      accounts.value = data.accounts.filter((a: Account) => !a.deleted)
    }
    else {
      errorMsg.value = data.message || data.statusMessage || 'Lỗi tải tài khoản quản trị.'
    }
  }
  catch (err) {
    errorMsg.value = 'Lỗi kết nối máy chủ.'
  }
  finally {
    loading.value = false
  }
}

function resetForm() {
  formFullName.value = ''
  formEmail.value = ''
  formPassword.value = ''
  formPhone.value = ''
  formRole.value = ''
  formStatus.value = 'active'
  editingId.value = null
}

function openCreateModal() {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

function openEditModal(account: Account) {
  resetForm()
  isEditing.value = true
  editingId.value = account.id

  formFullName.value = account.fullName
  formEmail.value = account.email
  formPhone.value = account.phone || ''
  formRole.value = account.role_id?.id || ''
  formStatus.value = account.status
  showModal.value = true
}

async function handleSaveAccount() {
  if (!formFullName.value || !formEmail.value) {
    alert('Họ tên và email là thông tin bắt buộc.')
    return
  }
  if (!isEditing.value && !formPassword.value) {
    alert('Vui lòng nhập mật khẩu cho tài khoản mới.')
    return
  }

  const payload: any = {
    fullName: formFullName.value,
    email: formEmail.value,
    role_id: formRole.value || null,
    phone: formPhone.value,
    status: formStatus.value,
  }
  if (formPassword.value) {
    payload.password = formPassword.value
  }

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = { 'Content-Type': 'application/json' }
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    let res
    if (isEditing.value && editingId.value) {
      res = await fetch(`/api/admin/accounts/${editingId.value}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })
    }
    else {
      res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
    }

    const data = await res.json()
    if (data.success) {
      successMsg.value = isEditing.value ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản quản trị thành công!'
      showModal.value = false
      resetForm()
      await fetchAccounts()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi lưu tài khoản.')
    }
  }
  catch (err) {
    alert('Lỗi kết nối máy chủ.')
  }
}

async function handleDeleteAccount(account: Account) {
  if (String(account.id) === String(authStore.admin?.id)) {
    alert('Bạn không thể tự xóa tài khoản của chính mình.')
    return
  }

  if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${account.fullName}"?`))
    return

  try {
    const adminToken = localStorage.getItem('adminToken')
    const headers: any = {}
    if (adminToken)
      headers.Authorization = `Bearer ${adminToken}`

    const res = await fetch(`/api/admin/accounts/${account.id}`, {
      method: 'DELETE',
      headers,
    })
    const data = await res.json()
    if (data.success) {
      successMsg.value = 'Xóa tài khoản thành công!'
      await fetchAccounts()
      setTimeout(() => (successMsg.value = ''), 4000)
    }
    else {
      alert(data.message || data.statusMessage || 'Lỗi xóa tài khoản.')
    }
  }
  catch (err) {
    alert('Lỗi kết nối máy chủ.')
  }
}
</script>

<template>
  <div class="accounts-page">
    <div class="page-header mb-8">
      <div class="title-block">
        <h1 class="h1-title">
          Tài khoản Quản trị
        </h1>
        <p class="text-muted">
          Danh sách nhân viên, biên tập viên và quản trị viên quản lý hệ thống.
        </p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        ➕ Thêm tài khoản mới
      </button>
    </div>

    <!-- Feedback alerts -->
    <div v-if="successMsg" class="alert alert-success fade-in-item">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="alert alert-error">
      {{ errorMsg }}
    </div>

    <!-- Accounts Table Card -->
    <div class="premium-card table-card overflow-x">
      <table class="premium-table">
        <thead>
          <tr>
            <th width="60">
              Avatar
            </th>
            <th>Họ và tên</th>
            <th>Email tài khoản</th>
            <th>Số điện thoại</th>
            <th>Nhóm quyền (Vai trò)</th>
            <th>Trạng thái</th>
            <th width="150" class="text-center">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && accounts.length === 0">
            <td colspan="7" class="text-center py-6 text-muted">
              Đang tải danh sách tài khoản...
            </td>
          </tr>
          <tr v-else-if="accounts.length === 0">
            <td colspan="7" class="text-center py-6 text-muted">
              Không tìm thấy tài khoản quản trị nào.
            </td>
          </tr>
          <tr v-for="acc in accounts" :key="acc.id" class="table-row">
            <td>
              <div class="user-avatar-sm">
                {{ acc.fullName.charAt(0) }}
              </div>
            </td>
            <td class="font-semibold text-white">
              {{ acc.fullName }}
            </td>
            <td class="text-glow-indigo font-semibold">
              {{ acc.email }}
            </td>
            <td class="text-muted">
              {{ acc.phone || 'Chưa cung cấp' }}
            </td>
            <td>
              <span class="role-badge">
                🔑 {{ acc.role_id?.title || 'Chưa phân vai trò' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="[acc.status === 'active' ? 'badge-active' : 'badge-inactive']">
                {{ acc.status === 'active' ? 'Hoạt động' : 'Bị khóa' }}
              </span>
            </td>
            <td class="text-center">
              <div class="table-actions">
                <button class="btn btn-secondary btn-action" title="Sửa" @click="openEditModal(acc)">
                  ✏️
                </button>
                <button
                  :disabled="String(acc.id) === String(authStore.admin?.id)"
                  class="btn btn-danger btn-action"
                  title="Xóa"
                  @click="handleDeleteAccount(acc)"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal-content premium-card glass-panel fade-in-item">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? 'Cập nhật tài khoản quản trị' : 'Thêm tài khoản quản trị mới' }}
          </h3>
          <button class="btn btn-secondary btn-close-modal" @click="showModal = false">
            ✖
          </button>
        </div>

        <form class="modal-form" @submit.prevent="handleSaveAccount">
          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Họ và tên *</label>
              <input v-model="formFullName" type="text" class="premium-input" placeholder="Nguyễn Văn A" required>
            </div>
            <div class="input-group">
              <label class="input-label">Số điện thoại</label>
              <input v-model="formPhone" type="text" class="premium-input" placeholder="0901234567">
            </div>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Địa chỉ Email *</label>
              <input v-model="formEmail" type="email" class="premium-input" placeholder="admin@example.com" required>
            </div>
            <div class="input-group">
              <label class="input-label">Mật khẩu {{ isEditing ? '(để trống nếu giữ nguyên)' : '*' }}</label>
              <input v-model="formPassword" type="password" class="premium-input" placeholder="••••••••" :required="!isEditing">
            </div>
          </div>

          <div class="form-row-2">
            <div class="input-group">
              <label class="input-label">Nhóm vai trò (Role)</label>
              <select v-model="formRole" class="premium-input">
                <option value="">
                  Chọn vai trò
                </option>
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.title }}
                </option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Trạng thái hoạt động</label>
              <select v-model="formStatus" class="premium-input">
                <option value="active">
                  Hoạt động
                </option>
                <option value="inactive">
                  Khóa tài khoản
                </option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">
              Hủy
            </button>
            <button type="submit" class="btn btn-primary">
              Lưu lại
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mb-8 { margin-bottom: 2rem; }
.text-center { text-align: center; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Table styling */
.overflow-x {
  overflow-x: auto;
}
.premium-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.premium-table th {
  padding: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}
.premium-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.95rem;
}
.table-row:hover {
  background-color: rgba(255, 255, 255, 0.01);
}

.user-avatar-sm {
  width: 32px;
  height: 32px;
  background-color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 0.9rem;
}

.text-glow-indigo {
  color: #818cf8;
}

.role-badge {
  background-color: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.table-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
.btn-action {
  padding: 0.4rem;
  border-radius: 6px;
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
  max-width: 600px;
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
.modal-form {
  display: flex;
  flex-direction: column;
}
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
