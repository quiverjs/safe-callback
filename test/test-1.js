
'use strict'

var should = require('should')
var error = require('quiver-error').error
var safeCallback = require('../lib/safe-callback').safeCallback

console.log('*** nested safe callback test ***')

var asyncLib = function(callback) {
  setImmediate(function() {
    callback(new Error('async library error'))
  })
}

var func1 = function(callback) {
  callback = safeCallback(callback)

  asyncLib(function(err) {
    if(err) return callback(error(500, 'async library error', err))

    callback()
  })
}

var func2 = function(callback) {
  callback = safeCallback(callback)

  setImmediate(function() {
    func1(function(err) {
      if(err) return callback(err)

      callback()
    })
  })
}

func2(function(err) {
  should.exist(err)

  console.log(err)
})