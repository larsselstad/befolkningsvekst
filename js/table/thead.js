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