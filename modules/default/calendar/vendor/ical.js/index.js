module.exports = require('./ical')

var node = require('./node-ical')

// Copy node functions across to exports
for (var i in node){
  module.exports[i] = node[i]
}  