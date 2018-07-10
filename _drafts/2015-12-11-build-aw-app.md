---
layout: post
title: 如何使手表App兼容TW和AW(中国版)
description: "如何使手表App兼容Ticwear和Android Wear，以及AW中国版"
headline: "如何使手表App兼容Ticwear和Android Wear，以及AW中国版"
categories: development
tags:
  - Android wear
  - Ticwear
  - Gradle
comments: true
mathjax: null
featured: true
published: true
---

当我们开发了一个手表的应用，当然希望应用能在多个平台上正常运行起来。
所以本文，将介绍如何使手表App兼容Ticwear和Android Wear（后文简称AW），以及AW国际版和中国版的区别。

<!--break-->

## 打包、兼容、以及各类概念的解释

[Android Wear][aw]， 是Google官方基于Android开发的闭源手表系统，保留了绝大部分的Android接口，裁剪和增加了部分接口。

[Ticwear][ticwear]， 也是基于Android（Ticwear 3.0系统基于Android 5.1），由[出门问问][wenwen]开发的手表系统。
但为了保证最大的兼容性，AW大量的API都是被Ticwear兼容的。
因此，各类AW的文档，基本也是适用于Ticwear的。

手表助手， 各类手表平台（Ticwear、Android wear国际版/中国版）都会对应有一个手机App，这个App的主要作用，就是维持手机、手表的连接和通讯。
通常会做一些消息推送、通话、手表应用安装、数据同步之类的工作。

打包， 手表App不能独立发布，因此手表App都一定对应有一个手机App，发布时，必须将手表App包装到对应的手机App中，才可以发布。
不同的手表平台，对打包有不同的要求。

GMS & MMS， 手机、手表的通讯API。
GMS (Google Mobile Service) 是Google原生的通讯API，MMS (Mobvoi Mobile Service) 是出门问问为Ticwear研发的通讯API。
MMS API除名称不一样外，其他的使用方式都是follow Google的GMS，以减少开发者的学习成本。

兼容模式（通讯兼容）， Ticwear的SDK，提供了一种叫做兼容模式的东西。
这个兼容，针对的是手机、手表的通讯，与其他的概念，如打包、语音语义，没有关系。
兼容模式，使得一个应用，不需要修改代码，就能自动适配Ticwear（使用MMS通讯）和AW（使用GMS通讯）平台上的通讯API。

AW中国版、国际版， Android Wear用户的痛苦，是必须翻墙，才能使用手表上的一些高级功能，如语音、推送、和第三方应用与手机App的通讯。
而Google终于在前段时间，推出了专门针对中国大陆的Android Wear系统。除了使用出门问问提供的语音引擎。对于第三方应用的一个较大的改变，是替换了GMS。
AW中国版使用了一套独立的GMS SDK，使得中国大陆用户不需要翻墙即可使第三方应用于手机通讯。
开发者只需要替换掉对Google Play Service 的依赖就好，不需要修改代码。

## 根据你的应用类型判断要做什么

不同类型的应用，使用到的API不一样，在兼容时所需要做的工作也不一样，这里大概列举几种典型的应用，并帮助大家来选择，需要做哪些部分的兼容。

### 未使用特殊API的应用

这类应用，并未使用任何特殊API（如通讯、语音语义、天气计步等），手表上的应用可独立运行在Ticwear和AndroidWear系统上。
比较典型的应用是表盘应用和手表上的游戏等小应用。
这类应用的开发者，只需要关心打包的兼容就可以了。请参看[如何打包](#package)。

### 使用了MMS或GMS与手机通讯的应用

这类应用，使用了MMS或GMS进行通讯。手表App需依赖手机App，或需要做些同步之类的工作。
这是绝大部分应用属于的类型。
这类开发者，除打包外，还需要关心[如何通讯](#message-api)。

### 使用了语音语义等特殊API的应用

这类应用，使用了Ticwear或AW上的一些特殊API。如各自的语音、语义接口，或者Ticwear的天气、健康、挠挠等API。
一部分的表盘应用，和一些工具、社交类应用会用到这些API。
这类开发，除打包外，还需要关心[如何使用语音语义等特殊API](#specail-api)

## 如何打包<a name="package"></a>

首先我们需要了解的是，打包的作用是使得用户在安装从应用市场下载的手机App后，手表对应的助手能识别这个应用，并把包装在里面的手表App取出，安装到手表上。
那么，我们来看看对于打包好的手表应用安装，手表助手通常的工作方式是怎样的：

1. 手表助手扫描手机本地App，提取带有自家手表标记的App（这个标记在manifest文件中声明）
2. 手表助手根据手机App的一些描述文件，提取出包装在其中的手表APK
3. 手表助手上传手表APK到手表，手表进行安装

从这个流程我们可以注意到，不同手表平台的打包方式，其区别主要在于manifest文件中的手表App标记。有了这个标记，各家手表平台就能识别出来，进行安装。

具体如何操作呢？
对于Ticwear的打包，参考[快速入门](http://developer.ticwear.com/doc/getting-started)的应用打包流程来打包。
对于Android Wear的打包，如果使用的是[Android Studio][as]，你的手表应用应该已经使用 `wearApp('yourWearApp')` 依赖起来了。
那么，你不需要做任何事情，只需要使用release 模式打包，就能输出符合AW标准的应用。
详情请参考[Packaging Wearable Apps][aw-pkg]

强烈建议你使用Android Studio开发手表应用。但如果你仍然希望使用Eclipse，你需要在配置好Ticwear打包之后，在manifest里面添加下面的meta-data：

``` xml
<meta-data android:name="com.google.android.wearable.beta.app"
            android:resource="@xml/wearable_app_desc"/>
```

这与Ticwear的配置非常类似：

``` xml
<meta-data android:name="com.mobvoi.ticwear.app"
            android:resource="@xml/wearable_app_desc"/>
```

其中， `wearable_app_desc` 是你的手表App描述文件的位置。

如果你想同时兼容AW和Ticwear的打包，可以同时保留这两个 `meta-data`。


## 如何通讯<a name="message-api"></a>

目前Ticwear实现了Google Play Services中手表和手机之间数据传输的接口，包含Node API、Message API和Data API的全部功能。
Ticwear的接口名称、方法名以及语意与Android Wear的实现完全一致。
使用我们提供的Mobvoi API
如果开发者开发一个新的手表应用，可以使该应用同时运行在Android Wear和Ticwear平台上；如果开发者已经有了一个Android Wear应用，我们提供了以下三种方法可以快速将此Android Wear应用转变为可以运行在Ticwear上的应用。



## 如何使用语音语义等特殊API<a name="specail-api"></a>





[aw]: https://www.android.com/wear/
[ticwear]: http://ticwear.com/
[wenwen]: http://chumenwenwen.com/
[as]: http://developer.android.com/sdk/index.html
[aw-pkg]: http://developer.android.com/training/wearables/apps/packaging.html


