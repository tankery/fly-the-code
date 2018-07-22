---
layout: post
title: SWIG初探
description: "SWIG是一个扩平台的接口生成库，非常有利于各个平台调用C++的接口"
headline: "SWIG是一个扩平台的接口生成库，非常有利于各个平台调用C++的接口"
categories: development
tags:
  - C++
  - 入门
  - 跨平台
  - 第三方库
comments: true
mathjax: null
featured: false
published: true
---

本文对SWIG在Android Studio中的使用做个简单介绍。顺带介绍下NDK的使用。

为了方便的连接Android Java和NDK代码，也为了将来扩展到iOS，我尝试了SWIG。
但遗憾的是，目前的SWIG好像还没有对iOS有特别好的支持。你还是需要写些包装在iOS使用C++。

[官方的介绍](http://www.swig.org/)是：
“SWIG is a software development tool that connects programs written in C and C++ with a variety of high-level programming languages”

下面我将通过一个Hello World工程，介绍SWIG对函数、类、和Callback的支持。

<!--break-->

本文部分代码来自 [android-ndk-swig-example](https://github.com/sureshjoshi/android-ndk-swig-example)。
我增加了 SWIG 的自动构建依赖，增加了回调的使用。
具体代码和工程，可以从 [GitHub](https://github.com/tankery/swig-ndk-gradle) 获取。

SWIG的安装请参考官方介绍，这里不详述了。

## Hello SWIG
我们先来写一个最简单的应用。Java通过调用一个Native函数来获取一个要显示的字符串。

Java端的代码非常简单，调用函数，显示到textView中。我们先新建一个Android工程，为自动生成的TextView 添加id，在代码里引用。

``` Java
package me.tankery.app.helloswig;
/* ... */

public class MainActivity extends Activity {
    TextView textHello;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        /* ... */

        changeText();
    }
    private void changeText() {
        String text = getNativeString();
        if (text.isEmpty())
            text = "hello Java";
        textHello.setText(text);
    }

    private String getNativeString() {
        return ""; // TODO, get String from native
    }
}
```

C++的代码也很简单，放置在与java目录同级的jni目录下（可以通过Android Studio新建jni folder生成）：

``` C++
/* File hello.cc */

#include <string>

using namespace std;

string get_hello() {
    return "Hello Jni";
}
```

接下来，我们要开始最关键的部分，写SWIG接口，同样放置在jni目录下：

```
/* File : hello.i */
%module hello

%include <std_string.i>

%inline %{
extern std::string get_hello();
%}
```

代码中，`%module`将此文件定义的接口归到一个模块中，在Java中，这个模块以类的形式存在。
`%include <std_string.i>` 引用了SWIG内置的对std库的支持。
接下来的`%inline %{ ... %}`则声明了C++函数，其语法完全与C/C++相同。

OK，现在我们就可以为这个C++函数生成Java接口了。

``` Sh
swig -c++ -java -package me.tankery.app.helloswig.jni -outdir src/main/java/me/tankery/app/helloswig/jni src/main/jni/hello.i
```

这行命令在`me.tankery.app.helloswig.jni`中生成了一系列Java代码。
其中与我们在SWIG中定义的模块同名的`hello`类，就是我们可以在上层调用的接口了。

于是修改Java代码，调用接口：

``` Java
    /* ... */
    private String getNativeString() {
        return hello.get_hello();
    }
    /* ... */
```

可以在界面上看到Native返回的内容了。

## Run in Android Studio (with gradle)

Android Studio 支持 exec 类型的 task，可以执行外面命令，NDK 也被Android Studio 内建支持了。
下面来看看 gradle 的配置文件：

``` Text
apply plugin: 'com.android.application'

android {
    ...

    defaultConfig {
        ...

        ndk {
            moduleName "hello" // Name of C++ module (i.e. libhello)
            cFlags "-std=c++11 -fexceptions -frtti" // Add provisions to allow C++11 functionality
            stl "gnustl_shared" // Which STL library to use: gnustl or stlport
        }
    }
    ...
}

// Location of where to store the jni wrapped files
def coreWrapperDir = new File("${projectDir}/src/main/java/me/tankery/app/helloswig/jni")
def coreWrapperPackage = "me.tankery.app.helloswig.jni"

task createCoreWrapperDir {
    coreWrapperDir.mkdirs()
}

// For this to work, it's assumed SWIG is installed
// TODO: This only works when called from Command Line (gradlew runSwig)
task runSwig(dependsOn: ['createCoreWrapperDir']) {

    def swigInterfaces = fileTree(dir: 'src/main/jni', include: ['*.i'])

    swigInterfaces.each {File file ->
        println "SWIG file: " + file.absolutePath
        def cmd = "swig -c++ -java -package ${coreWrapperPackage} -outdir ${coreWrapperDir.absolutePath} ${file.absolutePath}"
        def proc = cmd.execute()
        proc.waitFor()
    }

}

```

这个配置中，在 defaultConfig 中定义了 NDK 模块的配置信息，使得 Android Studio 能够自动 build native 代码，
另外，由于 runSwig task 直接调用了 swig 命令，使得这个命令只能在命令行运行。
runSwig task，会遍历 jni 目录中的 SWIG 接口文件，依次生成 各自的上层接口。

为了能让 runSwig task 也能自动构建，我们需要添加 swig 命令的路径。
并添加 runSwig 依赖到构建流程中。

为此，我们添加 swig 路径到 gradle.properties 中（目前我还没有研究，是否应该添加到 local.properties 之类的本地文件中），并在 gradle 配置中引用。
另外，利用 preBuild.dependsOn 指令，使 gradle 在 build 过程之前，依赖 runSwig task。

修改部分如下：

``` Text
# file gradle.properties
SWIG_PATH=/usr/local/bin/swig
```

``` Text
// file build.gradle
...

task runSwig(dependsOn: ['createCoreWrapperDir']) {
    ...
    swigInterfaces.each {File file ->
        ...
        def cmd = "${project.SWIG_PATH} -c++ -java -package ${coreWrapperPackage} -outdir ${coreWrapperDir.absolutePath} ${file.absolutePath}"
        ...
    }

}

preBuild.dependsOn runSwig
```

至此，我们整套流程，都自动化了。

## Class & Callback in SWIG

SWIG 支持 C++ Class 的接口调用，包括多态、继承、生命周期的管理等也一并提供。
更棒的是，除了上层可以正确调用 C++ 的虚函数外，通过简单的配置，C++ 也能正确调用 Java 层的实现类。
下面我们通过一个简单的例子来看看 SWIG 如何生成 类的上层接口。

首先我们写好 C++ 代码：

``` C++
/* file music.h */
class LengthGetter {
public:
    virtual ~LengthGetter() {}
    virtual long get() = 0;
};


class Music {

private:

    LengthGetter* lengthGetter;

public:
    Music() {
        fileCount++;
    }
    virtual ~Music() {
        fileCount--;
    };
    virtual float getTime(LengthGetter*) = 0;

    static  int fileCount;
};

class Mp3Music : public Music {
    virtual float getTime(LengthGetter*);
};

class WavMusic : public Music {
public:
    virtual float getTime(LengthGetter*);
};
```

``` C++
/* file music.cc */
#include "music.h"

int Music::fileCount = 0;

float Mp3Music::getTime(LengthGetter* lg) {
    return lg->get() / 100.0f;
}

float WavMusic::getTime(LengthGetter* lg) {
    return lg->get() / 50.0f;
}
```

此代码定义了一个抽象类 Music，扩展出 Mp3Music 和 WavMusic 两个类。
其类函数 getTime，接受一个回调类 LengthGetter，通过回调，获取到长度，并返回 Mp3 和 Wav 特有的 time。

SWIG 接口的 idl 文件定义如下：

``` Idl
/* File : music.i */
%module(directors="1") music_wrap;
%feature("director") LengthGetter;

%{
#include "music.h"
%}

/* Let's just grab the original header file here */
%include "music.h"
```

SWIG 文件定义很简单，只需要依照 C++ 语法定义就行了，甚至可以直接 include C/C++ 头文件。
这里，由于需要用到回调函数，我们需要在 module 处声明打开 director 的 feature。
（由于类需要单独生成文件，module 的定义不要再使用 music，以避免冲突。）
并制定 director 的作用对象，是 LengthGetter。
关于 director 的详细用法，可以参看[官方文档](http://www.swig.org/Doc1.3/Java.html#java_directors)。

生成的 Java 代码，结构如下：

``` Text
app/src/main/java/me/tankery/app/helloswig/jni
├── LengthGetter.java
├── Mp3Music.java
├── Music.java
├── WavMusic.java
├── hello.java
├── helloJNI.java
├── music_wrap.java
└── music_wrapJNI.java
```

现在，可以直接在 Java 中调用 Music 的继承类 Mp3Music 以及 WavMusic，并制定 LengthGetter 的实现类。
代码如下：

``` Java

public class MainActivity extends Activity {

    /* ... */

    @OnClick(R.id.btn_submit)
    void submit() {
        int length = Integer.parseInt(editLength.getText().toString());
        textMp3Time.setText(String.valueOf(getMp3MusicTime(length)));
        textWavTime.setText(String.valueOf(getWavMusicTime(length)));
    }

    /* ... */

    private float getMp3MusicTime(final int length) {
        Music music = new Mp3Music();
        return music.getTime(new LengthGetter() {
            @Override
            public int get() {
                return length;
            }
        });
    }

    private float getWavMusicTime(final int length) {
        Music music = new WavMusic();
        return music.getTime(new LengthGetter() {
            @Override
            public int get() {
                return length;
            }
        });
    }

}
```

至此，我们以及了解了 SWIG 的基本用法和其能力，基本能试用大部分的场景了。
将来，我想还需要继续调研 SWIG 对 C++11 的支持程度等更细节的需求，希望能早日使用到[步伐](http://app.tankery.me/pace/cn/)中。

最后，再次申明: 

本文部分代码来自 [android-ndk-swig-example](https://github.com/sureshjoshi/android-ndk-swig-example)。
具体代码和工程，可以从 [GitHub](https://github.com/tankery/swig-ndk-gradle) 获取。


