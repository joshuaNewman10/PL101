var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs');

//read file contents
var data = fs.readFileSync('mparser.peg', 'utf-8');
console.log(data);

//create the parser
var parse = PEG.buildParser(data).parse;

//Unit Tests

var note = 'a4'[100];
var seq = 'a4'[100] 'b2'[200] 'c3'[400] 'd4'[200];
assert.deepEqual(parse(note), [{"tag": "note", "pitch": "a4", "dur": "100"}]);
//assert.deepEqual(parse(note), [{'a4'[100] 'b2'[200] 'c3'[400] 'd4'[200]

	'par' 'a4'[100] 'a2'[100]
	
	'rep'[3] 'a4'[100] 'a2'[100]