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