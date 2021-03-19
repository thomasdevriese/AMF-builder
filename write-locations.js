/*

USAGE: node write-locations [number_of_persons]

*/

/*

This script uses a file containing the paths of a given number of rdf files each containing a person's data, and creates a file containining these same paths + the paths of the rdf files each containing a location's information. These are the locations the persons live in.

*/

const fs = require('fs'),
    path = require('path'),
    RdfParser = require('rdf-parse').default,
    readline = require('readline');

const numberOfPersons = process.argv[2] || '10';

const personsLocationsFilepaths = path.join('C:/Users/thoma/Documents/Master/Masterproef/Implementatie/experiments/ldbc-snb-decentralized', `persons_${numberOfPersons}_locations_filepaths.txt`);
const writestream = fs.createWriteStream(personsLocationsFilepaths, {flags:'a'});

const personsFilepaths = path.join('C:/Users/thoma/Documents/Master/Masterproef/Implementatie/experiments/ldbc-snb-decentralized',`persons_${numberOfPersons}_filepaths.txt`);

if(fs.existsSync(personsFilepaths)) {
  let locations = new Set();
  let numberOfFiles = 0;
  let processedFiles = 0;

  const readInterface = readline.createInterface({
    input: fs.createReadStream(personsFilepaths)
  });

  readInterface.on('line', (line) => {
    numberOfFiles++;

    // First write the original (person) paths to the file
    writestream.write(line + '\n');

    const datasource = path.join('C:/Users/thoma/Documents/Master/Masterproef/Implementatie/experiments/ldbc-snb-decentralized', line);
    const readstream = fs.createReadStream(datasource);
    readstream.on('error', (err) => {
      if(err.code === 'ENOENT')
        throw new Error('Path not valid');
      else
        throw new Error(err);
    });
    const tripleStream = RdfParser.parse(readstream, { contentType: 'text/turtle' });
    tripleStream.on('error', (err) => {
      throw new Error('Could not retrieve data from datasource');
    });
    tripleStream.on('data', (triple) => {
      if(triple.predicate.id === 'http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/isLocatedIn') {
        locations.add(triple.object.id.split('/')[5]);
        if(numberOfFiles === ++processedFiles)
          writeLocations(locations);
      }
    });
  });
} else {
  throw new Error(`File doesn't exist`);
}

function writeLocations(locations) {
  for (const location of locations) {
    writestream.write(`out-fragments/http/localhost_3000/dbpedia.org/resource/${location}.nq\n`);
  }
}
