<template>
  <div class="home-module">
    <HomeHeroSection :stage="stage" @start="startDebate" />

    <section class="workspace-grid">
      <HomeEvidenceColumn
        title="正方 (Advocate)"
        badge="内部证据"
        tone="blue"
        align="left"
        image="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=500"
        :items="homeEvidence.pro"
      />

      <HomeArenaPanel
        :stage="stage"
        :is-debating="isDebating"
        :confidence-score="confidenceScore"
        @open-decisions="router.push('/decisions')"
      />

      <HomeEvidenceColumn
        title="反方 (Critic)"
        badge="外部数据"
        tone="red"
        align="right"
        image="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=500"
        :items="homeEvidence.con"
      />
    </section>

    <HomeActionGrid
      :stage="stage"
      :items="homeActionItems"
      @open-actions="router.push('/actions')"
    />

    <HomeModuleFooter />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import HomeActionGrid from '../components/HomeActionGrid.vue'
import HomeArenaPanel from '../components/HomeArenaPanel.vue'
import HomeEvidenceColumn from '../components/HomeEvidenceColumn.vue'
import HomeHeroSection from '../components/HomeHeroSection.vue'
import HomeModuleFooter from '../components/HomeModuleFooter.vue'
import { useHomeDebate } from '../composables/useHomeDebate'
import { homeActionItems, homeEvidence } from '../data'

const router = useRouter()
const { stage, isDebating, confidenceScore, startDebate } = useHomeDebate()
</script>

<style scoped lang="less">
.home-module {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(460px, 1.35fr) minmax(280px, 1fr);
  gap: 24px;
  align-items: stretch;
}

@media (max-width: 1440px) {
  .workspace-grid {
    grid-template-columns: minmax(260px, 0.9fr) minmax(420px, 1.2fr) minmax(260px, 0.9fr);
  }
}

@media (max-width: 1200px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
</style>
