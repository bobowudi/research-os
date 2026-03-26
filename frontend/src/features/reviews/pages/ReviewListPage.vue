<template>
  <div class="page">
    <div class="page-header"><h2>回看</h2></div>
    <div class="list">
      <div class="list-item" v-for="item in items" :key="item.id">
        <div class="list-item-main">
          <span class="item-title">{{ item.outcome }}</span>
          <span class="item-meta">{{ item.reviewed_at?.slice(0,10) }}</span>
        </div>
      </div>
      <p v-if="!items.length" class="empty">暂无回看记录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/shared/api/client'
const items = ref<any[]>([])
onMounted(async () => {
  const res = await apiClient.get('/api/reviews')
  items.value = res.data.data.items || []
})
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.list { background: #fff; border-radius: 8px; overflow: hidden; }
.list-item { padding: 16px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.item-title { font-weight: 500; }
.item-meta { font-size: 12px; color: #999; margin-left: 12px; }
.empty { text-align: center; padding: 40px; color: #999; }
</style>
