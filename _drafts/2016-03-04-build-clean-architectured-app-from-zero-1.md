---
layout: post
title: 从零开始构建架构清晰的应用（上）
description: "如何从一个 Fast & Dirty 的应用开始，一步步改造，经过整理、抽象、应用架构，使其符合 Clean Architecture 的标准。"
headline: "如何使手表App兼容Ticwear和Android Wear，以及AW中国版"
categories: development
tags:
  - Clean Architecture
  - MVP
  - 应用架构
comments: true
mathjax: null
featured: true
published: true
---

这上下两篇文章，将从一个 Fast & Dirty 的应用开始，一步步改造，经过整理、抽象、使用架构，使其最终符合 Uncle Bob 描述的 [Clean Architecture][the-clean-architecture] 的标准。改造的过程，将以分支的形式记录下来，保存在我的[GitHub项目][clean-arch-demo]中。

这个架构，将使得应用的UI、数据、应用和业务逻辑得到合适的抽象，并使应用易于测试和扩展。

上半部分，着重介绍这个抽象过程的本身，描述我们为何，以及如何做这些抽象。而下半部分，将会着重介绍一些工具库，使我们的开发更便捷有效率。

<!-- more -->

## 需要完成的功能

所有的代码版本，都是完成同样的功能：在GitHub上搜索`Clean Architecture`，并将搜索结果显示到列表中。

我使用了 GitHub API v3 的 [Search repositories](https://developer.github.com/v3/search/#search-repositories) 接口来完成这个功能。给接口指定一个query字段，接收其返回的JSON数据，并解析出关键的名称信息，显示到屏幕。

## `v1-fast_N_dirty`

第一个版本，我故意的放弃任何可扩展性的程序结构，仅使用一个`Activity`，包含了所有代码，只求完成需求。关键代码如下（注意，省略了所有异常捕获、错误检测的代码，想要实际跑起来，请查看[完整代码](https://github.com/tankery/CleanArchitectureDemo/blob/v1-fast_N_dirty/app/src/main/java/me/tankery/demo/cleanarchitecture/MainActivity.java)）：

``` Java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    progressBar = (ProgressBar) findViewById(R.id.progress_bar);
    listView = (ListView) findViewById(R.id.list_view);

    listView.setVisibility(View.GONE);
    progressBar.setVisibility(View.VISIBLE);

    new AsyncTask<String, Object, List<String>>() {
        @Override
        protected List<String> doInBackground(String... params) {
            // Search in background
            return search(params[0]);
        }

        @Override
        protected void onPostExecute(List<String> repositories) {
            // Show repositories name in list-view.
            ArrayAdapter adapter = new ArrayAdapter<>(
                    MainActivity.this,
                    android.R.layout.simple_list_item_1,
                    android.R.id.text1,
                    repositories
            );
            listView.setAdapter(adapter);
            listView.setVisibility(View.VISIBLE);
            progressBar.setVisibility(View.GONE);
        }
    }.execute("cleanarchitecture");
}

private List<String> search(String urlStr) throws IOException {
    List<String> repositories = new ArrayList<>();

    /**
     * 1. Get search response string.
     */
    URL url = new URL("https://api.github.com/search/repositories?q=" + urlStr);
    HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
    InputStream in = new BufferedInputStream(urlConnection.getInputStream());

    BufferedReader streamReader = new BufferedReader(new InputStreamReader(in, "UTF-8"));
    StringBuilder responseStrBuilder = new StringBuilder();

    String inputStr;
    while ((inputStr = streamReader.readLine()) != null) {
        responseStrBuilder.append(inputStr);
    }

    /**
     * 2. convert to json.
     */
    JSONObject json = new JSONObject(responseStrBuilder.toString());

    JSONArray array = json.getJSONArray("items");

    /**
     * 3. collect the full_name of repositories.
     */
    for (int i = 0; i < array.length(); i++) {
        JSONObject item = array.getJSONObject(i);
        String name = item.getString("full_name");
        repositories.add(name);
    }

    return repositories;
}
```

[the-clean-architecture]: https://blog.8thlight.com/uncle-bob/2012/08/13/the-clean-architecture.html
[clean-arch-demo]: https://github.com/tankery/CleanArchitectureDemo


