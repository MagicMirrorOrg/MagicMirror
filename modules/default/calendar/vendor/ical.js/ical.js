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

  var storeValParam = function (name) {
      return function (val, curr) {
          var current = curr[name];
          if (Array.isArray(current)) {
              current.push(val);
              return curr;
          }

          if (current != null) {
              curr[name] = [current, val];
              return curr;
          }

          curr[name] = val;
          return curr
      }
  }

  var storeParam = function (name) {
      return function (val, params, curr) {
          var data;
          if (params && params.length && !(params.length == 1 && params[0] === 'CHARSET=utf-8')) {
              data = { params: parseParams(params), val: text(val) }
          }
          else
              data = text(val)

          return storeValParam(name)(data, curr);
      }
  }

  var addTZ = function (dt, params) {
    var p = parseParams(params);

    if (params && p){
      dt.tz = p.TZID
    }

    return dt
  }

  var dateParam = function(name){
      return function (val, params, curr) {

      var newDate = text(val);


      if (params && params[0] === "VALUE=DATE") {
        // Just Date

        var comps = /^(\d{4})(\d{2})(\d{2})$/.exec(val);
        if (comps !== null) {
          // No TZ info - assume same timezone as this computer
          newDate = new Date(
            comps[1],
            parseInt(comps[2], 10)-1,
            comps[3]
          );

          newDate = addTZ(newDate, params);
          newDate.dateOnly = true;

          // Store as string - worst case scenario
          return storeValParam(name)(newDate, curr)
        }
      }


      //typical RFC date-time format
      var comps = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(val);
      if (comps !== null) {
        if (comps[7] == 'Z'){ // GMT
          newDate = new Date(Date.UTC(
            parseInt(comps[1], 10),
            parseInt(comps[2], 10)-1,
            parseInt(comps[3], 10),
            parseInt(comps[4], 10),
            parseInt(comps[5], 10),
            parseInt(comps[6], 10 )
          ));
          // TODO add tz
        } else {
          newDate = new Date(
            parseInt(comps[1], 10),
            parseInt(comps[2], 10)-1,
            parseInt(comps[3], 10),
            parseInt(comps[4], 10),
            parseInt(comps[5], 10),
            parseInt(comps[6], 10)
          );
        }

        newDate = addTZ(newDate, params);
    }


          // Store as string - worst case scenario
      return storeValParam(name)(newDate, curr)
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

  // EXDATE is an entry that represents exceptions to a recurrence rule (ex: "repeat every day except on 7/4").
  // The EXDATE entry itself can also contain a comma-separated list, so we make sure to parse each date out separately.
  // There can also be more than one EXDATE entries in a calendar record.
  // Since there can be multiple dates, we create an array of them.  The index into the array is the ISO string of the date itself, for ease of use.
  // i.e. You can check if ((curr.exdate != undefined) && (curr.exdate[date iso string] != undefined)) to see if a date is an exception.
  // NOTE: This specifically uses date only, and not time.  This is to avoid a few problems:
  //    1. The ISO string with time wouldn't work for "floating dates" (dates without timezones).
  //       ex: "20171225T060000" - this is supposed to mean 6 AM in whatever timezone you're currently in
  //    2. Daylight savings time potentially affects the time you would need to look up
  //    3. Some EXDATE entries in the wild seem to have times different from the recurrence rule, but are still excluded by calendar programs.  Not sure how or why.
  //       These would fail any sort of sane time lookup, because the time literally doesn't match the event.  So we'll ignore time and just use date.
  //       ex: DTSTART:20170814T140000Z
  //             RRULE:FREQ=WEEKLY;WKST=SU;INTERVAL=2;BYDAY=MO,TU
  //             EXDATE:20171219T060000
  //       Even though "T060000" doesn't match or overlap "T1400000Z", it's still supposed to be excluded?  Odd. :(
  // TODO: See if this causes any problems with events that recur multiple times a day.
  var exdateParam = function (name) {
    return function (val, params, curr) {
      var separatorPattern = /\s*,\s*/g;
      curr[name] = curr[name] || [];
      var dates = val ? val.split(separatorPattern) : [];
      dates.forEach(function (entry) {
          var exdate = new Array();
          dateParam(name)(entry, params, exdate);

          if (exdate[name])
          {
            if (typeof exdate[name].toISOString === 'function') {
              curr[name][exdate[name].toISOString().substring(0, 10)] = exdate[name];
            } else {
              console.error("No toISOString function in exdate[name]", exdate[name]);
            }
          }
        }
      )
      return curr;
    }
  }

  // RECURRENCE-ID is the ID of a specific recurrence within a recurrence rule.
  // TODO:  It's also possible for it to have a range, like "THISANDPRIOR", "THISANDFUTURE".  This isn't currently handled.
  var recurrenceParam = function (name) {
      return dateParam(name);
  }

  var addFBType = function (fb, params) {
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
        {
        	// If this is the first time we run into this UID, just save it.
        	if (par[curr.uid] === undefined)
            {
            	par[curr.uid] = curr;
            }
            else
            {
                // If we have multiple ical entries with the same UID, it's either going to be a
                // modification to a recurrence (RECURRENCE-ID), and/or a significant modification
                // to the entry (SEQUENCE).

                // TODO: Look into proper sequence logic.

                if (curr.recurrenceid === undefined)
                {
                    // If we have the same UID as an existing record, and it *isn't* a specific recurrence ID,
                    // not quite sure what the correct behaviour should be.  For now, just take the new information
                    // and merge it with the old record by overwriting only the fields that appear in the new record.
                    var key;
                    for (key in curr) {
                    	par[curr.uid][key] = curr[key];
                    }

                }
            }

        	// If we have recurrence-id entries, list them as an array of recurrences keyed off of recurrence-id.
        	// To use - as you're running through the dates of an rrule, you can try looking it up in the recurrences
        	// array.  If it exists, then use the data from the calendar object in the recurrence instead of the parent
        	// for that day.

        	// NOTE:  Sometimes the RECURRENCE-ID record will show up *before* the record with the RRULE entry.  In that
        	// case, what happens is that the RECURRENCE-ID record ends up becoming both the parent record and an entry
        	// in the recurrences array, and then when we process the RRULE entry later it overwrites the appropriate
			// fields in the parent record.

        	if (curr.recurrenceid != null)
        	{

        		// TODO:  Is there ever a case where we have to worry about overwriting an existing entry here?

        		// Create a copy of the current object to save in our recurrences array.  (We *could* just do par = curr,
        		// except for the case that we get the RECURRENCE-ID record before the RRULE record.  In that case, we
        		// would end up with a shared reference that would cause us to overwrite *both* records at the point
				// that we try and fix up the parent record.)
        		var recurrenceObj = new Object();
        		var key;
        		for (key in curr) {
        			recurrenceObj[key] = curr[key];
        		}

        		if (recurrenceObj.recurrences != undefined) {
        			delete recurrenceObj.recurrences;
        		}


				// If we don't have an array to store recurrences in yet, create it.
        		if (par[curr.uid].recurrences === undefined) {
        			par[curr.uid].recurrences = new Array();
            	}

        		// Save off our cloned recurrence object into the array, keyed by date but not time.
        		// We key by date only to avoid timezone and "floating time" problems (where the time isn't associated with a timezone).
				// TODO: See if this causes a problem with events that have multiple recurrences per day.
                if (typeof curr.recurrenceid.toISOString === 'function') {
                  par[curr.uid].recurrences[curr.recurrenceid.toISOString().substring(0,10)] = recurrenceObj;
                } else {
                  console.error("No toISOString function in curr.recurrenceid", curr.recurrenceid);
                }
            }

        	// One more specific fix - in the case that an RRULE entry shows up after a RECURRENCE-ID entry,
        	// let's make sure to clear the recurrenceid off the parent field.
        	if ((par[curr.uid].rrule != undefined) && (par[curr.uid].recurrenceid != undefined))
            {
        		delete par[curr.uid].recurrenceid;
            }

        }
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
      , 'EXDATE' : exdateParam('exdate')
      ,' CLASS' : storeParam('class')
      , 'TRANSP' : storeParam('transparency')
      , 'GEO' : geoParam('geo')
      , 'PERCENT-COMPLETE': storeParam('completion')
      , 'COMPLETED': dateParam('completed')
      , 'CATEGORIES': categoriesParam('categories')
      , 'FREEBUSY': freebusyParam('freebusy')
      , 'DTSTAMP': dateParam('dtstamp')
      , 'CREATED': dateParam('created')
      , 'LAST-MODIFIED': dateParam('lastmodified')
      , 'RECURRENCE-ID': recurrenceParam('recurrenceid')

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
