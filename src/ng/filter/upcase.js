Provider.filter('uppercase', function () {
  'use strict';
  return function (str) {
    return str.toUpperCase();
  };
});