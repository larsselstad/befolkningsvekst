var row = require('./row');

var tbody = document.getElementById('tbody');

module.exports = function (rows) {
    tbody.innerHTML = '';
    
    rows.forEach(function (r) {
        tbody.appendChild(row(r));
    });
};