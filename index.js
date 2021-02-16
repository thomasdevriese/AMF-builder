const AmfBuilder = require('./AmfBuilder');

let options = {
  amf: {
    probability: 0.001, // 0,1% kans op een false positive
    // probability: 0.5, // 50% kans op een false positive
    type: 'BloomFilter',
    dir: 'filters',
    cache: true
  }
};

let builder = new AmfBuilder(options);
let datasource = process.argv[2] || './sources/thomas.ttl';
let filename = process.argv[3] || 'thomas';
builder.build(datasource, filename, function(err, filter) {
  if (err)
    console.log(err);
  else
    console.log(filter);
});
