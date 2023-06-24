describe("Лексер языка программирования (INPUT: строка кода, OUTPUT: массив пар название_токена+значение)", function () {
  it('объявление пакета', function () {
    chai.expect(lexer.lex("package main")).to.equal(JSON.stringify([{token: 'package', value: 'package '}, {token: 'ID', value: 'main'}]));
  });

  it('объявление переменной', function () {
    chai.expect(lexer.lex("const N = 11 + 1")).to.equal(JSON.stringify([{token: 'const', value: 'const '}, {token: 'ID', value: 'N'}, {token: 'equals', value: '='}, {token: 'int_lit', value: '11'}, {token: 'add', value: '+'}, {token: 'int_lit', value: '1'}]));
  });

  it('объявление функции', function () {
    chai.expect(lexer.lex("func move(pos, dir int) bool {}")).to.equal(JSON.stringify([
    {
        "token": "func",
        "value": "func "
    },
    {
        "token": "ID",
        "value": "move"
    },
    {
        "token": "lbr",
        "value": "("
    },
    {
        "token": "ID",
        "value": "pos"
    },
    {
        "token": "comma",
        "value": ","
    },
    {
        "token": "ID",
        "value": "dir"
    },
    {
        "token": "type",
        "value": "int"
    },
    {
        "token": "rbr",
        "value": ")"
    },
    {
        "token": "type",
        "value": "bool"
    },
    {
        "token": "lcbr",
        "value": "{"
    },
    {
        "token": "rcbr",
        "value": "}"
    }
]));
  });


  it('float вида .02', function () {
    chai.expect(lexer.lex(".02")).to.equal(JSON.stringify([
    {
        "token": "int_lit",
        "value": ".02"
    }
]));
  });

  it('float вида 0.02', function () {
    chai.expect(lexer.lex("0.02")).to.equal(JSON.stringify([
    {
        "token": "int_lit",
        "value": "0.02"
    }
]));
  });

  it('float в однострочном комментарии', function () {
    chai.expect(lexer.lex("// 0.02")).to.equal(JSON.stringify([
    {
        "token": "CMT",
        "value": "// 0.02"
    }
]));
  });

  it('зарезервивованные символы и слова в многострочном комментарии', function () {
    chai.expect(lexer.lex("/* const N = 3 */")).to.equal(JSON.stringify([
    {
        "token": "CMT",
        "value": "/* const N = 3 */"
    }
]));
  });
});






var Lexer = function () {
  this._tokenRegExp = undefined;
  this._rules = [
    [/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*/gm, "CMT"]
    , [/(?:^|\W)package(?:$|\W)/, 'package']
    , [/(?:^|\W)func(?:$|\W)/, 'func']
    , [/(?:^|\W)const(?:$|\W)/, 'const']
    , [/(?:^|\W)var(?:$|\W)/, 'var']
    , [/(?:^|\W)continue(?:$|\W)/, 'continue']
    , [/(?:^|\W)break(?:$|\W)/, 'break']
    , [/(?:^|\W)return(?:$|\W)/, 'return']
    , [/(?:^|\W)if(?:$|\W)/, 'if']
    , [/(?:^|\W)else(?:$|\W)/, 'else']
    , [/(?:^|\W)switch(?:$|\W)/, 'switch']
    , [/(?:^|\W)case(?:$|\W)/, 'case']
    , [/(?:^|\W)default(?:$|\W)/, 'default']
    , [/(?:^|\W)for(?:$|\W)/, 'for']
   , [/\b(bool|string|int|float64)\b/, 'type']
   , [/\`[\s\S]*?\`|\'[\s\S]*?\'|\"[\s\S]*?\"|"(.*?)"|'(.*?)'|`(.*?)`/, 'string_lit']
   , [/(?:^|,)(arr)(?:,|$)/, 'ARR']
   , [/(?:^|,)(true)(?:,|$)|(?:^|,)(false)(?:,|$)/g, 'BL']
   , [/\b([_a-zA-Z][_a-zA-Z0-9]*)\b/, 'ID']
   , [/[0][.][0-9]*|[0][.]|([1-9][0-9]*[eE][1-9][0-9]*|(([1-9][0-9]*\.)|(\.[0-9]+))([0-9]*)?([eE][\-\+]?[1-9][0-9]*)?)|[0-9]+/mg, 'int_lit']
  , [/(\|\||&&)/, 'binary']
  , [/(==|!=|<|<=|>|>=)/, 'rel']
  , [/(--|\+\+)/, 'increment']
  , [/(\+|\-)/, 'add']
  , [/(\*|\/|\%)/, 'mul']
  , [/=/, 'equals']
  , [/:=/, 'to_app']
  , [/\(/, 'lbr']
  , [/\)/, 'rbr']
  , [/\[/, 'lsbr']
  , [/\]/, 'rsbr']
  , [/\{/, 'lcbr']
  , [/\}/, 'rcbr']
  , [/\;/, 'semicolon']
  , [/\,/, 'comma']
  , [/\./, 'dot']
  , [/\:/, 'colon']
  ];



  for (var i = 0; i < this._rules.length; i++) {
      if (this._rules[i][0].source) {
        this._rules[i][0] = this._rules[i][0].source;
      } else {
        this._rules[i][0] = this._rules[i][0].replace(/[-*+?.,^$|#\[\]{}()\\]/g, '\\$1');
      }
  }
};
Lexer.prototype = new function () {
  this._compile = function () {
    if (!this._tokenRegExp) {
      var tokenExpressions = [];
      var rules = this._rules;
      var captureCount = 0;
      for (var i = 0, ii = rules.length; i < ii; i++) {
        var rule = rules[i];
        var expression = rule[0];
        var CAPTURE_EXP = /\\.|\[(?:\\.|[^\]])*\]|(\((?!\?[!:=]))|./g;
        captures = expression.replace(CAPTURE_EXP, function (match, p) {
          return p ? '.' : '';
        }).length;
        rule[3] = captures + 1;
        var BACK_REF_EXP = /\\\D|\[(?:\\.|[^\]])*\]|\\(\d+)|./g;
        expression = expression.replace(BACK_REF_EXP, function (match, d) {
          if (d) {
            var n = parseInt(d, 10);
            if (n > 0 && n <= captures) {
              return '\\' + (n + captureCount + 1);
            } else {
              return parseInt(d, 8);
            }
          } else {
            return match;
          }
        });
        captureCount += captures + 1;
        tokenExpressions.push(expression);
      }
      this._tokenRegExp =
        new RegExp('(' + tokenExpressions.join(')|(') + ')', 'g');
    }
    return this._tokenRegExp;
  };
  this.lex = function (text) {
    if (typeof text != 'string') {
      throw new Error("Ошибка ввода");
      alert("Ошибка ввода");
    }

    //document.getElementById('content').innerHTML = "";

    var tokens = [];
    var tokenMatch;
    var tokenRegExp = this._compile();
    var index = 0;
    while (tokenMatch = tokenRegExp.exec(text)) {

      index += tokenMatch[0].length;

      var token = {
          type: undefined
        , value: tokenMatch[0]
        , match: undefined
        , offset: index
        };
      var i = 1;
      var r = 0;
      var rules = this._rules;
      var rule = rules[r];
      while (!tokenMatch[i]) {
        i += rule[3];
        rule = rules[++r];
      }
      token.type = rule[1];
      token.match = tokenMatch.slice(i, i+rule[3]);
      token.match[rule[3]-1] = token.match[rule[3]-1]; 
      if (rule[2]) {
        rule[2].call(this, token);
      }

      if (tokenMatch[0].length == 0) {
        throw new Error(
          "Rule at index " + i + " matched the empty string.");
      }

      if (token.type) {
        //document.getElementById('content').innerHTML = document.getElementById('content').innerHTML +token.match[0]+" : "+token.type + "<br>";
        let temp_obj = {
		   token: token.type,
		   value: token.match[0]
		};
        tokens.push(temp_obj);
      }
    }
    return JSON.stringify(tokens);
  };
};
lexer = new Lexer();



