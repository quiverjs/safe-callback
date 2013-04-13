
var asyncError = require('quiver-error').asyncError

var safeCallback = function(callback) {
  if(callback.safeCallback) return callback

  var asyncErr = asyncError()
  var callbackCalled = false
  var returnedToEventLoop = false

  var wrappedCallback = function(err) {
    if(callbackCalled) throw new Error('callback is called multiple times')
    
    callbackCalled = true

    var args = Array.prototype.slice.call(arguments)

    if(returnedToEventLoop) {
      if(err) err = args[0] = asyncErr(err)
      callback.apply(null, args)
      callback = null
    } else {
      process.nextTick(function() {
        if(err) err = args[0] = asyncErr(err.errorCode, err.errorMessage, err)
        callback.apply(null, args)
        callback = null
      })
    }
  }

  process.nextTick(function() {
    returnedToEventLoop = true
  })

  return wrappedCallback
}

module.exports = {
  safeCallback: safeCallback
}