---
layout: post
title: 使用 RxJava 让数据流动
description: "RxJava 入门。从遇到的问题出发，通过为什么、什么是，以及API介绍和扩展，以及遇到的坑等几个方面介绍RxJava"
categories:
  - development
  - presentation
tags:
  - ReactiveX
  - RxJava
  - 函数式编程
  - Presentation
comments: true
mathjax: null
featured: false
published: true
---

RxJava 入门。从遇到的问题出发，通过以下几个方面介绍RxJava：

1. 遇到了什么困难？为什么需要 RxJava
2. 什么是 RxJava: 概略介绍
3. RxJava API: 详细介绍、使用说明
4. Rx Extensions: 功能增强
5. 一些坑，以及如何避免

<!-- more -->

## Slides

<p>
<iframe src="//www.slideshare.net/slideshow/embed_code/key/hCxOsKh3dERLU2" width="595" height="485" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border:1px solid #CCC; border-width:1px; margin-bottom:5px; max-width: 100%;" allowfullscreen> </iframe>
</p>
<p>
<strong> <a href="//www.slideshare.net/ChenTankery/rxjava-let-data-streaming-using-rxjava" title="使用 RxJava 让数据流动 (Let data streaming using rxjava)" target="_blank">使用 RxJava 让数据流动 (Let data streaming using rxjava)</a> </strong> from <strong><a target="_blank" href="//www.slideshare.net/ChenTankery">Tankery Chen</a></strong>
</p>

## 大纲

1. 遇到了什么问题？为什么需要 RxJava
   - 异步的困难
      - 最常用的方式是使用回调，但它太麻烦，会让你尽量不去写它。
         - 复杂的使用会很深的回调嵌套 （callback-hell）
         - 麻烦的错误处理
         - 难以取消
      - Future<T>, CompletableFuture<T> (Java8)。太简单。使用场景太少。
         - Future 太弱了，只能阻塞式的获取。
         - CompletableFuture 可以有通知回调，也可以组合处理，但是只支持一个数据的处理，而只能用于Java 8
      - RxJava
         - 链式调用，处理“将来”的数据
         - 统一的错误处理，不用层层传递。
         - 统一的数据更新、注销接口。
         - 数据流，而不是单个数据
   - 面向数据流的编程方式
      - 传统编程方式是命令式编程。重视控制（执行过程），以运算、循环、条件判断、跳转来完成任务
         "https://zh.wikipedia.org/wiki/%E6%8C%87%E4%BB%A4%E5%BC%8F%E7%B7%A8%E7%A8%8B"
         - 计算机为先的思维，指令驱动机器做事
      - 函数式编程，重视任务的解决（执行结果），以若干简单的数据转换单元为基础
         "https://zh.wikipedia.org/wiki/%E5%87%BD%E6%95%B8%E7%A8%8B%E5%BC%8F%E8%AA%9E%E8%A8%80"
         - 人脑思维，任务驱动，分治
2. 什么是RxJava
   - ReactiveX 结合了观察者模式、迭代器模式和函数式编程的优点
      "ReactiveX is a combination of the best ideas from the Observer pattern, the Iterator pattern, and functional programming"
   - 首先看一个对比。scalar VS sequence, sync VS async
      - sequence (not scalar value) (Iterable<T> also sequence)
      - asynchronous (not synchronous) (Future<T> is asynchronous)
   - 做三件事情
      - 数据/事件的创建
         - create, from, just
      - 组合、转换数据流
         - operators (map, flatMap, filter, merge, combineLatest, etc.)
      - 监听处理结果
         - subscribe
   - 足够优雅的屏蔽实现细节。
      - public Observable<data> getData();
         - does it work synchronously on the same thread as the caller?
         - does it work asynchronously on a distinct thread?
         - does it divide its work over multiple threads that may return data to the caller in any order?
         - does it use an Actor (or multiple Actors) instead of a thread pool?
         - does it use NIO with an event-loop to do asynchronous network access?
         - does it use an event-loop to separate the work thread from the callback thread?
      - From the Observer’s point of view, it doesn’t matter!
      - 你不需要关心异步到底是在同一个线程还是多个线程，是否用了线程池，要执行多久，等等。你只需要知道，未来的某个时间，他会在某个线程发送新的数据给你。
   - 很好的异常处理
      - onNext, onError, onComplete
      - 链条中部发生的错误会一直传递到监听者
      - 在链条的任何位置，你都可以处理异常
         - onErrorReturn
         - onErrorResumeNext
         - retry
   - 方便的 Operators
      - debounce
      - timeout
      - groupBy
3. RxJava API
   - Overview
      - Observer<T>
         "onNext, onError, onComplete"
      - Observable<T>
         - OnSubscribe<T>
      - Subscriber<T>
         "implements Observer<T>, Subscription"
         - Subscription
         - Operator<R, T>
            "Lifting Subscriber<T> to Subscriber<R>
            http://reactivex.io/documentation/operators.html"
      - Subject<T>
         "Bridge between Observable<T> and Subscriber<T>"
      - Scheduler
         "Source of concurrency for observables."
         - (subscribe | observe) On
   - Functional API
      - Anamorphic (aka unfold): T -> Observable<T>
         "just, range, timer, interval, create, never, empty, error"
      - Bind (map) Observable<T1> -> Observable<T2>
         "map, filter"
      - Catamorphic (fold or reduce) Observable<T> -> T
         "reduce, toList"
   - Cold vs hot observables
      - Passive sequence is cold ?
      - Active sequence is hot ?
4. Rx Extensions
   - RxAndroid
      - AndroidSchedulers.mainThread()
   - RxBinding
      - RxView.clicks()
5. 一些坑
   - 基本概念和用法
      - 理解 RxJava 最关键的部分，就是理解 RxJava 的流，包括流的源头 (Observable)、操作 (Operation)、和终点 (Subscription)。
      - 流的初始化函数，只有在被订阅时，才会执行。流的操作，只有在有数据传递过来时，才会进行，这一切都是异步的。
         "错误的理解了代码执行时机"
   - Unsubscribe ！
      - cold observable 还好。如果是 hot observable，这会导致 memory leak，多次注册等问题
      - 好习惯是使用一个 SubscriptionList 将所有 subscription 都包装到一起，onDestroy 时一次性 unsubscribe（管理好流的生命周期）
      - SubscriptionList 在 unsubscribe 之后 add 进来的 Subscription ，都会执行 unsubscribe 。 所以，unsubscribe 之后，如果还想重新使用这个list，需要new一个新的。
      - 技巧：Subscriptions.create(Action)，可以创建一个在 unsubscribe 时执行的 Action。可以将某些API的注册、反注册写到一块，让代码易读
   - 操作符 (Operators)
      - 在没有弄清楚 Operator 的意思和影响前，不要使用它。
      - 小心那些 hot observable 和收集类型的操作符
         - 比如reduce, toList, scan 等，必须等到Observable complete，才会返回结果。
         - 如果发现你的操作链条完全不返回结果，看看是不是在 hot observable 上使用了收集型的操作符
      - distinctUntilChanged
         - 可以过滤掉相同的元素。但注意不要复用数据，否则可能造成同一个实例虽然被修改，但是由于是同一个引用，所以都被过滤掉了。
   - 线程、插件和其他
      - RxJava 大量使用异步。而大部分操作并不会引入线程。
         - 数据源在哪个线程，就在那个线程执行。
         - 非特殊指定，OnSubscribe 在 subscribe 的线程执行。
      - 尽量使用纯函数式编程（不引入 side effects，所有的数据，都只会通过函数的参数和返回值来传递），这样的函数，几乎可以随意的切换线程和并发。
      - 如果有side effects，一定要注意线程。大部分的多线程由数据源引起。但也有部分线程是因为某些操作符，比如 timeout, debounce 等，所以，使用一个操作符前，也需要通过文档了解它的工作线程。
      - Subject 不是线程安全的，确保 onNext 都在一个线程调用。如需多线程，使用 toSerialized() 将 subject 转变成线程安全的。
6. 参考资料
   - 给 Android 开发者的 RxJava 详解 http://gank.io/post/560e15be2dca930e00da1083


