


/**********************************************
Parsing using pegjs http://pegjs.org/

pegjs takes in plaintext grammar rules

When given sequence input will output JS Array List by defaultq
**********************************************/


/****************
Digit Grammar
*****************
start =
  digit

digit =
  [0-9]

/****************
Upper Case Char Grammar
*****************
 start = 
  char

 char =
  [A-Z]

/****************
Course Number
*****************
start =
  coursenum

digit = 
  [0-9]

coursenum =
  [1-3] digit digit 

/********************************************************
Course Number with parse action to modify output
*********************************************************
start =
  coursenum

digit = 
  [0-9]

coursenum =
  first:[1-3] second:digit third: digit
  {return parseInt("" + first + second + third); }

/********************************
LowerCase Letter Country Code
*********************************
start =
    countrycode

lcChar =
  [a-z]
  
countrycode =
    first: lcChar second: lcChar
    {return "" + first + second}
    
/************************
Integers With Repeated Digit (RegEx)
*************************
start =
  integer

digit = 
  [0-9]

integer =
  first: [1-9] rest: digit*
  {return first + rest.join("");}

/***************************************************************
Decimal and Octal Numbers (If starts with "0" then is octal)
****************************************************************

start = 
 number

number =
  octal
  /decimal

decimal =
   "0"
     {return 0;}
    / first: [1-9] rest : [0-9]*
    {return parseInt(first + rest.join(''));}


octal =
  "0" digits: [0-7]+
  {return parseInt(digits.join(''),8);}

/***************************************************************
Word made of lowercase and uppercase parser
****************************************************************

start =
    word

letter =
     lc
   / uc
    
lc =
 [a-z]
    
uc =
 [A-Z]
     
word = 
    first:letter*
        {return first.join('');}
    
/***************************************************************
All lowercase or all UPPERCASE Word
****************************************************************
start =
    word

letter =
     lc
   / uc
    
lc =
 [a-z]
    
uc =
 [A-Z]
     
word = 
    first:[a-z] rest: lc*
         {return first + rest.join('');}
   /first:[A-Z] rest: uc*
         {return first + rest.join('');}
        
/************************
Parsing lists of words
****************************  
    
start =
    wordlist

wordlist =
  list: (first:word second:' '*)*
  {return list.length===0 ? undefined : list.map(function(w){
     console.log(w);
     return w[0].join('');
   });
   }
     

word = 
 letter+
 
letter =
  lc

lc = 
 [a-z]
 
/***************************
Parsing Scheem Atoms
****************************  
  
start =
    atom

validchar
    = [0-9a-zA-Z_?!+\-=@#$%^&*/.]

atom =
    chars:validchar+
        { return chars.join(""); }

/***************************
Scheem Grammar
****************************  
start =
    expression

expression =
    a:atom
    { return a;}
    / open:"(" expr:expression other:expression*")"
    {var start =  expr.split(''); var rest =  other;
     return start.concat(other);}
 

atom =
    chars:validchar+
        {return chars.filter(function(char){return char !=" ";}).join('');}
    
validchar
    = [ 0-9a-zA-Z_?!+\-=@#$%^&*/.]


/*******************************************
Parsing Arithmetic Without Left Recursion
********************************************


start =
    comma

comma = 
    left: additive "," right: comma
   {return {tag: ',', left:left, right: right};}
   /additive
    
additive = 
    left:multiplicative "+" right:additive
        { return {tag: "+", left:left, right:right}; }
  / multiplicative


multiplicative =
    left:primary "*" right:multiplicative
        { return {tag: "*", left:left, right:right}; }
  / primary

primary =
    integer
  / "(" additive:additive ")"
      { return additive; }

integer =
    digits:[0-9]+
        { return parseInt(digits.join(""), 10); }


/*******************************************
Parsing Scheem and Allowing Spaces
********************************************

start =
    expression

expression =
    a:atom [\n\t]*
    { return a;}
    / open:"(" expr:expression other:expression*")"
    {var start =  expr.split(''); var rest =  other;
     return start.concat(other);}
 

atom =
    chars:validchar+
        {return chars.filter(function(char){return char !=" ";}).join('');}
    
validchar
    = [ 0-9a-zA-Z_?!+\-=@#$%^&*/.]

/*******************************************
Parsing Scheem and Allowing Spaces and Comments (needs work)
********************************************




start =
    expression

expression =
    a:atom [ \n\t]*
    { return a;}
    / open:"(" expr:expression other:expression*")"comment*
    {var start =  expr.split(''); var rest =  other;
     return start.concat(other);}
 

atom =
    chars:validchar+
        {return chars.filter(function(char){return char !=" ";}).join('');}
    /comment

comment = 
         ";;" validchar* [\n\t]* e:expression*
          {return e;}

validchar
    = [ 0-9a-zA-Z_?!+\-=@#$%^&*/.]