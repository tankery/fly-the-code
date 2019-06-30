---
layout: post
title: 初遇 Flutter
description: "变与不变"
categories:
  - development
tags:
  - Flutter
  - Mobile
  - Cross Platform
image:
  feature: first-met-flutter/flutter_eman_blog.png
  alt: "Flutter Development"
  credit: Filip Smid
  creditlink: https://www.emanprague.com/en/blog/lets-develop-a-mobile-app-in-flutter-13/
comments: true
published: true
---

去年12月初，Flutter 发布了 [1.0 正式版](https://developers.googleblog.com/2018/12/flutter-10-googles-portable-ui-toolkit.html)，也就是说，基本上功能已经完备和稳定，可以产品化了。趁着这个契机，我也终于入了坑。

<!-- more -->

## Flutter 是什么？

游戏界有 [Cocos2d]，有 [Unity]，而 [Flutter] 则是应用界的跨平台的开发框架。类似的框架还有 Facebook 的 [React Native](https://facebook.github.io/react-native/)，微软的 [Xamarin](https://visualstudio.microsoft.com/xamarin/) 等。他们都可以使用特定的语言开发，再编译成不同平台的 native 代码。

另外一类是 H5 应用，或者 Hybrid 应用，他们都是使用 WebView 嵌入一个网页，直接使用 web 技术开发。这类应用在淘宝之类的电商应用上大量使用。他们内容变化非常快，对浏览的体验则要求不高。

而 Flutter 之流，则会编译成平台代码运行。这样不仅可以避免进行复杂的浏览器加载和渲染流程，也可以使得开发出的页面样式更接近原生应用，使得交互体验大大提升。

React Native 已经长大，很多优秀的产品都在使用他。但从18年开始，他似乎开始进入黄昏。AirBnb 宣布[正在弃用 React Native][sunsetting-react-native]，而 Udacity 也说他们[停止了 React Native 上的投入][removing-react-native]。

当然，这可能是一个必然结果。随着 App 用户量的增长和公司规模的增长，公司可能会愿意投入更多人力，使用 Android/iOS 各自的平台代码来分别开发，以提供更为优秀的用户体验（性能、包体积、自动化测试和部署流程）。而 Flutter 可能只是太年轻，所有人都只是刚刚接触而已，也就谈不上弃用了。

不论如何，在目前的阶段，Flutter 的发展还是非常迅猛的。对于页面布局，他们都采用了声明式 ([declarative]) 的布局方式。

## 变与不变

## 流动的数据

[cocos2d]: https://cocos2d-x.org/
[unity]: https://unity3d.com/
[flutter]: https://flutter.io
[dart]: https://www.dartlang.org/guides/language
[declarative]: https://flutter.io/docs/get-started/flutter-for/declarative
[sunsetting-react-native]: https://medium.com/airbnb-engineering/sunsetting-react-native-1868ba28e30a
[removing-react-native]: https://engineering.udacity.com/react-native-a-retrospective-from-the-mobile-engineering-team-at-udacity-89975d6a8102


