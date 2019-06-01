---
layout: post
title: 大个子 Kotlin，一招就把 Java 打趴下了
description: "Kotlin 到底是凭借什么，得以撼动 Java 20 多年的地位？"
categories:
  - development
tags:
  - Kotlin
  - Android
  - Java
image:
  feature: big-kotlin/kotlin_logo.jpg
  alt: "Origami Kotlin logo"
  credit: Michał Kosmulski
  creditlink: https://flic.kr/p/VQk95h
comments: true
mathjax: null
featured: true
published: true
---

时间过得很快，Kotlin 已经快八岁了，他已经长大，翅膀硬了，所以 Google 在最近的 IO 大会上[宣布](https://android-developers.googleblog.com/2019/05/google-io-2019-empowering-developers-to-build-experiences-on-Android-Play.html) Kotlin First，Java 惨遭冷遇！

<!-- more -->

再看看从上一次 IO 大会到如今的成长速度，在排名前 1000 的活跃应用中，已经有近一半的应用使用 Kotlin。

[![]({{ site.baseurl }}/assets/img/post/big-kotlin/15582519332561.jpg)]({{ site.baseurl }}/assets/img/post/big-kotlin/15582519332561.jpg)

各种迹象都表明，至少在 Android 开发的领域，Kotlin 才是未来，Java 越来越成为过去式了。Kotlin 到底何德何能，在短短几年间，撼动 Java 积累了 20 多年的地位？

## 大个子 Kotlin

Kotlin 是个大高个，大到什么程度？比 Java 大。因为他 100% 兼容 Java。Java 能做的，他都能做，他能做的，Java 做不到。

Kotlin 和 Java 一样，也是编译型的，类型安全的 JVM 语言。Kotlin 编译器最终是将 Kotlin 编译成 JVM 字节码。这也就是为何 Kotlin 可以完全兼容 Java 的原因了。

Kotlin 是个大高个，是因为他功能极度丰富。我们简单对比一下关键字就能略见一斑：

Java 有 50 多个关键字。Kotlin 的硬性关键字 (Hard Keywords) 有 25 个，在特定场景下的关键字有接近 50 个，再加上各种内置函数，分分钟上百个单词不成问题，学好 Kotlin，英语词汇量又上一个台阶。。再来看看同是 Google 主推的服务器语言 Go，只有 25 个关键字。。

Kotlin 这么大，你想掌控他可不容易。这不是因为他的语法有多新奇，也不是因为编程方式有多大变化，只是因为要记住的东西太多太多，同一件事情，可能有好几种方式来实现，大家同样是写 Kotlin，却感觉是在写不同的语言。

所以你看，Kotlin 有它的问题，但为何那些优秀的开发者们，还是趋之若鹜？

## 美男 Kotlin

Kotlin 很高大，但不是那种中年发福的高大，他高大，但五官端正，身材匀称。

为什么说他匀称？这里暂且按下不表，我们先通过几个代码片段，来熟悉熟悉 Kotlin。

[![]({{ site.baseurl }}/assets/img/post/big-kotlin/15582556114121.jpg)]({{ site.baseurl }}/assets/img/post/big-kotlin/15582556114121.jpg)

上图是 Android 官网用于[介绍 Kotlin](https://developer.android.com/kotlin/) 的图片，其语法可以一窥一二。

Null safe，大家已经耳熟能详；内建的 lambda 支持，比 Java 8 补丁似的支持更加完美；直接在字符串中引用变量，不需要分号，都让我们少写了很多没什么用的样板代码。

下面来通过一个例子，看看如何用 Kotlin 的方式来 coding。

首先来看一个 Java 片段：

```java
public class TicketUtil {
    public static int getPrice(int age) {
        if (age >= 18) {
            return 100; // Adults price
        } else {
            return 50;  // Kids price
        }
    }
}

final int age = 20;
final int price = TicketUtil.getPrice(age);
Log.d(TAG, "Price of age " + age + " is $" + price);
```

然后很轻松的，直接转换成 Kotlin 语法看看：

```kotlin
object TicketUtil {
    fun getPrice(age: Int): Int {
        if (age >= 18) {
            return 100  // Adults price
        } else {
            return 50   // Kids price
        }
    }
}

val age: Int = 20
val price: Int = TicketUtil.getPrice(age)
Log.d(TAG, "Price of age $age is $$price")
```

就这样？？？删了几个分号，把类型从前置挪到末尾，把几个修饰符去掉？

你看，这就是我要说的，一百个人有一百种 Kotlin 的编写方式。你可以一直像写 Java 一样去写 Kotlin，然后抱怨为何 Kotlin 不支持 static 函数？！

接下来，我们通过几次迭代，用 Kotlin 的方式来写代码。

首先，Kotlin 支持类型推断，无用的类型定义，都可以去掉了：

```kotlin
...

val age = 20
val price = TicketUtil.getPrice(age)
Log.d(TAG, "Price of age $age is $$price")
```

其次，`if-else` 在 Java 中只是个声明（statement），而在 Kotlin 中，它也是表达式（expression）。表达式是有类型，有值的。所以我们可以把 `return` 提出来：

```kotlin
object TicketUtil {
    fun getPrice(age: Int): Int {
        return if (age >= 18) {
           100  // Adults price
        } else {
           50   // Kids price
        }
    }
}
...
```

再者，如果函数体内只有一个表达式，Kotlin 支持用表达式函数体 (expression body) 的方式来定义：

```kotlin
object TicketUtil {
    fun getPrice(age: Int) =
        if (age >= 18) {
            100 // Adults price
        } else {
            50  // Kids price
        }
}
...
```

最后，去掉那些括号，和无用的 Util 类：

```kotlin
fun getPrice(age: Int) =
    if (age >= 18) 100 else 50

val age = 20
val price = getPrice(age)
Log.d(TAG, "Price of age $age is $$price")
```

你看，到了这里，你会发现，用 Kotlin 写出来的代码，确实很简洁，只要不影响理解，能去掉的东西 Kotlin 坚决不留。

是的，Kotlin 少写很多代码。但为什么我要说他“匀称”？

从前面的例子，你可能也发现这里面和 Java 很不一样的地方，`if-else` 是表达式！

而且，`when` (对应 Java 的 `switch`) 是表达式，`try-catch` 是表达式，就连 `throw` 也是表达式。

这样就可以让我们能非常方便的写出下面这样的代码：

```kotlin
fun getPrice(age: Int) =
    if (age >= 18) 100
    else if (age >= 12) 50
    else throw IllegalArgumentException("Not allowed!")
```

或者用 `when` 表达式可以更清晰，简洁：
```kotlin
fun getPrice(age: Int) =
    when {
        age >= 18 -> 100
        age >= 12 -> 50
        else -> throw IllegalArgumentException("Not allowed!")
    }
```

这就是匀称，Kotlin 的语法是协调、统一的。当然，表达式只是小小的一个点，Kotlin 的协调和统一，也在更多的地方得到体现。

比如，`lambda` 函数。

`lambda` 在 Java 8 中也得以支持。但是以类似打补丁的方式支持的。要使用 Lambda，你得先定义一个 `interface`。多么勉强的设定。

在 Kotlin 中，这一切得以重新设计。

Kotlin 的 lambda 函数是有类型的。比如 `{ a: Int -> a * 10 }` 是一个 lambda 表达式，它的类型是 `(Int) -> Int`。再比如 `{ 10 }` 的类型是 `() -> Int`。

这就让你在定义 lambda 参数时，不需要再去定义一个冗余的，毫无意义的 interface，而是可以直接使用函数类型：

```kotlin
fun printPrice(age: Int, getPrice: (Int) -> Int) {
    Log.d(TAG, "Price of age $age is $${getPrice(age)}")
}
```

然后你可以这样去调用：

```kotlin
printPrice(30) {
    when {
        it >= 18 -> 100
        it >= 12 -> 50
        else -> throw IllegalArgumentException("Not allowed!")
    }
}
```

注意这么几个亮点：

- lambda 函数的类型，可以直接定义在函数参数中。
- 当 lambda 函数的输入只有一个参数时，可以省略掉参数定义，用 `it` 代替
- 当 lambda 作为最后一个参数时，调用时可以被挪到括号外，让调用的代码变得更为优雅

另外，上面的例子，展示了 Kotlin 中，高阶函数的使用方式。高阶函数，是将一个函数作为另一个函数的参数去使用的一种技巧。

通过 lambda 表达式的统一定义，以及语法设计上的一些小细节，让 lambda，得以用一种统一、协调的方式呈现出来。

后面我们还将看到，lambda 是如何和 Kotlin 其他部分融合，创造出更多优雅的用法。

## 一招制胜 Kotlin

Kotlin 很健壮，一招就把 Java 打趴下了，这一招是什么？我认为，是扩展函数 （Extension Functions）。

> 注：下面的好几个示例，都来源于 Jake Wharton 15 年的一个演讲，[Android Development with Kotlin](https://youtu.be/A2LukgT2mKc)，强烈建议听一听，受益匪浅。

在项目中我们经常遇到一种情况，标准库、或者其他第三方库的内置函数不够用。比如你有一个 `Date` 对象，你想知道它是否是周五（~~因为马上就周末啦~~）。在 Java 里面，可能就得写一个 DateUtil 的类，用静态函数来判断是否周五：

```java
public class DateUtil {
    public static boolean isFriday(Date date) {
        return date.getDay() == 5;
    }
}

Log.d(TAG, "The day is friday? " + DateUtil.isFriday(theDay));
```

而 Kotlin 提供了一种扩展现有类型的方式，扩展函数 （Extension Functions），使得你可以像调用成员方法一般，调用扩展函数：

```kotlin
fun Date.isFriday() = day == 5

Log.d(TAG, "The day is friday? ${theDay.isFriday()}")
```

扩展函数，让 JVM 上的静态语言，也能拥有像动态语言一般，扩展语言特性的能力。

这还不够，下面通过一个例子，来看看 扩展函数 + lambda 表达式 + 高阶函数 能够发挥多么大的威力。

Android 最麻烦的一个场景，莫过于数据库操作了。如果是使用原生的数据库操作方式，有一大堆的事情要做。下面的代码，希望从数据库中删除一条记录：

```java
db.beginTransaction();
try {
    db.delete("users", "first_name = ?", new String[] {"Tankery"});
    db.setTransactionSuccessful();
} finally {
    db.endTransaction();
}
```

我们可以看到，为了能在事务 (transaction) 中执行一个数据库操作。我们需要注意在任何情况下，都能调用 `endTransaction`，所以需要 `try-catch` 起来。另外在操作结束之后，要记得 `setTransactionSuccessful`，以确保事务能被正常提交。

这太复杂了，很容易出错。那么看看能否使用扩展函数，封装这个 API，让调用者能够少些代码，安全正确的调用。

第一个版本：

```kotlin
fun SQLiteDatabase.inTransaction(func: () -> Unit) {
    beginTransaction()
    try {
        func()
        setTransactionSuccessful()
    } finally {
        endTransaction()
    }
}

db.inTransaction {
    db.delete("users", "first_name = ?", arrayOf("Tankery"))
}
```

看起来已经简单多了。但是有个不太好的风格是，我们在 lambda 函数体中使用了 `db` 这个变量，这使得 `db` 的引用变得复杂，容易出错。因此作出一点修改：

```kotlin
fun SQLiteDatabase.inTransaction(func: (SQLiteDatabase) -> Unit) {
    beginTransaction()
    try {
        func(this)
        setTransactionSuccessful()
    } finally {
        endTransaction()
    }
}

db.inTransaction {
    it.delete("users", "first_name = ?", arrayOf("Tankery"))
}
```

让 `db` 本身，成为输入函数的参数，将 `db` 的引用解耦了。更安全，但还是麻烦，每个操作都需要加上 `it`。我们可以更进一步，使用**高阶扩展函数**：

```kotlin
fun SQLiteDatabase.inTransaction(func: SQLiteDatabase.() -> Unit) {
    beginTransaction()
    try {
        this.func()
        setTransactionSuccessful()
    } finally {
        endTransaction()
    }
}

db.inTransaction {
    delete("users", "first_name = ?", arrayOf("Tankery"))
}
```

这里，将扩展函数作为参数，也就是说，lambda 函数的定义，是一个扩展函数。

扩展函数的好处是什么？在函数体内的代码，就像在类的成员方法中使用一样，可以直接调用类的其他方法或变量。

也就是说，当一个 lambda 函数是扩展函数时，调用者可以像定义成员函数一样，定义 lambda 函数！

我们再通过一个例子，来看看经过高阶扩展函数的改造，可以变成怎样的代码。

在 Android 的 UI 中，我们很多时候都需要使用 `RecyclerView`，我们经常会写这样的代码：

```java
recyclerView = findViewById(R.id.the_id);
if (recyclerView != null) {
    recyclerView.setLayoutManager(new LinearLayoutManager(context));
    listAdapter = new MyAdapter();
    recyclerView.setAdapter(listAdapter);
}
```

零碎，冗余，还容易出错（因为 `recyclerView` 和 `listAdapter` 是成员变量，你无法保证他们不会被其他方法修改）。

再看看 Kotlin 代码：

```kotlin
recyclerView = findViewById<RecyclerView>(R.id.the_id)?.apply {
    layoutManager = LinearLayoutManager(context)
    adapter = MyAdapter().apply { listAdapter = this }
}
```

`apply` 是 Kotlin 标准库的内置函数。让你可以为某个对象，定义一个函数体，在这个函数体中，可以直接使用 this 对象的方法。

而通过 `?.apply` 这样的调用，确保函数体被执行时，一定是非空的，而且可以像在 `RecyclerView` 内一样，直接调用 `layoutManager` 和 `adapter` 的 `setter` 函数。

并且，通过 `apply` ，将 `MyAdapter` 的 `RecyclerView` 赋值，以及 `listAdapter` 的赋值，都统一起来，整洁、优雅。而每一个 apply 内部，都能确保当前环境中的变量是一致的，不会被修改。这样的使用方式，在多线程环境，将更加具有优势。

再来看另一个例子。使用高阶扩展函数，我们甚至可以用声明式的语法，来定义 layout：

```kotlin
verticalLayout {
    padding = dip(30)
    editText {
        hint = "Name"
        textSize = 24f
    }
    editText {
        hint = "Password"
        textSize = 24f
    }
    button("Login") {
        textSize = 26f
    }
}
```

这就是扩展函数的威力。它让你的冗余代码大大减少，并让你的代码更加优雅、健壮。

---

好了，大高个 Kotlin 的故事，到这里就讲完了。但这仅仅是开始，从门缝中看到的一点点光，还有很多优秀的特性值得细细去体会。我也特意隐去了很多细节，那些 Google 一下就能知道的细节，就随着大家的使用而慢慢的了解吧。笔者也仅仅是一个 Kotlin 初学者，希望在后面，能够和 Kotlin 碰撞出更多美妙的火花。

大家如果喜欢（或者即使不喜欢。。），我将来可能会再写一篇，介绍一下 Kotlin Coroutine，可能会更加让人震撼吧（因为我已经从一些文章中看到了 Coroutine 的精彩）。

如果你也期待的话，点点关注。如果觉得不错，欢迎分享给更多朋友。有任何想法，欢迎留言讨论~

