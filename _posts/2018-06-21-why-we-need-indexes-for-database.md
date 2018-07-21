---
layout: post
title: 说人话，为什么要给数据库加索引？
description: "你真的理解数据库索引吗？"
categories:
  - development
tags:
  - Database
  - Performance
  - Indexing
image:
  feature: why-we-need-indexes-for-database/loughborough-university-library.jpg
  alt: "Loughborough University Library"
  credit: Rich Grundy
  creditlink: https://www.flickr.com/photos/loughboroughuniversitylibrary/6333984637
comments: true
mathjax: null
featured: true
published: true
---

> 这篇文章不是数据库索引的使用文档，不会给每个功能的使用都做介绍，而是通过我自己的案例，对案例中遇到的几个点做详细的说明。如果想查看具体的使用帮助，可以参考官网的文档：[Query Planning](https://sqlite.org/queryplanner.html)

“老谭，测试发现睡眠历史记录页面的打开速度太慢了，你给快速解决一下呗，明天发版。”

嗯，所以我还可以换一个标题：“如何在1天之内将页面加载性能提升10倍以上”。。行了不废话，给大家讲讲这个故事。

<!-- more -->

## 太长不看版

1. 数据库存储顺序随机，如果没有索引，每次查询都需要一行行遍历，查找出符合条件的点，复杂度 O(N)
2. 数据库会按照 rowid 排序，并给主键建立索引，所以如果以 rowid 或者主键为搜索条件，复杂度可以近似看做二分查找的复杂度，即 O(logN)
3. 如果没有主键，或搜索条件不是主键，可以给搜索目标增加索引，将该字段的搜索复杂度，提升到 O(logN)
4. 如果搜索条件有多个，可以建立组合索引 (multi-column index)，将搜索复杂度，降低到 O(k * logN)
5. 注意，如果搜索条件中带有范围的搜索，可能导致索引失效，退化到 O(N) 复杂度，可以通过合理排列联合索引的字段顺序来避免。

好了，如果这个精简版看得不过瘾，那就请继续阅读，我会用一个案例，也就是本次性能优化的故事，来解释上面的几点。

## 问题背景

首先，我们需要先来了解一下我们睡眠应用的数据设计，让大家对问题域有个基本的了解。

睡眠采用了类似 [Google Fit API](https://developers.google.com/fit/overview) 的设计，将睡眠分为 `DataSession` 和 `DataPoint` 两部分。session 主要用于记录一次睡眠的开始和结束时间，而 point 则是所有数据的存储结构。睡眠深度、心率等数据，都是以 point 的形式存储在一张大表中。如果需要展现一次睡眠的记录，需要首先查找出 session，之后根据 session 的起止时间，找出这个区间的所有 point。

下面我们简化一下这个问题，假设 DataPoint 有下面的结构：

``` java
class DataPoint {
    int type;
    long time;
    String values;
    String account;
}
```

它确定了数据的类型、数据发送的时间，数据的值，以及所属账号。

每个 point 都是独立的，可能被任何 session 包含，所以也有着独立的数据同步逻辑。如需加载一段睡眠，那么需要将这段睡眠时间内所有的 point 都加载出来。在用户打开历史记录页面时，这个加载过程大致分为这么几步：

1. 从数据库查找当前页面时间范围内的 point，更新到UI。
2. 向服务器请求这段时间的数据，用于更新本地的数据。
3. 从服务器拉下一串 point 后，更新数据库。如果 point 不存在，则插入该点，如果已经存在，则跳过。
4. 再次更新UI。

睡眠历史每次展现一个月，加上预加载的一个月，需要一次加载两个月的数据。假设每天有一段8小时的睡眠，每10分钟有一个睡眠深度数据，那么就需要一次加载近3000个数据点。

感官上认为，这个速度肯定会很慢，但是具体慢在哪里，心里还没底。于是利用 Android Studio 的 [Android Profiler](https://developer.android.com/studio/profile/android-profiler) 工具，对加载过程做了分析。最终发现占用绝大部分时间的，就是数据库的查询操作。

这是因为，在从服务器拉下更新的 points 后，需要更新数据库。由于需要避免重复数据的插入，所以在每个点的插入前，都需要查找是否有重复的点。如果与数据库现有点重复，则需跳过。这就需要大量的查询的操作，如果说数据库有 M 个点，从服务器拉下 N 个点，最坏情况，使用遍历查询的话，需要做 M x N 次比对，复杂度是 O(MN)。

那么数据库查询的复杂度到底是多少呢？

## 数据库查询原理

首先我们需要知道，虽然数据库利用 SQL 语句来构建查询条件，查询的过程是个黑盒，但它也不是什么魔法，我们可以通过理性分析来估计其复杂度。

假设我们有如下的数据表（有一个默认的自增长的 rowid）：

| rowid | type | time | values | account |
| -- | -- | -- | -- | -- |
| 1 | 1 | 10 | "" | "tankery" |
| 2 | 2 | 10 | "" | "tankery" |
| 3 | 1 | 50 | "" | "lilya" |
| 4 | 1 | 20 | "" | "tankery" |
| 5 | 2 | 20 | "" | "lilya" |

可以看到，由于点的插入顺序是随机的，数据点是乱序排列的。那如果我们需要知道一个新的点是否与现有点重复，需要怎么做呢？由于存储结构是乱序的，我们只能一个个遍历。比如我们想知道 {type: 1, time: 20, account: "tankery"} 的点是否与现有数据重复，我们可以构建下面的查询：

``` sql
SELECT count(*) FROM `data_point`
  WHERE `type` = 1
  AND `time` = 20
  AND `account` = "tankery";
```

这样的一个查询，需要给每一行数据都做比较，确定 type, time, account 是否符合条件。其复杂度是 O(N)。这个性能有多差呢？看看下面这个图来直观的感受下：

![Comparison of Binary Search: O(log n) to Full Scan: O(n)]({{ site.baseurl }}/assets/img/post/why-we-need-indexes-for-database/performance-of-bin-search-and-scan.png)
> 来源：[Jason Feinstein 的博客](https://medium.com/@JasonWyatt/squeezing-performance-from-sqlite-indexes-indexes-c4e175f3c346)

也就是说，随着数据量的增大，对排序过的数据做二分查找，其时间增长相对 O(N) 来说，几乎可以忽略不计了。

那么如何确定数据库的查询，采用的是什么方法？复杂度是什么？下面祭出神器，`EXPLAIN QUERY PLAN`。在查询语句前加上这句话，让数据库给你解释清楚它的查询计划。让你清清楚楚建索引，明明白白做查询。那么我们就用这个神器来看看，没加索引的数据库，采用的是什么方案（我这里使用的是 SQLite 数据库，我猜其他数据库应该也会有类似功能）：

``` sql
EXPLAIN QUERY PLAN
SELECT count(*) FROM `data_point`
  WHERE `type` = 1
  AND `time` = 20
  AND `account` = "tankery";
```

查询的结果是：

| selectid | order | from | detail |
| -- | -- | -- | -- |
| 0 | 0 | 0 | SCAN TABLE data_point |

可以看到，没有增加索引的数据库，确实是只能使用遍历 (SCAN) 的方式来一行一行比对了。那么，是时候谈谈索引了。

## 数据库索引

索引，就是给某个字段建立了一个排序表，就像是图书馆按照图书的编号进行排序，查找某个编号的图书时，只需要使用类似二分查找的方式，就可以迅速找到对应的图书了。

数据库会分配一个额外的空间，用来存储索引表，每次对数据库的修改（插入、修改、删除），也都会对应的修改索引表，所以增加索引以后，会一定程度的增加数据库大小，和数据库修改的时间。因此，如果你的数据库是修改多，查询少，那么就需要三思一下，增加索引是否有必要了。

对于上面的数据表，我们可以用下面的语句对 type 建索引：

``` sql
CREATE INDEX IF NOT EXISTS "point_type" ON `data_point`(type);
```

这行SQL语句为 data_point 数据表的 type 字段建立了一个名为 point_type 的索引。建立以后，索引表将会以类似下面这样的形式组织：

| type | rowid |
| -- | -- |
| 1 | 1 |
| 1 | 3 |
| 1 | 4 |
| 2 | 2 |
| 2 | 5 |

可以看到，索引表按照 type 进行了排序，这样，当我们应用查询语句时，数据库能够非常迅速的在索引表中找到符合条件的 type，并通过对应的 rowid，找到原数据表中所有值。使用 `EXPLAIN QUERY PLAN` 来验证一下我们的想法：

| selectid | order | from | detail |
| -- | -- | -- | -- |
| 0 | 0 | 0 | SEARCH TABLE data_point USING INDEX point_type (type=?) |

数据库诚不欺我，真的使用了 INDEX 来 SEARCH，而不是 SCAN 了。但是，聪明的你是否发现，这个索引对于我们的查询并没有什么用，迅速查到 type = 1 的数据，然后呢？除 type 之外的内容没有排序，还是有一大半的数据需要一个个查询。

这时我们会想，既然索引能加快目标字段的查询速度，那既然我们的查询需要依赖多个字段，那给每个字段都给建立个索引不就行了？不错，来试试：

``` sql
CREATE INDEX IF NOT EXISTS "point_type" ON `data_point`(type);
CREATE INDEX IF NOT EXISTS "point_time" ON `data_point`(time);
CREATE INDEX IF NOT EXISTS "point_account" ON `data_point`(account);
```

然后再次使用 `EXPLAIN QUERY PLAN` 来验证我们的想法：

| selectid | order | from | detail |
| -- | -- | -- | -- |
| 0 | 0 | 0 | SEARCH TABLE data_point USING INDEX point_type (type=?) |

疯了疯了，已经为每个字段都加上了索引，这个数据库怎么不听话，还是只用 type？？“这届数据库不行”。

但冷静下来想想，为每个字段单独建立索引，就会建立三个依照不同字段进行排序的独立的索引表，当我们使用 type 来索引，这些行对应到其他两个表，就是乱序的，无法二分查找。

这时我们会想，不是还有个组合索引么，可以用它么？

## 组合索引 (multi-column index)

我们先丢掉之前创建的那些没用的东西：

``` sql
DROP INDEX IF EXISTS `point_type`;
DROP INDEX IF EXISTS `point_time`;
DROP INDEX IF EXISTS `point_account`;
```

然后可以用下面的语句来创建一个组合索引：

``` sql
CREATE INDEX IF NOT EXISTS "point_query" ON `data_point`(type, time, account);
```

这是什么意思呢？其实，组合索引，会将指定的字段，都放入同一张索引表，并且会按照创建时的顺序，对各个字段依次进行排序。也就是说，对于上面的索引，数据库会先按照 type 排序，再按照 time，然后是 account。这张索引表建立起来，是类似下面这个样子的：

| type | time | account | rowid |
| -- | -- | -- | -- |
| 1 | 10 | "tankery" | 1 |
| 1 | 20 | "tankery" | 4 |
| 1 | 50 | "lilya" | 3 |
| 2 | 10 | "tankery" | 2 |
| 2 | 20 | "lilya" | 5 |

可以看到，首先是按照 type 排序，如果 type 相等，就按照 time 排序，如果 time 也相等，才会按照 account 排序。看起来不错，我们再用 `EXPLAIN QUERY PLAN` 验证一下：

| selectid | order | from | detail |
| -- | -- | -- | -- |
| 0 | 0 | 0 | SEARCH TABLE data_point USING COVERING INDEX point_query (type=? AND time=? AND account=?) |

非常棒！将三个查询条件全都囊括了，而且，原来的 "USING INDEX" 变成了 "USING COVERING INDEX"，什么意思呢？好事坏事？

其实 COVERING INDEX 指的是，索引表已经包含了所有查询所需的信息，无需再通过 rowid 到原始数据表中去查找原始数据行了。上面这个例子，由于索引表已经包含了所有查询条件，而且我们仅需要 count，不需要具体信息，因此仅仅查询索引表就已经可以获取到我们所需的查询结果。这使得查询速度又提升了一倍（不需要通过rowid进行二次查找）。

看起来非常完美了，打完收工？

## 范围查询 (RANGE SCAN)

范围查询实际上是个比较复杂的用法了，大部分讲数据库索引的文章都不会做介绍，但没办法，很多时候我们就是需要做范围查询。比如回到我们的问题域。有一个需求是需要加载一个月中所有的数据点，也就是数据点的 time 字段在某个时间范围内的所有数据点，这时，还能不能优雅的使用索引来查询呢？

如果我们仍然使用前文的组合索引，那么还是使用 `EXPLAIN QUERY PLAN` 来查看数据库的查询策略：

``` sql
EXPLAIN QUERY PLAN
SELECT * FROM `data_point`
  WHERE `type` = 1
  AND `time` >= 20
  AND `time` < 100
  AND `account` = "tankery";
```

结果如下：

| selectid | order | from | detail |
| -- | -- | -- | -- |
| 0 | 0 | 0 | SEARCH TABLE data_point USING INDEX point_query (type=? AND time>? AND time<?) |

为何 account 的索引没有用上？

回到组合索引的实现，我们发现，当我们的查询中包含了一个范围查询以后，由于 time 的值是在一个范围内，而不是特定的值时，account 字段就是乱序的了，因为 account 只有在 time 一致时，才会排序。也就是说，如果需要用上某个字段的索引，那么就必须确保这个字段的前序字段，都是确定的值。

这就引出了建立索引时一个非常重要的原则：“相等查询的字段，尽量放在组合索引的前面”。

对于我们的业务需求，你会发现，我们还是有机会用上所有字段的索引，因为 account 字段，实际上也是相等查询。我们按照这个原则，重新创建索引：

``` sql
DROP INDEX IF EXISTS `point_query`;
CREATE INDEX IF NOT EXISTS "point_query" ON `data_point`(type, account, time);
```

这个索引建立以后，索引表大概是这个样子：

| type | account | time | rowid |
| -- | -- | -- | -- |
| 1 | "lilya" | 50 | 3 |
| 1 | "tankery" | 10 | 1 |
| 1 | "tankery" | 20 | 4 |
| 2 | "lilya" | 20 | 5 |
| 2 | "tankery" | 10 | 2 |

也就是按照 type -> account -> time 的顺序进行排序了。我们分析一下查询策略，结果如下：

| selectid | order | from | detail |
| -- | -- | -- | -- |
| 0 | 0 | 0 | SEARCH TABLE data_point USING INDEX point_query (type=? AND account=? AND time>? AND time<?)

终于，我们再次用上了所有的索引字段。

实测发现，所有的数据库操作，时间都降到了1s以下，对于一个异步加载，我已经心满意足了。

## 参考资料

如果你觉得我的故事不好听，或者想了解更多，可以看看下面几篇为你精选的文章，祝好。

- Jason Feinstein: [Squeezing Performance from SQLite: Indexes? Indexes!](https://medium.com/@JasonWyatt/squeezing-performance-from-sqlite-indexes-indexes-c4e175f3c346)
- SQLite Org: [Query Planning](https://sqlite.org/queryplanner.html)
- Range Query: [Using the Index, Luke](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/greater-less-between-tuning-sql-access-filter-predicates)
