---
title: 从零实现一个简易数据库
date: 2026-03-22
author: 赵六
tags: [数据库, C]
description: 用 C 语言从零构建一个支持 SQL 子集的简易关系型数据库，理解存储引擎原理。
---

# 从零实现一个简易数据库

写一个数据库是理解"数据如何存储和检索"的最佳方式。本文展示一个支持基本 SQL 的玩具数据库的核心实现。

## 整体架构

```
┌─────────────┐
│   SQL 解析   │  词法分析 → 语法分析 → AST
├─────────────┤
│   执行引擎   │  遍历 AST，执行对应操作
├─────────────┤
│   存储引擎   │  B-Tree 索引 + 页式存储
├─────────────┤
│   磁盘文件   │  持久化到 .db 文件
└─────────────┘
```

## 存储引擎：页式管理

数据库不直接读写磁盘上的每个字节，而是以"页"为单位：

```c
#define PAGE_SIZE 4096

typedef struct {
    uint32_t page_id;
    uint8_t  data[PAGE_SIZE];
    bool     is_dirty;  // 是否需要写回磁盘
} Page;
```

### B-Tree 索引

B-Tree 是关系型数据库最常用的索引结构。每个节点存储一组有序的 key 和指向子节点的指针：

```c
typedef struct BTreeNode {
    bool     is_leaf;
    uint32_t num_keys;
    uint32_t keys[MAX_KEYS];
    uint32_t children[MAX_KEYS + 1];  // page_id
} BTreeNode;
```

查找一个 key 的时间复杂度为 O(log n)，且 B-Tree 天然适合磁盘场景——每个节点大小等于一个页，一次磁盘 I/O 读取一个节点。

## SQL 解析器

用递归下降解析器处理子集 SQL：

```c
// SELECT name, age FROM users WHERE age > 18
typedef struct {
    char     columns[MAX_COLS][MAX_NAME_LEN];
    int      num_columns;
    char     table[MAX_NAME_LEN];
    WhereClause where;
} SelectStmt;

SelectStmt parse_select(Tokenizer *t);
```

## 小结

这个玩具项目虽只有几百行代码，但涵盖了数据库核心的三个模块。推荐有兴趣的同学读一下 [SQLite 源码](https://sqlite.org/src) 或 [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/) 教程。

<RelatedPosts currentTitle="从零实现一个简易数据库" :currentTags='["数据库", "C"]' />

<AskQuestion />
