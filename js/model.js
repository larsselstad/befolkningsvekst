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