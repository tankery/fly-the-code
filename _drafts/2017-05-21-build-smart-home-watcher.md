---
layout: post
title: 搭建一个智能楼道门应答系统
description: "使用 Arduino 配合 Slack API 进行远程控制"
categories:
  - development
tags:
  - Arduino
  - Slack
  - ESP8266
  - 智能家庭
  - Smart Home
comments: true
mathjax: null
featured: true
published: true
---

家里的门锁换成了密码锁，进门不再需要钥匙，实在是太棒了。惯得我连楼道门的钥匙也不想带，于是萌生了搭建一个自动开楼道门系统的想法。

通过调查，发现某宝上有比较廉价的 Arduino Nano 兼容版卖，20+，再搭配一个 20+ 的 WiFi 模块，应该就可以实现局域网控制。服务端再通过 Slack 的消息接口，可以实现远程的操控，将来也可以扩展成可识别自然语言的智能家居系统。

<!-- more -->

楼道门可以通过按门铃通唤醒家里的应答机，从应答机有按钮可以开门。这都是常规的楼道应答系统。拆卸应答机、重新组合电路以后应该是可以自己控制这个流程的。


## ESP8266 AT 指令

[**设置为 AP Mode**](http://zhongbest.com/2016/09/07/esp8266-01/)
```
AT+RST
AT+CWMODE=3
AT+CWSAP="ESP8266","espisgood",1,3

AT+CWLIF (查看连接的设备)
AT+CIFSR (查看自己的 IP 地址)
```

[**设置为 WiFi 转串口透传模式**](http://zhongbest.com/2017/02/23/esp8266-01%E5%85%BC%E5%AE%B9arduino%E8%BF%9E%E6%8E%A5%E8%B4%9D%E5%A3%B3%E7%89%A9%E8%81%94%E7%BD%91%E6%8E%A7%E5%88%B6led%E7%81%AF/)
```
AT+RST
//设置WiFi应用模式为Station
AT+CWMODE=1
//连接到WiFi路由器，请将SSID替换为路由器名称，Password替换为路由器WiFi密码
AT+CWJAP="<SSID>","<Password>"
//连接单连模式
AT+CIPMUX=0
//设置为透传模式
AT+CIPMODE=1
//进入透传模式，并保存
AT+SAVETRANSLINK=1,"<host>",<port>,"TCP"
```

