var ical = require('./ical')
  , request = require('request')
  , fs = require('fs')

exports.fromURL = function(url, opts, cb){
  if (!cb)
    return;
  request(url, opts, function(err, r, data){
    if (err)
      return cb(err, null);
    cb(undefined, ical.parseICS(data));
  })
}

exports.parseFile = function(filename){
  return ical.parseICS(fs.readFileSync(filename, 'utf8'))
}


var rrule = require('rrule-alt').RRule
var rrulestr = rrule.rrulestr

ical.objectHandlers['RRULE'] = function(val, params, curr, stack, line){
  curr.rrule = line;
  return curr
}
var originalEnd = ical.objectHandlers['END'];
ical.objectHandlers['END'] = function(val, params, curr, stack){
  if (curr.rrule) {
    var rule = curr.rrule;
    if (rule.indexOf('DTSTART') === -1) {

      if (curr.start.length === 8) {
        var comps = /^(\d{4})(\d{2})(\d{2})$/.exec(curr.start);
        if (comps) {
         curr.start = new Date (comps[1], comps[2] - 1, comps[3]);
        }
      }

      rule += ' DTSTART:' + curr.start.toISOString().replace(/[-:]/g, '');
      rule = rule.replace(/\.[0-9]{3}/, '');
    }
    for (var i in curr.exdates) {
      rule += ' EXDATE:' + curr.exdates[i].toISOString().replace(/[-:]/g, '');
      rule = rule.replace(/\.[0-9]{3}/, '');
    }
    curr.rrule = rrulestr(rule);
  }
  return originalEnd.call(this, val, params, curr, stack);
}
