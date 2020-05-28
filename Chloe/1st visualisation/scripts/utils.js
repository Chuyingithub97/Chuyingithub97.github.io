function getCurrentDate(date) {
    var dd = date.getDate();
    var mm = date.getMonth() + 1; //January == 0
    var yyyy = date.getFullYear();
    if (dd < 10) {
        dd = "0" + dd;
    }
    if (mm < 10) {
        mm = "0" + mm;
    }
    return dd + "." + mm + "." + yyyy;
}

function getCurrentTime(date) {
    var hh = date.getHours();
    var mm = date.getMinutes();
    var ss = date.getSeconds();

    if (hh < 10) {
        hh = "0" + hh;
    }

    if (mm < 10) {
        mm = "0" + mm;
    }

    if (ss < 10) {
        ss = "0" + ss;
    }

    return hh + ":" + mm + ":" + ss;
}