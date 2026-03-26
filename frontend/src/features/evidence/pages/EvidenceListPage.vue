<template>
  <div class="page">
    <div class="page-header">
      <h2>证据库</h2>
      <button class="btn-primary" @click="showCreate = true">+ 添加证据</button>
    </div>
    <div class="filter-bar">
      <select v-model="filters.sourceCategory" @change="loadData">
        <option value="">全部分类</option>
        <option value="internal">内部</option>
        <option value="external">外部</option>
      </select>
    </div>
    <div class="list">
      <div class="list-item" v-for="item in items" :key="item.id">
        <div class="list-item-main">
          <span class="item-title">{{ item.sourceLabel }}</span>
          <span class="item-meta">{{ item.sourceCategory }} · {{ item.sourceType }} · 置信度: {{ (item.confidence * 100).toFixed(0) }}%</span>
        </div>
        <span class="badge">{{ item.sourceType }}</span>
      </div>
      <p v-if="!items.length" class="empty">暂无证据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'

const items = ref<any[]>([])
const showCreate = ref(false)
const filters = reactive({ sourceCategory: '' })

async function loadData() {
  const params = new URLSearchParams()
  if (filters.sourceCategory) params.set('sourceCategory', filters.sourceCategory)
  const res = await apiClient.get(`/api/evidence?${params}`)
  items.value = res.data.data.items || []
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1677ff; color: #fff; border-radius: 6px; font-size: 14px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.filter-bar select { padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 6px; }
.list { background: #fff; border-radius: 8px; overflow: hidden; }
.list-item { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.list-item:hover { background: #fafafa; }
.item-title { font-weight: 500; }
.item-meta { font-size: 12px; color: #999; margin-left: 12px; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
