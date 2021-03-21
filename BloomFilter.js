/* Based on code from Ruben Taelman and Miel Vander Sande */
/* https://github.com/LinkedDataFragments/Server.js/blob/feature-handlers-amf-2/lib/amf/BloomFilter.js */

const Filter = require('bloem').Bloem,
    _ = require('lodash');

function BloomFilter(tripleStream, probability, callback) {
  let triples = [];
  tripleStream.on('data', (triple) => {
    triples.push([triple.subject.id, triple.predicate.id, triple.object.id]);
  });
  tripleStream.on('end', () => {
    const totalCount = triples.length;
    // Estimate k (number of hash functions) and m (number of bits in bitmap)
    let m = Math.ceil((-totalCount * Math.log(probability)) / (Math.LN2 * Math.LN2)),
        k = Math.round((m / totalCount) * Math.LN2);
    if (Number.isNaN(m))
      m = 0;
    if (Number.isNaN(k))
      k = 0;

    let filters = ['subject','predicate','object'];
    for (let variable in filters)
      filters[variable] = new Filter(m, k);
    triples.forEach((triple) => {
      for (let variable in filters)
        filters[variable].add(Buffer.from(triple[variable]));
    });

    for (let variable in filters) {
      filters[variable] = {
        type: 'http://semweb.mmlab.be/ns/membership#BloomFilter',
        filter: filters[variable].bitfield.buffer.toString('base64'),
        m: m,
        k: k,
      };
    }
    callback(null, filters);
  });
}

module.exports = BloomFilter;