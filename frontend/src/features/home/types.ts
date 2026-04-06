import type { Component } from 'vue'

export type DebateStage = 'gathering' | 'debating' | 'verdict'

export interface EvidenceItem {
  id: string
  title: string
  content: string
  confidence: number
  source: string
}

export interface ActionItem {
  title: string
  owner: string
  deadline: string
  icon: Component
}
