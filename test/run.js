'use strict';

var logFormat = require('../');
var path = require('path');
var map = ['createdAt', 'origin', 'xForwardFor', 'referrer', 'country', 'city',
           'latitude|number', 'longitude|number', 'query|url', 'userAgent', 'arr|array', transform];
var separator = '•-•';
var src = path.join(__dirname, './log');
var dist = path.join(__dirname, './log.json');
var removeSrc = false;
var configure = {map, separator, src, dist, removeSrc};

var the1stobj = {
  "createdAt": "2015-11-14T23:59:14+08:00",
  "origin": "223.104.14.184",
  "xForwardFor": "-",
  "referrer": "http://opensite.ele.me/place/ww24pej69znn",
  "country": "CN",
  "city": "-",
  "latitude": 35,
  "longitude": 105,
  "query": {
    "test": "1st"
  },
  "userAgent": "Mozilla/5.0 (Linux; Android 4.4.4; m1 note Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 Proxy/cootekservice Proxy/cootekservice",
  "arr": [
    "a",
    "b",
    "c",
    "d"
  ],
  "transformed": "fortestonly"
};

logFormat(configure, ret => {
  if(!ret) console.log('✓ it\'s an empty file');
  if(ret) console.log(`✓  JSON is generated: ${ret}`);

  // run test
  test(ret);
});

function transform(text) {
  var value= '';
  var name = 'transformed';
  if(text) value = text.toLowerCase();
  return {name, value};
}

function test(path) {
  var json = require(path);
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
      return console.log(`✖  mapped, but the expected value of \`${item}\` is ${the1stobj[item]}`);
    }
    fail++;
    console.log('✖  item is not mapped %s', item);
  });

  if(!obj.notMappedField12 === 'key is missing') {
    console.log('✓  when key is missing, will mapping as `notMappedFieldN`, like `%s`', 'notMappedField12');
  } else {
    fail++;
    console.log('✖  notMappedField12 is not mapped');
  }

  console.log();
  console.log('=  SUCCESS: %d, FAIL: %d', Object.keys(the1stobj).length - fail, fail);
  console.log('=  done!\n' );
}

function kv(name, value, i) {
  if(typeof name === 'function') return name(value).name;
  if(!name) return `notMappedField${i}`;;

  var candidateKey = name.split('|');
  if(candidateKey[1]) return {name: candidateKey[0], directive: candidateKey[1]};

  return name;
}