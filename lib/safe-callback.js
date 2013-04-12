
var asyncError = require('quiver-error').asyncError

var safeCallback = function(callback) {
  if(callback.safeCallback) return callback

  var asyncErr = asyncError()
  var callbackCalled = false
  var returnedToEventLoop = false

  var wrappedCallback = function(err) {
    if(callbackCalled) throw new Error('callback is called multiple times')
    
    callbackCalled = true
    if(err) err = asyncErr(err)

    var args = Array.prototype.slice.call(arguments)
    if(returnedToEventLoop) {
      callback.apply(null, args)
    } else {
      process.nextTick(function() {
        callback.apply(null, args)
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