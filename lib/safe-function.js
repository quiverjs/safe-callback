
'use strict'

var safeCallback = require('./safe-callback').safeCallback

var safeFunction = function(func) {
  if(func.length <= 0) throw new Error(
    'target wrapped function must accept at least one argument for callback argument')

  var argsLength = func.length

  var wrappedFunction = function() {
    arguments[argsLength-1] = safeCallback(arguments[argsLength-1], [__filename])
    func.apply(null, arguments)
  }

  return wrappedFunction
}

module.exports = {
  safeFunction: safeFunction
}