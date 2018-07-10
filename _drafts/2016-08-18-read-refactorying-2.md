---
layout: post
title: 阅读《重构》（二）- 准备重构
description: "总结归纳《重构：改善既有代码的设计》这本书的重点内容，第二部分，重构的准备工作"
categories:
  - development
  - reading
tags:
  - 重构
  - 设计模式
  - 改善既有代码的设计
  - 代码坏味道
comments: true
mathjax: null
featured: true
published: true
---

这一系列文章将会总结归纳《重构：改善既有代码的设计》这本书的重点内容。

本篇文章，对应书的三、四章。首先通过列举各类代码的“坏味道”来告诉我们什么时候应该开始重构，然后通过测试用例，为重构做准备。

<!-- more -->

## 代码的坏味道

> 如果尿布臭了，就换掉它。

作者以这样的一个 Beck 奶奶的“人生哲理”开头，告诉我们，重构的时机就是我们发现代码“有坏味道”时。

但这个坏味道，并不是一个精确的时机，而是需要一定的经验和直觉。当然，通过某些迹象，我们就能开始思考需不需要重构了。

下面列举一些常见的“坏味道”代码，以便我们对号入座。

1. **Duplicated Code**，重复代码

  重复代码非常好理解，一旦代码出现重复，特别是那些预期可能还需要再引用的代码，可以根据当前情况，通过 Extract Method，Extract Class，等方式提取重复的部分。

2. **Long Method**，过长函数

  函数太长会使得逻辑非常复杂，难以理解。现代语言和编译器已经让函数调用的开销几乎可以忽略不计了，所以放开手，将那些相对独立的逻辑块使用 Extract Method 提取出来。

3. **Large Class**，过大的类

  与 Long Method 一样，太复杂的类也会使得程序难以理解和维护。将那些相对独立的逻辑 Extract Class 到新类。将一些相对通用并可能复用的逻辑 Extract Super Class，提取出一个基类。
  （对于 Android 程序来说，没有设计过的代码会使得 Activity 类非常复杂和庞大，UI逻辑、数据获取、业务逻辑全都塞到 Activity 里面。这时，我们就应该通过一个中间层，将业务逻辑、数据的处理都分层，与 UI逻辑解耦。当然这时另一个话题了。）

4. **Long Parameter List**，过长参数列

  作者对于这样过长参数的函数采取的建议是在函数内部增加一些请求（query），从类的成员变量，或者关联类直接获取这些数据，而不是通过参数传进来。
  对于此，Tankery 持不同意见，我比较心水函数式编程，所以不太喜欢通过函数内部的副作用。我想大部分情况下，参数过长说明函数太复杂，需要拆分成几个小函数了。当然，有些情况还是没办法减少参数个数，这时候，可以通过提取 Parameter Object 将参数集合到一个数据类里面传递。

5. **Divergent Change**，发散式变化

  在“软”件里，程序的修改绝对是必然的。发散式变化指的是当你需要做不同类型的修改时，发现都会需要修改同一个类（比如修改数据库结构，需要修改三个函数，而增加一个金融工具，又需要修改这四个函数）。这种味道出现说明这个类太庞杂，需要 Extract Class 将相对独立的逻辑提取到独立的类了。

6. **Shotgun Surgery**，霰弹式修改

  与发散式变化有些类似，但霰弹式指的是修改时，需要在不同的函数，不同的类里同时修改多处相关逻辑。这时，你需要做的是将这些相关的逻辑 Move Method，Move Field 到一个独立的类中。使得 “外界的变化” 和 “需要修改的类” 趋于一一对应。

7. **Feature Envy**，依恋情结

  对象使得数据和对数据的操作能够集合到一起。而依恋情结表示 A 类的函数需要从 B 类获取大量的数据，甚至超过对 A 类本身的依赖。
  一个简单的办法当然就是 Move Method 到 B 类中。但有时你需要先 Extract Method 分成小函数后再做这个事情，有时候需要更复杂的策略。

8. **Data Clumps**，数据泥团

  有些函数参数总是绑在一起出现（比如绘图操作里的 x 和 y），一个评判标准：删掉其中一个，其他参数是否就失去意义了？如果是，说明这些参数都应该抽取到一个独立的类中了。

9. **Primitive Obsession**，基本类型偏执

  将某些可能作为类型存在的数据提取成一种“类型类”，用以扩充程序内建的基础类。举个例子，Java 中的 String 和 Date，就是这样的 “类型类”。

10. **Switch Statements**，switch 语法

  面向对象技术可以通过多态减少 switch 的使用。当你发现到处都有着相同的 switch 代码块的时候，可能就需要考虑 Replace Type Code with Subclasses 或 Replace Type Code with State/Strategy 来消除 switch 了。

11. **Parallel Inheritance Hierarchies**，平行继承体系

  是 Shotgun Surgery 的特殊形式。表示当你为一个类增加子类，必须也为另一个类相应增加子类。解决办法是使一个继承体系引用另一个。再通过 Move Method 和 Move Field，将引用端的体系消除。
  举个栗子，可能对应的有两个继承体系，Payment 和 Account，对应有 GooglePayment, ApplePayment, AmazonPayment，以及 GoogleAccount, AppleAccount, AmazonAccount。此时，每增加一个 Payment ，都得同时增加一个 Account。解决办法是，将 Payment 基础出的差异化算法 move 到 Account 中，让每个 Account 实现自己的独特的 payment 相关算法。这样 Payment 可以实现一些通用的算法，并引用 Account，获取每个 account 相关的独特手段。

12. **Lazy Class**，冗赘类

  每增加一个类，都需要多一份理解，这是可能是过分 Extract Class 的副作用，或者是 Move Class 之后留下的空壳。这时，应该通过 Collapse Hierachy，或者 Inline Class 来去除这个类。

13. **Speculative Generality**，夸夸其谈未来性（过分设计）

  过分设计，导致常常用一些复杂手段，钩子和特殊情况来处理一些小事。使得系统难以理解。那么退回一步，删除这些多余的设施。等你将来需要的时候才加回来。

14. **Temporary Field**，临时字段
15. **Message Chains**
16. **Middle Man**
17. **Inappropriate Intimacy**
18. **Alternative Classes with Different Interfaces**
19. **Incomplete Library Class**
20. **Data Class**
21. **Refused Bequest**
22. **Comments**



## 构筑测试体系


