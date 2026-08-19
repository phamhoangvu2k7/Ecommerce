<script setup lang="ts">
import type { UIMessage } from 'ai'
import { useChat } from '@ai-sdk/vue'
import { computed, nextTick, ref, watch } from 'vue'

const isOpen = ref(false)
const input = ref('')
const chatMessagesRef = ref<HTMLElement | null>(null)

// useChat() mặc định kết nối tới API route /api/chat
const { messages, status, error, sendMessage } = useChat()

const isLoading = computed(() => status.value === 'submitted' || status.value === 'streaming')

function toggleChat() {
  isOpen.value = !isOpen.value
}

function getMessageText(msg: UIMessage): string {
  if ('content' in msg && typeof (msg as any).content === 'string') {
    return (msg as any).content
  }
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('')
  }
  return ''
}

function handleFormSubmit() {
  if (!input.value.trim() || isLoading.value)
    return
  const text = input.value.trim()
  input.value = ''
  sendMessage({ text })
}

function sendPresetQuestion(text: string) {
  input.value = text
  handleFormSubmit()
}

// Auto-scroll to bottom when new streaming messages arrive
watch(
  () => messages.value.length ? getMessageText(messages.value[messages.value.length - 1]) : '',
  async () => {
    await nextTick()
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  },
)
</script>

<template>
  <div class="ai-widget-container">
    <!-- Floating Chat Trigger Button -->
    <button
      class="chat-floating-btn"
      :class="{ active: isOpen }"
      aria-label="Chat với AI Trợ Lý"
      @click="toggleChat"
    >
      <span v-if="!isOpen" class="btn-icon">🤖</span>
      <span v-else class="btn-icon">✕</span>
      <span v-if="!isOpen" class="btn-text">Trợ Lý AI</span>
    </button>

    <!-- Chat Popup Window -->
    <Transition name="chat-slide">
      <div v-if="isOpen" class="chat-popup">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-info">
            <div class="bot-avatar">
              🤖
            </div>
            <div>
              <h4 class="bot-name">
                AI Tư Vấn Bán Hàng
              </h4>
              <span class="bot-status">
                <span class="status-dot" /> Trực tuyến &middot; Tìm kiếm Real-time DB
              </span>
            </div>
          </div>
          <button class="close-popup-btn" @click="toggleChat">
            ✕
          </button>
        </div>

        <!-- Messages Area -->
        <div ref="chatMessagesRef" class="chat-messages">
          <div v-if="messages.length === 0" class="welcome-box">
            <div class="welcome-icon">
              ✨
            </div>
            <h5>Xin chào! Tôi có thể giúp gì cho bạn?</h5>
            <p>Hãy thử đặt câu hỏi như:</p>
            <div class="suggestion-chips">
              <button @click="sendPresetQuestion('Có sản phẩm iPhone nào không?')">
                📱 iPhone có sẵn không?
              </button>

              <button @click="sendPresetQuestion('Lấy danh sách các danh mục sản phẩm')">
                📁 Danh mục sản phẩm
              </button>
            </div>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-row"
            :class="[msg.role]"
          >
            <div v-if="msg.role === 'assistant'" class="msg-avatar">
              🤖
            </div>
            <div class="msg-bubble">
              <div class="msg-sender">
                {{ msg.role === 'user' ? 'Bạn' : 'Trợ lý AI' }}
              </div>
              <div class="msg-text">
                {{ getMessageText(msg) }}
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="message-row assistant">
            <div class="msg-avatar">
              🤖
            </div>
            <div class="msg-bubble loading-bubble">
              <span class="dot-flashing" /> AI đang truy vấn Database sản phẩm...
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="error" class="error-banner">
            ⚠️ {{ error.message || 'Có lỗi xảy ra khi gửi tin nhắn!' }}
          </div>
        </div>

        <!-- Form Input -->
        <form class="chat-input-form" @submit.prevent="handleFormSubmit">
          <input
            v-model="input"
            type="text"
            placeholder="Nhập thắc mắc về sản phẩm, giá cả..."
            :disabled="isLoading"
          >
          <button type="submit" class="send-btn" :disabled="isLoading || !input.trim()">
            🚀
          </button>
        </form>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ai-widget-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999;
  font-family: inherit;
}

.chat-floating-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.chat-floating-btn:hover {
  transform: translateY(-3px) scale(1.03);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.5);
}

.chat-floating-btn.active {
  background: #1e293b;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Popup Window */
.chat-popup {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: 380px;
  max-width: calc(100vw - 32px);
  height: 540px;
  max-height: calc(100vh - 100px);
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.chat-header {
  background: rgba(30, 41, 59, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bot-avatar {
  width: 36px;
  height: 36px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.bot-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
}

.bot-status {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 6px #22c55e;
}

.close-popup-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.close-popup-btn:hover {
  color: #ffffff;
}

/* Messages Area */
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.welcome-box {
  text-align: center;
  margin: auto 0;
  padding: 20px 10px;
  color: #cbd5e1;
}

.welcome-icon {
  font-size: 2.2rem;
  margin-bottom: 8px;
}

.welcome-box h5 {
  margin: 0 0 6px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #f8fafc;
}

.welcome-box p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 14px;
}

.suggestion-chips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-chips button {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.825rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.suggestion-chips button:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #ffffff;
}

/* Message Rows */
.message-row {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.assistant {
  align-self: flex-start;
}

.msg-avatar {
  width: 28px;
  height: 28px;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-row.user .msg-bubble {
  background: #2563eb;
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.message-row.assistant .msg-bubble {
  background: rgba(30, 41, 59, 0.9);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom-left-radius: 4px;
}

.msg-sender {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-bottom: 2px;
}

.loading-bubble {
  color: #94a3b8;
  font-size: 0.825rem;
  font-style: italic;
}

.error-banner {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  color: #fca5a5;
  font-size: 0.8rem;
  padding: 8px 12px;
  border-radius: 10px;
}

/* Form Input */
.chat-input-form {
  display: flex;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  gap: 8px;
}

.chat-input-form input {
  flex: 1;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input-form input:focus {
  border-color: #3b82f6;
}

.send-btn {
  background: #2563eb;
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
