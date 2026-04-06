<template>
  <aside class="evidence-column">
    <div class="column-card">
      <header :class="['column-card__header', `column-card__header--${tone}`]">
        <div :class="['column-card__title', `column-card__title--${tone}`]">
          <el-icon><component :is="tone === 'blue' ? Checked : Warning" /></el-icon>
          <span>{{ title }}</span>
        </div>
        <span :class="['column-card__badge', `column-card__badge--${tone}`]">{{ badge }}</span>
      </header>

      <div class="column-card__body">
        <div :class="['column-cover', `column-cover--${tone}`]">
          <img :src="image" :alt="title">
        </div>

        <article
          v-for="ev in items"
          :key="ev.id"
          :class="['evidence-card', { 'evidence-card--right': align === 'right' }]"
        >
          <div :class="['evidence-card__meta', { 'evidence-card__meta--right': align === 'right' }]">
            <span>{{ ev.source }}</span>
            <template v-if="align === 'left'">
              <strong>Conf: {{ ev.confidence }}%</strong>
            </template>
            <template v-else>
              <el-icon><View /></el-icon>
            </template>
          </div>
          <h3>{{ ev.title }}</h3>
          <p>"{{ ev.content }}"</p>
        </article>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Checked, View, Warning } from '@element-plus/icons-vue'
import type { EvidenceItem } from '../types'

defineProps<{
  title: string
  badge: string
  image: string
  items: EvidenceItem[]
  tone: 'blue' | 'red'
  align: 'left' | 'right'
}>()
</script>

<style scoped lang="less">
.column-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 32px;
  background: #fff;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px;
    border-bottom: 1px solid #f1f5f9;

    &--blue {
      background: rgba(239, 246, 255, 0.55);
    }

    &--red {
      background: rgba(254, 242, 242, 0.5);
    }
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 800;

    &--blue {
      color: #1d4ed8;
    }

    &--red {
      color: #b91c1c;
    }
  }

  &__badge {
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 800;

    &--blue {
      background: #dbeafe;
      color: #2563eb;
    }

    &--red {
      background: #fee2e2;
      color: #dc2626;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }
}

.column-cover {
  position: relative;
  overflow: hidden;
  height: 144px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: #f1f5f9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  &--blue::after {
    background: rgba(30, 64, 175, 0.1);
  }

  &--red::after {
    background: rgba(127, 29, 29, 0.1);
  }
}

.evidence-card {
  padding: 16px;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  background: #f8fafc;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;

  &:hover {
    background: #fff;
    transform: translateY(-2px);
    border-color: #bfdbfe;
  }

  &--right {
    text-align: right;

    &:hover {
      border-color: #fecaca;
    }
  }

  h3 {
    margin-bottom: 8px;
    color: #1e293b;
    font-size: 15px;
    font-weight: 800;
  }

  p {
    display: -webkit-box;
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    line-height: 1.65;
    font-style: italic;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;

    strong {
      color: #2563eb;
    }

    &--right {
      justify-content: flex-end;

      .el-icon {
        color: #f87171;
      }
    }
  }
}
</style>
