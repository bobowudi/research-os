<template>
  <div class="page">
    <div class="page-header"><h2>信号监测</h2></div>
    <div class="list">
      <div class="list-item" v-for="item in items" :key="item.id">
        <div class="list-item-main">
          <span class="item-title">{{ item.title }}</span>
          <span class="item-meta">{{ item.type }} · {{ item.severity }}</span>
        </div>
        <span class="badge" :class="item.severity">{{ item.status }}</span>
      </div>
      <p v-if="!items.length" class="empty">暂无信号</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'
const items = ref<any[]>([])
onMounted(async () => {
  const res = await apiClient.get('/api/signals')
  items.value = res.data.data.items || []
})
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.list { background: #fff; border-radius: 8px; overflow: hidden; }
.list-item { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.item-title { font-weight: 500; }
.item-meta { font-size: 12px; color: #999; margin-left: 12px; }
.badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; }
.badge.critical { background: #fff1f0; color: #f5222d; }
.badge.high { background: #fff7e6; color: #fa8c16; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
