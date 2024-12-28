import * as fs from 'fs';
import * as csv from 'csv';
import * as path from 'path';

const destPath = __dirname
let outputName = 'sw_transform_output';  
const OUTPUT = path.join(destPath, `${outputName}.csv`);

//Initialize the csv parser (reads in the file)
const parser = csv.parse({delimiter: ',', columns: true});

parser.on('error', (err) => {
    console.error('Unable to parse the input file(s). Is it in valid CSV format?');
    console.error(err);    
});



const INPUTPATH = path.join('workbook.csv');
console.log('Input file: ', INPUTPATH);
//Load file from input path
fs.createReadStream(INPUTPATH)
//Pase it to the parser initalized above
.pipe(parser)
//Transform the csv data
.pipe(csv.transform((input) => {
    return {
        //split the name column into a first and last name column
        first_name: input['first_name'],        
        //rename mobile_phone to phone
        phone: input['can2_phone'],
        list: input['Turnout List'],
        //drop the unneeded 'con_dist' column
    }
}))
//Take the transformed csv and turn it into a string
.pipe(csv.stringify({header: true}))
//Write it to the output file
.pipe(fs.createWriteStream(OUTPUT))