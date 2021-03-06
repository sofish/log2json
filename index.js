'use strict';

const fs = require('fs');
const ENCODING = 'utf-8';
const format = { url, array, number };
const keys = Object.keys(format);
const STOP = 5000;
const _extend = require('util')._extend;

module.exports = function parser(configure) {

  /* Input Parser:
   * @param {object} configure
   *    {
   *      src:        'path/to/src/file',                         // {string}
   *      dist:       'path/to/dist/file',                        // {string}
   *      separator:  '•-•',                                      // {string|regexp} beware about to choose a right one
   *      removeSrc:  true                                        // {boolean} [optional] by default is true

   *      map:        ['filedName', fn, 'name|FORMAT', ...]       // {array}
   *
   *                  // 1. {string} fieldName, the key/value pairs' key
   *                  // 2. {function} fn, a transform function, accept an argument, the origin value,
   *                  //    it returns an object { name, value }, eg. the fn may translating the origin value -
   *                  //    `foo=bar&hello=world` to { name: 'query, value: { 'foo: 'bar', hello: 'world' } }
   *                  // 3. {string} separate the filedName and built-in format to transform the origin value
   *                  //    eg. 'name|url' will parse the origin value as a queryString
   *
   *      callback: callback(err, result)
   *                  // {string} result
   *                  // 1. if the file is empty, returns an empty string and won't create a new file
   *                  // 2. if a new file is created returns the file path
   *    }
   */

  var defaults = {
    removeSrc: true,
    cacheArray: [],
    first: 1,
    count: 0,
    buffer: '',
    callback: () => {}
  };

  configure = _extend(defaults, configure);
  var stream = fs.createReadStream(configure.src, ENCODING);

  stream.on('data', process.bind(stream, configure));
  stream.on('error', function() {
    this.emit('end'); // drop file
  });
  stream.on('end', () => {
    if(typeof configure.dist === 'string') {
      if(configure.first) {
        fs.writeFileSync(configure.dist, '[]');
      } else {
        append(configure);
        fs.appendFileSync(configure.dist, ']');
      };
    } else {
      configure.dist(configure.cacheArray.slice());
    }

    // remove empty file
    if(configure.first || configure.removeSrc) fs.unlink(configure.src, () => {});

    configure.cacheArray.length = 0;
    configure.callback(null, configure);
  });

}

/* Process file with stream
 * @param {object} configure
 * @param {string} ret, string read as stream in one time
 */
function process(configure, ret) {
  ret = configure.buffer + ret;
  var pos = ret.lastIndexOf('\n');
  configure.buffer = ret.slice(pos + 1);
  ret = ret.slice(0, pos);
  ret = ret.split(/\n+/);
  ret = ret.map(item => item && mapper(item.split(configure.separator), configure.map));

  if(!ret.length) return;
  configure.count += ret.length;

  if(configure.first && typeof configure.dist === 'string' ) {
    configure.first = 0;
    fs.writeFileSync(configure.dist, '[');
  }

  if(configure.cacheArray.length > STOP) {
    // if configure.dist is a function, instead of creating a new file, exec it with the result
    // the result should be an array
    typeof configure.dist === 'string' ? append(configure) : configure.dist(configure.cacheArray.slice());
    return configure.cacheArray.length = 0;
  }

  configure.cacheArray.push.apply(configure.cacheArray, ret);
};

/* Append data to file
 * @param {object} configure
 */
function append(configure) {
  fs.appendFileSync(configure.dist, JSON.stringify(configure.cacheArray).slice(1, -1));
}

/* Mapper: mapping fields with a specific map
 * @param {array} fields
 * @param {array} map
 * @param {array} [{}, {}, {}, ...]
 */
function mapper(fields, map) {
  var obj = {};
  fields.forEach((cur, i) => {
    let kv = pair(map[i], cur, i);
    obj[kv.name] = kv.value;
  });
  return obj;
}

/* Generate a proper key / value pair
 * @param {string|function} key
 */
function pair(name, value, i) {
  if(typeof name === 'function') return name(value);
  if(!name) return {name: `notMappedField${i}`, value};

  var candidateKey = name.split('|');
  var directive = candidateKey[1];
  if(keys.indexOf(directive) !== -1) return {name: candidateKey[0], value: format[directive](value)};

  return {name, value};
}

/* Transform queryString to object
 * @param {string} queryString
 */
function url(queryString) {
  queryString = decodeURIComponent(queryString);
  queryString = queryString.split('&');
  return queryString.reduce((ret, url) => {
    url = url.split('=');
    var key = url[0];
    var val = url[1];

    // EXAMPLE: key[]=bar&key[]=world =>
    //  ret = { key: ['bar', 'world'] }
    if(key.slice(-2) === '[]') {
      key = key.slice(0, -2);
      ret[key] ? ret[key].push(val) : (ret[key] = [val]);

      // EXAMPLE: key[foo]=bar&key[hello]=world =>
      //  ret = { key: {foo: 'bar', hello: 'world'} }
    } else if(key.match(/\[\w+\]$/)) {
      let keys = key.split(/\[|\]/);
      let subkey = keys[1];
      key = keys[0];

      if(!ret[key]) ret[key] = {};
      ret[key][subkey] = val;
    } else {
      ret[key] = val;
    }
    return ret;
  }, {});
}

// Transform a `,` separated string to array
function array(text) {
  return text.split(',');
}

// Transform string to number
function number(str) {
  return +str;
}
