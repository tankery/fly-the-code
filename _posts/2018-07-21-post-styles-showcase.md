---
layout: post
title: Showcases of Typograpy
description: "Cover most styles used in articale"
categories:
  - turtorial
  - en
tags:
  - Showcase
  - Styles
comments: true
mathjax: null
featured: true
published: true
---

During this turtorial, we will go though most of styles, to see how would they look like.

So let us begin.

<!-- more -->

# Heading 1

Following contents.

## Heading 2

Following contents.

### Heading 3

Following contents.

#### Heading 4

Following contents.

##### Heading 5

Following contents.

###### Heading 6

And There are no heading 7. Actually, heading 5 and 6 using a same style, And the font size is same as normal content, because most of time, we don't need such deep heading levels, 3 heading (from 2 to 4) will have best effect for a post.

Here is another paragraph.

> And a quote.<br>
> With Two lines

A bueatiful Horizontal Rule:

---

## Emphasis

Of cause, we have emphasis like **bold**, *Italic*, and ~~Strikethrough~~.

And some styles can be used by html, Like <sup>superscripts</sup>, Or <sub>subscripts</sub> inline.

## Lists

A normal ordered list:

1. list item 1.
2. list item 2.

And unorderd list:

- list item 1.
- list item 2.

Also support nested list:

1. list parent 1.
    - Sub list item.
    - Support multi level nesting.
        - Another level.
          1. Deep ordered list.
        - Sibling.
2. Still couting the ordered number.
3. And line breaks for list item:<br>
    Here is content align to this item.

    New paragraph is also avaliable.
4. Continue the list.

## Links and Images

Link can presented as [simple link](#) or [Link with title](# "Title of this link").

Images can rendered inline: ![alt text]({{site.baseurl}}/assets/img/favicon.ico)

And can use a block, image will be scaled down if needed:

![alt text]({{site.baseurl}}/assets/img/fly_the_code-196x196.png)

If you need the image be centered, use a class `center`:

<img class="center" src="{{site.baseurl}}/assets/img/fly_the_code-196x196.png">

You can make the image clickable with link:

[![alt text]({{site.baseurl}}/assets/img/post/why-we-need-indexes-for-database/loughborough-university-library.jpg)](# "Link of image")

## Code

We can use `inline code` in sentence. Also, a block of code also availiable:

``` javascript
$(document).ready(function(){
  // initialize sidenav plugin of Materialize
  $('.sidenav').sidenav();
});
```

Block code support lots of language syntax highlighting.

And I write a block of JS code to support copy and paste code to [WeChat Artical Editor](https://mp.weixin.qq.com/), try copy and paste following code block to WeChat editor to see the magic:

``` java
@Override
@NonNull
public String getMessage() {
    return "Hello " + "world!";
}
```

## Table

Support different align type for table, and emphasis inside table cell:

| This | Is | Header |
| -- |:--:| --:|
| we can align start | align center | or end |
| and use *emphasis* | **inside** | ~~table~~<sup>cool</sup> |

## Video and iframe

Videos and iframes will aligned to center with a class `center`.

<video controls="" class="center">
    <source src="https://www.w3schools.com/htmL/mov_bbb.mp4" type="video/mp4">
    <source src="https://www.w3schools.com/htmL/mov_bbb.ogg" type="video/ogg">
    Your browser does not support HTML5 video.
</video>

Video hosted on [w3school](https://www.w3schools.com/htmL/html5_video.asp).

And here is a iframe:

<iframe class="center" width="560" height="315" src="https://www.youtube.com/embed/mb-XCaA2HZs" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

## Thanks for using

OK, this is the end, if you are enjoy the styles, fork the repo to use, thanks.
