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