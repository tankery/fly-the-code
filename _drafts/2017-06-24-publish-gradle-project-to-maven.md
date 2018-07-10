---
layout: post
title: 将 Android Gradle 发布到 Maven 库
description: "以易于理解的方式，从原理上介绍如何将 Android 的 Gradle 项目发布到 Maven 库"
categories:
  - development
tags:
  - Gradle
  - Maven
  - Android
  - Library
comments: true
mathjax: null
featured: true
published: true
---

网上其实已经有很多相关文章，介绍如何将我们的开源项目打包成 Maven 库，并上传到 jcenter/bintry 之类的共享库中。但是他们绝大部分的文章，都是操作性的，只告诉要如何配置，一步步做，但并没有试图让我们理解这些操作背后的原因。使得如果需要做一些修改、定制化，就无从下手。

本文希望通过尽量易懂的方式，介绍 Gradle (特别是 Android 项目)、Maven 等工具的基本工作过程和组织结构，并推荐一些能进一步了解的网站，以便我们能更好的理解，灵活运用。

<!-- more -->

## Gradle 基本概念

像 make, ANT 和 Maven 一样，Gradle 也只是一个 build 脚本。只是它比较现代（2012年发布），结合了各家构建脚本的优势，让 Gradle 变得易用、灵活、强健。

### Groovy

Gradle 使用一种基于 Groovy 的 DSL 语法，这种语法非常灵活、也易于理解，很适合用于编写构建系统，而且 Groovy 基于 JVM，使得 Java 开发者能够比较容易的掌握它。但也因为 Groovy 的灵活语法，以及脚本中随处可见的闭包（closure），使 Gradle 语言变得让 Java 开发者陌生。但只要打通几个关键点，相信我们能很快掌握它。

**函数**

Groovy 可以有多种方式调用函数。比如我们有一个函数：

``` groovy
def printing(msg, title = "any") {
    println "${title}: ${msg}"
}
```

那么你可以用下面两种方式调用：

``` groovy
printing("Hello world!")
printing "Hello world!", "Slogan"
```

**闭包**

Gradle 脚本中，大量使用闭包，但因为语法使用很巧妙，我们可能一下子不太能反应过来。



## Android 工程结构

## Maven 库结构

## 打包 Maven 库到本地

修改 aar 文件的名称：
https://stackoverflow.com/a/28992851/1038900
https://stackoverflow.com/a/33707064/1038900

maven-publish：
https://stackoverflow.com/a/28704799/1038900
**[https://discuss.gradle.org/t/customize-publish-task-to-upload-jar-to-maven-repo-per-build-variant/1303]()**

Android Gradle Plugin - library variant:
https://android.googlesource.com/platform/tools/build/+/d3cc5cac69f3e2229a353554f6f50d969610ce3d/gradle/src/main/groovy/com/android/build/gradle/internal/api/LibraryVariantImpl.java

## 发布到 jcenter


