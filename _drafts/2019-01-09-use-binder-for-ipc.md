---
layout: post
title: 如何实现一个跨进程的观察者模式？
description: "聊聊 Binder 的使用"
categories:
  - development
tags:
  - Android
  - IPC
comments: true
published: true
---

什么是 Binder？我面试时听到过很多答案，比如 “bindService 返回的那个对象”，“binder 就是 AIDL”。。如果你的理解仅限于 Service 的场景，那你的世界就太小了。

Binder 可以说是 Android 系统最重要的基石之一，你能想到的各种涉及跨进程调用的场景，几乎都是使用 Binder 机制实现，比如 broadcast receiver，比如 content provider，比如 Activity result，等等。了解了 Binder，就拿到了新世界的船票，可以尽情畅游在跨进程的世界里了。

<!--more-->

但是请放心，今天我不会分析这些系统应用，也不会介绍具体实现细节。更不会深入去阅读 Binder 机制的源码。因为网络上这样的分析已经非常多，也有非常好的资料可供学习。才疏学浅的我，就不在这儿误导你了，真想了解的话，附录贴出了一些参考资料可以看看。

我今天要做的是“拿来主义”，Binder 已经这么好了，拿来用用呗。

## 背景

之所以研究 Binder，是因为最近在开发手表的运动App时，遇到一个有趣的问题：如何才能统一多个模块对同一种数据的监听需求？

比如运动需要监听心率变化，睡眠也需要监听心率变化，而心率模块还希望做全天24小时的心率监测。

如果是同一个进程，使用观察者模式就能很轻易的解决这个问题（多个模块同时观察同一个数据源）。但这些功能都处在不同的App中，属于不同的进程。这时候，事情就变得有意思起来：怎样才能实现一个跨进程的观察者呢？

## 方案的选择

想要实现跨进程的数据传递，我们有很多选择。可以在数据变化时，发送广播，接收方通过单例、静态类等方式将数据继续往外传播；也可以用 start Service 等方式，让数据都在接收方的一个 Service 中处理；或者用 Content Provider 对外提供数据，并使用 provider 的 notify 机制来通知数据变化，等等。

这些方案都有着各自的优势和适用场景。所以实际上，在我们的应用中，这些方式我们都在使用。比如运动会广播自己的运动状态变化（无需关心接收者），比如接收到手机消息时通过 start service 来处理消息，比如通过 provider 提供统一的运动数据接口，等等。

但我发现，这些跨进程方案，都不适用于我们的场景。

跨进程的数据监听，要求数据源像 observable 那样，能够知道都哪些 observer 在监听，以便动态的开启、关闭数据服务。更麻烦的是还得知道 observer 进程挂掉了，以便关闭服务。这就使得我们需要一套注册、注销机制来管理数据源，和数据对应的 observer，并且将指定数据精确的发布给它的 observer。

于是，选择了直接使用 binder。

## Android 的基石 - Binder

说 Binder 是 Android 的基石真是一点也不为过。你能想到的各种涉及跨进程调用的场景，几乎都是使用 Binder 机制实现。Binder 兼具了性能与安全，是其他 Linux 平台的跨进程方案无法比拟的。

本文不会细谈 Binder 机制，只告诉你三个关键点，帮助你快速的了解 Binder

1. **性能**：Binder 非常高效，利用内核驱动中的内存映射机制，实现了高效的跨进程通讯（减少内存拷贝次数），同时也在 framework 层做了处理，使得如果调用是发生在单一进程内部，效率与直接的函数调用无异。
2. **架构**：Binder 采用 C/S 架构，Client 可以向 Server 发起一个附带数据的交易 (transact)，并收到回复（数据或异常）。
3. **使用方式**：Binder 由 Server 创建，并通过 bindService，或者其他跨进程通讯方式，将 IBinder 接口传递给 Client，Client 持有反序列化出的 IBinder，即可利用此 IBinder 进行交易。

了解了这些，就可以利用 Binder 进行高效的跨进程通讯了。

下面举个例子：

``` kotlin
// Kotlin code
// Service (process=":remote")
class MainService : Service() {
    private val binder = object : Binder() {
        override fun onTransact(code: Int, data: Parcel, reply: Parcel?, flags: Int): Boolean {
            if (code == BINDER_TRANSACT_CODE) {
                val value = data.readString()
                Log.i(TAG, "Got value from activity: $value")
            }
            return super.onTransact(code, data, reply, flags)
        }
    }

    override fun onBind(intent: Intent) = binder
}

// Activity
class MainActivity : Activity(), ServiceConnection {
    override fun onCreate(savedInstanceState: Bundle?) {
        ...
        bindService(intent, this, Service.BIND_AUTO_CREATE)
    }
    ...
    override fun onServiceConnected(name: ComponentName?, remote: IBinder?) {
        Log.i(TAG, "Service connected, got binder $remote in activity")

        val data = Parcel.obtain()
        try {
            data.writeString("Hello World!")
            remote?.transact(BINDER_TRANSACT_CODE, data, null, 0)
            ...
        } finally {
            data.recycle()
        }
    }
    ...
}
```

> （完整代码移步 GitHub： https://github.com/tankery/binder-demo）

从这个代码看到，我们在独立进程的 Service 中创建了一个 Binder 对象，并重载 onTransaction 来接收交易信息。接着，在 onBind 函数返回 Binder 对象。

这个对象，以 IBinder 的形式序列化，并传递给 Activity 的 onServiceConnected 方法。Activity 即可使用此 IBinder 对象发送交易了。

运行代码，查看 logcat：

```
6694-6694/me.tankery.demo.binder I/binder.activity: Service connected, got binder android.os.BinderProxy@c7cd6b8 in activity
6717-6732/me.tankery.demo.binder:remote I/binder.service: Got value from activity: Hello World!
```

你看，我们成功的从 Activity 所在进程，将 “Hello World” 传递到了 Service 进程。

再注意观察这个输出，你会发现，Activity 进程（Client 进程）拿到的 IBinder，并不是 Binder，而是 BinderProxy，为什么？

因为 Binder 是在 Service 中，也就是 Server 进程创建的对象，当然无法共享给其他进程。因此，系统给 Client 进程创建了一个 BinderProxy，作为一个代理，负责与 Server 进程通讯。

> 这里多解释一下代理（Proxy）设计模式。所谓代理，就是一个中间人，或者中介。你只需要和中介沟通，中介负责处理麻烦事儿（IPC），最终将你的要求传达给最终的对象。

看过一些文章，或是使用过 binder 的朋友可能会有些惊讶，为什么没见到 IInterface？确实很多文章都会强调 IInterface 的重要性，但说起它的用途，都是模棱两可的说到它是“Binder服务的基类”，“Binder 通讯的核心类”，或者说代表了Server “具备什么样的能力” 云云。

但你看上文的示例代码，全程没有碰到 IInterface，说明 IInterface 并不是什么不可或缺的东西。那 IInterface 到底是一个什么样的存在？我们暂且按下不表。先来看看大家常常提起的 AIDL 是什么。

## AIDL

AIDL 全称是 Android Interface Definition Language，Android 接口定义语言。它实际上就是一个 Android 创造的语言，但语法非常简单，用途也很单一，就是用来定义 Binder 相关接口的。

使用 AIDL 语法定义好接口以后，Android build 会帮你生成对应的 Java 文件，定义好核心的几个用于数据通讯的类，方便你后续使用。

废话不多说，先来看一个例子：

``` aidl
// IWelcome.aidl
package me.tankery.demo.binder.aidl;

interface IWelcome {
    void hello(String words);
}
```

这就是一个最简单的 AIDL 文件了，只定义了一个方法 `hello`。

他生成的代码类似下面这样（省略大量错误判断和非关键逻辑），我将文章直接写到了注释里，不要像编译器一样直接忽略了哈。。

``` java
// Java code

/**
 * IWelcome 是我们定义的接口，和 AIDL 一致，包含了 void hello(String words) 方法。
 * 并且，扩展了 IInterface，有什么用？看后文。
 */
public interface IWelcome extends IInterface {

    public void hello(String words);

    /**
     * “Local-side IPC implementation stub class.”
     *
     * Stub 是一个抽象类，Server 进程需继承 Stub，并实例化，用于初始化 IPC 环境，
     * 以及接收跨进程消息。
     *
     * Stub 实现了 IWelcome，所以它也是一个 IInterface，并将 IWelcome 的方法
     * 交给子类去实现。
     */
    public static abstract class Stub extends Binder implements IWelcome {

        /**
         * “Construct the stub at attach it to the interface.”
         *
         * 注意这里，Stub 初始化时，将自己（实际上是将继承类）绑定到 Binder 的
         * interface 上。什么用？看后文。
         */
        public Stub() {
            this.attachInterface(this, DESCRIPTOR);
        }

        /**
         * “Cast an IBinder object into IWelcome interface,
         * generating a proxy if needed.”
         *
         * 敲黑板！！！
         * 我认为，IInterface 最核心的作用，就是这个方法做的事情了。
         *
         * 无论是哪个进程，拿到反序列化的 IBinder 以后，通过这个静态方法来获取
         * IWelcome 接口。
         *
         * 如果是 Server 进程（local），可以从 binder 中直接取出之前 attach
         * 的 IInterface 实例，那么调用 IWelcome 的方法，就相当于直接调用
         * Stub 实例的方法了。
         *
         * 如果是 Client 进程，IBinder 只是系统在远程创建的一个 Proxy 类，
         * 并无实现，因此，iin 将变成 null，此时 asInterface 会创建一个
         * Stub.Proxy 代理类，来实现 IWelcome 接口。
         */
        public static IWelcome asInterface(IBinder obj) {
            IInterface iin = obj.queryLocalInterface(DESCRIPTOR);
            if (iin instanceof IWelcome) {
                return (IWelcome) iin;
            }
            return new IWelcome.Stub.Proxy(obj);
        }

        ...

        @Override
        public boolean onTransact(int code, Parcel data, Parcel reply, int flags) {
            switch (code) {
                // Server 进程的 Binder，在这里接收 transaction，并将数据
                // 反序列化以后，调用 hello 抽象方法。
                case TRANSACTION_hello: {
                    // enforceInterface 的作用？本人并没完全搞懂，我的理解来看，
                    // 似乎仅仅是某种校验方式，通过 DESCRIPTOR 来确认给自己发
                    // 消息的是正确的对象。
                    // 懂的人可以留言讨论，感激！
                    data.enforceInterface(DESCRIPTOR);
                    String _arg0 = data.readString();
                    this.hello(_arg0);
                    ...
                }
                ...
            }
        }

        /**
         * Client 进程持有的代理类，通过 Stub.asInterface 创建。
         * Proxy 也实现了 IWelcome，会将方法调用的数据，都通过 mRemote 转发给
         * 远程的 Binder 实体。
         */
        private static class Proxy implements IWelcome {
            private IBinder mRemote;

            Proxy(IBinder remote) {
                mRemote = remote;
            }

            ...

            @Override
            public void hello(String words) {
                Parcel _data = Parcel.obtain();
                Parcel _reply = Parcel.obtain();
                try {
                    _data.writeInterfaceToken(DESCRIPTOR);
                    _data.writeString(words);
                    mRemote.transact(Stub.TRANSACTION_hello, _data, _reply, 0);
                    ...
                }
                ...
            }
        }
    }
}
```

总结一下 AIDL 生成的东西：

1. 一个继承 IInterface 的接口 IWelcome，与 AIDL 定义的方法一一对应，用于声明业务相关方法。
2. Proxy 类 和 Stub 类，都实现了 IWelcome，分别对应于本地进程和远程进程的实例。
3. Stub 类在 Server 进程中实例化，并通过 Service.onBind 方法传递给 Client 进程。
4. Client 进程接收到 IBinder 以后，通过 Stub.asInterface 方法转换成 IWelcome 之后使用。
5. Stub.asInterface 在本地进程工作时，返回 Stub 实例。否则，创建一个 Proxy 实例来代理通讯。

那么，现在你应该能够明白，为什么需要 AIDL，而不是直接使用 IBinder.transact 来通讯？

因为 AIDL 通过定义 IWelcome，将具体的 transaction 细节隐藏起来，使用者只需直接调用接口方法即可，很好的将业务逻辑与平台代码分离开来，实现了较好的软件设计。

另外，通过这个例子，你应该也清楚了 IInterface 的作用。他不是 IPC 所需的“不可或缺“的部分。他实际上是用于抽象出业务逻辑，实现更好设计的一个工具。有了他，业务代码就可以**依赖接口，不依赖具体实现**了。

## Service 是必须的吗？



## 跨进程的 Listener

Client 可以监听 Server 进程的死亡事件

## 后记

之所以想到 Binder，是由于我发现我们的需求实际上和 [GMS Fitness API](https://developers.google.com/android/reference/com/google/android/gms/fitness/Fitness) 很像，都是需要从一个独立的进程来获取数据。于是我阅读了 GMS 的代码（被混淆以后的。。），发现他居然使用了 Binder。由于对 Binder 并不熟悉，当时的我非常惊讶，想知道这是如何做到的，于是走进 Binder 的世界，打开了一扇大门。

了解过程中，发现 [LocationManager](https://android.googlesource.com/platform/frameworks/base/+/3b817ae/services/java/com/android/server/LocationManagerService.java) 也是使用 Binder 实现的，也给我的代码设计提供了非常好的参考资料。

于是感慨道，还是应该要站在巨人的肩膀上。

## 附录

想了解 Binder 机制的原理，通过例子掌握核心内容。可以看这里：
《写给 Android 应用工程师的 Binder 原理剖析》： https://zhuanlan.zhihu.com/p/35519585

想了解实现细节，重要的源码，全面的研究 Binder。可以看这篇文章：
《Android跨进程通信IPC之13——Binder总结》： https://www.jianshu.com/p/485233919c15


