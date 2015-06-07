/*jshint node:true*/

// polyfilling
require('es6-promise').polyfill();
require('whatwg-fetch');

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