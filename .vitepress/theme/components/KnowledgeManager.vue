<template>
  <div class="km-page">
    <div class="km-header">
      <h1>📚 知识库管理</h1>
      <p>管理图灵学社知识库文档，支持 RAG 语义检索</p>
      <button class="btn-add" @click="openEditor()">+ 添加文档</button>
    </div>

    <!-- 统计 -->
    <div class="km-stats">
      <div class="stat-card"><span class="stat-num">{{ documents.length }}</span>篇文档</div>
      <div class="stat-card"><span class="stat-num">🔍</span>语义检索</div>
      <div class="stat-card"><span class="stat-num">Ollama</span>向量模型</div>
    </div>

    <!-- RAG 检索测试 -->
    <div class="rag-test">
      <h3>🧪 RAG 检索测试</h3>
      <div class="rag-input-row">
        <input v-model="ragQuery" type="text" placeholder="输入问题，测试语义检索..."
          class="rag-input" @keydown.enter="testRag" />
        <button class="btn-rag" @click="testRag" :disabled="ragLoading">
          {{ ragLoading ? '检索中…' : '检索' }}
        </button>
      </div>

      <div v-if="ragResults" class="rag-results">
        <div v-if="ragResults.vectorResults && ragResults.vectorResults.length > 0" class="rag-section">
          <h4>🔍 语义匹配（向量相似度）</h4>
          <div v-for="(r, idx) in ragResults.vectorResults" :key="idx" class="rag-hit">
            <div class="rag-hit-source">
              <span class="rag-sim">{{ r.similarity }}%</span>
              📄 {{ r.source }}
            </div>
            <p class="rag-hit-text">{{ r.text.substring(0, 200) }}...</p>
          </div>
        </div>
        <div v-if="ragResults.vectorResults && ragResults.vectorResults.length === 0" class="rag-empty">
          未找到语义匹配结果，试试其他关键词
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">⏳ 加载中...</div>

    <!-- 文档列表 -->
    <div v-if="!loading" class="km-doc-list">
      <h3>📋 文档列表（{{ documents.length }} 篇）</h3>
      <div v-if="documents.length === 0" class="km-empty">
        还没有文档，点击上方「添加文档」按钮创建第一篇知识库文章
      </div>

      <div v-for="doc in documents" :key="doc.id" class="km-doc-card">
        <div class="km-doc-header">
          <h4>{{ doc.title }}</h4>
          <span class="km-cat" v-if="doc.category">{{ doc.category }}</span>
        </div>
        <p class="km-doc-preview">{{ doc.content.substring(0, 150) }}...</p>
        <div class="km-doc-tags" v-if="doc.tags">
          <span v-for="tag in doc.tags.split(',')" :key="tag" class="km-tag">{{ tag.trim() }}</span>
        </div>
        <div class="km-doc-actions">
          <span class="km-date">{{ doc.updatedAt ? doc.updatedAt.substring(0,10) : '' }}</span>
          <button class="km-btn-edit" @click="openEditor(doc)">编辑</button>
          <button class="km-btn-del" @click="deleteDoc(doc.id)">删除</button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <Teleport to="body">
      <div v-if="showEditor" class="km-overlay" @click.self="showEditor = false">
        <div class="km-modal">
          <div class="km-modal-header">
            <h2>{{ editingDoc ? '编辑文档' : '添加文档' }}</h2>
            <button class="km-modal-close" @click="showEditor = false">&times;</button>
          </div>
          <form class="km-form" @submit.prevent="saveDoc">
            <label class="km-field">
              <span>标题 *</span>
              <input v-model="form.title" type="text" required placeholder="文档标题" class="km-input" />
            </label>
            <div class="km-row">
              <label class="km-field">
                <span>分类</span>
                <select v-model="form.category" class="km-input">
                  <option value="">未分类</option>
                  <option>社团概况</option>
                  <option>竞赛学习</option>
                  <option>学习资源</option>
                  <option>技术指南</option>
                  <option>其他</option>
                </select>
              </label>
              <label class="km-field">
                <span>标签（逗号分隔）</span>
                <input v-model="form.tags" type="text" placeholder="如: ACM,算法,竞赛" class="km-input" />
              </label>
            </div>
            <label class="km-field">
              <span>正文 *（支持 Markdown）</span>
              <textarea v-model="form.content" required rows="10" placeholder="文档正文内容" class="km-textarea"></textarea>
            </label>
            <div class="km-form-actions">
              <button type="button" class="km-btn-cancel" @click="showEditor = false">取消</button>
              <button type="submit" class="km-btn-save" :disabled="saving">
                {{ saving ? '保存中…' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface KnowledgeDoc {
  id?: number
  title: string
  content: string
  category: string
  tags: string
  updatedAt?: string
}

const API = 'http://localhost:8080/api/knowledge/admin/documents'

const documents = ref<KnowledgeDoc[]>([])
const loading = ref(true)
const showEditor = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({ title: '', content: '', category: '', tags: '' })

// RAG test
const ragQuery = ref('')
const ragResults = ref<any>(null)
const ragLoading = ref(false)

const editingDoc = ref<KnowledgeDoc | null>(null)

async function loadDocs() {
  loading.value = true
  try {
    const res = await fetch(API)
    documents.value = await res.json()
  } catch (e) {
    console.error('加载失败', e)
  } finally {
    loading.value = false
  }
}

function openEditor(doc?: KnowledgeDoc) {
  if (doc) {
    editingId.value = doc.id!
    editingDoc.value = doc
    form.value = { title: doc.title, content: doc.content, category: doc.category || '', tags: doc.tags || '' }
  } else {
    editingId.value = null
    editingDoc.value = null
    form.value = { title: '', content: '', category: '', tags: '' }
  }
  showEditor.value = true
}

async function saveDoc() {
  saving.value = true
  try {
    const url = editingId.value ? `${API}/${editingId.value}` : API
    const method = editingId.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    if (!res.ok) throw new Error('Save failed')
    showEditor.value = false
    await loadDocs()
  } catch (e) {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteDoc(id: number) {
  if (!confirm('确定删除这篇文档吗？')) return
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    await loadDocs()
  } catch (e) {
    alert('删除失败')
  }
}

async function testRag() {
  if (!ragQuery.value.trim()) return
  ragLoading.value = true
  try {
    const res = await fetch(`http://localhost:8080/api/knowledge/search?q=${encodeURIComponent(ragQuery.value)}`)
    ragResults.value = await res.json()
  } catch (e) {
    console.error('检索失败', e)
  } finally {
    ragLoading.value = false
  }
}

onMounted(loadDocs)
</script>

<style scoped>
.km-page { margin: 1.5rem 0; }

.km-header {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.km-header h1 { margin: 0; font-size: 1.5rem; flex: 1; }
.km-header p { color: var(--vp-c-text-2); margin: 0; flex: 2; font-size: 0.9rem; }

.btn-add {
  padding: 0.5rem 1.25rem; border: none; border-radius: 6px;
  background: var(--vp-c-brand-1); color: #fff; font-size: 0.9rem;
  cursor: pointer; font-family: inherit;
}
.btn-add:hover { background: var(--vp-c-brand-2); }

/* Stats */
.km-stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.stat-card { padding: 0.75rem 1.25rem; background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-border); border-radius: 8px; font-size: 0.85rem; }
.stat-num { font-weight: 700; color: var(--vp-c-brand-1); margin-right: 0.3rem; }

/* RAG test */
.rag-test { background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-border); border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; }
.rag-test h3 { margin: 0 0 0.75rem; font-size: 1rem; }
.rag-input-row { display: flex; gap: 0.5rem; }
.rag-input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--vp-c-border); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1); font-size: 0.9rem; font-family: inherit; }
.rag-input:focus { border-color: var(--vp-c-brand-1); outline: none; box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }
.btn-rag { padding: 0.5rem 1rem; border: none; border-radius: 6px; background: var(--vp-c-brand-1); color: #fff; cursor: pointer; }
.btn-rag:disabled { opacity: 0.5; }

.rag-results { margin-top: 1rem; }
.rag-section h4 { font-size: 0.85rem; color: var(--vp-c-text-2); margin: 0 0 0.5rem; }
.rag-hit { background: var(--vp-c-bg); border: 1px solid var(--vp-c-border); border-radius: 6px; padding: 0.75rem; margin-bottom: 0.5rem; }
.rag-hit-source { font-size: 0.82rem; margin-bottom: 0.25rem; }
.rag-sim { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 3px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 600; font-size: 0.75rem; margin-right: 0.5rem; }
.rag-hit-text { font-size: 0.82rem; color: var(--vp-c-text-2); margin: 0; line-height: 1.55; }
.rag-empty { text-align: center; padding: 1rem; color: var(--vp-c-text-3); font-size: 0.85rem; }

/* Doc list */
.loading { text-align: center; padding: 3rem; color: var(--vp-c-text-2); }
.km-doc-list h3 { font-size: 1.1rem; margin-bottom: 1rem; }
.km-empty { text-align: center; padding: 2rem; color: var(--vp-c-text-3); background: var(--vp-c-bg-soft); border-radius: 8px; border: 1px dashed var(--vp-c-border); }

.km-doc-card { background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-border); border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; }
.km-doc-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem; }
.km-doc-header h4 { margin: 0; font-size: 1rem; }
.km-cat { font-size: 0.72rem; padding: 0.1rem 0.45rem; border-radius: 3px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.km-doc-preview { font-size: 0.82rem; color: var(--vp-c-text-2); margin: 0 0 0.5rem; }
.km-doc-tags { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.km-tag { font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 3px; background: var(--vp-c-bg-mute); color: var(--vp-c-text-3); }
.km-doc-actions { display: flex; align-items: center; gap: 0.5rem; }
.km-date { font-size: 0.75rem; color: var(--vp-c-text-3); flex: 1; }
.km-btn-edit { font-size: 0.78rem; padding: 0.25rem 0.75rem; border: 1px solid var(--vp-c-border); border-radius: 4px; background: transparent; color: var(--vp-c-text-2); cursor: pointer; font-family: inherit; }
.km-btn-edit:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.km-btn-del { font-size: 0.78rem; padding: 0.25rem 0.75rem; border: 1px solid transparent; border-radius: 4px; background: transparent; color: var(--vp-c-text-3); cursor: pointer; font-family: inherit; }
.km-btn-del:hover { border-color: #f56c6c; color: #f56c6c; }

/* Modal */
.km-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.km-modal { width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; background: var(--vp-c-bg); border: 1px solid var(--vp-c-border); border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.km-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--vp-c-border); }
.km-modal-header h2 { margin: 0; font-size: 1.1rem; }
.km-modal-close { width: 32px; height: 32px; border: none; background: transparent; font-size: 1.3rem; cursor: pointer; border-radius: 6px; }
.km-modal-close:hover { background: var(--vp-c-bg-mute); }
.km-form { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.km-field { display: flex; flex-direction: column; gap: 0.3rem; }
.km-field span { font-size: 0.82rem; font-weight: 600; color: var(--vp-c-text-2); }
.km-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.km-input { padding: 0.5rem 0.75rem; border: 1px solid var(--vp-c-border); border-radius: 6px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font-size: 0.9rem; font-family: inherit; width: 100%; box-sizing: border-box; }
.km-input:focus { border-color: var(--vp-c-brand-1); outline: none; box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }
.km-textarea { padding: 0.5rem 0.75rem; border: 1px solid var(--vp-c-border); border-radius: 6px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font-size: 0.9rem; font-family: inherit; resize: vertical; min-height: 200px; width: 100%; box-sizing: border-box; }
.km-textarea:focus { border-color: var(--vp-c-brand-1); outline: none; box-shadow: 0 0 0 2px var(--vp-c-brand-soft); }
.km-form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.km-btn-cancel { padding: 0.5rem 1.25rem; border: 1px solid var(--vp-c-border); border-radius: 6px; background: transparent; color: var(--vp-c-text-2); cursor: pointer; font-family: inherit; }
.km-btn-save { padding: 0.5rem 1.5rem; border: none; border-radius: 6px; background: var(--vp-c-brand-1); color: #fff; font-weight: 600; cursor: pointer; font-family: inherit; }
.km-btn-save:disabled { opacity: 0.5; }

@media (max-width: 480px) {
  .km-header { flex-direction: column; align-items: flex-start; }
  .km-row { grid-template-columns: 1fr; }
}
</style>
