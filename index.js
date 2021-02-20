const AmfBuilder = require('./AmfBuilder');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

let options = {
  amf: {
    probability: 0.001, // 0,1% kans op een false positive
    type: 'BloomFilter',
    dir: 'filters',
    cache: true
  }
};

const file = process.argv[2] || './sources/persons_1500_filenames';

const readInterface = readline.createInterface({
  input: fs.createReadStream(file)
});

let counter = 0;
readInterface.on('line', (line) => {
  let builder = new AmfBuilder(options);
  let datasource = path.join("C:/Users/thoma/Documents/Master/Masterproef/Implementatie/experiments/ldbc-snb-decentralized/out-fragments/http/localhost_3000/www.ldbc.eu/ldbc_socialnet/1.0/data", line);
  let filename = line.slice(0,-3);
  builder.build(datasource, filename, function(err, filter, fromCache) {
    if (err)
      console.log(err);
    else {
      if (fromCache)
        console.log(`Bloomfilter ${++counter} generated`);
      else
        console.log(filter);
    }
  });
});