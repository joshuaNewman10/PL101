function evalTortoise(str, env) {
  try {
    var parse = TORTOISE.parse(str);
    var interpreted = evalFull(parse, env);
  } catch(e) {
    console.log("somethign went wrong " + e);
  }
  return interpreted;
}

var globalEnv = {bindings: {}, outer: {}};


function thunk(f) {
  var args = Array.prototype.slice.call(arguments, 1);
  return {tag:'thunk', func: f, args: args};
}

function thunkValue(x) {
  return {tag: 'value', value:x};
}

function evalFull(expr, env) {
  var state = stepStart(expr, env);
  while(!state.done) {
    step(state);
  }
  return state.data;
}

function stepper(env, val, cont) { //helper function when defining var value
  var state;
  if(!val.data) {
    state = {data:val, done:false}
  } else {
    state = val;
  }
  while(!state.done) {
    step(state);
  }
  return cont? cont(state.data) : state.data;
}

function stepStart(expr, env) {
  return {
    data: evalStatements(expr, env, thunkValue),
    done: false
  };
}

function step(state) {
  if(state.data.tag === 'value') {
    state.done = true;
    state.data = state.data.value;
  } else if (state.data.tag === 'thunk') {
      state.data = state.data.func.apply(null, state.data.args);
  } else {
      throw new Error('Bad Thunk');
  }
}

var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings'))) {
      throw new Error(v + " not found");
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

//Updates correct environment's var with new val
var update = function (env, v, val) {
  if(!(env.hasOwnProperty('bindings'))) {
    return addBinding(env, v, val);
  }
  if(env.bindings.hasOwnProperty(v)) {
    env.bindings[v] = val;
    return val;
  }
  return update(env.outer, v, val);
};

function evalStatements(seq, env, cont) {
  var i;
  var val = undefined;
  for(i=0; i<seq.length; i++) {
    val = evalStatement(seq[i], env, cont);
  } 
  return val;
}

function evalStatement(stmt, env, cont) {
  var val = undefined;
  if(!(stmt.tag)) {
    return evalExpr(stmt, env, cont);
  }
  if (stmt.tag === 'ignore') { //single expression
    return evalExpr(stmt.body, env, cont); 
  } else if (stmt.tag === 'var') {
      addBinding(env, stmt.name, 0);
      return thunk(cont, 0);
  } else if (stmt.tag === ':=') {
      val = evalExpr(stmt.right, env, cont);
      update(env, stmt.left, stepper(env, val));
      return val;
  } else if (stmt.tag === 'if') {
    return thunk(
      evalExpr, stmt.expression, env,
      function(cond) {
        if(cond) {
          return thunk(evalStatements, stmt.i, env, cont);
        } else {
          return thunk(evalStatements, stmt.e, env, cont);
        }
      }
    );
  } else if (stmt.tag === 'repeat') {
      return thunk(
        evalExpr, stmt.expression, env,
        function(count) {
          while(--count >0) {
            val = evalStatements(stmt.body, env, cont);
          }
          return val;
        }
      );
  } else if (stmt.tag === 'define') {
      //name args body
      var newFunc = function() {
        var i;
        var newEnv;
        var newBindings = {};
        var thunkArgs = arguments[0];
        var cont = arguments[1];

        for(i=0; i<stmt.args.length; i++) {
          newBindings[stmt.args[i]] = stepper(env, thunkArgs[i]);
        }

        newEnv = {bindings:newBindings, outer:env};
        return thunk(
          evalStatements, stmt.body, newEnv, cont
        );
      };
      addBinding(env, stmt.name, newFunc);
      return thunk(cont, 0);
  } else {
     return evalExpr(stmt, env, cont);
  }
}

function evalExpr(expr, env, cont) { //recursive Tortoise expression Eval
  //primitives
  if(typeof expr === 'number') {
    return thunk(cont, expr);
  }
  //Simple built in binary operators
  if (expr.tag === 'ident') {
    return thunk(cont, lookup(env, expr.name));
  } else if (expr.tag === '<') {
      return thunk(
        evalExpr, expr.left, env,
        function(v1) {
          return thunk(
            evalExpr, expr.right, env,
            function(v2) {
              return thunk(cont, v1 < v2);
            }
          );
        }
      );
  } else if (expr.tag === '>') {
      return thunk(
        evalExpr, expr.left, env,
        function(v1) {
          return thunk(
            evalExpr, expr.right, env,
            function(v2) {
              return thunk(cont, v1 > v2);
            }
          );
        }
      );
  } else if (expr.tag === '+') {
      return thunk(
        evalExpr, expr.left, env,
        function(v1) {
          return thunk(
            evalExpr, expr.right, env,
            function(v2) {
              return thunk(cont, v1 + v2);
            }
          );
        }
      );
  } else if (expr.tag === '-') {
      return thunk(
        evalExpr, expr.left, env,
        function(v1) {
          return thunk(
            evalExpr, expr.right, env,
            function(v2) {
              return thunk(cont, v1 - v2);
            }
          );
        }
      );
  } else if (expr.tag === '*') {
      return thunk(
        evalExpr, expr.left, env,
        function(v1) {
          return thunk(
            evalExpr, expr.right, env,
            function(v2) {
              return thunk(cont, v1 * v2);
            }
          );
        }
      );
  } else if (expr.tag === '/') {
      return evalDiv(expr.left, expr.right, env, cont);
  } else if (expr.tag === 'call') {
      var func = lookup(env, expr.name);
      var envArgs = [];
      var i=0;
      for(; i<expr.args.length; i++) {
        envArgs.push(evalExpr(expr.args[i], env, cont));
      }
      return thunk(func, envArgs, cont);
  }
}

function evalDiv(top, bottom, env, cont) {
  return thunk(
    evalExpr, top, env,
    function(v1) {
      return thunk(
        evalExpr, bottom, env,
        function(v2) {
          return thunk(cont, v1 / v2);
        }
      );
    }
  );
}