---
layout: post
title: 为 Markdown 文档指定标题 id
description: Markdown 并没有对标题 id 的内建支持，本文尝试使用一种最佳方案来定义 header id
headline: Markdown 并没有对标题 id 的内建支持，本文尝试使用一种最佳方案来定义 header id
categories: development
tags:
  - Markdown
  - Header Id
  - GitHub
  - Jekyll
comments: true
mathjax: null
featured: true
published: true
---

Markdown 并没有对标题 id 的内建支持，而我们经常希望能定义一个 id 来支持页面内跳转。本文通过试验各种方案在不同平台上的效果，尝试使用一种最佳方案来定义 header id。

<!-- more -->

## 可能的方案

首先，我们看看有哪些可能的方案。

我们知道，形如 `## Header` 的字段将会转换成 `<h2>Header</h2>` 如果要支持锚点跳转，我们可以生成如下几种形式的 HTML：

``` html
<h2 id="header-id">Header</h2>
```

``` html
<h2><a id="header-id"></a>Header</h2>
```

``` html
<h2><a name="header-id"></a>Header</h2>
```

第一种显然是最优方案，但绝大部分的 Markdown 转换工具都无法支持转换成这样的目标代码。

我测试了下面几种 Markdown 转换器（编辑器）：

1. GitHub Code Preview
2. Kramdown (for Jekyll page generate)
3. Redcarpet (for Jekyll)
4. StackEdit (Online Markdown Editor)
5. MWeb (Mac App)


## 尝试

### 完全自动生成

完全自动生成的方式倒是少了很多麻烦，但很多转化器对于中文的支持不是很好，比如 Kramdown 无法识别中文，将会自动生成诸如 `section-1` 一类的id，所以我们无法知道 Markdown 最终会生成怎样的id。

### 指定 header id

> `<h2 id="header-id">Header</h2>`

从我的了解来看，只有 Kramdown 和 StackEdit 支持自定义的 header id，语法如下：

``` markdown
## Header {#header-id}
```

其他转换器会把后面的代码识别成普通文字。

### 添加带 id 或 name 的 anchor tag

> `<h2><a id="header-id"></a>Header</h2>`
>
> `<h2><a name="header-id"></a>Header</h2>`

这两种方式支持大部分的转换器，我测试测试过的几种转换器都支持这样的内嵌tag。

但缺点是，Kramdown等自动生成的 header id 比较乱，会生成类似 `a-id-header-id-a--header` 这样的 id。导致一些自动生成目录（TOC）的js工具，会指向这个比较乱的id，导致用户无法分享这个链接了。

### 结合自定义 id 和带 name 的 anchor tag

为了最友好的支持 Jekyll 站的锚点跳转，我最终决定结合 Kramdown 的自定义语法和 anchor tag 的跳转，以实现比较好的效果。

首先，使用 `{#id}` 语法，使得 Jekyll 生成的站点有很好的 header id。在线的 StackEdit 也有较好的体验。

其次，使用 `<a name="id"></a>`，使得不支持自定义 id 的 GitHub 以及 MWeb 也能在预览时支持锚点的跳转。

其语法如下：

``` markdown
### <a name="header-id"></a>Header {#header-id}
```

当然，这样生成的标题，在不支持 `{#id}` 的编辑器中会显示出来，但我想这反倒是比较好的告知其他开发者，我这里使用的锚点名称是什么，只要不是最终输出文件，应该也不算是特别大的障碍吧。

