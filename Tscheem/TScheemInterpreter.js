var bnd = {
   '+':function(a, b) {
      return a+b;
   },
   '-':function(a, b) {
      return a-b;
   },
   '*':function(a, b) {
      return a*b;
   },
   '/':function(a, b) {
      return a/b;
   },
   '=':function(a, b) {
      return a===b ? '#t' : '#f';
   },
   '<':function(a, b) {
      return a<b ? '#t' : '#f';
   },
   '>':function(a, b) {
      return a>b ? '#t' : '#f';
   },
   'car':function(list) {
      return list[0];
   },
   'cdr':function(list) {
      return list.slice(1);
   },
   'cons':function(elem, list) {
     list.unshift(elem);
     return list;
   },
  'curr+':function(a) {
    return function(b) {
      return a+b;
    };
  },
  'curr-':function(a) {
    return function(b) {
      return a-b;
    };
  },
  'curr*':function(a) {
    return function(b) {
      return a*b;
    };
  },
  'curr/':function(a) {
    return function(b) {
      return a/b;
    };
  },
  'curr=':function(a) {
    return function(b) {
      return a==b ? '#t' : '#f';
    };
  },
  'curr>':function(a) {
    return function(b) {
      return a>b ? '#t' : '#f';
    };
  },
  'curr<':function(a) {
    return function(b) {
      return a<b ? '#t' : '#f';
    };
  },
  'currcar':function(list) {
      return list[0];
   },
   'currcdr':function(list) {
      return list.slice(1);
   },
   'currcons':function(elem, list) {
     list.unshift(elem);
     return list;
   },

};
//var globalEnv = {bindings: bnd, outer: {}};
var globalEnv = {bindings:bnd, outer: {}};
var typedEv = { bindings: {
    'x': base('string'),
    '+': arrow(base('num'), 
               arrow(base('num'), base('num'))),
    '<': arrow(base('num'),
               arrow(base('num'), base('bool'))) } };
//Updates correct environment's var with new val
var update = function (env, v, val) {
    if(!(env.hasOwnProperty('bindings'))) {
      return addBinding(env,v,val);
    }
    if(env.bindings.hasOwnProperty(v)) {
      env.bindings[v] = val;
      return val;
    }
    return update(env.outer,v,val);
};

var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings'))) {
      return addBinding(env, v, 0);
    }
    if (env.bindings.hasOwnProperty(v)) {
      return env.bindings[v];
    }
    return lookup(env.outer, v);
};

//adds binding at top-most level
var addBinding = function(env, v, val) {
    if(!(env.hasOwnProperty('bindings'))) {
      var bndg = {};
      bndg[v] = val;
      env.outer = {};
      env.bindings = bndg;
    }
    env.bindings[v] = val;
    return env;
};

var evalScheem = function (expr, env) { 
  if (expr === 'error') throw('Error');
  //Variable Defining and Setting 
  if (expr[0] === 'define') { //update
      var defVar = expr[1];
      var defVal = evalScheem(expr[2], env);
      addBinding(env, defVar, defVal);
      return 0;
  } else if (expr[0] === 'set!') { //update
      var setVar = expr[1];
      var setVal = evalScheem(expr[2], env);
      update(env, setVar, setVal);
      return 0;
  }
  //Dealing with 'primitive values'
  if (typeof expr === 'number') {
    return expr;
      return expr;
  } else if (typeof expr === 'string') {
      return lookup(env, expr);
  }else if (expr[0] === 'quote') {
      return expr.slice(1)[0];

  //Array of actions to be taken
  } else if (expr[0] === 'begin') {
      var beginExprs = expr.slice(1);
      var beginRes;
      beginExprs.forEach(function(e){
        beginRes = evalScheem(e,env);
      });
    return beginRes;
  } else if (expr[0] === 'if') {
    var ifRes = evalScheem(expr[1],env);
    return ifRes === '#t' ? evalScheem(expr[2],env) : evalScheem(expr[3],env);
  } else if(expr[0] === 'lambda') {
      var params = expr[1];
      var body = expr[2];
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var bnd = {};
        if(typeof params === 'string') {
          bnd[params] = args[0];
        } else {
            for(var i=0; i<params.length; i++) {
              bnd[params[i]] = args[i]; 
            }
        }
        var lambdaEnv = {bindings:bnd, outer:env};
        return evalScheem(body, lambdaEnv);
      }
  //Types of actions
  } else if (expr[0] === 'lambda-one') {
      var param = expr[1];
      var body = expr[2];
      return function(a) {
        var bnd = {};
        bnd[param] = a;
        var lambdaOneEnv = {bindings:bnd, outer:env};
        return evalScheem(body,lambdaOneEnv);
      };
  } else if (expr[0].indexOf('curr') > -1) {
     var func = evalScheem(expr[0], env);
     var args = expr.slice(1);
     args = args.map(function(arg) {
       return evalScheem(arg, env);
     });
     var res = func.call(env, args[0]);
     return res.apply(env, args.slice(1));

  } else {
     return undefined; 
   }
};


function evalScheemString(str,env) {
  var parsed = SCHEEM.parse(str);
  return evalScheem(parsed ,env);
}


function base(name) {
  return {tag: 'basetype', name: name};
}

function arrow(left, right) {
  return {tag: 'arrowtype', left:left, right: right};
}

function prettyType(type) {
  if(!type.tag) {
    return typeof type;
  }
  if (type.tag === 'basetype') {
    return type.name;
  }
  return '(' + prettyType(type.left) + ' -> ' + prettyType(type.right) + ')';
}

function sameType(a, b) {
  if (a.tag === 'basetype' && b.tag === 'basetype') {
    return a.name === b.name;
  } else if (a.tag === 'arrowtype' && b.tag === 'arrowtype') {
    return sameType(a.left, b.left) && sameType(a.right, b.right);
  } else {
    return false;
  }
}

function typeExprIf(expr, cx) {
  var cond = expr[1];
  var a = expr[2];
  var b = expr[3];

  var condType = typeExpr(cond, cx);
  var aType = typeExpr(a, cx);
  var bType = typeExpr(b, cx);

  if (condType.name !== 'bool') {
    return 'Type Error';// throw new Error('Type Error');
  } else if (!sameType(aType, bType)) {
    return 'Type Error'; // throw new Error('Type Error');
  } else {
    return aType;
  }
}

function typeExpr(expr, cx) {
  if (typeof expr === 'number') {
    return {tag: 'basetype', name: 'num'};
  }
  if (typeof expr === 'string') {
    return lookup(cx, expr);
  }
  if (typeof expr === 'boolean') {
    return {tag: 'basetype', name: 'bool'};
  }
  if (expr[0] === 'if') {
    return typeExprIf(expr, cx);
  }
  if (expr[0] === 'lambda-one') {
    return typeExprLambdaOne(expr, cx);
  }
  //Application (a,b)
  var a = expr[0];
  var b = expr[1];
  var aType = typeExpr(a, cx);
  var bType = typeExpr(b, cx);
  //check a is arrow type
  if (aType.tag !== 'arrowtype') {
    return 'Type Error';// throw new Error('Not an arrow type');
  }
  var uType = aType.left;
  var vType = aType.right;
  //verify arg types match
  if (sameType(uType, bType) === false) {
    return 'Type Error';// throw new Error('Argument type did not match');
  }
  return vType;
}

function typeExprLambdaOne(expr, cx) {
  var param = expr[1];
  var paramType = expr[2];
  var bnd = {};
  bnd[param] = paramType;
  var newCx = {bindings: bnd, outer: cx};
  var bodyType = typeExpr(expr[3], newCx);
  return prettyType(arrow(paramType, bodyType));
}

function typeHandler(expr, cx) {
  return prettyType(typeExpr(expr, cx));
}

function compile(expr, cx) {
  var val = expr[0];
  var expected = expr[1];
}
