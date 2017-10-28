/**
 * Responsibilities of the scope:
 *  * Watches expressions
 *  * Evaluates all watched expressions on each `$digest` loop, until stable
 *  * Invokes all the observers, which are associated with the watched expression
 * 
 * $watch(expr, fn) - watches the expression expr. Once we detect change in the expr value we invoke fn (the callback) with the new value
 * $destroy() - destroys the current scope
 * $eval(expr) - evaluates the expression expr in the context of the current scope
 * $new() - creates a new scope, which prototypically inherits from the target of the call
 * $digest() - runs the dirty checking loop
 */

function Scope(parent, id) {
  'use strict';
  this.$$watchers = [];
  this.$$children = [];
  this.$parent = parent;
  this.$id = id || 0;
}

Scope.counter = 0;  // 用于生成 scope 的 id

/**
 * 用于添加监听处理器，当表达式的值变化时，系统会调用该处理函数对新值进行处理
 * @param {string} exp - 监听的表达式
 * @param {Function} fn - 格式 function (newValue, oldValue) { ... }
 */
Scope.prototype.$watch = function (exp, fn) {
  'use strict';
  this.$$watchers.push({
    exp: exp,
    fn: fn,
    last: Utils.clone(this.$eval(exp))
  });
};

// In the complete implementation there're
// lexer, parser and interpreter.
// Note that this implementation is pretty evil!
// It uses two dangerouse features:
// - eval
// - with
/** 对表达式进行求值，如果求值过程有错误抛出，程序不会停止 */
Scope.prototype.$eval = function (exp) {
  // 'use strict'    // The reason the 'use strict' statement is omitted is because of `with`
  var val;
  if (typeof exp === 'function') {
    val = exp.call(this);
  } else {
    try {
      with (this) {
        val = eval(exp);
      }
    } catch (e) {
      val = undefined;
    }
  }
  return val;
};

// 如果指令的 scope 属性为 true，则在编译 compile 时会调用此方法在指令所在元素上生成新的 scope
Scope.prototype.$new = function () {
  'use strict';
  Scope.counter += 1;
  var obj = new Scope(this, Scope.counter);
  Object.setPrototypeOf(obj, this);  // 新生成的 scope 是继承 父 scope 的
  this.$$children.push(obj);
  return obj;
};

Scope.prototype.$destroy = function () {
  'use strict';
  var pc = this.$parent.$$children;
  pc.splice(pc.indexOf(this), 1);
};

// 运行时脏值检测及处理 - 运行时的核心方法
Scope.prototype.$digest = function () {
  'use strict';
  var dirty, watcher, old, current, i;
  do {
    dirty = false;
    for (i = 0; i < this.$$watchers.length; i += 1) {
      watcher = this.$$watchers[i];
      current = this.$eval(watcher.exp);
      if (!Utils.equals(watcher.last, current)) {
        old = watcher.last;
        watcher.last = Utils.clone(current);
        dirty = true;
        watcher.fn(current, old);    // 当 exp 有新值时，会调用 fn
      }
    }
  } while (dirty);
  // 父级元素的脏值检测处理循环结束后，才会开始处理子元素的脏值检测处理
  for (i = 0; i < this.$$children.length; i += 1) {
    this.$$children[i].$digest();
  }
};
