<script setup lang="ts">
import type { UIMessage } from 'ai'
import { useChat } from '@ai-sdk/vue'
import { computed, nextTick, ref, watch } from 'vue'

const isOpen = ref(false)
const input = ref('')
const chatMessagesRef = ref<HTMLElement | null>(null)

// useChat() kết nối tự động tới /api/chat
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

// Simple lightweight markdown parser for bold, italic, line breaks & inline code
function renderFormattedText(text: string): string {
  if (!text)
    return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>')
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
      <span v-if="!isOpen" class="online-indicator" />
    </button>

    <!-- Chat Popup Window -->
    <Transition name="chat-slide">
      <div v-if="isOpen" class="chat-popup">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-info">
            <div class="bot-avatar">
              <span>🤖</span>
            </div>
            <div class="bot-details">
              <h4 class="bot-name">
                AI Tư Vấn Bán Hàng
              </h4>
              <span class="bot-status">
                <span class="status-dot" /> Trực tuyến
              </span>
            </div>
          </div>
          <button class="close-popup-btn" aria-label="Đóng chat" @click="toggleChat">
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
            <p>Hãy chọn hoặc nhập thắc mắc về sản phẩm, giá cả, tồn kho...</p>
            <div class="suggestion-chips">
              <button @click="sendPresetQuestion('Có sản phẩm iPhone nào không?')">
                📱 iPhone có sẵn không?
              </button>
              <button @click="sendPresetQuestion('Có sản phẩm nào giá dưới 1 triệu không?')">
                💰 Sản phẩm dưới 1 triệu
              </button>
              <button @click="sendPresetQuestion('Lấy danh sách các danh mục sản phẩm')">
                📁 Xem danh mục sản phẩm
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
              <div class="msg-text" v-html="renderFormattedText(getMessageText(msg))" />
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="message-row assistant">
            <div class="msg-avatar">
              🤖
            </div>
            <div class="msg-bubble loading-bubble">
              <span class="pulse-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="error" class="error-banner">
            ⚠️ {{ error.message || 'Có lỗi xảy ra khi kết nối tới AI!' }}
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
            <span>🚀</span>
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
  z-index: 9999;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.chat-floating-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  border: none;
  padding: 12px 22px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.chat-floating-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.45);
}

.chat-floating-btn.active {
  background: #1e293b;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.btn-icon {
  font-size: 1.2rem;
}

.online-indicator {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 10px;
  height: 10px;
  background: #22c55e;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

/* Popup Window */
.chat-popup {
  position: absolute;
  bottom: 68px;
  right: 0;
  width: 400px;
  max-width: calc(100vw - 32px);
  height: 560px;
  max-height: calc(100vh - 100px);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.chat-header {
  background: rgba(30, 41, 59, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-avatar {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
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
  gap: 6px;
  margin-top: 2px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px #22c55e;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.close-popup-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-popup-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Messages Area */
.chat-messages {
  flex: 1;
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-box {
  text-align: center;
  margin: auto 0;
  padding: 24px 12px;
  color: #cbd5e1;
}

.welcome-icon {
  font-size: 2.4rem;
  margin-bottom: 10px;
}

.welcome-box h5 {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.welcome-box p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 16px 0;
  line-height: 1.4;
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
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.suggestion-chips button:hover {
  background: rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
  color: #ffffff;
  transform: translateX(3px);
}

/* Message Rows */
.message-row {
  display: flex;
  gap: 10px;
  max-width: 88%;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.assistant {
  align-self: flex-start;
}

.msg-avatar {
  width: 30px;
  height: 30px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.msg-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
}

.message-row.user .msg-bubble {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.message-row.assistant .msg-bubble {
  background: rgba(30, 41, 59, 0.85);
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom-left-radius: 4px;
}

.msg-sender {
  font-size: 0.725rem;
  opacity: 0.65;
  margin-bottom: 4px;
  font-weight: 600;
}

.loading-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 0.85rem;
  font-style: italic;
}

.pulse-dots {
  display: inline-flex;
  gap: 4px;
}

.pulse-dots span {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  animation: pulse-dot 1.4s infinite ease-in-out both;
}

.pulse-dots span:nth-child(1) { animation-delay: -0.32s; }
.pulse-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes pulse-dot {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  font-size: 0.825rem;
  padding: 10px 14px;
  border-radius: 12px;
}

/* Form Input */
.chat-input-form {
  display: flex;
  padding: 14px;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  gap: 10px;
}

.chat-input-form input {
  flex: 1;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
}

.chat-input-form input:focus {
  border-color: #3b82f6;
  background: rgba(30, 41, 59, 0.9);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.send-btn {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
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

@media (max-width: 480px) {
  .chat-popup {
    bottom: 0;
    right: -24px;
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
