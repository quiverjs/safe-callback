
'use strict'

var should = require('should')
var error = require('quiver-error').error
var safeCallback = require('../lib/safe-callback').safeCallback
var safeFunction = require('../lib/safe-function').safeFunction

console.log('*** nested safe callback test ***')

var asyncLib = function(callback) {
  setImmediate(function() {
    callback(new Error('async library error'))
  })
}

var func1 = safeFunction(function(callback) {
  asyncLib(function(err) {
    if(err) return callback(error(500, 'async library error', err))

    callback()
  })
})

var func2 = safeFunction(function(callback) {
  setImmediate(function() {
    func1(function(err) {
      if(err) return callback(err)

      callback()
    })
  })
})

var func3 = safeFunction(function(callback) {
  func2(callback)
})

func3(function(err) {
  should.exist(err)

  console.log(err)
})
