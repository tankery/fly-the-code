---
layout: post
title: 记《步伐》手表版的诞生（下）
description: "参加TicWear的Creatic Hackathon比赛，做了步伐的Android Wear版，第二部分，开发"
headline: "参加TicWear的Creatic Hackathon比赛，做了步伐的Android Wear版，第二部分，开发"
categories: development
tags:
  - 步伐
  - Android wear
  - Android Studio
  - Gradle
comments: true
mathjax: null
featured: true
published: true
---

[上一篇文章]({% post_url 2015-05-08-ticwear-hackathon-1 %})介绍了产品设计，这篇文章主要介绍《步伐》手表版的开发。

比赛是Ticwear举办的，故手表也采用的Ticwear系统。
Ticwear系统兼容Android 5.0的API，所以开发者可以基于Android 5.0的SDK开发手表端的应用。

## Android Studio 上手

说起手表的开发、不得不提 [Android Studio](http://developer.android.com/tools/studio/index.html)。
其实我是在比赛前一天、拿到手表真机之后，才决定切换到 Android Studio 做开发的。
之前大约有两年半的时间，都在使用 Eclipse 搭配 ADT 插件开发。

<!--break-->

由于手表开发的特殊性，使用 Eclipse 开发手表应用非常麻烦，最终决定切换到 Android Studio 开发。
但一入门，就不想再换回 Eclipse 了。

好的产品给你带来的效率提升，真的是惊人的。
毕竟 Android Studio 是专门为 Android 开发打造的，从里到外都对 Android 的开发非常友好。
另外，由于采用了 [Gradle-base build system](http://developer.android.com/sdk/installing/studio-build.html)，项目的依赖关系也变得非常灵活而方便。

举一个最明显的效率提升的例子：
使用 Eclipse 时，如果要添加一个第三方库的支持，首先我们得下载其代码，然后为其创建一个 Eclipse 工程，再于主项目中添加对此项目的依赖。
最麻烦的是，这个依赖关系，是依赖于文件系统的，你没法优雅的将这个项目依赖添加到版本管理中。
而使用 Gradle，你需要做的，仅仅是在主项目配置文件中添加**一行**代码，表明对此项目的依赖。
Gradle 会在构建时，自动同步第三方库的代码**及其依赖的其它库**。

如果有必要，我想会单独写一篇 Android Studio 的介绍，这里就不再啰嗦了。

开发手表应用需要注意的是，你实际上是在开发两个应用，一个手表、一个手机。
但他们又是相似而有联系的，所以比较好的做法是，将两个应用的公有部分单独提取出来，构成一个公共库，同时被手表和手机应用依赖。

对于《步伐》来说，我希望它的步频识别能够兼容手表和无手表的情况，因此，将步频识别模块，提取到公共库中。
另外，将一些辅助库、如 [Butter Knife](http://jakewharton.github.io/butterknife/) 和我自己写的一些诸如动画、数据传输和调试等模块，都提取到公共库中。

由于手表也是一个 Android 系统，步频识别模块的移植并没有什么难度，这里就不多说了。
重点介绍数据通讯和语义识别的实现。

## 数据通讯



