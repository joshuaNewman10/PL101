var thunk = function(f, lst) {
  return {tag: 'thunk', func: f, args:lst};
};


var thunkValue = function(x) {
  return {tag: 'value', value:x};
};

var trampoline = function(thk) { //trampoline eval
  while (true) {
    if (thk.tag === 'value') {
      return thk.value;
    } 
    if (thk.tag ==='thunk') {
      thk = thk.func.apply(null, thk.args);
    }
  }
};

/* Sum */
function sumThunk(n, cont) {
  if (n<=1) {
    return thunk(cont, [1]);
  } else {
      var newCont = function(v) {
        return thunk(cont, [v+n]);
      };
      return thunk(sumThunk, [n-1, newCont]);
  }
}

function sumTen(n) {
  var cont = function(v) {
    return thunkValue(v);
  };
  var thk  =  sumThunk(n, cont);
  return trampoline(thk);
}

//Factorial
function factorialThunk(n, cont) {
  if(n<=1) {
    return thunk(cont, [1]);
  } else {
    var newCont = function(v) {
      return thunk(cont, [v*n]);
    }
    return thunk(factorialThunk, [n-1, newCont]);
  };
}

function factorial(n) {
  var baseCont = function(v) {
    return thunkValue(v);
  };
  var thk = factorialThunk(n, baseCont);
  return trampoline(thk);
}
//Fibonacci
function fibThunk(n, cont) {
  if( n <= 2) {
    return thunk(cont, [1]);
  } else {
    var newCont = function(v) {
      return thunk(cont, [v]);
    };
    return thunk(fibThunk, [n-1, function(x) {
      return thunk(fibThunk, [n-2, function(y) {
        return thunk(newCont, [x+y]);
      }]);
    }]);
  }
}

function fibonacci(n) {
  var baseCont = function(v) {
    return thunkValue(v);
  };
  var thk = fibThunk(n, baseCont);
  console.log(thk);
  return trampoline(thk);
}

function treeThunk(node, cont) {
  if(node === null) {
    return thunk(cont, [0]);
  } 
  var newCont = function(v) {
    return thunk(cont, [v]);
  };
  return thunk(treeThunk, [node.left, function(l){
    return thunk(treeThunk, [node.right, function(r) {
      return thunk(newCont, [l+r+1]);
    }]);
  }]);
}

function nodeCounter(tree) {
  var baseCont = function(v) {
    return thunkValue(v);
  };
  var thk = treeThunk(tree, baseCont);
  return trampoline(thk);
}

//Abstract Syntax Tree (AST)
function astThunk(node, cont) {
  if (typeof node === 'number') {
    return thunk(cont, [node]);
  } 
  var newCont = function(v) {
    return thunk(cont, [v]);
  };
  if(node.tag === '*') {
    return thunk(astThunk, [node.left, function(l) {
      return thunk(astThunk, [node.right, function(r) {
        return thunk(newCont, [l*r]);
      }]);
    }]);
  } else if (node.tag === '/') {
    return thunk(astThunk, [node.left, function(l) {
      return thunk(astThunk, [node.right, function(r) {
        return thunk(newCont, [l/r]);
      }]);
    }]);
  } else if (node.tag === '+') {
    return thunk(astThunk, [node.left, function(l) {
      return thunk(astThunk, [node.right, function(r) {
        return thunk(newCont, [l+r]);
      }]);
    }]);
  } else {
    return thunk(astThunk, [node.left, function(l) {
      return thunk(astThunk, [node.right, function(r) {
        return thunk(newCont, [l-r]);
      }]);
    }]);
  }


  }



function astEval(tree) {
  var baseCont = function(v) {
    return thunkValue(v);
  };
  var thk = astThunk(tree, baseCont);
  return trampoline(thk);
}

var tree = [
   {
      "tag": "*",
      "left": 2,
      "right": {
         "tag": "+",
         "left": 3,
         "right": 4
      }
   }
];

console.log(astEval(tree[0]));

