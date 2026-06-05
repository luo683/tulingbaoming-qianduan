---
title: Rust 入门：所有权与借用
date: 2026-05-10
author: 张三
tags: [Rust, 系统编程]
description: 从内存安全的角度理解 Rust 最核心的特性，用实例讲解所有权、引用和生命周期。
---

# Rust 入门：所有权与借用

Rust 的所有权（Ownership）系统是其最核心、也最独特的特性。它让 Rust 在无需垃圾回收器的前提下保证内存安全。

## 所有权规则

Rust 中每个值都有且只有一个所有者（owner）。当所有者离开作用域，值会被自动释放。

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;              // s1 的所有权移动给了 s2
    // println!("{}", s1);    // 编译错误：s1 已失效
    println!("{}", s2);       // 正确
}
```

## 引用与借用

通过引用（Reference），我们可以在不转移所有权的情况下访问值：

```rust
fn main() {
    let s = String::from("hello");
    print_len(&s);            // 不可变借用
    println!("{}", s);        // s 仍然有效
}

fn print_len(s: &String) {
    println!("len = {}", s.len());
}
```

## 可变引用

同一时间只能有一个可变引用，这是 Rust 在编译期避免数据竞争的关键机制：

```rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);
    println!("{}", s);
}

fn change(s: &mut String) {
    s.push_str(", world!");
}
```

## 小结

所有权系统是 Rust 学习的第一道坎，但一旦理解，你将获得对内存控制的深刻理解。后续我们会继续探讨生命周期（Lifetime）和智能指针。

<RelatedPosts currentTitle="Rust 入门：所有权与借用" :currentTags='["Rust", "系统编程"]' />

<AskQuestion />
