/*globals document, module*/

module.exports = function (row, cellType) {
    return row.reduce(function (tr, next) {
        var td = document.createElement(cellType || 'td');

        td.textContent = next;

        tr.appendChild(td);
        
        return tr;
    }, document.createElement('tr'));
};