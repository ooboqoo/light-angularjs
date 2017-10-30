/**
 * angular.element() 在此处定义，它在 jQuery 基础上扩展了部分内容(见 bindJQuery 函数)。
 * Anuglar 是依赖 jQuery 的, 但如果 angular.js 加载时没有找到 jQuery, 则会使用 Angular 自己实现的
 * 简化版 jQuery, 即这里的 JQLite。
 */

'use strict';

function JQLite(element) {
  if (element instanceof JQLite) { return element; }

  var argIsString;

  if (isString(element)) {
    element = trim(element);
    argIsString = true;
  }

  if (argIsString) {
    jqLiteAddNodes(this, jqLiteParseHTML(element));
  } else {
    jqLiteAddNodes(this, element);
  }
}

var JQLitePrototype = JQLite.prototype = {
  ready: function(fn) {
    var fired = false;

    function trigger() {
      if (fired) return;
      fired = true;
      fn();
    }

    if (document.readyState === 'complete') { // check if document is already loaded
      setTimeout(trigger);
    } else {
      this.on('DOMContentLoaded', trigger); // works for modern browsers and IE9
      JQLite(window).on('load', trigger);   // fallback to window.onload for others
    }
  },

  eq: function(index) {
      return (index >= 0) ? jqLite(this[index]) : jqLite(this[this.length + index]);
  },

};

var jqCache = JQLite.cache = {},
jqId = 1,
addEventListenerFn = function(element, type, fn) {
  element.addEventListener(type, fn, false);
},
removeEventListenerFn = function(element, type, fn) {
  element.removeEventListener(type, fn, false);
};

/*
* !!! This is an undocumented "private" function !!!
*/
JQLite._data = function(node) {
//jQuery always returns an object on cache miss
return this.cache[node[this.expando]] || {};
};

function jqNextId() { return ++jqId; }

var SINGLE_TAG_REGEXP = /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/;
var HTML_REGEXP = /<|&#?\w+;/;
var TAG_NAME_REGEXP = /<([\w:-]+)/;
var XHTML_TAG_REGEXP = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi;

function jqLiteBuildFragment(html, context) {
  var tmp, tag, wrap,
      fragment = context.createDocumentFragment(),
      nodes = [], i;

  if (jqLiteIsTextNode(html)) {
    // Convert non-html into a text node
    nodes.push(context.createTextNode(html));
  } else {
    // Convert html into DOM nodes
    tmp = tmp || fragment.appendChild(context.createElement("div"));
    tag = (TAG_NAME_REGEXP.exec(html) || ["", ""])[1].toLowerCase();
    wrap = wrapMap[tag] || wrapMap._default;
    tmp.innerHTML = wrap[1] + html.replace(XHTML_TAG_REGEXP, "<$1></$2>") + wrap[2];

    // Descend through wrappers to the right content
    i = wrap[0];
    while (i--) {
      tmp = tmp.lastChild;
    }

    nodes = concat(nodes, tmp.childNodes);

    tmp = fragment.firstChild;
    tmp.textContent = "";
  }

  // Remove wrapper from fragment
  fragment.textContent = "";
  fragment.innerHTML = ""; // Clear inner HTML
  forEach(nodes, function(node) {
    fragment.appendChild(node);
  });

  return fragment;
}

function jqLiteParseHTML(html, context) {
  context = context || document;
  var parsed;

  if ((parsed = SINGLE_TAG_REGEXP.exec(html))) {
    return [context.createElement(parsed[1])];
  }

  if ((parsed = jqLiteBuildFragment(html, context))) {
    return parsed.childNodes;
  }

  return [];
}

function jqLiteAddNodes(root, elements) {
  // THIS CODE IS VERY HOT. Don't make changes without benchmarking.

  if (elements) {

    // if a Node (the most common case)
    if (elements.nodeType) {
      root[root.length++] = elements;
    } else {
      var length = elements.length;

      // if an Array or NodeList and not a Window
      if (typeof length === 'number' && elements.window !== elements) {
        if (length) {
          for (var i = 0; i < length; i++) {
            root[root.length++] = elements[i];
          }
        }
      } else {
        root[root.length++] = elements;
      }
    }
  }
}

// 官方源码中，此函数位于 src/Angular.js
function bindJQuery() {
  if (jQuery && jQuery.fn.on) {
    jqLite = jQuery;
    Object.assign(jQuery.fn, {
      scope: JQLitePrototype.scope,
      isolateScope: JQLitePrototype.isolateScope,
      controller: JQLitePrototype.controller,
      injector: JQLitePrototype.injector,
      inheritedData: JQLitePrototype.inheritedData
    });
  } else {
    jqLite = JQLite;
    window.$ = window.jQuery = JQLite;    // 这句是私货，为了后续能使用 `$()` 的形式进行元素选择
  }

  angular.element = jqLite;
}

// 官方源码中，此语句位于 src/angular.bind.js
bindJQuery();
