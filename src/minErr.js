/** 创建一个增强版的 Error, 用法：throw minErr('模块名')('名称', '描述信息'); */
function minErr(module, ErrorConstructor) {
  ErrorConstructor = ErrorConstructor || Error;
  return function(code, desc) {
    var message = '[' + (module ? module + ':' : '') + code + '] ' + desc + '\n'
                  'http://errors.angularjs.org/1.4.14/' + (module ? module + '/' : '') + code;
    return new ErrorConstructor(message);
  };
}
