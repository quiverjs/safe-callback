
'use strict'

var error = require('quiver-error')
var callbackTimeout = -1
var reduceInterval = 10

var safeCallback = function(callback, ignoreFiles) {
  if(!ignoreFiles) ignoreFiles = []
  ignoreFiles.push(__filename)

  var callbackCalled = false
  var callbackCancelled = false
  var returnedToEventLoop = false

  var asyncErr = error.asyncError(ignoreFiles)

  var wrappedCallback = function(err) {
    if(callbackCancelled) return
    if(callbackCalled) throw new Error('callback is called multiple times')
    
    callbackCalled = true
    if(err) asyncErr(err)

    if(returnedToEventLoop) {
      callback.apply(null, arguments)
      callback = null
    } else {
      var args = Array.prototype.slice.call(arguments)
      setImmediate(function() {
        callback.apply(null, args)
        callback = null
      })
    }
  }

  setImmediate(function() {
    returnedToEventLoop = true
  })

  if(callbackTimeout > 0) {
    setTimeout(function() {
      if(callbackCalled) return

      wrappedCallback(error.error(500, 'async callback timeout'))
      callbackCancelled = true
    }, callbackTimeout)

    callbackTimeout -= reduceInterval
  }

  wrappedCallback.callbackCalled = function() {
    return callbackCalled
  }

  return wrappedCallback
}

var safeAsyncFunction = function(func) {
  if(func.length <= 0) throw new Error(
    'target wrapped function must accept at least one argument for callback argument')

  var argsLength = func.length

  var wrappedFunction = function() {
    arguments[argsLength-1] = safeCallback(arguments[argsLength-1], [__filename])
    func.apply(null, arguments)
  }

  return wrappedFunction
}

var setCallbackTimeout = function(newTimeout) {
  callbackTimeout = newTimeout
}

var getCallbackTimeout = function() {
  return callbackTimeout
}

var setReduceInterval = function(newInterval) {
  reduceInterval = newInterval
}

var getReduceInterval = function() {
  return reduceInterval
}

module.exports = {
  safeCallback: safeCallback,
  safeAsyncFunction: safeAsyncFunction,
  setCallbackTimeout: setCallbackTimeout,
  getCallbackTimeout: getCallbackTimeout,
  setReduceInterval: setReduceInterval,
  getReduceInterval: getReduceInterval
}