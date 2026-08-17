<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  required?: boolean
  minlength?: number | string
  disabled?: boolean
  id?: string
  name?: string
  autocomplete?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const showPassword = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="password-input-wrapper">
    <input
      :id="id"
      :type="showPassword ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="placeholder || 'Nhập mật khẩu'"
      :required="required"
      :minlength="minlength"
      :disabled="disabled"
      :name="name"
      :autocomplete="autocomplete"
      class="premium-input password-input"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <button
      type="button"
      class="btn-toggle-eye"
      :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
      :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
      tabindex="-1"
      @click="togglePassword"
    >
      <!-- Eye-Off Icon (When password is visible) -->
      <svg
        v-if="showPassword"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="eye-icon"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>

      <!-- Eye Icon (When password is hidden) -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="eye-icon"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.password-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.password-input {
  width: 100%;
  padding-right: 2.75rem !important;
}

.btn-toggle-eye {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-dim, #94a3b8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border-radius: 6px;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.btn-toggle-eye:hover {
  color: var(--text-main, #f8fafc);
  background-color: rgba(255, 255, 255, 0.08);
}

.btn-toggle-eye:focus-visible {
  outline: 2px solid var(--accent-color, #6366f1);
  outline-offset: 2px;
}

.eye-icon {
  display: block;
}
</style>
