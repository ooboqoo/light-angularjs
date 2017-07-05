/* 
 * Compile the DOM
 *  * Traverse the DOM tree
 *  * Finds registered directives, used as attributes
 *  * Invoke the logic associated with them
 *  * Manages the scope
 *
 * The following API is enough:
 *  * bootstrap() - bootstraps the application (similar to angular.bootstrap but always uses the root HTML element as root of the application).
 *  * compile(el, scope) - invokes the logic of all directives associated with given element (el) and calls itself recursively for each child element of el.
 *     We need to have a scope associated with the current element because that’s how the data-binding is achieved. Since each directive may create different scope, we need to pass the current scope in the recursive call.
 *  * callDirectives(el, scope) - invokes directive associated to given element
 */

var DOMCompiler = DOMCompiler || (function () {
  'use strict';
  return {
    bootstrap: function () {
      this.compile(document.children[0], Provider.get('$rootScope'));
    },
    compile: function (el, scope) {
      var dirs = this._getElDirectives(el);
      var dir;
      var scopeCreated;
      dirs.forEach(function (d) {
        dir = Provider.get(d.name + Provider.DIRECTIVES_SUFFIX);
        if (dir.scope && !scopeCreated) {  // 此处没有实现独立作用域功能，否则应该是判断 dir.scope === true && !scopeCreated
          scope = scope.$new();
          scopeCreated = true;
        }
        dir.link(el, scope, d.value);  // 父元素根据指令 link 生成 HTML 后，再调用 el.children 对子元素进行编译
      });
      Array.prototype.slice.call(el.children).forEach(function (c) {
        this.compile(c, scope);
      }, this);
    },
    _getElDirectives: function (el) {
      var attrs = el.attributes;
      var result = [];
      for (var i = 0; i < attrs.length; i += 1) {
        if (Provider.get(attrs[i].name + Provider.DIRECTIVES_SUFFIX)) {
          result.push({
            name: attrs[i].name,
            value: attrs[i].value
          });
        }
      }
      return result;
    }
  };
}());
