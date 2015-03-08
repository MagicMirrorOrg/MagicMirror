//https://github.com/tbasse/fritzbox-callmonitor
//(MIT License)
//
//Copyright (c) 2013 Thorsten Basse himself@tagedieb.com
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*
# Respsonse Format

Outbound:
Date;CALL;ConnectionId;Extension;CallerId;CalledPhoneNumber;

Inbound:
Date;RING;ConnectionId;CallerId;CalledPhoneNumber;

Connected:
Date;CONNECT;ConnectionId;Extension;Number;

Disconnected:
Date;DISCONNECT;ConnectionID;DurationInSeconds;
*/

var net    = require('net');
var events = require('events');

var CallMonitor = function (host, port) {
  var self = this;
  this.call = {};

  port = port || 1012;

  function fritzboxDateToUnix(string) {
    var d = string.match(/[0-9]{2}/g);
    var result = '';
    result += '20' + d[2] + '-' + d[1] + '-' + d[0];
    result += ' ' + d[3] + ':' + d[4] + ':' + d[5];
    return Math.floor(new Date(result).getTime() / 1000);
  }

  function parseMessage(buffer) {
    var message = buffer.toString()
                  .toLowerCase()
                  .replace(/[\n\r]$/, '')
                  .replace(/;$/, '')
                  .split(';');
    message[0] = fritzboxDateToUnix(message[0]);
    return message;
  }

  var client = net.createConnection(port, host);

  client.addListener('data', function (chunk) {
    var data = parseMessage(chunk);

    if (data[1] === 'ring') {
      self.call[data[2]] = {
        type: 'inbound',
        start: data[0],
        caller: data[3],
        called: data[4]
      };
      self.emit('inbound', {
        time: data[0],
        caller: data[3],
        called: data[4]
      });
      return;
    }

    if (data[1] === 'call') {
      self.call[data[2]] = {
        type: 'outbound',
        start: data[0],
        extension: data[3],
        caller: data[4],
        called: data[5]
      };
      self.emit('outbound', {
        time: data[0],
        extension: data[3],
        caller: data[4],
        called: data[5]
      });
      return;
    }

    if (data[1] === 'connect') {
      self.call[data[2]]['connect'] = data[0];
      self.emit('connected', {
        time: data[0],
        extension: self.call[data[2]]['extension'],
        caller: self.call[data[2]]['caller'],
        called: self.call[data[2]]['called']
      });
      return;
    }

    if (data[1] === 'disconnect') {
      self.call[data[2]].disconnect = data[0];
      self.call[data[2]].duration   = parseInt(data[3], 10);

      var call = self.call[data[2]];
      delete(self.call[data[2]]);
      self.emit('disconnected', call);
      return;
    }

  });

  client.addListener('end', function () {
    client.end();
  });
};

CallMonitor.prototype = new events.EventEmitter();

module.exports = CallMonitor;
