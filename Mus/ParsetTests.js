var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs');

//read file contents
var data = fs.readFileSync('my.peg', 'utf-8');
console.log(data);

//create my parser
var parse = PEG.buildParser(data).parse;
console.log(parse);
//Tests
assert.deepEqual(parse("ca"), "ca", "parse Canada");