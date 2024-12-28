"use strict";
exports.__esModule = true;
var fs = require("fs");
var csv = require("csv");
var path = require("path");
var TURFSIZE = 10;
var destPath = __dirname;
var recordCount = 0;
var fileIndex = 1;
var header;
var outputs = new Map();
function writeRecord(fileIndex, record) {
    if (!fileIndex) {
        console.log('no fileIndex');
        return;
    }
    if (!outputs.has(fileIndex)) {
        var p_1 = path.join(destPath, "".concat(fileIndex, ".csv"));
        console.log('Output file:', p_1);
        var output_1 = fs.createWriteStream(p_1);
        output_1.on('error', function (err) {
            console.error("Unable to write to output file \"".concat(p_1, "\". Does the output direcotry exist?"));
            console.error(err);
            process.exit(1);
        });
        outputs.set(fileIndex, output_1);
        csv.stringify([header], function (err, s) {
            if (!err) {
                output_1.write(s);
            }
        });
    }
    csv.stringify([record], function (err, s) {
        if (err) {
            return console.error(err);
        }
        outputs.get(fileIndex).write(s);
    });
}
var parser = csv.parse();
parser.on('error', function (err) {
    console.error('Unable to parse the input file(s). Is it in valid CSV format?');
    console.error(err);
});
parser.on('readable', function () {
    var record;
    while (record = parser.read()) {
        //console.log(record,recordCount,fileIndex);
        if (header === undefined) {
            header = record;
        }
        else {
            console.log(record);
            if (record[2] !== -1) {
                writeRecord(record[2], record);
            }
            //console.log(record,recordCount,fileIndex);
        }
    }
});
var INPUTPATH = path.join('src/script2/sw_transform_output.csv');
console.log('Input file: ', INPUTPATH);
fs.createReadStream(INPUTPATH).pipe(parser);
