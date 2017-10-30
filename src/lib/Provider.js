/* 
 * Provider will:
 *   * Register components (directives, services and controllers)
 *   * Resolves components’ dependencies
 *   * Initialize the components
 * 
 * Provider interface
 *   * get(name, locals) - returns given service
 *   * invoke(fn, locals) - initialize given service
 *   * directive(name, fn) - registers a directive
 *   * controller(name, fn) - reigisters a controller
 *   * service(name, fn) - registers a service
 *   * annotate(fn) - returns an array of the dependencies of given service
 * 
 * Provider 将实现 AngularJS 中的 `$provide` 和 `$injector` 的功能
 */

var Provider = Provider || (function () {
    'use strict';

    return {
        // 存放供应商实例
        _cache: { $rootScope: new Scope() },

        // 存放供应商工厂函数
        _providers: {},

        // 注册供应商的内部方法
        _register: function (name, service) {
            this._providers[name] = service;
        },

        // 根据 服务名称 和 本地依赖，返回相应的服务实例
        // 本地依赖 local dependencies, 指的是像 `$scope` and `$delegate` 针对特定组件 component 的变量.
        get: function (name, locals) {
            if (this._cache[name]) {
                return this._cache[name];
            }
            var provider = this._providers[name];
            if (!provider || typeof provider !== 'function') {
                return null;
            }
            return (this._cache[name] = this.invoke(provider, locals));
        },

        // 注册一个指令
        directive: function (name, factory) {
            this._register(name + Provider.DIRECTIVES_SUFFIX, factory);
        },

        // 注册一个控制器
        // 这里比较特别的地方是，工厂函数被包裹在函数内部，原因是，我们希望多次调用 controller，但同时并不希望返回值被缓存(也就是避免单例)
        // The method controller will get more obvious after we review the `get` method and the `ng-controller` directive.
        controller: function (name, factory) {
            this._register(name + Provider.CONTROLLERS_SUFFIX, function () {
                return factory;
            });
        },

        // 注册一个服务，须提供2个参数，服务名 和 构造函数
        service: function (name, factory) {
            this._register(name, factory);
        },

        // 用于解析构造函数的参数(也就是依赖)列表，返回格式：[depName1, depName2, ...]
        annotate: function (fn) {
            var res = fn.toString()
                .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '') // 
                .match(/\((.*?)\)/);
            if (res && res[1]) {
                return res[1].split(',').map(function (d) {
                    return d.trim();
                });
            }
            return [];
        },

        // 根据提供的服务构造函数以及本地依赖创建服务的实例
        invoke: function (fn, locals) {
            locals = locals || {};
            var deps = this.annotate(fn).map(function (s) {
                return locals[s] || this.get(s, locals);
            }, this);
            return fn.apply(null, deps);  // 注入依赖
        }
    };
}());

Provider.DIRECTIVES_SUFFIX = 'Directive';
Provider.CONTROLLERS_SUFFIX = 'Controller';
