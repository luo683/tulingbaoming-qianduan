---
title: 深入理解 Linux 进程调度
date: 2026-04-28
author: 李四
tags: [操作系统, Linux]
description: CFS 完全公平调度器的设计原理与实现细节，结合内核源码分析。
---

# 深入理解 Linux 进程调度

Linux 内核的进程调度器（Scheduler）决定了哪个进程在什么时间获得 CPU。从早期的 O(n) 调度器到今天的 CFS（Completely Fair Scheduler），每一次迭代都体现了对"公平"与"效率"的更深理解。

## 为什么需要调度器

现代计算机上同时运行着成百上千个进程，但 CPU 核心数有限。调度器的职责是：

1. **公平分配** CPU 时间给所有可运行的进程
2. **响应速度** 保证交互式任务（如 UI）不被批处理任务饿死
3. **吞吐量** 最大化 CPU 利用率

## CFS 的核心思想

CFS 从 2.6.23 内核开始成为默认调度器。它的核心数据结构是**红黑树**，key 是每个进程的 `vruntime`（虚拟运行时间）。

```c
struct sched_entity {
    struct rb_node    run_node;   // 红黑树节点
    u64               vruntime;   // 虚拟运行时间
    u64               exec_start; // 本次运行起始时间
    u64               sum_exec_runtime; // 累计运行时间
};
```

### vruntime 的计算

`vruntime` 不是墙钟时间，而是经过权重修正的:

```
vruntime += 实际运行时间 × (NICE_0_LOAD / 当前进程权重)
```

这意味着 nice 值越低（优先级越高）的进程，vruntime 增长越慢，在红黑树中的位置越靠左，更容易被选中。

## pick_next_task: 选择下一个进程

CFS 选取最左边（vruntime 最小）的节点作为下一个要运行的进程，复杂度 O(1):

```c
static struct sched_entity *
pick_next_entity(struct cfs_rq *cfs_rq)
{
    struct rb_node *left = rb_first(&cfs_rq->tasks_timeline);
    return rb_entry(left, struct sched_entity, run_node);
}
```

## 小结

CFS 通过红黑树 + vruntime 的设计，做到了"没有绝对的时间片，只有相对公平"。理解 CFS 是理解 Linux 内核调度子系统的最佳入口。

<RelatedPosts currentTitle="深入理解 Linux 进程调度" :currentTags='["操作系统", "Linux"]' />

<AskQuestion />
