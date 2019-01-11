---
layout: post
title: 用胶水粘合你的进程
description: "聊聊 Binder 在应用层的使用"
categories:
  - development
tags:
  - Android
  - IPC
comments: true
published: true
---

Binder 可以说是Android系统最重要的基石之一，你能想到的各种涉及跨进程调用的场景，几乎都是使用Binder机制实现，比如 broadcast receiver，比如 content provider，比如 Activity result，等等。掌握了 Binder，就会发现处理跨进程通讯就变得游刃有余了。

<!--more-->

但是请放心，今天我不会分析这些系统应用，也不会介绍具体实现细节。更不会深入去阅读 Binder 机制的源码。因为网络上这样的分析已经非常多，也有非常好的资料可供学习。（附录贴出了一些参考资料）

我今天要做的是“拿来主义”，Binder 已经这么好了，拿来用用呗。

## 背景

之所以研究 Binder，是因为最近在开发手表的运动App时，遇到一个有趣的问题：如何才能统一多个模块对同一种数据的监听需求？

比如运动需要监听心率变化，睡眠也需要监听心率变化，而心率模块还希望做全天24小时的心率监测。

如果是同一个进程，使用观察者模式就能很轻易的解决这个问题（多个模块同时观察同一个数据源）。但这些功能都处在不同的App中，因此，他们属于不同的进程。这时候，事情就变得有意思起来：如何能实现一个跨进程的观察者呢？

问题和方案

Android 的基石 - Binder

AIDL

Service 是必须的吗？

跨进程的 Listener


## 后记

之所以想到 Binder，是由于我发现我们的需求实际上和 [GMS Fitness API](https://developers.google.com/android/reference/com/google/android/gms/fitness/Fitness) 很像，都是需要从一个独立的进程来获取数据。于是我阅读了 GMS 的代码（被混淆以后的。。），发现他居然使用了 Binder。由于对 Binder 并不熟悉，当时的我非常惊讶，想知道这是如何做到的，于是走进 Binder 的世界，打开了一扇大门。

了解过程中，发现 [LocationManager](https://android.googlesource.com/platform/frameworks/base/+/3b817ae/services/java/com/android/server/LocationManagerService.java) 也是使用 Binder 实现的，也给我的代码设计提供了非常好的参考资料。

于是感慨道，还是应该要站在巨人的肩膀上。

## 附录

想了解 Binder 机制的原理，通过例子掌握核心内容。可以看这里：
《写给 Android 应用工程师的 Binder 原理剖析》： https://zhuanlan.zhihu.com/p/35519585

想了解实现细节，重要的源码，全面的研究 Binder。可以看这篇文章：
《Android跨进程通信IPC之13——Binder总结》： https://www.jianshu.com/p/485233919c15


