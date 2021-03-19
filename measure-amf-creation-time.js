/*

USAGE: node measure-amf-creation-time [probability]

*/

const AmfBuilder = require('./AmfBuilder');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

console.time("AMF creation time");

let options = {
  amf: {
    probability: process.argv[2] ? parseFloat(process.argv[2]) : 0.001, // 0,1% kans op een false positive
    type: 'BloomFilter',
    dir: `summaries`,
    cache: true
  }
};

const file = path.join('C:\\Users\\thoma\\Documents\\Master\\Masterproef\\Implementatie\\experiments\\ldbc-snb-decentralized',`persons_3500_locations_filepaths.txt`);

const readInterface = readline.createInterface({
  input: fs.createReadStream(file)
});

let numberOfFiles = 0;
let processedFiles = 0;
const pattern = /\/([^\/]+)\.nq/;
readInterface.on('line', (line) => {
  numberOfFiles++;
  let builder = new AmfBuilder(options);
  const datasource = path.join("C:/Users/thoma/Documents/Master/Masterproef/Implementatie/experiments/ldbc-snb-decentralized", line);
  const matchesFilename = line.match(pattern);

  builder.build(datasource, matchesFilename[1], function(err, filter, generated) {
    if (err)
      console.log(err);
    else {
      if((++processedFiles % 1000) === 0) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${processedFiles/1000}K bloomfilters generated or retrieved`);
      }
      if(processedFiles === numberOfFiles)
        endTimer();
    }
  });
});

function endTimer() {
  console.log("\n");
  console.timeEnd("AMF creation time");
}
