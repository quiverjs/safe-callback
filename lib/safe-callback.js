
'use strict'

var moment = require('moment')
var error = require('quiver-error')
var callbackTimeout = -1

var callbackStack = []
var timerId = null

var timeoutCallback = function(callback) {
  callback.__startTime = moment()
  callbackStack.push(callback)
}

var startCallbackTimer = function() {
  timerId = setInterval(function() {
    if(callbackStack.length == 0) return

    var endTime = moment()
    while(callbackStack.length != 0) {
      var callback = callbackStack.pop()

      if(endTime.diff(callback.__startTime) >= callbackTimeout) {
        setImmediate(callback)

      } else {
        callbackStack.push(callback)
        return
      }
    }

  }, callbackTimeout)
}

var setCallbackTimeout = function(newTimeout) {
  var oldTimeout = callbackTimeout
  callbackTimeout = newTimeout

  if(oldTimeout <= 0 && newTimeout > 0) {
    startCallbackTimer()
  } else if(oldTimeout > 0 && newTimeout <= 0 && timerId) {
    callbackStack = []
    clearInterval(timerId)
  }
}

var getCallbackTimeout = function() {
  return callbackTimeout
}

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
        callback.apply(undefined, args)
        callback = null
      })
    }
  }

  setImmediate(function() {
    returnedToEventLoop = true
  })

  if(callbackTimeout > 0) {
    timeoutCallback(function() {
      if(callbackCalled) return

      wrappedCallback(error.error(500, 'async callback timeout'))
      callbackCancelled = true
    }, callbackTimeout)
  }

  wrappedCallback.callbackCalled = function() {
    return callbackCalled
  }

  return wrappedCallback
}

var safeAsyncFunction = function(func, arity) {
  if(func.safeAsyncFunction) return func

  if(!arity) arity = func.length

  if(arity <= 0) throw new Error(
    'target wrapped function must accept at least one argument for callback argument')

  var callbackIndex = arity-1

  var wrappedFunction = function() {
    arguments[callbackIndex] = safeCallback(arguments[callbackIndex])
    func.apply(null, arguments)
  }

  wrappedFunction.safeAsyncFunction = true

  return wrappedFunction
}

module.exports = {
  safeCallback: safeCallback,
  safeAsyncFunction: safeAsyncFunction,
  setCallbackTimeout: setCallbackTimeout,
  getCallbackTimeout: getCallbackTimeout,
}