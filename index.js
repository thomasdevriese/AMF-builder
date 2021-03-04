/*

USAGE: node index [scalefactor] [probability]

*/

const AmfBuilder = require('./AmfBuilder');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const scalefactor = process.argv[2] || '0.3';

let options = {
  amf: {
    probability: process.argv[3] ? parseFloat(process.argv[3]) : 0.001, // 0,1% kans op een false positive
    type: 'BloomFilter',
    dir: `summaries_SF_${scalefactor}`,
    cache: true
  }
};

const file = path.join('C:\\Users\\thoma\\Documents\\Master\\Masterproef\\Implementatie\\experiments\\ldbc-snb-decentralized',`SF_${scalefactor}_filepaths.txt`);

const readInterface = readline.createInterface({
  input: fs.createReadStream(file)
});

let counter = 0;
const pattern = /\/([^\/]+)\.nq/;
readInterface.on('line', (line) => {
  let builder = new AmfBuilder(options);
  const datasource = path.join("C:/Users/thoma/Documents/Master/Masterproef/Implementatie/experiments/ldbc-snb-decentralized", line);
  const matchesFilename = line.match(pattern);

  builder.build(datasource, matchesFilename[1], function(err, filter, generated) {
    if (err)
      console.log(err);
    else {
      if((++counter % 1000) === 0) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${counter/1000}K bloomfilters generated or retrieved`);
      }
      // if (generated) {
      //   console.log(`\nBloomfilter ${counter}: ${matchesFilename[1]} generated\n`);
      // }
      // else {
        // console.log(filter);
        // process.stdout.write(`Bloomfilter ${counter} retrieved from cache`);
      // }
    }
  });
});