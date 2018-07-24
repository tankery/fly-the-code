---
layout: post
title: 刨根问底 - 如何将 PCM 音频编码成 MP4？
description: "用刨根问底的精神，拨开真相面前的重重阴霾"
categories:
  - development
tags:
  - Root Cause
  - Android
  - Audio
comments: true
mathjax: null
featured: false
published: true
---

很多时候，我们会碰到一些棘手的问题。我们会从 Google 去寻找答案，然后一个个尝试，发现都不 work，怎么办？又有些时候，幸运的找到了答案，自己依葫芦画瓢的解决了问题，但问题变了个说法，做了一些修改，原来的办法不生效了怎么办？

作为一个有(bu)追(yao)求(lian)的码农，我的想法是，刨根问底，找到 root cause，这样才能恍然大悟，融汇贯通。自己的问题解决了，网上那些可怜的提问者的问题，你也知道答案了。所以从这篇文章文章开始，我决定开始一个系列——刨根问底，记录下那些棘手问题的解决过程，希望也能给大家一些启发。

<!-- more -->

今日份的问题是这样的：**“怎么将一个 PCM 音频流（或是WAV 文件流），编码成 MP4 格式（或是其他压缩格式）？”**

带着这个问题，我们第一件要做的事情，当然是去 Google 一下看看是否有现成的方案。搜索 "android pcm to mp4 file“，或者其他类似的一些方案，你会发现[这篇博客](http://codingmaadi.blogspot.com/2014/01/how-to-convert-file-with-raw-pcm.html)和[这个回答](https://stackoverflow.com/questions/33085312/convert-pcm-to-aac-or-mp4-file-without-mediamuxer)，一个用实际代码告诉你可以用 MediaCodec + MediaMuxer 来实现，很好，这很原生，然鹅 MediaMuxer 只支持 API18+，覆盖的用户变少了；另一个说用 [Android AAC Encoder](https://github.com/timsu/android-aac-enc/) 这个库；还有一些回答是针对具体问题的，并没有详细说明怎么做。

如果原始接口可以实现的话，我们并不想引入一个音频编码库（特别是包含 native code 的库），这会使得包体积变大，所以我们先试着去找找无需编码库的原生实现方案。

我们先来看看 MediaMuxer 的方案。假如我们的工程是基于 API16+ 的（Android4.1，几乎就是覆盖了所有用户了），而 MediaMuxer 是 API18 才引入的。那么，MediaMuxer 的方案就很让人纠结，是放弃一部分用户选用这个方案，还是再找找其他办法？没有实践就没有结论，我们先尝试一下这个方案吧。

## Encode with MediaCodec + MediaMuxer

尝试这个方案时，发现 GitHub 上有个项目叫 [PCMEncoder](https://github.com/Semantive/pcm-encoder) 对前文提到的博客做了个封装，比较易于使用。详细的实现我就不说了，逻辑都在 [PCMEncoder.java](https://github.com/Semantive/pcm-encoder/blob/master/app/src/main/java/com/semantive/pcm_encoder/PCMEncoder.java) 这个类里面。大致的逻辑，就是先配置好 MediaCodec 和 MediaMuxer，之后用 MediaCodec 对输入的原始音频流做编码以后，利用 MediaMuxer 写入到 MP4 文件。

放入工程中运行以后，发现确实能方便的编码成 mp4。要不我们就放弃那一小部分用户，把 API 支持上调到 18 吧？但是等等，好像有个小问题，为什么原生文件中的最后一个部分的音频不见了？去它的项目上看，发现有一个 [issue](https://github.com/Semantive/pcm-encoder/issues/1)，和我遇到同样的问题，而两年过去了，作者并没有回复。。（后面的一个 pull request 是我提交的，后文我会详细讲到这个提交的事情）

这么看，就只能靠自己了。第一步是搞清楚为什么有一小段音频被丢失了，解决这个问题，我们至少在 API18 以上是可以工作的。于是仔细研究了作者的逻辑，发现主要是两个部分，一部分是使用 MediaCodec 做编码，另一部分是将 MediaCodec 的输出作为 MediaMuxer 的输入，使用 "writeSampleData" 将编码后的数据写入 MediaMuxer，再由 MediaMuxer 生成 MP4。

那么就一步步检查问提把，首先看看 MediaCodec，根据官方的文档，了解到作者使用的是一个过时的方式，手动获取到 MediaCodec 的 input buffers，将原始音频一段一段的输入到指定的 buffer 上，然后 enqueue，这几段音频会被传送到编码器上进行编码，完事以后会放到 output buffers 上，需要手动的 query，看看是否有编码完成的 buffer 产生，有的话，就取出这几段 output buffer，并释放它。这个工作流程可以用下面的图来表示：

![]({{ site.baseurl }}/assets/img/post/encode-pcm-to-mp4/mediacodec-buffer.jpg)


另外，想要 MediaCodec 能够工作，我们需要处理好它的状态。它的状态，分为两个大的部分，一部分是 Stopped 状态，一部分是 Executing 状态。初始化时，处于 Stopped 的 Uninitialized 状态，需要经过配置（设置编码格式、编码率等信息）以后，进入 Configured 状态。start 之后就进入 Executing 的 Flushed 状态了。此后，如果通过 enqueue 输入了第一个音频数据，MediaCodec 会进入 Running 状态进行编码，以后不断的接收 enqueue 的 input buffer，并把编码输入放到 output buffer。直到收到 EOS (End of Stream) 信息后，进入 End of Stream 状态。 stop 后，回到 Uninitialized 的状态。状态变化如下图：

![]({{ site.baseurl }}/assets/img/post/encode-pcm-to-mp4/mediacodec-state.jpg)

前文说了。这是一种过时的方式，新的使用姿势，应该是用 async 方式，接收更新回调后做动作，而不是不断的 query。详情可以查看[MediaCodec 的官方文档](https://developer.android.com/reference/android/media/MediaCodec.html)。

从这个状态图我们看到，有一个 **End of Stream** 状态，需要接收到 EOS 信息，这里有些懵逼，PCMEncoder 作者的代码中也没有体现。但是继续查看文档以后，发现这么一句话：”When you reach the end of the input data, you must signal it to the codec by specifying the BUFFER_FLAG_END_OF_STREAM flag in the call to queueInputBuffer.“ 是啊，这应该就是问题的关键了。作者并没有发送 BUFFER_FLAG_END_OF_STREAM 的 flag，我设置了以后，发现工作正常了，最后那么丢失的音节回来了，棒！

回过头想想，作者应该是因为希望可以多次 encode，所以忘记发送这个 flag 了。我们可以在 stop 前，先发送这个flag，就可以解决这个问题了，于是 fork 了作者的项目，修改代码，给他提交了一个 pull request。作者在沉寂了两年以后，终于出现，合并了我的 PR，并对我表达了感谢。

## Encode with MediaCodec

这事儿并没完。从字面上理解，MediaCodec 是编码，MediaMuxer 应该是混音。看文档的话，大致也是这样的意思。那么，我们要做的不就是编码么？为啥还需要一个混音呢？而且关键的是 MediaMuxer 才是那个需要 API18 的类。MediaCodec 是只需要 API16 的，这和我们的项目很契合。于是，自然的，我就想是不是去掉 MediaMuxer 试试。

第一个朴素的想法，是将 MediaCodec 输出直接写入文件。它不是做编码的么？编码完了，写入文件不就行了？于是我就这么做了。然而发现输出的文件并不能播放。

回想起以前做相关事情的经验，我猜是否因为有些文件头之类的东西没设置导致无法播放？经过以关键词一番搜索，发现原因是 MediaCodec 编码出来的格式 audio/mp4a-latm 实际上是 [AAC](https://en.wikipedia.org/wiki/Advanced_Audio_Coding) 的格式，无法直接播放，需要一个容器来承载才可以播放，通常的方法是使用 ADTS 作为容器，为每一帧都增加一些说明字段就可以将 AAC 格式转换成可播放的 mp4 了。相关的 Stack Overflow 的回答，比较好的是[这篇](https://stackoverflow.com/a/18970406/1038900)，它通过下面的代码来为每一帧 ACC 添加帧信息，使其转换为 ADTS 的一帧：

``` java
/**
 *  Add ADTS header at the beginning of each and every AAC packet.
 *  This is needed as MediaCodec encoder generates a packet of raw
 *  AAC data.
 *
 *  Note the packetLen must count in the ADTS header itself.
 **/
private void addADTStoPacket(byte[] packet, int packetLen) {
    int profile = 2;  //AAC LC
                      //39=MediaCodecInfo.CodecProfileLevel.AACObjectELD;
    int freqIdx = 4;  //44.1KHz
    int chanCfg = 2;  //CPE

    // fill in ADTS data
    packet[0] = (byte)0xFF;
    packet[1] = (byte)0xF9;
    packet[2] = (byte)(((profile-1)<<6) + (freqIdx<<2) +(chanCfg>>2));
    packet[3] = (byte)(((chanCfg&3)<<6) + (packetLen>>11));
    packet[4] = (byte)((packetLen&0x7FF) >> 3);
    packet[5] = (byte)(((packetLen&7)<<5) + 0x1F);
    packet[6] = (byte)0xFC;
}
```

再将编码后的 ACC 数据填入该帧的剩余部分，之后写入文件，就能以 mp4 格式播放了。

其中，比较关键的是选择好配置信息。函数头部的三个变量 `profile`, `freqIdx`, `chanCfg` 就是分别用来配置 AAC Profile, 频率索引 和 声道的。

- profile 必须与 MediaCodec 的 `KEY_AAC_PROFILE` 配置相匹配，其值可以在 [`MediaCodecInfo.CodecProfileLevel`](https://developer.android.com/reference/android/media/MediaCodecInfo.CodecProfileLevel.html) 找到。
- freqIdx 采样频率索引，不是具体的频率值，而是有一个[频率值的列表](https://wiki.multimedia.cx/index.php/MPEG-4_Audio#Sampling_Frequencies)，这个 index 代表了指定频率在该列表的索引，该频率需要和输入源的频率匹配。
- chanCfg 声道数目，这个需要和输入源匹配。

这三个值的取值范围都可以在 [MPEG-4 Audio 的文档](https://wiki.multimedia.cx/index.php/MPEG-4_Audio)中找到。

最终，我将这些配置封装起来，与 MediaCodec 配合，实现了比较方便的，支持到 API16 的 MP4 编码方案。其代码只有一个类，关键代码如下（完整代码可以在我的 [Gist](https://gist.github.com/tankery/bcfe2143ccaf538ffb28e62ac7a75036) 上找到）：


``` java
/**
 * PCMEncoder
 *
 * Encode PCM stream into MP4 file stream.
 *
 * Created by tankery on 11/11/2017.
 */
public class PCMEncoder {

    /**
     * Creates encoder with given params for output file
     * @param bitrate Bitrate of the output file, higher bitrate brings better voice, but
     *                lager file. eg. 64k is enough for speech, its about 28MB/hour after encode.
     * @param sampleRate sampling rate of pcm.
     * @param channelCount channel count of pcm.
     */
    public PCMEncoder(final int bitrate, final int sampleRate, int channelCount) {
        this.bitrate = bitrate;
        this.sampleRate = sampleRate;
        this.channelCount = channelCount;
        for (int i = 0; i < SUPPORTED_SAMPLE_RATES.length; i++) {
            if (sampleRate == SUPPORTED_SAMPLE_RATES[i]) {
                freqIdx = i;
                break;
            }
        }
    }

    /**
     * Encodes input stream
     *
     * @throws IOException
     */
    public void encode(InputStream inputStream, OutputStream outputStream) throws IOException {
        prepare();

        boolean hasMoreData = true;
        while (hasMoreData) {
            hasMoreData = readInputs(inputStream);
            writeOutputs(outputStream);
        }

        inputStream.close();
        outputStream.close();

        stop();
    }

    private void prepare() {
        try {
            Timber.d("Preparing PCMEncoder");

            mediaFormat = MediaFormat.createAudioFormat(COMPRESSED_AUDIO_FILE_MIME_TYPE, sampleRate, channelCount);
            mediaFormat.setInteger(MediaFormat.KEY_AAC_PROFILE, COMPRESSED_AUDIO_PROFILE);
            mediaFormat.setInteger(MediaFormat.KEY_BIT_RATE, bitrate);

            mediaCodec = MediaCodec.createEncoderByType(COMPRESSED_AUDIO_FILE_MIME_TYPE);
            mediaCodec.configure(mediaFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            mediaCodec.start();

            codecInputBuffers = mediaCodec.getInputBuffers();
            codecOutputBuffers = mediaCodec.getOutputBuffers();

            bufferInfo = new MediaCodec.BufferInfo();

            totalBytesRead = 0;
            presentationTimeUs = 0;
            tempBuffer = new byte[2 * sampleRate];
        } catch (IOException e) {
            Timber.e(e, "Exception while initializing PCMEncoder");
        }
    }

    private void stop() {
        Timber.d("Stopping PCMEncoder");
        mediaCodec.stop();
        mediaCodec.release();
    }

    private boolean readInputs(InputStream inputStream) throws IOException {
        boolean hasMoreData = true;
        int inputBufferIndex = 0;
        int currentBatchRead = 0;
        while (inputBufferIndex != -1 && hasMoreData && currentBatchRead <= 50 * sampleRate) {
            inputBufferIndex = mediaCodec.dequeueInputBuffer(CODEC_TIMEOUT);

            if (inputBufferIndex >= 0) {
                ByteBuffer buffer = codecInputBuffers[inputBufferIndex];
                buffer.clear();

                int bytesRead = inputStream.read(tempBuffer, 0, buffer.limit());
                if (bytesRead == -1) {
                    mediaCodec.queueInputBuffer(inputBufferIndex, 0, 0, presentationTimeUs, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                    hasMoreData = false;
                } else {
                    totalBytesRead += bytesRead;
                    currentBatchRead += bytesRead;
                    buffer.put(tempBuffer, 0, bytesRead);
                    mediaCodec.queueInputBuffer(inputBufferIndex, 0, bytesRead, presentationTimeUs, 0);
                    presentationTimeUs = 1000000L * (totalBytesRead / 2) / sampleRate;
                }
            }
        }
        return hasMoreData;
    }

    @SuppressLint("WrongConstant")
    private void writeOutputs(OutputStream outputStream) throws IOException {
        int outputBufferIndex = 0;
        while (outputBufferIndex != MediaCodec.INFO_TRY_AGAIN_LATER) {
            outputBufferIndex = mediaCodec.dequeueOutputBuffer(bufferInfo, CODEC_TIMEOUT);
            if (outputBufferIndex >= 0) {
                if ((bufferInfo.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0 && bufferInfo.size != 0) {
                    mediaCodec.releaseOutputBuffer(outputBufferIndex, false);
                } else {
                    // Write ADTS header and AAC data to frame.
                    int outPacketSize = bufferInfo.size + 7;    // 7 is ADTS size
                    byte[] data = new byte[outPacketSize];  //space for ADTS header included
                    addADTStoPacket(data, outPacketSize);

                    ByteBuffer encodedData = codecOutputBuffers[outputBufferIndex];
                    encodedData.position(bufferInfo.offset);
                    encodedData.limit(bufferInfo.offset + bufferInfo.size);
                    encodedData.get(data, 7, bufferInfo.size);
                    encodedData.clear();
                    outputStream.write(data, 0, outPacketSize);  //open FileOutputStream beforehand

                    mediaCodec.releaseOutputBuffer(outputBufferIndex, false);
                }
            } else if (outputBufferIndex == MediaCodec.INFO_OUTPUT_BUFFERS_CHANGED) {
                codecOutputBuffers = mediaCodec.getOutputBuffers();
            } else if (outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                mediaFormat = mediaCodec.getOutputFormat();
            }
        }
    }

    /**
     *  Add ADTS header at the beginning of each and every AAC packet.
     *  This is needed as MediaCodec encoder generates a packet of raw
     *  AAC data.
     *
     *  Note the packetLen must count in the ADTS header itself.
     **/
    private void addADTStoPacket(byte[] packet, int packetLen) {
        int profile = COMPRESSED_AUDIO_PROFILE;
        int freqIdx = this.freqIdx;
        int chanCfg = channelCount;

        // fill in ADTS data
        packet[0] = (byte)0xFF;
        packet[1] = (byte)0xF9;
        packet[2] = (byte)(((profile-1)<<6) + (freqIdx<<2) +(chanCfg>>2));
        packet[3] = (byte)(((chanCfg&3)<<6) + (packetLen>>11));
        packet[4] = (byte)((packetLen&0x7FF) >> 3);
        packet[5] = (byte)(((packetLen&7)<<5) + 0x1F);
        packet[6] = (byte)0xFC;
    }
}
```

调用非常简单，初始化以后，直接 encode 就搞定了：


``` java
PCMEncoder encoder = new PCMEncoder(64000, 8000, 1);
try {
    encoder.encode(inputStream, outputStream);
} catch (IOException e) {
    e.printStackTrace();
}
```

大功告成。

通过一番刨根问底，我们得到了下面这些收获：

1. 熟悉了 AAC, MP4 等格式；
2. 了解了如何使用 MediaCodec, MediaMuxer；
3. 使我们的应用支持在 API16 上进行编码，且不依赖第三方库；
4. 为一个[开源项目](https://github.com/Semantive/pcm-encoder)贡献了代码（Pull Request）；
5. 输出了一份 [Gist](https://gist.github.com/tankery/bcfe2143ccaf538ffb28e62ac7a75036) 以帮助他人快速使用；
6. 输出了这篇文章，将来也许能帮助更多人走出谜团。

有了这些收获，我觉得我又降低了地球上的熵，让这个世界更美好了一些。✌️


