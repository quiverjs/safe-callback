
'use strict'

var callstack = require('quiver-callstack').callstack
var asyncError = require('quiver-error').asyncError

var formatAsyncError = function(err) {
  var result = 'Async Error: '
  if(err.statusCode) result += '[' + err.statusCode + '] '
  if(err.message) result += err.message
  result += '\n'

  if(err.callstacks) {
    err.callstacks.forEach(function(stack, i) {
      result += '\n==== Sync Stack [' + i + '] ====\n'
      result += stack.sync.printTraces()
      result += '\n==== Async Stack [' + i + '] ====\n'
      result += stack.async.printTraces()
    })
  } else {
    result += err.stack
  }

  return result
}

var safeCallback = function(callback, ignoreFiles) {
  if(!ignoreFiles) ignoreFiles = []
  ignoreFiles.push(__filename)

  var syncCallstack = callstack(ignoreFiles)

  var callbackCalled = false
  var returnedToEventLoop = false

  var asyncErr = function(err) {
    var asyncCallstack = callstack(ignoreFiles)

    if(!err.callstacks) err.callstacks = []

    err.callstacks.unshift({
      sync: syncCallstack,
      async: asyncCallstack
    })

    if(!err.inspect) err.inspect = function() {
      return formatAsyncError(err)
    }

    return err
  }

  var wrappedCallback = function(err) {
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

  wrappedCallback.callbackCalled = function() {
    return callbackCalled
  }

  return wrappedCallback
}

module.exports = {
  safeCallback: safeCallback
}