import { EditPen, Files, Message, TrendCharts } from '@element-plus/icons-vue'
import type { ActionItem, EvidenceItem } from './types'

export const homeEvidence: Record<'pro' | 'con', EvidenceItem[]> = {
  pro: [
    { id: 'e1', title: 'Q3 NPS 调研报告', content: '核心用户对价格敏感度上升 15%，价格竞争已成为流失主因。', confidence: 85, source: '用户访谈' },
    { id: 'e2', title: '销售转换漏斗分析', content: '降价 8% 的 A/B 测试显示转化率有显著的正向拐点。', confidence: 92, source: 'CRM 数据' },
  ],
  con: [
    { id: 'e3', title: '竞品 A 战略追踪', content: '竞品未跟进降价，其品牌溢价依然稳健，盲目降价有损心智。', confidence: 78, source: 'M10 采集' },
    { id: 'e4', title: '行业高端化趋势报告', content: '调研显示用户对订阅包的期待是“服务升级”而非“价格探底”。', confidence: 70, source: '外部智库' },
  ],
}

export const homeActionItems: ActionItem[] = [
  { title: '定向发放针对性留存礼券', owner: '市场部-张利', deadline: '24h', icon: Files },
  { title: '品牌高端化话术库更新', owner: '公关部-李华', deadline: '48h', icon: Message },
  { title: '下沉市场竞争专项调研', owner: '分析组-王五', deadline: '7D', icon: TrendCharts },
  { title: '高敏感用户细分回访', owner: '用户研究-陈晨', deadline: '72h', icon: EditPen },
]
