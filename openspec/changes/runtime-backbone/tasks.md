# Runtime Backbone Tasks

## 1. 定义 runtime shared types
- [ ] 新增 `BaseRun`、`RuntimeTask`、`ArtifactRef`、`RuntimeEvent`、`ReasoningSnapshot` 类型
- [ ] 明确 run/task/artifact 状态枚举
- [ ] 确认与现有 shared / backend 类型的放置边界
- **预估**: 1.5 小时
- **依赖**: 无

## 2. 设计 runtime 数据表迁移
- [ ] 设计 `runtime_runs` 表结构
- [ ] 设计 `runtime_tasks` 表结构
- [ ] 设计 `runtime_artifacts` 表结构
- [ ] 校验与 `reasoning_runs` / `import_jobs` / `reviews` 的关系
- **预估**: 1.5 小时
- **依赖**: 1

## 3. 建立 runtime 目录骨架
- [ ] 建立 `backend/src/runtime/core/`
- [ ] 建立 `orchestrators/`、`artifacts/`、`context/`、`events/`、`recovery/`、`governance/`
- [ ] 添加基础导出入口
- **预估**: 1 小时
- **依赖**: 1

## 4. 实现 runtime run repository 基础能力
- [ ] 支持创建 / 更新 / 查询 `runtime_runs`
- [ ] 支持写入 input/output snapshot
- [ ] 支持记录 error / latency / token usage
- **预估**: 2 小时
- **依赖**: 2, 3

## 5. 实现 runtime artifact registry 基础能力
- [ ] 支持 artifact 引用登记
- [ ] 支持按 run / issue / entity 查询 artifact
- [ ] 定义 storageType / storageKey 约束
- **预估**: 1.5 小时
- **依赖**: 2, 3

## 6. 实现 runtime task tracking 基础能力
- [ ] 支持创建 task
- [ ] 支持 task 状态推进
- [ ] 支持 dependsOn 持久化
- [ ] 支持读取 run 下已完成 / 未完成 task
- **预估**: 2 小时
- **依赖**: 2, 3, 4

## 7. 实现 runtime event shape 与 event bus 封装
- [ ] 定义统一 `RuntimeEvent`
- [ ] 封装事件发射接口
- [ ] 提供 SSE adapter 所需的事件映射
- **预估**: 1.5 小时
- **依赖**: 1, 3

## 8. 实现 reasoning context builder
- [ ] 抽离 issue / evidence / insight / preflight / policy 的上下文组装
- [ ] 生成 `ReasoningSnapshot`
- [ ] 记录 promptVersion 与 modelPolicy
- **预估**: 2 小时
- **依赖**: 1, 3

## 9. 接入 ReasoningOrchestrator
- [ ] 创建 reasoning run
- [ ] 创建 reasoning tasks
- [ ] 将现有 reasoning worker 映射到 runtime task 生命周期
- [ ] 统一输出 reasoning runtime events
- **预估**: 2 小时
- **依赖**: 4, 6, 7, 8

## 10. 为 reasoning 输出登记 artifacts
- [ ] Advocate 输出登记为 artifact
- [ ] Critic 输出登记为 artifact
- [ ] Judge 输出登记为 artifact
- [ ] DecisionCard 输出登记为 artifact 引用
- **预估**: 1.5 小时
- **依赖**: 5, 9

## 11. 接入 ImportOrchestrator
- [ ] 为 import sync 创建 runtime run
- [ ] 将 rss/crawler worker 步骤映射为 runtime tasks
- [ ] 为 raw source 登记 artifact
- **预估**: 2 小时
- **依赖**: 4, 5, 6, 7

## 12. 接入 ReviewSummaryOrchestrator
- [ ] 为 review summary 创建 runtime run
- [ ] 将 SummaryWorker 步骤映射为 runtime tasks
- [ ] 为 review summary / historical evidence 登记 artifact
- **预估**: 2 小时
- **依赖**: 4, 5, 6, 7

## 13. 实现 retry / resume 基础机制
- [ ] 定义 retryable / non-retryable failure 分类
- [ ] 基于 task 状态实现 skip-completed resume
- [ ] 为 run fail / resume 增加统一入口
- **预估**: 2 小时
- **依赖**: 6, 9, 11, 12

## 14. 补充 runtime 查询接口
- [ ] 提供 run 查询接口
- [ ] 提供 task 查询接口
- [ ] 提供 artifact 查询接口
- [ ] 确保 tenant scope 隔离
- **预估**: 2 小时
- **依赖**: 4, 5, 6

## 15. 接入 governance 字段采集
- [ ] 记录 model / token / latency / estimatedCost
- [ ] 接入 trigger / retry / fail 的审计信息
- [ ] 校验 runtime 相关权限边界
- **预估**: 1.5 小时
- **依赖**: 4, 7, 9, 11, 12

## 16. 前端接入最小统一运行视图
- [ ] Reasoning 面板消费统一 runtime event shape
- [ ] Import / Review 显示基础 run status
- [ ] 不新增完整监控大盘，仅做局部状态面板
- **预估**: 2 小时
- **依赖**: 7, 9, 11, 12, 14

## 17. 验证首批三条链路
- [ ] reasoning run 可创建、推进、完成、失败
- [ ] import run 可映射为统一 run/task 视图
- [ ] review summary run 可完成 evidence 回流
- [ ] resume 能跳过已完成 task
- **预估**: 2 小时
- **依赖**: 10, 13, 15, 16
