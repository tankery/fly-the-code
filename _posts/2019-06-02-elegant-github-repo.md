---
layout: post
title: Just Note：一个精致的 GitHub 项目
description: "可能是 GitHub 项目的最佳实践"
categories:
  - development
tags:
  - GitHub
  - Android
  - CI
  - Jetpack
image:
  feature: elegant-github-repo/travis-ci.png
  alt: "Travis CI"
  credit: Travis CI
  creditlink: https://travis-ci.com/
comments: true
mathjax: null
featured: false
published: true
---

学习一个知识的最好办法，就是使用，比这还要好的办法，是分享。

我最近在 GitHub 上，又创建了一个新项目 [《Just Note》](https://github.com/tankery/just-note)，一个简单的笔记应用。通过它，我希望将新知识（Android Jetpack）的学习过程，全部以项目的形式使用起来。并分享给所有人。

<!--more-->

而且，不光是简单的学习，我希望尽我所能的，将一个 Android 项目的最佳实践，都应用于这个项目上。

先来看一下项目主页 README 的截图，乍一看还是很亮眼嘛。

<a href="{{ site.baseurl }}/assets/img/post/elegant-github-repo/15594443842212.jpg">
<img src="{{ site.baseurl }}/assets/img/post/elegant-github-repo/15594443842212.jpg" class="center" style="max-height: 50rem; width: auto;">
</a>

目前项目才刚刚起了个头，但它已经具有下面这些能力了：

1. 项目介绍。通过 README，将项目的目标，使用的技术，未来的路线图都一一交代清楚。
2. LICENSE。采用宽泛的 MIT LICENSE，基本上只要注明原作者，你想做啥事儿都行。
3. 软件设计文档。有了设计，事情才能正确的执行。软件设计文档，就是在思考和计划后续的编码要如何完成，尽量从早期就能发现某些隐藏的问题，及早解决。目前我已经完成了架构设计和数据结构设计。相信有了这些准备，后续的编码会顺利很多。
4. 持续集成。通过 [Travis CI](https://travis-ci.org) 的服务。对我的每一次提交进行检查，确保新提交是正确的。并且，这些状态，会通过一个标签，直接反应到 README 上。后续当有实际功能输出以后，我还会添加“部署”这个步骤，将最新代码打包成 APK，发布到 GitHub Release 上。
5. 代码提交流程规范。即使只有我一个开发者，还是希望正确的做事。限制直接对 master 分支的 push，而是必须使用 Pull request，并且，需要确保 CI 编译正确的情况下，才允许合入代码。这些流程，不是记在我脑子里的，而是直接配置在项目中，使得我无需记忆，自然就会遵守。

项目的细节我不多说，大家可以直接关注这个项目来了解。这里，我只想介绍一个点 —— 持续集成。

## 持续集成

我想，持续集成（Continuous Integration）的重要性再怎么强调都不为过。我认为它是保证项目质量的最关键步骤。

简单来说，持续集成就是频繁、快速的将新修改的代码合入主干，并持续的部署新的版本。但前提，是要经过详尽的自动化检查和测试。

持续集成系统，会在每一份新的代码提交到仓库时，自动发起一次构建。构建过程中，至少会做编译、静态代码检查和单元测试。以便确保：

**1. 代码可以成功编译成产品**

这是最基本的检查。这在稍微复杂的项目中是非常必要的，各个项目依赖关系复杂，你本地能编译通过，不代表整个项目都可以成功。需要有这个过程来自动检查。

**2. 没有明显的逻辑或使用错误**

通过静态代码检查 (lint check)，可以帮助找到一些明显的代码错误，比如你使用了高版本 API，但工程是可能在低版本系统运行的。合理的设置 lint 规则，和检查的严格程度，可以很大程度的提高代码质量。（但这里是笔者涉足较少的领域，后续应该再努力提高）

**3. 添加了单元测试的代码，都在按预期逻辑运行**

这可能是人人都在谈如何重要，但大部分项目（特别是客户端项目）都没有执行的步骤了。大家都假装自己的代码逻辑严密，不会出错，然后期待着公司的测试同事，能够发现问题。

但是人就会出错，是代码就一定有 bug。很多特定条件下才能出现的问题，不是靠人工就能测出来的。况且随着功能的增加。如果需要人工将所有逻辑都测试一遍，需要花费非常多的精力和时间。

所以一定程度的单元测试覆盖率，是非常有必要的。

而且，添加单元测试，也能从侧面督促开发者，编写出设计更优良的代码。这个话题要说起来，就又是一大篇了，有机会我们另外再聊。

那么一个 GitHub 项目，要如何进行持续集成呢？

对于公司的商业项目，使用 [Jenkins](https://jenkins.io/) 之类的开源系统是非常灵活的。但配置起来略显复杂。

对于开源项目，更便捷的方式是使用 [Travis CI](https://travis-ci.org/)、 [Circle CI](https://circleci.com/) 这样的服务。

Travis 和 Circle 都是基于云服务的，你自己不需要搭建任何服务器，注册以后，只需要在项目的代码中配置好构建步骤，他们就会自动监听代码提交，开始代码检查和构建了。

他们俩其实差别不大，如果是一个新项目，用任何一个都是不错的选择。只是从我自己的搜索来看，Travis 似乎支持的特性和平台更丰富，因此选择了 Travis。

## Travis CI

下面给一个简化的示例，看看如何为 Android 项目配置 Travis 脚本：

```yml
language: android

before_install:
  - sdkmanager tools
  - ...

install: true

script: ./gradlew clean check --stacktrace

before_cache:
  - rm -f  $HOME/.gradle/caches/modules-2/modules-2.lock
  - ...

cache:
  directories:
    - $HOME/.gradle/caches/
    - ...
```

当然，这里还是隐去了很多细节，如果需要获取到一个可以直接使用的脚本，可以到我的 GitHub 项目中获取：<https://github.com/tankery/just-note/blob/master/.travis.yml>

绝大部分的项目，都需要做这么几个事情：

1. 指定编译环境，`language`，这个项目指定为 Android；
2. 安装依赖，`before_install`，在这里，我们可以初始化一些编译环境，安装构建所需的 tools；
3. 安装软件，`install`，可以理解为安装项目本身。这个步骤其实主要用在某些 Makefile 的项目中，他们需要将项目安装到系统中才可使用。在这里，如果没有什么需要安装的东西，可以指定为 `true` 跳过；
4. 执行脚本，`script`，这是核心脚本的位置。在这里，我们通过 `gradle check` 来执行编译、静态检查和单元测试；
5. 缓存执行结果，`before_cache`、`cache`，在这里，我们可以将某些下载的资源，或者编译的中间结果缓存起来。

可以看到， Travis 脚本的使用其实非常简单直白，而且它提供了很多命令，让你可以直接使用某些复杂的功能，比如 deploy 你的编译结果到 [GitHub Releases](https://help.github.com/en/articles/creating-releases) 上，或是发送邮件。

我这里只是点到为止，很多使用上的细节，大家都可以像我一样，在日常使用中，边学边用，记忆会更加深刻。（这种学习方式，是在大学时，从 Dian 团队学到的，在团队，我们管它叫“干中学”😼）

---

好了，Just Note 这位新人就为大家介绍到这里。目前项目才刚刚开始，希望它不要太监。。

如果你希望看到后续，点点关注。如果觉得不错，欢迎分享给更多朋友。有任何想法，欢迎留言讨论~




