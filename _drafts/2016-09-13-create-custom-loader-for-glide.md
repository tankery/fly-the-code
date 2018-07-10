---
layout: post
title: 使用 Glide 从自定义数据源加载图片
description: "Glide 提供了足够简洁又足够灵活的图片加载方式，本文通过实际使用经验出发，介绍了如何为 Glide 自定义数据源"
headline: ""
categories: development
tags:
  - Glide
  - 图片加载
  - ModelLoader
comments: true
mathjax: null
featured: true
published: true
---

Glide 提供了足够简洁又足够灵活的图片加载方式，本文通过实际使用经验出发，介绍了如何使用自定义的 ModelLoader 来加载图片数据（并复用 Glide 的图片双缓存、ImageView 图片的延迟加载等部分）。

<!-- more -->


