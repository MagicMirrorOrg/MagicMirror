var ical = require('ical')
  , months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


ical.fromURL('http://lanyrd.com/topics/nodejs/nodejs.ics', {}, function(err, data){
  for (var k in data){
    if (data.hasOwnProperty(k)){
      var ev = data[k]
      console.log("Conference", ev.summary, 'is in',  ev.location, 'on the', ev.start.getDate(), 'of', months[ev.start.getMonth()] );
    }
  }
})

