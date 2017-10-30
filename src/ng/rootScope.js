'use strict';

var uid = 0;  // 原项目中位于 src/Angular.js

function $RootScopeProvider() {

  var lastDirtyWatch = null;
  var applyAsyncId = null;

  // 这个 ChildScope 看起来就没那么直观了，主要是要支持独立作用域的原因
  function createChildScopeClass(parent) {
    function ChildScope() {
      this.$$watchers = this.$$nextSibling =
          this.$$childHead = this.$$childTail = null;
      this.$$listeners = {};
      this.$$listenerCount = {};
      this.$$watchersCount = 0;
      this.$id = ++uid;
      this.$$ChildScope = null;
    }
    ChildScope.prototype = parent;
    return ChildScope;
  }

  this.$get = ['$injector', '$exceptionHandler', '$parse', '$browser',
      function($injector, $exceptionHandler, $parse, $browser) {

    function destroyChildScope($event) {
        $event.currentScope.$$destroyed = true;
    }

    function cleanUpScope($scope) {

      if (msie === 9) {
        // There is a memory leak in IE9 if all child scopes are not disconnected
        // completely when a scope is destroyed. So this code will recurse up through
        // all this scopes children
        //
        // See issue https://github.com/angular/angular.js/issues/10706
        $scope.$$childHead && cleanUpScope($scope.$$childHead);
        $scope.$$nextSibling && cleanUpScope($scope.$$nextSibling);
      }

      // The code below works around IE9 and V8's memory leaks
      //
      // See:
      // - https://code.google.com/p/v8/issues/detail?id=2073#c26
      // - https://github.com/angular/angular.js/issues/6794#issuecomment-38648909
      // - https://github.com/angular/angular.js/issues/1313#issuecomment-10378451

      $scope.$parent = $scope.$$nextSibling = $scope.$$prevSibling = $scope.$$childHead =
          $scope.$$childTail = $scope.$root = $scope.$$watchers = null;
    }

    function Scope() {
      this.$id = ++uid;
      this.$$phase = this.$parent = this.$$watchers =
                     this.$$nextSibling = this.$$prevSibling =
                     this.$$childHead = this.$$childTail = null;
      this.$root = this;
      this.$$destroyed = false;
      this.$$listeners = {};
      this.$$listenerCount = {};
      this.$$watchersCount = 0;
      this.$$isolateBindings = null;
    }

    Scope.prototype = {
      constructor: Scope,
      $new: function(isolate, parent) {
        var child;

        parent = parent || this;

        if (isolate) {
          child = new Scope();
          child.$root = this.$root;
        } else {
          // Only create a child scope class if somebody asks for one,
          // but cache it to allow the VM to optimize lookups.
          if (!this.$$ChildScope) {
            this.$$ChildScope = createChildScopeClass(this);
          }
          child = new this.$$ChildScope();
        }
        child.$parent = parent;
        child.$$prevSibling = parent.$$childTail;
        if (parent.$$childHead) {
          parent.$$childTail.$$nextSibling = child;
          parent.$$childTail = child;
        } else {
          parent.$$childHead = parent.$$childTail = child;
        }

        // When the new scope is not isolated or we inherit from `this`, and
        // the parent scope is destroyed, the property `$$destroyed` is inherited
        // prototypically. In all other cases, this property needs to be set
        // when the parent scope is destroyed.
        // The listener needs to be added after the parent is set
        if (isolate || parent != this) child.$on('$destroy', destroyChildScope);

        return child;
      },
      $watch: function(watchExp, listener, objectEquality, prettyPrintExpression) {
        var get = $parse(watchExp);

        if (get.$$watchDelegate) {
          return get.$$watchDelegate(this, listener, objectEquality, get, watchExp);
        }
        var scope = this,
            array = scope.$$watchers,
            watcher = {
              fn: listener,
              last: initWatchVal,
              get: get,
              exp: prettyPrintExpression || watchExp,
              eq: !!objectEquality
            };

        lastDirtyWatch = null;

        if (!isFunction(listener)) {
          watcher.fn = noop;
        }

        if (!array) {
          array = scope.$$watchers = [];
        }
        // we use unshift since we use a while loop in $digest for speed.
        // the while loop reads in reverse order.
        array.unshift(watcher);
        incrementWatchersCount(this, 1);

        return function deregisterWatch() {
          if (arrayRemove(array, watcher) >= 0) {
            incrementWatchersCount(scope, -1);
          }
          lastDirtyWatch = null;
        };
      },
      $digest: function() {
        var watch, value, last, fn, get,
            watchers,
            length,
            dirty, ttl = TTL,
            next, current, target = this,
            watchLog = [],
            logIdx, logMsg, asyncTask;

        beginPhase('$digest');
        // Check for changes to browser url that happened in sync before the call to $digest
        $browser.$$checkUrlChange();

        if (this === $rootScope && applyAsyncId !== null) {
          // If this is the root scope, and $applyAsync has scheduled a deferred $apply(), then
          // cancel the scheduled $apply and flush the queue of expressions to be evaluated.
          $browser.defer.cancel(applyAsyncId);
          flushApplyAsync();
        }

        lastDirtyWatch = null;

        do { // "while dirty" loop
          dirty = false;
          current = target;

          while (asyncQueue.length) {
            try {
              asyncTask = asyncQueue.shift();
              asyncTask.scope.$eval(asyncTask.expression, asyncTask.locals);
            } catch (e) {
              $exceptionHandler(e);
            }
            lastDirtyWatch = null;
          }

          traverseScopesLoop:
          do { // "traverse the scopes" loop
            if ((watchers = current.$$watchers)) {
              // process our watches
              length = watchers.length;
              while (length--) {
                try {
                  watch = watchers[length];
                  // Most common watches are on primitives, in which case we can short
                  // circuit it with === operator, only when === fails do we use .equals
                  if (watch) {
                    get = watch.get;
                    if ((value = get(current)) !== (last = watch.last) &&
                        !(watch.eq
                            ? equals(value, last)
                            : (typeof value === 'number' && typeof last === 'number'
                               && isNaN(value) && isNaN(last)))) {
                      dirty = true;
                      lastDirtyWatch = watch;
                      watch.last = watch.eq ? copy(value, null) : value;
                      fn = watch.fn;
                      fn(value, ((last === initWatchVal) ? value : last), current);
                      if (ttl < 5) {
                        logIdx = 4 - ttl;
                        if (!watchLog[logIdx]) watchLog[logIdx] = [];
                        watchLog[logIdx].push({
                          msg: isFunction(watch.exp) ? 'fn: ' + (watch.exp.name || watch.exp.toString()) : watch.exp,
                          newVal: value,
                          oldVal: last
                        });
                      }
                    } else if (watch === lastDirtyWatch) {
                      // If the most recently dirty watcher is now clean, short circuit since the remaining watchers
                      // have already been tested.
                      dirty = false;
                      break traverseScopesLoop;
                    }
                  }
                } catch (e) {
                  $exceptionHandler(e);
                }
              }
            }

            // Insanity Warning: scope depth-first traversal
            // yes, this code is a bit crazy, but it works and we have tests to prove it!
            // this piece should be kept in sync with the traversal in $broadcast
            if (!(next = ((current.$$watchersCount && current.$$childHead) ||
                (current !== target && current.$$nextSibling)))) {
              while (current !== target && !(next = current.$$nextSibling)) {
                current = current.$parent;
              }
            }
          } while ((current = next));

          // `break traverseScopesLoop;` takes us to here

          if ((dirty || asyncQueue.length) && !(ttl--)) {
            clearPhase();
            throw $rootScopeMinErr('infdig',
                '{0} $digest() iterations reached. Aborting!\n' +
                'Watchers fired in the last 5 iterations: {1}',
                TTL, watchLog);
          }

        } while (dirty || asyncQueue.length);

        clearPhase();

        while (postDigestQueue.length) {
          try {
            postDigestQueue.shift()();
          } catch (e) {
            $exceptionHandler(e);
          }
        }
      },
      $destroy: function() {
        // We can't destroy a scope that has been already destroyed.
        if (this.$$destroyed) return;
        var parent = this.$parent;

        this.$broadcast('$destroy');
        this.$$destroyed = true;

        if (this === $rootScope) {
          //Remove handlers attached to window when $rootScope is removed
          $browser.$$applicationDestroyed();
        }

        incrementWatchersCount(this, -this.$$watchersCount);
        for (var eventName in this.$$listenerCount) {
          decrementListenerCount(this, this.$$listenerCount[eventName], eventName);
        }

        // sever all the references to parent scopes (after this cleanup, the current scope should
        // not be retained by any of our references and should be eligible for garbage collection)
        if (parent && parent.$$childHead == this) parent.$$childHead = this.$$nextSibling;
        if (parent && parent.$$childTail == this) parent.$$childTail = this.$$prevSibling;
        if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
        if (this.$$nextSibling) this.$$nextSibling.$$prevSibling = this.$$prevSibling;

        // Disable listeners, watchers and apply/digest methods
        this.$destroy = this.$digest = this.$apply = this.$evalAsync = this.$applyAsync = noop;
        this.$on = this.$watch = this.$watchGroup = function() { return noop; };
        this.$$listeners = {};

        // Disconnect the next sibling to prevent `cleanUpScope` destroying those too
        this.$$nextSibling = null;
        cleanUpScope(this);
      },
      $eval: function(expr, locals) {
        return $parse(expr)(this, locals);
      },
      $apply: function(expr) {
        try {
          beginPhase('$apply');
          try {
            return this.$eval(expr);
          } finally {
            clearPhase();
          }
        } catch (e) {
          $exceptionHandler(e);
        } finally {
          try {
            $rootScope.$digest();
          } catch (e) {
            $exceptionHandler(e);
            throw e;
          }
        }
      },
      $on: function(name, listener) {
        var namedListeners = this.$$listeners[name];
        if (!namedListeners) {
          this.$$listeners[name] = namedListeners = [];
        }
        namedListeners.push(listener);

        var current = this;
        do {
          if (!current.$$listenerCount[name]) {
            current.$$listenerCount[name] = 0;
          }
          current.$$listenerCount[name]++;
        } while ((current = current.$parent));

        var self = this;
        return function() {
          var indexOfListener = namedListeners.indexOf(listener);
          if (indexOfListener !== -1) {
            namedListeners[indexOfListener] = null;
            decrementListenerCount(self, 1, name);
          }
        };
      }
    };

    var $rootScope = new Scope();

    return $rootScope;
  }];
}
