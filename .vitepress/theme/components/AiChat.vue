<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <h3 class="chat-title">🤖 AI 智能问答</h3>
      <div class="chat-actions">
        <button class="btn-clear" @click="clearChat" title="清除对话">
          🗑️ 清空
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="chatMessages.length === 0" class="chat-welcome">
        <p>👋 你好！我是图灵学社 AI 助手。</p>
        <p>你可以问我关于编程学习、技术方向、竞赛经验等问题。</p>
      </div>

      <div
        v-for="(msg, index) in chatMessages"
        :key="index"
        :class="['chat-bubble', msg.role === 'user' ? 'bubble-user' : 'bubble-ai']"
      >
        <div class="bubble-avatar">{{ msg.role === 'user' ? '🧑' : '🤖' }}</div>
        <div class="bubble-content">
          <div class="bubble-text" v-html="renderMarkdown(msg.content)"></div>
          <div v-if="msg.role === 'ai' && msg.loading" class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea
          v-model="userInput"
          @keydown.enter.exact.prevent="sendMessage"
          placeholder="输入你的问题，按 Enter 发送..."
          rows="1"
          class="chat-input"
          :disabled="isStreaming"
        ></textarea>
        <button
          class="btn-send"
          @click="sendMessage"
          :disabled="!userInput.trim() || isStreaming"
        >
          {{ isStreaming ? '⏳' : '📤' }}
        </button>
      </div>
      <div class="input-hint">
        <span v-if="isStreaming" class="streaming-hint">AI 正在回复中...</span>
        <span v-else>Enter 发送 / Shift+Enter 换行</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { gsap } from 'gsap'

// ============ 配置 ============
// 后端 API 地址（开发时可替换）
const API_BASE_URL = 'http://localhost:8080/api/chat'

// ============ 状态 ============
const chatMessages = ref([])
const userInput = ref('')
const isStreaming = ref(false)
const messagesContainer = ref(null)
const sessionId = ref('')

// 生成唯一会话ID + 隐藏页面footer
onMounted(() => {
  sessionId.value = generateSessionId()
  // 隐藏 footer 让聊天组件占满页面
  document.body.classList.add('chat-fullscreen')
})

onUnmounted(() => {
  document.body.classList.remove('chat-fullscreen')
})

// 新消息动画
watch(() => chatMessages.value.length, () => {
  nextTick(() => {
    const bubbles = document.querySelectorAll('.chat-bubble')
    if (bubbles.length > 0) {
      const last = bubbles[bubbles.length - 1]
      gsap.from(last, { y: 20, opacity: 0, duration: 0.4, ease: 'power2.out' })
      const avatar = last.querySelector('.bubble-avatar')
      if (avatar) {
        gsap.from(avatar, { scale: 0, duration: 0.3, ease: 'back.out(2)', delay: 0.1 })
      }
    }
  })
})

/**
 * 发送消息并接收流式响应
 * 使用 fetch + ReadableStream 处理 SSE 流
 * （因为需要 POST 请求传递 prompt，原生 EventSource 只支持 GET）
 */
async function sendMessage() {
  const message = userInput.value.trim()
  if (!message || isStreaming.value) return

  // 添加用户消息到列表
  chatMessages.value.push({ role: 'user', content: message })
  userInput.value = ''
  scrollToBottom()

  // 添加 AI 占位消息
  const aiMessageIndex = chatMessages.value.length
  chatMessages.value.push({ role: 'ai', content: '', loading: true })

  isStreaming.value = true

  try {
    // 使用 fetch 发送 POST 请求，接收 SSE 流式响应
    const response = await fetch(`${API_BASE_URL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId.value,
        enableRag: true
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // 获取 ReadableStream 读取器
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    // 循环读取流数据
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 解码二进制数据
      buffer += decoder.decode(value, { stream: true })

      // 按行解析 SSE 数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留未完成的行

      for (const line of lines) {
        // SSE 格式：event: xxx\ndata: xxx
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim()

          // 检查是否为结束标记
          if (data === '[DONE]') {
            chatMessages.value[aiMessageIndex].loading = false
            break
          }

          // 追加文本（打字机效果）
          chatMessages.value[aiMessageIndex].content += data
          chatMessages.value[aiMessageIndex].loading = false
          scrollToBottom()
        } else if (line.startsWith('event:') && line.includes('error')) {
          // 处理错误事件
          chatMessages.value[aiMessageIndex].loading = false
        }
      }
    }

    // 流读取完成
    chatMessages.value[aiMessageIndex].loading = false

  } catch (error) {
    console.error('聊天请求失败:', error)
    chatMessages.value[aiMessageIndex].content = '抱歉，连接失败。请检查网络或稍后重试。'
    chatMessages.value[aiMessageIndex].loading = false
  } finally {
    isStreaming.value = false
    scrollToBottom()
  }
}

/**
 * 清空对话记录并通知后端清除会话记忆
 */
async function clearChat() {
  if (chatMessages.value.length === 0) return

  try {
    // 通知后端清除会话记忆
    await fetch(`${API_BASE_URL}/clear/${sessionId.value}`, {
      method: 'POST'
    })
  } catch (e) {
    console.warn('清除后端会话失败:', e)
  }

  chatMessages.value = []
  sessionId.value = generateSessionId()
}

/**
 * 简单 Markdown 渲染（代码块、加粗、斜体、链接）
 */
function renderMarkdown(text) {
  if (!text) return ''
  return text
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 加粗
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 换行
    .replace(/\n/g, '<br>')
}

/**
 * 滚动到消息底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

/**
 * 生成会话ID
 */
function generateSessionId() {
  return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  height: calc(100dvh - 100px);
  margin: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.chat-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.btn-clear {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.btn-clear:hover {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  -webkit-overflow-scrolling: touch;
}

.chat-welcome {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 40px 20px;
}

.chat-welcome p {
  margin: 8px 0;
}

.chat-bubble {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.bubble-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bubble-ai {
  align-self: flex-start;
}

.bubble-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.bubble-content {
  padding: 10px 16px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
}

.bubble-user .bubble-content {
  background: var(--vp-c-brand);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-ai .bubble-content {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-bottom-left-radius: 4px;
}

.bubble-text :deep(pre) {
  background: var(--vp-c-bg-alt);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.bubble-text :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.bubble-text :deep(a) {
  color: var(--vp-c-brand);
  text-decoration: underline;
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}

/* 输入区域 - 固定在底部 */
.chat-input-area {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 900px;
  margin: 0 auto;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.chat-input:focus {
  border-color: var(--vp-c-brand);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-send {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand);
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-send:not(:disabled):hover {
  opacity: 0.8;
}

.input-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.streaming-hint {
  color: var(--vp-c-brand);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ===== 平板 (≤768px) ===== */
@media (max-width: 768px) {
  .ai-chat-container {
    height: calc(100dvh - 120px);
    border-radius: 8px;
  }

  .chat-header {
    padding: 10px 14px;
    border-radius: 8px 8px 0 0;
  }

  .chat-title {
    font-size: 15px;
  }

  .btn-clear {
    padding: 5px 10px;
    font-size: 12px;
  }

  .chat-messages {
    padding: 14px;
    gap: 12px;
  }

  .chat-bubble {
    max-width: 92%;
  }

  .bubble-avatar {
    font-size: 22px;
  }

  .bubble-content {
    padding: 8px 12px;
    font-size: 13px;
  }

  .chat-input-area {
    padding: 10px 14px 14px;
  }

  .chat-input {
    font-size: 14px;
    padding: 8px 12px;
  }

  .btn-send {
    padding: 8px 14px;
    font-size: 15px;
    min-width: 44px;
    min-height: 44px;
  }

  .input-hint {
    font-size: 11px;
  }
}

/* ===== 手机 (≤480px) ===== */
@media (max-width: 480px) {
  .ai-chat-container {
    height: calc(100dvh - 100px);
    border-radius: 0;
  }

  .chat-header {
    padding: 8px 12px;
    border-radius: 0;
  }

  .chat-messages {
    padding: 10px;
    gap: 10px;
  }

  .chat-welcome {
    padding: 24px 12px;
  }

  .chat-welcome p {
    font-size: 0.9rem;
    margin: 6px 0;
  }

  .chat-bubble {
    max-width: 95%;
    gap: 6px;
  }

  .bubble-avatar {
    font-size: 20px;
  }

  .bubble-content {
    padding: 7px 10px;
    font-size: 13px;
    border-radius: 10px;
  }

  .chat-input-area {
    padding: 8px 10px 12px;
  }

  .input-wrapper {
    gap: 6px;
  }

  .chat-input {
    font-size: 14px;
    padding: 8px 10px;
  }

  .btn-send {
    padding: 8px 12px;
    font-size: 14px;
    min-width: 44px;
    min-height: 44px;
  }

  .bubble-text :deep(pre) {
    padding: 8px;
    font-size: 11px;
  }

  .bubble-text :deep(code) {
    font-size: 11px;
  }
}
</style>
