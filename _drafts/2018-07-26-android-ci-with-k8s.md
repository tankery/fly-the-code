---
layout: post
title: 在 K8s 上部署 Android 持续集成任务
description: "这只是冰山一角"
categories:
  - development
tags:
  - Build
  - Container
  - Android
image:
  feature: android-ci-with-k8s/container-ship-596083_1280.jpg
  small: android-ci-with-k8s/container-ship-596083_640.jpg
  alt: "Container Ship"
  credit: pixabay.com
  creditlink: https://pixabay.com/en/container-ship-frachtschiff-596083/
comments: true
mathjax: null
featured: false
published: true
---

前些日子，我们负责持续集成的服务器宕机，**硬盘损坏**。。 Jenkins 核心服务起不来了，所有项目的构建配置丢失。为了避免此事的再次发生，我们决定将所有 Android 构建任务都迁移到公司的 [Kubernetes (简称 K8s)](https://kubernetes.io/) 集群上。

<!-- more -->

这次迁移前前后后花了将近两周的时间。可见涉及内容之广，难度之高。然而我感觉这真的只是 Kubernetes 的冰山一角，许多内容根本就没有理解。本文也仅仅是将迁移的一些关键技术点做些记录，也视图通过这一个角度，去理解 K8s 的工作方式。
