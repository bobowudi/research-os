<template>
  <div class="page">
    <div class="page-header"><h2>洞察</h2></div>
    <div class="list">
      <div class="list-item" v-for="item in items" :key="item.id">
        <div class="list-item-main">
          <span class="item-title">{{ item.title }}</span>
          <span class="item-meta">{{ item.type }} · {{ item.direction }} · 置信度: {{ (item.confidence * 100).toFixed(0) }}%</span>
        </div>
        <span class="badge" :class="item.status">{{ item.status }}</span>
      </div>
      <p v-if="!items.length" class="empty">暂无洞察</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'
const items = ref<any[]>([])
onMounted(async () => {
  const res = await apiClient.get('/api/insights')
  items.value = res.data.data.items || []
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.list { background: #fff; border-radius: 8px; overflow: hidden; }
.list-item { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.list-item:hover { background: #fafafa; }
.item-title { font-weight: 500; }
.item-meta { font-size: 12px; color: #999; margin-left: 12px; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
