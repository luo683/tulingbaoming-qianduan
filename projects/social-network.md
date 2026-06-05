---
title: 社交网络
date: 2025-11
tags: [Spring Boot, Spring Security, JPA, Thymeleaf, Maven]
---

# 社交网络

## 项目概述

全栈社交网络平台，支持用户注册登录、动态发布、好友互动、即时通讯等功能，采用 Spring Boot 全家桶构建。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Spring Boot + Spring Security |
| ORM | Spring Data JPA |
| 模板 | Thymeleaf + Bootstrap 5 |
| 数据库 | MySQL + Redis |
| 构建 | Maven |
| 通讯 | WebSocket |

## 核心功能

- **用户系统**：注册、登录、个人资料编辑、头像上传
- **动态广场**：发布图文动态，支持点赞、评论
- **好友系统**：添加好友、好友推荐、好友列表
- **即时通讯**：基于 WebSocket 的实时聊天
- **通知系统**：系统通知、互动提醒
- **权限管理**：基于 Spring Security 的角色权限控制

## 项目成员

- 王浩然（后端架构）
- 吴凯翔（前端页面）
- 刘诗琪（数据库设计）

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
