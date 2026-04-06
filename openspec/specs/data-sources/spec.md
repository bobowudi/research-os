# M10 数据源管理 (DataSource) — 基线规格

> 最后更新: 2026-04-05

## 状态: 未实现

数据源管理（DataSource）负责外部数据的自动化采集入库。系统不提供公网实时搜索，所有外部数据通过配置数据源定期爬取并存入证据库。支持 4 种数据源类型：网页爬虫、RSS 订阅、API 集成和文件监听。通过 `ImportJob` 管理每次导入任务的执行状态和结果统计。

当前状态：类型定义 (`shared/src/types/data-source.ts`)、数据库表结构 (`data_sources`, `import_jobs`) 已完成。前端有 stub 列表页，后端无业务逻辑。

---

## 模块定位

```
外部数据 ──▶ DataSource(M10) ──(定期爬取)──▶ ImportJob ──(入库)──▶ Evidence(M2)
                                                                       │
                                                                       ▼
                                                               Signal(M9) ← AI 扫描
```

- **产出**：向证据管理 (M2) 自动导入外部证据
- **触发检测**：新导入的证据可触发信号检测 (M9)
- **调度**：BullMQ 定时任务执行同步
- **仪表盘**：Dashboard (M11) 展示数据源健康状态

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 数据源 CRUD | 创建/查看/编辑/删除数据源 | ❌ 未实现 |
| F2 | 数据源列表 | 按 `type`, `status` 筛选 + 分页 | ❌ 未实现 |
| F3 | 连接测试 | 测试数据源连接可达性和采样数据 | ❌ 未实现 |
| F4 | 手动同步 | 手动触发数据源同步（增量或全量） | ❌ 未实现 |
| F5 | 定时同步 | 基于 `syncFrequency` / `syncCronExpression` 自动同步 | ❌ 未实现 |
| F6 | 导入任务管理 | 查看导入任务状态、日志、统计 | ❌ 未实现 |
| F7 | 取消导入 | 取消进行中的导入任务 | ❌ 未实现 |
| F8 | 手动文件上传 | 通过文件上传创建导入任务 | ❌ 未实现 |
| F9 | 去重 | 基于 `deduplicationKey` 避免重复导入 | ❌ 未实现 |
| F10 | 字段映射 | 通过 `fieldMapping` 将源数据映射到证据字段 | ❌ 未实现 |

### 数据源类型

| 类型 | 英文 | 配置字段 | 说明 |
|------|------|----------|------|
| 网页爬虫 | `web_crawler` | `url`, `urlPattern`, `selectors`, `maxDepth` | 爬取指定网页内容 |
| RSS 订阅 | `rss_feed` | `feedUrl` | 订阅 RSS/Atom Feed |
| API 集成 | `api_integration` | `apiEndpoint`, `apiMethod`, `apiHeaders`, `apiBody` | 调用第三方 API |
| 文件监听 | `file_watch` | `filePath`, `filePattern` | 监听本地/远程文件变更 |

### 认证方式

| 类型 | 说明 |
|------|------|
| `none` | 无需认证 |
| `api_key` | API Key 认证 |
| `oauth` | OAuth 2.0 认证 |
| `basic` | HTTP Basic 认证 |

### 业务规则

1. 数据源由 admin 角色管理（analyst 和 viewer 无权限）
2. 数据源 `status` 有 4 种：`active`（正常）/ `paused`（暂停）/ `error`（错误）/ `disabled`（禁用）
3. 同步频率 `syncFrequency` 支持 6 种预设：`realtime` / `hourly` / `daily` / `weekly` / `monthly` / `manual`
4. 也可通过 `syncCronExpression` 自定义 cron 表达式
5. 导入的证据 `sourceCategory` 和 `sourceType` 由数据源配置 `targetSourceCategory` 和 `targetSourceType` 决定
6. 每次导入生成 `ImportJob` 记录，追踪 `totalItems`, `processedItems`, `importedItems`, `skippedItems`, `failedItems`
7. 导入失败的条目记录在 `errorLog[]` 中
8. `rateLimitPerMinute` 控制爬虫请求频率，避免被封禁

---

## 数据模型

### `data_sources` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `name` | string | 数据源名称 |
| `type` | enum | 类型: `web_crawler` / `rss_feed` / `api_integration` / `file_watch` |
| `status` | enum | 状态: `active` / `paused` / `error` / `disabled` |
| `config` | JSON | 数据源配置 (DataSourceConfig) |
| `sync_frequency` | enum | 同步频率 (6 种) |
| `sync_cron_expression` | string? | 自定义 cron 表达式 |
| `target_source_category` | enum | 导入证据的 sourceCategory |
| `target_source_type` | enum | 导入证据的 sourceType |
| `field_mapping` | JSON? | 字段映射配置 |
| `deduplication_key` | string? | 去重字段 |
| `last_sync_at` | datetime? | 最后同步时间 |
| `last_sync_status` | enum? | 最后同步状态: `success` / `partial` / `failed` |
| `total_imported` | number | 累计导入数量 |
| `error_count` | number | 累计错误数量 |
| `created_by` | string | 创建者 ID |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

### `import_jobs` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `data_source_id` | string | 数据源 ID (FK → data_sources) |
| `status` | enum | 状态: `pending` / `running` / `completed` / `partial` / `failed` / `cancelled` |
| `total_items` | number | 总条目数 |
| `processed_items` | number | 已处理条目数 |
| `imported_items` | number | 成功导入条目数 |
| `skipped_items` | number | 跳过条目数 |
| `failed_items` | number | 失败条目数 |
| `error_log` | JSON? | 错误日志 `string[]` |
| `imported_evidence_ids` | JSON | 导入的证据 ID 列表 `string[]` |
| `started_at` | datetime? | 开始时间 |
| `completed_at` | datetime? | 完成时间 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

### TypeScript 类型定义

```typescript
// shared/src/types/data-source.ts
export type DataSourceType = 'web_crawler' | 'rss_feed' | 'api_integration' | 'file_watch'
export type DataSourceStatus = 'active' | 'paused' | 'error' | 'disabled'
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual'
export type ImportJobStatus = 'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled'

export interface DataSourceConfig {
  url?: string
  urlPattern?: string
  selectors?: Record<string, string>
  maxDepth?: number
  feedUrl?: string
  apiEndpoint?: string
  apiMethod?: 'GET' | 'POST'
  apiHeaders?: Record<string, string>
  apiBody?: string
  filePath?: string
  filePattern?: string
  authType?: 'none' | 'api_key' | 'oauth' | 'basic'
  authConfig?: Record<string, string>
  rateLimitPerMinute?: number
}

export interface DataSource {
  id: string
  tenantId: string
  name: string
  type: DataSourceType
  status: DataSourceStatus
  config: DataSourceConfig
  syncFrequency: SyncFrequency
  syncCronExpression?: string
  targetSourceCategory: EvidenceSourceCategory
  targetSourceType: EvidenceSourceType
  fieldMapping?: Record<string, string>
  deduplicationKey?: string
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'partial' | 'failed'
  totalImported: number
  errorCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ImportJob {
  id: string
  tenantId: string
  dataSourceId: string
  status: ImportJobStatus
  totalItems: number
  processedItems: number
  importedItems: number
  skippedItems: number
  failedItems: number
  errorLog?: string[]
  importedEvidenceIds: string[]
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}
```

---

## 状态机

### DataSource 状态

```
  active ◀──▶ paused
    │
    ▼
  error ──▶ active (修复后重试)
    │
    ▼
  disabled (管理员手动禁用)
```

### ImportJob 状态

```
  pending ──▶ running ──┬──▶ completed (全部成功)
                         ├──▶ partial  (部分失败)
                         └──▶ failed   (全部失败)
    │
    └──▶ cancelled (用户取消)
```

---

## API 接口 (规划)

### 数据源 CRUD

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/data-sources` | 创建数据源 | admin |
| `GET` | `/api/data-sources` | 数据源列表 | admin |
| `GET` | `/api/data-sources/:id` | 数据源详情 | admin |
| `PATCH` | `/api/data-sources/:id` | 更新数据源 | admin |
| `DELETE` | `/api/data-sources/:id` | 删除数据源 | admin |

### 同步与测试

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/data-sources/:id/sync` | 手动触发同步 | admin |
| `POST` | `/api/data-sources/:id/test` | 测试数据源连接 | admin |

### 导入任务管理

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/data-sources/:id/jobs` | 数据源下的导入任务列表 | admin |
| `GET` | `/api/data-sources/:id/jobs/:jobId` | 导入任务详情 | admin |
| `GET` | `/api/import-jobs` | 导入任务列表（跨数据源） | admin |
| `GET` | `/api/import-jobs/:id` | 导入任务详情 | admin |
| `POST` | `/api/import-jobs/:id/cancel` | 取消导入任务 | admin |
| `GET` | `/api/import-jobs/:id/logs` | 导入任务日志 | admin |
| `POST` | `/api/import-jobs/manual` | 手动创建导入任务（文件上传） | admin |

---

## 前端 (规划)

### 当前状态

- `DataSourceListPage` — stub 列表页，使用 `any[]` 类型

### 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `DataSourceListPage` | 数据源列表页（含状态、最后同步时间） | ❌ 仅 stub |
| `DataSourceCard` | 数据源卡片（显示类型、状态、同步频率） | ❌ 未实现 |
| `DataSourceCreateDialog` | 创建数据源对话框（按类型切换配置表单） | ❌ 未实现 |
| `DataSourceConfigForm` | 数据源配置表单（爬虫/RSS/API/文件监听） | ❌ 未实现 |
| `DataSourceTestButton` | 连接测试按钮（显示连接状态） | ❌ 未实现 |
| `DataSourceSyncButton` | 手动同步按钮 | ❌ 未实现 |
| `ImportJobList` | 导入任务列表 | ❌ 未实现 |
| `ImportJobDetailPanel` | 导入任务详情面板（含进度、日志） | ❌ 未实现 |
| `ImportJobProgressBar` | 导入进度条 | ❌ 未实现 |
| `ManualUploadDialog` | 手动文件上传对话框 | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `shared/src/types/data-source.ts` | TypeScript 类型定义 |
| `shared/src/types/evidence.ts` | `EvidenceSourceCategory`, `EvidenceSourceType`（被 DataSource 引用） |
| `shared/src/validators/entities.ts` | Zod 校验 schema（待补充） |
| `database/src/migrations/001_initial.ts` | `data_sources` + `import_jobs` 建表 |
| `docs/03-API设计文档.md` § 十二 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M10 | 模块功能点定义 |
| `frontend/src/features/data-sources/` | 前端模块目录（仅 stub） |
