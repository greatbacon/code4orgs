import * as fs from 'fs';
import * as csv from 'csv';
import * as path from 'path';
import { finished } from 'stream';
const GeoJsonGeometriesLookup = require('geojson-geometries-lookup');
const nodeGeocoder = require('node-geocoder');

const destPath = __dirname;
let outputName = 'output';  
const OUTPUT = path.join(destPath, `${outputName}.csv`);
const GEOJSON_FILE = 'denver_council_districts_2023.geojson'
const THROTTLE = 1000;

export interface Record {
    name: string,
    phone: string,
    district: string,
}

const records: Record[] = [];

const delay = async (ms: number) => new Promise(res => setTimeout(res, ms));

const procesFile = async (): Promise<Record[]> => {
    //Load the GeoJSON file and pass it to the lookup library
    //https://github.com/simonepri/geojson-geometries-lookup
    const map = JSON.parse(fs.readFileSync(GEOJSON_FILE,'utf8'));
    const glookup = new GeoJsonGeometriesLookup(map);

    //initialize the geocoder
    //https://github.com/d3/d3-geo#geoContains
    let geoCoder = nodeGeocoder({provider: 'openstreetmap'});        


    const INPUTPATH = path.join('sample.csv');
    console.log('Input file: ', INPUTPATH);
    //Load file from input path
    const parser = fs.createReadStream(INPUTPATH).pipe( csv.parse({delimiter: ',', columns: true}));

    parser.on('error', (err) => {
        console.error('Unable to parse the input file(s). Is it in valid CSV format?');
        console.error(err);    
    });

    parser.on('readable', async () => {        
        let record: any;
        while ((record = parser.read()) !== null) {
            //Geocode the address record into a latitude, longitude value (x,y)
            //https://javascript.plainenglish.io/an-introduction-to-geocoding-using-node-js-fe1a5d3aa05c
            await delay(THROTTLE);
            const response = await geoCoder.geocode(record['address'] + record['city'] + record['state'] + record['zip']);
            let district = "unknown";
            if (response.length > 0 && response !== (null || undefined)){
                console.log("$",response[0]);                    
                //TODO Convert lat & long to point
                const point = {type: "Point", coordinates: [response[0].longitude,response[0].latitude]}
                //TODO See what polygon point is in & add to CSV   
                const result = glookup.getContainers(point);     
                district = result.features[0].properties.DISTRICT_N
            } else {
                console.warn("address not found for", record['name']);
            }
            
                   
            
            const row = {
                //split the name column into a first and last name column
                name: record['name'].split(" ")[0],        
                //rename mobile_phone to phone
                phone: record['mobile_phone'],        
                //drop the unneeded 'con_dist' column
                district: district
            }            

            records.push(row);
        }

        //Take the transformed csv and turn it into a string
        csv.stringify(records,{header: true})
        //Write it to the output file
        .pipe(fs.createWriteStream(OUTPUT))
        console.log("!",records);
    })

    
        

 
        
    

    
    return new Promise((resolve) =>  {
        resolve(records);
    })
}


const result = procesFile();
result.then((value) => 
{   
    console.log("##",value);    
})
