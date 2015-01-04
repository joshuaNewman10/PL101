//Setting up Recursion
var add_binding = function (env, v, val) { //adds binding at top-most level
    env.bindings[v] = val;
    return env;
};

//Supports lambdas!!!
var evalScheem = function (expr, env) {
    if (typeof expr === 'number') {
        return expr;
    }
    if (typeof expr === 'string') {
        return lookup(env, expr);
    }
    // Look at head of list for operation
    switch (expr[0]) {
        case '+':
            return evalScheem(expr[1], env) +
                   evalScheem(expr[2], env);
        case 'lambda-one':
            
            var param = expr[1];
            var body = expr[2];
            return function(a) {
                var bnd = {};
                bnd[param] = a;
                var newEnv = {bindings:bnd,outer:env};
                return evalScheem(body,newEnv);
                
              
            };
        default:
            // Simple application
            var func = evalScheem(expr[0], env);
            var arg = evalScheem(expr[1], env);
            return func(arg);
    }
};

//Supports Function Application
var evalScheem = function (expr, env) {
    if (typeof expr === 'number') {
        return expr;
    }
    if (typeof expr === 'string') {
        return lookup(env, expr);
    }
    // Look at head of list for operation
    switch (expr[0]) {
        case '+':
            return evalScheem(expr[1], env) +
                   evalScheem(expr[2], env);
        case 'quote':
            return expr[1];
        default:
            var res = evalScheem(expr[1],env);
            var func = evalScheem(expr[0],env);
            return func(res);
    }
};

//Supports the 'let' function & crucially does temporary environments
var evalScheem = function (expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
        return expr;
    }
    // Strings are variable references
    if (typeof expr === 'string') {
        return lookup(env, expr);
    }
    // Look at head of list for operation
    switch (expr[0]) {
        case '+':
            return evalScheem(expr[1], env) +
                   evalScheem(expr[2], env);
        case 'let-one':
            var val = evalScheem(expr[2],env);
            var bnds = {};
            bnds[expr[1]] = val;
            var newenv = {bindings:bnds, outer:env};
            return evalScheem(expr[3],newenv);
            
    }
};

//Updates correct environment's var with new val
var update = function (env, v, val) {
    if(!(env.hasOwnProperty('bindings'))) {
      throw new Error(v + ' not found');   
    }
    if(env.bindings.hasOwnProperty(v)) {
      env.bindings[v] = val;
      return val;
    }
    return update(env.outer,v,val);
};

//looks for var in any envrionemnt (goes inner to outer)
var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings')))
        throw new Error(v + " not found");
    if (env.bindings.hasOwnProperty(v))
        return env.bindings[v];
    return lookup(env.outer, v);
};