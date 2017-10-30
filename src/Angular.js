var
msie,             // holds major version number for IE, or NaN if UA is not IE.
jqLite,           // delay binding since jQuery could be loaded after us.
jQuery,           // delay binding
slice             = [].slice,
splice            = [].splice,
push              = [].push,
toString          = Object.prototype.toString,
getPrototypeOf    = Object.getPrototypeOf,
ngMinErr          = minErr('ng'),

/** @name angular */
angular           = window.angular || (window.angular = {}),
angularModule,

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
