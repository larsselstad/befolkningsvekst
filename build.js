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

    return date.toLocaleDateString();
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9tb2RlbC5qcyIsImpzL3RhYmxlL3Jvdy5qcyIsImpzL3RhYmxlL3RhYmxlLmpzIiwianMvdGFibGUvdGJvZHkuanMiLCJqcy90YWJsZS90aGVhZC5qcyIsImpzL3V0aWwuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsImpzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypqc2hpbnQgbm9kZTp0cnVlKi9cbi8qZ2xvYmFscyBQcm9taXNlLCB3aW5kb3cqL1xuXG4vLyBiYWNrdXAgcGxhblxuLy92YXIgZGF0YSA9IHJlcXVpcmUoJy4vZGF0YS9kYXRhLmpzb24nKTtcblxudmFyIGRhdGE7XG5cbnZhciB1cmwgPSAnaHR0cDovL2RhdGEuc3NiLm5vL2FwaS92MC9kYXRhc2V0LzExMDguanNvbj9sYW5nPW5vJztcblxuZnVuY3Rpb24gc2xpY2VVcEFycmF5KGFycmF5LCBsZW5ndGhPZlNsaWNlLCByZWdpb25zKSB7XG4gICAgdmFyIHJvd3MgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpICs9IGxlbmd0aE9mU2xpY2UpIHtcbiAgICAgICAgdmFyIHJvdyA9IGFycmF5LnNsaWNlKGksIGkgKyBsZW5ndGhPZlNsaWNlKTtcblxuICAgICAgICAvLyB1bnNoaWZ0IGFkZHMgdG8gdGhlIGZyb250IG9mIHRoZSBhcnJheVxuICAgICAgICAvLyBzaGlmdCByZXR1cm5zIHRoZSBmaXJzdCBpdGVtIGluIGFycmF5IGFuZCByZW1vdmVzIGl0XG4gICAgICAgIHJvdy51bnNoaWZ0KHJlZ2lvbnMuc2hpZnQoKSk7XG5cbiAgICAgICAgcm93cy5wdXNoKHJvdyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvd3M7XG59XG5cbmZ1bmN0aW9uIG1hcEluZGV4T2JqZWN0KG9iaikge1xuICAgIHZhciBhcnJheSA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSBpbiBvYmopIHtcbiAgICAgICAgYXJyYXlbb2JqW2ldXSA9IGk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBtYXBJbmRleFdpdGhMYWJlbHMoaW5kZXhPYmplY3QsIGxhYmVsc09iamVjdCkge1xuICAgIHZhciBpbmRleGVzID0gbWFwSW5kZXhPYmplY3QoaW5kZXhPYmplY3QpO1xuXG4gICAgdmFyIGFycmF5ID0gaW5kZXhlcy5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHJldHVybiBsYWJlbHNPYmplY3RbZWxdO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGFycmF5O1xufVxuXG4vLyByZXR1cm5zIHByb21pc2UgdGhhdCByZXNvbHZlcyBhZnRlciBzYXZpbmcgZGF0YVxuZnVuY3Rpb24gZmV0Y2goKSB7XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvUHJvbWlzZVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIGh0dHA6Ly9qYWtlYXJjaGliYWxkLmNvbS8yMDE1L3RoYXRzLXNvLWZldGNoL1xuICAgICAgICB3aW5kb3cuZmV0Y2godXJsKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgLy8gcmVzcG9uc2UganNvbigpIHJldHVybnMgcHJvbWlzZSg/KVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoanNvbikge1xuICAgICAgICAgICAgZGF0YSA9IGpzb247XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSkuY2F0Y2ggKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmZXRjaCBlcnJvcjogJyArIGVycik7XG4gICAgICAgICAgICByZWplY3QoJ0Vycm9yIGZldGNoaW5nIGZyYSBzc2InKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFRpdGxlKCkge1xuICAgIHJldHVybiBkYXRhLmRhdGFzZXQubGFiZWw7XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZSgpIHtcbiAgICByZXR1cm4gZGF0YS5kYXRhc2V0LnNvdXJjZTtcbn1cblxuZnVuY3Rpb24gZ2V0VXBkYXRlZCgpIHtcbiAgICByZXR1cm4gZGF0YS5kYXRhc2V0LnVwZGF0ZWQ7XG59XG5cbmZ1bmN0aW9uIGdldFZhbHVlUm93cygpIHtcbiAgICB2YXIgcmVnaW9uSW5kZXhPYmplY3QgPSBkYXRhLmRhdGFzZXQuZGltZW5zaW9uLlJlZ2lvbi5jYXRlZ29yeS5pbmRleDtcbiAgICB2YXIgcmVnaW9uTGFiZWxzID0gZGF0YS5kYXRhc2V0LmRpbWVuc2lvbi5SZWdpb24uY2F0ZWdvcnkubGFiZWw7XG5cbiAgICB2YXIgcmVnaW9ucyA9IG1hcEluZGV4V2l0aExhYmVscyhyZWdpb25JbmRleE9iamVjdCwgcmVnaW9uTGFiZWxzKTtcblxuICAgIHZhciB2YWx1ZXMgPSBkYXRhLmRhdGFzZXQudmFsdWU7XG4gICAgdmFyIGxlbmdodE9mUm93ID0gZGF0YS5kYXRhc2V0LmRpbWVuc2lvbi5zaXplWzFdO1xuXG4gICAgcmV0dXJuIHNsaWNlVXBBcnJheSh2YWx1ZXMsIGxlbmdodE9mUm93LCByZWdpb25zKTtcbn1cblxuZnVuY3Rpb24gZ2V0SGVhZGVyUm93KCkge1xuICAgIHZhciBjb250ZW50SW5kZXhPYmplY3QgPSBkYXRhLmRhdGFzZXQuZGltZW5zaW9uLkNvbnRlbnRzQ29kZS5jYXRlZ29yeS5pbmRleDtcbiAgICB2YXIgY29udGVudExhYmVscyA9IGRhdGEuZGF0YXNldC5kaW1lbnNpb24uQ29udGVudHNDb2RlLmNhdGVnb3J5LmxhYmVsO1xuXG4gICAgcmV0dXJuIG1hcEluZGV4V2l0aExhYmVscyhjb250ZW50SW5kZXhPYmplY3QsIGNvbnRlbnRMYWJlbHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmZXRjaDogZmV0Y2gsXG4gICAgdGl0bGU6IGdldFRpdGxlLFxuICAgIHNvdXJjZTogZ2V0U291cmNlLFxuICAgIHVwZGF0ZWQ6IGdldFVwZGF0ZWQsXG4gICAgdmFsdWVSb3dzOiBnZXRWYWx1ZVJvd3MsXG4gICAgaGVhZGVyUm93OiBnZXRIZWFkZXJSb3dcbn07IiwiLypnbG9iYWxzIGRvY3VtZW50LCBtb2R1bGUqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChyb3csIGNlbGxUeXBlKSB7XG4gICAgcmV0dXJuIHJvdy5yZWR1Y2UoZnVuY3Rpb24gKHRyLCBuZXh0KSB7XG4gICAgICAgIHZhciB0ZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoY2VsbFR5cGUgfHwgJ3RkJyk7XG5cbiAgICAgICAgdGQudGV4dENvbnRlbnQgPSBuZXh0O1xuXG4gICAgICAgIHRyLmFwcGVuZENoaWxkKHRkKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0cjtcbiAgICB9LCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0cicpKTtcbn07IiwiLypqc2hpbnQgbm9kZTp0cnVlKi9cblxudmFyIHRoZWFkID0gcmVxdWlyZSgnLi90aGVhZCcpO1xudmFyIHJlbmRlclRib2R5ID0gcmVxdWlyZSgnLi90Ym9keScpO1xudmFyIHNvcnRGbiA9IHJlcXVpcmUoJy4uL3V0aWwnKS5zb3J0Rm47XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgdmFyIGhlYWRlclJvdyA9IG1vZGVsLmhlYWRlclJvdygpO1xuICAgIGhlYWRlclJvdy51bnNoaWZ0KCdLb21tdW5lcicpO1xuXG4gICAgdmFyIHRoZWFkRXZlbnRFbWl0dGVyID0gdGhlYWQoaGVhZGVyUm93KTtcblxuICAgIHRoZWFkRXZlbnRFbWl0dGVyLm9uKCdjbGljaycsIGZ1bmN0aW9uIChpbmRleCwgYXNjZW5kaW5nKSB7XG4gICAgICAgIHZhciBzb3J0ZWRCb2R5Um93cyA9IGJvZHlSb3dzLnNvcnQoc29ydEZuKGluZGV4LCBhc2NlbmRpbmcgPyAtMSA6IDEpKTtcblxuICAgICAgICByZW5kZXJUYm9keShzb3J0ZWRCb2R5Um93cyk7XG4gICAgfSk7XG5cbiAgICB2YXIgYm9keVJvd3MgPSBtb2RlbC52YWx1ZVJvd3MoKTtcbiAgICBcbiAgICByZW5kZXJUYm9keShib2R5Um93cyk7XG59OyIsInZhciByb3cgPSByZXF1aXJlKCcuL3JvdycpO1xuXG52YXIgdGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGJvZHknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocm93cykge1xuICAgIHRib2R5LmlubmVySFRNTCA9ICcnO1xuICAgIFxuICAgIHJvd3MuZm9yRWFjaChmdW5jdGlvbiAocikge1xuICAgICAgICB0Ym9keS5hcHBlbmRDaGlsZChyb3cocikpO1xuICAgIH0pO1xufTsiLCIvKmdsb2JhbHMgcmVxdWlyZSwgZG9jdW1lbnQsIG1vZHVsZSovXG5cbnZhciByb3cgPSByZXF1aXJlKCcuL3JvdycpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCJldmVudHNcIikuRXZlbnRFbWl0dGVyO1xuXG52YXIgZXZlbnQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbnZhciB0aGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0aGVhZCcpO1xuXG52YXIgY3VycmVudFNlbGVjdGVkVGggPSBudWxsO1xudmFyIHN0YXRlID0gZmFsc2U7XG5cbnRoZWFkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIC8vIHRoZWFkID4gdHIgPiB0aC4uLlxuICAgIHZhciB0aHMgPSB0aGVhZC5jaGlsZHJlblswXS5jaGlsZHJlbjtcbiAgICB2YXIgdGggPSBldnQudGFyZ2V0O1xuXG4gICAgaWYgKGN1cnJlbnRTZWxlY3RlZFRoICE9PSB0aCkge1xuICAgICAgICBzdGF0ZSA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlID0gc3RhdGUgPyBmYWxzZSA6IHRydWU7XG4gICAgfVxuXG4gICAgY3VycmVudFNlbGVjdGVkVGggPSB0aDtcblxuICAgIHZhciBpbmRleCA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhzLCB0aCk7XG5cbiAgICBldmVudC5lbWl0KCdjbGljaycsIGluZGV4LCBzdGF0ZSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocm93cykge1xuICAgIFtyb3dzXS5mb3JFYWNoKGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHRoZWFkLmFwcGVuZENoaWxkKHJvdyhyLCAndGgnKSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZXZlbnQ7XG59OyIsImZ1bmN0aW9uIHNvcnRTdHJpbmcoYSwgYikge1xuICAgIGlmIChhID4gYikge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgaWYgKGEgPCBiKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgLy8gYSBtdXN0IGJlIGVxdWFsIHRvIGJcbiAgICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gc29ydEZuKGluZGV4LCBkZXNjKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhVmFsdWUgPSBhW2luZGV4XTtcbiAgICAgICAgdmFyIGJWYWx1ZSA9IGJbaW5kZXhdO1xuICAgICAgICBcbiAgICAgICAgaWYgKGFWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgYVZhbHVlID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXR1cm4gKGFWYWx1ZSAtIGJWYWx1ZSkgKiBkZXNjO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhVmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBzb3J0U3RyaW5nKGFWYWx1ZS50b0xvd2VyQ2FzZSgpLCBiVmFsdWUudG9Mb3dlckNhc2UoKSkgKiBkZXNjO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gaWQoZWwpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWwpO1xufVxuXG5mdW5jdGlvbiBkYXRlRm9ybWF0KHRpbWVzdGFtcCkge1xuICAgIC8vIHRpbWVzdGFtcCBhbmQgdGltZXpvbmUgOi0vXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSh0aW1lc3RhbXApO1xuXG4gICAgcmV0dXJuIGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCk7XG59IFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzb3J0Rm46IHNvcnRGbixcbiAgICBpZDogaWQsXG4gICAgZGF0ZUZvcm1hdDogZGF0ZUZvcm1hdFxufTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKmpzaGludCBub2RlOnRydWUqL1xuXG52YXIgbW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG52YXIgcmVuZGVyVGFibGUgPSByZXF1aXJlKCcuL3RhYmxlL3RhYmxlJyk7XG52YXIgaWQgPSByZXF1aXJlKCcuL3V0aWwnKS5pZDtcbnZhciBkYXRlRm9ybWF0ID0gcmVxdWlyZSgnLi91dGlsJykuZGF0ZUZvcm1hdDtcblxudmFyIGZldGNoUHJvbWlzZSA9IG1vZGVsLmZldGNoKCk7XG5cbmZldGNoUHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICBpZCgndGl0bGUnKS50ZXh0Q29udGVudCA9IG1vZGVsLnRpdGxlKCk7XG4gICAgaWQoJ3NvdXJjZScpLnRleHRDb250ZW50ID0gbW9kZWwuc291cmNlKCk7XG4gICAgaWQoJ3VwZGF0ZWQnKS50ZXh0Q29udGVudCA9IGRhdGVGb3JtYXQobW9kZWwudXBkYXRlZCgpKTtcblxuICAgIHJlbmRlclRhYmxlKG1vZGVsKTtcbn0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG59KTsiXX0=
