---
layout: post
title: 重写了我的个人博客
description: "不懂设计的安卓开发不是好作者"
categories:
  - development
tags:
  - Website
  - Jekyll
  - Design
image:
  feature: built-my-new-designed-website/coding-on-the-beach.jpg
  alt: "Coding on the beach"
  credit: Max Pixel
  creditlink: https://www.maxpixel.net/photo-3013602
comments: true
published: true
---

最近又不务正业了。。

起因是想要直接复制博客内容和样式到微信公众号，但很多样式都失效了，于是想去改网站的样式，又因为原来的网站代码写得真是一坨*（使用了某个博客模板），完全没有修改的欲望。所以，干脆重写一个咯。

<!-- more -->

说起来，其实公众号排版问题也不多，主要就改了两个问题：

1. 标题、正文、代码等字体大小信息丢失。
2. 代码换行信息丢失，很多地方的换行都被去掉，非常丑陋。

但在这次开发之前，我其实很早就想着要统一自己几个站点的风格了，甚至已经在 Sketch 中进行了一番设计，已经心痒痒了大半年，趁着这股热情，赶紧把它搞出来。

## 太长不看

写完文章发现又洒出了5000多字，心想没人会想看这么多字吧，但写都写了，也懒得删。所以还是提供一个 TL;DR 的版块，根据需要再往下看吧。

这次重写，基本上就做了这么些事情：

1. 利用 Sketch 进行视觉设计。
2. 使用 [Jekyll] 框架来生成纯静态网页，托管在 [GitHub Pages]
3. 文章使用 [Markdown] 编写
4. 基于 [Materialize] 进行页面排版布局和渲染，采用 rem 单位定义字体大小
5. 使用 JS 脚本处理代码块，避免粘贴到微信公众号后换行丢失的问题

## Design

先来看看设计稿。

<a href="{{ site.baseurl }}/assets/img/post/built-my-new-designed-website/fly-the-code-overview.png">
<img src="{{ site.baseurl }}/assets/img/post/built-my-new-designed-website/fly-the-code-overview.png" class="center" style="max-height: 50rem; width: auto;">
</a>

这和专业设计师的作品相比，实在是简陋得可以。配色似乎有些呆板，字体选择有些随意，布局看起来还行，只是比较普通没有什么吸引人的地方。

但是，还能看。没那么漂亮，但还算是不丑，整体没有什么乱糟糟的感觉，比较清爽，不会影响到内容的阅读，对内容的主次划分也能处理得比较干净。作为第一个版本的产品，我觉得还不错。

那么，就开始开发吧。

## Jekyll, Markdown and GitHub Pages

首先做的，是技术选型。作为一个懒人，首先考虑的，就是怎么才能不做重复的事情，所以写网页一定的是模块化的，不同的页面复用同一套标题栏、复用同一套底栏、引用统一的调色板，甚至作者名字、站点网址，也一定要是统一引用的。

很幸运，之前就已经搭过几个基于 [Jekyll] 框架的站点，尝到了它的甜头。我不知道是否还有前端开发没有听过或是没有用过Jekyll，但我想它是一定要去试一试的。很多人会认为，想要复用页面模块，那肯定是服务器在收到用户的请求时，动态的将多个页面片段拼接起来，再给用户响应。没错，这就是世界上最好的语言 PHP 擅长的事情，而且基于PHP，有着世界上最流行的博客框架——WordPress。但我一直认为，现在已经不是将前端页面、后台业务逻辑以及数据库整合到一个工程里的时代了，世道变了。现在大家谈论的是分布式数据库、微服务、前后端分离、RESTful API、CDN。所以仔细想想，博客类站点的搭建，只能用PHP那一套吗？

博客站点，最重要的，无非就是一个文章列表和文章内容排版展现，WordPress为了完成这个事情，将文章存到了数据库里（或者文件系统上？），然后提供一个账户系统，让你可以登录到后台系统，提交新的文章。对于一个媒体类站点，这也许是必要的，但个人博客，就我一个人或者少数几个人写文章，有必要搞这么一套么？

于是，Jekyll们（类似的还有Hexo等框架），提供了一个新的思路。既然搭网站的，和写文章的是一个人，那为啥还需要分两步？文章即代码，直接存入代码库，然后通过**编译**，将文章内容编译成静态站点文件，就可以直接部署了。无需账号系统、无需后台编辑系统，而且，由于有编译过程，那网页的模块化、JS、CSS内容的模块化，都可以在编译之前进行，一次编译，到处使用，编译后的所有页面都是静态的，几乎完全不需要考虑服务器负载问题，而且还非常利于使用CDN来提示访问速度，对于博客站点这样有着大量内容，又几乎不需要数据交换的网站，有着天然的优势。

再说说 [Markdown]。如果一个文字工作者还没有接触过类似 Markdown 这样，将文本格式，和文本样式分离的工具，那他一定失去了很多快乐。编写时使用简单标记来标识类似标题、正文、代码之类的文本格式，而不必关心这行文字大小是多少，需要前后间隔多少之类烦人的排版问题。一篇文章写完，排版就已经完成了，这种舒畅感，只有使用过的人才能体会得到，而一旦体验过，就回不去了。

Jekyll 这类现代框架，当然是内建了对 Markdown 的支持，编译过程中，就会自动将 Markdown 文件直接转换成 HTML 块，然后再与模块化的页面框架、CSS、JS等内容拼接，就可以生成完整的文章网页了。除此之外，当然也支持文章索引、分页、分类、标签等等常见需求。想要详细了解，可以去它的官网（<https://jekyllrb.com/>）看看。

使用 Jekyll，而不是 Hexo 等工具的一个很重要的原因，是因为它是 [GitHub Pages] 内建支持的建站框架。GitHub Pages 是 [GitHub] 提供的静态网站托管服务，你只需要将站点代码提交到GitHub，它就已经将网站部署完成了。这个服务的初期，是为了展示项目介绍、文档等目的而存在的，但GitHub官方也[推荐](https://help.github.com/articles/using-jekyll-as-a-static-site-generator-with-github-pages/)用户将其个人站点等网站托管在其服务器上，所以也不懂担心是在撸它的羊毛，敞开用就好了。唯一需要担心的，是它托管在境外，所以面临一些访问稳定性上的风险（原因你懂的）。所以建议那些用户量大，希望有稳定访问速度的，还是托管在AWS或是阿里云等境内服务器上。我后续也许也会发个文章来介绍如何让 GitHub 的代码提交后，自动部署到 AWS 服务上，阿里云等服务，使用类似的方式部署就好了。

## 网页排版和样式

本来想，是不是应该专业一些，直接用 Bootstrap 或者 Foundation 之类的主流框架。但发现他们特性实在太丰富，再加上内心一些不爱从众的心理，就放弃了。考虑到我只有几个基本需求：

1. 网格布局和响应式布局系统
2. 文章基础样式
3. 标题栏、侧边栏、按钮等基础组件

于是还是选用了我相对熟悉的 [Materialize]。

之所以熟悉，是因为之前在开发 [Material Doc](https://tankery.github.io/material-doc/) 项目时，就已经使用过，对它的12等分网格布局、以及优秀的响应式布局方案印象非常深刻。之前也将其网格布局方案用于 [TicDesign](http://ticdesign.chumenwenwen.com/) 的文档编写中。如果继续使用这个框架，一切都会顺利些。而且，谁让我是 Android 开发呢，自然对 [Material Design](https://material.io/design/) 的方案有着更强的亲切感。所以，最终还是翻了 [Materialize] 的牌子。

在写的过程中，由于不熟悉，遇到一些麻烦的地方。但总的来说，Google 一下，总能找到一些比较完美的方案来。也有一些奇技淫巧，比如下面这个布局：

<img src="{{ site.baseurl }}/assets/img/post/built-my-new-designed-website/post-item-layout.png" class="center" style="width: auto;">

这是博客主页的文章列表项。图片高度随其相邻元素动态调整的布局实现，比如左侧的概要内容比较少时，图片需变矮，内容比较多时，需变高，而且需响应浏览器宽度变化导致左侧内容重新布局的行为。行内人可以想想如何实现，反正我初步Google了一下发现确实不是容易的事情。最终是使用了 [Flex Box](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) 这一技术才得以解决。

另一件值得一提的事情是，博客中所有的文字大小，以及行高、字间距等与文字相关的布局，都使用了 rem 为单位，而不是 px。rem 使用相对大小，1rem 定义为 html tag 的字体大小。其他大小，则都是这个大小的倍数。使用 rem 的好处，是所有文字都可以根据 html 字体的大小而相应调整，非常适合在PC以及移动端这种多平台的场景使用。使用这套单位以后的一个附带好处，就是粘贴到微信公众号以后，格式得以完整的保留了。

## 代码在公众号的粘贴问题

微信公众号的编辑器一直有个问题没有解决，那就是代码的粘贴。如果你也是一个公众号的作者，你可以试着从网页上复制一段代码，然后粘贴到编辑器中。比如下面这段代码（我的博客已经对代码段进行了处理，从这里复制都是不会复现问题的）：

``` java
@Override
@NonNull
public String getMessage() {
    return "Hello " + "world!";
}
```

粘贴到微信公众号以后，就会变成这样：

``` java
@Override@NonNull public String getMessage() {
    return "Hello " + "world!";}
```

很多换行符都被干掉了。。研究以后，发现是公众号编辑器对于`white-space: pre;`的处理有问题。HTML代码的换行符后面如果直接接文字，而不是空格的话，在编辑器中会被忽略。解决办法是使用 `<br>` 标签来强制换行。

问题定位以后，就很好解决了，在文章页面中插入一段JS来处理代码段，将换行符替换为`<br>`标签就解决了。

``` javascript
// Replace line break in pre > code to <br> tag, to fix issue of WeChat paste issue.
$('.post-page .post-content pre > code').each(function(){
  var html = $(this).html();
  var replaced = html.replace(/<\/span>\n\S/g, function(s){
    return s.replace('\n', '<br>');
  });
  $(this).html(replaced);
});
```


## 后记

在博客搭建过程中，当然还有些零碎的细节，这里就不多累述。对于公众号的发文，也还有两个未解决的问题：

1. 超过屏幕宽度的代码，在iPhone上会被折行，而不是可滚动。
2. 图片无法显示。

都只能等将来有空再慢慢解决了。

如果对这个网站的具体实现感兴趣，可以到我的 [GitHub 项目 —— Fly The Code](https://github.com/tankery/fly-the-code/) 上，通过源码来了解实现细节，也可以 Watch 或 Star 这个项目，跟踪我后续的更新。当然，也欢迎 Follow [我的 GitHub 账号](https://github.com/tankery)，随时了解我又做了什么奇怪的事情。

最后，欢迎光临我的博客站点 [blog.tankery.me](https://blog.tankery.me)，你可以给我留言，或是使用 RSS 订阅我的文章 [Feed 流](https://blog.tankery.me/feed.xml)。

![]({{ site.baseurl }}/assets/img/post/built-my-new-designed-website/my-workshop-desktop.jpg)

祝好。



[Jekyll]: https://jekyllrb.com/
[GitHub]: https://github.com/
[GitHub Pages]: https://pages.github.com/
[Markdown]: https://en.wikipedia.org/wiki/Markdown
[Materialize]: https://materializecss.com/
[Disqus]: https://disqus.com/


