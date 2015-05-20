function base(name) {
  return {tag: 'basetype', name: name};
}

function arrow(left, right) {
  return {tag: 'arrowtype', left:left, right: right};
}

function prettyType(type) {
  if (type.tag === 'basetype') {
    return type.name;
  }
  return '(' + prettyType(type.left) + ' -> ' + prettyType(type.right) + ')';
}

function lookup(env, v) {
  if (!env.hasOwnProperty('bindings')) {
    throw new Error(v + ' not found');
  }
  if (env.bindings.hasOwnProperty(v)) {
    return env.bindings[v];
  }
  return lookup(env.outer, v);
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
    throw new Error('Type Error');
  } else if (!sameType(aType, bType)) {
    throw new Error('Type Error');
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
    throw new Error('Not an arrow type');
  }
  var uType = aType.left;
  var vType = aType.right;
  //verify arg types match
  if (sameType(uType, bType) === false) {
    throw new Error('Argument type did not match');
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

function tester(expr, cx) {
  var t = typeExpr(expr, cx);
  console.log(t);

}

var context = {bindings: {
  'x':base('string'),
  '+':arrow(base('num'), arrow(base('num'), base('num'))),
  '<':arrow(base('num'), arrow(base('num'), base('bool')))
}};


// tester(['lambda-one', 'x', base('num'), 5], { });  //num-->num
   
// tester(['lambda-one', 'x', base('num'), 5], context); //num-->num with x typed

tester(['lambda-one', 'x', base('num'), 'x'], { });  //num--> num



