/* Based on code from Ruben Taelman and Miel Vander Sande */
/* https://github.com/LinkedDataFragments/Server.js/blob/feature-handlers-amf-2/lib/amf/AmfBuilder.js */

const fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    RdfParser = require('rdf-parse').default,
    request = require('request');

function AmfBuilder(options) {
  if (!(this instanceof AmfBuilder))
    return new AmfBuilder(options);
  options = options || {};

  let amf = options.amf || {};
  this._probability = amf.probability || 0.001;

  let type = amf.type || 'BloomFilter';
  this._constructor = require('./' + type);

  // setup cache
  let folder = path.join(__dirname, amf.dir || 'filters');
  if (!fs.existsSync(folder))
    fs.mkdirSync(folder);
  this._cache = amf.cache ? {
    get: function (key, filename, callback) {
      let subfolder = filename,
          triple = ['subject', 'predicate', 'object'],
          cacheEmpty = false,
          i = 0;
      while(i <= 2 && !cacheEmpty) {
        try {
          data = fs.readFileSync(path.join(folder, subfolder, key + '.' + triple[i] + '.' + type + '.json'));
          callback(null, JSON.parse(data));
          i++;
        } catch(err) {
          if (err && err.code === 'ENOENT') {
            cacheEmpty = true; // file has not been found, cache entry is empty
            callback(null);
          }
          else if (err) {
            cacheEmpty = true;
            callback(err);
          }
        }
      }
    },
    put: function (key, filename, filter, callback) {
      let subfolder = path.join(folder, filename);
      if (!fs.existsSync(subfolder))
        fs.mkdirSync(subfolder);
      let triple = ['subject', 'predicate', 'object'], i = 0;
      triple.forEach((term) => {
        fs.writeFileSync(path.join(subfolder, key + '.' + term + '.' + type + '.json'), JSON.stringify(filter[i]), callback || function (error) {
          if(error) console.log(error);
        });
        i++;
      });
    },
  } : {
    get: function (key, filename, callback) {
      callback && callback(null);
    },
    put: function (key, filename, value, callback) {
      callback && callback(null);
    },
  };
}

// construct AMF
AmfBuilder.prototype.build = function (datasource, filename, callback) {
  // First try the cache
  let self = this,
      cache = this._cache,
      key = filename + '.' + this._probability.toString().replace('.', '_');

  cache.get(key, filename, function (error, filter) {
    if (error)
      callback(error);
    else if (filter)
      callback(null, filter);
    else {
      // nothing in cache
      // get the data source
      let stream;
      if(datasource.slice(0,4) === "http")
        stream = request(datasource);
      else
        stream = fs.createReadStream(datasource);
      stream.on('error', (err) => {
        if(err.code === 'ENOENT')
          callback(new Error('Datasource ' + datasource + ' not valid'));
        else
          callback(new Error(err));
      });
      let tripleStream = RdfParser.parse(stream, { contentType: 'text/turtle' });
      tripleStream.on('error', (err) => {
        callback(new Error('Could not retrieve data from datasource'));
      });
    
      self._constructor(tripleStream, self._probability, function (error, filter) {
        if (error)
          callback(error);
        else {
          callback(null, filter, true);
          // Save filter to cache
          cache.put(key, filename, filter);
        }
      });
    }
  });
  return true;
};

module.exports = AmfBuilder;