---
title: 机器学习入门：线性回归的数学推导
date: 2026-03-08
author: 孙七
tags: [机器学习, 数学]
description: 从概率论和线性代数的角度理解线性回归，附 Python 代码实现。
---

# 机器学习入门：线性回归的数学推导

线性回归是机器学习中最基础也最重要的模型。本文从数学原理出发，推导它的两种等价解法。

## 问题定义

给定训练数据 $\{(x^{(i)}, y^{(i)})\}_{i=1}^{m}$，我们希望找到一条直线:

$$
h_\theta(x) = \theta_0 + \theta_1 x
$$

使得预测值与真实值的误差最小。

## 方法一：最小二乘法（解析解）

定义损失函数为均方误差（MSE）:

$$
J(\theta) = \frac{1}{2m} \sum_{i=1}^{m} (h_\theta(x^{(i)}) - y^{(i)})^2
$$

写成矩阵形式，令 $X$ 为 $m \times 2$ 的设计矩阵，$\theta$ 为参数向量，$y$ 为目标向量:

$$
J(\theta) = \frac{1}{2m} (X\theta - y)^T (X\theta - y)
$$

对 $\theta$ 求导并令其为 0:

$$
\nabla_\theta J = \frac{1}{m} X^T (X\theta - y) = 0
$$

解得**正规方程**:

$$
\theta = (X^T X)^{-1} X^T y
$$

## 方法二：梯度下降（迭代解）

当特征维度很高时，矩阵求逆 $O(n^3)$ 的代价太大，此时用梯度下降:

```python
def gradient_descent(X, y, alpha=0.01, epochs=1000):
    m, n = X.shape
    theta = np.zeros(n)
    for _ in range(epochs):
        gradient = (1/m) * X.T @ (X @ theta - y)
        theta -= alpha * gradient
    return theta
```

每次迭代将参数沿着负梯度方向移动一小步，逐步逼近最优解。

## 两种方法的对比

| | 正规方程 | 梯度下降 |
|---|---|---|
| 时间复杂度 | $O(n^3)$ | $O(kn^2)$ |
| 需要调参 | 否 | 需要选学习率 |
| 适用场景 | n < 10,000 | n 任意大 |
| 可扩展性 | 难加正则化 | 容易加正则化 |

## 小结

线性回归虽简单，但它的推导思路——定义损失函数 → 求导 → 优化——贯穿了所有机器学习模型。掌握了线性回归的数学，就打开了机器学习的大门。

<RelatedPosts currentTitle="机器学习入门：线性回归的数学推导" :currentTags='["机器学习", "数学"]' />

<AskQuestion />
