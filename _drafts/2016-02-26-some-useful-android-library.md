---
layout: post
title: 一些有用的Android开发工具和库
description: "总结和介绍一些用过的Android开发工具和代码库，如RxJava，Dagger，Retrofit，Mockito等等，很多库都是能够极大的提高开发效率"
categories: development
tags:
  - 开发效率
  - Android library
  - RxJava
  - Dagger 2
  - Retrofit
  - Mockito
comments: true
mathjax: null
featured: true
published: true
---

我在[出门问问][mobvoi]做tic分享和音乐的时候，尝试了很多新的编程方式和架构，也走过很多坑，这里分类总结一些我认为能极大提高开发效率的工具和库。

<!--break-->

Dagger & Dagger 2，依赖注入库，解构、增强可测试性
Mockito，单元测试工具，可以在单元测试时，往代码中注入测试数据
RxJava & RxAndroid，函数响应式编程框架，擅长异步、事件驱动等编程方式，非常强大，坑也很多。
使用RxJava写MVP框架（Tic音乐），使用Java内置的Observable写MVP框架（健康中心）

还有一些小库，非常有用，大家也可以试用一下：
ButterKnife，UI控件注入库。省去写findViewById, setOnClickListener等冗余的代码
retrolambda，在Android Studio里面用Java8写应用（可以用lambda等新特性）
Retrofit ，网络库，以接口的形式写网络请求，比Volley等库方便太多了。
ActiveAndroid，数据库，几乎不需要写SQL语句，几乎不需要做类型转换。
另外还有一些诸如material design等UI库，我有空整理下用过的一些非常棒的UI控件。大家发现好的资源也可以分享下。

[mobvoi]: http://chumenwenwen.com/


