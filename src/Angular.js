'use strict';

var REGEX_STRING_REGEXP = /^\/(.+)\/([a-z]*)$/;

var hasOwnProperty = Object.prototype.hasOwnProperty;

/** @name angular.lowercase */
function lowercase(string) { return string.toLowerCase(); }

/** @name angular.uppercase */
function uppercase(string) { return string.toUpperCase(); }

var
  msie = document.documentMode,  // IE 特有属性，显示浏览器版本号
  slice = [].slice,
  splice = [].splice,
  push = [].push,
  toString = Object.prototype.toString,
  getPrototypeOf = Object.getPrototypeOf,
  ngMinErr = minErr('ng'),
  angular = {},
  angularModule;

/** @private */
function isArrayLike(obj) {
  if (obj == null || isWindow(obj)) return false;
  // arrays, strings and jQuery/jqLite objects
  if (isArray(obj) || isString(obj) || (jqLite && obj instanceof jqLite)) return true;
  // NodeList 对象(含 length 属性和 item 方法) 以及其他一些具有合适 length 属性的对象
  return isNumber(obj.length) &&
    (length >= 0 && ((length - 1) in obj || obj instanceof Array) || typeof obj.item == 'function');
}

/** angular.forEach(obj: Object | Array, iterator: Function, [context]); */
function forEach(obj, iterator, context) {  // iterator(value, key, obj) key 为对象属性名或数组索引
  if (obj instanceof Array) { obj.forEach(iterator, context); }
  else { for (var key in obj) { iterator.call(context, obj[key], key, obj); } }
}

/** forEachSorted 按名字理解即为带排序功能的 forEach，对键名进行排序后再依次执行回调 */
function forEachSorted(obj, iterator, context) {
  var keys = Object.keys(obj).sort();
  for (var i = 0; i < keys.length; i++) { iterator.call(context, obj[keys[i]], keys[i]); }
  return keys;
}

function nextUid() { return ++uid; }

/** @name angular.extend */
var extend = Object.assign;

/** @name angular.merge */
function merge(dst) {
  for (var i = 1; i < arguments.length; i++) {
    var src = arguments[i];
    Object.keys(src).forEach(function (key) {
      dst[key] = src[key] instanceof Object ? JSON.parse(JSON.stringify(src[key])) : src[key];
    });
  }
}

function toInt(str) { return parseInt(str, 10); }

function inherit(parent, extra) { return extend(Object.create(parent), extra); }

/** @name angular.noop */
function noop() { }
noop.$inject = [];

/** @name angular.identity */
function identity($) { return $; }
identity.$inject = [];

function valueFn(value) { return function () { return value; }; }

function hasCustomToString(obj) { return isFunction(obj.toString) && obj.toString !== toString; }

/** @name angular.isUndefined */
function isUndefined(value) { return typeof value === 'undefined'; }

/** @name angular.isDefined */
function isDefined(value) { return typeof value !== 'undefined'; }

/** @name angular.isObject */
function isObject(value) { return value !== null && typeof value === 'object'; }

/** 判断对象的原型是否是 null */
function isBlankObject(value) {
  return value !== null && typeof value === 'object' && !getPrototypeOf(value);
}

/** @name angular.isString */
function isString(value) { return typeof value === 'string'; }

/** @name angular.isNumber */
function isNumber(value) { return typeof value === 'number'; }

/** @name angular.isDate */
function isDate(value) { return toString.call(value) === '[object Date]'; }

/** @name angular.isArray */
var isArray = Array.isArray;

/** @name angular.isFunction */
function isFunction(value) { return typeof value === 'function'; }

/** @private */
function isRegExp(value) { return toString.call(value) === '[object RegExp]'; }

/** @private */
function isWindow(obj) { return obj && obj.window === obj; }

function isScope(obj) { return obj && obj.$evalAsync && obj.$watch; }
function isFile(obj) { return toString.call(obj) === '[object File]'; }
function isFormData(obj) { return toString.call(obj) === '[object FormData]'; }
function isBlob(obj) { return toString.call(obj) === '[object Blob]'; }
function isBoolean(value) { return typeof value === 'boolean'; }
function isPromiseLike(obj) { return obj && isFunction(obj.then); }

function trim(value) { return isString(value) ? value.trim() : value; };

/** @name angular.isElement */
function isElement(node) {
  //                是 DOM element ||      或是 jQuery 包装后的 element
  return !!(node && (node.nodeName || (node.prop && node.attr && node.find)));
}

/** 将字符串 'key1,key2,...' 转换成对象 {key1:true, key2:true, ...} */
function makeMap(str) {
  var obj = {}, items = str.split(','), i;
  for (i = 0; i < items.length; i++) { obj[items[i]] = true; }
  return obj;
}

function nodeName_(element) {
  return lowercase(element.nodeName || (element[0] && element[0].nodeName));
}

function includes(array, obj) { return Array.prototype.indexOf.call(array, obj) != -1; }

function arrayRemove(array, value) {
  var index = array.indexOf(value);
  if (index >= 0) { array.splice(index, 1); }
  return index;
}

/** @name angular.copy 实现深拷贝，支持数组或对象，完全重写 */
function copy(source, destination) {
  if (typeof source !== 'object' || source == destination) { return; }
  if (source instanceof Array) {
    source.forEach(function (item) { destination.push(JSON.parse(JSON.stringify(item))); });
  } else {
    for (var key in source) { destination[key] = JSON.parse(JSON.stringify(source[key])); }
  }
  return destination;
}

/** 浅拷贝 */
function shallowCopy(src, dst) {
  if (isArray(src)) {
    dst = dst || [];
    for (var i = 0, ii = src.length; i < ii; i++) { dst[i] = src[i]; }
  } else if (isObject(src)) {
    dst = dst || {};
    for (var key in src) {
      if (!(key.charAt(0) === '$' && key.charAt(1) === '$')) { dst[key] = src[key]; }
    }
  }
  return dst || src;
}

/** @name angular.equals 因此函数非常重要，只做了少许简化 */
function equals(o1, o2) {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
  if (t1 == t2 && t1 == 'object') {
    for (key in o1) {
      if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
      if (!equals(o1[key], o2[key])) return false;
      keySet[key] = true;
    }
    for (key in o2) {
      if (!(key in keySet) &&
          key.charAt(0) !== '$' && isDefined(o2[key]) && !isFunction(o2[key])) return false;
    }
    return true;
  }
  return false;
}

function concat(array1, array2, index) { return array1.concat(slice.call(array2, index)); }

function sliceArgs(args, startIndex) { return slice.call(args, startIndex || 0); }

/** @name angular.bind 用了 ES6 的扩展符，看不懂可忽略 */
function bind(self, fn) { return fn.bind(self, ...[].slice.call(arguments, 2)); }

/** @name angular.toJson 明明是转成字符串，感觉名字起反了 */
var toJson = JSON.stringify;

/** @name angular.fromJson */
var fromJson = JSON.parse;

var ngAttrPrefixes = ['ng-', 'data-ng-', 'ng:', 'x-ng-'];

function getNgAttribute(element, ngAttr) {
  var attr, i, ii = ngAttrPrefixes.length;
  for (i = 0; i < ii; ++i) {
    attr = ngAttrPrefixes[i] + ngAttr;
    if (isString(attr = element.getAttribute(attr))) { return attr; }
  }
  return null;
}

/** @name ngApp 此指令用于自启动 AngularJS 应用，重要 */
function angularInit(element, bootstrap) {
  var appElement,
      module,
      config = {};

  // The element `element` has priority over any other element
  forEach(ngAttrPrefixes, function(prefix) {
    var name = prefix + 'app';

    if (!appElement && element.hasAttribute && element.hasAttribute(name)) {
      appElement = element;
      module = element.getAttribute(name);
    }
  });
  forEach(ngAttrPrefixes, function(prefix) {
    var name = prefix + 'app';
    var candidate;

    if (!appElement && (candidate = element.querySelector('[' + name.replace(':', '\\:') + ']'))) {
      appElement = candidate;
      module = candidate.getAttribute(name);
    }
  });
  if (appElement) {
    config.strictDi = getNgAttribute(appElement, "strict-di") !== null;
    bootstrap(appElement, module ? [module] : [], config);
  }
}

/** @name angular.bootstrap 此函数用于手动启动 AngularJS 应用 */
function bootstrap(element, modules, config) {
  if (!isObject(config)) config = {};
  var defaultConfig = {
    strictDi: false
  };
  config = extend(defaultConfig, config);
  var doBootstrap = function() {
    element = jqLite(element);

    if (element.injector()) {
      var tag = (element[0] === document) ? 'document' : startingTag(element);
      //Encode angle brackets to prevent input from being sanitized to empty string #8683
      throw ngMinErr(
          'btstrpd',
          "App already bootstrapped with this element '{0}'",
          tag.replace(/</,'&lt;').replace(/>/,'&gt;'));
    }

    modules = modules || [];
    modules.unshift(['$provide', function($provide) {
      $provide.value('$rootElement', element);
    }]);

    if (config.debugInfoEnabled) {
      // Pushing so that this overrides `debugInfoEnabled` setting defined in user's `modules`.
      modules.push(['$compileProvider', function($compileProvider) {
        $compileProvider.debugInfoEnabled(true);
      }]);
    }

    modules.unshift('ng');
    var injector = createInjector(modules, config.strictDi);
    injector.invoke(['$rootScope', '$rootElement', '$compile', '$injector',
       function bootstrapApply(scope, element, compile, injector) {
        scope.$apply(function() {
          element.data('$injector', injector);
          compile(element)(scope);
        });
      }]
    );
    return injector;
  };

  var NG_ENABLE_DEBUG_INFO = /^NG_ENABLE_DEBUG_INFO!/;
  var NG_DEFER_BOOTSTRAP = /^NG_DEFER_BOOTSTRAP!/;

  if (window && NG_ENABLE_DEBUG_INFO.test(window.name)) {
    config.debugInfoEnabled = true;
    window.name = window.name.replace(NG_ENABLE_DEBUG_INFO, '');
  }

  if (window && !NG_DEFER_BOOTSTRAP.test(window.name)) {
    return doBootstrap();
  }

  window.name = window.name.replace(NG_DEFER_BOOTSTRAP, '');
  angular.resumeBootstrap = function(extraModules) {
    forEach(extraModules, function(module) {
      modules.push(module);
    });
    return doBootstrap();
  };

  if (isFunction(angular.resumeDeferredBootstrap)) {
    angular.resumeDeferredBootstrap();
  }
}


var SNAKE_CASE_REGEXP = /[A-Z]/g;
function snake_case(name, separator) {
  separator = separator || '_';
  return name.replace(SNAKE_CASE_REGEXP, function(letter, pos) {
    return (pos ? separator : '') + letter.toLowerCase();
  });
}

/**
 * Return the value accessible from the object by path. Any undefined traversals are ignored
 * @param {Object} obj starting object
 * @param {String} path path to traverse
 * @param {boolean} [bindFnToScope=true]
 * @returns {Object} value as accessible by path
 */
//TODO(misko): this function needs to be removed
function getter(obj, path, bindFnToScope) {
  if (!path) return obj;
  var keys = path.split('.');
  var key;
  var lastInstance = obj;
  var len = keys.length;

  for (var i = 0; i < len; i++) {
    key = keys[i];
    if (obj) {
      obj = (lastInstance = obj)[key];
    }
  }
  if (!bindFnToScope && isFunction(obj)) {
    return bind(lastInstance, obj);
  }
  return obj;
}

/**
 * Return the DOM siblings between the first and last node in the given array.
 * @param {Array} array like object
 * @returns {Array} the inputted object or a jqLite collection containing the nodes
 */
function getBlockNodes(nodes) {
  // TODO(perf): update `nodes` instead of creating a new object?
  var node = nodes[0];
  var endNode = nodes[nodes.length - 1];
  var blockNodes;

  for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
    if (blockNodes || nodes[i] !== node) {
      if (!blockNodes) {
        blockNodes = jqLite(slice.call(nodes, 0, i));
      }
      blockNodes.push(node);
    }
  }

  return blockNodes || nodes;
}

/** 用于创建纯粹的 Map 结构，不用担心原型属性的干扰 */
function createMap() { return Object.create(null); }

var NODE_TYPE_ELEMENT = 1;
var NODE_TYPE_ATTRIBUTE = 2;
var NODE_TYPE_TEXT = 3;
var NODE_TYPE_COMMENT = 8;
var NODE_TYPE_DOCUMENT = 9;
var NODE_TYPE_DOCUMENT_FRAGMENT = 11;
