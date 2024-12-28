"use strict";
exports.__esModule = true;
var fs = require("fs");
var csv = require("csv");
var path = require("path");
var destPath = __dirname;
var outputName = 'sw_transform_output';
var OUTPUT = path.join(destPath, "".concat(outputName, ".csv"));
//Initialize the csv parser (reads in the file)
var parser = csv.parse({ delimiter: ',', columns: true });
parser.on('error', function (err) {
    console.error('Unable to parse the input file(s). Is it in valid CSV format?');
    console.error(err);
});
var INPUTPATH = path.join('workbook.csv');
console.log('Input file: ', INPUTPATH);
//Load file from input path
fs.createReadStream(INPUTPATH)
    //Pase it to the parser initalized above
    .pipe(parser)
    //Transform the csv data
    .pipe(csv.transform(function (input) {
    return {
        //split the name column into a first and last name column
        first_name: input['first_name'],
        //rename mobile_phone to phone
        phone: input['can2_phone'],
        list: input['Turnout List']
    };
}))
    //Take the transformed csv and turn it into a string
    .pipe(csv.stringify({ header: true }))
    //Write it to the output file
    .pipe(fs.createWriteStream(OUTPUT));
