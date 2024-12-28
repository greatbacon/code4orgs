"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var csv = require("csv");
var path = require("path");
var GeoJsonGeometriesLookup = require('geojson-geometries-lookup');
var nodeGeocoder = require('node-geocoder');
var destPath = __dirname;
var outputName = 'output';
var OUTPUT = path.join(destPath, "".concat(outputName, ".csv"));
var GEOJSON_FILE = 'denver_council_districts_2023.geojson';
var THROTTLE = 1000;
var records = [];
var delay = function (ms) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, new Promise(function (res) { return setTimeout(res, ms); })];
}); }); };
var procesFile = function () { return __awaiter(void 0, void 0, void 0, function () {
    var map, glookup, geoCoder, INPUTPATH, parser;
    return __generator(this, function (_a) {
        map = JSON.parse(fs.readFileSync(GEOJSON_FILE, 'utf8'));
        glookup = new GeoJsonGeometriesLookup(map);
        geoCoder = nodeGeocoder({ provider: 'openstreetmap' });
        INPUTPATH = path.join('sample.csv');
        console.log('Input file: ', INPUTPATH);
        parser = fs.createReadStream(INPUTPATH).pipe(csv.parse({ delimiter: ',', columns: true }));
        parser.on('error', function (err) {
            console.error('Unable to parse the input file(s). Is it in valid CSV format?');
            console.error(err);
        });
        parser.on('readable', function () { return __awaiter(void 0, void 0, void 0, function () {
            var record, response, district, point, result_1, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!((record = parser.read()) !== null)) return [3 /*break*/, 3];
                        //Geocode the address record into a latitude, longitude value (x,y)
                        //https://javascript.plainenglish.io/an-introduction-to-geocoding-using-node-js-fe1a5d3aa05c
                        return [4 /*yield*/, delay(THROTTLE)];
                    case 1:
                        //Geocode the address record into a latitude, longitude value (x,y)
                        //https://javascript.plainenglish.io/an-introduction-to-geocoding-using-node-js-fe1a5d3aa05c
                        _a.sent();
                        return [4 /*yield*/, geoCoder.geocode(record['address'] + record['city'] + record['state'] + record['zip'])];
                    case 2:
                        response = _a.sent();
                        district = "unknown";
                        if (response.length > 0 && response !== (null || undefined)) {
                            console.log("$", response[0]);
                            point = { type: "Point", coordinates: [response[0].longitude, response[0].latitude] };
                            result_1 = glookup.getContainers(point);
                            district = result_1.features[0].properties.DISTRICT_N;
                        }
                        else {
                            console.warn("address not found for", record['name']);
                        }
                        row = {
                            //split the name column into a first and last name column
                            name: record['name'].split(" ")[0],
                            //rename mobile_phone to phone
                            phone: record['mobile_phone'],
                            //drop the unneeded 'con_dist' column
                            district: district
                        };
                        records.push(row);
                        return [3 /*break*/, 0];
                    case 3:
                        //Take the transformed csv and turn it into a string
                        csv.stringify(records, { header: true })
                            //Write it to the output file
                            .pipe(fs.createWriteStream(OUTPUT));
                        console.log("!", records);
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/, new Promise(function (resolve) {
                resolve(records);
            })];
    });
}); };
var result = procesFile();
result.then(function (value) {
    console.log("##", value);
});
