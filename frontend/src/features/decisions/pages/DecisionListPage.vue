<template>
  <div class="page">
    <div class="page-header"><h2>决策卡</h2></div>
    <div class="list">
      <div class="list-item" v-for="item in items" :key="item.id" @click="$router.push(`/decisions/${item.id}`)">
        <div class="list-item-main">
          <span class="item-title">{{ item.recommendation?.slice(0, 80) }}...</span>
          <span class="item-meta">置信度: {{ (item.confidence * 100).toFixed(0) }}%</span>
        </div>
        <span class="badge" :class="item.status">{{ item.status }}</span>
      </div>
      <p v-if="!items.length" class="empty">暂无决策卡</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'
const items = ref<any[]>([])
onMounted(async () => {
  const res = await apiClient.get('/api/decisions')
  items.value = res.data.data.items || []
})
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.list { background: #fff; border-radius: 8px; overflow: hidden; }
.list-item { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.list-item:hover { background: #fafafa; }
.item-title { font-weight: 500; }
.item-meta { font-size: 12px; color: #999; margin-left: 12px; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
