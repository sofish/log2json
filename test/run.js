'use strict';

var log2json = require('../');
var path = require('path');
var fs = require('fs');
var map = ['createdAt', 'origin', 'xForwardFor', 'referrer', 'country', 'city',
           'latitude|number', 'longitude|number', 'query|url', 'userAgent', 'arr|array', transform];
var separator = '•-•';
var src = path.join(__dirname, './log');
var dist = path.join(__dirname, './log.json');
var removeSrc = false;
var configure = {map, separator, src, dist, removeSrc, callback};
var configure2 = {map, separator, src, dist: jsonCallback , removeSrc};

var the1stobj = {
  "createdAt": "2015-11-14T23:59:14+08:00",
  "origin": "223.104.14.184",
  "xForwardFor": "-",
  "referrer": "http://opensite.ele.me/place/ww24pej69znn",
  "country": "CN",
  "city": "-",
  "latitude": 35,
  "longitude": 105,
  "query": { "test": "1st" },
  "userAgent": "Mozilla/5.0 (Linux; Android 4.4.4; m1 note Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 Proxy/cootekservice Proxy/cootekservice",
  "arr": [ "a", "b", "c", "d" ],
  "transformed": "fortestonly",
  "notMappedField12": "key is missing"
};

log2json(configure);
log2json(configure2);

function callback(err, ret) {
  if(err) throw err;
  if(ret) console.log(`✓  JSON is generated: ${shortPath(ret.dist)}`);

  test(ret);   // run test
}

function transform(text) {
  var value= '';
  var name = 'transformed';
  if(text) value = text.toLowerCase();
  return {name, value};
}

function jsonCallback(ret) {
  if(ret.length === 8) return console.log('✓  [2] JSON object is returned instead of creating new file');
  console.log('✘  [2] expected an array');
  throw new Error();
}

function test(conf) {
  var json = require(conf.dist);
  var obj = json[0];
  var keys = Object.keys(obj);
  var arr = [];
  var fail = 0;

  // parse keys
  keys = map.map((item, i) => {
    var name = kv(item, obj[item], i);
    if(name.directive) arr[i] = name.directive;
    return name.name || name;
  });

  // test map
  keys.forEach((item, i) => {
    if(keys.indexOf(item) !== -1) {
      if(
        the1stobj[item] === obj[item] ||
        (obj[item] && typeof obj[item] === 'object' && JSON.stringify(the1stobj[item]) === JSON.stringify(obj[item]))
      ) return console.log('✓  mapped as `%s` with right value', item);
      fail++;
      return console.log(`✘  mapped, but the expected value of \`${item}\` is ${the1stobj[item]}`);
    }
    fail++;
    console.log('✘  item is not mapped %s', item);
  });

  if(obj.notMappedField12 === the1stobj.notMappedField12) {
    console.log('✓  when key is missing, should mapped as `notMappedFieldN`, like `%s`', 'notMappedField12');
  } else {
    fail++;
    console.log('✘  notMappedField12 is not mapped');
  }

  var isSrcExists = true;
  try {
    isSrcExists = fs.statSync(configure.src).isFile();
  } catch(e) {
    isSrcExists = false;
  }

  console.log(configure.src);
  var short = shortPath(configure.src);
  if(configure.removeSrc) {
    let icon = isSrcExists ? '✘' : '✓';
    console.log(`${icon}  when \`removeSrc = true\` ${short} should be removed`);
  } else {
    let icon = isSrcExists ? '✓' : '✘';
    console.log(`${icon}  when \`removeSrc = false\` ${short} should exists`);
  }

  console.log();
  console.log('=  SUCCESS: %d, FAIL: %d', Object.keys(the1stobj).length - fail, fail);
  console.log('=  done!\n' );

  if(fail > 0) throw new Error(`${fail} testcases failed`);
}

function kv(name, value, i) {
  if(typeof name === 'function') return name(value).name;
  if(!name) return `notMappedField${i}`;;

  var candidateKey = name.split('|');
  if(candidateKey[1]) return {name: candidateKey[0], directive: candidateKey[1]};

  return name;
}

function shortPath(str) {
  if(str.length < 25) return str;
  return str.slice(0, 10) + '...' + str.slice(-10);
}
