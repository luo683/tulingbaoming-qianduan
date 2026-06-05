---
title: 终点小说网
date: 2026-03
tags: [Vue3, MyBatis-Plus, Spring Cloud, Redis, RabbitMQ, ElasticSearch, 微服务]
---

# 终点小说网

## 项目概述

基于微服务架构的在线小说阅读平台，支持海量小说在线阅读、搜索、推荐及用户互动等核心功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus |
| 网关 | Spring Cloud Gateway |
| 服务 | Spring Boot + MyBatis-Plus |
| 缓存 | Redis（热点章节缓存、排行榜） |
| 消息队列 | RabbitMQ（异步通知、数据同步） |
| 搜索 | ElasticSearch（全文检索） |
| 数据库 | MySQL 8.0（分库分表） |

## 核心功能

- **小说搜索**：基于 ElasticSearch 的全文检索，支持关键词高亮、分词搜索
- **章节阅读**：流畅的阅读体验，支持书签、夜间模式、字体调整
- **推荐系统**：基于用户阅读历史的协同过滤推荐
- **用户系统**：注册登录、书架管理、阅读记录同步
- **作者后台**：作品管理、章节发布、数据统计

## 项目架构

```
├── gateway-service       # 网关服务
├── user-service          # 用户服务
├── novel-service         # 小说服务
├── search-service        # 搜索服务
├── recommend-service     # 推荐服务
├── notification-service  # 通知服务
└── common                # 公共模块
```

## 项目成员

- 张明宇（后端架构）
- 李思涵（前端开发）
- 王浩然（数据库设计）

---

<a href="/projects/" class="back-link">← 返回项目列表</a>

<style>
.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}
.back-link:hover {
  text-decoration: underline;
}
</style>
