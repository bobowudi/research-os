import { markRaw, type Component } from 'vue'
import {
  Aim,
  CircleCheck,
  Connection,
  DataBoard,
  Document,
  House,
  List,
  Opportunity,
  Search,
  Setting,
} from '@element-plus/icons-vue'

export interface NavItem {
  name: string
  label: string
  to: string
  icon: Component
  badge?: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: '决策链路',
    items: [
      { name: 'home', label: '首页', to: '/', icon: markRaw(House) },
      { name: 'dashboard', label: '议题中心', to: '/dashboard', icon: markRaw(DataBoard) },
      { name: 'issues', label: '议题管理', to: '/issues', icon: markRaw(List), badge: '12' },
      { name: 'evidence', label: '证据管理', to: '/evidence', icon: markRaw(Document), badge: '142' },
      { name: 'insights', label: '洞察集', to: '/insights', icon: markRaw(Opportunity) },
      { name: 'decisions', label: '决策剧场', to: '/decisions', icon: markRaw(Aim) },
      { name: 'actions', label: '行动追踪', to: '/actions', icon: markRaw(CircleCheck), badge: '4' },
      { name: 'reviews', label: '回看闭环', to: '/reviews', icon: markRaw(Search) },
    ],
  },
  {
    label: '系统能力',
    items: [
      { name: 'signals', label: '信号监测', to: '/signals', icon: markRaw(Connection) },
      { name: 'data-sources', label: '数据源管理', to: '/data-sources', icon: markRaw(DataBoard) },
      { name: 'settings', label: '设置与工作空间', to: '/settings', icon: markRaw(Setting) },
    ],
  },
]

export const routeTitles: Record<string, string> = {
  home: '首页',
  dashboard: '议题中心',
  issues: '议题管理',
  'issue-detail': '议题详情',
  evidence: '证据管理',
  insights: '洞察集',
  decisions: '决策剧场',
  'decision-detail': '决策详情',
  actions: '行动追踪',
  reviews: '回看闭环',
  signals: '信号监测',
  'data-sources': '数据源管理',
  settings: '设置与工作空间',
}
