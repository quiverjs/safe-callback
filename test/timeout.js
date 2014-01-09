
'use strict'

var should = require('should')
var safeCallbackLib = require('../lib/safe-callback')

var safeCallback = safeCallbackLib.safeCallback
var safeFunction = safeCallbackLib.safeAsyncFunction
safeCallbackLib.setCallbackTimeout(2000)

var func1 = function(callback) {
  // pretend to forget callback
}

var func2 = function(func, callback) {
  func = safeFunction(func)
  func(callback)
}

var func3 = function(callback) {
  callback = safeCallback(callback)

  process.nextTick(function() {
    func2(func1, callback)
  })
}

func3(function(err) {
  console.log(err)
})