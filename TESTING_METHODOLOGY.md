# Testing Methodology

This document explains the experimental logic behind the platform in this repository, and how the implementation maps onto the research design described in the project plan ("Mental Imagery and Programming Ability: Visual Scaffolding for Code Tracing Across Different Imagery Profiles").

本文档说明这个仓库里的平台背后的实验逻辑，以及具体实现如何对应到项目计划书中描述的研究设计（《心理意象与编程能力：面向不同意象画像的代码追踪可视化支架》）。

## 1. Research question

The platform tests two related hypotheses (see Figure 1 in the project plan):

- **H1 (main pathway):** richer mental imagery leads to stronger internal mental simulation, which leads to better code-tracing outcomes.
- **H2 (moderation):** visual scaffolding changes how strongly the H1 pathway holds — i.e., does scaffolding help participants with different imagery profiles to different degrees?

Everything the platform collects is aimed at letting these two hypotheses be tested against real data, rather than assumed.

这个平台要检验两个相关联的假设（见项目计划书图 1）：

- **H1（主路径）**：意象越丰富，内部心理模拟越强，代码追踪的表现就越好。
- **H2（调节效应）**：可视化支架会改变 H1 这条路径的强弱——也就是说，支架对不同意象画像的人帮助程度是否不同。

平台采集的所有数据，目的都是让这两个假设能用真实数据去检验，而不是停留在假设层面。

## 2. What is measured

### Imagery profile (predictor / moderator variable)

An 8-item self-report questionnaire (`frontend/src/data/imageryQuestionnaire.ts`) spanning four dimensions, each rated 1–7:

- Visual vividness
- Imagery control
- Imagery stability
- Spatial/flow imagery

This is not scored right/wrong — it is a self-assessment of a cognitive trait, independent of programming ability.

## 2. 测量了什么

### 意象画像（自变量/调节变量）

一份 8 题的自评问卷（`frontend/src/data/imageryQuestionnaire.ts`），涵盖四个维度，每题 1-7 分：

- 视觉生动性
- 意象控制
- 意象稳定性
- 空间/流动意象

这部分不判断对错——它测的是一种认知特质的自我评估，跟编程能力无关。

### Code-tracing performance (outcome variable)

Six code-tracing tasks (`backend/app/data/seed_tasks.py`), each covering a different construct: variable assignment, loops, conditionals, function/recursion, and mutable state. For every task, four things are recorded:

| Field | What it captures |
|---|---|
| `correct` | Auto-scored server-side against a hidden expected answer — never sent to the client |
| `completion_time_ms` | Time from task presentation to answer submission |
| `confidence` | 1–7 self-rated confidence in the answer |
| `explanation` | Optional free-text reasoning, for later qualitative analysis |

### 代码追踪表现（因变量）

六道代码追踪任务（`backend/app/data/seed_tasks.py`），分别对应不同的构念：变量赋值、循环、条件分支、函数/递归、可变状态。每道题都记录四项数据：

| 字段 | 记录的内容 |
|---|---|
| `correct` | 后端用隐藏的标准答案自动判分——前端从未拿到过标准答案 |
| `completion_time_ms` | 从任务出现到提交答案所用的时间 |
| `confidence` | 1-7 分的自评信心 |
| `explanation` | 可选的文字说明，供后续质性分析使用 |

## 3. Experimental design: within-subject, balanced, randomized

Each task is independently assigned to one of two conditions when a participant is created (`assign_conditions()` in `backend/app/routers/participants.py`):

- `code_only` — code shown alone
- `scaffolded` — code plus one of three visual scaffolds (variable-state table, execution timeline, or control-flow cues), chosen at random

The assignment is shuffled and then split exactly in half, so every participant sees 3 tasks in each condition — this is a **within-subject design**: each participant is their own control, so `scaffolded` vs `code_only` performance can be compared without needing between-subject comparisons. The frontend additionally shuffles presentation order (`shuffle()` in `App.tsx`) so that condition is never confounded with task position (e.g. "always easier at the start").

## 3. 实验设计：组内被试 + 平衡随机化

每个被试者创建时，每道任务都会被独立随机分到两种条件之一（`backend/app/routers/participants.py` 里的 `assign_conditions()`）：

- `code_only` —— 只显示代码
- `scaffolded` —— 代码 + 三种可视化支架之一（变量状态表、执行时间线、控制流提示，随机选一种）

分配前先洗牌再正好切一半，保证每个被试者在两种条件下各做 3 道题——这就是**组内设计**：每个人都是自己的对照组，"有支架 vs 无支架"的表现可以直接在同一个人身上比较，不需要跨被试者比较。前端还会再打乱任务的呈现顺序（`App.tsx` 里的 `shuffle()`），避免条件和题目顺序产生混淆（比如"总是先做的题更简单"）。

## 4. Controlling for confounds

Two design choices exist specifically to keep the comparison clean:

- **Built-in function glossary.** Any non-core built-in used in a task's code (`range()`, `list.append()`, recursion, etc.) is explained in a small reference panel that renders identically regardless of condition. This removes "does the participant know this API" as a source of error, so failures can be attributed to tracing ability rather than language familiarity.
- **Scaffolds never reveal the answer.** All three scaffold types are derived from a static, indentation-based structural parser (`frontend/src/components/scaffolds/codeStructure.ts`) that identifies loop/conditional/function nesting without executing the code. They show structure or provide scratch space only — never a runtime value — otherwise the scaffold would just hand participants the answer and the comparison would be meaningless.

## 4. 控制混淆变量

有两个设计选择专门是为了保证比较的纯净性：

- **内置函数说明栏。** 任务代码里用到的非核心内置函数（`range()`、`list.append()`、递归等）都会在一个小的参考面板里解释，且无论哪种条件下都展示得一模一样。这样就把"被试者认不认识这个 API"这个误差来源排除掉了，答错了才能归因于追踪能力，而不是语言熟悉度。
- **支架从不泄露答案。** 三种支架类型都是从静态的缩进结构解析器（`frontend/src/components/scaffolds/codeStructure.ts`）推导出来的，只识别循环/条件/函数的嵌套关系，从不真正执行代码。它们只展示结构信息或提供草稿空间——绝不展示运行时的具体数值——否则支架等于直接把答案给了被试者，比较就没有意义了。

## 5. From data to hypothesis test

The export endpoints (`/api/export/dataset.csv`, `/api/export/imagery-profiles.json`) each produce one row per observation — one participant, one task, one condition. Joining the two datasets on `participant_id` allows:

- Testing **H1** — correlating imagery-dimension scores with overall tracing accuracy/time/confidence.
- Testing **H2** — checking whether the scaffolding effect (scaffolded vs. code_only performance) is larger or smaller for participants with different imagery profiles (i.e., an interaction/moderation effect), which is the platform's central research contribution.

Given a likely modest pilot sample size, the project plan already anticipates leaning on descriptive statistics and visual analysis alongside cautious correlational claims, rather than requiring strong inferential power.

## 5. 从数据到假设检验

导出接口（`/api/export/dataset.csv`、`/api/export/imagery-profiles.json`）每一行都是一次观测——某个被试者、某道题、某种条件下的记录。把两份数据按 `participant_id` 拼接起来，就可以：

- 检验 **H1** —— 把意象各维度得分和整体追踪的准确率/时间/信心做相关分析。
- 检验 **H2** —— 看支架带来的效果（scaffolded 相对 code_only 的表现差异）在不同意象画像的人身上是不是有大有小（也就是交互/调节效应），这才是这个平台真正的研究贡献所在。

考虑到试点样本量可能不大，项目计划书里也提前说明了会更多依赖描述统计和可视化分析，谨慎地下相关性结论，而不是强求统计推断力。
