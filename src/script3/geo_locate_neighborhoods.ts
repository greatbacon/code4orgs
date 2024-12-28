import * as fs from 'fs';
import * as csv from 'csv';
import * as path from 'path';
import { finished } from 'stream';
const GeoJsonGeometriesLookup = require('geojson-geometries-lookup');
const nodeGeocoder = require('node-geocoder');

const destPath = __dirname;
let outputName = 'output';  
const OUTPUT = path.join(destPath, `${outputName}.csv`);
let unknownName = 'unknowns';
const UNKNOWNS = path.join(destPath, `${unknownName}.csv`);
let unmatchedName = 'unmatched';
const UNMATCHED = path.join(destPath, `${unmatchedName}.csv`);
const GEOJSON_FILE = 'denver_neighborhoods.geojson'

export interface Record {
    first: string,
    last: string,
    phone: string,
    neighborhood: string,
    address?: string,
}

const records: Record[] = [];
const unknowns: Record[] = [];
const unmatched: Record[] = [];

const delay = async (ms: number) => new Promise(res => setTimeout(res, ms));

const procesFile = async (): Promise<Record[]> => {
    //Load the GeoJSON file and pass it to the lookup library
    //https://github.com/simonepri/geojson-geometries-lookup
    const map = JSON.parse(fs.readFileSync(GEOJSON_FILE,'utf8'));
    const glookup = new GeoJsonGeometriesLookup(map);

    //initialize the geocoder
    //https://github.com/d3/d3-geo#geoContains
    let geoCoder = nodeGeocoder({provider: 'openstreetmap'});        


    const INPUTPATH = path.join('members.csv');
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
            //206 unknown
            const min = 1000;
            const max = 5000;
            const randomInRange = Math.floor(Math.random() * (max - min + 1)) + min;
            await delay(randomInRange);
            const zip = record['zip'].split('-')[0]
            const address = record['address'].split(',')[0];
            const query = address +' '+ record['city'] +' '+ record['state'] +' '+ zip;            
            const response = await geoCoder.geocode(query);
            let neighborhood = "unknown";
            if (response.length > 0 && response !== (null || undefined)){
                //console.log("$",response[0]);                    
                //TODO Convert lat & long to point
                const point = {type: "Point", coordinates: [response[0].longitude,response[0].latitude]}
                //TODO See what polygon point is in & add to CSV   
                const result = glookup.getContainers(point);                
                if (result.features[0] && result.features[0].properties){
                    neighborhood = result.features[0].properties.NBHD_NAME
                } else {                    
                    neighborhood = "unmatched"
                }
                
            } else {
                //console.warn("address not found for", record['first'], record['last']);                               
            }
            
                   
            
            const row = {                
                first: record['first'],        
                last: record['last'],        
                phone: record['phone'],                        
                neighborhood: neighborhood
            } as Record           
            //Only show members in Ruby Hill or Athmar Park
            if (neighborhood === "unknown"){
                row.address = address;
                unknowns.push(row);
            } else if (neighborhood === "unmatched"){
                row.address = address;
                unmatched.push(row);
            } else {
                records.push(row);
            }
            
        }

        //Take the transformed csv and turn it into a string
        csv.stringify(records,{header: true}).pipe(fs.createWriteStream(OUTPUT));
        csv.stringify(unknowns,{header: true}).pipe(fs.createWriteStream(UNKNOWNS));
        csv.stringify(unmatched,{header: true}).pipe(fs.createWriteStream(UNMATCHED));
        //console.log("!",records);
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
