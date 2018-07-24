---
layout: post
title: RxJava 的一些坑
description: "RxJava 是 ReactiveX，响应函数式编程库的一个平台扩展，本文结合自己的使用，对其进行介绍"
headline: "RxJava 是 ReactiveX，响应函数式编程库的一个平台扩展，本文结合自己的使用，对其进行介绍"
categories: development
tags:
  - ReactiveX
  - RxJava
  - 函数式编程
comments: true
mathjax: null
featured: true
published: true
---

RxJava 是 ReactiveX，响应函数式编程库的一个平台分支，本文结合自己的使用，对其进行介绍。

项目中使用的异步任务库 [Groundy](https://github.com/telly/groundy) 停止维护了。
它推荐我们使用 [RxJava][rxjava]，[ReactiveX][reactivex] 的Java平台扩展。
RxJava提供函数式编程，方便异步、事件驱动，有很好的异步异常处理方式，并且，封装了大量的操作符，帮助你快速的应用某种编程模式。

这个库其实不大，但由于其基于一套非常不同的，抽象的编程范式，使得其学习曲线非常陡峭。
我花了一周的上下班和其他零碎时间，才自信到可以将此编程模式引入目前的项目中。而在使用中，却仍然遇到大量的问题。

但是，也正因为在学习过程中，不断的发现其过人之处，才能兴致勃勃的不断了解。
并且，随着学习的不断深入，我越来越发现，ReactiveX 为我打开了一扇通向全新世界的门。

<!--break-->

## RxJava 入门

这篇文章，我不打算进行太多入门性的介绍。
因为网络上的文章实在是很多：

最直观、最权威的介绍来自官网，它用简单的语言，说清楚了RxJava到底是什么，有什么优势：

 - [ReactiveX][reactivex]


想直接上手使用，推荐你看看这四篇介绍文章：

1. [深入浅出RxJava 一：基础篇](http://blog.csdn.net/lzyzsd/article/details/41833541)
2. [深入浅出RxJava 二：操作符](http://blog.csdn.net/lzyzsd/article/details/44094895)
3. [深入浅出RxJava 三：响应式的好处](http://blog.csdn.net/lzyzsd/article/details/44891933)
4. [深入浅出RxJava 四：在Android中使用响应式编程](http://blog.csdn.net/lzyzsd/article/details/45033611)


而如果你想知道，我们为什么需要一个RxJava (一步步抽象，最终发现我们需要的，就是 RxJava），请看这篇文章：

 - [《NotRxJava懒人专用指南》](http://www.devtf.cn/?p=323)


总的来说，我认为 ReactiveX 是一个能较好解决异步调用模块组合问题的库。

怎么说呢。
同步的函数可以这么组合：

``` Java
A a = getA();
B b = getBFromA(a);
C c = getCFromB(b);
```

而异步函数呢，如果使用回调，将会陷入一个叫做回调地狱的窘境中，有多囧，见图：

![Callback Hell]({{ site.baseurl }}/assets/img/post/intro-to-rxjava/callback-hell.jpg "Callback Hell")

具体到上面的例子，如果每个函数都是异步的，我们会遇到这样代码：

``` Java
getAsyncA(va -> {
    getAsyncB(va, vb -> {
        getAsyncC(vb, vc -> {
            doSomethingWithC(vc);
        });
    });
});
```

这段代码，已经是使用 Java 8 的 lambda函数 来简化过的了，而依旧如此复杂，难以阅读。
一旦程序添加更多逻辑，将变得更加的难以维护。

而 ReactiveX 扩展了观察者模式，构建了一套利用 Observable 将异步函数进行组合的系统。

Observable 将异步返回值，包装到了 Observable 中。
并在这之上，提供了大量的操作符，对 Observable 进行操作，从而解决了异步函数的组合问题。

举个栗子，ReactiveX 可以这么组合函数：

``` Java
Observable<A> a = getAsyncA();
Observable<B> b = a.flatMap(va -> getAsyncB(va));
Observable<C> c = b.flatMap(vb -> getAsyncC(vb));
```

将原来的嵌套回调，扁平化成了类似同步函数调用的形式。而且，由于其返回值是连续的，我们甚至可以将其组合成下面这样的链式结构：

``` Java
Observable<C> c = getAsyncA()
    .flatMap(a -> getAsyncB(a))
    .flatMap(b -> getAsyncC(b));
```

最后，一系列转换完成后，才使用一个 Observer 来订阅最终的值：

``` Java
c.subscribe(vc -> doWithC(vc));
```

可以看到，ReactiveX 的 Observable，异步返回值，实际上是对应了原来同步函数的直接返回值。
并利用一些操作符，对这个异步的返回值进行操作，对应于以前对同步返回值的操作。
这样，将复杂的嵌套回调结构，扁平化成了一个链式结构，大大增加了程序的可读性。

## 使用 RxJava 时容易犯的一些错误

由于 RxJava 的复杂性和全新的编程方式。使用中非常容易忽视一些重要的点，导致问题的出现。
这里我列举和记录一些自己遇到的错误，以便记录和交流。
示例代码基于 RxJava 1.0.4，RxAndroid 0.24，使用 Java 8 的 lambda 简化代码。
如果你也想在 Android 项目中支持 Java 8，可以使用 [Retrolambda][retrolambda] （仅支持 Android Studio 环境）。

### 基本概念和用法

理解 RxJava 最关键的部分，就是理解 RxJava 的流，包括流的源头 (Observable)、操作 (Operation)、和终点 (Subscription)。

需要特别注意的是，流的创建，只有在被订阅时，才会开始。流的操作，只有在有数据传递过来时，才会进行，这一切都是异步的。
如果不理解这一点，你会发现代码中处处都影藏着错误。

#### 错误的理解了代码执行时机

看看这段代码，会输出什么？

``` Java
Observable<String> source = Observable.create(subscriber -> {
    System.out.println("In source");
    if (!subscriber.isUnsubscribed()) {
        subscriber.onNext("Source");
        subscriber.onCompleted();
    }
});
System.out.println("Created source");
source.subscribe(str -> System.out.println("Get str " + str));
System.out.println("After subscribed");
```

创建自定义 Observable 时，刚入门的人容易犯的错误，是以为 create 之后，OnSubscribe (代码中的 subscriber lambda) 就会被调用，但其实不然。
要弄清楚，OnSubscribe 只有在 subscribe 时，才会被调用。
而 subscribe 时传入的 Observer，会在未来的时候（有数据传递过来时）被调用。
Observable 的创建、subscribe 和 observe 是在三个不同的时间执行。

可能上面的例子还比较简单，一般不会出错，但如果将代码的执行时机，和 Java 8 的函数引用联系起来，就不那么好理解了。

看看下面这块代码：

``` Java
// 执行任务的类
class Foo {
    public String bar(int a) {
        System.out.println("In Foo.bar");
        return "Foo got " + a;
    }
}
// 存储类，实际项目中，这个类可能是当前类，而foo是一个成员变量
class Wrapper {
    public Foo foo;
}
Wrapper wrapper = new Wrapper();

// 用于延迟触发数据流传输
PublishSubject<Integer> sourceSubject = PublishSubject.create();

System.out.println("Before chaining");
sourceSubject.asObservable()
        .filter(a -> wrapper.foo != null)
        .map(a -> wrapper.foo.bar(a))   // * 这一行会被编辑器提示，推荐使用 method reference
        .subscribe(System.out::println);
System.out.println("Created chain");

// 当数据流处理链条构建好了以后，我们初始化变量foo，然后触发数据流的传输。
wrapper.foo = new Foo();
sourceSubject.onNext(0);
System.out.println("After next");
```

代码里面，为了确保`foo`不为空，专门使用了一个`filter`操作符来保证。
最终我们得到如预期一致的结果，打印了下面的文字：

```
Before chaining
Created chain
In Foo.bar
Foo got 0
After next
```

但是，如果我们按照编辑器的建议，将`*`行修改成 method reference 以后，我们将会得到一个 NPE 的错误。
代码和输出如下：

``` Java
...
sourceSubject.asObservable()
        .filter(a -> wrapper.foo != null)
        .map(wrapper.foo::bar)      // * 这一行将会导致崩溃
        .subscribe(System.out::println);
...
```

```
Before chaining

java.lang.NullPointerException
```

可以看到，崩溃的时机是在构建链条时。
所以，我们需要注意的是，函数引用的对象，是在生成引用时就会被调用的，而不是使用引用时。
你可以再试试，假如foo在一开始就已经初始化完成，会有怎样的行为。


#### 没有Unsubscribe

Subscribe（订阅） 可以开启一串流的阀门，并接收流的输出。而如果你在 subscribe 以后，忘记 un-subscribe，你会收获到什么？
这跟流的类型有关。

假如未订阅的流，是一个 [cold observable][rxjava-observable]，且数据的发送很快就结束的话，并不会有什么大的问题。
而如果订阅的是 [hot observable][rxjava-observable]（不会结束的流）， 则可能引发内存泄露、多次注册等问题。
一个比较好的习惯是，每一个 subscription，都加入到 SubscriptionList 中，在程序的 onDestroy 或其他销毁操作时，一次性 unsubscribe。当然这是个简单粗暴的方法，更优雅的方法是，在你不需要流的时候，就取消订阅。你为你的流，构建合适的生命周期。

与订阅相关的，还有一个 SubscriptionList，也有个非常容易出错的地方。
在 unsubscribe 之后 add 进来的 Subscription ，都会执行 unsubscribe 。
所以，unsubscribe 之后，如果还想重新使用这个list，需要new一个新的。

另一个相关的技巧是，可用为 OnSubscribe 传入的 subscriber 添加一个 Subscription，在 unsubscribe 时做一些诸如注销操作。这样，就可以将订阅与取消订阅的动作绑定在一起了。

### 操作符 (Operators)

RxJava 提供了大量的操作符，能够让你轻松的驾驭一些并发、异步编程的范式。
举个例子，假如你需要同时发起5个线程，访问远程的数据，再计算平均值。
如果没有 RxJava ，你可能需要自己创建线程池，自己记录每个线程的返回结果，等待所有5个线程返回。
使用 RxJava，你可以这样做：

``` Java
// 获取远程结果的异步函数
Func1<Integer, Observable<Integer>> remoteFunction = input -> {
    System.out.println("Remote result " + (input + 1));
    return Observable.just(input + 1);
};

// 计算平均值的函数
FuncN<Integer> calcAverage = results -> {
    int sum = 0;
    for (Object r : results) {
        sum += (Integer) r;
    }
    return sum / results.length;
};

// 集合5个异步函数
List<Observable<Integer>> remoteFunctions = new ArrayList<>();
for (int i = 0; i < 5; i++) {
    remoteFunctions.add(remoteFunction.call(i));
}

// 并发访问，将结果通过平均值函数计算后返回
Observable.zip(remoteFunctions, calcAverage)
        .subscribe(avg -> System.out.println("Got average " + avg));
```

使用一个zip操作符，就完成了并发访问、收集返回结果等等一系列操作。
但是，也由于 RxJava 的操作符实在太多，使用前，一定要弄清楚操作符的意义、使用前提，否则容易出现一些奇怪的bug。


#### 小心那些 hot observable 和收集类型的操作符

cold observable 指那些只会触发有限个异步结果就Complete的observable。
而hot observable 是指那些永不complete的observable。

一定要小心 hot observable 这个永不 complete 的属性！！ 因为有些操作符，是需要等到结束才会返回结果，如果不小心操作了 hot observable ，那么这个操作符也就永不返回。。。。
比如`reduce`, `toList`, `scan` 等。
很多时候，如果你发现你的操作链条没有返回。
在每一步操作之后，都看看其输出（onNext）和是否结束（onComplete），确保在reduce这类需要有限个元素的操作符前，元素流已经结束。

#### distinctUntilChanged

这个操作符可以过滤相同的元素，在很多时候都非常有用。
但是！经常会出现当前的元素被修改，从而与新元素相同，导致没有被后续接收的问题存在。
举例：我先获取了元素a，然后直接修改了a的属性，然后更新到数据源中，此时新元素b虽然与原始的a不同，但由于a被直接修改，导致a已经变化成与b相同的元素，从而出了bug。
说起来，这个问题不怪distinctUntilChanged，但经常由于这个操作符而暴露了问题。
解决方法，就是尽量将数据属性设置为final，避免错误的直接修改发生。这其实也使得程序更加“函数化”，避免 side effect。

### 线程、插件和其他

理论上来说，RxJava 的正确使用方式是纯函数式编程。也就是说，所有的数据，都只会通过函数的参数和返回值来传递。不会有其他 side effects。 所以我们实际上是不用关心线程问题的。因为根本不会有多线程共享的数据。

然而，实际情况并不这样。我们只是利用了 RxJava 的便捷，而不会那么严格的遵守纯函数式编程。
因此而引入的中间变量是极可能被多个线程所共享的。
所以，实际使用中，还是需要去关心各个操作函数所在的线程。
特别是要注意 RxJava 的一些时序相关的操作符，比如 timeout, debounce 等，都可能引入新的线程。
我们需要使用 `subscribeOn`, `observeOn` 这样的操作符来为那些线程敏感的操作指定线程。

另外，Subject 不是线程安全的，如果你希望使用 subject，请一定注意它的线程。
确保 onNext 都在一个线程调用，否则，使用 toSerialized() 将 subject 转变成线程安全的。

当然，如果你想更加的函数化（这意味着更清晰的逻辑和更少机会出错），最好的办法是[不要使用 subject](http://stackoverflow.com/q/9299813/1038900)。这就需要看你的应用场景了。

## 最后

最后我想说的是，RX不是银弹，不是magic，只是一种优秀的编程范式。
你还是需要自己去理清楚程序逻辑、处理好一些资源申请、释放的工作。
理解了RxJava，你的程序能更加简洁和健壮，而滥用它，则会出现很多难以调试的错误，慎用慎用。


[rxjava]: https://github.com/ReactiveX/RxJava
[rxjava-observable]: http://reactivex.io/documentation/observable.html
[reactivex]: http://reactivex.io/
[retrolambda]: https://github.com/evant/gradle-retrolambda
