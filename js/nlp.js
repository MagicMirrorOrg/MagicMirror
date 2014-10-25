/*!
 * rrule.js - Library for working with recurrence rules for calendar dates.
 * https://github.com/jakubroztocil/rrule
 *
 * Copyright 2010, Jakub Roztocil and Lars Schoning
 * Licenced under the BSD licence.
 * https://github.com/jakubroztocil/rrule/blob/master/LICENCE
 *
 */

/**
 *
 * Implementation of RRule.fromText() and RRule::toText().
 *
 *
 * On the client side, this file needs to be included
 * when those functions are used.
 *
 */
(function (root){


var serverSide = typeof module !== 'undefined' && module.exports;
var RRule;


if (serverSide) {
    RRule = require('./rrule').RRule;
} else if (root.RRule) {
    RRule = root.RRule;
} else if (typeof require !== 'undefined') {
    if (!RRule) {RRule = require('rrule');}
} else {
    throw new Error('rrule.js is required for rrule/nlp.js to work')
}


//=============================================================================
// Helper functions
//=============================================================================

/**
 * Return true if a value is in an array
 */
var contains = function(arr, val) {
    return arr.indexOf(val) != -1;
};


//=============================================================================
// ToText
//=============================================================================


/**
 *
 * @param {RRule} rrule
 * Optional:
 * @param {Function} gettext function
 * @param {Object} language definition
 * @constructor
 */
var ToText = function(rrule, gettext, language) {

    this.gettext = gettext || function(id) {return id};
    this.language = language || ENGLISH;
    this.text = '';

    this.rrule = rrule;
    this.freq = rrule.options.freq;
    this.options = rrule.options;
    this.origOptions = rrule.origOptions;

    if (this.origOptions.bymonthday) {
        var bymonthday = [].concat(this.options.bymonthday);
        var bynmonthday = [].concat(this.options.bynmonthday);
        bymonthday.sort();
        bynmonthday.sort();
        bynmonthday.reverse();
        // 1, 2, 3, .., -5, -4, -3, ..
        this.bymonthday = bymonthday.concat(bynmonthday);
        if (!this.bymonthday.length) {
            this.bymonthday = null;
        }
    }

    if (this.origOptions.byweekday) {
        var byweekday = !(this.origOptions.byweekday instanceof Array)
                            ? [this.origOptions.byweekday]
                            : this.origOptions.byweekday;
        var days = String(byweekday);
        this.byweekday = {
            allWeeks:byweekday.filter(function (weekday) {
                return !Boolean(weekday.n);
            }),
            someWeeks:byweekday.filter(function (weekday) {
                return Boolean(weekday.n);
            }),
            isWeekdays:(
                days.indexOf('MO') != -1 &&
                    days.indexOf('TU') != -1 &&
                    days.indexOf('WE') != -1 &&
                    days.indexOf('TH') != -1 &&
                    days.indexOf('FR') != -1 &&
                    days.indexOf('SA') == -1 &&
                    days.indexOf('SU') == -1
                )
        };


        var sortWeekDays = function(a, b) {
            return a.weekday - b.weekday;
        };

        this.byweekday.allWeeks.sort(sortWeekDays);
        this.byweekday.someWeeks.sort(sortWeekDays);

        if (!this.byweekday.allWeeks.length) {
            this.byweekday.allWeeks = null;
        }
        if (!this.byweekday.someWeeks.length) {
            this.byweekday.someWeeks = null;
        }
    }
    else {
        this.byweekday = null;
    }

};


ToText.IMPLEMENTED = [];
var common = [
    'count', 'until', 'interval',
    'byweekday', 'bymonthday', 'bymonth'
];
ToText.IMPLEMENTED[RRule.DAILY]   = common;
ToText.IMPLEMENTED[RRule.WEEKLY]  = common;
ToText.IMPLEMENTED[RRule.MONTHLY] = common;
ToText.IMPLEMENTED[RRule.YEARLY]  = ['byweekno', 'byyearday'].concat(common);

/**
 * Test whether the rrule can be fully converted to text.
 * @param {RRule} rrule
 * @return {Boolean}
 */
ToText.isFullyConvertible = function(rrule) {
    var canConvert = true;

    if (!(rrule.options.freq in ToText.IMPLEMENTED)) {
        return false;
    }
    if (rrule.origOptions.until && rrule.origOptions.count) {
        return false;
    }
    for (var key in rrule.origOptions) {
        if (contains(['dtstart', 'wkst', 'freq'], key)) {
            return true;
        }
        if (!contains(ToText.IMPLEMENTED[rrule.options.freq], key)) {
            canConvert = false;
            return false;
        }
    }

    return canConvert;
};


ToText.prototype = {


    isFullyConvertible: function() {
        return ToText.isFullyConvertible(this.rrule);
    },


    /**
     * Perform the conversion. Only some of the frequencies are supported.
     * If some of the rrule's options aren't supported, they'll
     * be omitted from the output an "(~ approximate)" will be appended.
     * @return {*}
     */
    toString: function() {

        var gettext = this.gettext;

        if (!(this.options.freq in ToText.IMPLEMENTED)) {
            return gettext(
                'RRule error: Unable to fully convert this rrule to text');
        }

        this.text = [gettext('every')];

        this[RRule.FREQUENCIES[this.options.freq]]();

        if (this.options.until) {
            this.add(gettext('until'));
            var until = this.options.until;
            this.add(this.language.monthNames[until.getMonth()])
                .add(until.getDate() + ',')
                .add(until.getFullYear());
        } else if (this.options.count) {
            this.add(gettext('for'))
                .add(this.options.count)
                .add(this.plural(this.options.count)
                        ? gettext('times')
                        : gettext('time'));
        }

        if (!this.isFullyConvertible()) {
            this.add(gettext('(~ approximate)'));
        }
        return this.text.join('');
    },

    DAILY: function() {
        var gettext = this.gettext;
        if (this.options.interval != 1) {
            this.add(this.options.interval);
        }

        if (this.byweekday && this.byweekday.isWeekdays) {
            this.add(this.plural(this.options.interval)
                         ? gettext('weekdays')
                         : gettext('weekday'));
        } else {
            this.add(this.plural(this.options.interval)
                ? gettext('days') :  gettext('day'));
        }

        if (this.origOptions.bymonth) {
            this.add(gettext('in'));
            this._bymonth();
        }

        if (this.bymonthday) {
            this._bymonthday();
        } else if (this.byweekday) {
            this._byweekday();
        }

    },

    WEEKLY: function() {
        var gettext = this.gettext;
        if (this.options.interval != 1) {
            this.add(this.options.interval).add(
                this.plural(this.options.interval)
                    ? gettext('weeks')
                    :  gettext('week'));
        }

        if (this.byweekday && this.byweekday.isWeekdays) {

            if (this.options.interval == 1) {
                this.add(this.plural(this.options.interval)
                    ? gettext('weekdays')
                    : gettext('weekday'));
            } else {
                this.add(gettext('on')).add(gettext('weekdays'));
            }

        } else {

            if (this.options.interval == 1) {
                this.add(gettext('week'))
            }

            if (this.origOptions.bymonth) {
                this.add(gettext('in'));
                this._bymonth();
            }

            if (this.bymonthday) {
                this._bymonthday();
            } else if (this.byweekday) {
                this._byweekday();
            }
        }

    },

    MONTHLY: function() {
        var gettext = this.gettext;
        if (this.origOptions.bymonth) {
            if (this.options.interval != 1) {
                this.add(this.options.interval).add(gettext('months'));
                if (this.plural(this.options.interval)) {
                    this.add(gettext('in'));
                }
            } else {
                //this.add(gettext('MONTH'));
            }
            this._bymonth();
        } else {
            if (this.options.interval != 1) {
                this.add(this.options.interval);
            }
            this.add(this.plural(this.options.interval)
                ? gettext('months')
                :  gettext('month'));
        }
        if (this.bymonthday) {
            this._bymonthday();
        } else if (this.byweekday && this.byweekday.isWeekdays) {
            this.add(gettext('on')).add(gettext('weekdays'));
        } else if (this.byweekday) {
            this._byweekday();
        }
    },

    YEARLY: function() {
        var gettext = this.gettext;
        if (this.origOptions.bymonth) {
            if (this.options.interval != 1) {
                this.add(this.options.interval);
                this.add(gettext('years'));
            } else {
                // this.add(gettext('YEAR'));
            }
            this._bymonth();
        } else {
            if (this.options.interval != 1) {
                this.add(this.options.interval);
            }
            this.add(this.plural(this.options.interval)
                ? gettext('years')
                :  gettext('year'));
        }


        if (this.bymonthday) {
            this._bymonthday();
        } else if (this.byweekday) {
            this._byweekday();
        }


        if (this.options.byyearday) {
            this.add(gettext('on the'))
                .add(this.list(this.options.byyearday,
                     this.nth, gettext('and')))
                .add(gettext('day'));
        }

        if (this.options.byweekno) {
            this.add(gettext('in'))
                .add(this.plural(this.options.byweekno.length)
                        ? gettext('weeks') :  gettext('week'))
                .add(this.list(this.options.byweekno, null, gettext('and')));
        }
    },

    _bymonthday: function() {
        var gettext = this.gettext;
        if (this.byweekday && this.byweekday.allWeeks) {
            this.add(gettext('on'))
                .add(this.list(this.byweekday.allWeeks,
                     this.weekdaytext, gettext('or')))
                .add(gettext('the'))
                .add(this.list(this.bymonthday, this.nth, gettext('or')));
        } else {
            this.add(gettext('on the'))
                .add(this.list(this.bymonthday, this.nth, gettext('and')));
        }
        //this.add(gettext('DAY'));
    },

    _byweekday: function() {
        var gettext = this.gettext;
        if (this.byweekday.allWeeks && !this.byweekday.isWeekdays) {
            this.add(gettext('on'))
                .add(this.list(this.byweekday.allWeeks, this.weekdaytext));
        }

        if (this.byweekday.someWeeks) {

            if (this.byweekday.allWeeks) {
                this.add(gettext('and'));
            }

            this.add(gettext('on the'))
                .add(this.list(this.byweekday.someWeeks,
                               this.weekdaytext,
                               gettext('and')));
        }
    },

    _bymonth: function() {
        this.add(this.list(this.options.bymonth,
                           this.monthtext,
                           this.gettext('and')));
    },

    nth: function(n) {
        var nth, npos, gettext = this.gettext;

        if (n == -1) {
            return gettext('last');
        }

        npos = Math.abs(n);

        switch(npos) {
            case 1:
            case 21:
            case 31:
                nth = npos + gettext('st');
                break;
            case 2:
            case 22:
                nth = npos + gettext('nd');
                break;
            case 3:
            case 23:
                nth = npos + gettext('rd');
                break;
            default:
                nth = npos + gettext('th');
        }

        return  n < 0 ? nth + ' ' + gettext('last') : nth;

    },

    monthtext: function(m) {
        return this.language.monthNames[m - 1];
    },

    weekdaytext: function(wday) {
        return (wday.n ? this.nth(wday.n) + ' ' : '')
            + this.language.dayNames[wday.getJsWeekday()];
    },

    plural: function(n) {
        return n % 100 != 1;
    },

    add: function(s) {
        this.text.push(' ');
        this.text.push(s);
        return this;
    },

    list: function(arr, callback, finalDelim, delim) {

        var delimJoin = function (array, delimiter, finalDelimiter) {
            var list = '';
            for(var i = 0; i < array.length; i++) {
                if (i != 0) {
                    if (i == array.length - 1) {
                        list += ' ' + finalDelimiter + ' ';
                    } else {
                        list += delimiter + ' ';
                    }
                }
                list += array[i];
            }
            return list;
        };

        delim = delim || ',';
        callback = callback || (function(o){return o;});
        var self = this;
        var realCallback = function(arg) {
            return callback.call(self, arg);
        };

        if (finalDelim) {
            return delimJoin(arr.map(realCallback), delim, finalDelim);
        } else {
            return arr.map(realCallback).join(delim + ' ');
        }


    }


};


//=============================================================================
// fromText
//=============================================================================
/**
 * Will be able to convert some of the below described rules from
 * text format to a rule object.
 *
 *
 * RULES
 *
 * Every ([n])
 * 		  day(s)
 * 		| [weekday], ..., (and) [weekday]
 * 		| weekday(s)
 * 		| week(s)
 * 		| month(s)
 * 		| [month], ..., (and) [month]
 * 		| year(s)
 *
 *
 * Plus 0, 1, or multiple of these:
 *
 * on [weekday], ..., (or) [weekday] the [monthday], [monthday], ... (or) [monthday]
 *
 * on [weekday], ..., (and) [weekday]
 *
 * on the [monthday], [monthday], ... (and) [monthday] (day of the month)
 *
 * on the [nth-weekday], ..., (and) [nth-weekday] (of the month/year)
 *
 *
 * Plus 0 or 1 of these:
 *
 * for [n] time(s)
 *
 * until [date]
 *
 * Plus (.)
 *
 *
 * Definitely no supported for parsing:
 *
 * (for year):
 * 		in week(s) [n], ..., (and) [n]
 *
 * 		on the [yearday], ..., (and) [n] day of the year
 * 		on day [yearday], ..., (and) [n]
 *
 *
 * NON-TERMINALS
 *
 * [n]: 1, 2 ..., one, two, three ..
 * [month]: January, February, March, April, May, ... December
 * [weekday]: Monday, ... Sunday
 * [nth-weekday]: first [weekday], 2nd [weekday], ... last [weekday], ...
 * [monthday]: first, 1., 2., 1st, 2nd, second, ... 31st, last day, 2nd last day, ..
 * [date]:
 * 		[month] (0-31(,) ([year])),
 * 		(the) 0-31.(1-12.([year])),
 * 		(the) 0-31/(1-12/([year])),
 * 		[weekday]
 *
 * [year]: 0000, 0001, ... 01, 02, ..
 *
 * Definitely not supported for parsing:
 *
 * [yearday]: first, 1., 2., 1st, 2nd, second, ... 366th, last day, 2nd last day, ..
 *
 * @param {String} text
 * @return {Object, Boolean} the rule, or null.
 */
var fromText = function(text, language) {
    return new RRule(parseText(text, language))
};

var parseText = function(text, language) {

    var ttr = new Parser((language || ENGLISH).tokens);

    if(!ttr.start(text)) {
        return null;
    }

    var options = {};

    S();
    return options;

    function S() {
        ttr.expect('every');

        // every [n]
        var n;
        if(n = ttr.accept('number'))
            options.interval = parseInt(n[0]);

        if(ttr.isDone())
            throw new Error('Unexpected end');

        switch(ttr.symbol) {
        case 'day(s)':
            options.freq = RRule.DAILY;
            if (ttr.nextSymbol()) {
                ON();
                F();
            }
            break;

            // FIXME Note: every 2 weekdays != every two weeks on weekdays.
            // DAILY on weekdays is not a valid rule
        case 'weekday(s)':
            options.freq = RRule.WEEKLY;
            options.byweekday = [
                RRule.MO,
                RRule.TU,
                RRule.WE,
                RRule.TH,
                RRule.FR
            ];
            ttr.nextSymbol();
            F();
            break;

        case 'week(s)':
            options.freq = RRule.WEEKLY;
            if (ttr.nextSymbol()) {
                ON();
                F();
            }
            break;

        case 'month(s)':
            options.freq = RRule.MONTHLY;
            if (ttr.nextSymbol()) {
                ON();
                F();
            }
            break;

        case 'year(s)':
            options.freq = RRule.YEARLY;
            if (ttr.nextSymbol()) {
                ON();
                F();
            }
            break;

        case 'monday':
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
        case 'friday':
        case 'saturday':
        case 'sunday':
            options.freq = RRule.WEEKLY;
            options.byweekday = [RRule[ttr.symbol.substr(0, 2).toUpperCase()]];

            if(!ttr.nextSymbol())
                return;

            // TODO check for duplicates
            while (ttr.accept('comma')) {
                if(ttr.isDone())
                    throw new Error('Unexpected end');

                var wkd;
                if(!(wkd = decodeWKD())) {
                    throw new Error('Unexpected symbol ' + ttr.symbol
                        + ', expected weekday');
                }

                options.byweekday.push(RRule[wkd]);
                ttr.nextSymbol();
            }
            MDAYs();
            F();
            break;

        case 'january':
        case 'february':
        case 'march':
        case 'april':
        case 'may':
        case 'june':
        case 'july':
        case 'august':
        case 'september':
        case 'october':
        case 'november':
        case 'december':
            options.freq = RRule.YEARLY;
            options.bymonth = [decodeM()];

            if(!ttr.nextSymbol())
                return;

            // TODO check for duplicates
            while (ttr.accept('comma')) {
                if(ttr.isDone())
                    throw new Error('Unexpected end');

                var m;
                if(!(m = decodeM())) {
                    throw new Error('Unexpected symbol ' + ttr.symbol
                        + ', expected month');
                }

                options.bymonth.push(m);
                ttr.nextSymbol();
            }

            ON();
            F();
            break;

        default:
            throw new Error('Unknown symbol');

        }
    }

    function ON() {

        var on = ttr.accept('on');
        var the = ttr.accept('the');
        if(!(on || the)) {
            return;
        }

        do {

            var nth, wkd, m;

            // nth <weekday> | <weekday>
            if(nth = decodeNTH()) {
                //ttr.nextSymbol();

                if (wkd = decodeWKD()) {
                    ttr.nextSymbol();
                    if (!options.byweekday) {
                        options.byweekday = [];
                    }
                    options.byweekday.push(RRule[wkd].nth(nth));
                } else {
                    if(!options.bymonthday) {
                        options.bymonthday = [];
                    }
                    options.bymonthday.push(nth);
                    ttr.accept('day(s)');
                }

                // <weekday>
            } else if(wkd = decodeWKD()) {
                ttr.nextSymbol();
                if(!options.byweekday)
                    options.byweekday = [];
                options.byweekday.push(RRule[wkd]);
            } else if(ttr.symbol == 'weekday(s)') {
                ttr.nextSymbol();
                if(!options.byweekday)
                    options.byweekday = [];
                options.byweekday.push(RRule.MO);
                options.byweekday.push(RRule.TU);
                options.byweekday.push(RRule.WE);
                options.byweekday.push(RRule.TH);
                options.byweekday.push(RRule.FR);
            } else if(ttr.symbol == 'week(s)') {
                ttr.nextSymbol();
                var n;
                if(!(n = ttr.accept('number'))) {
                    throw new Error('Unexpected symbol ' + ttr.symbol
                        + ', expected week number');
                }
                options.byweekno = [n[0]];
                while(ttr.accept('comma')) {
                    if(!(n = ttr.accept('number'))) {
                        throw new Error('Unexpected symbol ' + ttr.symbol
                            + '; expected monthday');
                    }
                    options.byweekno.push(n[0]);
                }

            } else if(m = decodeM()) {
                ttr.nextSymbol();
                if(!options.bymonth)
                    options.bymonth = [];
                options.bymonth.push(m);
            } else {
                return;
            }

        } while (ttr.accept('comma') || ttr.accept('the') || ttr.accept('on'));
    }

    function decodeM() {
        switch(ttr.symbol) {
        case 'january':
            return 1;
        case 'february':
            return 2;
        case 'march':
            return 3;
        case 'april':
            return 4;
        case 'may':
            return 5;
        case 'june':
            return 6;
        case 'july':
            return 7;
        case 'august':
            return 8;
        case 'september':
            return 9;
        case 'october':
            return 10;
        case 'november':
            return 11;
        case 'december':
            return 12;
        default:
            return false;
        }
    }

    function decodeWKD() {
        switch(ttr.symbol) {
        case 'monday':
        case 'tuesday':
        case 'wednesday':
        case 'thursday':
        case 'friday':
        case 'saturday':
        case 'sunday':
            return ttr.symbol.substr(0, 2).toUpperCase();
            break;

        default:
            return false;
        }
    }

    function decodeNTH() {

        switch(ttr.symbol) {
        case 'last':
            ttr.nextSymbol();
            return -1;
        case 'first':
            ttr.nextSymbol();
            return 1;
        case 'second':
            ttr.nextSymbol();
            return ttr.accept('last') ? -2 : 2;
        case 'third':
            ttr.nextSymbol();
            return ttr.accept('last') ? -3 : 3;
        case 'nth':
            var v = parseInt(ttr.value[1]);
            if(v < -366 || v > 366)
                throw new Error('Nth out of range: ' + v);

            ttr.nextSymbol();
            return ttr.accept('last') ? -v : v;

        default:
            return false;
        }
    }

    function MDAYs() {

        ttr.accept('on');
        ttr.accept('the');

        var nth;
        if(!(nth = decodeNTH())) {
            return;
        }

        options.bymonthday = [nth];
        ttr.nextSymbol();

        while(ttr.accept('comma')) {

            if (!(nth = decodeNTH())) {
                throw new Error('Unexpected symbol ' + ttr.symbol
                        + '; expected monthday');
            }

            options.bymonthday.push(nth);

            ttr.nextSymbol();
        }
    }

    function F() {

        if(ttr.symbol == 'until') {

            var date = Date.parse(ttr.text);

            if (!date) {
                throw new Error('Cannot parse until date:' + ttr.text);
            }
            options.until = new Date(date);
        } else if(ttr.accept('for')){

            options.count = ttr.value[0];
            ttr.expect('number');
            /* ttr.expect('times') */
        }
    }
};


//=============================================================================
// Parser
//=============================================================================

var Parser = function(rules) {
   this.rules = rules;
};

Parser.prototype.start = function(text) {
   this.text = text;
   this.done = false;
   return this.nextSymbol();
};

Parser.prototype.isDone = function() {
   return this.done && this.symbol == null;
};

Parser.prototype.nextSymbol = function() {
   var p = this, best, bestSymbol;

   this.symbol = null;
   this.value = null;
   do {
       if(this.done) {
           return false;
       }

       best = null;

       var match, rule;
       for (var name in this.rules) {
           rule = this.rules[name];
           if(match = rule.exec(p.text)) {
               if(best == null || match[0].length > best[0].length) {
                   best = match;
                   bestSymbol = name;
               }
           }

       }

       if(best != null) {
           this.text = this.text.substr(best[0].length);

           if(this.text == '') {
               this.done = true;
           }
       }

       if(best == null) {
           this.done = true;
           this.symbol = null;
           this.value = null;
           return;
       }
   } while(bestSymbol == 'SKIP');

   this.symbol = bestSymbol;
   this.value = best;
   return true;
};

Parser.prototype.accept = function(name) {
   if(this.symbol == name) {
       if(this.value) {
           var v = this.value;
           this.nextSymbol();
           return v;
       }

       this.nextSymbol();
       return true;
   }

   return false;
};

Parser.prototype.expect = function(name) {
   if(this.accept(name)) {
       return true;
   }

   throw new Error('expected ' + name + ' but found ' + this.symbol);
};


//=============================================================================
// i18n
//=============================================================================

var ENGLISH = {
    dayNames: [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "January", "February", "March", "April", "May",
        "June", "July", "August", "September", "October",
        "November", "December"
    ],
    tokens: {
        'SKIP': /^[ \r\n\t]+|^\.$/,
        'number': /^[1-9][0-9]*/,
        'numberAsText': /^(one|two|three)/i,
        'every': /^every/i,
        'day(s)': /^days?/i,
        'weekday(s)': /^weekdays?/i,
        'week(s)': /^weeks?/i,
        'month(s)': /^months?/i,
        'year(s)': /^years?/i,
        'on': /^(on|in)/i,
        'the': /^the/i,
        'first': /^first/i,
        'second': /^second/i,
        'third': /^third/i,
        'nth': /^([1-9][0-9]*)(\.|th|nd|rd|st)/i,
        'last': /^last/i,
        'for': /^for/i,
        'time(s)': /^times?/i,
        'until': /^(un)?til/i,
        'monday': /^mo(n(day)?)?/i,
        'tuesday': /^tu(e(s(day)?)?)?/i,
        'wednesday': /^we(d(n(esday)?)?)?/i,
        'thursday': /^th(u(r(sday)?)?)?/i,
        'friday': /^fr(i(day)?)?/i,
        'saturday': /^sa(t(urday)?)?/i,
        'sunday': /^su(n(day)?)?/i,
        'january': /^jan(uary)?/i,
        'february': /^feb(ruary)?/i,
        'march': /^mar(ch)?/i,
        'april': /^apr(il)?/i,
        'may': /^may/i,
        'june': /^june?/i,
        'july': /^july?/i,
        'august': /^aug(ust)?/i,
        'september': /^sep(t(ember)?)?/i,
        'october': /^oct(ober)?/i,
        'november': /^nov(ember)?/i,
        'december': /^dec(ember)?/i,
        'comma': /^(,\s*|(and|or)\s*)+/i
    }
};


//=============================================================================
// Export
//=============================================================================

var nlp = {
    fromText: fromText,
    parseText: parseText,
    isFullyConvertible: ToText.isFullyConvertible,
    toText: function(rrule, gettext, language) {
        return new ToText(rrule, gettext, language).toString();
    }
};

if (serverSide) {
    module.exports = nlp
} else {
  root['_RRuleNLP'] = nlp;
}

if (typeof define === "function" && define.amd) {
    /*global define:false */
    define("rrule", [], function () {
        return RRule;
    });
}

})(this);
