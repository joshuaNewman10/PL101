  

function thunk(f) {
  var args = Array.prototype.slice.call(arguments,1);
  return {tag:'thunk', func:f, args:args};
}

var trampoline = function (thk) {
    while (true) {
        if (thk.tag === "value") {
            return thk.val;
        } else if (thk.tag === "thunk") {
            thk = thk.func.apply(null, thk.args);
        } else {
            throw new Error("Bad thunk");
        }
    }
};

var trampolineCounter = function (thk) {
    var cnt = 0;
    while (true) {
        if (thk.tag === "value") {
            return { value: thk.val, count: cnt };
        } else if (thk.tag === "thunk") {
            thk = thk.func.apply(null, thk.args);
            cnt++;
        } else {
            throw new Error("Bad thunk");
        }
    }
};

var evalTwo = function (expr0, expr1, env) {
    var i = 0;
    var res0 = stepStart(expr0, env);
    var res1 = stepStart(expr1, env);
    
    while(!res0.done && !res1.done) {
      i+=1;
      if (i%2 === 0) {
        step(res0);
        step(res1);
      } else {
        step(res1);
        step(res0);
      }
    } 
    if (!res0.done) {
        while(!res0.done) {
          step(res0);
        }
    }
    if (!res1.done) {
        while(!res1.done) {
          step(res1);
        }
    }
       
};
var evalFull = function (expr, env) {
    var state = stepStart(expr, env);
    while(!state.done) {
        step(state);
    }
    return state.data;
};
var stepStart = function (expr, env) {
    return { 
        data: evalExpr(expr, env, thunkValue),
        done: false
    };
};
var step = function (state) {
    if (state.data.tag === "value") {
        state.done = true;
        state.data = state.data.val;
    } else if (state.data.tag === "thunk") {
        state.data = state.data.func.apply(
            null, state.data.args);
    } else {
        throw new Error("Bad thunk");
    }
};

trampoline(
    evalExpr(
        ['+', 1, ['throw']], 
        { }, thunkValue, thunkValue))
=== 'EXCEPTION!'

var evalExpr = function(expr, env, cont, xcont) {
    if (typeof expr === 'number') {
      return thunk(cont, expr);
    }

    if (typeof expr === 'string') {
      return thunk(cont, lookup(env,expr));
    }
    if (expr[0] === '*') {
      return thunk(
        evalExpr, expr[1], env,
        function(v1) {
          return thunk(
            evalExpr, expr[2], env,
            function(v2) {
              return thunk(cont, v1 * v2);
            }, xcont
          );
        }, xcont
      );
    } else if (expr[0] === '/') {
        return evalDiv(expr[1], expr[2], env, cont, xcont);
    } else if (expr[0] === '+') {
        return thunk(
          evalExpr, expr[1], env,
          function(v1) {
            return thunk(
              evalExpr, expr[2], env,
              function(v2) {
                return thunk(cont, v1 + v2);
              }, xcont
            );
          }, xcont
        );
    } else if (expr[0] === 'set!') {
        return thunk(
          evalExpr, expr[1], env,
          function(v) {
            update(env, expr[1], v);
            return thunk(cont, 0);
          }, xcont
        );
    } else if (expr[0] === 'try') {
        return thunk(
          evalExpr, expr[1], env, cont,
          function(v) {
            return thunk(evalExpr, expr[2], env, cont, xcont
            );
          }
        );
    } else if (expr[0] === 'throw') {
        return thunk(xcont, 'EXCEPTION!');
    } else {
        throw new Error("Unknown Form");
    }
};


var evalDiv = function (top, bottom, env, cont, xcont) {
    // Here's the code for addition
    // to help you get going.
    return thunk(
        evalExpr, top, env,
        function(v1) {
            return thunk(
                evalExpr, bottom, env,
                function(v2) {
                    if(v2 === 0) {
                        console.log('hi');
                        return thunk(xcont, 'EXCEPTION!');
                    } else {
                    return thunk(cont, v1 / v2);
                    }
            }, xcont);
    }, xcont);
};
