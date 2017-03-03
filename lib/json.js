/**
 * @module json
 * A simple read/write module for interacting with the JSON config files.
 */

fs = require('fs');
module.exports = {
    getContents: getContents,
    saveContents: saveContents
}

/**
 * @function getContents
 * @description Retrieves the JSON data as an object.
 * @param {string} file The file to open.
 * @returns {Object} The object from the file.
 */
function getContents(file){
    var obj = JSON.parse(fs.readFileSync(file + '.json'));
    obj.fileURL = file + '.json';
    return obj;
}

/**
 * @function saveContents
 * @description Modifies the JSON file for the object.
 * @param {Object} The object to update.
 */
function saveContents(obj){
    fs.writeFile(obj.fileURL, JSON.stringify(obj), function(err){
        if(err){
            console.log('Unable to update file ' + obj.fileURL);
        }
    })
}