---
layout: post
title: 记一次混淆App导致的崩溃
description: 一般的问题都是某反射方法找不到，或者序列化失败等等，但这次，居然涉及到ART特有的机制，和 ProGuard 的bug，也是离奇了。
categories: development
tags:
  - Proguard
  - 混淆
  - ART
  - AbstractMethodError
  - Before Android 4.1
comments: true
mathjax: null
featured: false
published: true
---

> 首先声明，这个问题最重要部分的解决，主要是另一位同事YC的功劳，我只是希望将来能有所参考而将这个问题的解决过程记录下来。

自测没有问题的App，在测试那里出现了必现的 `AbstractMethodError` Crash。这样的问题既然编译能过，很可能是混淆问题。然而检查mapping文件后，发现名称虽然被混淆，但并没有被删除，应该是没有问题的。

<!-- more -->

## 常规的定位方式

崩溃的 CallStack 如下：

```
FATAL EXCEPTION: main
Process: com.mobvoi.ticwear.dialer, PID: 2541
java.lang.AbstractMethodError: abstract method "android.view.View dialer.TS.z(java.util.List)"
	at dialer.TS.a(HeaderScrollingViewBehavior.java:57)
	at ticwear.design.widget.AppBarLayout$ScrollingViewBehavior.a(AppBarLayout.java:1416)
	at ticwear.design.widget.CoordinatorLayout.onMeasure(CoordinatorLayout.java:778)
	at android.view.View.measure(View.java:17668)
```

查看 `HeaderScrollingViewBehavior.java:57` 得知是一个 abstract method 的问题。

HeaderScrollingViewBehavior 的实现如下：

``` java
abstract class HeaderScrollingViewBehavior extends ViewOffsetBehavior<View> {

    ...

    @Override
    public boolean onMeasureChild(CoordinatorLayout parent, View child, ...) {

        ...

        final View header = findFirstDependency(dependencies);

        ...

    }

    abstract View findFirstDependency(List<View> views); // line 57
}
```

其实现子类实现如下：

``` java
public static class ScrollingViewBehavior extends HeaderScrollingViewBehavior {
    @Override
    View findFirstDependency(List<View> views) {
        ...
    }
}
```

这几个类的继承关系如下：

```
CoordinatorLayout$Behavior
            ^
           ...
            ^
abstract HeaderScrollingViewBehavior
            ^
CoordinatorLayout$ScrollingViewBehavior

```

因为 `AbstractMethodError` 是由于子类未继承父类的abstract方法，导致调用此 abstract 方法时，找不到实现而崩溃。实际情况中，由于带有 abstract 方法的类必须是 abstract 的，而这样的类必须被继承和实现才可能被实例化。因此，绝不可能出现这样的崩溃。这个时候，我能想到的只有下几种可能：

1. 使用了 Android SDK 的某个方法，而在不同的系统版本中没有实现。
2. 使用的某个库使用的 `provided` 方式编译。这样，只是在编译时引用了库，而在实际打包时，并未加入应用中。
3. 混淆出问题，错误的删除了子类实现。

出错的并不是 Android SDK 的方法，我也并没有使用类似 `provided` 这样的方式编译。那么，只可能是混淆的锅了。

于是检查了 ProGuard，有这样的规则：

``` ProGuard
-keep public class * extends ticwear.design.widget.CoordinatorLayout$Behavior {
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>();
}
```

查看 ProGuard 的 mapping 文件，发现 `ScrollingViewBehavior` 没混淆，而 `HeaderScrollingViewBehavior` 被混淆了。

这也是正常的，因为根据 ProGuard 规则，确实应该这样。而且 `findFirstDependency` 混淆后的签名一致，仍然符合正确的继承关系，不应该出现 `AbstractMethodError` 的问题。

而且，从 crash 的 CallStack 来看，调用栈确实是从子类过来的，因此子类的代码是一定存在，没有被混淆删除的。

这就非常奇怪了。实在不知道还有什么其他可能。Google 了一下类似的问题。发现[这篇文章](https://github.com/JodaOrg/joda-time/issues/207)里提到只有在开启 ART 的机器中才会出错，怀疑是不是碰到什么 ART 的 bug 了，其解决办法就是 keep 住相关方法，不让其混淆。然而，秉承着程序出错不能怪编译器的传统，而且也检查过混淆是没有问题的，所以我们还是决定继续寻找 root cause。

## ART 和包访问域

检查代码，检查混淆规则，检查问题产生所需的环境，一切似乎都是正常的。直到YC发现 Crash 的 App 有这样的 warning log （是的，程序员不能只关心 ERROR，也还是需要看看 WARNING 的）：

```
"Before Android 4.1, method ... would have incorrectly overridden the package-private method in ..."
```

错误的覆盖包访问域的方法？这个问题是与包访问权限相关的？

查看源码，发现确实是函数的访问权限出错了：

``` cpp
if (klass->CanAccessMember(super_method->GetDeclaringClass(),
                           super_method->GetAccessFlags())) {
  if (super_method->IsFinal()) {
    ThrowLinkageError(klass.Get(), "Method %s overrides final method in class %s",
                      PrettyMethod(virtual_method).c_str(),
                      super_method->GetDeclaringClassDescriptor());
    return false;
  }
  vtable->SetWithoutChecks<false>(j, virtual_method);
  virtual_method->SetMethodIndex(j);
} else {
  LOG(WARNING) << "Before Android 4.1, method " << PrettyMethod(virtual_method)
               << " would have incorrectly overridden the package-private method in "
               << PrettyDescriptor(super_method->GetDeclaringClassDescriptor());
}
```

于是再次查看 mapping 文件，有这么两个转换：

```
ticwear.design.widget.HeaderScrollingViewBehavior -> dialer.TS
ticwear.design.widget.AppBarLayout$ScrollingViewBehavior -> ticwear.design.widget.AppBarLayout$ScrollingViewBehavior
```

也就是说， `ScrollingViewBehavior` 由于被 keep，保持了原有的包名，而 `HeaderScrollingViewBehavior` 的包名被混淆了。

这个包名的混淆，是YC添加的一个 ProGuard 规则的作用，目的是更好的防止反编译，和减小包体积：

``` ProGuard
-repackageclasses 'dialer'
-allowaccessmodification
```

父类的包名被修改，而继承的又是包访问域的方法。导致这个 crash。

需要说明的是，这个问题只有在打开ART的机器上才会导致crash，应该是ART做了更严格的检查。老的VM是不会有crash的。

这么看来，问题的原因就是混淆器错误的混淆了本该正常的代码访问权限。这应该归咎于混淆器的bug。

## 问题的解决

但还有另一个情况。我们的构建系统有两套。一套是应用层的构建，使用 Gradle；另一套是系统的构建，使用 Android Make。实测发现只有 Make 构建出来的 APK 会 crash。事情变得更蹊跷了。

YC 对比了 make 使用的系统默认 ProGuard 规则，和 gradle 使用的 Android SDK 的 ProGuard 规则，发现只有些许细微差别，而且使用相同规则构建出来的两个 APK，也还是同样只在 Make 上会 crash。

于是尝试了反编译两者构建出来的 APK。终于发现了一个区别：

- Gradle 生成的 APK，其父类 `HeaderScrollingViewBehavior` 的包名虽然被修改，但访问权限也随之修改为 public，使得不同包名的子类仍然可以正确的继承。
- Make 生成的 APK，访问权限没有修改，也就是说，`-allowaccessmodification` 貌似没有生效。

到这里，大致就可以确定是 Android Make 所使用的 ProGuard 由于太老，并未处理包访问域的问题，也许升级就能解决了。

不过这个改动比较大，目前来看，还是禁用 `-repackageclasses` 规则比较保险。

如果大家也遇到类似的问题，不妨尝试更新你的编译器，最新版本的编译器已经没有对这个问题做了处理了。


