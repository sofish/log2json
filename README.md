![](https://travis-ci.org/sofish/log2json.svg)

# Log2JSON

Log2JSON is a small lib that allows you to transform nginx/apache/whatever
logs to JSON.

## Usage

Run it like:

```js
var log2json = require('log2json');

log2json(configure, ret => {
  if(!ret) return console.log('the file is empty');
  console.log('JSON is generated: %s', ret);
});
```

Follow the codes below to generate the `configure` object.

```js
var path = require('path');


var separator = '•-•';                          // separator of the log
var src = path.join(__dirname, './log');        // path of the log
var dist = path.join(__dirname, './log.json');  // the generated JSON file
var removeSrc = true;                           // remove the log when JSON is
                                                //  generated, by default is true
var map = [                                     // map the fields with keys

  'fieldName2',             // 1. {string} name to the filed
  fn2TransformData,         // 2. a custom function to transform the field
                            //    should return an object {name, value}
  'fieldName|number',       // 3. use built-in directive to
                            //    transform the field
  'fieldName|url',          //    built-in directives: number, url, array
  'fieldName|array'         //    - `number` transform string to number
                            //    - `array` transform 'a,b' to ["a","b"]
                            //    - `url` transform querystring to object
                            //      'a=b&c[]=d&c[]=e' to {a:"b", c: ["d", "e"]}
];

// a transform function should return an object like {name, value}
function fn2TransformData(input) {
  var name = 'transformed';
  var value = doSomethingWith(value);
  return {name, value};
}

// what we need
var configure = {map, separator, src, dist, removeSrc};
```

## Test

simply run `npm test` on your favor terminal app.
