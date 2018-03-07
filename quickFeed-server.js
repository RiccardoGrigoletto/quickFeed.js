var fs = require('fs');
var jsonfile = require('jsonfile');

var resultsJSON = null;
var resultsPath = null;

exports.readFile = function readFile(filePath) {

    resultsPath = filePath;
    var file;
    //check if the json file exists
    if (!fs.existsSync(filePath)) {
        // if not create one file in the same path of the caller file
        file = fs.openSync(filePath, 'w');
        var fileContent = "{\"creation-date\":\"" + (new Date()) + "\",\"answer\":[],\"path\":[]}";
        fs.writeFileSync(filePath,fileContent);

    }
    else {
        try {
            // try to read json
            file = jsonfile.readFileSync(filePath);
        }
        catch (err) {
            console.error(err);
            return false;
        }
    
    }
    resultsJSON = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return true;
}

// add an answer to the json
exports.add = function add(type,answer) {  
    var resultsFile = resultsJSON;
    //check if the results file exists and is a json
    try {
        // try to read json
        fs.readFileSync(resultsPath);
    }
    catch (err) {
        console.error(err);
        return false;
    }
    //check if the id of the answer exists
    var idFound = false;
    var count = 0;
    if (type == "query") {
        resultsFile.answer.forEach (function(result) {
            if (result.id === answer.body.id) {
                var mapFound = false;
                result.values.forEach(function (map) {
                    if (map.key === answer.body.value) {
                        mapFound = true;
                        map.value++;
                    }
                });
                if (!mapFound) {
                    var newAnswer= {
                        key: answer.body.value,
                        value: 1
                    }
                    resultsFile.answer[count].values.push(newAnswer);
                }
                idFound = true;
            }
            count++;
        });
        //else create it
        if (!idFound) {
            var obj = {
                id: answer.body.id,
                type: answer.body.type,
                values : [
                    {
                        key: answer.body.value,
                        value: 1
                    }
                ]
            }
            resultsFile.answer.push(obj);
        }
    }
    

    //tracking
    if (type === "time" || type === "click" || type === "over") {
        var element;
        var path = answer.body.URLPath;
        var pathFound = false;
        if (path != "undefined") {
            resultsFile.path.forEach(function (i) {
                if (i.id === path) {
                    pathFound = true;
                    element = i;
                }
            });
        }
        if (!pathFound) {
            var newElement = JSON.parse(getNewTracker(path));
            resultsFile.path.push(newElement);
            element = newElement;
        }
        
        //time-spent
        if (type === "time") {
            var browserFound = false;
            element.time_spent.forEach(function(result) {
                if (result.browser != "undefined" && result.browser == answer.body.browser && !browserFound) {
                    result.time_spent = parseFloat(answer.body.time) + parseFloat(result.time_spent);
                    browserFound = true;
                }
            });
            if (!browserFound) {
                var newBrowser = {
                    browser: answer.body.browser,
                    time_spent: parseFloat(answer.body.time),
                };
                element.time_spent.push(newBrowser);
            }
        }

        //click
        if (type === "click") {
            element.clicks.forEach(function(device) {
                if (answer.body.screen_type == device.screen_size && answer.body.path === device.path) {
                    device.clickMatrix[answer.body.clickX][answer.body.clickY] += 1;
                }
            });
        }
        //over
        if (type === "over") {
            var pathFound = false;
            element.over.forEach(function(device) {
                if (answer.body.screen_type == device.screen_size && answer.body.path === device.path) {
                    device.overMatrix[answer.body.overX][answer.body.overY] += 1;
                }
            });
        }
        jsonfile.writeFileSync(resultsPath,resultsFile);
    }
    return true;
    
}

function getJSONMatrix(size) {
    var res = "";
    for (var i=0; i<size; i++) {
        res = res.concat("[");
        for (var j=0; j<size; j++) {
            res = res.concat("0,");
        }
        res = res.substring(0,res.length-1);
        res = res.concat("],");
    }
    return res.substring(0,res.length-1);
}

function getNewTracker(path) {
        var res= "{\"id\":\""+path+"\",\"time_spent\":[],\"clicks\":[{\"screen_size\":\"desktop\",\"clickMatrix\":[";
        var matrixForJSON = getJSONMatrix(50)
        //click desktop matrix
        res = res.concat(matrixForJSON);   
        //click tablet matrix
        res = res.concat("]},{\"screen_size\":\"tablet\",\"clickMatrix\":[");
        res = res.concat(matrixForJSON);            
        //click mobile matrix        
        res = res.concat("]},{\"screen_size\":\"mobile\",\"clickMatrix\":[");
        res = res.concat(matrixForJSON);  
        res = res.concat("]}],\"over\":[{\"screen_size\":\"desktop\",\"overMatrix\":[")
        res = res.concat(matrixForJSON);        
        res = res.concat("]},{\"screen_size\":\"tablet\",\"overMatrix\":[");
        res = res.concat(matrixForJSON);            
        res = res.concat("]},{\"screen_size\":\"mobile\",\"overMatrix\":[");
        res = res.concat(matrixForJSON);            
        res = res.concat("]}]}");
        return res;
}