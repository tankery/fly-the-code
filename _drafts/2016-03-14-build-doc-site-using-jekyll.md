---
layout: post
title: 使用Jekyll搭建文档站点
description: "使用Jekyll来构建一个展示项目文档的站点。网站结构受Jekyll Docs的启发，页面样式使用Materialize框架"
categories: development
tags:
  - 网站搭建
  - 文档
  - Jekyll
  - Materialize
comments: true
mathjax: null
featured: true
published: true
---

我在 GitHub 上启动了一个 [Material Doc][material-doc] 的项目，用Jekyll 来生成一个静态的文档托管站点。

站点结构参考了 [Jekyll Documentation][jekyll-doc]（源码在[这里][jekyll-src]），文档都存放在`_docs`目录中，在`_data`目录下存放了文档组织结构。页面样式使用了 [Materialize][materialize] 框架，来构造一个符合 [Material Design][material-design] 设计风格的站点。

<!-- more -->




[material-doc]: https://github.com/tankery/material-doc
[jekyll-doc]: https://jekyllrb.com/docs/home/
[jekyll-src]: https://github.com/jekyll/jekyll
[materialize]: http://materializecss.com/
[material-design]: https://www.google.com/design/spec/material-design/introduction.html

