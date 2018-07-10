---
layout: post
title: 为什么我选择 DbFlow
description: "Android DB 操作辅助库这么多，为什么我选择 DbFlow"
categories:
  - development
tags:
  - DbFlow
  - Android
  - DB
  - Library
comments: true
mathjax: null
featured: true
published: true
---

我在不同的产品和技术调研中，尝试过多种 Android DB 操作的辅助库，比如非常有名的 GreenDAO、跨平台的 Realm、Google 开发的 Room、还有 Requery、ActiveAndroid 等。综合看来，还是 DbFlow 最为顺手。

<!-- more -->

## 为什么需要 DB 辅助库

首先我们来谈谈，为什么我们需要一个 DB 辅助库。会有一些同学认为，使用 Android 自带的 DBHelper 不是很好么？何必去花功夫学习一个新的库呢？

那我们先来看看，使用 DBHelper 的典型步骤有哪些（来自官方文档 [Saving Data in SQL Databases](https://developer.android.com/training/basics/data-storage/databases.html)）。

> 若已经明确自己需要一个辅助库，或者对 Android 原生的数据库操作非常了解，可以直接跳到下一节。

第一步，定义 Scheme 和 Contract。Android 中，我们使用一个 Contract 来定义各个数据库表的结构（Scheme），方便后续操作时引用，例如：

``` java
public final class FeedReaderContract {
    // To prevent someone from accidentally instantiating the contract class,
    // make the constructor private.
    private FeedReaderContract() {}

    /* Inner class that defines the table contents */
    public static class FeedEntry implements BaseColumns {
        public static final String TABLE_NAME = "entry";
        public static final String COLUMN_NAME_TITLE = "title";
        public static final String COLUMN_NAME_SUBTITLE = "subtitle";
    }
}
```

第二步，定义数据库表的创建/删除 SQL 语句。这里，你需要熟悉 SQL 语法，并记得不要弄错了括号、标点等等细节，这里可没有 IDE 去帮你检查语法错误。

``` java
private static final String SQL_CREATE_ENTRIES =
    "CREATE TABLE " + FeedEntry.TABLE_NAME + " (" +
    FeedEntry._ID + " INTEGER PRIMARY KEY," +
    FeedEntry.COLUMN_NAME_TITLE + " TEXT," +
    FeedEntry.COLUMN_NAME_SUBTITLE + " TEXT)";

private static final String SQL_DELETE_ENTRIES =
    "DROP TABLE IF EXISTS " + FeedEntry.TABLE_NAME;
```

第三步，定义 DbHelper 来创建数据库。记得处理数据库的升级。

``` java
public class FeedReaderDbHelper extends SQLiteOpenHelper {
    // If you change the database schema, you must increment the database version.
    public static final int DATABASE_VERSION = 1;
    public static final String DATABASE_NAME = "FeedReader.db";

    public FeedReaderDbHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(SQL_CREATE_ENTRIES);
    }
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // This database is only a cache for online data, so its upgrade policy is
        // to simply to discard the data and start over
        db.execSQL(SQL_DELETE_ENTRIES);
        onCreate(db);
    }
    public void onDowngrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        onUpgrade(db, oldVersion, newVersion);
    }
}
```

第四步，终于可以开始使用数据库了。

``` java
FeedReaderDbHelper mDbHelper = new FeedReaderDbHelper(getContext());
```

增。你需要使用`ContentValues`来设置需要插入的属性：

``` java
// Gets the data repository in write mode
SQLiteDatabase db = mDbHelper.getWritableDatabase();

// Create a new map of values, where column names are the keys
ContentValues values = new ContentValues();
values.put(FeedEntry.COLUMN_NAME_TITLE, title);
values.put(FeedEntry.COLUMN_NAME_SUBTITLE, subtitle);

// Insert the new row, returning the primary key value of the new row
long newRowId = db.insert(FeedEntry.TABLE_NAME, null, values);
```

删。需要熟悉 SQL 语法，才能正确的理解 `selection` 和 `selectionArgs` 的含义：

``` java
// Define 'where' part of query.
String selection = FeedEntry.COLUMN_NAME_TITLE + " LIKE ?";
// Specify arguments in placeholder order.
String[] selectionArgs = { "MyTitle" };
// Issue SQL statement.
db.delete(FeedEntry.TABLE_NAME, selection, selectionArgs);
```

改：

``` java
SQLiteDatabase db = mDbHelper.getWritableDatabase();

// New value for one column
ContentValues values = new ContentValues();
values.put(FeedEntry.COLUMN_NAME_TITLE, title);

// Which row to update, based on the title
String selection = FeedEntry.COLUMN_NAME_TITLE + " LIKE ?";
String[] selectionArgs = { "MyTitle" };

int count = db.update(
    FeedReaderDbHelper.FeedEntry.TABLE_NAME,
    values,
    selection,
    selectionArgs);
```

查。`projection`、`selection`、`selectionArgs`…… 数不清的新概念需要你去理解，好不容易弄清楚了这些，查询的结果还是个`Cursor`，如何从`Cursor`中读出内容？这是个更加麻烦的内容。而且，记得 `close` 你的 `Cursor`，一不小心就会有内存泄露发生：

``` java
SQLiteDatabase db = mDbHelper.getReadableDatabase();

// Define a projection that specifies which columns from the database
// you will actually use after this query.
String[] projection = {
    FeedEntry._ID,
    FeedEntry.COLUMN_NAME_TITLE,
    FeedEntry.COLUMN_NAME_SUBTITLE
    };

// Filter results WHERE "title" = 'My Title'
String selection = FeedEntry.COLUMN_NAME_TITLE + " = ?";
String[] selectionArgs = { "My Title" };

// How you want the results sorted in the resulting Cursor
String sortOrder =
    FeedEntry.COLUMN_NAME_SUBTITLE + " DESC";

Cursor cursor = db.query(
    FeedEntry.TABLE_NAME,                     // The table to query
    projection,                               // The columns to return
    selection,                                // The columns for the WHERE clause
    selectionArgs,                            // The values for the WHERE clause
    null,                                     // don't group the rows
    null,                                     // don't filter by row groups
    sortOrder                                 // The sort order
    );
```

最后，使用完 DbHelper，记得在合适的时候 `close`，以避免重复的 DB 连接。

``` java
mDbHelper.close();
```

经过这一些列复杂的操作，我想你已经忘记你当初要做什么了。很多坚持使用原生接口的老司机，一定会写出自己的辅助类，封装这些复杂的操作，但我们为什么要给每个产品都自己去写一个封装呢？为何不站在巨人的肩膀上，使用开源的第三方库来封装你的数据库操作，让生活变得更简单清晰一些呢？

退一步说，如果你是第一次接触 Android 数据库，一定会被原生的支持方式吓到的，太多概念需要了解，太多细节需要关心。而倘若使用的是第三方库。需要学习的内容可能不到原始方式的一半，而且还不易出错。

## 技术选型

明确了我们确实需要一个DB辅助库之后，我们就可以来挑一挑，哪个库才是物美价廉的好货。

首先我们需要先了解一个概念，ORM ([object relational mapper](https://en.wikipedia.org/wiki/Object-relational_mapping))，我们本文讨论的库，都基于这个概念来封装。ORM 是一种将 Java object 映射到数据库表的方式。每个数据库表，都有一个 scheme，定义了了字段名称和类型。而数据库表则根据这个 scheme 存储了大量的数据。每个数据在表中都是一行，而每个字段，则是一列。对于 Java Object 来说，一个 class 包含了多个 field，每个 field 都有类型和名称，这恰好对于了数据表的 scheme，而对于实例来说，一个 object 就相当于存储了数据表中一行的内容，而一个 List<object> 则可以代表整个数据表了。

基于此，人们发现可以直接通过修改 Java object，来映射到数据库的操作。不需要开发者了解数据库操作的细节。大大简化了数据库操作的过程。

那么，我们先对各个库做一个简单的介绍：

**ActiveAndroid**

这是我接触的第一个 ORM 辅助库，它虽然功能不多，性能一般，但确实带我走入了 ORM 的大门，所以这里也大概介绍一下，但并不推荐大家使用，因为截止到我写这篇文章是，它的最后一个 commit 定格在了2014年10月7号，看来作者已经不再维护了。

而且 ActiveAndroid 功能太过简单，只有常规的增删改查、表间的引用（foreign key）等。只支持操作一个数据库，数据库迁移只支持使用 sql 文件，而且使用反射的方式来实现。


