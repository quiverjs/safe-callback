
'use strict'

var should = require('should')
var safeCallbackLib = require('../lib/safe-callback')
var safeCallback = safeCallbackLib.safeCallback
safeCallbackLib.setCallbackTimeout(2000)

var func1 = function(callback) {
  // pretend to forget callback
}

var func2 = function(callback) {
  func1(safeCallback(callback))
}

var func3 = function(callback) {
  callback = safeCallback(callback)

  setImmediate(function() {
    func2(callback)
  })
}

func3(function(err) {
  console.log(err)
})