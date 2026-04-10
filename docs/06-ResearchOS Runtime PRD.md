# ResearchOS Runtime PRD

> 面向多源证据调研与决策闭环的 Agent Runtime 产品需求文档

## 1. 文档定位

本文档定义的不是某个单点 AI 功能，而是 **ResearchOS 的 Runtime 产品层**。

ResearchOS 不应被理解为“带 AI 的调研系统”，而应被理解为：

> **一个把证据、推理、决策、行动、回看组织成可持续执行闭环的 Agent Runtime 产品。**

这个 Runtime 的职责，是把原本分散的模块能力——证据、数据源、洞察、对抗推理、决策卡、行动项、回看——组织成一套稳定、可追踪、可恢复、可治理的执行系统。

---

## 2. 背景与问题

### 2.1 当前系统的问题

从模块视角看，ResearchOS 已经具备多个关键业务对象：

- Issue（议题）
- Evidence（证据）
- Insight（洞察）
- ReasoningRun（推理运行）
- DecisionCard（决策卡）
- Action（行动项）
- Review（回看）
- DataSource / ImportJob（数据采集）

但如果只按“模块 CRUD”来组织，这些能力会出现几个问题：

1. **流程断裂**：证据、推理、决策、行动、回看之间缺少统一执行主线
2. **状态割裂**：系统只能看到结果，难以看到中间执行状态
3. **可恢复性弱**：任务中断后，难以明确从哪里继续
4. **可观测性不足**：很难回答“本次决策是如何形成的”
5. **闭环能力不完整**：回看结果无法自然回流为下一轮推理资产

### 2.2 为什么需要 Runtime 层

ResearchOS 的核心价值，不是把信息存起来，而是把信息 **推进成判断、决策与行动**。

这要求系统具备：

- 能组织多步执行
- 能管理证据上下文
- 能编排多角色推理
- 能将运行结果沉淀为可复用资产
- 能支持任务恢复、审计、追踪和治理

所以 ResearchOS 需要的不是更多页面，而是一层统一的 **Runtime 执行内核**。

---

## 3. 产品目标

## 3.1 总目标

构建一套以 Issue 为中心、以证据为输入、以决策闭环为输出的 Runtime 系统，使 ResearchOS 从“模块集合”升级为“执行系统”。

## 3.2 核心目标

### 目标 A：统一执行主线
让数据采集、证据处理、洞察提炼、对抗推理、决策生成、行动展开、回看总结进入一条连续执行链。

### 目标 B：统一运行状态
每一类关键执行过程都必须有标准化 Run 状态，而不是只记录最终结果。

### 目标 C：统一中间产物
推理文本、洞察结果、立场判断、回看总结、决策卡等中间产物要能被引用、追溯、复用。

### 目标 D：统一恢复与治理
任务失败、模型中断、异步 Worker 异常时，系统要支持恢复、重试、审计和权限控制。

### 目标 E：形成闭环学习
Review 产出的经验要自动进入证据池，成为后续推理输入，实现系统持续学习。

---

## 4. 非目标

当前阶段 Runtime PRD 不包含以下内容：

- 自由聊天型通用 Agent 助手
- 面向任意外部系统的开放式插件平台
- 全自动无人值守的长期自治系统
- 跨租户共享推理记忆
- 高度复杂的多 Agent 自由对话机制
- 图形化工作流编排器

当前重点是：

> 先把 **ResearchOS 自己的核心业务闭环** 做成稳定 Runtime。

---

## 5. 用户与场景

## 5.1 目标用户

### 管理者 / 决策者
关注：
- 当前议题的关键证据是否充分
- 决策是怎么形成的
- 决策依据是否可追溯
- 后续行动是否被执行

### Analyst / 研究员
关注：
- 如何持续沉淀证据
- 如何快速得到结构化洞察
- 如何触发推理并看到中间过程
- 如何校正 AI 判断结果

### 平台管理员
关注：
- 任务是否失败
- 模型调用是否过量
- 哪些流程可审计
- 租户隔离与权限边界是否清晰

---

## 6. 核心产品定义

ResearchOS Runtime 由四条主运行链构成。

## 6.1 Ingestion Runtime（采集运行链）

职责：把外部数据源转化为可进入系统的证据资产。

输入：
- RSS Feed
- Web Crawler
- API Integration
- File Watch

输出：
- ImportJob
- Evidence
- 原始抓取产物与结构化元数据

关键价值：
- 把“数据源管理”从配置页升级为运行能力
- 为后续证据分析与推理提供持续输入

## 6.2 Evidence Intelligence Runtime（证据智能运行链）

职责：把原始证据加工成可用于判断的结构化资产。

包含：
- 摘要生成
- embedding 向量化
- issue 自动关联
- 立场分析（pro / con / neutral）
- 洞察提炼

输出：
- Evidence summary
- IssueEvidence stance result
- Insight
- Similarity / association result

关键价值：
- 把“证据存储”升级为“证据理解”

## 6.3 Adversarial Reasoning Runtime（对抗推理运行链）

职责：围绕某个议题，组织 Advocate / Critic / Judge 三方推理，生成结构化决策结果。

输入：
- 议题信息
- 内部证据
- 外部证据
- 洞察结果
- Preflight 判定

输出：
- ReasoningRun
- Advocate output
- Critic output
- Judge output
- DecisionCard

关键价值：
- 把“证据堆积”升级为“可解释决策形成过程”

## 6.4 Closed-loop Learning Runtime（闭环学习运行链）

职责：将决策执行与实际结果重新回流为历史证据。

输入：
- Action
- Review
- DecisionCard

输出：
- Review summary
- Historical evidence
- 下一轮推理可复用经验

关键价值：
- 把“单次决策”升级为“持续进化系统”

---

## 7. Runtime 的核心产品对象

Runtime 层需要在现有业务实体之上，引入更高一层的运行对象。

## 7.1 Run

Run 表示一次明确的系统执行过程。

建议覆盖：
- import run
- stance analysis run
- insight generation run
- reasoning run
- review summary run
- decision action generation run

Run 的产品意义：
- 用户可看到过程，不只看到结果
- 后端可恢复、重试、追踪
- 平台可统计成本与成功率

## 7.2 Task

Task 表示 Run 内部的执行步骤。

例如一次 Reasoning Run 可拆成：
- preflight
- advocate
- critic
- insight extraction
- judge
- decision card generation

Task 的产品意义：
- 支持分步执行与状态展示
- 支持失败定位
- 支持异步 Worker 化

## 7.3 Artifact

Artifact 表示运行过程中产生的中间产物。

例如：
- 抓取原文
- 证据摘要
- stance 结果
- 洞察 JSON
- advocate 文本
- critic 文本
- judge 裁决
- review 总结

Artifact 的产品意义：
- 支持追溯与复用
- 避免大文本长期塞进主上下文
- 为审计、对账、回放提供依据

## 7.4 Snapshot

Snapshot 表示某次运行启动时的输入快照。

例如 Reasoning Run 启动时应固化：
- issue 标题/描述
- 参与证据 ID 列表
- 参与洞察 ID 列表
- preflight 级别
- prompt 版本
- model policy
- triggered by

Snapshot 的产品意义：
- 确保“为什么得出这个结论”可以追溯
- 避免因为后续数据变化导致历史运行不可解释

---

## 8. 核心产品能力

## 8.1 运行可视化

用户应能看到：
- 当前有哪些运行在进行中
- 每个运行处于哪个阶段
- 是否成功 / 失败 / 被取消
- 中间阶段产出了什么

最小展示范围：
- Issue 详情页
- Reasoning 面板
- Data Source 同步记录
- Review 到历史证据的转换状态

## 8.2 流式反馈

Reasoning Run 需要通过 SSE 向前端流式展示：
- 状态变化
- 进度更新
- agent 完成事件
- 洞察生成事件
- 最终完成 / 错误

目标效果：
- 用户感知系统正在“运行”而不是“卡住”
- 中间结果可解释

## 8.3 失败恢复

Runtime 必须支持：
- Worker 失败后的重试
- 中间步骤失败后的状态保留
- 任务级失败定位
- 可人工重新触发

恢复目标：
- 不因为单一步骤失败导致整条链完全不可用

## 8.4 闭环追溯

用户从 DecisionCard 出发，应可追溯到：
- 基础证据
- 提炼洞察
- 三方推理输出
- 行动项
- 回看结果
- 由回看沉淀出的历史证据

## 8.5 治理与审计

平台层应能回答：
- 哪个租户 / 用户触发了哪次运行
- 用了什么模型
- 调用了多少 token / 成本大致多少
- 哪个步骤失败最多
- 哪些运行最慢

---

## 9. 关键用户流程

## 9.1 从数据源到证据

1. 用户创建 Data Source
2. 触发或定时执行 ImportJob
3. Runtime 拉取外部内容
4. 系统生成 Evidence
5. 证据进入摘要、embedding、关联流程

结果：采集链完成，形成可分析证据。

## 9.2 从证据到洞察

1. 证据关联到 Issue
2. 系统自动或手动触发 stance 分析
3. 系统提炼 Insight
4. 用户可确认 / 质疑 / 调整洞察

结果：证据变成结构化判断资产。

## 9.3 从洞察到决策

1. 用户触发某个 Issue 的 reasoning
2. Runtime 执行 preflight
3. Advocate / Critic / Judge 依次执行
4. 中途产生 insight_generated 等事件
5. 系统生成 DecisionCard

结果：形成带推理过程的决策卡。

## 9.4 从决策到行动

1. 用户接受或查看 DecisionCard
2. 系统自动展开建议行动
3. 用户调整优先级、负责人、截止时间
4. Action 进入执行与跟踪

结果：决策从分析走向执行。

## 9.5 从行动到回看再到历史证据

1. 用户创建 Review
2. SummaryWorker 合成经验总结
3. 系统生成 historical evidence
4. 新证据进入后续 embedding / issue 关联 / reasoning 输入

结果：形成真正闭环。

---

## 10. 产品阶段规划

## Phase A：统一运行骨架

目标：先让关键链路“可运行、可见、可追踪”。

包含：
- Run / Task / Artifact / Snapshot 抽象落地
- Reasoning Run 标准化
- ImportJob / SummaryJob 接入统一运行视图
- 基础运行状态页或嵌入式状态面板

## Phase B：统一闭环执行

目标：让证据智能、对抗推理、回看学习真正串起来。

包含：
- stance / insight / decision / review 全链路贯通
- review → historical evidence 自动化
- 决策与行动联动增强

## Phase C：统一治理能力

目标：让 Runtime 具备平台可运营性。

包含：
- 运行指标
- 成本统计
- 重试 / 恢复控制
- 审计视图
- 策略配置（模型、并发、阈值）

## Phase D：统一扩展能力

目标：让 Runtime 能承载更多研究场景。

包含：
- 更多数据源类型
- 更丰富的 Agent 角色
- Prompt / policy 版本管理
- 更细的运行模板化能力

---

## 11. 关键指标

## 11.1 运行效率指标

- Reasoning Run 成功率
- ImportJob 成功率
- Review Summary 成功率
- 平均运行耗时
- 平均恢复成功率

## 11.2 产品效果指标

- 每个 Issue 的有效证据数
- 自动生成洞察的确认率
- DecisionCard 被采纳率
- Action 完成率
- Review 回流证据使用率

## 11.3 平台治理指标

- 单租户平均 token 消耗
- 每类 Run 的失败 Top 原因
- Worker 队列积压情况
- 高耗时链路分布

---

## 12. 关键产品原则

### 原则 1：先做执行稳定，再做 Agent 花样
先确保每条主链路可运行、可恢复、可追踪，而不是先追求复杂多 Agent 表现。

### 原则 2：先做中间状态可见，再做最终结果更聪明
用户信任建立于过程可解释，而不只是最终输出像不像“聪明答案”。

### 原则 3：先做 Issue 中心化，再做平台泛化
当前一切 Runtime 设计以 Issue 为核心锚点，避免过早抽象成过度通用平台。

### 原则 4：先做闭环，再做规模化
ResearchOS 的护城河在于“经验回流”，不是只会生成一次报告。

---

## 13. 最终产品定义

ResearchOS Runtime 的最终定义可以压缩为一句话：

> **ResearchOS Runtime = 一个围绕议题，把证据、洞察、对抗推理、决策、行动、回看组织成可执行闭环的 Agent Runtime。**

它不是附属技术层，而是未来产品的主干能力。

当这层成立后，ResearchOS 才真正从：

- 证据管理系统
- AI 分析功能集合

升级为：

- **研究与决策执行系统**
- **可持续学习的 Agent Runtime 产品**
