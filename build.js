(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint node:true*/
/*globals Promise, window*/

// backup plan
//var data = require('./data/data.json');

var data;

var url = 'http://data.ssb.no/api/v0/dataset/1108.json?lang=no';

function sliceUpArray(array, lengthOfSlice, regions) {
    var rows = [];

    for (var i = 0; i < array.length; i += lengthOfSlice) {
        var row = array.slice(i, i + lengthOfSlice);

        // unshift adds to the front of the array
        // shift returns the first item in array and removes it
        row.unshift(regions.shift());

        rows.push(row);
    }

    return rows;
}

function mapIndexObject(obj) {
    var array = [];

    for (var i in obj) {
        array[obj[i]] = i;
    }

    return array;
}

function mapIndexWithLabels(indexObject, labelsObject) {
    var indexes = mapIndexObject(indexObject);

    var array = indexes.map(function (el) {
        return labelsObject[el];
    });

    return array;
}

// returns promise that resolves after saving data
function fetch() {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
    return new Promise(function (resolve, reject) {
        // http://jakearchibald.com/2015/thats-so-fetch/
        window.fetch(url).then(function (response) {
            // response json() returns promise(?)
            return response.json();
        }).then(function (json) {
            data = json;
            
            resolve();
        }).catch (function (err) {
            console.log('fetch error: ' + err);
            reject('Error fetching fra ssb');
        });
    });
}

function getTitle() {
    return data.dataset.label;
}

function getSource() {
    return data.dataset.source;
}

function getUpdated() {
    return data.dataset.updated;
}

function getValueRows() {
    var regionIndexObject = data.dataset.dimension.Region.category.index;
    var regionLabels = data.dataset.dimension.Region.category.label;

    var regions = mapIndexWithLabels(regionIndexObject, regionLabels);

    var values = data.dataset.value;
    var lenghtOfRow = data.dataset.dimension.size[1];

    return sliceUpArray(values, lenghtOfRow, regions);
}

function getHeaderRow() {
    var contentIndexObject = data.dataset.dimension.ContentsCode.category.index;
    var contentLabels = data.dataset.dimension.ContentsCode.category.label;

    return mapIndexWithLabels(contentIndexObject, contentLabels);
}

module.exports = {
    fetch: fetch,
    title: getTitle,
    source: getSource,
    updated: getUpdated,
    valueRows: getValueRows,
    headerRow: getHeaderRow
};
},{}],2:[function(require,module,exports){
/*globals document, module*/

module.exports = function (row, cellType) {
    return row.reduce(function (tr, next) {
        var td = document.createElement(cellType || 'td');

        td.textContent = next;

        tr.appendChild(td);
        
        return tr;
    }, document.createElement('tr'));
};
},{}],3:[function(require,module,exports){
/*jshint node:true*/

var thead = require('./thead');
var renderTbody = require('./tbody');
var sortFn = require('../util').sortFn;

module.exports = function (model) {
    var headerRow = model.headerRow();
    headerRow.unshift('Kommuner');

    var theadEventEmitter = thead(headerRow);

    theadEventEmitter.on('click', function (index, ascending) {
        var sortedBodyRows = bodyRows.sort(sortFn(index, ascending ? -1 : 1));

        renderTbody(sortedBodyRows);
    });

    var bodyRows = model.valueRows();
    
    renderTbody(bodyRows);
};
},{"../util":6,"./tbody":4,"./thead":5}],4:[function(require,module,exports){
var row = require('./row');

var tbody = document.getElementById('tbody');

module.exports = function (rows) {
    tbody.innerHTML = '';
    
    rows.forEach(function (r) {
        tbody.appendChild(row(r));
    });
};
},{"./row":2}],5:[function(require,module,exports){
/*globals require, document, module*/

var row = require('./row');
var EventEmitter = require("events").EventEmitter;

var event = new EventEmitter();

var thead = document.getElementById('thead');

var currentSelectedTh = null;
var state = false;

thead.addEventListener('click', function (evt) {
    // thead > tr > th...
    var ths = thead.children[0].children;
    var th = evt.target;

    if (currentSelectedTh !== th) {
        state = false;
    } else {
        state = state ? false : true;
    }

    currentSelectedTh = th;

    var index = Array.prototype.indexOf.call(ths, th);

    event.emit('click', index, state);
});

module.exports = function (rows) {
    [rows].forEach(function (r) {
        thead.appendChild(row(r, 'th'));
    });

    return event;
};
},{"./row":2,"events":7}],6:[function(require,module,exports){
function sortString(a, b) {
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    // a must be equal to b
    return 0;
}

function sortFn(index, desc) {
    return function (a, b) {
        var aValue = a[index];
        var bValue = b[index];
        
        if (aValue === undefined) {
            return 0;
        }

        if (typeof aValue === "number") {
            return (aValue - bValue) * desc;
        }

        if (typeof aValue === "string") {
            return sortString(aValue.toLowerCase(), bValue.toLowerCase()) * desc;
        }
    };
}

function id(el) {
    return document.getElementById(el);
}

function dateFormat(timestamp) {
    // timestamp and timezone :-/
    var date = new Date(timestamp);

    return date.getUTCDay() + '.' + 
        (date.getUTCMonth() + 1) + '.' + // month is zero based
        date.getUTCFullYear();
} 

module.exports = {
    sortFn: sortFn,
    id: id,
    dateFormat: dateFormat
};
},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],8:[function(require,module,exports){
/*jshint node:true*/

var model = require('./model');
var renderTable = require('./table/table');
var id = require('./util').id;
var dateFormat = require('./util').dateFormat;

var fetchPromise = model.fetch();

fetchPromise.then(function () {
    id('title').textContent = model.title();
    id('source').textContent = model.source();
    id('updated').textContent = dateFormat(model.updated());

    renderTable(model);
}).catch(function(err) {
    console.log(err);
});
},{"./model":1,"./table/table":3,"./util":6}]},{},[8])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tb2RlbC5qcyIsImpzL3RhYmxlL3Jvdy5qcyIsImpzL3RhYmxlL3RhYmxlLmpzIiwianMvdGFibGUvdGJvZHkuanMiLCJqcy90YWJsZS90aGVhZC5qcyIsImpzL3V0aWwuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsImpzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNoaW50IG5vZGU6dHJ1ZSovXG4vKmdsb2JhbHMgUHJvbWlzZSwgd2luZG93Ki9cblxuLy8gYmFja3VwIHBsYW5cbi8vdmFyIGRhdGEgPSByZXF1aXJlKCcuL2RhdGEvZGF0YS5qc29uJyk7XG5cbnZhciBkYXRhO1xuXG52YXIgdXJsID0gJ2h0dHA6Ly9kYXRhLnNzYi5uby9hcGkvdjAvZGF0YXNldC8xMTA4Lmpzb24/bGFuZz1ubyc7XG5cbmZ1bmN0aW9uIHNsaWNlVXBBcnJheShhcnJheSwgbGVuZ3RoT2ZTbGljZSwgcmVnaW9ucykge1xuICAgIHZhciByb3dzID0gW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSArPSBsZW5ndGhPZlNsaWNlKSB7XG4gICAgICAgIHZhciByb3cgPSBhcnJheS5zbGljZShpLCBpICsgbGVuZ3RoT2ZTbGljZSk7XG5cbiAgICAgICAgLy8gdW5zaGlmdCBhZGRzIHRvIHRoZSBmcm9udCBvZiB0aGUgYXJyYXlcbiAgICAgICAgLy8gc2hpZnQgcmV0dXJucyB0aGUgZmlyc3QgaXRlbSBpbiBhcnJheSBhbmQgcmVtb3ZlcyBpdFxuICAgICAgICByb3cudW5zaGlmdChyZWdpb25zLnNoaWZ0KCkpO1xuXG4gICAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgIH1cblxuICAgIHJldHVybiByb3dzO1xufVxuXG5mdW5jdGlvbiBtYXBJbmRleE9iamVjdChvYmopIHtcbiAgICB2YXIgYXJyYXkgPSBbXTtcblxuICAgIGZvciAodmFyIGkgaW4gb2JqKSB7XG4gICAgICAgIGFycmF5W29ialtpXV0gPSBpO1xuICAgIH1cblxuICAgIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gbWFwSW5kZXhXaXRoTGFiZWxzKGluZGV4T2JqZWN0LCBsYWJlbHNPYmplY3QpIHtcbiAgICB2YXIgaW5kZXhlcyA9IG1hcEluZGV4T2JqZWN0KGluZGV4T2JqZWN0KTtcblxuICAgIHZhciBhcnJheSA9IGluZGV4ZXMubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICByZXR1cm4gbGFiZWxzT2JqZWN0W2VsXTtcbiAgICB9KTtcblxuICAgIHJldHVybiBhcnJheTtcbn1cblxuLy8gcmV0dXJucyBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgYWZ0ZXIgc2F2aW5nIGRhdGFcbmZ1bmN0aW9uIGZldGNoKCkge1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1Byb21pc2VcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAvLyBodHRwOi8vamFrZWFyY2hpYmFsZC5jb20vMjAxNS90aGF0cy1zby1mZXRjaC9cbiAgICAgICAgd2luZG93LmZldGNoKHVybCkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIC8vIHJlc3BvbnNlIGpzb24oKSByZXR1cm5zIHByb21pc2UoPylcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgICAgIGRhdGEgPSBqc29uO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pLmNhdGNoIChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZmV0Y2ggZXJyb3I6ICcgKyBlcnIpO1xuICAgICAgICAgICAgcmVqZWN0KCdFcnJvciBmZXRjaGluZyBmcmEgc3NiJyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRUaXRsZSgpIHtcbiAgICByZXR1cm4gZGF0YS5kYXRhc2V0LmxhYmVsO1xufVxuXG5mdW5jdGlvbiBnZXRTb3VyY2UoKSB7XG4gICAgcmV0dXJuIGRhdGEuZGF0YXNldC5zb3VyY2U7XG59XG5cbmZ1bmN0aW9uIGdldFVwZGF0ZWQoKSB7XG4gICAgcmV0dXJuIGRhdGEuZGF0YXNldC51cGRhdGVkO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZVJvd3MoKSB7XG4gICAgdmFyIHJlZ2lvbkluZGV4T2JqZWN0ID0gZGF0YS5kYXRhc2V0LmRpbWVuc2lvbi5SZWdpb24uY2F0ZWdvcnkuaW5kZXg7XG4gICAgdmFyIHJlZ2lvbkxhYmVscyA9IGRhdGEuZGF0YXNldC5kaW1lbnNpb24uUmVnaW9uLmNhdGVnb3J5LmxhYmVsO1xuXG4gICAgdmFyIHJlZ2lvbnMgPSBtYXBJbmRleFdpdGhMYWJlbHMocmVnaW9uSW5kZXhPYmplY3QsIHJlZ2lvbkxhYmVscyk7XG5cbiAgICB2YXIgdmFsdWVzID0gZGF0YS5kYXRhc2V0LnZhbHVlO1xuICAgIHZhciBsZW5naHRPZlJvdyA9IGRhdGEuZGF0YXNldC5kaW1lbnNpb24uc2l6ZVsxXTtcblxuICAgIHJldHVybiBzbGljZVVwQXJyYXkodmFsdWVzLCBsZW5naHRPZlJvdywgcmVnaW9ucyk7XG59XG5cbmZ1bmN0aW9uIGdldEhlYWRlclJvdygpIHtcbiAgICB2YXIgY29udGVudEluZGV4T2JqZWN0ID0gZGF0YS5kYXRhc2V0LmRpbWVuc2lvbi5Db250ZW50c0NvZGUuY2F0ZWdvcnkuaW5kZXg7XG4gICAgdmFyIGNvbnRlbnRMYWJlbHMgPSBkYXRhLmRhdGFzZXQuZGltZW5zaW9uLkNvbnRlbnRzQ29kZS5jYXRlZ29yeS5sYWJlbDtcblxuICAgIHJldHVybiBtYXBJbmRleFdpdGhMYWJlbHMoY29udGVudEluZGV4T2JqZWN0LCBjb250ZW50TGFiZWxzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZmV0Y2g6IGZldGNoLFxuICAgIHRpdGxlOiBnZXRUaXRsZSxcbiAgICBzb3VyY2U6IGdldFNvdXJjZSxcbiAgICB1cGRhdGVkOiBnZXRVcGRhdGVkLFxuICAgIHZhbHVlUm93czogZ2V0VmFsdWVSb3dzLFxuICAgIGhlYWRlclJvdzogZ2V0SGVhZGVyUm93XG59OyIsIi8qZ2xvYmFscyBkb2N1bWVudCwgbW9kdWxlKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocm93LCBjZWxsVHlwZSkge1xuICAgIHJldHVybiByb3cucmVkdWNlKGZ1bmN0aW9uICh0ciwgbmV4dCkge1xuICAgICAgICB2YXIgdGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGNlbGxUeXBlIHx8ICd0ZCcpO1xuXG4gICAgICAgIHRkLnRleHRDb250ZW50ID0gbmV4dDtcblxuICAgICAgICB0ci5hcHBlbmRDaGlsZCh0ZCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdHI7XG4gICAgfSwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKSk7XG59OyIsIi8qanNoaW50IG5vZGU6dHJ1ZSovXG5cbnZhciB0aGVhZCA9IHJlcXVpcmUoJy4vdGhlYWQnKTtcbnZhciByZW5kZXJUYm9keSA9IHJlcXVpcmUoJy4vdGJvZHknKTtcbnZhciBzb3J0Rm4gPSByZXF1aXJlKCcuLi91dGlsJykuc29ydEZuO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgIHZhciBoZWFkZXJSb3cgPSBtb2RlbC5oZWFkZXJSb3coKTtcbiAgICBoZWFkZXJSb3cudW5zaGlmdCgnS29tbXVuZXInKTtcblxuICAgIHZhciB0aGVhZEV2ZW50RW1pdHRlciA9IHRoZWFkKGhlYWRlclJvdyk7XG5cbiAgICB0aGVhZEV2ZW50RW1pdHRlci5vbignY2xpY2snLCBmdW5jdGlvbiAoaW5kZXgsIGFzY2VuZGluZykge1xuICAgICAgICB2YXIgc29ydGVkQm9keVJvd3MgPSBib2R5Um93cy5zb3J0KHNvcnRGbihpbmRleCwgYXNjZW5kaW5nID8gLTEgOiAxKSk7XG5cbiAgICAgICAgcmVuZGVyVGJvZHkoc29ydGVkQm9keVJvd3MpO1xuICAgIH0pO1xuXG4gICAgdmFyIGJvZHlSb3dzID0gbW9kZWwudmFsdWVSb3dzKCk7XG4gICAgXG4gICAgcmVuZGVyVGJvZHkoYm9keVJvd3MpO1xufTsiLCJ2YXIgcm93ID0gcmVxdWlyZSgnLi9yb3cnKTtcblxudmFyIHRib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rib2R5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHJvd3MpIHtcbiAgICB0Ym9keS5pbm5lckhUTUwgPSAnJztcbiAgICBcbiAgICByb3dzLmZvckVhY2goZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgdGJvZHkuYXBwZW5kQ2hpbGQocm93KHIpKTtcbiAgICB9KTtcbn07IiwiLypnbG9iYWxzIHJlcXVpcmUsIGRvY3VtZW50LCBtb2R1bGUqL1xuXG52YXIgcm93ID0gcmVxdWlyZSgnLi9yb3cnKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpLkV2ZW50RW1pdHRlcjtcblxudmFyIGV2ZW50ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG52YXIgdGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlYWQnKTtcblxudmFyIGN1cnJlbnRTZWxlY3RlZFRoID0gbnVsbDtcbnZhciBzdGF0ZSA9IGZhbHNlO1xuXG50aGVhZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAvLyB0aGVhZCA+IHRyID4gdGguLi5cbiAgICB2YXIgdGhzID0gdGhlYWQuY2hpbGRyZW5bMF0uY2hpbGRyZW47XG4gICAgdmFyIHRoID0gZXZ0LnRhcmdldDtcblxuICAgIGlmIChjdXJyZW50U2VsZWN0ZWRUaCAhPT0gdGgpIHtcbiAgICAgICAgc3RhdGUgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZSA9IHN0YXRlID8gZmFsc2UgOiB0cnVlO1xuICAgIH1cblxuICAgIGN1cnJlbnRTZWxlY3RlZFRoID0gdGg7XG5cbiAgICB2YXIgaW5kZXggPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRocywgdGgpO1xuXG4gICAgZXZlbnQuZW1pdCgnY2xpY2snLCBpbmRleCwgc3RhdGUpO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHJvd3MpIHtcbiAgICBbcm93c10uZm9yRWFjaChmdW5jdGlvbiAocikge1xuICAgICAgICB0aGVhZC5hcHBlbmRDaGlsZChyb3cociwgJ3RoJykpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGV2ZW50O1xufTsiLCJmdW5jdGlvbiBzb3J0U3RyaW5nKGEsIGIpIHtcbiAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIGlmIChhIDwgYikge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIC8vIGEgbXVzdCBiZSBlcXVhbCB0byBiXG4gICAgcmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIHNvcnRGbihpbmRleCwgZGVzYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgYVZhbHVlID0gYVtpbmRleF07XG4gICAgICAgIHZhciBiVmFsdWUgPSBiW2luZGV4XTtcbiAgICAgICAgXG4gICAgICAgIGlmIChhVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGFWYWx1ZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgcmV0dXJuIChhVmFsdWUgLSBiVmFsdWUpICogZGVzYztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgYVZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gc29ydFN0cmluZyhhVmFsdWUudG9Mb3dlckNhc2UoKSwgYlZhbHVlLnRvTG93ZXJDYXNlKCkpICogZGVzYztcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGlkKGVsKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsKTtcbn1cblxuZnVuY3Rpb24gZGF0ZUZvcm1hdCh0aW1lc3RhbXApIHtcbiAgICAvLyB0aW1lc3RhbXAgYW5kIHRpbWV6b25lIDotL1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUodGltZXN0YW1wKTtcblxuICAgIHJldHVybiBkYXRlLmdldFVUQ0RheSgpICsgJy4nICsgXG4gICAgICAgIChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKSArICcuJyArIC8vIG1vbnRoIGlzIHplcm8gYmFzZWRcbiAgICAgICAgZGF0ZS5nZXRVVENGdWxsWWVhcigpO1xufSBcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc29ydEZuOiBzb3J0Rm4sXG4gICAgaWQ6IGlkLFxuICAgIGRhdGVGb3JtYXQ6IGRhdGVGb3JtYXRcbn07IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiLypqc2hpbnQgbm9kZTp0cnVlKi9cblxudmFyIG1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xudmFyIHJlbmRlclRhYmxlID0gcmVxdWlyZSgnLi90YWJsZS90YWJsZScpO1xudmFyIGlkID0gcmVxdWlyZSgnLi91dGlsJykuaWQ7XG52YXIgZGF0ZUZvcm1hdCA9IHJlcXVpcmUoJy4vdXRpbCcpLmRhdGVGb3JtYXQ7XG5cbnZhciBmZXRjaFByb21pc2UgPSBtb2RlbC5mZXRjaCgpO1xuXG5mZXRjaFByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgaWQoJ3RpdGxlJykudGV4dENvbnRlbnQgPSBtb2RlbC50aXRsZSgpO1xuICAgIGlkKCdzb3VyY2UnKS50ZXh0Q29udGVudCA9IG1vZGVsLnNvdXJjZSgpO1xuICAgIGlkKCd1cGRhdGVkJykudGV4dENvbnRlbnQgPSBkYXRlRm9ybWF0KG1vZGVsLnVwZGF0ZWQoKSk7XG5cbiAgICByZW5kZXJUYWJsZShtb2RlbCk7XG59KS5jYXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xufSk7Il19
