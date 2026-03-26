<template>
  <div class="page">
    <div class="page-header">
      <h2>议题管理</h2>
      <button class="btn-primary" @click="showCreate = true">+ 新建议题</button>
    </div>
    <div class="filter-bar">
      <select v-model="filters.status" @change="loadData">
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="collecting">收集中</option>
        <option value="analyzing">分析中</option>
        <option value="pending_decision">待决策</option>
        <option value="decided">已决策</option>
        <option value="closed">已关闭</option>
      </select>
      <select v-model="filters.domain" @change="loadData">
        <option value="">全部领域</option>
        <option value="brand">品牌</option>
        <option value="product">产品</option>
        <option value="market">市场</option>
        <option value="strategy">战略</option>
        <option value="operations">运营</option>
      </select>
    </div>
    <div class="list">
      <div class="list-item" v-for="item in items" :key="item.id" @click="$router.push(`/issues/${item.id}`)">
        <div class="list-item-main">
          <span class="item-title">{{ item.title }}</span>
          <span class="item-meta">{{ item.domain }} · {{ item.evidenceCount }} 条证据</span>
        </div>
        <span class="badge" :class="item.status">{{ item.status }}</span>
      </div>
      <p v-if="!items.length" class="empty">暂无议题</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'

const items = ref<any[]>([])
const showCreate = ref(false)
const filters = reactive({ status: '', domain: '' })

async function loadData() {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.domain) params.set('domain', filters.domain)
  const res = await apiClient.get(`/api/issues?${params}`)
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
.list-item { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.list-item:hover { background: #fafafa; }
.item-title { font-weight: 500; }
.item-meta { font-size: 12px; color: #999; margin-left: 12px; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
