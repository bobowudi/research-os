// ==================== Elasticsearch 客户端 ====================

import { Client } from '@elastic/elasticsearch'

let esClient: Client | null = null

export function getElasticsearch(): Client {
  if (!esClient) {
    esClient = new Client({
      node: process.env.ES_URL || 'http://localhost:9200',
      auth: process.env.ES_USERNAME
        ? {
            username: process.env.ES_USERNAME,
            password: process.env.ES_PASSWORD || '',
          }
        : undefined,
    })
  }
  return esClient
}

/** 证据全文搜索索引名 */
export const EVIDENCE_INDEX = 'research_os_evidence'

/** 初始化 ES 索引 */
export async function initIndices(): Promise<void> {
  const es = getElasticsearch()

  const exists = await es.indices.exists({ index: EVIDENCE_INDEX })
  if (!exists) {
    await es.indices.create({
      index: EVIDENCE_INDEX,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              content_analyzer: {
                type: 'standard',
                stopwords: '_english_',
              },
            },
          },
        },
        mappings: {
          properties: {
            tenant_id: { type: 'keyword' },
            source_category: { type: 'keyword' },
            source_type: { type: 'keyword' },
            source_label: { type: 'text' },
            content: { type: 'text', analyzer: 'content_analyzer' },
            summary: { type: 'text', analyzer: 'content_analyzer' },
            tags: { type: 'keyword' },
            confidence: { type: 'float' },
            freshness_at: { type: 'date' },
            created_at: { type: 'date' },
          },
        },
      },
    })
    console.log(`✅ ES 索引 ${EVIDENCE_INDEX} 创建成功`)
  }
}

/** 搜索证据 */
export async function searchEvidence(params: {
  tenantId: string
  query: string
  sourceCategory?: string
  from?: number
  size?: number
}) {
  const { tenantId, query, sourceCategory, from = 0, size = 20 } = params
  const es = getElasticsearch()

  const must: any[] = [
    { term: { tenant_id: tenantId } },
    {
      multi_match: {
        query,
        fields: ['content^2', 'summary^3', 'source_label', 'tags'],
        type: 'best_fields',
      },
    },
  ]

  if (sourceCategory) {
    must.push({ term: { source_category: sourceCategory } })
  }

  return es.search({
    index: EVIDENCE_INDEX,
    body: {
      from,
      size,
      query: { bool: { must } },
      highlight: {
        fields: { content: {}, summary: {} },
      },
    },
  })
}
