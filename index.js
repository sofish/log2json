'use strict';

const fs = require('fs');
const ENCODING = 'utf-8';
const format = { url, array, number };
const keys = Object.keys(format);

module.exports = parser;

function parser(configure, callback) {

  /* Input Parser:
   * @param {object} configure
   *    {
   *      src:        'path/to/src/file',                         // {string}
   *      dist:       'path/to/dist/file',                        // {string}
   *      separator:  '•-•',                                      // {string|regexp} beware about to choose a right one
   *
   *      map:        ['filedName', fn, 'name|FORMAT', ...]       // {array}
   *
   *                  // 1. {string} fieldName, the key/value pairs' key
   *                  // 2. {function} fn, a transform function, accept an argument, the origin value,
   *                  //    it returns an object { name, value }, eg. the fn may translating the origin value -
   *                  //    `foo=bar&hello=world` to { name: 'query, value: { 'foo: 'bar', hello: 'world' } }
   *                  // 3. {string} separate the filedName and built-in format to transform the origin value
   *                  //    eg. 'name|url' will parse the origin value as a queryString
   *      removeSrc:  true                                        // {boolean} by default is true
   *    }
   *  @param {function} callback(result)
   *                  // {string} result
   *                  // 1. if the file is empty, returns an empty string and won't create a new file
   *                  // 2. if a new file is created returns the file path
   */

  if(typeof configure.removeSrc === 'undefined') configure.removeSrc = true;
  fs.readFile(configure.src, ENCODING, (err, ret) => {
    if(err) throw err;

    // file is empty
    if(!ret) callback('');

    // separate with new line
    ret = ret.split(/\n+/);
    ret = ret.map(item => item && mapper(item.split(configure.separator), configure.map));

    fs.writeFile(configure.dist, JSON.stringify(ret), err => {
      if(err) throw err;
      if(configure.removeSrc) fs.unlinkSync(configure.src); // remove src file when done
      callback(configure.dist);
    });
  });
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
      key = key[0];

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
