---
layout: post
title: 快捷的动态权限请求 - Permission Requester
description: "本人最近开源了一个简单好用的动态权限请求库，试试看？"
categories:
  - development
tags:
  - Permission
  - Android
  - Library
image:
  feature: dynamic-permission-request/lock-of-root.jpg
  alt: "Lock of Root"
  credit: Scott Schiller
  creditlink: https://www.flickr.com/photos/schill/4813392151
comments: true
mathjax: null
featured: false
published: true
---

之前在问问的一个项目中，需要用到动态权限请求。趁着这个机会，我想把工程中所有项目的权限请求都统一到一起。通过和同事的讨论，发现将权限请求封装成一个 Activity 是最为合适的。通过 Activity，整套权限请求的流程都可以在此 Activity 中完成，各个 App 都只需要调起 Activity，然后获取最终的请求结果，大大简化各 App 请求权限的工作量，并统一了所有 App 的请求流程。

如今稍有空挡，我将权限请求的逻辑从工程中抽出，去掉工程相关代码，整理成了一套 Android 系统上通用的权限请求库，Permission Reuquester，并且将它开源到了 [GitHub 上](https://github.com/tankery/permission-requester)。Permission Reuquester 可以让你用最少工作量，完成一整套权限请求逻辑。

<!-- more -->

## 背景

[在运行时请求权限](https://developer.android.com/training/permissions/requesting.html) 是 Android 6.0 (API level 23) 开始引入的功能，用户可以在运行应用，而不是安装时来请求必要的权限。目标版本是 23 及以上的应用，都必须在运行时请求“危险”权限。

有很多事情需要我们考虑。

首先你需要[检查权限](https://developer.android.com/training/permissions/requesting.html#perm-check)来判断应用是否已经获取到所需权限。如果没有权限，那么你得[请求您需要的权限](https://developer.android.com/training/permissions/requesting.html#make-the-request)，而且通常你需要[解释应用为什么需要权限](https://developer.android.com/training/permissions/requesting.html#explain)。而请求权限以后，你可能会需要[处理权限请求响应](https://developer.android.com/training/permissions/requesting.html#handle-response)，这样你可以在根据权限请求结果来做不同的事情。更麻烦的是，如果用户点选了“不再提醒”，那么你的应用可能就失去获取权限的机会了，你只能选择引导用户到设置中去开启所需权限。

## 代码库设计思路

我们来整理一下权限请求所需要做的事情：

1. 检查权限。判断是否已经有权限
2. 从系统请求权限。
3. 获取系统权限请求结果。如果请求成功，那很好，你的用户同意了权限；如果失败了，那说明你的用户拒绝了权限请求。
4. 获取是否需要解释。如果系统告知是需要解释，那么你还有机会给用户一个解释，然后再请求权限。如果不需要解释。那要么是首次请求，要么就是已经请求过，被用户拒绝，且点选了“不再提醒”。如果是后者，那就很尴尬了，你在应用中已经没有机会再次请求权限了。
5. 跳转到设置。如果你在应用中已经没有机会再次请求权限，那么你只能提示用户去设置里重新开启权限。

整个库的设计目标，就是尽可能的通过各类提示来向用户请求权限，并让用户始终有办法授权。

需要注意的是，这个库是比较激进的，一上来会直接请求权限，用户拒绝后才会进行提示，而用户点选了“不再提醒”以后，会弹窗提示用户去设置开启。所以，一定要在某个功能确实需要权限时，才去调用这个库开启权限，这样才不至于打扰用户。

比如，如果是一个音乐播放器，只有在用户点击“本地音乐”入口时，才去请求磁盘访问权限，这样，将权限请求和用户目标关联起来时，才更有可能争取到用户的同意。而这个库将权限请求这一过程变得如此简单。使得你能非常方便的在各种功能入口都加上对应权限的请求入口，不再会因为觉得麻烦，而在应用一开始，就去请求一大堆将来才会用到的权限。

下图展示了 Permission Reuquester 是如何完成一次权限请求的：

![]({{ site.baseurl }}/assets/img/post/dynamic-permission-request/permission-request-policy.png)

从图中我们看到。如果没有被授权，Permission Requester 会在一开始，就尝试通过系统接口去请求权限，如果你的请求是合理的，而且和用户目标关联，那绝大部分用户会很乐意直接同意这个请求。若用户拒绝，Requester 会弹出一个解释对话框（内容是你指定的），告诉用户我们为什么需要这个权限，并问他是不是要重新请求一下。如果“是”，则重新请求，如果”否“，Requester 会退出，并返回一个授权失败的结果。如果很不幸，用户在拒绝系统权限请求时，点选了”不再提醒“，那么 Requester 会弹出另一个解释对话框，并问他要不要去设置里开启权限。

这一整套逻辑都被封装在 PermissionRequestActivity 中，对外来说，只需要 start，然后获取最终的请求结果。

## 使用方式

首先，你需要在工程中引用 Permission Requester。我将这个库上传到了 jcenter，因为是 Gradle 的默认代码仓库，所以你需要做的只是在 module 的 `build.gradle` 中添加对这个库的依赖即可：

``` gradle
dependencies {
    compile 'me.tankery.lib:permission-requester:1.0.0'
}
```

Gradle 3.0 的话，可以用 implementation 方式依赖：

``` gradle
dependencies {
    implementation 'me.tankery.lib:permission-requester:1.0.0'
}
```

接下来，就可以在代码中使用了。

要实现一个权限请求非常的容易。如果你不需要立刻获得权限请求结果，而仅仅是申请权限的话。用下面这一行代码就够了：

``` java
PermissionRequestActivity.start(context, PERMISSIONS, rationalMsg, goSettingsMsg);
```

你甚至可以在后台 Service 中开启权限请求。

而如果你关心请求结果。那么你可以在你的 Activity 中调用另外一行代码：

``` java
PermissionRequestActivity.start(activity, REQUEST_CODE, PERMISSIONS, rationalMsg, goSettingsMsg);
```

然后，重载 Activity 的 `onActivityResult` 来获取请求结果：

``` java
@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    if (requestCode == REQUEST_CODE) {
        if (resultCode == RESULT_OK) {
            // 授权成功
        } else {
            // 授权失败
        }
    }
}
```

你甚至可以通过重载 `showRationaleDialog` 来自定义解释说明对话框的展现形式：

``` java
/**
 * Override this method to show custom dialog.
 * @param canRequestAgain if true, show request again dialog, else, show go settings dialog
 * @param message dialog message
 * @param dialogResult always have a result for user action
 *                     (ok - > positive/cancel -> negative/dismiss -> negative)
 */
@Override
protected void showRationaleDialog(final boolean canRequestAgain, String message,
                                   final @NonNull DialogResult dialogResult) {
    AlertDialog alertDialog = new AlertDialog.Builder(this)
            .setMessage(message)
            .setCancelable(true)
            .setPositiveButton(android.R.string.ok, new OnClickListener() {
                @Override
                public void onClick(DialogInterface dialogInterface, int i) {
                    dialogInterface.dismiss();
                    dialogResult.onPositive();
                }
            })
            .setNegativeButton(android.R.string.cancel, new OnClickListener() {
                @Override
                public void onClick(DialogInterface dialogInterface, int i) {
                    dialogInterface.cancel();
                }
            })
            .setOnCancelListener(new OnCancelListener() {
                @Override
                public void onCancel(DialogInterface dialogInterface) {
                    dialogInterface.dismiss();
                    dialogResult.onNegative();
                }
            })
            .show();
    alertDialog.setCanceledOnTouchOutside(true);
}
```

## 它是如何实现的？

如果对实现方案感兴趣（其实也没什么特别的，只是对于从 Settings 返回、被锁屏、退回 Home 等麻烦的情况都做了比较好的处理。代码质量自我感觉也还不错），或者发现了什么问题想查找原因。欢迎下载[源码](https://github.com/tankery/permission-requester/blob/master/permission/src/main/java/me/tankery/permission/PermissionRequestActivity.java)进一步了解。

如果你遇到什么 bug，或是有什么建议，欢迎提 [issues](https://github.com/tankery/permission-requester/issues)。 已经找到问题并且有修复方案？或是有任何改进的代码，向我提 [Pull Request](https://github.com/tankery/permission-requester/pulls) 也是极好的。

如果你喜欢这个库，加个 <a class="github-button" href="https://github.com/tankery/permission-requester" data-icon="octicon-star" aria-label="Star tankery/permission-requester on GitHub">Star</a> 就是很好的帮助。

希望这个库能减轻你的一些繁杂工作的压力，留出时间去创造更美好的东西。

<!-- Place this tag in your head or just before your close body tag. -->
<script async defer src="https://buttons.github.io/buttons.js"></script>


