# Harness 工程：从 Claude Code 到通用 Agent Runtime 的系统化总结

## 1. 什么是 Harness 工程

在 AI Agent 语境里，**Harness 工程** 不是某个提示词技巧，也不是一个聊天 UI，而是：

> 把大模型、工具、上下文、权限、任务、扩展能力组织成一个可持续运行、可恢复、可治理的执行系统的工程能力。

如果只调用一次模型并返回文本，那只是 LLM 应用；
如果系统能够：

- 根据当前上下文决定下一步动作
- 调用工具获取外部信息或执行操作
- 处理多轮执行中的状态推进
- 在上下文变长时压缩与恢复
- 在复杂任务中拆解为多个子任务 / 子 Agent
- 在受控权限下调用外部系统
- 支持审计、恢复、扩展

那么这个系统背后就一定有一层 **Harness / Runtime**。

因此，Harness 工程可以被理解为：

> **Agent 的执行内核工程（Execution Kernel Engineering）**

它最像操作系统里的“内核层”，而不是“桌面 UI 层”。

---

## 2. 为什么 Claude Code 的核心更像 Harness，而不是 CLI

Claude Code 表面上看是一个终端里的 AI 编程助手，但从工程结构看，它最核心的部分并不是 CLI 界面，也不是 slash commands，而是下面这套 Runtime 能力：

1. 工具注册 / 筛选 / 权限暴露机制
2. query 执行循环
3. 上下文压缩与恢复
4. 多 Agent / Task Runtime
5. MCP / Skill 扩展接口

这些能力具备一个特征：

- 它们**不依赖终端界面本身**
- 它们**可以迁移到 Web、IDE、Slack、API 服务、后台 Worker**
- 换掉 UI，系统仍然成立

所以更准确的定义应该是：

> **Claude Code 是一个以 CLI 为产品壳的 LLM Agent Harness。**

CLI 只是交互入口，Harness 才是执行核心。

---

## 3. Harness 工程的核心目标

一套成熟的 Harness 工程，核心上在解决以下问题：

### 3.1 让模型“能做事”
而不仅是“会说话”。

也就是通过工具系统，把外部能力暴露给模型，例如：

- 搜索网页
- 读取文件
- 编辑代码
- 调数据库
- 调内部 API
- 创建任务
- 发送消息

### 3.2 让模型“能持续做事”
而不仅是做一轮。

也就是通过执行循环，把模型从“一问一答”升级为“多步执行系统”：

- 计划
- 观察
- 调工具
- 接收结果
- 继续下一步
- 直到完成

### 3.3 让模型“在长任务里不崩”
因为真实任务一定遇到：

- 上下文越来越长
- 工具结果越来越多
- 历史越来越脏
- 中断 / 失败 / 限额 / 输出截断

这就要求 Runtime 具备上下文压缩、恢复、重试、降级能力。

### 3.4 让复杂任务能拆开跑
单 Agent 在很多场景里不够用，需要：

- 任务拆分
- 并行执行
- 子 Agent 协作
- 结果汇总

### 3.5 让系统能长能力
如果每加一个新能力都要改主仓库，那系统很难平台化。
因此需要：

- MCP
- Skills
- 插件接口
- Provider 层
- 外部工具接入规范

---

## 4. Harness 工程的五大核心支柱

---

### 4.1 工具注册 / 筛选 / 权限暴露机制

这是 Harness 的“手脚系统”。

#### 4.1.1 工具为什么是 Agent 的基础
没有工具，模型只能给建议，不能真正执行动作。

有了工具后，模型才具备：

- 读取外部信息
- 触发真实操作
- 验证假设
- 扩展能力边界

所以 Agent 和 Chatbot 的核心区别之一，就是是否有完整的工具运行时。

#### 4.1.2 这一层解决什么问题

一套成熟的工具层至少要解决：

- 工具有哪些
- 工具的 schema 是什么
- 哪些工具当前可见
- 哪些工具当前不可见
- 哪些工具需要审批
- 哪些工具只能某些角色使用
- 工具返回如何结构化给模型
- 工具调用如何审计

#### 4.1.3 关键设计原则

##### 原则 A：先筛工具，再给模型看
最好的做法不是模型看见所有工具、调用时再拒绝；
而是：**模型从一开始就只看到允许它看到的工具。**

原因：

- 如果模型知道某工具存在，它会规划依赖该工具的路径
- 运行时再拒绝，会导致执行路径混乱
- 提前裁剪更稳定、更安全

##### 原则 B：工具分级
建议至少分三类：

1. **Read Tools**：只读工具，默认可自动执行
2. **Write Tools**：改状态但可逆的工具
3. **Side-effect Tools**：外发、删除、发布、扣费等高风险工具

第三类默认应要求审批或更严格权限。

##### 原则 C：工具不是函数集合，而是 Runtime 对象
一个工具不只是 execute()，还应包含：

- name
- description
- input schema
- output shape
- visibility rule
- approval policy
- risk level
- audit metadata

#### 4.1.4 一个推荐抽象

```ts
interface Tool {
  name: string
  description: string
  inputSchema: unknown
  risk: 'low' | 'medium' | 'high'
  isVisible(ctx: RuntimeContext): boolean
  requiresApproval(input: unknown, ctx: RuntimeContext): boolean
  execute(input: unknown, ctx: RuntimeContext): Promise<ToolResult>
}
```

#### 4.1.5 在 Claude Code 中的体现
Claude Code 的工具系统并不是固定暴露所有工具，而是通过多阶段装配：

- Base tools
- deny/allow 规则过滤
- mode 过滤
- REPL / headless 场景差异
- MCP 工具拼装

这说明其思路不是“工具列表”，而是“动态工具池”。

#### 4.1.6 对通用产品的启发
不管是 Web Agent、企业内部 Agent 平台、还是 SDK，工具层都是第一优先级，因为它决定：

> 模型到底能做什么。

---

### 4.2 query 执行循环

这是 Harness 的“大脑执行器”。

#### 4.2.1 为什么执行循环是 Agent 的内核
普通聊天系统是：

- 用户提问
- 模型回答
- 结束

Agent 系统是：

- 用户提出目标
- 模型判断下一步
- 调工具
- 获取结果
- 再判断下一步
- 再调工具
- 直到任务完成

这其实就是一个 **状态机 / 执行循环**。

#### 4.2.2 一个最小 Agent Loop

```ts
while (!done) {
  const output = await callModel(messages, tools)

  if (output.type === 'final') {
    return output
  }

  if (output.type === 'tool_calls') {
    const results = await executeTools(output.toolCalls)
    messages.push(...formatToolResults(results))
  }
}
```

#### 4.2.3 真实系统里要比这复杂得多
在生产级 Harness 中，query loop 通常还要处理：

- 流式输出
- 多工具并发
- 中间状态可视化
- 工具超时
- 工具失败重试
- 模型输出截断
- prompt 过长
- 模型 fallback
- 人类审批暂停
- 自动 compact

#### 4.2.4 query loop 真正承担的责任
它负责的是“执行秩序”：

- 什么时候调用模型
- 什么时候执行工具
- 工具结果以什么形式回注
- 什么时候终止
- 什么时候暂停等待审批
- 什么时候触发压缩
- 什么时候需要恢复

因此它几乎就是 Runtime 的内核态。

#### 4.2.5 为什么 Claude Code 的 query.ts 那么关键
因为它不是“一个业务函数”，而是：

- 推进 Agent 状态
- 编排工具执行
- 管理上下文预算
- 承接异常恢复
- 为 REPL 和 headless 共享执行核心

也就是说，它承接的是整套系统最核心的控制流。

#### 4.2.6 对通用产品的启发
如果要做 Web Agent / SDK / 企业平台，最先稳定的不是 UI，而是 query loop。因为 UI 换了，query loop 还在；但 query loop 不稳，任何 UI 都只是一层脆弱包装。

---

### 4.3 上下文压缩与恢复

这是 Harness 的“长期生存能力”。

#### 4.3.1 为什么上下文管理是 Agent 和 Demo 的分水岭
很多 Demo 系统在前两轮看起来很聪明，但一旦开始真实任务，就会迅速暴露问题：

- 对话越来越长
- 工具结果越来越多
- 模型遗忘前文
- token 超限
- 输出中断
- 历史污染

所以长期运行能力才是 production-grade agent 的关键。

#### 4.3.2 上下文不应该等于“完整历史回放”
错误做法：

- 每轮都把所有历史原样塞回模型

正确做法：

- 分层管理上下文

推荐至少分四层：

1. **System Layer**：固定规则、产品身份、边界约束
2. **Working State**：当前任务状态、已完成步骤、关键发现、未解决问题
3. **Transcript Layer**：最近若干轮高相关历史
4. **Artifact Layer**：长文本、网页抓取、报告、结构化结果，外部存储，仅摘要入上下文

#### 4.3.3 为什么要把大结果外置为 Artifact
因为工具结果中常见大量内容：

- 网页全文
- 文档全文
- SQL 结果集
- 日志片段
- 报告草稿

这些内容不应直接常驻上下文，而应：

- 存储为 artifact
- 提供 summary
- 按需 read-back

这样上下文里保留的是“索引 + 摘要 + 关键字段”，而不是原始全文。

#### 4.3.4 恢复机制至少应包括

##### A. Prompt Too Long 恢复
当 prompt 过长时：

- 压缩 working memory
- 裁剪低价值 transcript
- 将长结果转为 artifact 引用

##### B. Max Output Tokens 恢复
当模型输出被截断时：

- 增加输出预算
- 继续输出
- 或切分输出阶段

##### C. Run Resume
当任务中断时：

- 从持久化状态恢复
- 继续未完成步骤
- 保留已完成结果

##### D. Model Fallback
主模型失败时：

- 降级备用模型
- 或切换较小模型做压缩 / 摘要

#### 4.3.5 Claude Code 给出的重要启发
Claude Code 的自动 compact、context collapse、token budget、prompt-too-long 恢复逻辑说明：

> 真正的 Agent Runtime，必须把“上下文失控”视为常态问题，而不是偶发异常。

#### 4.3.6 对通用产品的启发
如果你要做长任务型 Agent，不先做上下文治理，后面一定会在：

- 稳定性
- 成本
- 可恢复性
- 可解释性

这四个维度上同时吃亏。

---

### 4.4 多 Agent / Task Runtime

这是 Harness 的“组织能力”。

#### 4.4.1 为什么复杂任务最终会需要 Task Runtime
很多任务不是单线程最优的，例如：

- 多来源调研
- 多网页抓取与比较
- 报告生成 + 校验
- 批量数据提取
- 多角色分析（正方 / 反方 / 裁判）

这些任务天然适合拆解。

#### 4.4.2 先理解 Task，再理解 Multi-Agent
很多人一提多 Agent，就想到多个模型自由聊天。但更稳的工程方式通常是：

> 先做 **Task Runtime**，再决定是否用 Agent 来执行某些 Task。

也就是说，真正核心的是：

- 任务如何表示
- 任务如何依赖
- 任务如何调度
- 任务如何记录状态
- 任务如何恢复

而不是“让几个 Agent 自己聊”。

#### 4.4.3 一个推荐的任务抽象

```ts
interface Task {
  id: string
  type: string
  input: unknown
  status: 'pending' | 'running' | 'done' | 'failed'
  dependsOn: string[]
  artifactIds: string[]
  assignedWorker?: string
}
```

#### 4.4.4 什么时候需要多 Agent
当任务具备以下特点时，多 Agent 会明显受益：

- 可以并行
- 不同步骤上下文差异大
- 某些步骤需要不同工具集
- 某些步骤需要不同推理风格
- 单一上下文太重

#### 4.4.5 在产品中常见的角色拆分
例如一个调研系统，可以拆成：

- Research Agent：搜集材料
- Extraction Agent：提取结构化信息
- Synthesis Agent：归纳结论
- Critic Agent：找漏洞、补缺失
- Judge Agent：做裁决与最终输出

这类拆分的价值不在“人格化”，而在：

- 上下文隔离
- 任务边界清晰
- 并发执行
- 易于治理

#### 4.4.6 Claude Code 的启发
Claude Code 的 Agent / Team / Task 相关能力说明，它已经不只是单体工具调用器，而是具备基本的“组织型 runtime”：

- 子 Agent 派发
- Team 协作
- Task 管理
- SendMessage 通讯
- 本地 / 远程任务抽象

这意味着它在向“Agent Operating System”方向演化。

#### 4.4.7 对通用产品的启发
对于大多数产品来说：

- 第一阶段：单 Agent + Tool Loop
- 第二阶段：Orchestrator + Task Workers
- 第三阶段：角色化多 Agent + Shared Artifact Store + Resume

不要一开始就做自由对话式多 Agent；先把 Task Runtime 做稳，收益更大。

---

### 4.5 MCP / Skill 扩展接口

这是 Harness 的“生态接口”。

#### 4.5.1 为什么扩展接口是平台化的关键
如果系统所有能力都写死在主仓库里，那么：

- 每加一个新能力都要改核心代码
- 发布节奏受主项目约束
- 业务方无法自定义
- 平台很难被复用

所以一个成熟 Harness 必须支持：

- 外部能力接入
- 高层动作模板化
- 工具生态扩展
- 与主 Runtime 解耦

#### 4.5.2 MCP 的意义
MCP 更像标准化外部能力协议：

- Runtime 负责协议和执行
- 外部 Provider 负责提供资源 / 工具 / 能力

这让系统可以接入：

- 企业文档系统
- CRM
- 数据仓库
- Ticket 系统
- 浏览器控制
- 设计系统
- 第三方 SaaS

#### 4.5.3 Skill 的意义
Skill 不是单个工具，而更像一类“可复用的高层动作模板”，一般包含：

- 场景目标
- 推荐工具集
- prompt addon
- 输出格式
- 约束条件
- 交互模板

例如：

- 竞品分析
- 周报生成
- PR 评审
- 错误诊断
- 会议准备

#### 4.5.4 为什么 Skill 和 Tool 要分层
Tool 回答的是：**能做什么具体动作**
Skill 回答的是：**在某个业务目标下，怎么组织这些动作**

所以：

- Tool 偏原子能力
- Skill 偏复合策略

#### 4.5.5 Claude Code 的启发
Claude Code 中 Skill 和 MCP 并不是附属能力，而是第一类扩展点。这意味着其架构目标不是“封闭产品”，而是“可生长的 Agent 平台”。

#### 4.5.6 对通用产品的启发
如果将来希望：

- 多团队复用
- 外部系统接入
- 模板化场景能力
- 降低主仓库演化压力

那么扩展接口必须尽早设计，而不是等到功能堆大之后补。

---

## 5. Harness 工程的分层模型

一套成熟的 Harness，可以抽象为如下分层：

### 5.1 壳层（Shell Layer）
用户直接交互的部分：

- CLI
- Web UI
- IDE 插件
- Slack Bot
- API

这一层负责：

- 接收输入
- 展示输出
- 展示状态
- 提供审批和控制面板

### 5.2 Runtime 层（Execution Kernel）
这是 Harness 的核心层，包括：

- Tool Registry
- Permission Filter
- Query Loop
- Context Builder
- Compaction Engine
- Recovery Logic
- Task Runtime
- Approval Flow
- Model Routing

### 5.3 Integration 层（Extension / Provider Layer）
对外部能力的统一抽象：

- MCP
- Skills
- 第三方 API 工具
- 企业内部系统 Connector
- 数据源 Provider

### 5.4 Storage / Control 层
支持持久化、治理和观测：

- Session Store
- Artifact Store
- Task Store
- Audit Log
- Metrics / Trace
- Policy Store

---

## 6. Harness 工程与几个常见概念的边界

### 6.1 Harness ≠ Prompt
Prompt 只是策略配置的一部分。
Harness 决定的是：

- prompt 在什么上下文里运行
- 模型何时被调用
- 工具何时被调度
- 失败如何恢复
- 状态如何存续

所以：

> Prompt 决定行为风格，Harness 决定系统能力边界。

### 6.2 Harness ≠ UI
UI 是入口层，Harness 是执行内核。
换 Web、换 CLI、换 IDE，Harness 仍然成立。

### 6.3 Harness ≠ Workflow Engine
Workflow Engine 偏静态流程；
Harness 更强调：

- 模型参与决策
- 工具动态调用
- 上下文驱动执行
- 不完全预定义的多步过程

不过在复杂场景里，两者常常结合。

### 6.4 Harness ≠ 单纯的 Agent Framework
很多框架只管：

- prompt 组织
- tool calling

但 Harness 更强调：

- 运行时控制
- 长任务稳定性
- 权限治理
- 恢复能力
- 平台化扩展

---

## 7. 为什么这套能力高度通用

Harness 的通用性，来自它回答的是“Agent 系统的共性问题”，而不是某个业务领域的特例。

### 7.1 它回答的都是基础问题

1. 模型能用什么能力？
2. 模型如何一步步执行任务？
3. 长任务如何不崩？
4. 复杂任务如何拆开做？
5. 新能力如何接入？

这些问题在以下场景都成立：

- 编程 Agent
- 调研 Agent
- 销售助手
- 客服 Agent
- 企业知识工作流
- 法务分析系统
- 财务对账助手
- 市场研究平台

### 7.2 壳可以变，内核不变
换掉产品壳以后：

- CLI → Web
- Web → Slack
- Slack → API Service
- API Service → Autonomous Worker

但只要还是 Agent，下面仍然要有：

- 工具
- 执行循环
- 上下文管理
- 任务运行时
- 扩展接口

这就是它通用的原因。

---

## 8. 适合使用 Harness 工程的产品类型

以下产品特别适合用 Harness 思维来设计：

### 8.1 垂直 Agent 产品
例如：

- 市场研究 Agent
- 竞品分析 Agent
- 销售会前准备 Agent
- 客服工单总结 Agent
- 法务合同审阅 Agent

### 8.2 企业内部 Agent 平台
例如：

- 统一接内部系统
- 支持多个部门 Agent
- 提供权限、审计、审批、治理

### 8.3 Agent Runtime SDK
对外提供：

- Tool Registry
- Query Loop
- Task Runtime
- Context Engine
- Skill / MCP 接口

让别的团队快速构建 Agent 产品。

### 8.4 复杂 Workflow Automation
例如：

- 自动化研究
- 智能报告生成
- 数据汇总与分析
- 多系统工作流编排

---

## 9. 不适合重型 Harness 的场景

并不是所有 AI 产品都需要完整 Harness。

以下场景可能只需要轻量方案：

- 简单问答
- 固定模板生成
- 纯 RAG 检索
- 无工具调用
- 无长任务状态
- 无权限分层

如果任务不涉及：

- 多步执行
- 工具系统
- 长上下文
- 审计/恢复
- 多任务拆解

那么完整 Harness 可能过重。

---

## 10. 面向产品设计的关键启示

### 10.1 先做可控，再做聪明
很多系统失败不是因为模型不够强，而是因为：

- 工具太乱
- 上下文失控
- 任务不可恢复
- 没有权限边界
- 扩展能力混乱

所以优先级应该是：

1. 工具边界清晰
2. 执行循环稳定
3. 状态持久化
4. 恢复机制可用
5. 审计和治理就位

### 10.2 先做真实场景，再抽象通用平台
不要一上来就做“万能 Agent 平台”。
更现实的方法是：

- 先在一个垂直场景做出 runtime
- 再提炼公共能力
- 最后沉淀为 SDK 或企业平台

### 10.3 多 Agent 不是第一步
第一步通常应该是：

- 单 Agent
- 稳定 Tool Loop
- 基础 Context 管理

第二步才是：

- Task Runtime
- Worker 分工
- 并发任务

多 Agent 是组织能力升级，不是起步条件。

---

## 11. 一个通用 Harness 的参考架构

```txt
[Shell Layer]
  Web / CLI / IDE / Slack / API

        ↓

[Runtime Layer]
  - Model Router
  - Query Loop
  - Tool Registry
  - Permission / Approval
  - Context Manager
  - Compaction / Recovery
  - Task Runtime
  - Agent Orchestrator

        ↓

[Extension Layer]
  - MCP Providers
  - Skill Registry
  - Internal Connectors
  - External APIs

        ↓

[Storage & Control Layer]
  - Sessions
  - Artifacts
  - Tasks
  - Audit Logs
  - Metrics / Traces
  - Policies
```

---

## 12. 对 ResearchOS 的直接启发

ResearchOS 本身就非常适合 Harness 思路，因为它不是普通聊天应用，而是一个：

- 多源证据驱动
- 长流程推理
- 多角色对抗
- 需要数据源管理
- 需要任务链路与审计
- 需要从证据走到决策和行动

的系统。

尤其是你定义的三方 Agent：

- Advocate（正方）
- Critic（反方）
- Judge（裁判）

本质上就非常接近 **Task Runtime + Multi-Agent Orchestration** 的典型设计。

这说明 ResearchOS 的核心不应该只理解为“一个 AI 功能模块”，而更适合理解为：

> **一个面向研究与决策场景的 Agent Runtime 产品。**

也就是说，未来它的关键竞争力可能不只是：

- 某个 prompt 写得多好
- 某个页面多好看

而是：

- 证据工具如何组织
- 推理执行链如何编排
- 长任务如何管理
- 多 Agent 如何协作
- 决策链如何审计与闭环

---

## 13. 最终结论

Harness 工程的本质，不是把模型“接进产品”，而是把模型“组织成系统”。

它解决的不是单次问答，而是：

- 能力暴露
- 执行编排
- 上下文治理
- 任务组织
- 扩展生态
- 权限控制
- 恢复与审计

因此可以把它压缩为一句话：

> **Harness 工程 = 面向 LLM 的执行内核工程。**

而 Claude Code 这类系统给出的最大启发是：

> 真正可用的 Agent 产品，核心竞争力往往不在表层 UI，而在这套 Runtime 是否足够稳定、可控、可扩展、可恢复。

如果未来要做：

- Agent Runtime SDK
- 企业内部 Agent 平台
- 垂直场景 Agent 产品
- 多 Agent 研究与决策系统

那么 Harness 工程都应该被当作第一性基础设施来设计，而不是后补能力。
