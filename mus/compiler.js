/**********************************************
Note:
  MUS--->High Level Language
  NOTE-->Low  Level  Language (bytecode language)

**********************************************/




/*
  Adding note to front of MUS Expression
*/
var prelude = function(expr) {
    return {tag:'seq',
            left:{tag:'note',pitch:'d4',dur:500},
            right:expr
           };
}

/*
  Reverses MUS sequence
*/
var reverse = function(e) {
  var expr = {};
    if(e.tag ==='note') {
      return e;
    } else {
        expr.tag = 'seq';
        expr.left = reverse(e.right);
        expr.right = reverse(e.left);
    }
    return expr;
};

/*
  Calculates End Time of musical sequence
*/
var endTime = function(time,expr) { 
  var duration = time;
    recurs(expr);
    function recurs(tree) {
        if(tree.tag ==='note') {
          duration +=tree.dur;
        } else {
          recurs(tree.left);
          recurs(tree.right);
        }     
    }
   return duration;
};

/*
  Compiles MUS language into note
*/
var compile = function (musexpr) {
    var output = [];
    var curTime = 0;
    recurs(musexpr);
    function recurs(tree) {
        if(tree.tag==='note') {
            output.push({tag:'note',pitch:tree.pitch,
                         start:curTime,dur:tree.dur});
            curTime +=tree.dur;
        } else {
            recurs(tree.left);
            recurs(tree.right);
        }
    }
    return output;
};

/*
  Play from MUS Expr (Assume playNOTE (The interpreter has been implemented))
*/
var playMUS = function(expr) {
  return playNOTE(compile(expr));
};

/*
Tests
*/
var melody_mus = 
    { tag: 'seq',
      left: 
       { tag: 'seq',
         left: { tag: 'note', pitch: 'a4', dur: 250 },
         right: { tag: 'note', pitch: 'b4', dur: 250 } },
      right:
       { tag: 'seq',
         left: { tag: 'note', pitch: 'c4', dur: 500 },
         right: { tag: 'note', pitch: 'd4', dur: 500 } } };

console.log(melody_mus);
console.log(compile(melody_mus));

/**********************************************
Chord Extension
**********************************************/
var endTime = function(time,expr) { 
  var duration = time;
    if(expr.tag==='par' || expr.tag==='note') return recurs(expr);
    recurs(expr);
    function recurs(tree) {
        if(tree.tag ==='note') {
            return tree.dur;
        } else if(tree.tag ==='par'){
          var leftDur = tree.left ?  recurs(tree.left) : 0;
          var rightDur = tree.right ? recurs(tree.right) : 0;
          return Math.max(leftDur,rightDur);
        } else {
          
          var leftTime = tree.left ? recurs(tree.left) : 0;
          var rightTime = tree.right ? recurs(tree.right) : 0;
          
          duration += leftTime;
          duration += rightTime;
          return 0; //seq needs to return 0 to a seq call
        }     
    }
   return duration;
};

function compile(musExpr) {
    var output = [];
    var curTime = 0;
    var chordEndTime = 0;
    var ischord = false; 
    recurs(musExpr);
    function recurs(tree) {
      if(tree.tag==='note') {
          output.push({tag:'note',pitch:tree.pitch,
                    start:curTime,dur:tree.dur});
        if(!isChord) {
          curTime +=tree.dur;
        }
      } else if (tree.tag==='par') {
          ischord = true;
          chordEndTime = endTime(curTime,tree);
          recurs(tree.left);
          recurs(tree.right);
          curTime = chordEndTime;
          ischord = false;
      } else {
          recurs(tree.left);
          recurs(tree.right);
     }
    }
    return output;
}

/**********************************************
Rest Extension
**********************************************/
var endTime = function(time,expr) { 
  var duration = time;
    if(expr.tag==='par' || expr.tag==='note') return recurs(expr);
    recurs(expr);
    function recurs(tree) {
        if(tree.tag ==='note' || tree.tag==='rest') {
            return tree.dur;
        } else if(tree.tag ==='par'){
          var leftDur = tree.left ?  recurs(tree.left) : 0;
          var rightDur = tree.right ? recurs(tree.right) : 0;
          return Math.max(leftDur,rightDur);
        } else {
          
          var leftTime = tree.left ? recurs(tree.left) : 0;
          var rightTime = tree.right ? recurs(tree.right) : 0;
          
          duration += leftTime;
          duration += rightTime;
          return 0; //seq needs to return 0 to a seq call
        }     
    }
   return duration;
};

function compile(musExpr) {
    var output = [];
    var curTime = 0;
    var chordEndTime = 0;
    var ischord = false; 
    recurs(musExpr);
    function recurs(tree) {
      if(tree.tag==='note') {
          output.push({tag:'note',pitch:tree.pitch,
                    start:curTime,dur:tree.dur});
        if(!isChord) {
          curTime +=tree.dur;
        }
      } else if(tree.tag==='rest') {
          output.push({tag:'rest',pitch:null,start:curTime,dur:tree.dur});
          curTime +=tree.dur;
      } else if (tree.tag==='par') {
          ischord = true;
          chordEndTime = endTime(curTime,tree);
          recurs(tree.left);
          recurs(tree.right);
          curTime = chordEndTime;
          ischord = false;
      } else {
          recurs(tree.left);
          recurs(tree.right);
     }
    }
    return output;
}

/**********************************************
MIDI Notation Extension
**********************************************/

function convertPitch(pitch) {
  var dict = {a:9,b:11,c:0,d:2,e:4,f:5,g:7};
  
  pitch = pitch.split('');
  octave = pitch[1];
  note = pitch[0];
  var midNum = 12 + 12 * octave + dict[note];
  return midNum;
}

function toMIDI(compiledNote) {
   return compiledNote.map(function(note,i,collect){
    if(note.tag=='rest') return note;
    var tempNote = {tag:'note',midiNote:convertPitch(note.pitch),start:note.start,dur:note.dur};
    return tempNote;
   });
}

/**********************************************
Repeat Extension
**********************************************/
var endTime = function(time,expr) { 
  var duration = time;
    if(expr.tag==='par' || expr.tag==='note') return recurs(expr);
    recurs(expr);
    function recurs(tree) {
        if(tree.tag === 'note' || tree.tag === 'rest') {
            return tree.dur; //doesnt handle time itself

        } else if(tree.tag ==='par'){
          var leftDur = tree.left ?  recurs(tree.left) : 0;
          var rightDur = tree.right ? recurs(tree.right) : 0;
          return Math.max(leftDur,rightDur); //doesnt handle time itself

        } else if(tree.tag === 'repeat') {
          var repTime = 0;
          var numReps = tree.count;
          while((numReps--) > 0) {
            repTime += tree.section.left ? recurs(tree.section.left) : 0;
            repTime += tree.section.right ? recurs(tree.section.right) : 0;
          }
          duration += repTime;
          return 0; //handles time itself
        } else {
          
          var leftTime = tree.left ? recurs(tree.left) : 0;
          var rightTime = tree.right ? recurs(tree.right) : 0;
          
          duration += leftTime;
          duration += rightTime;
          return 0; //handles time itself
        }     
    }
   return duration;
};

function compile(musExpr) {
    var output = [];
    var curTime = 0;
    var chordEndTime = 0;
    var isChord = false; 
    recurs(musExpr);
    function recurs(tree) {
      if(tree.tag==='note') {
          output.push({tag:'note',pitch:tree.pitch,
                    start:curTime,dur:tree.dur});
        if(!isChord) {
          curTime +=tree.dur;
        }
      } else if(tree.tag==='repeat') {
          var numReps = tree.count;
          while((numReps--) > 0) {
            recurs(tree.section.left);
            recurs(tree.section.right);
          }
        
      } else if(tree.tag==='rest') {
          output.push({tag:'rest',pitch:null,start:curTime,dur:tree.dur});
          curTime +=tree.dur;
      } else if (tree.tag==='par') {
          isChord = true;
          chordEndTime = endTime(curTime,tree);
          recurs(tree.left);
          recurs(tree.right);
          curTime = chordEndTime;
          isChord = false;
      } else {
          recurs(tree.left);
          recurs(tree.right);
     }
    }
    return output;
}
/*
  Test
*/
var melody_mus = 
    { tag: 'seq',
      left: 
     { tag: 'repeat', count:2, section: {
         left: { tag: 'note', pitch: 'a4', dur: 250 },
         right: { tag: 'seq', 
               left:{tag: 'note', pitch: 'c4', dur: 500},
               right:{tag: 'note', pitch: 'd4', dur: 500},}
     }
     },
      right:
       { tag: 'par',
         left: { tag: 'note', pitch: 'c5', dur: 500 },
        right: { tag: 'note', pitch: 'd5', dur: 500 } }  };

console.log(toMIDI(compile(melody_mus)));