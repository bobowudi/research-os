<template>
  <div class="page">
    <div class="page-header">
      <h2>数据源</h2>
      <button class="btn-primary">+ 添加数据源</button>
    </div>
    <div class="list">
      <div class="list-item" v-for="item in items" :key="item.id">
        <div class="list-item-main">
          <span class="item-title">{{ item.name }}</span>
          <span class="item-meta">{{ item.type }} · {{ item.sync_frequency }} · 已导入: {{ item.total_imported }}</span>
        </div>
        <span class="badge" :class="item.status">{{ item.status }}</span>
      </div>
      <p v-if="!items.length" class="empty">暂无数据源</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'
const items = ref<any[]>([])
onMounted(async () => {
  const res = await apiClient.get('/api/data-sources')
  items.value = res.data.data.items || []
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #1677ff; color: #fff; border-radius: 6px; font-size: 14px; }
.list { background: #fff; border-radius: 8px; overflow: hidden; }
.list-item { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.item-title { font-weight: 500; }
.item-meta { font-size: 12px; color: #999; margin-left: 12px; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; }
.badge.error { background: #fff1f0; color: #f5222d; }
.badge.active { background: #f6ffed; color: #52c41a; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
