---
layout: post
title: 如何实现一个跨进程的观察者模式？
description: "聊聊 Binder 的一个应用场景"
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

如果是同一个进程，使用观察者模式就能很轻易的解决这个问题（多个模块同时观察同一个数据源）。但这些功能都处在不同的App中，属于不同的进程。这时候，事情就变得有意思起来：如何能实现一个跨进程的观察者呢？

## 方案的选择

想要实现跨进程的数据传递，我们有很多选择。可以在数据变化时，发送广播，接收方通过单例、静态类等方式将数据继续往外传播；也可以用 start Service 等方式，让数据都在接收方的一个 Service 中处理；或者用 Content Provider 对外提供数据，并使用 provider 的 notify 机制来通知数据变化，等等。

这些方案都有着各自的优势和适用场景。所以实际上，在我们的应用中，这些方式我们都在使用。比如运动会广播自己的运动状态变化（无需关心接收者），比如接收到手机消息时通过 start service 来处理消息，比如通过 provider 提供统一的运动数据接口，等等。

但我发现，这些跨进程方案，都不适用于上文提到的问题。跨进程的数据监听，要求数据源像 observable 那样，能够知道都哪些 observer 在监听，以便动态的开启、关闭数据服务。更麻烦的是还得知道 observer 进程挂掉了，以便关闭服务。这就使得我们需要一套注册、注销机制来管理数据源，和数据对应的 observer，并且将指定数据精确的发布给它的 observer。

于是，选择了直接使用 binder。

## Android 的基石 - Binder

说 Binder 是 Android 的基石是一点也不为过的。你能想到的各种涉及跨进程调用的场景，几乎都是使用 Binder 机制实现。Binder 兼具了性能与安全，是其他 Linux 平台的跨进程方案无法比拟的。本文不会细谈 Binder 机制，但有几个关键点，希望你能有个映像：

1. Binder 跨越了应用层、framework 层、内核层等多个层级，利用内核空间中进程间的可共享内存和内存映射机制，才实现了高效的跨进程通讯（减少内存拷贝次数）。
2. Binder 采用 C/S 架构，Client 可以向 Server 发起一个附带数据的交易 (transact)，并收到回复（数据或异常）。
3. 因为性能的考虑，Client, Server 如果在同一个进程，framework 层会直接在进程内操作交易，而无需使用 IPC 调用，和直接的函数调用无异。
4. Client 可以监听 Server 进程的死亡事件。


## AIDL

## Service 是必须的吗？

Server 端可以创建一个 Binder，并将 Binder 实现的 IBinder 接口序列化传递出去，Client 可以接收并持有这个 IBinder，即可利用此 IBinder 进行交易。

## 跨进程的 Listener


## 后记

之所以想到 Binder，是由于我发现我们的需求实际上和 [GMS Fitness API](https://developers.google.com/android/reference/com/google/android/gms/fitness/Fitness) 很像，都是需要从一个独立的进程来获取数据。于是我阅读了 GMS 的代码（被混淆以后的。。），发现他居然使用了 Binder。由于对 Binder 并不熟悉，当时的我非常惊讶，想知道这是如何做到的，于是走进 Binder 的世界，打开了一扇大门。

了解过程中，发现 [LocationManager](https://android.googlesource.com/platform/frameworks/base/+/3b817ae/services/java/com/android/server/LocationManagerService.java) 也是使用 Binder 实现的，也给我的代码设计提供了非常好的参考资料。

于是感慨道，还是应该要站在巨人的肩膀上。

## 附录

想了解 Binder 机制的原理，通过例子掌握核心内容。可以看这里：
《写给 Android 应用工程师的 Binder 原理剖析》： https://zhuanlan.zhihu.com/p/35519585

想了解实现细节，重要的源码，全面的研究 Binder。可以看这篇文章：
《Android跨进程通信IPC之13——Binder总结》： https://www.jianshu.com/p/485233919c15


