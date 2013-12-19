
var error = require('quiver-error').error
var safeCallback = require('../lib/safe-callback').safeCallback
var should = require('should')

describe('safe callback test', function() {
  it('original callback is called immediately', function() {
    var state = 'original'
    var callingFunctionExited = false

    var callback = function() {
      callingFunctionExited.should.equal(false)
      state = 'changed'
    }
    callback()
    state.should.equal('changed')
    callingFunctionExited = true
  })

  it('sync callback should be called asynchronously', function(done) {
    var state = 'original'
    var callingFunctionExited = false

    var syncFunction = function(callback) {
      callback()
    }

    var callback = safeCallback(function() {
      callingFunctionExited.should.equal(true)
      state = 'changed'
      done()
    })

    syncFunction(callback)
    state.should.equal('original')

    ;(function() {
      callback()
    }).should.throw()

    callingFunctionExited = true
  })

  it('async callback should be called synchronously', function(done) {
    var state = 'original'

    var asyncFunction = function(callback) {
      setImmediate(function() {
        state.should.equal('original')
        callback()
        state.should.equal('changed by callback')
        done()
      })
    }

    var callback = safeCallback(function() {
      state.should.equal('original')
      state = 'changed by callback'
    })

    asyncFunction(callback)
  })

  it('async callback should contain both sync and async errors', function(done) {
    console.log('\n** async callback error test **\n')

    var asyncFunction = function(callback) {
      callback = safeCallback(callback)
      process.nextTick(function() {
        callback(error(500, 'test error'))
      })
    }

    asyncFunction(function(err) {
      console.log(err)
      done()
    })
  })

  it('sync callback should contain both sync and async errors', function(done) {
    console.log('\n** sync callback error test **\n')

    var syncFunction = function(callback) {
      callback = safeCallback(callback)
      callback(error(500, 'test error'))
    }

    syncFunction(function(err) {
      console.log(err)
      done()
    })
  })
})