> 这段时间在对此项目进行大改，整改时间不会太久，敬请关注。 2017/10/29

# Mini AngularJS 1.4.x

* 原项目：为 Mgechev 的 [200行代码实现一个简易版的AngularJS](https://mgechev.github.io/light-angularjs/)
* 项目目标：实现一个 **高仿** + **简化版** 的 AngularJS，便于学习理解内核原理，代码预计在 1K 行左右

我在原项目的基础上改动的内容:
  * 将 API 改成跟 AngularJS 一样
  * 去掉原有注释，重新用中文注释(非翻译)
  * 扩充了大量 API —— 从 AngularJS 项目中又搬了一些 API 过来

> 特别说明: 本项目为学习 AngularJS 1.4 内核机理而创建，里面的实现在原代码上做了较大简化，切不可用于生产环境。

问：还有必要学这古董的 AngularJS 源码吗？  
答：这个简单啊，直接去看 Angular5 的源码不得吓死你，下面我还推荐看 jQuery 的设计原理呢，是不是更古董？
不瞎扯，想好好在这行混，该学的都得学，如果只想完成工作，这玩意学不学无所谓。前端档次不高，要学的内容却多得吐血。


## 快速操作指引 Quick Start

```bash
$ git clone https://github.com/ooboqoo/mini-angularjs.git
$ cd mini-angularjs
$ npm install
$ npm run build
$ npm start
```


## 项目文件结构

```text
mini-angularjs
  |- src
  |  |- ng
  |  |  |- directive
  |  |  |- filter
  |  |  |- rootScope.js  // 定义 Scope 相关内容
  |  |  |- filter.js     // 定义 过滤器 相关功能
  |  |  |- 
  |  |  |- 
  |  |  |- 
  |  |- jqLite.js    // 绑定 jQuery 或使用替代的 JQLite
  |  |- Angular.js
  |  \- 
  |- demo            // 演示项目代码，打包后输出的 miniangular.js 也放在这 
  |- scripts
  |  \- build.js
  \- package.json
```


## 实现的 API 清单

注：参数类型采用 TypeScript 的形式描述

### rootScope

各 API 详情见 https://code.angularjs.org/1.4.14/docs/api/ng/type/$rootScope.Scope

* `$new(isolate: boolean, parent: Scope)`
* `$watch(watchExpression, listener, [objectEquality])`

### jqLite

jQuery API:

* `$(selector: string)` 或 `$(element: Element)` - 只实现了选择器功能
* `$.ready(fn: Function)` - 照搬原代码

AngularJS 扩展 API:
* `$(element).scope()` - 

注：真实使用 AngularJS 时，如果没有配合 jQuery 使用，`$` 是无效的，得用 `angular.element` 来代替。

### 项目打包发布

这里为了简单起见，直接自己用 js 脚本实现了打包过程，其实非常简单就是把几个文件拼接成一个 .js 文件罢了。
当然，虽然 RequireJS GruntJS 比较古董了，但学还是要学的，只是这里就不麻烦他们了。


## 其他说明

### 资源

* AngularJS1.4.x 官方源码地址 https://github.com/angular/angular.js/tree/v1.4.x
* 200行代码实现自己的AngularJS https://mgechev.github.io/light-angularjs/
* 书籍推荐 《JavaScript忍者秘籍》 jQuery作者出的jQuery源码解读教材，名气没那么大，但实战性很强

### 学习顺序推荐

* 先看 "200行代码实现一个简易版的AngularJS" 的博文和源码
* 再看我这份简化版的源码
* 最后看 AngularJS 官方源码，注意看 1.4.x 分支的源码，后续版本先不看，真要看，那就直接看 Angular 第5版吧

### 查看页面加载过程

项目中几个关键的位置都已打好断点 `debugger;` 只要打开 Chrome 浏览器调试功能，并单步执行，就可以看到整个过程。

### 代码编辑器

推荐用 VS Code，玩 Angular 框架的，TypeScript 是逃不掉的，然后 VS Code 和 TypeScript 是一伙的...

WebStorm 里该有的高级功能基本都有，启动更快，更加专注于前端领域，反正我不用 WebStorm，更不会用 Sublime Text。


## 原项目 README

Source code for my slides "Lightweight AngularJS". You can find simple application written with the micro-framework implemented in the tutorial [here](https://mgechev.github.io/light-angularjs/).

Blog post on this topic could be found [here](http://blog.mgechev.com/2015/03/09/build-learn-your-own-light-lightweight-angularjs/).

![Do not use in production!](http://s15.postimg.org/51kgdu6ln/bart_simpson_generator.gif)