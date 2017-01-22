(function(name, definition) {

/****************
 *  A tolerant, minimal icalendar parser
 *  (http://tools.ietf.org/html/rfc5545)
 *
 *  <peterbraden@peterbraden.co.uk>
 * **************/

  if (typeof module !== 'undefined') {
    module.exports = definition();
  } else if (typeof define === 'function' && typeof define.amd === 'object'){
    define(definition);
  } else {
    this[name] = definition();
  }

}('ical', function(){

   // Unescape Text re RFC 4.3.11
  var text = function(t){
    t = t || "";
    return (t
      .replace(/\\\,/g, ',')
      .replace(/\\\;/g, ';')
      .replace(/\\[nN]/g, '\n')
      .replace(/\\\\/g, '\\')
    )
  }

  var parseParams = function(p){
    var out = {}
    for (var i = 0; i<p.length; i++){
      if (p[i].indexOf('=') > -1){
        var segs = p[i].split('=');
        
        out[segs[0]] = parseValue(segs.slice(1).join('='));
        
      }
    }
    return out || sp
  }

  var parseValue = function(val){
    if ('TRUE' === val)
      return true;
    
    if ('FALSE' === val)
      return false;

    var number = Number(val);
    if (!isNaN(number))
      return number;

    return val;
  }

  var storeParam = function(name){
    return function(val, params, curr){
      var data;
      if (params && params.length && !(params.length==1 && params[0]==='CHARSET=utf-8')){
        data = {params:parseParams(params), val:text(val)}
      }
      else
        data = text(val)

      var current = curr[name];
      if (Array.isArray(current)){
        current.push(data);
        return curr;
      }

      if (current != null){
        curr[name] = [current, data];
        return curr;
      }

      curr[name] = data;
      return curr
    }
  }

  var addTZ = function(dt, name, params){
    var p = parseParams(params);

    if (params && p){
      dt[name].tz = p.TZID
    }

    return dt
  }


  var dateParam = function(name){
    return function(val, params, curr){

      // Store as string - worst case scenario
      storeParam(name)(val, undefined, curr)

      if (params && params[0] === "VALUE=DATE") {
        // Just Date

        var comps = /^(\d{4})(\d{2})(\d{2})$/.exec(val);
        if (comps !== null) {
          // No TZ info - assume same timezone as this computer
          curr[name] = new Date(
            comps[1],
            parseInt(comps[2], 10)-1,
            comps[3]
          );

          return addTZ(curr, name, params);
        }
      }


      //typical RFC date-time format
      var comps = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(val);
      if (comps !== null) {
        if (comps[7] == 'Z'){ // GMT
          curr[name] = new Date(Date.UTC(
            parseInt(comps[1], 10),
            parseInt(comps[2], 10)-1,
            parseInt(comps[3], 10),
            parseInt(comps[4], 10),
            parseInt(comps[5], 10),
            parseInt(comps[6], 10 )
          ));
          // TODO add tz
        } else {
          curr[name] = new Date(
            parseInt(comps[1], 10),
            parseInt(comps[2], 10)-1,
            parseInt(comps[3], 10),
            parseInt(comps[4], 10),
            parseInt(comps[5], 10),
            parseInt(comps[6], 10)
          );
        }
      }

      return addTZ(curr, name, params)
    }
  }


  var geoParam = function(name){
    return function(val, params, curr){
      storeParam(val, params, curr)
      var parts = val.split(';');
      curr[name] = {lat:Number(parts[0]), lon:Number(parts[1])};
      return curr
    }
  }

  var categoriesParam = function (name) {
    var separatorPattern = /\s*,\s*/g;
    return function (val, params, curr) {
      storeParam(val, params, curr)
      if (curr[name] === undefined)
        curr[name] = val ? val.split(separatorPattern) : []
      else
        if (val)
          curr[name] = curr[name].concat(val.split(separatorPattern))
      return curr
    }
  }

  var addFBType = function(fb, params){
    var p = parseParams(params);

    if (params && p){
      fb.type = p.FBTYPE || "BUSY"
    }

    return fb;
  }

  var freebusyParam = function (name) {
    return function(val, params, curr){
      var fb = addFBType({}, params);
      curr[name] = curr[name] || []
      curr[name].push(fb);

      storeParam(val, params, fb);

      var parts = val.split('/');

      ['start', 'end'].forEach(function (name, index) {
        dateParam(name)(parts[index], params, fb);
      });

      return curr;
    }
  }

  return {


    objectHandlers : {
      'BEGIN' : function(component, params, curr, stack){
          stack.push(curr)

          return {type:component, params:params}
        }

      , 'END' : function(component, params, curr, stack){
        // prevents the need to search the root of the tree for the VCALENDAR object
        if (component === "VCALENDAR") {
            //scan all high level object in curr and drop all strings
            var key,
                obj;
            
            for (key in curr) {
                if(curr.hasOwnProperty(key)) {
                   obj = curr[key];
                   if (typeof obj === 'string') {
                       delete curr[key];
                   }
                }
            }
            
            return curr
        }
        
        var par = stack.pop()

        if (curr.uid)
          par[curr.uid] = curr
        else
          par[Math.random()*100000] = curr  // Randomly assign ID : TODO - use true GUID

        return par
      }

      , 'SUMMARY' : storeParam('summary')
      , 'DESCRIPTION' : storeParam('description')
      , 'URL' : storeParam('url')
      , 'UID' : storeParam('uid')
      , 'LOCATION' : storeParam('location')
      , 'DTSTART' : dateParam('start')
      , 'DTEND' : dateParam('end')
      ,' CLASS' : storeParam('class')
      , 'TRANSP' : storeParam('transparency')
      , 'GEO' : geoParam('geo')
      , 'PERCENT-COMPLETE': storeParam('completion')
      , 'COMPLETED': dateParam('completed')
      , 'CATEGORIES': categoriesParam('categories')
      , 'FREEBUSY': freebusyParam('freebusy')
    },


    handleObject : function(name, val, params, ctx, stack, line){
      var self = this

      if(self.objectHandlers[name])
        return self.objectHandlers[name](val, params, ctx, stack, line)

      //handling custom properties
      if(name.match(/X\-[\w\-]+/) && stack.length > 0) {
          //trimming the leading and perform storeParam
          name = name.substring(2);
          return (storeParam(name))(val, params, ctx, stack, line);
      }
      
      return storeParam(name.toLowerCase())(val, params, ctx);
    },


    parseICS : function(str){
      var self = this
      var lines = str.split(/\r?\n/)
      var ctx = {}
      var stack = []

      for (var i = 0, ii = lines.length, l = lines[0]; i<ii; i++, l=lines[i]){
        //Unfold : RFC#3.1
        while (lines[i+1] && /[ \t]/.test(lines[i+1][0])) {
          l += lines[i+1].slice(1)
          i += 1
        }

        var kv = l.split(":")

        if (kv.length < 2){
          // Invalid line - must have k&v
          continue;
        }

        // Although the spec says that vals with colons should be quote wrapped
        // in practise nobody does, so we assume further colons are part of the
        // val
        var value = kv.slice(1).join(":")
          , kp = kv[0].split(";")
          , name = kp[0]
          , params = kp.slice(1)

        ctx = self.handleObject(name, value, params, ctx, stack, l) || {}
      }

       // type and params are added to the list of items, get rid of them.
       delete ctx.type
       delete ctx.params

       return ctx
    }

  }
}))
