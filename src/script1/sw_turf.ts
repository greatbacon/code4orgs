import * as fs from 'fs';
import * as csv from 'csv';
import {parse} from 'csv-parse';
import {stringify} from 'csv-stringify/sync';
import * as path from 'path';

const TURFSIZE = 10;

const destPath = __dirname
let recordCount = 0
let fileIndex = 1;  

let header: undefined;
const outputs = new Map();

function writeRecord(fileIndex: number, record: any) {
      if (!fileIndex) {          
        console.log('no fileIndex');
          return;
      }
      if (!outputs.has(fileIndex)) {
          const p = path.join(destPath, `${fileIndex}.csv`);
          console.log('Output file:', p);
          const output = fs.createWriteStream(p);
          output.on('error', (err) => {
              console.error(`Unable to write to output file "${p}". Does the output direcotry exist?`);
              console.error(err);
              process.exit(1);
          });
          outputs.set(fileIndex, output);
          csv.stringify([header], (err, s) => {
              if (!err) {
                  output.write(s);
              }
          });
      }
      csv.stringify([record], (err, s) => {
          if (err) {
              return console.error(err);
          }
          outputs.get(fileIndex).write(s);
      });
  }


const parser = csv.parse();

parser.on('error', (err) => {
    console.error('Unable to parse the input file(s). Is it in valid CSV format?');
    console.error(err);    
});

parser.on('readable', () => {
    let record;
    while (record = parser.read()) {
      //console.log(record,recordCount,fileIndex);
      if (header === undefined) {
        header = record
    } else {        
        if (record[2] !== -1){
            writeRecord(record[2],record);        
        }
        
        //console.log(record,recordCount,fileIndex);
    }        
    }
});

const INPUTPATH = path.join('src/script2/sw_transform_output.csv');
console.log('Input file: ', INPUTPATH);
fs.createReadStream(INPUTPATH).pipe(parser);