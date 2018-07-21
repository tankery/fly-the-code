---
layout: post
title: Solve Jump Game Problem using State Machine
description: "An O(n) and constant space solution for Jump Game Problem with State Machine"
categories:
  - development
  - en
tags:
  - Jump Game Problem
  - Algorithm
  - State Machine
comments: true
mathjax: null
featured: true
published: true
---

This Week I solved an interesting algorithm problem, [Jump Game Problem](https://leetcode.com/problems/jump-game/description/), with State Machine.

<!-- more -->

The problem is here:

> Given an array of non-negative integers, you are initially positioned at the first index of the array.
>
> Each element in the array represents your maximum jump length at that position.
>
> Determine if you are able to reach the last index.
>
> For example:
> A = `[2,3,1,1,4]`, return `true`.
>
> A = `[3,2,1,0,4]`, return `false`.

I've seen some solutions also come with an **O(n)** and constant space performance, but the solution is not easy to understood, and hard to reuse to other problem, but **State Machine** is a really strong and flexible way to solve limited state (like true/false state) problem.

For this problem, we know that the target is find a way to jump to last index, so we can have a instinct that this problem can be solve by inverse iteration. So let's have a try in this way.

First, the last index can be skip, as it already the last index, so the state always **true** no mater what.

Then we come to the 2nd number, we need to jump to last index, that's next index for this case, so this number should be 1 or above to jump to next. So if this number is > 0, state keep to **true**, or = 0, state transit to **false**.

For 3rd number, if 2nd number state is **true**, we only need to jump to next index. But if 2nd number state is **false**, we need to jump across 2nd, so this number needs to be > 1 to jump direct to the end.

And we can take more round to iterate all numbers.

Here is a diagram shows the state transition when iterating:

![Jump Game State]({{site.baseurl}}/assets/img/post/jump-game-problem/jump-game-state.png)

In this diagram, we can find the simple pattern of state transition:

1. When current state is **true**, next state can be **true** if > 0, else transit to **false**.
2. When current state is **false**, next state transit to **true** only if the number is larger than count of continuous **false**s, else, state keep in **false**.

So we can write code now:

``` java
public boolean canJump(int[] nums) {
    boolean stateCanJump = true;
    int falseCount = 0;
    for (int i = 1; i < nums.length; i++) {
        int pos = nums.length - i - 1;
        int value = nums[pos];
        if (stateCanJump) {
            if (value == 0) {
                stateCanJump = false;
                falseCount = 1;
            }
        } else {
            if (value > falseCount) {
                stateCanJump = true;
                falseCount = 0;
            } else {
                falseCount++;
            }
        }
    }
    return stateCanJump;
}
```

And problem solved! Congratulations!
