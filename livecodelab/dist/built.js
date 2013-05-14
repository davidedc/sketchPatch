/*
## A LiveCodeLabCore instance packs together the following parts:
## 
##  - timeKeeper
##  - three
##  - threeJsSystem
##  - matrixCommands
##  - blendControls
##  - soundSystem
##  - colourFunctions
##  - backgroundPainter
##  - graphicsCommands
##  - lightSystem 
##  - drawFunctionRunner
##  - codeTransformer
##  - renderer
##  - animationLoop
## 
##  LiveCodeLab is built one part at a time, and the arguments in the constructor
##  tell how they depend on each other at construction time and how they
##  interact at runtime.
## 
##  - _A constructor with no arguments_ (or where the arguments are just passed
##    by the caller of the very createLiveCodeLabCore function we are in),
##    such as createColourFunctions, is a part
##    that does not need any other part at construction time and it doesn't interact
##    with any of the other parts at run time.
##  - _A constructor with arguments other than "liveCodeLabCoreInstance"_
##    (such as threeJsSystem) only needs the parts passed at construction time for its
##    own construction, and it can only interact with such parts at runtime.
##  - _A constructor which contains the "liveCodeLabCoreInstance" argument_, such as
##    codeTransformer, might or might not need other parts for its own construction
##    (if they are passed as arguments in addition to the "liveCodeLabCoreInstance" argument)
##    but it does interact at runtime with other parts not passed in the constructor
##    argument.
## 
##  So, for determining the order of the constructors, one can just look at the
##  dependencies dictated by the arguments other than the "liveCodeLabCoreInstance"
##  argument. The "liveCodeLabCoreInstance" parameter
##  doesn't create dependencies at creation time,
##  it's just used by the parts to reference other parts that they need to interact to
##  at runtime.
## 
##  It might well be that at runtime part A interacts with part B and viceversa.
##  This is why runtime interactions are not restricted to parts passed
##  as arguments at construction
##  time, because one would need to pass constructed part A to the constructor of part B
##  and viceversa, which is obviously impossible. This is why the runtime interactions
##  happen through the mother of all parts, i.e. "liveCodeLabCoreInstance" itself.
## 
##  To determine which parts any single part interacts with at runtime, one
##  has to check all the parameters passed to the constructor. The passed parts are likely
##  to mean that there is an interaction at runtime. If the "mother"
##  "liveCodeLabCoreInstance" is passed to the constructor, then one case to look for
##  all "liveCodeLabCoreInstance" occurrences and see which of its children are
##  accessed.
*/

var LiveCodeLabCore;

LiveCodeLabCore = (function() {
  "use strict";  function LiveCodeLabCore(paramsObject) {
    this.paramsObject = paramsObject;
    this.three = THREE;
    this.timeKeeper = new TimeKeeper();
    this.blendControls = new BlendControls(this);
    this.colourFunctions = new ColourFunctions();
    this.renderer = new Renderer(this);
    this.soundSystem = new SoundSystem(this.paramsObject.eventRouter, buzz, createBowser(), new SampleBank(buzz));
    this.backgroundPainter = new BackgroundPainter(this.paramsObject.canvasForBackground, this);
    this.drawFunctionRunner = new ProgramRunner(this.paramsObject.eventRouter, this);
    this.codeTransformer = new CodeTransformer(this.paramsObject.eventRouter, CoffeeScript, this);
    this.animationLoop = new AnimationLoop(this.paramsObject.eventRouter, this.paramsObject.statsWidget, this);
    this.threeJsSystem = new ThreeJsSystem(Detector, THREEx, this.paramsObject.blendedThreeJsSceneCanvas, this.paramsObject.forceCanvasRenderer, this.paramsObject.testMode, this.three);
    this.matrixCommands = new MatrixCommands(this.three, this);
    this.graphicsCommands = new GraphicsCommands(this.three, this);
    this.lightSystem = new LightsCommands(this.graphicsCommands, this);
  }

  LiveCodeLabCore.prototype.paintARandomBackground = function() {
    return this.backgroundPainter.paintARandomBackground();
  };

  LiveCodeLabCore.prototype.startAnimationLoop = function() {
    return this.animationLoop.animate();
  };

  LiveCodeLabCore.prototype.runLastWorkingDrawFunction = function() {
    return this.drawFunctionRunner.reinstateLastWorkingDrawFunction();
  };

  LiveCodeLabCore.prototype.loadAndTestAllTheSounds = function() {
    return this.soundSystem.loadAndTestAllTheSounds();
  };

  LiveCodeLabCore.prototype.playStartupSound = function() {
    return this.soundSystem.playStartupSound();
  };

  LiveCodeLabCore.prototype.isAudioSupported = function() {
    return this.soundSystem.isAudioSupported();
  };

  LiveCodeLabCore.prototype.updateCode = function(updatedCode) {
    this.codeTransformer.updateCode(updatedCode);
    if (updatedCode !== "" && this.dozingOff) {
      this.dozingOff = false;
      this.animationLoop.animate();
      return this.paramsObject.eventRouter.trigger("livecodelab-waking-up");
    }
  };

  LiveCodeLabCore.prototype.getForeground3DSceneImage = function(backgroundColor) {
    var blendedThreeJsSceneCanvas, ctx, ctxContext, img;

    blendedThreeJsSceneCanvas = this.threeJsSystem.blendedThreeJsSceneCanvas;
    img = new Image;
    img.src = blendedThreeJsSceneCanvas.toDataURL();
    if (backgroundColor) {
      ctx = document.createElement("canvas");
      ctx.width = blendedThreeJsSceneCanvas.width;
      ctx.height = blendedThreeJsSceneCanvas.height;
      ctxContext = ctx.getContext("2d");
      ctxContext.drawImage(img, 0, 0);
      ctxContext.globalCompositeOperation = "destination-over";
      ctxContext.fillStyle = backgroundColor;
      ctxContext.fillRect(0, 0, blendedThreeJsSceneCanvas.width, blendedThreeJsSceneCanvas.height);
      img = new Image;
      img.src = ctx.toDataURL();
    }
    return img;
  };

  return LiveCodeLabCore;

})();

/*
## EventRouter bridges most events in LiveCodeLab. Error message pops up? Event router
## steps in. Big cursor needs to shrink? It's the event router who stepped in. You get the
## picture. Any part of LiveCodeLab can just register callbacks and trigger events, using
## some descriptive strings as keys. Handy because it's a hub where one could attach
## debugging and listing of all registered callbacks. Probably not a good idea to attach
## rapid-fire events due to overheads.
*/

var EventRouter;

EventRouter = (function() {
  "use strict";  EventRouter.prototype.events = {};

  function EventRouter() {}

  EventRouter.prototype.bind = function(name, callback, context) {
    var listenerInfo;

    listenerInfo = {
      callback: callback,
      context: context
    };
    if (!this.events[name]) {
      this.events[name] = [];
    }
    return this.events[name].push(listenerInfo);
  };

  EventRouter.prototype.trigger = function(name) {
    var args, callbacks, i, listenerInfo, _i, _len, _results;

    args = void 0;
    callbacks = void 0;
    i = void 0;
    listenerInfo = void 0;
    args = Array.prototype.slice.call(arguments);
    if (this.events[name]) {
      args = args.slice(1);
      callbacks = this.events[name];
      _results = [];
      for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
        listenerInfo = callbacks[_i];
        _results.push(listenerInfo.callback.apply(listenerInfo.context, args));
      }
      return _results;
    }
  };

  return EventRouter;

})();

/*
## This could be an alternative to the lexer and the many regular expressions used
## in the Autocoder and in the CodeTransformer. Not used at the moment. In development
## stage.
*/

var CodeChecker, Parser,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Parser = (function() {
  "use strict";
  var finished, position, source, sourceLength;

  source = void 0;

  sourceLength = void 0;

  position = void 0;

  finished = true;

  function Parser() {}

  Parser.prototype.setString = function(parseString) {
    this.position = 0;
    this.source = parseString;
    this.sourceLength = this.source.length;
    if (parseString !== "") {
      return this.finished = false;
    } else {
      return this.finished = true;
    }
  };

  Parser.prototype.pop = function() {
    var c;

    if (this.position >= this.sourceLength) {
      return undefined;
    }
    c = this.source.charAt(this.position);
    this.position += 1;
    if (this.position >= this.sourceLength) {
      this.finished = true;
    }
    return c;
  };

  Parser.prototype.peek = function() {
    if (this.position < this.sourceLength) {
      return this.source.charAt(this.position);
    }
  };

  return Parser;

})();

CodeChecker = (function(_super) {
  __extends(CodeChecker, _super);

  CodeChecker.prototype.states = {};

  function CodeChecker() {
    this.charHandlers = {
      "[": function() {
        if (!this.states.inSingleString && !this.states.inDoubleString && !this.states.inComment) {
          return this.states.bracketStack.push("[");
        }
      },
      "]": function() {
        var b;

        if (!this.states.inSingleString && !this.states.inDoubleString && !this.states.inComment) {
          b = this.states.bracketStack.pop();
          if (b !== "[") {
            this.states.err = true;
            return this.states.message = this.generateErrMessage(b);
          }
        }
      },
      "(": function() {
        if (!this.states.inSingleString && !this.states.inDoubleString && !this.states.inComment) {
          return this.states.bracketStack.push("(");
        }
      },
      ")": function() {
        var b;

        if (!this.states.inSingleString && !this.states.inDoubleString && !this.states.inComment) {
          b = this.states.bracketStack.pop();
          if (b !== "(") {
            this.states.err = true;
            return this.states.message = this.generateErrMessage(b);
          }
        }
      },
      "{": function() {
        if (!this.states.inSingleString && !this.states.inDoubleString && !this.states.inComment) {
          return this.states.bracketStack.push("{");
        }
      },
      "}": function() {
        var b;

        if (!this.states.inSingleString && !this.states.inDoubleString && !this.states.inComment) {
          b = this.states.bracketStack.pop();
          if (b !== "{") {
            this.states.err = true;
            return this.states.message = this.generateErrMessage(b);
          }
        }
      },
      "'": function() {
        if (this.states.inComment) {

        } else if (this.states.inSingleString) {
          this.states.inSingleString = false;
          return this.states.singleQ -= 1;
        } else if (!this.states.inDoubleString) {
          this.states.inSingleString = true;
          return this.states.singleQ += 1;
        }
      },
      "\"": function() {
        if (this.states.inComment) {

        } else if (this.states.inDoubleString) {
          this.states.inDoubleString = false;
          return this.states.doubleQ -= 1;
        } else if (!this.states.inSingleString) {
          this.states.inDoubleString = true;
          return this.states.doubleQ += 1;
        }
      },
      "/": function() {
        if (!this.states.inSingleString && !this.states.inDoubleString && !this.states.inComment) {
          if (this.peek() === "/") {
            this.pop();
            return this.states.inComment = true;
          }
        }
      },
      "\\": function() {
        return this.pop();
      },
      "\n": function() {
        if (this.states.inSingleString) {
          this.states.message = this.generateErrMessage("'");
          return this.states.err = true;
        } else if (this.states.inDoubleString) {
          this.states.message = this.generateErrMessage("\"");
          return this.states.err = true;
        } else {
          if (this.states.inComment) {
            return this.states.inComment = false;
          }
        }
      }
    };
  }

  CodeChecker.prototype.resetState = function() {
    var aFreshlyMadeState;

    return aFreshlyMadeState = {
      err: false,
      bracketStack: [],
      doubleQ: 0,
      singleQ: 0,
      inSingleString: false,
      inDoubleString: false,
      inComment: false,
      message: ""
    };
  };

  CodeChecker.prototype.isErr = function(s) {
    var b;

    if (s.bracketStack.length) {
      b = s.bracketStack.pop();
      this.states.message = this.generateErrMessage(b);
      s.err = true;
    } else if (s.inSingleString) {
      this.states.message = this.generateErrMessage("'");
      s.err = true;
    } else if (s.inDoubleString) {
      this.states.message = this.generateErrMessage("\"");
      s.err = true;
    }
    return s;
  };

  CodeChecker.prototype.generateErrMessage = function(token) {
    var message;

    message = void 0;
    switch (token) {
      case "{":
        message = "Unbalanced {}";
        break;
      case "(":
        message = "Unbalanced ()";
        break;
      case "[":
        message = "Unbalanced []";
        break;
      case "'":
        message = "Missing '";
        break;
      case "\"":
        message = "Missing \"";
        break;
      default:
        message = "Unexpected " + token;
    }
    return message;
  };

  CodeChecker.prototype.parseChar = function(c) {
    if (this.charHandlers[c]) {
      return this.charHandlers[c]();
    }
  };

  CodeChecker.prototype.parse = function(source) {
    var c;

    c = void 0;
    this.states = this.resetState();
    this.setString(source);
    while (!this.finished && !this.states.err) {
      c = this.pop();
      this.parseChar(c);
    }
    return this.isErr(this.states);
  };

  return CodeChecker;

})(Parser);

/*
## Helper class to manage URL hash location.
*/

var UrlRouter;

UrlRouter = (function() {
  "use strict";  function UrlRouter(eventRouter) {
    this.eventRouter = eventRouter;
    this.eventRouter.bind("set-url-hash", this.setHash, this);
  }

  UrlRouter.prototype.getHash = function() {
    var match;

    match = window.location.href.match(/#(.*)$/);
    if (match) {
      return match[1];
    } else {
      return "";
    }
  };

  UrlRouter.prototype.setHash = function(hash) {
    return window.location.hash = hash;
  };

  UrlRouter.prototype.urlPointsToDemoOrTutorial = function() {
    var found, hash;

    found = false;
    hash = this.getHash();
    if (hash) {
      this.eventRouter.trigger("url-hash-changed", hash);
      found = true;
    }
    return found;
  };

  return UrlRouter;

})();

/*
## The big cursor that flashes when the environment is first opened. It's a special div
## which is actually not meant to contain text. It just shrinks/expands depending on
## whether the user types something (shrinks) or whether the program turns empty
## (expands).
*/

var BigCursor;

BigCursor = (function() {
  "use strict";  function BigCursor(eventRouter) {
    this.fakeCursorInterval = void 0;
    this.isShowing = true;
  }

  BigCursor.prototype.startBigCursorBlinkingAnimation = function() {
    return $("#fakeStartingBlinkingCursor").animate({
      opacity: 0.2
    }, "fast", "swing").animate({
      opacity: 1
    }, "fast", "swing");
  };

  BigCursor.prototype.toggleBlink = function(active) {
    if (active) {
      if (!this.fakeCursorInterval) {
        return this.fakeCursorInterval = setInterval(this.startBigCursorBlinkingAnimation, 800);
      }
    } else {
      clearTimeout(this.fakeCursorInterval);
      return this.fakeCursorInterval = null;
    }
  };

  BigCursor.prototype.shrinkBigCursor = function() {
    var currentCaption, shorterCaption;

    currentCaption = void 0;
    shorterCaption = void 0;
    if (this.isShowing) {
      currentCaption = $("#caption").html();
      shorterCaption = currentCaption.substring(0, currentCaption.length - 1);
      $("#caption").html(shorterCaption + "|");
      $("#fakeStartingBlinkingCursor").html("");
      $("#toMove").animate({
        opacity: 0,
        margin: -100,
        fontSize: 300,
        left: 0
      }, "fast");
      setTimeout("$(\"#formCode\").animate({opacity: 1}, \"fast\");", 120);
      setTimeout("$(\"#justForFakeCursor\").hide();", 200);
      setTimeout("$(\"#toMove\").hide();", 200);
      this.isShowing = false;
      return this.toggleBlink(false);
    }
  };

  BigCursor.prototype.unshrinkBigCursor = function() {
    if (!this.isShowing) {
      $("#formCode").animate({
        opacity: 0
      }, "fast");
      $("#justForFakeCursor").show();
      $("#toMove").show();
      $("#caption").html("|");
      $("#toMove").animate({
        opacity: 1,
        margin: 0,
        fontSize: 350,
        left: 0
      }, "fast", function() {
        $("#caption").html("");
        return $("#fakeStartingBlinkingCursor").html("|");
      });
      this.isShowing = true;
      return this.toggleBlink(true);
    }
  };

  return BigCursor;

})();

/*
## Lexer is a variation/port of:
## 
## McLexer: A lexical analysis system/library for JavaScript.
## Author:  Matthew Might
## Site:    http://matt.might.net/
##          http://www.ucombinator.com/
## 
## The lexer associates rules with analysis states.
## 
## Each rule contains a regular expression to match, 
## and action to execute upon finding a match.
## 
## When a state matches its rules against an input text, 
## it chooses the rule with the longest match against the prefix 
## of the input text.
## 
## A lexical state is a collection of rules.
## 
## It has three primary methods:
## 
## + lex(input) runs a continuation-based lexer on the input;
##   lex invokes next once, and expects a continuation back;
##   it then invokes the continuation and expects each continuation
##   it invokes to return another continuation.  Once a continuation
##   returns null; parsing is complete.     
## 
## + findAndRunActionPairedToLongestAppliableRegex(input) runs a match against an input,
##   fires the action.
##   An action is a procedure that accepts the match data (an array),
##   the remainder of the input, and the current state and returns a function that
##   applies the rules again and finds and runs the next action. An action does not run
##   the next one (that would be recursion). Rather, it returns a function to find and
##   run the next one
## 
## Why this "step by step" approach instead of a normal recursion? The advantage is
## that you can stop the parsing and resume it any time you want. Suppose that
## you have a huge program to parse. With recursion, once you start you can't
## stop until the end (at least if you are using normal recursion as provided by
## the language runtime. If you implement your own recursion using your own stack
## then you could indeed pause/resume things). In a single-threaded language like
## Javascript this results in everything else "blocking". A "continuations" approach
## lets you stop and resume the parsing more easily, since you lex the program step
## by step in a manner that does not rely on the runtime stack. There is no recursion.
*/

var LexerRule, LexerState;

LexerState = (function() {
  function LexerState() {}

  LexerState.prototype.rules = [];

  LexerState.prototype.addRule = function(regex, action) {
    return this.rules.push(new LexerRule(regex, action));
  };

  LexerState.prototype.lex = function(input) {
    var nextAction;

    nextAction = this.findAndRunActionPairedToLongestAppliableRegex(input);
    while (typeof nextAction === "function") {
      nextAction = nextAction();
    }
    return nextAction;
  };

  LexerState.prototype.findAndRunActionPairedToLongestAppliableRegex = function(input) {
    var i, longestMatch, longestMatchedLength, longestMatchedRule, m, r, _i, _ref;

    longestMatchedRule = null;
    longestMatch = null;
    longestMatchedLength = -1;
    for (i = _i = _ref = this.rules.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
      r = this.rules[i];
      m = r.matches(input);
      if (m && (m[0].length >= longestMatchedLength)) {
        longestMatchedRule = r;
        longestMatch = m;
        longestMatchedLength = m[0].length;
      }
    }
    if (longestMatchedRule) {
      return longestMatchedRule.action(longestMatch, input.substring(longestMatchedLength), this);
    } else {
      throw "Lexing error; no match found for: '" + input + "'";
    }
  };

  LexerState.prototype.returnAFunctionThatAppliesRulesAndRunsActionFor = function(input) {
    var _this = this;

    return function() {
      return _this.findAndRunActionPairedToLongestAppliableRegex(input);
    };
  };

  return LexerState;

})();

/*
## Each rule contains a regular expression to match, 
## and action to execute upon finding a match.
*/


LexerRule = (function() {
  function LexerRule(regex, action) {
    this.regex = regex;
    this.action = action;
    this.regex = new RegExp("^(" + this.regex.source + ")");
    if (this.regex.compile) {
      this.regex.compile(this.regex);
    }
  }

  LexerRule.prototype.matches = function(s) {
    var m;

    m = s.match(this.regex);
    if (m) {
      m.shift();
    }
    return m;
  };

  return LexerRule;

})();

/*
## The SampleBank is responsible for holding the filepaths to any audio that
## needs to be loaded by the browser.
## 
## It automatically handles returning the ogg or mp3 file path.
*/

var SampleBank;

SampleBank = (function() {
  "use strict";  SampleBank.prototype.sounds = [];

  SampleBank.prototype.soundsByName = {};

  SampleBank.prototype.fileType = void 0;

  function SampleBank(buzz) {
    this.fileType = void 0;
    if (buzz.isMP3Supported()) {
      this.fileType = "mp3";
    } else if (buzz.isOGGSupported()) {
      this.fileType = "ogg";
    } else {
      return;
    }
    this.load("bing", "./sound/audioFiles/start_bing");
    this.load("highHatClosed", "./sound/audioFiles/AMB_HHCL");
    this.load("highHatOpen", "./sound/audioFiles/AMB_HHOP");
    this.load("toc3", "./sound/audioFiles/AMB_LTM2");
    this.load("toc4", "./sound/audioFiles/AMB_RIM1");
    this.load("snare", "./sound/audioFiles/AMB_SN13");
    this.load("snare2", "./sound/audioFiles/AMB_SN_5");
    this.load("crash", "./sound/audioFiles/CRASH_1");
    this.load("crash2", "./sound/audioFiles/CRASH_5");
    this.load("crash3", "./sound/audioFiles/CRASH_6");
    this.load("ride", "./sound/audioFiles/RIDE_1");
    this.load("glass", "./sound/audioFiles/glass2");
    this.load("thump", "./sound/audioFiles/8938__patchen__piano-hits-hand-03v2");
    this.load("lowFlash", "./sound/audioFiles/9569__thanvannispen__industrial-low-flash04");
    this.load("lowFlash2", "./sound/audioFiles/9570__thanvannispen__industrial-low-flash07");
    this.load("tranceKick2", "./sound/audioFiles/24004__laya__dance-kick3");
    this.load("tranceKick", "./sound/audioFiles/33325__laya__trance-kick01");
    this.load("voltage", "./sound/audioFiles/49255__keinzweiter__bonobob-funk");
    this.load("beepA", "./sound/audioFiles/100708__steveygos93__bleep_a");
    this.load("beepB", "./sound/audioFiles/100708__steveygos93__bleep_b");
    this.load("beepC", "./sound/audioFiles/100708__steveygos93__bleep_c");
    this.load("beepD", "./sound/audioFiles/100708__steveygos93__bleep_d");
    this.load("alienBeep", "./sound/audioFiles/132389__blackie666__alienbleep");
    this.load("penta1", "./sound/audioFiles/toneMatrix-1");
    this.load("penta2", "./sound/audioFiles/toneMatrix-2");
    this.load("penta3", "./sound/audioFiles/toneMatrix-3");
    this.load("penta4", "./sound/audioFiles/toneMatrix-4");
    this.load("penta5", "./sound/audioFiles/toneMatrix-5");
    this.load("penta6", "./sound/audioFiles/toneMatrix-6");
    this.load("penta7", "./sound/audioFiles/toneMatrix-7");
    this.load("penta8", "./sound/audioFiles/toneMatrix-8");
    this.load("penta9", "./sound/audioFiles/toneMatrix-9");
    this.load("penta10", "./sound/audioFiles/toneMatrix-10");
    this.load("penta11", "./sound/audioFiles/toneMatrix-11");
    this.load("penta12", "./sound/audioFiles/toneMatrix-12");
    this.load("penta13", "./sound/audioFiles/toneMatrix-13");
    this.load("penta14", "./sound/audioFiles/toneMatrix-14");
    this.load("penta15", "./sound/audioFiles/toneMatrix-15");
    this.load("penta16", "./sound/audioFiles/toneMatrix-16");
    this.load("ciack", "./sound/audioFiles/ciack");
    this.load("snap", "./sound/audioFiles/snap");
    this.load("thump2", "./sound/audioFiles/thump2");
    this.load("dish", "./sound/audioFiles/dish");
  }

  SampleBank.prototype.load = function(name, path) {
    var soundNumber;

    soundNumber = this.sounds.length;
    this.sounds.push({
      name: name,
      path: path + "." + this.fileType
    });
    this.soundsByName[name] = soundNumber;
    return soundNumber;
  };

  SampleBank.prototype.getByName = function(name) {
    return this.sounds[this.soundsByName[name]];
  };

  SampleBank.prototype.getByNumber = function(number) {
    return this.sounds[number];
  };

  return SampleBank;

})();

/*
## SoundSystem tries to abstract away different ways of playing sound, according to
## weird performance characteristics of each browser (ad probably, OS). Cross-browser
## sound playing is really in a sorry state, we are trying to make do here.
*/

var SoundSystem;

SoundSystem = (function() {
  "use strict";  SoundSystem.prototype.oldupdatesPerMinute = 0;

  SoundSystem.prototype.soundLoopTimer = void 0;

  SoundSystem.prototype.beatNumber = 0;

  SoundSystem.prototype.totalCreatedSoundObjects = 0;

  SoundSystem.prototype.soundSystemIsMangled = false;

  SoundSystem.prototype.CHANNELSPERSOUND = 6;

  SoundSystem.prototype.endedFirstPlay = 0;

  SoundSystem.prototype.buzzObjectsPool = [];

  SoundSystem.prototype.soundFilesPaths = {};

  SoundSystem.prototype.soundLoops = [];

  SoundSystem.prototype.updatesPerMinute = void 0;

  SoundSystem.prototype.anyCodeReactingTobpm = false;

  function SoundSystem(eventRouter, buzz, Bowser, samplebank) {
    var _this = this;

    this.eventRouter = eventRouter;
    this.buzz = buzz;
    this.Bowser = Bowser;
    this.samplebank = samplebank;
    this.soundLoops.soundIDs = [];
    this.soundLoops.beatStrings = [];
    if (this.Bowser.firefox) {
      this.playSound = function(a, b, c) {
        return _this.play_using_DYNAMICALLY_CREATED_AUDIO_TAG(a, b, c);
      };
    } else if (this.Bowser.safari || this.Bowser.msie || this.Bowser.chrome) {
      this.playSound = function(a, b, c) {
        return _this.play_using_BUZZJS_WITH_ONE_POOL_PER_SOUND(a, b, c);
      };
    }
    window.bpm = function(a) {
      return _this.bpm(a);
    };
    window.play = function(a, b) {
      return _this.play(a, b);
    };
  }

  SoundSystem.prototype.resetLoops = function() {
    this.soundLoops.soundIDs = [];
    return this.soundLoops.beatStrings = [];
  };

  SoundSystem.prototype.playStartupSound = function() {
    var startup;

    startup = new this.buzz.sound(this.samplebank.getByName("bing").path);
    return startup.play();
  };

  SoundSystem.prototype.SetUpdatesPerMinute = function(updatesPerMinute) {
    this.updatesPerMinute = updatesPerMinute;
  };

  SoundSystem.prototype.bpm = function(a) {
    if (a === undefined) {
      return;
    }
    if (a > 125) {
      a = 125;
    }
    if (a < 0) {
      a = 0;
    }
    return this.updatesPerMinute = a * 4;
  };

  SoundSystem.prototype.play = function(soundID, beatString) {
    this.anyCodeReactingTobpm = true;
    beatString = beatString.replace(/\s*/g, "");
    this.soundLoops.soundIDs.push(soundID);
    return this.soundLoops.beatStrings.push(beatString);
  };

  SoundSystem.prototype.play_using_BUZZ_JS_FIRE_AND_FORGET = function(soundFilesPaths, loopedSoundID, buzzObjectsPool) {
    var availableBuzzObject, soundFilePath;

    this.buzzObjectsPool = buzzObjectsPool;
    soundFilePath = void 0;
    soundFilePath = soundFilesPaths[loopedSoundID];
    availableBuzzObject = new this.buzz.sound(soundFilePath);
    return availableBuzzObject.play();
  };

  SoundSystem.prototype.play_using_DYNAMICALLY_CREATED_AUDIO_TAG = function(soundFilesPaths, loopedSoundID, buzzObjectsPool) {
    var audioElement, soundFilePath, source1,
      _this = this;

    this.buzzObjectsPool = buzzObjectsPool;
    audioElement = void 0;
    source1 = void 0;
    soundFilePath = void 0;
    soundFilePath = soundFilesPaths[loopedSoundID];
    audioElement = document.createElement("audio");
    audioElement.setAttribute("preload", "auto");
    audioElement.autobuffer = true;
    source1 = document.createElement("source");
    source1.type = "audio/ogg";
    source1.src = soundFilePath;
    audioElement.appendChild(source1);
    audioElement.addEventListener("load", (function() {
      audioElement.play();
      return $(".filename span").html(audioElement.src);
    }), true);
    return audioElement.play();
  };

  SoundSystem.prototype.play_using_BUZZJS_WITH_ONE_POOL_PER_SOUND = function(soundFilesPaths, loopedSoundID, buzzObjectsPool) {
    var allBuzzObjectsForWantedSound, availableBuzzObject, buzzObject, _i, _len;

    this.buzzObjectsPool = buzzObjectsPool;
    availableBuzzObject = void 0;
    allBuzzObjectsForWantedSound = this.buzzObjectsPool[loopedSoundID];
    buzzObject = void 0;
    for (_i = 0, _len = allBuzzObjectsForWantedSound.length; _i < _len; _i++) {
      buzzObject = allBuzzObjectsForWantedSound[_i];
      if (buzzObject.isEnded()) {
        availableBuzzObject = buzzObject;
        break;
      }
    }
    if (availableBuzzObject === undefined) {
      if (this.totalCreatedSoundObjects > 31) {
        this.soundSystemIsMangled = true;
        $("#soundSystemIsMangledMessage").modal();
        $("#simplemodal-container").height(250);
        return;
      }
      availableBuzzObject = new this.buzz.sound(soundFilesPaths[loopedSoundID]);
      this.buzzObjectsPool[loopedSoundID].push(availableBuzzObject);
      this.totalCreatedSoundObjects += 1;
    }
    return availableBuzzObject.play();
  };

  SoundSystem.prototype.soundLoop = function() {
    var beatString, loopedSoundID, loopingTheSoundIDs, playOrNoPlay, _i, _ref, _results;

    loopedSoundID = void 0;
    playOrNoPlay = void 0;
    beatString = void 0;
    if (this.soundSystemIsMangled) {
      return;
    }
    this.beatNumber += 1;
    _results = [];
    for (loopingTheSoundIDs = _i = 0, _ref = this.soundLoops.soundIDs.length; 0 <= _ref ? _i < _ref : _i > _ref; loopingTheSoundIDs = 0 <= _ref ? ++_i : --_i) {
      loopedSoundID = this.soundLoops.soundIDs[loopingTheSoundIDs];
      if (this.soundFilesPaths[loopedSoundID]) {
        beatString = this.soundLoops.beatStrings[loopingTheSoundIDs];
        playOrNoPlay = beatString.charAt(this.beatNumber % beatString.length);
        if (playOrNoPlay === "x") {
          _results.push(this.playSound(this.soundFilesPaths, loopedSoundID, this.buzzObjectsPool));
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  SoundSystem.prototype.changeUpdatesPerMinuteIfNeeded = function() {
    var _this = this;

    if (this.oldupdatesPerMinute !== this.updatesPerMinute) {
      clearTimeout(this.soundLoopTimer);
      if (this.updatesPerMinute !== 0) {
        this.soundLoopTimer = setInterval((function() {
          return _this.soundLoop();
        }), (1000 * 60) / this.updatesPerMinute);
      }
      return this.oldupdatesPerMinute = this.updatesPerMinute;
    }
  };

  SoundSystem.prototype.isAudioSupported = function() {
    var _this = this;

    return setTimeout((function() {
      if (!_this.buzz.isSupported()) {
        $("#noAudioMessage").modal();
        return $("#simplemodal-container").height(200);
      }
    }), 500);
  };

  SoundSystem.prototype.checkSound = function(soundDef, soundInfo) {
    var newSound,
      _this = this;

    newSound = new this.buzz.sound(soundInfo.path);
    newSound.load();
    newSound.mute();
    newSound.bind("ended", function(e) {
      newSound.unbind("ended");
      newSound.unmute();
      _this.endedFirstPlay += 1;
      if (_this.endedFirstPlay === soundDef.sounds.length * _this.CHANNELSPERSOUND) {
        return _this.eventRouter.trigger("all-sounds-loaded-and tested");
      }
    });
    newSound.play();
    return this.buzzObjectsPool[soundInfo.name].push(newSound);
  };

  SoundSystem.prototype.loadAndTestAllTheSounds = function() {
    var cycleSoundDefs, preloadSounds, soundDef, soundInfo, _i, _j, _ref, _ref1,
      _this = this;

    soundDef = void 0;
    soundInfo = void 0;
    preloadSounds = void 0;
    soundDef = this.samplebank;
    for (cycleSoundDefs = _i = 0, _ref = soundDef.sounds.length; 0 <= _ref ? _i < _ref : _i > _ref; cycleSoundDefs = 0 <= _ref ? ++_i : --_i) {
      soundInfo = soundDef.getByNumber(cycleSoundDefs);
      this.buzzObjectsPool[soundInfo.name] = [];
      this.soundFilesPaths[soundInfo.name] = soundInfo.path;
      if (this.Bowser.safari) {
        for (preloadSounds = _j = 0, _ref1 = this.CHANNELSPERSOUND; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; preloadSounds = 0 <= _ref1 ? ++_j : --_j) {
          setTimeout(function(soundDef, soundInfo) {
            return _this.checkSound(soundDef, soundInfo);
          }, 20 * cycleSoundDefs, soundDef, soundInfo);
        }
      }
    }
    if (!this.Bowser.safari) {
      return this.eventRouter.trigger("all-sounds-loaded-and tested");
    }
  };

  return SoundSystem;

})();

// ----------------------------------------------------------------------------
// Buzz, a Javascript HTML5 Audio library
// v 1.0.x beta
// Licensed under the MIT license.
// http://buzz.jaysalvat.com/
// ----------------------------------------------------------------------------
// Copyright (C) 2011 Jay Salvat
// http://jaysalvat.com/
// ----------------------------------------------------------------------------
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files ( the "Software" ), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ----------------------------------------------------------------------------

var buzz = {
    defaults: {
        autoplay: false,
        duration: 5000,
        formats: [],
        loop: false,
        placerunner: '--',
        preload: 'metadata',
        volume: 80
    },
    types: {
        'mp3': 'audio/mpeg',
        'ogg': 'audio/ogg',
        'wav': 'audio/wav',
        'aac': 'audio/aac',
        'm4a': 'audio/x-m4a'
    },
    sounds: [],
    el: document.createElement( 'audio' ),

    sound: function( src, options ) {
        options = options || {};

        var pid = 0,
            events = [],
            eventsOnce = {},
            supported = buzz.isSupported();

        // publics
        this.load = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.load();
            return this;
        };

        this.play = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.play();
            return this;
        };

        this.togglePlay = function() {
            if ( !supported ) {
              return this;
            }

            if ( this.sound.paused ) {
                this.sound.play();
            } else {
                this.sound.pause();
            }
            return this;
        };

        this.pause = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.pause();
            return this;
        };

        this.isPaused = function() {
            if ( !supported ) {
              return null;
            }

            return this.sound.paused;
        };

        this.stop = function() {
            if ( !supported  ) {
              return this;
            }

            this.setTime( 0 );
            this.sound.pause();
            return this;
        };

        this.isEnded = function() {
            if ( !supported ) {
              return null;
            }

            return this.sound.ended;
        };

        this.loop = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.loop = 'loop';
            this.bind( 'ended.buzzloop', function() {
                this.currentTime = 0;
                this.play();
            });
            return this;
        };

        this.unloop = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.removeAttribute( 'loop' );
            this.unbind( 'ended.buzzloop' );
            return this;
        };

        this.mute = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.muted = true;
            return this;
        };

        this.unmute = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.muted = false;
            return this;
        };

        this.toggleMute = function() {
            if ( !supported ) {
              return this;
            }

            this.sound.muted = !this.sound.muted;
            return this;
        };

        this.isMuted = function() {
            if ( !supported ) {
              return null;
            }

            return this.sound.muted;
        };

        this.setVolume = function( volume ) {
            if ( !supported ) {
              return this;
            }

            if ( volume < 0 ) {
              volume = 0;
            }
            if ( volume > 100 ) {
              volume = 100;
            }
          
            this.volume = volume;
            this.sound.volume = volume / 100;
            return this;
        };
      
        this.getVolume = function() {
            if ( !supported ) {
              return this;
            }

            return this.volume;
        };

        this.increaseVolume = function( value ) {
            return this.setVolume( this.volume + ( value || 1 ) );
        };

        this.decreaseVolume = function( value ) {
            return this.setVolume( this.volume - ( value || 1 ) );
        };

        this.setTime = function( time ) {
            if ( !supported ) {
              return this;
            }

            this.whenReady( function() {
                this.sound.currentTime = time;
            });
            return this;
        };

        this.getTime = function() {
            if ( !supported ) {
              return null;
            }

            var time = Math.round( this.sound.currentTime * 100 ) / 100;
            return isNaN( time ) ? buzz.defaults.placerunner : time;
        };

        this.setPercent = function( percent ) {
            if ( !supported ) {
              return this;
            }

            return this.setTime( buzz.fromPercent( percent, this.sound.duration ) );
        };

        this.getPercent = function() {
            if ( !supported ) {
              return null;
            }

			var percent = Math.round( buzz.toPercent( this.sound.currentTime, this.sound.duration ) );
            return isNaN( percent ) ? buzz.defaults.placerunner : percent;
        };

        this.setSpeed = function( duration ) {
			if ( !supported ) {
              return this;
            }

            this.sound.playbackRate = duration;
        };

        this.getSpeed = function() {
			if ( !supported ) {
              return null;
            }

            return this.sound.playbackRate;
        };

        this.getDuration = function() {
            if ( !supported ) {
              return null;
            }

            var duration = Math.round( this.sound.duration * 100 ) / 100;
            return isNaN( duration ) ? buzz.defaults.placerunner : duration;
        };

        this.getPlayed = function() {
			if ( !supported ) {
              return null;
            }

            return timerangeToArray( this.sound.played );
        };

        this.getBuffered = function() {
			if ( !supported ) {
              return null;
            }

            return timerangeToArray( this.sound.buffered );
        };

        this.getSeekable = function() {
			if ( !supported ) {
              return null;
            }

            return timerangeToArray( this.sound.seekable );
        };

        this.getErrorCode = function() {
            if ( supported && this.sound.error ) {
                return this.sound.error.code;
            }
            return 0;
        };

        this.getErrorMessage = function() {
			if ( !supported ) {
              return null;
            }

            switch( this.getErrorCode() ) {
                case 1:
                    return 'MEDIA_ERR_ABORTED';
                case 2:
                    return 'MEDIA_ERR_NETWORK';
                case 3:
                    return 'MEDIA_ERR_DECODE';
                case 4:
                    return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
                default:
                    return null;
            }
        };

        this.getStateCode = function() {
			if ( !supported ) {
              return null;
            }

            return this.sound.readyState;
        };

        this.getStateMessage = function() {
			if ( !supported ) {
              return null;
            }

            switch( this.getStateCode() ) {
                case 0:
                    return 'HAVE_NOTHING';
                case 1:
                    return 'HAVE_METADATA';
                case 2:
                    return 'HAVE_CURRENT_DATA';
                case 3:
                    return 'HAVE_FUTURE_DATA';
                case 4:
                    return 'HAVE_ENOUGH_DATA';
                default:
                    return null;
            }
        };

        this.getNetworkStateCode = function() {
			if ( !supported ) {
              return null;
            }

            return this.sound.networkState;
        };

        this.getNetworkStateMessage = function() {
			if ( !supported ) {
              return null;
            }

            switch( this.getNetworkStateCode() ) {
                case 0:
                    return 'NETWORK_EMPTY';
                case 1:
                    return 'NETWORK_IDLE';
                case 2:
                    return 'NETWORK_LOADING';
                case 3:
                    return 'NETWORK_NO_SOURCE';
                default:
                    return null;
            }
        };

        this.set = function( key, value ) {
            if ( !supported ) {
              return this;
            }

            this.sound[ key ] = value;
            return this;
        };

        this.get = function( key ) {
            if ( !supported ) {
              return null;
            }

            return key ? this.sound[ key ] : this.sound;
        };

        this.bind = function( types, func ) {
            if ( !supported ) {
              return this;
            }

            types = types.split( ' ' );

            var that = this,
				efunc = function( e ) { func.call( that, e ); };

            for( var t = 0; t < types.length; t++ ) {
                var type = types[ t ],
                    idx = type;
                    type = idx.split( '.' )[ 0 ];

                    events.push( { idx: idx, func: efunc } );
                    this.sound.addEventListener( type, efunc, true );
            }
            return this;
        };

        this.unbind = function( types ) {
            if ( !supported ) {
              return this;
            }

            types = types.split( ' ' );

            for( var t = 0; t < types.length; t++ ) {
                var idx = types[ t ],
                    type = idx.split( '.' )[ 0 ];

                for( var i = 0; i < events.length; i++ ) {
                    var namespace = events[ i ].idx.split( '.' );
                    if ( events[ i ].idx == idx || ( namespace[ 1 ] && namespace[ 1 ] == idx.replace( '.', '' ) ) ) {
                        this.sound.removeEventListener( type, events[ i ].func, true );
                        // remove event
                        events.splice(i, 1);
                    }
                }
            }
            return this;
        };

        this.bindOnce = function( type, func ) {
            if ( !supported ) {
              return this;
            }

            var that = this;

            eventsOnce[ pid++ ] = false;
            this.bind( type + '.' + pid, function() {
               if ( !eventsOnce[ pid ] ) {
                   eventsOnce[ pid ] = true;
                   func.call( that );
               }
               that.unbind( type + '.' + pid );
            });
        };

        this.trigger = function( types ) {
            if ( !supported ) {
              return this;
            }

            types = types.split( ' ' );

            for( var t = 0; t < types.length; t++ ) {
                var idx = types[ t ];

                for( var i = 0; i < events.length; i++ ) {
                    var eventType = events[ i ].idx.split( '.' );
                    if ( events[ i ].idx == idx || ( eventType[ 0 ] && eventType[ 0 ] == idx.replace( '.', '' ) ) ) {
                        var evt = document.createEvent('HTMLEvents');
                        evt.initEvent( eventType[ 0 ], false, true );
                        this.sound.dispatchEvent( evt );
                    }
                }
            }
            return this;
        };

        this.fadeTo = function( to, duration, callback ) {
			if ( !supported ) {
              return this;
            }

            if ( duration instanceof Function ) {
                callback = duration;
                duration = buzz.defaults.duration;
            } else {
                duration = duration || buzz.defaults.duration;
            }

            var from = this.volume,
				delay = duration / Math.abs( from - to ),
                that = this;
            this.play();

            function doFade() {
                setTimeout( function() {
                    if ( from < to && that.volume < to ) {
                        that.setVolume( that.volume += 1 );
                        doFade();
                    } else if ( from > to && that.volume > to ) {
                        that.setVolume( that.volume -= 1 );
                        doFade();
                    } else if ( callback instanceof Function ) {
                        callback.apply( that );
                    }
                }, delay );
            }
            this.whenReady( function() {
                doFade();
            });

            return this;
        };

        this.fadeIn = function( duration, callback ) {
            if ( !supported ) {
              return this;
            }

            return this.setVolume(0).fadeTo( 100, duration, callback );
        };

        this.fadeOut = function( duration, callback ) {
			if ( !supported ) {
              return this;
            }

            return this.fadeTo( 0, duration, callback );
        };

        this.fadeWith = function( sound, duration ) {
            if ( !supported ) {
              return this;
            }

            this.fadeOut( duration, function() {
                this.stop();
            });

            sound.play().fadeIn( duration );

            return this;
        };

        this.whenReady = function( func ) {
            if ( !supported ) {
              return null;
            }

            var that = this;
            if ( this.sound.readyState === 0 ) {
                this.bind( 'canplay.buzzwhenready', function() {
                    func.call( that );
                });
            } else {
                func.call( that );
            }
        };

        // privates
        function timerangeToArray( timeRange ) {
            var array = [],
                length = timeRange.length - 1;

            for( var i = 0; i <= length; i++ ) {
                array.push({
                    start: timeRange.start( length ),
                    end: timeRange.end( length )
                });
            }
            return array;
        }

        function getExt( filename ) {
            return filename.split('.').pop();
        }
        
        function addSource( sound, src ) {
            var source = document.createElement( 'source' );
            source.src = src;
            if ( buzz.types[ getExt( src ) ] ) {
                source.type = buzz.types[ getExt( src ) ];
            }
            sound.appendChild( source );
        }

        // init
        if ( supported && src ) {
          
            for(var i in buzz.defaults ) {
              if(buzz.defaults.hasOwnProperty(i)) {
                options[ i ] = options[ i ] || buzz.defaults[ i ];
              }
            }

            this.sound = document.createElement( 'audio' );

            if ( src instanceof Array ) {
                for( var j in src ) {
                  if(src.hasOwnProperty(j)) {
                    addSource( this.sound, src[ j ] );
                  }
                }
            } else if ( options.formats.length ) {
                for( var k in options.formats ) {
                  if(options.formats.hasOwnProperty(k)) {
                    addSource( this.sound, src + '.' + options.formats[ k ] );
                  }
                }
            } else {
                addSource( this.sound, src );
            }

            if ( options.loop ) {
                this.loop();
            }

            if ( options.autoplay ) {
                this.sound.autoplay = 'autoplay';
            }

            if ( options.preload === true ) {
                this.sound.preload = 'auto';
            } else if ( options.preload === false ) {
                this.sound.preload = 'none';
            } else {
                this.sound.preload = options.preload;
            }

            this.setVolume( options.volume );

            buzz.sounds.push( this );
        }
    },

    group: function( sounds ) {
        sounds = argsToArray( sounds, arguments );

        // publics
        this.getSounds = function() {
            return sounds;
        };

        this.add = function( soundArray ) {
            soundArray = argsToArray( soundArray, arguments );
            for( var a = 0; a < soundArray.length; a++ ) {
                sounds.push( soundArray[ a ] );
            }
        };

        this.remove = function( soundArray ) {
            soundArray = argsToArray( soundArray, arguments );
            for( var a = 0; a < soundArray.length; a++ ) {
                for( var i = 0; i < sounds.length; i++ ) {
                    if ( sounds[ i ] == soundArray[ a ] ) {
                        sounds.splice(i, 1);
                        break;
                    }
                }
            }
        };

        this.load = function() {
            fn( 'load' );
            return this;
        };

        this.play = function() {
            fn( 'play' );
            return this;
        };

        this.togglePlay = function( ) {
            fn( 'togglePlay' );
            return this;
        };

        this.pause = function( time ) {
            fn( 'pause', time );
            return this;
        };

        this.stop = function() {
            fn( 'stop' );
            return this;
        };

        this.mute = function() {
            fn( 'mute' );
            return this;
        };

        this.unmute = function() {
            fn( 'unmute' );
            return this;
        };

        this.toggleMute = function() {
            fn( 'toggleMute' );
            return this;
        };

        this.setVolume = function( volume ) {
            fn( 'setVolume', volume );
            return this;
        };

        this.increaseVolume = function( value ) {
            fn( 'increaseVolume', value );
            return this;
        };

        this.decreaseVolume = function( value ) {
            fn( 'decreaseVolume', value );
            return this;
        };

        this.loop = function() {
            fn( 'loop' );
            return this;
        };

        this.unloop = function() {
            fn( 'unloop' );
            return this;
        };

        this.setTime = function( time ) {
            fn( 'setTime', time );
            return this;
        };

        this.set = function( key, value ) {
            fn( 'set', key, value );
            return this;
        };

        this.bind = function( type, func ) {
            fn( 'bind', type, func );
            return this;
        };

        this.unbind = function( type ) {
            fn( 'unbind', type );
            return this;
        };

        this.bindOnce = function( type, func ) {
            fn( 'bindOnce', type, func );
            return this;
        };

        this.trigger = function( type ) {
            fn( 'trigger', type );
            return this;
        };

        this.fade = function( from, to, duration, callback ) {
            fn( 'fade', from, to, duration, callback );
            return this;
        };

        this.fadeIn = function( duration, callback ) {
            fn( 'fadeIn', duration, callback );
            return this;
        };

        this.fadeOut = function( duration, callback ) {
            fn( 'fadeOut', duration, callback );
            return this;
        };

        // privates
        function fn() {
            var args = argsToArray( null, arguments ),
                func = args.shift();

            for( var i = 0; i < sounds.length; i++ ) {
                sounds[ i ][ func ].apply( sounds[ i ], args );
            }
        }

        function argsToArray( array, args ) {
            return ( array instanceof Array ) ? array : Array.prototype.slice.call( args );
        }
    },

    all: function() {
      return new buzz.group( buzz.sounds );
    },

    isSupported: function() {
        return !!buzz.el.canPlayType;
    },

    isOGGSupported: function() {
        return !!buzz.el.canPlayType && buzz.el.canPlayType( 'audio/ogg; codecs="vorbis"' );
    },

    isWAVSupported: function() {
        return !!buzz.el.canPlayType && buzz.el.canPlayType( 'audio/wav; codecs="1"' );
    },

    isMP3Supported: function() {
        return !!buzz.el.canPlayType && buzz.el.canPlayType( 'audio/mpeg;' );
    },

    isAACSupported: function() {
        return !!buzz.el.canPlayType && ( buzz.el.canPlayType( 'audio/x-m4a;' ) || buzz.el.canPlayType( 'audio/aac;' ) );
    },

    toTimer: function( time, withHours ) {
        var h, m, s;
        h = Math.floor( time / 3600 );
        h = isNaN( h ) ? '--' : ( h >= 10 ) ? h : '0' + h;
        m = withHours ? Math.floor( time / 60 % 60 ) : Math.floor( time / 60 );
        m = isNaN( m ) ? '--' : ( m >= 10 ) ? m : '0' + m;
        s = Math.floor( time % 60 );
        s = isNaN( s ) ? '--' : ( s >= 10 ) ? s : '0' + s;
        return withHours ? h + ':' + m + ':' + s : m + ':' + s;
    },

    fromTimer: function( time ) {
        var splits = time.toString().split( ':' );
        if ( splits && splits.length == 3 ) {
            time = ( parseInt( splits[ 0 ], 10 ) * 3600 ) + ( parseInt(splits[ 1 ], 10 ) * 60 ) + parseInt( splits[ 2 ], 10 );
        }
        if ( splits && splits.length == 2 ) {
            time = ( parseInt( splits[ 0 ], 10 ) * 60 ) + parseInt( splits[ 1 ], 10 );
        }
        return time;
    },

    toPercent: function( value, total, decimal ) {
		var r = Math.pow( 10, decimal || 0 );

		return Math.round( ( ( value * 100 ) / total ) * r ) / r;
    },

    fromPercent: function( percent, total, decimal ) {
		var r = Math.pow( 10, decimal || 0 );

        return  Math.round( ( ( total / 100 ) * percent ) * r ) / r;
    }
};

/*
## The animation loop is the loop that make each "frame" happen, i.e. whatever happend
## every 30 to 60 times (or, indeed, "frames") per second - which is the following:
## * the next frame is scheduled
## * the current program (i.e. a draw() Function) is run
## * the background is repainted if it has changed from the previous frame
## * the new 3d scene is painted
## * the stats widget on the top right is updated to show milliseconds taken by each loop
##   frame.
## 
## Note that the followings are NOT done as part of the animation loop:
## * Syntax checking of the program typed by the user (that's checked only when it changed)
## * sound playing. That happens by its own series of timeouts (as defined by the
##   optional "bpm" command) separately from the
##   animation loop.
## * blinking of the cursor
## 
## About the current Function being run:
## note that this might not be the Function corresponding to the very latest
## content of the editor, because of two reasons: the newest content of the editor
## a) might just be syntactically incorrect or, b) even if it's syntactically correct
## it might not be "stable" i.e. it might have thrown
## a runtime error (for example used an undefined variable or function).
## 
## Rather, the current
## draw() function is the latest program that is both syntactically correct and
## "stable" (or in the process of being proven stable). Stability of a
## program cannot be guaranteed, but LiveCodeLab heuristically considers as "stable" a
## program once it's able to run for 5 frames without throwing errors. If the program
## throws an error past this testing window, then LiveCodeLab currently has no
## further fallback, so the Function will be just run each frame and hope is that
## it has time to draw enough animation on the screen before it throws the error so that
## some kind of animation will still be playing.
## One could devise a mechanism by which a stack of stable functions is maintained, so
## each failing function of the stack would cause the previous one to become the current
## stable alternative. This would practically guarantee that there is a Function that
## is simple enough in the past that it would contain no runtime errors - unless a
## previous function has so dramatically borked the state of the entire system, but
## that would probably take some malice.
*/

var AnimationLoop, lastTime, vendors, x;

AnimationLoop = (function() {
  "use strict";  AnimationLoop.prototype.loopInterval = null;

  AnimationLoop.prototype.wantedFramesPerSecond = null;

  AnimationLoop.prototype.liveCodeLabCoreInstance = void 0;

  AnimationLoop.prototype.AS_HIGH_FPS_AS_POSSIBLE = -1;

  function AnimationLoop(eventRouter, stats, liveCodeLabCoreInstance, forceUseOfTimeoutForScheduling) {
    this.eventRouter = eventRouter;
    this.stats = stats;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    this.forceUseOfTimeoutForScheduling = forceUseOfTimeoutForScheduling != null ? forceUseOfTimeoutForScheduling : false;
    this.wantedFramesPerSecond = this.AS_HIGH_FPS_AS_POSSIBLE;
    window.frame = 0;
  }

  AnimationLoop.prototype.scheduleNextFrame = function() {
    var loopInterval,
      _this = this;

    if (this.forceUseOfTimeoutForScheduling) {
      if (this.wantedFramesPerSecond === this.AS_HIGH_FPS_AS_POSSIBLE) {
        return setTimeout((function() {
          return _this.animate();
        }), 1000 / 60);
      } else {
        return setTimeout((function() {
          return _this.animate();
        }), 1000 / this.wantedFramesPerSecond);
      }
    } else {
      if (this.wantedFramesPerSecond === this.AS_HIGH_FPS_AS_POSSIBLE) {
        return window.requestAnimationFrame(function() {
          return _this.animate();
        });
      } else {
        if (loopInterval === undefined) {
          return loopInterval = setInterval(function() {
            return window.requestAnimationFrame(function() {
              return this.animate();
            });
          }, 1000 / this.wantedFramesPerSecond);
        }
      }
    }
  };

  AnimationLoop.prototype.animate = function() {
    var drawFunctionRunner, e;

    this.liveCodeLabCoreInstance.matrixCommands.resetMatrixStack();
    this.liveCodeLabCoreInstance.soundSystem.resetLoops();
    if (window.frame === 0) {
      this.liveCodeLabCoreInstance.timeKeeper.resetTime();
    } else {
      this.liveCodeLabCoreInstance.timeKeeper.updateTime();
    }
    this.liveCodeLabCoreInstance.drawFunctionRunner.resetTrackingOfDoOnceOccurrences();
    this.liveCodeLabCoreInstance.soundSystem.anyCodeReactingTobpm = false;
    this.liveCodeLabCoreInstance.soundSystem.SetUpdatesPerMinute(60 * 4);
    this.liveCodeLabCoreInstance.lightSystem.noLights();
    this.liveCodeLabCoreInstance.graphicsCommands.reset();
    this.liveCodeLabCoreInstance.blendControls.animationStyle(this.liveCodeLabCoreInstance.blendControls.animationStyles.normal);
    this.liveCodeLabCoreInstance.backgroundPainter.resetGradientStack();
    if (this.liveCodeLabCoreInstance.drawFunctionRunner.drawFunction) {
      this.scheduleNextFrame();
      try {
        this.liveCodeLabCoreInstance.drawFunctionRunner.runDrawFunction();
      } catch (_error) {
        e = _error;
        this.eventRouter.trigger("runtime-error-thrown", e);
        return;
      }
      drawFunctionRunner = this.liveCodeLabCoreInstance.drawFunctionRunner;
      drawFunctionRunner.putTicksNextToDoOnceBlocksThatHaveBeenRun(this.liveCodeLabCoreInstance.codeTransformer);
    } else {
      this.liveCodeLabCoreInstance.dozingOff = true;
      window.frame = 0;
    }
    if (frame === 0) {
      this.liveCodeLabCoreInstance.timeKeeper.resetTime();
    }
    this.liveCodeLabCoreInstance.blendControls.animationStyleUpdateIfChanged();
    this.liveCodeLabCoreInstance.backgroundPainter.simpleGradientUpdateIfChanged();
    this.liveCodeLabCoreInstance.soundSystem.changeUpdatesPerMinuteIfNeeded();
    window.frame++;
    this.liveCodeLabCoreInstance.renderer.render(this.liveCodeLabCoreInstance.graphicsCommands);
    if (this.stats) {
      return this.stats.update();
    }
  };

  return AnimationLoop;

})();

lastTime = 0;

vendors = ["ms", "moz", "webkit", "o"];

x = 0;

while (x < vendors.length && !window.requestAnimationFrame) {
  window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
  window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"];
  ++x;
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback, element) {
    var currTime, id, timeToCall;

    currTime = new Date().getTime();
    timeToCall = Math.max(0, 16 - (currTime - lastTime));
    id = window.setTimeout(function() {
      return callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    return clearTimeout(id);
  };
}

/*
## Sets up canvas or webgl Threejs renderer based on browser capabilities and flags passed
## in the constructor. Sets up all the post-filtering steps.
*/

var ThreeJsSystem;

ThreeJsSystem = (function() {
  "use strict";  ThreeJsSystem.isWebGLUsed = false;

  ThreeJsSystem.composer = {};

  function ThreeJsSystem(Detector, THREEx, blendedThreeJsSceneCanvas, forceCanvasRenderer, testMode, liveCodeLabCore_three) {
    var currentFrameThreeJsSceneCanvas, effectSaveTarget, fxaaPass, previousFrameThreeJSSceneRenderForBlendingCanvas, renderModel, renderTarget, renderTargetParameters, screenPass;

    this.blendedThreeJsSceneCanvas = blendedThreeJsSceneCanvas;
    this.forceCanvasRenderer = forceCanvasRenderer;
    if (!this.blendedThreeJsSceneCanvas) {
      this.blendedThreeJsSceneCanvas = document.createElement("canvas");
      this.blendedThreeJsSceneCanvas.width = window.innerWidth;
      this.blendedThreeJsSceneCanvas.height = window.innerHeight;
    }
    if (!this.forceCanvasRenderer && Detector.webgl) {
      this.ballDefaultDetLevel = 16;
      this.blendedThreeJsSceneCanvasContext = this.blendedThreeJsSceneCanvas.getContext("experimental-webgl");
      this.renderer = new liveCodeLabCore_three.WebGLRenderer({
        canvas: this.blendedThreeJsSceneCanvas,
        preserveDrawingBuffer: testMode,
        antialias: false,
        premultipliedAlpha: false
      });
      this.isWebGLUsed = true;
    } else {
      this.ballDefaultDetLevel = 6;
      this.currentFrameThreeJsSceneCanvas = document.createElement("canvas");
      currentFrameThreeJsSceneCanvas = this.currentFrameThreeJsSceneCanvas;
      currentFrameThreeJsSceneCanvas.width = this.blendedThreeJsSceneCanvas.width;
      currentFrameThreeJsSceneCanvas.height = this.blendedThreeJsSceneCanvas.height;
      this.currentFrameThreeJsSceneCanvasContext = currentFrameThreeJsSceneCanvas.getContext("2d");
      this.previousFrameThreeJSSceneRenderForBlendingCanvas = document.createElement("canvas");
      previousFrameThreeJSSceneRenderForBlendingCanvas = this.previousFrameThreeJSSceneRenderForBlendingCanvas;
      previousFrameThreeJSSceneRenderForBlendingCanvas.width = this.blendedThreeJsSceneCanvas.width;
      previousFrameThreeJSSceneRenderForBlendingCanvas.height = this.blendedThreeJsSceneCanvas.height;
      this.previousFrameThreeJSSceneRenderForBlendingCanvasContext = this.previousFrameThreeJSSceneRenderForBlendingCanvas.getContext("2d");
      this.blendedThreeJsSceneCanvasContext = this.blendedThreeJsSceneCanvas.getContext("2d");
      this.renderer = new liveCodeLabCore_three.CanvasRenderer({
        canvas: currentFrameThreeJsSceneCanvas,
        antialias: true,
        preserveDrawingBuffer: testMode
      });
    }
    this.renderer.setSize(this.blendedThreeJsSceneCanvas.width, this.blendedThreeJsSceneCanvas.height);
    this.scene = new liveCodeLabCore_three.Scene();
    this.scene.matrixAutoUpdate = false;
    this.camera = new liveCodeLabCore_three.PerspectiveCamera(35, this.blendedThreeJsSceneCanvas.width / this.blendedThreeJsSceneCanvas.height, 1, 10000);
    this.camera.position.set(0, 0, 5);
    this.scene.add(this.camera);
    THREEx.WindowResize.bind(this.renderer, this.camera);
    if (this.isWebGLUsed) {
      renderTargetParameters = void 0;
      renderTarget = void 0;
      effectSaveTarget = void 0;
      fxaaPass = void 0;
      screenPass = void 0;
      renderModel = void 0;
      renderTargetParameters = {
        format: liveCodeLabCore_three.RGBAFormat,
        stencilBuffer: true
      };
      renderTarget = new liveCodeLabCore_three.WebGLRenderTarget(this.blendedThreeJsSceneCanvas.width, this.blendedThreeJsSceneCanvas.height, renderTargetParameters);
      effectSaveTarget = new liveCodeLabCore_three.SavePass(new liveCodeLabCore_three.WebGLRenderTarget(this.blendedThreeJsSceneCanvas.width, this.blendedThreeJsSceneCanvas.height, renderTargetParameters));
      effectSaveTarget.clear = false;
      this.effectBlend = new liveCodeLabCore_three.ShaderPass(liveCodeLabCore_three.ShaderExtras.blend, "tDiffuse1");
      screenPass = new liveCodeLabCore_three.ShaderPass(liveCodeLabCore_three.ShaderExtras.screen);
      this.effectBlend.uniforms.tDiffuse2.value = effectSaveTarget.renderTarget;
      this.effectBlend.uniforms.mixRatio.value = 0;
      renderModel = new liveCodeLabCore_three.RenderPass(this.scene, this.camera);
      this.composer = new liveCodeLabCore_three.EffectComposer(this.renderer, renderTarget);
      this.composer.addPass(renderModel);
      this.composer.addPass(this.effectBlend);
      this.composer.addPass(effectSaveTarget);
      this.composer.addPass(screenPass);
      screenPass.renderToScreen = true;
    }
  }

  return ThreeJsSystem;

})();

/*
## The rendering requires some special steps that allow the display list
## to be reused as much as possible between frames.
*/

var Renderer;

Renderer = (function() {
  "use strict";  function Renderer(liveCodeLabCoreInstance) {
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
  }

  Renderer.prototype.render = function(graphics) {
    var blendedThreeJsSceneCanvasContext, previousFrameThreeJSSceneRenderForBlendingCanvasContext, renderer, threeJsSystem;

    threeJsSystem = this.liveCodeLabCoreInstance.threeJsSystem;
    renderer = threeJsSystem.renderer;
    blendedThreeJsSceneCanvasContext = threeJsSystem.blendedThreeJsSceneCanvasContext;
    previousFrameThreeJSSceneRenderForBlendingCanvasContext = threeJsSystem.previousFrameThreeJSSceneRenderForBlendingCanvasContext;
    this.combDisplayList(graphics);
    if (threeJsSystem.isWebGLUsed) {
      return threeJsSystem.composer.render();
    } else {
      renderer.render(threeJsSystem.scene, threeJsSystem.camera);
      blendedThreeJsSceneCanvasContext.globalAlpha = 1.0;
      blendedThreeJsSceneCanvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
      blendedThreeJsSceneCanvasContext.globalAlpha = this.liveCodeLabCoreInstance.blendControls.blendAmount;
      blendedThreeJsSceneCanvasContext.drawImage(threeJsSystem.previousFrameThreeJSSceneRenderForBlendingCanvas, 0, 0);
      blendedThreeJsSceneCanvasContext.globalAlpha = 1.0;
      blendedThreeJsSceneCanvasContext.drawImage(threeJsSystem.currentFrameThreeJsSceneCanvas, 0, 0);
      previousFrameThreeJSSceneRenderForBlendingCanvasContext.globalCompositeOperation = "copy";
      previousFrameThreeJSSceneRenderForBlendingCanvasContext.drawImage(threeJsSystem.blendedThreeJsSceneCanvas, 0, 0);
      return threeJsSystem.currentFrameThreeJsSceneCanvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  };

  Renderer.prototype.combDisplayList = function(graphics) {
    var i, objectsUsedInFrameCounts, primitiveType, sceneObject, threeJsSystem, _i, _len, _ref, _results;

    i = void 0;
    sceneObject = void 0;
    primitiveType = void 0;
    threeJsSystem = this.liveCodeLabCoreInstance.threeJsSystem;
    objectsUsedInFrameCounts = graphics.objectsUsedInFrameCounts;
    _ref = threeJsSystem.scene.children;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      sceneObject = _ref[_i];
      if (objectsUsedInFrameCounts[sceneObject.primitiveType + sceneObject.detailLevel] > 0) {
        sceneObject.visible = true;
        _results.push(objectsUsedInFrameCounts[sceneObject.primitiveType + sceneObject.detailLevel] -= 1);
      } else {
        _results.push(sceneObject.visible = false);
      }
    }
    return _results;
  };

  return Renderer;

})();

/*
## Defines several color constant literals, e.g. "red" being 0xffff0000,
## modified from processing.js with added the missing ones from the CSS standard,
## which includes the spelling "grey" on top of "gray"
## and also "angleColor", used to dress objects with the normal material.
*/

var ColourLiterals;

ColourLiterals = (function() {
  "use strict";  ColourLiterals.prototype.colourNames = [];

  function ColourLiterals() {
    var colorName, colorValue, colourNamesValues;

    colourNamesValues = {
      aliceblue: "0xfff0f8ff",
      antiquewhite: "0xfffaebd7",
      aqua: "0xff00ffff",
      aquamarine: "0xff7fffd4",
      azure: "0xfff0ffff",
      beige: "0xfff5f5dc",
      bisque: "0xffffe4c4",
      black: "0xff000000",
      blanchedalmond: "0xffffebcd",
      blue: "0xff0000ff",
      blueviolet: "0xff8a2be2",
      brown: "0xffa52a2a",
      burlywood: "0xffdeb887",
      cadetblue: "0xff5f9ea0",
      chartreuse: "0xff7fff00",
      chocolate: "0xffd2691e",
      coral: "0xffff7f50",
      cornflowerblue: "0xff6495ed",
      cornsilk: "0xfffff8dc",
      crimson: "0xffdc143c",
      cyan: "0xff00ffff",
      darkblue: "0xff00008b",
      darkcyan: "0xff008b8b",
      darkgoldenrod: "0xffb8860b",
      darkgray: "0xffa9a9a9",
      darkgrey: "0xffa9a9a9",
      darkgreen: "0xff006400",
      darkkhaki: "0xffbdb76b",
      darkmagenta: "0xff8b008b",
      darkolivegreen: "0xff556b2f",
      darkorange: "0xffff8c00",
      darkorchid: "0xff9932cc",
      darkred: "0xff8b0000",
      darksalmon: "0xffe9967a",
      darkseagreen: "0xff8fbc8f",
      darkslateblue: "0xff483d8b",
      darkslategray: "0xff2f4f4f",
      darkslategrey: "0xff2f4f4f",
      darkturquoise: "0xff00ced1",
      darkviolet: "0xff9400d3",
      deeppink: "0xffff1493",
      deepskyblue: "0xff00bfff",
      dimgray: "0xff696969",
      dimgrey: "0xff696969",
      dodgerblue: "0xff1e90ff",
      firebrick: "0xffb22222",
      floralwhite: "0xfffffaf0",
      forestgreen: "0xff228b22",
      fuchsia: "0xffff00ff",
      gainsboro: "0xffdcdcdc",
      ghostwhite: "0xfff8f8ff",
      gold: "0xffffd700",
      goldenrod: "0xffdaa520",
      gray: "0xff808080",
      grey: "0xff808080",
      green: "0xff008000",
      greenyellow: "0xffadff2f",
      honeydew: "0xfff0fff0",
      hotpink: "0xffff69b4",
      indianred: "0xffcd5c5c",
      indigo: "0xff4b0082",
      ivory: "0xfffffff0",
      khaki: "0xfff0e68c",
      lavender: "0xffe6e6fa",
      lavenderblush: "0xfffff0f5",
      lawngreen: "0xff7cfc00",
      lemonchiffon: "0xfffffacd",
      lightblue: "0xffadd8e6",
      lightcoral: "0xfff08080",
      lightcyan: "0xffe0ffff",
      lightgoldenrodyellow: "0xfffafad2",
      lightgrey: "0xffd3d3d3",
      lightgray: "0xffd3d3d3",
      lightgreen: "0xff90ee90",
      lightpink: "0xffffb6c1",
      lightsalmon: "0xffffa07a",
      lightseagreen: "0xff20b2aa",
      lightskyblue: "0xff87cefa",
      lightslategray: "0xff778899",
      lightslategrey: "0xff778899",
      lightsteelblue: "0xffb0c4de",
      lightyellow: "0xffffffe0",
      lime: "0xff00ff00",
      limegreen: "0xff32cd32",
      linen: "0xfffaf0e6",
      magenta: "0xffff00ff",
      maroon: "0xff800000",
      mediumaquamarine: "0xff66cdaa",
      mediumblue: "0xff0000cd",
      mediumorchid: "0xffba55d3",
      mediumpurple: "0xff9370d8",
      mediumseagreen: "0xff3cb371",
      mediumslateblue: "0xff7b68ee",
      mediumspringgreen: "0xff00fa9a",
      mediumturquoise: "0xff48d1cc",
      mediumvioletred: "0xffc71585",
      midnightblue: "0xff191970",
      mintcream: "0xfff5fffa",
      mistyrose: "0xffffe4e1",
      moccasin: "0xffffe4b5",
      navajowhite: "0xffffdead",
      navy: "0xff000080",
      oldlace: "0xfffdf5e6",
      olive: "0xff808000",
      olivedrab: "0xff6b8e23",
      orange: "0xffffa500",
      orangered: "0xffff4500",
      orchid: "0xffda70d6",
      palegoldenrod: "0xffeee8aa",
      palegreen: "0xff98fb98",
      paleturquoise: "0xffafeeee",
      palevioletred: "0xffd87093",
      papayawhip: "0xffffefd5",
      peachpuff: "0xffffdab9",
      peru: "0xffcd853f",
      pink: "0xffffc0cb",
      plum: "0xffdda0dd",
      powderblue: "0xffb0e0e6",
      purple: "0xff800080",
      red: "0xffff0000",
      rosybrown: "0xffbc8f8f",
      royalblue: "0xff4169e1",
      saddlebrown: "0xff8b4513",
      salmon: "0xfffa8072",
      sandybrown: "0xfff4a460",
      seagreen: "0xff2e8b57",
      seashell: "0xfffff5ee",
      sienna: "0xffa0522d",
      silver: "0xffc0c0c0",
      skyblue: "0xff87ceeb",
      slateblue: "0xff6a5acd",
      slategray: "0xff708090",
      slategrey: "0xff708090",
      snow: "0xfffffafa",
      springgreen: "0xff00ff7f",
      steelblue: "0xff4682b4",
      tan: "0xffd2b48c",
      teal: "0xff008080",
      thistle: "0xffd8bfd8",
      tomato: "0xffff6347",
      turquoise: "0xff40e0d0",
      violet: "0xffee82ee",
      wheat: "0xfff5deb3",
      white: "0xffffffff",
      whitesmoke: "0xfff5f5f5",
      yellow: "0xffffff00",
      yellowgreen: "0xff9acd32",
      angleColor: "angleColor"
    };
    for (colorName in colourNamesValues) {
      colorValue = colourNamesValues[colorName];
      window["" + colorName] = parseInt(colorValue);
      if (isNaN(window["" + colorName])) {
        window["" + colorName] = colorValue;
      }
      this.colourNames.push("" + colorName);
    }
  }

  return ColourLiterals;

})();

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

	canvas: !! window.CanvasRenderingContext2D,
	webgl: ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
	workers: !! window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function () {

		var element = document.createElement( 'div' );
		element.id = 'webgl-error-message';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			element.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' );

		}

		return element;

	},

	addGetWebGLMessage: function ( parameters ) {

		var parent, id, element;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		element = Detector.getWebGLErrorMessage();
		element.id = id;

		parent.appendChild( element );

	}

};

/**
 * @author mr.doob / http://mrdoob.com/
 */

var badgeHeight = 16;

var Stats = function () {

	var _container, _bar, _mode = 1, _modes = 2,
	_frames = 0, _time = Date.now(), _timeLastFrame = _time, _timeLastSecond = _time,
	_fps = 0, _fpsMin = 1000, _fpsMax = 0, _fpsDiv, _fpsText, _fpsGraph,
	_fpsColors = [ [ 0, 0, 0 ], [ 255, 255, 255 ] ],
	_ms = 0, _msMin = 1000, _msMax = 0, _msDiv, _msText, _msGraph,
	_msColors = [ [ 0, 0, 0 ], [ 255, 255, 255 ] ];

	_container = document.createElement( 'div' );
	_container.setAttribute('id','statsWidget'); // added by DDC for LiveCodeLab
	_container.style.display = 'none'; // added by DDC for LiveCodeLab
	_container.style.cursor = 'pointer';
	_container.style.cursor = 'pointer';
	_container.style.width = '74px';
	//_container.style.opacity = '0.9';
	_container.style.zIndex = '6';
	_container.addEventListener( 'mousedown', function ( event ) {

		event.preventDefault();

		_mode = ( _mode + 1 ) % _modes;

		if ( _mode == 0 ) {

			_fpsDiv.style.display = 'block';
			_msDiv.style.display = 'none';

		} else {

			_fpsDiv.style.display = 'none';
			_msDiv.style.display = 'block';

		}

	}, false );

	// fps

	_fpsDiv = document.createElement( 'div' );
	_fpsDiv.style.textAlign = 'right';
	_fpsDiv.style.lineHeight = '1.2em';
	_fpsDiv.style.backgroundColor = 'rgb(0,0,0)';
	_fpsDiv.style.padding = '0 0 0px 0px';
	_fpsDiv.style.display = 'none';
	_container.appendChild( _fpsDiv );

	_fpsText = document.createElement( 'div' );
	_fpsText.style.fontFamily = 'Helvetica, Arial, sans-serif';
	_fpsText.style.fontSize = '9px';
	_fpsText.style.color = 'rgb(' + _fpsColors[ 1 ][ 0 ] + ',' + _fpsColors[ 1 ][ 1 ] + ',' + _fpsColors[ 1 ][ 2 ] + ')';
	_fpsText.style.fontWeight = 'bold';
	_fpsText.innerHTML = 'FPS';
	_fpsDiv.appendChild( _fpsText );

	_fpsGraph = document.createElement( 'div' );
	_fpsGraph.style.position = 'relative';
	_fpsGraph.style.width = '74px';
	_fpsGraph.style.height = badgeHeight + 'px';
	_fpsGraph.style.backgroundColor = 'rgb(' + _fpsColors[ 1 ][ 0 ] + ',' + _fpsColors[ 1 ][ 1 ] + ',' + _fpsColors[ 1 ][ 2 ] + ')';
	_fpsDiv.appendChild( _fpsGraph );

	while ( _fpsGraph.children.length < 74 ) {

		_bar = document.createElement( 'span' );
		_bar.style.width = '1px';
		_bar.style.height = badgeHeight + 'px';
		_bar.style.cssFloat = 'left';
		_bar.style.backgroundColor = 'rgb(' + _fpsColors[ 0 ][ 0 ] + ',' + _fpsColors[ 0 ][ 1 ] + ',' + _fpsColors[ 0 ][ 2 ] + ')';
		_fpsGraph.appendChild( _bar );

	}

	// ms

	_msDiv = document.createElement( 'div' );
	_msDiv.style.textAlign = 'right';
	_msDiv.style.lineHeight = '1.2em';
	_msDiv.style.backgroundColor = 'rgb(0,0,0)';
	_msDiv.style.padding = '0 0 0px 0px';
	_msDiv.style.display = 'block';
	_container.appendChild( _msDiv );

	_msText = document.createElement( 'div' );
	_msText.style.fontFamily = 'Helvetica, Arial, sans-serif';
	_msText.style.fontSize = '9px';
	_msText.style.color = 'rgb(' + _msColors[ 1 ][ 0 ] + ',' + _msColors[ 1 ][ 1 ] + ',' + _msColors[ 1 ][ 2 ] + ')';
	_msText.style.fontWeight = 'bold';
	_msText.innerHTML = 'MS';
	_msDiv.appendChild( _msText );

	_msGraph = document.createElement( 'div' );
	_msGraph.style.position = 'relative';
	_msGraph.style.width = '74px';
	_msGraph.style.height = badgeHeight + 'px';
	_msGraph.style.backgroundColor = 'rgb(' + _msColors[ 1 ][ 0 ] + ',' + _msColors[ 1 ][ 1 ] + ',' + _msColors[ 1 ][ 2 ] + ')';
	_msDiv.appendChild( _msGraph );

	while ( _msGraph.children.length < 74 ) {

		_bar = document.createElement( 'span' );
		_bar.style.width = '1px';
		_bar.style.height = Math.random() * badgeHeight + 'px';
		_bar.style.cssFloat = 'left';
		_bar.style.backgroundColor = 'rgb(' + _msColors[ 0 ][ 0 ] + ',' + _msColors[ 0 ][ 1 ] + ',' + _msColors[ 0 ][ 2 ] + ')';
		_msGraph.appendChild( _bar );

	}

	var _updateGraph = function ( dom, value ) {

		var child = dom.appendChild( dom.firstChild );
		child.style.height = value + 'px';

	}

	return {

		getDomElement: function () {

			return _container;

		},

		getFps: function () {

			return _fps;

		},

		getFpsMin: function () {

			return _fpsMin;

		},

		getFpsMax: function () {

			return _fpsMax;

		},

		getMs: function () {

			return _ms;

		},

		getMsMin: function () {

			return _msMin;

		},

		getMsMax: function () {

			return _msMax;

		},

		update: function () {

			_time = Date.now();

			_ms = _time - _timeLastFrame;
			_msMin = Math.min( _msMin, _ms );
			_msMax = Math.max( _msMax, _ms );

			_msText.textContent = _ms + ' MS ';
			_updateGraph( _msGraph, Math.min( badgeHeight, badgeHeight - ( _ms / 200 ) * badgeHeight ) );

			_timeLastFrame = _time;

			_frames ++;

			if ( _time > _timeLastSecond + 1000 ) {

				_fps = Math.round( ( _frames * 1000 ) / ( _time - _timeLastSecond ) );
				_fpsMin = Math.min( _fpsMin, _fps );
				_fpsMax = Math.max( _fpsMax, _fps );

				_fpsText.textContent = _fps + ' FPS (' + _fpsMin + '-' + _fpsMax + ')';
				_updateGraph( _fpsGraph, Math.min( badgeHeight, badgeHeight - ( _fps / 100 ) * badgeHeight ) );

				_timeLastSecond = _time;
				_frames = 0;

			}

		}

	};

};
// This THREEx helper makes it easy to handle window resize.
// It will update renderer and camera when window is resized.
//
// # Usage
//
// **Step 1**: Start updating renderer and camera
//
// ```var windowResize = THREEx.WindowResize(aRenderer, aCamera)```
//    
// **Step 2**: Start updating renderer and camera
//
// ```windowResize.stop()```
// # Code

//

/** @namespace */
var THREEx	= THREEx 		|| {};

/**
 * Update renderer and camera when the window is resized
 * 
 * @param {Object} renderer the renderer to update
 * @param {Object} Camera the camera to update
*/
THREEx.WindowResize	= function(renderer, camera){
	var callback	= function(){
		// notify the renderer of the size change
		renderer.setSize( window.innerWidth, window.innerHeight );
		// update the camera
		camera.aspect	= window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	}
	// bind the resize event
	window.addEventListener('resize', callback, false);
	// return .stop() the function to stop watching window resize
	return {
		/**
		 * Stop watching window resize
		*/
		stop	: function(){
			window.removeEventListener('resize', callback);
		}
	};
}

THREEx.WindowResize.bind	= function(renderer, camera){
	return THREEx.WindowResize(renderer, camera);
}

/**
 * @author alteredq / http://alteredqualia.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * ShaderExtras currently contains:
 *
 *	screen
 *	convolution
 *	film
 * 	bokeh
 *  sepia
 *	dotscreen
 *	vignette
 *  bleachbypass
 *	basic
 *  dofmipmap
 *  focus
 *  triangleBlur
 *  horizontalBlur + verticalBlur
 *  horizontalTiltShift + verticalTiltShift
 *  blend
 *  fxaa
 *  luminosity
 *  colorCorrection
 *  normalmap
 *  ssao
 *  colorify
 *  unpackDepthRGBA
 */

THREE.ShaderExtras = {

	/* -------------------------------------------------------------------------
	//	Full-screen textured quad shader
	 ------------------------------------------------------------------------- */

	'screen': {

		uniforms: {

			tDiffuse: { type: "t", value: 0, texture: null },
			opacity:  { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float opacity;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 texel = texture2D( tDiffuse, vUv );",
				"gl_FragColor = opacity * texel;",

			"}"

		].join("\n")

	},

	/* ------------------------------------------------------------------------
	//	Convolution shader
	//	  - ported from o3d sample to WebGL / GLSL
	//			http://o3d.googlecode.com/svn/trunk/samples/convolution.html
	------------------------------------------------------------------------ */

	'convolution': {

		uniforms: {

			"tDiffuse" : 		{ type: "t", value: 0, texture: null },
			"uImageIncrement" : { type: "v2", value: new THREE.Vector2( 0.001953125, 0.0 ) },
			"cKernel" : 		{ type: "fv1", value: [] }

		},

		vertexShader: [

			//"#define KERNEL_SIZE 25.0",

			"uniform vec2 uImageIncrement;",

			"varying vec2 vUv;",

			"void main() {",

				"vUv = uv - ( ( KERNEL_SIZE - 1.0 ) / 2.0 ) * uImageIncrement;",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			//"#define KERNEL_SIZE 25",
			"uniform float cKernel[ KERNEL_SIZE ];",

			"uniform sampler2D tDiffuse;",
			"uniform vec2 uImageIncrement;",

			"varying vec2 vUv;",

			"void main() {",

				"vec2 imageCoord = vUv;",
				"vec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );",

				"for( int i = 0; i < KERNEL_SIZE; i ++ ) {",

					"sum += texture2D( tDiffuse, imageCoord ) * cKernel[ i ];",
					"imageCoord += uImageIncrement;",

				"}",

				"gl_FragColor = sum;",

			"}"


		].join("\n")

	},

	/* -------------------------------------------------------------------------

	// Film grain & scanlines shader

	//	- ported from HLSL to WebGL / GLSL
	//	  http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html

	// Screen Space Static Postprocessor
	//
	// Produces an analogue noise overlay similar to a film grain / TV static
	//
	// Original implementation and noise algorithm
	// Pat 'Hawthorne' Shearon
	//
	// Optimized scanlines + noise version with intensity scaling
	// Georg 'Leviathan' Steinrohder

	// This version is provided under a Creative Commons Attribution 3.0 License
	// http://creativecommons.org/licenses/by/3.0/
	 ------------------------------------------------------------------------- */

	'film': {

		uniforms: {

			tDiffuse:   { type: "t", value: 0, texture: null },
			time: 	    { type: "f", value: 0.0 },
			nIntensity: { type: "f", value: 0.5 },
			sIntensity: { type: "f", value: 0.05 },
			sCount: 	{ type: "f", value: 4096 },
			grayscale:  { type: "i", value: 1 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			// control parameter
			"uniform float time;",

			"uniform bool grayscale;",

			// noise effect intensity value (0 = no effect, 1 = full effect)
			"uniform float nIntensity;",

			// scanlines effect intensity value (0 = no effect, 1 = full effect)
			"uniform float sIntensity;",

			// scanlines effect count value (0 = no effect, 4096 = full effect)
			"uniform float sCount;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				// sample the source
				"vec4 cTextureScreen = texture2D( tDiffuse, vUv );",

				// make some noise
				"float x = vUv.x * vUv.y * time *  1000.0;",
				"x = mod( x, 13.0 ) * mod( x, 123.0 );",
				"float dx = mod( x, 0.01 );",

				// add noise
				"vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx * 100.0, 0.0, 1.0 );",

				// get us a sine and cosine
				"vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );",

				// add scanlines
				"cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;",

				// interpolate between source and result by intensity
				"cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );",

				// convert to grayscale if desired
				"if( grayscale ) {",

					"cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );",

				"}",

				"gl_FragColor =  vec4( cResult, cTextureScreen.a );",

			"}"

		].join("\n")

	},


	/* -------------------------------------------------------------------------
	//	Depth-of-field shader with bokeh
	//	ported from GLSL shader by Martins Upitis
	//	http://artmartinsh.blogspot.com/2010/02/glsl-lens-blur-filter-with-bokeh.html
	 ------------------------------------------------------------------------- */

	'bokeh'	: {

	uniforms: { tColor:   { type: "t", value: 0, texture: null },
				tDepth:   { type: "t", value: 1, texture: null },
				focus:    { type: "f", value: 1.0 },
				aspect:   { type: "f", value: 1.0 },
				aperture: { type: "f", value: 0.025 },
				maxblur:  { type: "f", value: 1.0 },
			  },

	vertexShader: [

	"varying vec2 vUv;",

	"void main() {",

		"vUv = vec2( uv.x, 1.0 - uv.y );",
		"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

	"}"

	].join("\n"),

	fragmentShader: [

	"varying vec2 vUv;",

	"uniform sampler2D tColor;",
	"uniform sampler2D tDepth;",

	"uniform float maxblur;",  	// max blur amount
	"uniform float aperture;",	// aperture - bigger values for shallower depth of field

	"uniform float focus;",
	"uniform float aspect;",

	"void main() {",

		"vec2 aspectcorrect = vec2( 1.0, aspect );",

		"vec4 depth1 = texture2D( tDepth, vUv );",

		"float factor = depth1.x - focus;",

		"vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );",

		"vec2 dofblur9 = dofblur * 0.9;",
		"vec2 dofblur7 = dofblur * 0.7;",
		"vec2 dofblur4 = dofblur * 0.4;",

		"vec4 col = vec4( 0.0 );",

		"col += texture2D( tColor, vUv.xy );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );",

		"col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );",

		"col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );",

		"col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );",
		"col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );",
		"col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );",

		"gl_FragColor = col / 41.0;",
		"gl_FragColor.a = 1.0;",

	"}"

	].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Depth-of-field shader using mipmaps
	//	- from Matt Handley @applmak
	//	- requires power-of-2 sized render target with enabled mipmaps
	 ------------------------------------------------------------------------- */

	'dofmipmap': {

		uniforms: {

			tColor:   { type: "t", value: 0, texture: null },
			tDepth:   { type: "t", value: 1, texture: null },
			focus:    { type: "f", value: 1.0 },
			maxblur:  { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float focus;",
			"uniform float maxblur;",

			"uniform sampler2D tColor;",
			"uniform sampler2D tDepth;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 depth = texture2D( tDepth, vUv );",

				"float factor = depth.x - focus;",

				"vec4 col = texture2D( tColor, vUv, 2.0 * maxblur * abs( focus - depth.x ) );",

				"gl_FragColor = col;",
				"gl_FragColor.a = 1.0;",

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Sepia tone shader
	//  - based on glfx.js sepia shader
	//		https://github.com/evanw/glfx.js
	 ------------------------------------------------------------------------- */

	'sepia': {

		uniforms: {

			tDiffuse: { type: "t", value: 0, texture: null },
			amount:   { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float amount;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 color = texture2D( tDiffuse, vUv );",
				"vec3 c = color.rgb;",

				"color.r = dot( c, vec3( 1.0 - 0.607 * amount, 0.769 * amount, 0.189 * amount ) );",
				"color.g = dot( c, vec3( 0.349 * amount, 1.0 - 0.314 * amount, 0.168 * amount ) );",
				"color.b = dot( c, vec3( 0.272 * amount, 0.534 * amount, 1.0 - 0.869 * amount ) );",

				"gl_FragColor = vec4( min( vec3( 1.0 ), color.rgb ), color.a );",

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Dot screen shader
	//  - based on glfx.js sepia shader
	//		https://github.com/evanw/glfx.js
	 ------------------------------------------------------------------------- */

	'dotscreen': {

		uniforms: {

			tDiffuse: { type: "t", value: 0, texture: null },
			tSize:    { type: "v2", value: new THREE.Vector2( 256, 256 ) },
			center:   { type: "v2", value: new THREE.Vector2( 0.5, 0.5 ) },
			angle:	  { type: "f", value: 1.57 },
			scale:	  { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform vec2 center;",
			"uniform float angle;",
			"uniform float scale;",
			"uniform vec2 tSize;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"float pattern() {",

				"float s = sin( angle ), c = cos( angle );",

				"vec2 tex = vUv * tSize - center;",
				"vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;",

				"return ( sin( point.x ) * sin( point.y ) ) * 4.0;",

			"}",

			"void main() {",

				"vec4 color = texture2D( tDiffuse, vUv );",

				"float average = ( color.r + color.g + color.b ) / 3.0;",

				"gl_FragColor = vec4( vec3( average * 10.0 - 5.0 + pattern() ), color.a );",

			"}"

		].join("\n")

	},

	/* ------------------------------------------------------------------------------------------------
	//	Vignette shader
	//	- based on PaintEffect postprocess from ro.me
	//		http://code.google.com/p/3-dreams-of-black/source/browse/deploy/js/effects/PaintEffect.js
	 ------------------------------------------------------------------------------------------------ */

	'vignette': {

		uniforms: {

			tDiffuse: { type: "t", value: 0, texture: null },
			offset:   { type: "f", value: 1.0 },
			darkness: { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float offset;",
			"uniform float darkness;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				// Eskil's vignette

				"vec4 texel = texture2D( tDiffuse, vUv );",
				"vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );",
				"gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );",

				/*
				// alternative version from glfx.js
				// this one makes more "dusty" look (as opposed to "burned")

				"vec4 color = texture2D( tDiffuse, vUv );",
				"float dist = distance( vUv, vec2( 0.5 ) );",
				"color.rgb *= smoothstep( 0.8, offset * 0.799, dist *( darkness + offset ) );",
				"gl_FragColor = color;",
				*/

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Bleach bypass shader [http://en.wikipedia.org/wiki/Bleach_bypass]
	//	- based on Nvidia example
	//		http://developer.download.nvidia.com/shaderlibrary/webpages/shader_library.html#post_bleach_bypass
	 ------------------------------------------------------------------------- */

	'bleachbypass': {

		uniforms: {

			tDiffuse: { type: "t", value: 0, texture: null },
			opacity:  { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float opacity;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 base = texture2D( tDiffuse, vUv );",

				"vec3 lumCoeff = vec3( 0.25, 0.65, 0.1 );",
				"float lum = dot( lumCoeff, base.rgb );",
				"vec3 blend = vec3( lum );",

				"float L = min( 1.0, max( 0.0, 10.0 * ( lum - 0.45 ) ) );",

				"vec3 result1 = 2.0 * base.rgb * blend;",
				"vec3 result2 = 1.0 - 2.0 * ( 1.0 - blend ) * ( 1.0 - base.rgb );",

				"vec3 newColor = mix( result1, result2, L );",

				"float A2 = opacity * base.a;",
				"vec3 mixRGB = A2 * newColor.rgb;",
				"mixRGB += ( ( 1.0 - A2 ) * base.rgb );",

				"gl_FragColor = vec4( mixRGB, base.a );",

			"}"

		].join("\n")

	},

	/* --------------------------------------------------------------------------------------------------
	//	Focus shader
	//	- based on PaintEffect postprocess from ro.me
	//		http://code.google.com/p/3-dreams-of-black/source/browse/deploy/js/effects/PaintEffect.js
	 -------------------------------------------------------------------------------------------------- */

	'focus': {

		uniforms : {

			"tDiffuse": 		{ type: "t", value: 0, texture: null },
			"screenWidth": 		{ type: "f", value: 1024 },
			"screenHeight": 	{ type: "f", value: 1024 },
			"sampleDistance": 	{ type: "f", value: 0.94 },
			"waveFactor": 		{ type: "f", value: 0.00125 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float screenWidth;",
			"uniform float screenHeight;",
			"uniform float sampleDistance;",
			"uniform float waveFactor;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 color, org, tmp, add;",
				"float sample_dist, f;",
				"vec2 vin;",
				"vec2 uv = vUv;",

				"add += color = org = texture2D( tDiffuse, uv );",

				"vin = ( uv - vec2( 0.5 ) ) * vec2( 1.4 );",
				"sample_dist = dot( vin, vin ) * 2.0;",

				"f = ( waveFactor * 100.0 + sample_dist ) * sampleDistance * 4.0;",

				"vec2 sampleSize = vec2(  1.0 / screenWidth, 1.0 / screenHeight ) * vec2( f );",

				"add += tmp = texture2D( tDiffuse, uv + vec2( 0.111964, 0.993712 ) * sampleSize );",
				"if( tmp.b < color.b ) color = tmp;",

				"add += tmp = texture2D( tDiffuse, uv + vec2( 0.846724, 0.532032 ) * sampleSize );",
				"if( tmp.b < color.b ) color = tmp;",

				"add += tmp = texture2D( tDiffuse, uv + vec2( 0.943883, -0.330279 ) * sampleSize );",
				"if( tmp.b < color.b ) color = tmp;",

				"add += tmp = texture2D( tDiffuse, uv + vec2( 0.330279, -0.943883 ) * sampleSize );",
				"if( tmp.b < color.b ) color = tmp;",

				"add += tmp = texture2D( tDiffuse, uv + vec2( -0.532032, -0.846724 ) * sampleSize );",
				"if( tmp.b < color.b ) color = tmp;",

				"add += tmp = texture2D( tDiffuse, uv + vec2( -0.993712, -0.111964 ) * sampleSize );",
				"if( tmp.b < color.b ) color = tmp;",

				"add += tmp = texture2D( tDiffuse, uv + vec2( -0.707107, 0.707107 ) * sampleSize );",
				"if( tmp.b < color.b ) color = tmp;",

				"color = color * vec4( 2.0 ) - ( add / vec4( 8.0 ) );",
				"color = color + ( add / vec4( 8.0 ) - color ) * ( vec4( 1.0 ) - vec4( sample_dist * 0.5 ) );",

				"gl_FragColor = vec4( color.rgb * color.rgb * vec3( 0.95 ) + color.rgb, 1.0 );",

			"}"


		].join("\n")
	},

	/* -------------------------------------------------------------------------
	//	Triangle blur shader
	//  - based on glfx.js triangle blur shader
	//		https://github.com/evanw/glfx.js

	// 	A basic blur filter, which convolves the image with a
	// 	pyramid filter. The pyramid filter is separable and is applied as two
	//  perpendicular triangle filters.
	 ------------------------------------------------------------------------- */

	'triangleBlur': {


		uniforms : {

			"texture": 	{ type: "t", value: 0, texture: null },
			"delta": 	{ type: "v2", value:new THREE.Vector2( 1, 1 )  }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

		"#define ITERATIONS 10.0",

		"uniform sampler2D texture;",
		"uniform vec2 delta;",

		"varying vec2 vUv;",

		"float random( vec3 scale, float seed ) {",

			// use the fragment position for a different seed per-pixel

			"return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed );",

		"}",

		"void main() {",

			"vec4 color = vec4( 0.0 );",

			"float total = 0.0;",

			// randomize the lookup values to hide the fixed number of samples

			"float offset = random( vec3( 12.9898, 78.233, 151.7182 ), 0.0 );",

			"for ( float t = -ITERATIONS; t <= ITERATIONS; t ++ ) {",

				"float percent = ( t + offset - 0.5 ) / ITERATIONS;",
				"float weight = 1.0 - abs( percent );",

				"color += texture2D( texture, vUv + delta * percent ) * weight;",
				"total += weight;",

			"}",

			"gl_FragColor = color / total;",

		"}",

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Simple test shader
	 ------------------------------------------------------------------------- */

	'basic': {

		uniforms: {},

		vertexShader: [

			"void main() {",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"void main() {",

				"gl_FragColor = vec4( 1.0, 0.0, 0.0, 0.5 );",

			"}"

		].join("\n")

	},

	/* --------------------------------------------------------------------------------------------------
	//	Two pass Gaussian blur filter (horizontal and vertical blur shaders)
	//	- described in http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
	//	  and used in http://www.cake23.de/traveling-wavefronts-lit-up.html
	//
	//	- 9 samples per pass
	//	- standard deviation 2.7
	//	- "h" and "v" parameters should be set to "1 / width" and "1 / height"
	 -------------------------------------------------------------------------------------------------- */

	'horizontalBlur': {

		uniforms: {

			"tDiffuse": { type: "t", value: 0, texture: null },
			"h": 		{ type: "f", value: 1.0 / 512.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",
			"uniform float h;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 sum = vec4( 0.0 );",

				"sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;",
				"sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, 		  	vUv.y ) ) * 0.1633;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;",

				"gl_FragColor = sum;",

			"}"


		].join("\n")

	},

	'verticalBlur': {

		uniforms: {

			"tDiffuse": { type: "t", value: 0, texture: null },
			"v": 		{ type: "f", value: 1.0 / 512.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",
			"uniform float v;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 sum = vec4( 0.0 );",

				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y			  ) ) * 0.1633;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;",

				"gl_FragColor = sum;",

			"}"


		].join("\n")

	},

	/* --------------------------------------------------------------------------------------------------
	//	Simple fake tilt-shift effect, modulating two pass Gaussian blur (see above) by vertical position
	//
	//	- 9 samples per pass
	//	- standard deviation 2.7
	//	- "h" and "v" parameters should be set to "1 / width" and "1 / height"
	//	- "r" parameter control where "focused" horizontal line lies
	 -------------------------------------------------------------------------------------------------- */

	'horizontalTiltShift': {

		uniforms: {

			"tDiffuse": { type: "t", value: 0, texture: null },
			"h": 		{ type: "f", value: 1.0 / 512.0 },
			"r": 		{ type: "f", value: 0.35 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",
			"uniform float h;",
			"uniform float r;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 sum = vec4( 0.0 );",

				"float hh = h * abs( r - vUv.y );",

				"sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * hh, vUv.y ) ) * 0.051;",
				"sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * hh, vUv.y ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * hh, vUv.y ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * hh, vUv.y ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, 		  	 vUv.y ) ) * 0.1633;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * hh, vUv.y ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * hh, vUv.y ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * hh, vUv.y ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * hh, vUv.y ) ) * 0.051;",

				"gl_FragColor = sum;",

			"}"


		].join("\n")

	},

	'verticalTiltShift': {

		uniforms: {

			"tDiffuse": { type: "t", value: 0, texture: null },
			"v": 		{ type: "f", value: 1.0 / 512.0 },
			"r": 		{ type: "f", value: 0.35 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",
			"uniform float v;",
			"uniform float r;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 sum = vec4( 0.0 );",

				"float vv = v * abs( r - vUv.y );",

				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * vv ) ) * 0.051;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * vv ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * vv ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * vv ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y			   ) ) * 0.1633;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * vv ) ) * 0.1531;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * vv ) ) * 0.12245;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * vv ) ) * 0.0918;",
				"sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * vv ) ) * 0.051;",

				"gl_FragColor = sum;",

			"}"


		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Blend two textures
	 ------------------------------------------------------------------------- */

	'blend': {

		uniforms: {

			tDiffuse1: { type: "t", value: 0, texture: null },
			tDiffuse2: { type: "t", value: 1, texture: null },
			mixRatio:  { type: "f", value: 0.5 },
			opacity:   { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float opacity;",
			"uniform float mixRatio;",

			"uniform sampler2D tDiffuse1;",
			"uniform sampler2D tDiffuse2;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 texel1 = texture2D( tDiffuse1, vUv );",
				"vec4 texel2 = texture2D( tDiffuse2, vUv );",
				"vec3 ca = vec3(texel1.x,texel1.y,texel1.z);",
				"vec3 cb = vec3(texel2.x,texel2.y,texel2.z);",
				// correct the colors so that the "shadows"
				// left by the opaque remains of the previous
				// frames are a bit
				// brighter
				//"cb.x = cb.x + cb.x / 2.5;",
				//"cb.y = cb.y + cb.y / 2.5;",
				//"cb.z = cb.z + cb.z / 2.5;",
				"float alphaa = texel1.w ;",
				"float alphab = texel2.w*mixRatio;",
				"float alphao = (alphaa + alphab * (1.0-alphaa));",
				"vec3 co = (1.0/alphao) * (ca * alphaa + cb*alphab*(1.0-alphaa));",
				"vec4 mixxx = vec4(co, alphao );",
				//"gl_FragColor =  mix( texel1, texel1, opop );",
				//"gl_FragColor =  mixxx;",
				//"if (frameC == 0.0) {gl_FragColor =  vec4(0.0); return;}",
				//"float damp = ((1.0-mixRatio)/10.0 + 1.0);",
				//"if (texel1.w == 0.0) { texel2.w = texel2.w * mixRatio; gl_FragColor =  vec4(texel2.x,texel2.y,texel2.z, texel2.w); return;}",
				//"if (texel2.w == 0.0) {gl_FragColor =  texel1; return;}",
				"gl_FragColor =  mixxx;",

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	NVIDIA FXAA by Timothy Lottes
	//		http://timothylottes.blogspot.com/2011/06/fxaa3-source-released.html
	//	- WebGL port by @supereggbert
	//		http://www.glge.org/demos/fxaa/
	 ------------------------------------------------------------------------- */

	'fxaa': {

		uniforms: {

			"tDiffuse": 	{ type: "t", value: 0, texture: null },
			"resolution": 	{ type: "v2", value: new THREE.Vector2( 1 / 1024, 1 / 512 )  }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",
			"uniform vec2 resolution;",

			"varying vec2 vUv;",

			"#define FXAA_REDUCE_MIN   (1.0/128.0)",
			"#define FXAA_REDUCE_MUL   (1.0/8.0)",
			"#define FXAA_SPAN_MAX     8.0",

			"void main() {",

				"vec3 rgbNW = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( -1.0, -1.0 ) ) * resolution ).xyz;",
				"vec3 rgbNE = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( 1.0, -1.0 ) ) * resolution ).xyz;",
				"vec3 rgbSW = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( -1.0, 1.0 ) ) * resolution ).xyz;",
				"vec3 rgbSE = texture2D( tDiffuse, ( gl_FragCoord.xy + vec2( 1.0, 1.0 ) ) * resolution ).xyz;",
				"vec4 rgbaM  = texture2D( tDiffuse,  gl_FragCoord.xy  * resolution );",
				"vec3 rgbM  = rgbaM.xyz;",
				"float opacity  = rgbaM.w;",

				"vec3 luma = vec3( 0.299, 0.587, 0.114 );",

				"float lumaNW = dot( rgbNW, luma );",
				"float lumaNE = dot( rgbNE, luma );",
				"float lumaSW = dot( rgbSW, luma );",
				"float lumaSE = dot( rgbSE, luma );",
				"float lumaM  = dot( rgbM,  luma );",
				"float lumaMin = min( lumaM, min( min( lumaNW, lumaNE ), min( lumaSW, lumaSE ) ) );",
				"float lumaMax = max( lumaM, max( max( lumaNW, lumaNE) , max( lumaSW, lumaSE ) ) );",

				"vec2 dir;",
				"dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));",
				"dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));",

				"float dirReduce = max( ( lumaNW + lumaNE + lumaSW + lumaSE ) * ( 0.25 * FXAA_REDUCE_MUL ), FXAA_REDUCE_MIN );",

				"float rcpDirMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + dirReduce );",
				"dir = min( vec2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX),",
					  "max( vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),",
							"dir * rcpDirMin)) * resolution;",

				"vec3 rgbA = 0.5 * (",
					"texture2D( tDiffuse, gl_FragCoord.xy  * resolution + dir * ( 1.0 / 3.0 - 0.5 ) ).xyz +",
					"texture2D( tDiffuse, gl_FragCoord.xy  * resolution + dir * ( 2.0 / 3.0 - 0.5 ) ).xyz );",

				"vec3 rgbB = rgbA * 0.5 + 0.25 * (",
					"texture2D( tDiffuse, gl_FragCoord.xy  * resolution + dir * -0.5 ).xyz +",
					"texture2D( tDiffuse, gl_FragCoord.xy  * resolution + dir * 0.5 ).xyz );",

				"float lumaB = dot( rgbB, luma );",

				"if ( ( lumaB < lumaMin ) || ( lumaB > lumaMax ) ) {",

					"gl_FragColor = vec4( rgbA, opacity );",

				"} else {",

					"gl_FragColor = vec4( rgbB, opacity );",

				"}",

			"}",

		].join("\n"),

	},

	/* -------------------------------------------------------------------------
	//	Luminosity
	//	http://en.wikipedia.org/wiki/Luminosity
	 ------------------------------------------------------------------------- */

	'luminosity': {

		uniforms: {

			"tDiffuse": 	{ type: "t", value: 0, texture: null }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 texel = texture2D( tDiffuse, vUv );",

				"vec3 luma = vec3( 0.299, 0.587, 0.114 );",

				"float v = dot( texel.xyz, luma );",

				"gl_FragColor = vec4( v, v, v, texel.w );",

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Color correction
	 ------------------------------------------------------------------------- */

	'colorCorrection': {

		uniforms: {

			"tDiffuse" : 	{ type: "t", value: 0, texture: null },
			"powRGB" :		{ type: "v3", value: new THREE.Vector3( 2, 2, 2 ) },
			"mulRGB" :		{ type: "v3", value: new THREE.Vector3( 1, 1, 1 ) }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform sampler2D tDiffuse;",
			"uniform vec3 powRGB;",
			"uniform vec3 mulRGB;",

			"varying vec2 vUv;",

			"void main() {",

				"gl_FragColor = texture2D( tDiffuse, vUv );",
				"gl_FragColor.rgb = mulRGB * pow( gl_FragColor.rgb, powRGB );",

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Normal map shader
	//	- compute normals from heightmap
	 ------------------------------------------------------------------------- */

	'normalmap': {

		uniforms: {

			"heightMap"	: { type: "t", value: 0, texture: null },
			"resolution": { type: "v2", value: new THREE.Vector2( 512, 512 ) },
			"scale"		: { type: "v2", value: new THREE.Vector2( 1, 1 ) },
			"height"	: { type: "f", value: 0.05 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float height;",
			"uniform vec2 resolution;",
			"uniform sampler2D heightMap;",

			"varying vec2 vUv;",

			"void main() {",

				"float val = texture2D( heightMap, vUv ).x;",

				"float valU = texture2D( heightMap, vUv + vec2( 1.0 / resolution.x, 0.0 ) ).x;",
				"float valV = texture2D( heightMap, vUv + vec2( 0.0, 1.0 / resolution.y ) ).x;",

				"gl_FragColor = vec4( ( 0.5 * normalize( vec3( val - valU, val - valV, height  ) ) + 0.5 ), 1.0 );",

			"}",

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Screen-space ambient occlusion shader
	//	- ported from
	//		SSAO GLSL shader v1.2
	//		assembled by Martins Upitis (martinsh) (http://devlog-martinsh.blogspot.com)
	//		original technique is made by ArKano22 (http://www.gamedev.net/topic/550699-ssao-no-halo-artifacts/)
	//	- modifications
	//		- modified to use RGBA packed depth texture (use clear color 1,1,1,1 for depth pass)
	//		- made fog more compatible with three.js linear fog
	//		- refactoring and optimizations
	 ------------------------------------------------------------------------- */

	'ssao': {

		uniforms: {

			"tDiffuse": 	{ type: "t", value: 0, texture: null },
			"tDepth":   	{ type: "t", value: 1, texture: null },
			"size": 		{ type: "v2", value: new THREE.Vector2( 512, 512 ) },
			"cameraNear":	{ type: "f", value: 1 },
			"cameraFar":	{ type: "f", value: 100 },
			"fogNear":		{ type: "f", value: 5 },
			"fogFar":		{ type: "f", value: 100 },
			"fogEnabled":	{ type: "i", value: 0 },
			"aoClamp":		{ type: "f", value: 0.3 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",

				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float cameraNear;",
			"uniform float cameraFar;",

			"uniform float fogNear;",
			"uniform float fogFar;",

			"uniform bool fogEnabled;",

			"uniform vec2 size;",		// texture width, height
			"uniform float aoClamp;", 	// depth clamp - reduces haloing at screen edges

			"uniform sampler2D tDiffuse;",
			"uniform sampler2D tDepth;",

			"varying vec2 vUv;",

			//"#define PI 3.14159265",
			"#define DL 2.399963229728653", // PI * ( 3.0 - sqrt( 5.0 ) )
			"#define EULER 2.718281828459045",

			// helpers

			"float width = size.x;", 	// texture width
			"float height = size.y;", 	// texture height

			"float cameraFarPlusNear = cameraFar + cameraNear;",
			"float cameraFarMinusNear = cameraFar - cameraNear;",
			"float cameraCoef = 2.0 * cameraNear;",

			// user variables

			"const int samples = 8;", 		// ao sample count
			"const float radius = 5.0;", 	// ao radius

			"const bool useNoise = false;", 		 // use noise instead of pattern for sample dithering
			"const float noiseAmount = 0.0002;", // dithering amount

			"const float diffArea = 0.4;", 		// self-shadowing reduction
			"const float gDisplace = 0.4;", 	// gauss bell center

			"const bool onlyAO = false;", 		// use only ambient occlusion pass?
			"const float lumInfluence = 0.3;",  // how much luminance affects occlusion

			// RGBA depth

			"float unpackDepth( const in vec4 rgba_depth ) {",

				"const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );",
				"float depth = dot( rgba_depth, bit_shift );",
				"return depth;",

			"}",

			// generating noise / pattern texture for dithering

			"vec2 rand( const vec2 coord ) {",

				"vec2 noise;",

				"if ( useNoise ) {",

					"float nx = dot ( coord, vec2( 12.9898, 78.233 ) );",
					"float ny = dot ( coord, vec2( 12.9898, 78.233 ) * 2.0 );",

					"noise = clamp( fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0 );",

				"} else {",

					"float ff = fract( 1.0 - coord.s * ( width / 2.0 ) );",
					"float gg = fract( coord.t * ( height / 2.0 ) );",

					"noise = vec2( 0.25, 0.75 ) * vec2( ff ) + vec2( 0.75, 0.25 ) * gg;",

				"}",

				"return ( noise * 2.0  - 1.0 ) * noiseAmount;",

			"}",

			"float doFog() {",

				"float zdepth = unpackDepth( texture2D( tDepth, vUv ) );",
				"float depth = -cameraFar * cameraNear / ( zdepth * cameraFarMinusNear - cameraFar );",

				"return smoothstep( fogNear, fogFar, depth );",

			"}",

			"float readDepth( const in vec2 coord ) {",

				//"return ( 2.0 * cameraNear ) / ( cameraFar + cameraNear - unpackDepth( texture2D( tDepth, coord ) ) * ( cameraFar - cameraNear ) );",
				"return cameraCoef / ( cameraFarPlusNear - unpackDepth( texture2D( tDepth, coord ) ) * cameraFarMinusNear );",


			"}",

			"float compareDepths( const in float depth1, const in float depth2, inout int far ) {",

				"float garea = 2.0;", 						 // gauss bell width
				"float diff = ( depth1 - depth2 ) * 100.0;", // depth difference (0-100)

				// reduce left bell width to avoid self-shadowing

				"if ( diff < gDisplace ) {",

					"garea = diffArea;",

				"} else {",

					"far = 1;",

				"}",

				"float dd = diff - gDisplace;",
				"float gauss = pow( EULER, -2.0 * dd * dd / ( garea * garea ) );",
				"return gauss;",

			"}",

			"float calcAO( float depth, float dw, float dh ) {",

				"float dd = radius - depth * radius;",
				"vec2 vv = vec2( dw, dh );",

				"vec2 coord1 = vUv + dd * vv;",
				"vec2 coord2 = vUv - dd * vv;",

				"float temp1 = 0.0;",
				"float temp2 = 0.0;",

				"int far = 0;",
				"temp1 = compareDepths( depth, readDepth( coord1 ), far );",

				// DEPTH EXTRAPOLATION

				"if ( far > 0 ) {",

					"temp2 = compareDepths( readDepth( coord2 ), depth, far );",
					"temp1 += ( 1.0 - temp1 ) * temp2;",

				"}",

				"return temp1;",

			"}",

			"void main() {",

				"vec2 noise = rand( vUv );",
				"float depth = readDepth( vUv );",

				"float tt = clamp( depth, aoClamp, 1.0 );",

				"float w = ( 1.0 / width )  / tt + ( noise.x * ( 1.0 - noise.x ) );",
				"float h = ( 1.0 / height ) / tt + ( noise.y * ( 1.0 - noise.y ) );",

				"float pw;",
				"float ph;",

				"float ao;",

				"float dz = 1.0 / float( samples );",
				"float z = 1.0 - dz / 2.0;",
				"float l = 0.0;",

				"for ( int i = 0; i <= samples; i ++ ) {",

					"float r = sqrt( 1.0 - z );",

					"pw = cos( l ) * r;",
					"ph = sin( l ) * r;",
					"ao += calcAO( depth, pw * w, ph * h );",
					"z = z - dz;",
					"l = l + DL;",

				"}",

				"ao /= float( samples );",
				"ao = 1.0 - ao;",

				"if ( fogEnabled ) {",

					"ao = mix( ao, 1.0, doFog() );",

				"}",

				"vec3 color = texture2D( tDiffuse, vUv ).rgb;",

				"vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );",
				"float lum = dot( color.rgb, lumcoeff );",
				"vec3 luminance = vec3( lum );",

				"vec3 final = vec3( color * mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );", // mix( color * ao, white, luminance )

				"if ( onlyAO ) {",

					"final = vec3( mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );", // ambient occlusion only

				"}",

				"gl_FragColor = vec4( final, 1.0 );",

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Colorify shader
	 ------------------------------------------------------------------------- */

	'colorify': {

		uniforms: {

			tDiffuse: { type: "t", value: 0, texture: null },
			color:    { type: "c", value: new THREE.Color( 0xffffff ) }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform vec3 color;",
			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			"void main() {",

				"vec4 texel = texture2D( tDiffuse, vUv );",

				"vec3 luma = vec3( 0.299, 0.587, 0.114 );",
				"float v = dot( texel.xyz, luma );",

				"gl_FragColor = vec4( v * color, texel.w );",

			"}"

		].join("\n")

	},

	/* -------------------------------------------------------------------------
	//	Unpack RGBA depth shader
	//	- show RGBA encoded depth as monochrome color
	 ------------------------------------------------------------------------- */

	'unpackDepthRGBA': {

		uniforms: {

			tDiffuse: { type: "t", value: 0, texture: null },
			opacity:  { type: "f", value: 1.0 }

		},

		vertexShader: [

			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),

		fragmentShader: [

			"uniform float opacity;",

			"uniform sampler2D tDiffuse;",

			"varying vec2 vUv;",

			// RGBA depth

			"float unpackDepth( const in vec4 rgba_depth ) {",

				"const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );",
				"float depth = dot( rgba_depth, bit_shift );",
				"return depth;",

			"}",

			"void main() {",

				"float depth = 1.0 - unpackDepth( texture2D( tDiffuse, vUv ) );",
				"gl_FragColor = opacity * vec4( vec3( depth ), 1.0 );",

			"}"

		].join("\n")

	},

	// METHODS

	buildKernel: function( sigma ) {

		// We lop off the sqrt(2 * pi) * sigma term, since we're going to normalize anyway.

		function gauss( x, sigma ) {

			return Math.exp( - ( x * x ) / ( 2.0 * sigma * sigma ) );

		}

		var i, values, sum, halfWidth, kMaxKernelSize = 25, kernelSize = 2 * Math.ceil( sigma * 3.0 ) + 1;

		if ( kernelSize > kMaxKernelSize ) kernelSize = kMaxKernelSize;
		halfWidth = ( kernelSize - 1 ) * 0.5

		values = new Array( kernelSize );
		sum = 0.0;
		for ( i = 0; i < kernelSize; ++i ) {

			values[ i ] = gauss( i - halfWidth, sigma );
			sum += values[ i ];

		}

		// normalize the kernel

		for ( i = 0; i < kernelSize; ++i ) values[ i ] /= sum;

		return values;

	}

};

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.EffectComposer = function ( renderer, renderTarget ) {

	this.renderer = renderer;

	this.renderTarget1 = renderTarget;

	if ( this.renderTarget1 === undefined ) {

		var width = window.innerWidth || 1;
		var height = window.innerHeight || 1;

		this.renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		this.renderTarget1 = new THREE.WebGLRenderTarget( width, height, this.renderTargetParameters );

	}

	this.renderTarget2 = this.renderTarget1.clone();

	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;

	this.passes = [];

	this.copyPass = new THREE.ShaderPass( THREE.ShaderExtras[ "screen" ] );

};

THREE.EffectComposer.prototype = {

	swapBuffers: function() {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;

	},

	addPass: function ( pass ) {

		this.passes.push( pass );

	},

	render: function ( delta ) {

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		var maskActive = false;

		var pass, i, il = this.passes.length;

		for ( i = 0; i < il; i ++ ) {

			pass = this.passes[ i ];

			if ( !pass.enabled ) continue;

			pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );

			if ( pass.needsSwap ) {

				if ( maskActive ) {

					var context = this.renderer.context;

					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

					context.stencilFunc( context.EQUAL, 1, 0xffffffff );

				}

				this.swapBuffers();

			}

			if ( pass instanceof THREE.MaskPass ) {

				maskActive = true;

			} else if ( pass instanceof THREE.ClearMaskPass ) {

				maskActive = false;

			}

		}

	},

	reset: function ( renderTarget ) {

		this.renderTarget1 = renderTarget;

		if ( this.renderTarget1 === undefined ) {

			this.renderTarget1 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, this.renderTargetParameters );

		}

		this.renderTarget2 = this.renderTarget1.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

	}

};

// shared ortho camera

THREE.EffectComposer.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

THREE.EffectComposer.quad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), null );

THREE.EffectComposer.scene = new THREE.Scene();
THREE.EffectComposer.scene.add( THREE.EffectComposer.quad );

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.RenderPass = function ( scene, camera, overrideMaterial, clearColor, clearAlpha ) {

	this.scene = scene;
	this.camera = camera;

	this.overrideMaterial = overrideMaterial;

	this.clearColor = clearColor;
	this.clearAlpha = ( clearAlpha !== undefined ) ? clearAlpha : 1;

	this.oldClearColor = new THREE.Color();
	this.oldClearAlpha = 1;

	this.enabled = true;
	this.clear = true;
	this.needsSwap = false;

};

THREE.RenderPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		this.scene.overrideMaterial = this.overrideMaterial;

		if ( this.clearColor ) {

			this.oldClearColor.copy( renderer.getClearColor() );
			this.oldClearAlpha = renderer.getClearAlpha();

			renderer.setClearColor( this.clearColor, this.clearAlpha );

		}

		renderer.render( this.scene, this.camera, readBuffer, this.clear );

		if ( this.clearColor ) {

			renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );

		}

		this.scene.overrideMaterial = null;

	}

};

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.ShaderPass = function ( shader, textureID ) {

	this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

	this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	this.material = new THREE.ShaderMaterial( {

		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	this.renderToScreen = false;

	this.enabled = true;
	this.needsSwap = true;
	this.clear = false;

};

THREE.ShaderPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer;

		}

		THREE.EffectComposer.quad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera );

		} else {

			renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera, writeBuffer, this.clear );

		}

	}

};

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.MaskPass = function ( scene, camera ) {

	this.scene = scene;
	this.camera = camera;

	this.enabled = true;
	this.clear = true;
	this.needsSwap = false;

	this.inverse = false;

};

THREE.MaskPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		var context = renderer.context;

		// don't update color or depth

		context.colorMask( false, false, false, false );
		context.depthMask( false );

		// set up stencil

		var writeValue, clearValue;

		if ( this.inverse ) {

			writeValue = 0;
			clearValue = 1;

		} else {

			writeValue = 1;
			clearValue = 0;

		}

		context.enable( context.STENCIL_TEST );
		context.stencilOp( context.REPLACE, context.REPLACE, context.REPLACE );
		context.stencilFunc( context.ALWAYS, writeValue, 0xffffffff );
		context.clearStencil( clearValue );

		// draw into the stencil buffer

		renderer.render( this.scene, this.camera, readBuffer, this.clear );
		renderer.render( this.scene, this.camera, writeBuffer, this.clear );

		// re-enable update of color and depth

		context.colorMask( true, true, true, true );
		context.depthMask( true );

		// only render where stencil is set to 1

		context.stencilFunc( context.EQUAL, 1, 0xffffffff );  // draw if == 1
		context.stencilOp( context.KEEP, context.KEEP, context.KEEP );

	}

};


THREE.ClearMaskPass = function () {

	this.enabled = true;

};

THREE.ClearMaskPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		var context = renderer.context;

		context.disable( context.STENCIL_TEST );

	}

};

/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.SavePass = function ( renderTarget ) {

	var shader = THREE.ShaderExtras[ "screen" ];

	this.textureID = "tDiffuse";

	this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	this.material = new THREE.ShaderMaterial( {

		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	this.renderTarget = renderTarget;

	if ( this.renderTarget === undefined ) {

		this.renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
		this.renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, this.renderTargetParameters );

	}

	this.enabled = true;
	this.needsSwap = false;
	this.clear = false;

};

THREE.SavePass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer;

		}

		THREE.EffectComposer.quad.material = this.material;

		renderer.render( THREE.EffectComposer.scene, THREE.EffectComposer.camera, this.renderTarget, this.clear );

	}

};

/*
## Extend the Number prototype
## This needs to stay globally defined
## @param func
## @param scope [optional]
*/
Number.prototype.times = function(func, scope) {
  var i, v, _results;

  v = this.valueOf();
  i = 0;
  _results = [];
  while (i < v) {
    func.call(scope || window, i);
    _results.push(i++);
  }
  return _results;
};

window.back = function() {};

window.forward = function() {};

window.close = function() {};

/*
## The user can issue multiple solid fill and gradient fill commands
## and they are all painted on top of each other according to the
## order they have been issued in.
## So for example you can have one gradient and then
## a second one painted over it that uses some transparency.
## 
## This is why solid and gradient fills are all kept in an array
## and each time the user issues one of the two commands, an
## element is added to the array.
## 
## Both solid and gradient fills are stored as elements in the
## array, all elements are the same and accommodate for a description
## that either case (solid/gradient).
## 
## The background/gradients are drawn on a separate 2D canvas
## and we avoid repainting that canvas over and over if the
## painting commands stay the same (i.e. colors of their
## arguments and the order of the commands) across frames.
## 
## For quickly determining whether the order/content of the commands
## has changed across frames,
## a string is kept that represents the whole stack of commands
## issued in the current frame, and similarly the "previous frame"
## string representation is also kept.
## So it's kind of like a simplified JSON representation if you will.
## 
## If the strings are the same across frames, then the 2D layer of
## the background is not repainted, otherwise the array is iterated
## and each background/gradient is painted anew.
## 
## Note that we are not trying to be too clever here - for example
## a solid fill effectively invalidates the contents of the previous
## elements of the array, so we could discard those when such
## a command is issued.
*/

var BackgroundPainter;

BackgroundPainter = (function() {
  "use strict";  function BackgroundPainter(canvasForBackground, liveCodeLabCoreInstance) {
    var backGroundFraction,
      _this = this;

    this.canvasForBackground = canvasForBackground;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    this.gradStack = [];
    this.defaultGradientColor1 = orange;
    this.defaultGradientColor2 = red;
    this.defaultGradientColor3 = black;
    this.whichDefaultBackground = void 0;
    this.currentGradientStackValue = "";
    this.previousGradientStackValue = 0;
    if (!this.canvasForBackground) {
      this.canvasForBackground = document.createElement("canvas");
    }
    backGroundFraction = 1 / 15;
    this.canvasForBackground.width = Math.floor(window.innerWidth * backGroundFraction);
    this.canvasForBackground.height = Math.floor(window.innerHeight * backGroundFraction);
    this.backgroundSceneContext = this.canvasForBackground.getContext("2d");
    window.simpleGradient = function(a, b, c) {
      return _this.simpleGradient(a, b, c);
    };
    window.background = function(a, b, c) {
      return _this.background(a, b, c);
    };
  }

  BackgroundPainter.prototype.simpleGradient = function(a, b, c, d) {
    this.currentGradientStackValue = this.currentGradientStackValue + " " + a + "" + b + "" + c + "" + d + "null ";
    return this.gradStack.push({
      gradStacka: this.liveCodeLabCoreInstance.colourFunctions.color(a),
      gradStackb: this.liveCodeLabCoreInstance.colourFunctions.color(b),
      gradStackc: this.liveCodeLabCoreInstance.colourFunctions.color(c),
      gradStackd: this.liveCodeLabCoreInstance.colourFunctions.color(d),
      solid: null
    });
  };

  BackgroundPainter.prototype.background = function() {
    var a;

    a = this.liveCodeLabCoreInstance.colourFunctions.color(arguments[0], arguments[1], arguments[2], arguments[3]);
    this.currentGradientStackValue = this.currentGradientStackValue + " null null null null " + a + " ";
    return this.gradStack.push({
      gradStacka: undefined,
      gradStackb: undefined,
      gradStackc: undefined,
      gradStackd: undefined,
      solid: a
    });
  };

  BackgroundPainter.prototype.paintARandomBackground = function() {
    if (this.whichDefaultBackground === undefined) {
      this.whichDefaultBackground = Math.floor(Math.random() * 5);
    } else {
      this.whichDefaultBackground = (this.whichDefaultBackground + 1) % 5;
    }
    switch (this.whichDefaultBackground) {
      case 0:
        this.defaultGradientColor1 = orange;
        this.defaultGradientColor2 = red;
        this.defaultGradientColor3 = black;
        $("#fakeStartingBlinkingCursor").css("color", "white");
        break;
      case 1:
        this.defaultGradientColor1 = white;
        this.defaultGradientColor2 = khaki;
        this.defaultGradientColor3 = peachpuff;
        $("#fakeStartingBlinkingCursor").css("color", "LightPink");
        break;
      case 2:
        this.defaultGradientColor1 = lightsteelblue;
        this.defaultGradientColor2 = lightcyan;
        this.defaultGradientColor3 = paleturquoise;
        $("#fakeStartingBlinkingCursor").css("color", "CadetBlue");
        break;
      case 3:
        this.defaultGradientColor1 = silver;
        this.defaultGradientColor2 = lightgrey;
        this.defaultGradientColor3 = gainsboro;
        $("#fakeStartingBlinkingCursor").css("color", "white");
        break;
      case 4:
        this.defaultGradientColor1 = this.liveCodeLabCoreInstance.colourFunctions.color(155, 255, 155);
        this.defaultGradientColor2 = this.liveCodeLabCoreInstance.colourFunctions.color(155, 255, 155);
        this.defaultGradientColor3 = this.liveCodeLabCoreInstance.colourFunctions.color(155, 255, 155);
        $("#fakeStartingBlinkingCursor").css("color", "DarkOliveGreen");
    }
    this.resetGradientStack();
    return this.simpleGradientUpdateIfChanged();
  };

  BackgroundPainter.prototype.resetGradientStack = function() {
    this.currentGradientStackValue = "";
    this.gradStack = [];
    return this.simpleGradient(this.defaultGradientColor1, this.defaultGradientColor2, this.defaultGradientColor3);
  };

  BackgroundPainter.prototype.simpleGradientUpdateIfChanged = function() {
    var color, diagonal, radgrad, scanningGradStack, _i, _len, _ref, _results;

    diagonal = void 0;
    radgrad = void 0;
    color = this.liveCodeLabCoreInstance.colourFunctions.color;
    if (this.currentGradientStackValue !== this.previousGradientStackValue) {
      this.previousGradientStackValue = this.currentGradientStackValue;
      diagonal = Math.sqrt(Math.pow(this.canvasForBackground.width / 2, 2) + Math.pow(this.canvasForBackground.height / 2, 2));
      _ref = this.gradStack;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        scanningGradStack = _ref[_i];
        if (scanningGradStack.gradStacka !== undefined) {
          radgrad = this.backgroundSceneContext.createLinearGradient(this.canvasForBackground.width / 2, 0, this.canvasForBackground.width / 2, this.canvasForBackground.height);
          radgrad.addColorStop(0, color.toString(scanningGradStack.gradStacka));
          radgrad.addColorStop(0.5, color.toString(scanningGradStack.gradStackb));
          radgrad.addColorStop(1, color.toString(scanningGradStack.gradStackc));
          this.backgroundSceneContext.globalAlpha = 1.0;
          this.backgroundSceneContext.fillStyle = radgrad;
          _results.push(this.backgroundSceneContext.fillRect(0, 0, this.canvasForBackground.width, this.canvasForBackground.height));
        } else {
          this.backgroundSceneContext.globalAlpha = 1.0;
          this.backgroundSceneContext.fillStyle = color.toString(scanningGradStack.solid);
          _results.push(this.backgroundSceneContext.fillRect(0, 0, this.canvasForBackground.width, this.canvasForBackground.height));
        }
      }
      return _results;
    }
  };

  return BackgroundPainter;

})();

/*
## The Editor is just a wrapper for the CodeMirror editor. Contains a couple of handful
## functions and hooks-up the contents with the other parts of LiveCodeLab.
*/

var Editor;

Editor = (function() {
  "use strict";  function Editor(eventRouter, codemirror) {
    var _this = this;

    this.eventRouter = eventRouter;
    this.eventRouter.bind("reset", function() {
      return _this.codemirrorInstance.setValue("");
    });
    this.eventRouter.bind("code-updated-by-livecodelab", (function(elaboratedSource) {
      var cursorPositionBeforeAddingCheckMark;

      cursorPositionBeforeAddingCheckMark = _this.codemirrorInstance.getCursor();
      cursorPositionBeforeAddingCheckMark.ch = cursorPositionBeforeAddingCheckMark.ch + 1;
      _this.setValue(elaboratedSource);
      return _this.setCursor(cursorPositionBeforeAddingCheckMark);
    }));
    this.codemirrorInstance = codemirror.fromTextArea(document.getElementById("code"), {
      mode: "livecodelab",
      theme: "night",
      lineNumbers: false,
      indentWithTabs: true,
      tabSize: 1,
      indentUnit: 1,
      lineWrapping: true,
      onBlur: function() {
        return setTimeout(_this.codemirrorInstance.focus, 30);
      },
      onChange: function(editor) {
        return _this.eventRouter.trigger("code_changed", _this.codemirrorInstance.getValue());
      },
      onCursorActivity: function(editor) {
        return _this.suspendDimmingAndCheckIfLink();
      }
    });
  }

  Editor.prototype.focus = function() {
    return this.codemirrorInstance.focus();
  };

  Editor.prototype.getValue = function() {
    return this.codemirrorInstance.getValue();
  };

  Editor.prototype.getCursor = function(a) {
    return this.codemirrorInstance.getCursor(a);
  };

  Editor.prototype.setCursor = function(a, b) {
    return this.codemirrorInstance.setCursor(a, b);
  };

  Editor.prototype.clearHistory = function(a, b) {
    return this.codemirrorInstance.clearHistory(a, b);
  };

  Editor.prototype.getLine = function(a) {
    return this.codemirrorInstance.getLine(a);
  };

  Editor.prototype.setValue = function(a) {
    return this.codemirrorInstance.setValue(a);
  };

  Editor.prototype.lineCount = function() {
    return this.codemirrorInstance.lineCount();
  };

  Editor.prototype.suspendDimmingAndCheckIfLink = function(editor) {
    var currentLineContent, cursorP, program,
      _this = this;

    cursorP = void 0;
    currentLineContent = void 0;
    program = void 0;
    cursorP = this.codemirrorInstance.getCursor(true);
    if (cursorP.ch > 2) {
      currentLineContent = this.codemirrorInstance.getLine(cursorP.line);
      if (currentLineContent.indexOf("// next-tutorial:") === 0) {
        currentLineContent = currentLineContent.substring(17);
        currentLineContent = currentLineContent.replace("_", "");
        program = currentLineContent + "Tutorial";
        setTimeout((function() {
          return _this.eventRouter.trigger("load-program", program);
        }), 200);
      }
    }
    if (this.codemirrorInstance.getValue() === "") {
      return;
    }
    return this.eventRouter.trigger("editor-undim");
  };

  return Editor;

})();

/*
## Closure compiler automatically replaces symbolic Constants.* names with their
## values (it does it for everything it thinks it's a constant really).
*/

var ColourFunctions;

ColourFunctions = (function() {
  "use strict";  function ColourFunctions() {
    var _this = this;

    window.color = function(a, b, c, d) {
      return _this.color(a, b, c, d);
    };
    window.colorToHSB = function(a) {
      return _this.colorToHSB(a);
    };
    window.brightness = function(a) {
      return _this.brightness(a);
    };
    window.saturation = function(a) {
      return _this.saturation(a);
    };
    window.hue = function(a) {
      return _this.hue(a);
    };
    window.redF = function(a) {
      return _this.redF(a);
    };
    window.greenF = function(a) {
      return _this.greenF(a);
    };
    window.blueF = function(a) {
      return _this.blueF(a);
    };
    window.alpha = function(a) {
      return _this.alpha(a);
    };
    window.alphaZeroToOne = function(a) {
      return _this.alphaZeroToOne(a);
    };
    window.lerp = function(a, b, c) {
      return _this.lerp(a, b, c);
    };
    window.lerpColor = function(a, b, c) {
      return _this.lerpColor(a, b, c);
    };
    window.colorMode = function(a, b, c, d, e) {
      return _this.colorMode(a, b, c, d, e);
    };
    window.blendColor = function(a, b, c) {
      return _this.blendColor(a, b, c);
    };
    this.colorModeX = 255;
    this.colorModeY = 255;
    this.colorModeZ = 255;
    this.colorModeA = 255;
    this.Constants = {
      RGB: 1,
      ARGB: 2,
      HSB: 3,
      ALPHA: 4,
      CMYK: 5,
      REPLACE: 0,
      BLEND: 1 << 0,
      ADD: 1 << 1,
      SUBTRACT: 1 << 2,
      LIGHTEST: 1 << 3,
      DARKEST: 1 << 4,
      DIFFERENCE: 1 << 5,
      EXCLUSION: 1 << 6,
      MULTIPLY: 1 << 7,
      SCREEN: 1 << 8,
      OVERLAY: 1 << 9,
      HARD_LIGHT: 1 << 10,
      SOFT_LIGHT: 1 << 11,
      DODGE: 1 << 12,
      BURN: 1 << 13,
      ALPHA_MASK: 0xff000000,
      RED_MASK: 0x00ff0000,
      GREEN_MASK: 0x0000ff00,
      BLUE_MASK: 0x000000ff
    };
    window.HSB = this.Constants.HSB;
    window.RGB = this.Constants.RGB;
    this.curColorMode = this.Constants.RGB;
    this.color.toString = function(colorInt) {
      return "rgba(" + ((colorInt & _this.Constants.RED_MASK) >>> 16) + "," + ((colorInt & _this.Constants.GREEN_MASK) >>> 8) + "," + (colorInt & _this.Constants.BLUE_MASK) + "," + ((colorInt & _this.Constants.ALPHA_MASK) >>> 24) / 255 + ")";
    };
    this.color.toInt = function(r, g, b, a) {
      return (a << 24) & _this.Constants.ALPHA_MASK | (r << 16) & _this.Constants.RED_MASK | (g << 8) & _this.Constants.GREEN_MASK | b & _this.Constants.BLUE_MASK;
    };
    this.color.toArray = function(colorInt) {
      return [(colorInt & _this.Constants.RED_MASK) >>> 16, (colorInt & _this.Constants.GREEN_MASK) >>> 8, colorInt & _this.Constants.BLUE_MASK, (colorInt & _this.Constants.ALPHA_MASK) >>> 24];
    };
    this.color.toGLArray = function(colorInt) {
      return [((colorInt & _this.Constants.RED_MASK) >>> 16) / 255, ((colorInt & _this.Constants.GREEN_MASK) >>> 8) / 255, (colorInt & _this.Constants.BLUE_MASK) / 255, ((colorInt & _this.Constants.ALPHA_MASK) >>> 24) / 255];
    };
    this.color.toRGB = function(h, s, b) {
      var br, f, hue, p, q, t;

      br = void 0;
      hue = void 0;
      f = void 0;
      p = void 0;
      q = void 0;
      t = void 0;
      h = (h > _this.colorModeX ? _this.colorModeX : h);
      s = (s > _this.colorModeY ? _this.colorModeY : s);
      b = (b > _this.colorModeZ ? _this.colorModeZ : b);
      h = (h / _this.colorModeX) * 360;
      s = (s / _this.colorModeY) * 100;
      b = (b / _this.colorModeZ) * 100;
      br = Math.round(b / 100 * 255);
      if (s === 0) {
        return [br, br, br];
      }
      hue = h % 360;
      f = hue % 60;
      p = Math.round((b * (100 - s)) / 10000 * 255);
      q = Math.round((b * (6000 - s * f)) / 600000 * 255);
      t = Math.round((b * (6000 - s * (60 - f))) / 600000 * 255);
      switch (Math.floor(hue / 60)) {
        case 0:
          return [br, t, p];
        case 1:
          return [q, br, p];
        case 2:
          return [p, br, t];
        case 3:
          return [p, q, br];
        case 4:
          return [t, p, br];
        case 5:
          return [br, p, q];
      }
    };
    this.modes = this.modesFunction();
  }

  ColourFunctions.prototype.color$4 = function(aValue1, aValue2, aValue3, aValue4) {
    var a, b, g, r, rgb;

    r = void 0;
    g = void 0;
    b = void 0;
    a = void 0;
    rgb = void 0;
    if (this.curColorMode === this.Constants.HSB) {
      rgb = this.color.toRGB(aValue1, aValue2, aValue3);
      r = rgb[0];
      g = rgb[1];
      b = rgb[2];
    } else {
      r = Math.round(255 * (aValue1 / this.colorModeX));
      g = Math.round(255 * (aValue2 / this.colorModeY));
      b = Math.round(255 * (aValue3 / this.colorModeZ));
    }
    a = Math.round(255 * (aValue4 / this.colorModeA));
    r = (r < 0 ? 0 : r);
    g = (g < 0 ? 0 : g);
    b = (b < 0 ? 0 : b);
    a = (a < 0 ? 0 : a);
    r = (r > 255 ? 255 : r);
    g = (g > 255 ? 255 : g);
    b = (b > 255 ? 255 : b);
    a = (a > 255 ? 255 : a);
    return (a << 24) & this.Constants.ALPHA_MASK | (r << 16) & this.Constants.RED_MASK | (g << 8) & this.Constants.GREEN_MASK | b & this.Constants.BLUE_MASK;
  };

  ColourFunctions.prototype.color$2 = function(aValue1, aValue2) {
    var a, angleColor;

    a = void 0;
    angleColor = -16777217;
    if (aValue1 === angleColor) {
      return angleColor;
    }
    if (aValue1 & this.Constants.ALPHA_MASK) {
      a = Math.round(255 * (aValue2 / this.colorModeA));
      a = (a > 255 ? 255 : a);
      a = (a < 0 ? 0 : a);
      return aValue1 - (aValue1 & this.Constants.ALPHA_MASK) + ((a << 24) & this.Constants.ALPHA_MASK);
    }
    if (this.curColorMode === this.Constants.RGB) {
      return this.color$4(aValue1, aValue1, aValue1, aValue2);
    }
    if (this.curColorMode === this.Constants.HSB) {
      return this.color$4(0, 0, (aValue1 / this.colorModeX) * this.colorModeZ, aValue2);
    }
  };

  ColourFunctions.prototype.color$1 = function(aValue1) {
    if ((typeof aValue1) === "string") {
      return aValue1;
    }
    if (aValue1 <= this.colorModeX && aValue1 >= 0) {
      if (this.curColorMode === this.Constants.RGB) {
        return this.color$4(aValue1, aValue1, aValue1, this.colorModeA);
      }
      if (this.curColorMode === this.Constants.HSB) {
        return this.color$4(0, 0, (aValue1 / this.colorModeX) * this.colorModeZ, this.colorModeA);
      }
    }
    if (aValue1) {
      if (aValue1 > 2147483647) {
        aValue1 -= 4294967296;
      }
      return aValue1;
    }
  };

  /*
  Creates colors for storing in variables of the color datatype. The parameters are
  interpreted as RGB or HSB values depending on the current colorMode(). The default
  mode is RGB values from 0 to 255 and therefore, the function call color(255, 204, 0)
  will return a bright yellow color. More about how colors are stored can be found in
  the reference for the color datatype.
  
  @param {int|float} aValue1        red or hue or grey values relative to the current color range.
  Also can be color value in hexadecimal notation (i.e. #FFCC00 or 0xFFFFCC00)
  @param {int|float} aValue2        green or saturation values relative to the current color range
  @param {int|float} aValue3        blue or brightness values relative to the current color range
  @param {int|float} aValue4        relative to current color range. Represents alpha
  
  @returns {color} the color
  
  @see colorMode
  */


  ColourFunctions.prototype.color = function(aValue1, aValue2, aValue3, aValue4) {
    if (aValue1 !== undefined && aValue2 !== undefined && aValue3 !== undefined && aValue4 !== undefined) {
      return this.color$4(aValue1, aValue2, aValue3, aValue4);
    }
    if (aValue1 !== undefined && aValue2 !== undefined && aValue3 !== undefined) {
      return this.color$4(aValue1, aValue2, aValue3, this.colorModeA);
    }
    if (aValue1 !== undefined && aValue2 !== undefined) {
      return this.color$2(aValue1, aValue2);
    }
    if (typeof aValue1 === "number" || typeof aValue1 === "string") {
      return this.color$1(aValue1);
    }
    return this.color$4(this.colorModeX, this.colorModeY, this.colorModeZ, this.colorModeA);
  };

  ColourFunctions.prototype.colorToHSB = function(colorInt) {
    var blue, green, hue, maxBright, minBright, red, saturation;

    red = void 0;
    green = void 0;
    blue = void 0;
    minBright = void 0;
    maxBright = void 0;
    hue = void 0;
    saturation = void 0;
    red = ((colorInt & this.Constants.RED_MASK) >>> 16) / 255;
    green = ((colorInt & this.Constants.GREEN_MASK) >>> 8) / 255;
    blue = (colorInt & this.Constants.BLUE_MASK) / 255;
    maxBright = max(max(red, green), blue);
    minBright = min(min(red, green), blue);
    if (minBright === maxBright) {
      return [0, 0, maxBright * this.colorModeZ];
    }
    saturation = (maxBright - minBright) / maxBright;
    if (red === maxBright) {
      hue = (green - blue) / (maxBright - minBright);
    } else if (green === maxBright) {
      hue = 2 + ((blue - red) / (maxBright - minBright));
    } else {
      hue = 4 + ((red - green) / (maxBright - minBright));
    }
    hue /= 6;
    if (hue < 0) {
      hue += 1;
    } else {
      if (hue > 1) {
        hue -= 1;
      }
    }
    return [hue * this.colorModeX, saturation * this.colorModeY, maxBright * this.colorModeZ];
  };

  /*
  Extracts the brightness value from a color.
  
  @param {color} colInt any value of the color datatype
  
  @returns {float} The brightness color value.
  
  @see red
  @see green
  @see blue
  @see hue
  @see saturation
  */


  ColourFunctions.prototype.brightness = function(colInt) {
    return this.colorToHSB(colInt)[2];
  };

  /*
  Extracts the saturation value from a color.
  
  @param {color} colInt any value of the color datatype
  
  @returns {float} The saturation color value.
  
  @see red
  @see green
  @see blue
  @see hue
  @see brightness
  */


  ColourFunctions.prototype.saturation = function(colInt) {
    return this.colorToHSB(colInt)[1];
  };

  /*
  Extracts the hue value from a color.
  
  @param {color} colInt any value of the color datatype
  
  @returns {float} The hue color value.
  
  @see red
  @see green
  @see blue
  @see saturation
  @see brightness
  */


  ColourFunctions.prototype.hue = function(colInt) {
    return this.colorToHSB(colInt)[0];
  };

  /*
  Extracts the red value from a color, scaled to match current colorMode().
  This value is always returned as a float so be careful not to assign it to an int value.
  
  @param {color} aColor any value of the color datatype
  
  @returns {float} The red color value.
  
  @see green
  @see blue
  @see alpha
  @see >> right shift
  @see hue
  @see saturation
  @see brightness
  */


  ColourFunctions.prototype.redF = function(aColor) {
    return ((aColor & this.Constants.RED_MASK) >>> 16) / 255 * this.colorModeX;
  };

  /*
  Extracts the green value from a color, scaled to match current colorMode().
  This value is always returned as a float so be careful not to assign it to an int value.
  
  @param {color} aColor any value of the color datatype
  
  @returns {float} The green color value.
  
  @see red
  @see blue
  @see alpha
  @see >> right shift
  @see hue
  @see saturation
  @see brightness
  */


  ColourFunctions.prototype.greenF = function(aColor) {
    return ((aColor & this.Constants.GREEN_MASK) >>> 8) / 255 * this.colorModeY;
  };

  /*
  Extracts the blue value from a color, scaled to match current colorMode().
  This value is always returned as a float so be careful not to assign it to an int value.
  
  @param {color} aColor any value of the color datatype
  
  @returns {float} The blue color value.
  
  @see red
  @see green
  @see alpha
  @see >> right shift
  @see hue
  @see saturation
  @see brightness
  */


  ColourFunctions.prototype.blueF = function(aColor) {
    return (aColor & this.Constants.BLUE_MASK) / 255 * this.colorModeZ;
  };

  /*
  Extracts the alpha value from a color, scaled to match current colorMode().
  This value is always returned as a float so be careful not to assign it to an int value.
  
  @param {color} aColor any value of the color datatype
  
  @returns {float} The alpha color value.
  
  @see red
  @see green
  @see blue
  @see >> right shift
  @see hue
  @see saturation
  @see brightness
  */


  ColourFunctions.prototype.alpha = function(aColor) {
    return ((aColor & this.Constants.ALPHA_MASK) >>> 24) / 255 * this.colorModeA;
  };

  ColourFunctions.prototype.alphaZeroToOne = function(aColor) {
    return ((aColor & this.Constants.ALPHA_MASK) >>> 24) / 255;
  };

  /*
  Calculates a number between two numbers at a specific increment. The amt  parameter is the
  amount to interpolate between the two values where 0.0 equal to the first point, 0.1 is very
  near the first point, 0.5 is half-way in between, etc. The lerp function is convenient for
  creating motion along a straight path and for drawing dotted lines.
  
  @param {int|float} value1       float or int: first value
  @param {int|float} value2       float or int: second value
  @param {int|float} amt          float: between 0.0 and 1.0
  
  @returns {float}
  
  @see curvePoint
  @see bezierPoint
  */


  ColourFunctions.prototype.lerp = function(value1, value2, amt) {
    return ((value2 - value1) * amt) + value1;
  };

  /*
  Calculates a color or colors between two colors at a specific increment.
  The amt parameter is the amount to interpolate between the two values where 0.0
  equal to the first point, 0.1 is very near the first point, 0.5 is half-way in between, etc.
  
  @param {color} c1     interpolate from this color
  @param {color} c2     interpolate to this color
  @param {float} amt    between 0.0 and 1.0
  
  @returns {float} The blended color.
  
  @see blendColor
  @see color
  */


  ColourFunctions.prototype.lerpColor = function(c1, c2, amt) {
    var a, a1, a2, b, b1, b2, colorBits1, colorBits2, g, g1, g2, h, hsb1, hsb2, r, r1, r2, rgb, s;

    r = void 0;
    g = void 0;
    b = void 0;
    a = void 0;
    r1 = void 0;
    g1 = void 0;
    b1 = void 0;
    a1 = void 0;
    r2 = void 0;
    g2 = void 0;
    b2 = void 0;
    a2 = void 0;
    hsb1 = void 0;
    hsb2 = void 0;
    rgb = void 0;
    h = void 0;
    s = void 0;
    colorBits1 = this.color(c1);
    colorBits2 = this.color(c2);
    if (this.curColorMode === this.Constants.HSB) {
      hsb1 = this.colorToHSB(colorBits1);
      a1 = ((colorBits1 & this.Constants.ALPHA_MASK) >>> 24) / this.colorModeA;
      hsb2 = this.colorToHSB(colorBits2);
      a2 = ((colorBits2 & this.Constants.ALPHA_MASK) >>> 24) / this.colorModeA;
      h = this.lerp(hsb1[0], hsb2[0], amt);
      s = this.lerp(hsb1[1], hsb2[1], amt);
      b = this.lerp(hsb1[2], hsb2[2], amt);
      rgb = this.color.toRGB(h, s, b);
      a = this.lerp(a1, a2, amt) * this.colorModeA;
      return (a << 24) & this.Constants.ALPHA_MASK | (rgb[0] << 16) & this.Constants.RED_MASK | (rgb[1] << 8) & this.Constants.GREEN_MASK | rgb[2] & this.Constants.BLUE_MASK;
    }
    r1 = (colorBits1 & this.Constants.RED_MASK) >>> 16;
    g1 = (colorBits1 & this.Constants.GREEN_MASK) >>> 8;
    b1 = colorBits1 & this.Constants.BLUE_MASK;
    a1 = ((colorBits1 & this.Constants.ALPHA_MASK) >>> 24) / this.colorModeA;
    r2 = (colorBits2 & this.Constants.RED_MASK) >>> 16;
    g2 = (colorBits2 & this.Constants.GREEN_MASK) >>> 8;
    b2 = colorBits2 & this.Constants.BLUE_MASK;
    a2 = ((colorBits2 & this.Constants.ALPHA_MASK) >>> 24) / this.colorModeA;
    r = this.lerp(r1, r2, amt) | 0;
    g = this.lerp(g1, g2, amt) | 0;
    b = this.lerp(b1, b2, amt) | 0;
    a = this.lerp(a1, a2, amt) * this.colorModeA;
    return (a << 24) & this.Constants.ALPHA_MASK | (r << 16) & this.Constants.RED_MASK | (g << 8) & this.Constants.GREEN_MASK | b & this.Constants.BLUE_MASK;
  };

  /*
  Changes the way Processing interprets color data. By default, fill(), stroke(), and background()
  colors are set by values between 0 and 255 using the RGB color model. It is possible to change the
  numerical range used for specifying colors and to switch color systems. For example, calling colorMode(RGB, 1.0)
  will specify that values are specified between 0 and 1. The limits for defining colors are altered by setting the
  parameters range1, range2, range3, and range 4.
  
  @param {MODE} mode Either RGB or HSB, corresponding to Red/Green/Blue and Hue/Saturation/Brightness
  @param {int|float} range              range for all color elements
  @param {int|float} range1             range for the red or hue depending on the current color mode
  @param {int|float} range2             range for the green or saturation depending on the current color mode
  @param {int|float} range3             range for the blue or brightness depending on the current color mode
  @param {int|float} range4             range for the alpha
  
  @returns none
  
  @see background
  @see fill
  @see stroke
  */


  ColourFunctions.prototype.colorMode = function(mode, range1, range2, range3, range4) {
    this.curColorMode = mode;
    if (arguments.length > 1) {
      this.colorModeX = range1;
      this.colorModeY = range2 || range1;
      this.colorModeZ = range3 || range1;
      return this.colorModeA = range4 || range1;
    }
  };

  /*
  These are internal blending modes used for BlendColor()
  
  @param {Color} c1       First Color to blend
  @param {Color} c2       Second Color to blend
  
  @returns {Color}        The blended Color
  
  @see BlendColor
  @see Blend
  */


  ColourFunctions.prototype.modesFunction = function() {
    var ALPHA_MASK, BLUE_MASK, GREEN_MASK, RED_MASK, add, applyMode, blend, burn, darkest, difference, dodge, exclusion, hard_light, lightest, max, min, multiply, overlay, replace, screen, soft_light, subtract;

    ALPHA_MASK = this.Constants.ALPHA_MASK;
    RED_MASK = this.Constants.RED_MASK;
    GREEN_MASK = this.Constants.GREEN_MASK;
    BLUE_MASK = this.Constants.BLUE_MASK;
    min = Math.min;
    max = Math.max;
    applyMode = void 0;
    applyMode = function(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb) {
      var a, b, g, r;

      a = void 0;
      r = void 0;
      g = void 0;
      b = void 0;
      a = min(((c1 & 0xff000000) >>> 24) + f, 0xff) << 24;
      r = ar + (((cr - ar) * f) >> 8);
      r = (r < 0 ? 0 : (r > 255 ? 255 : r)) << 16;
      g = ag + (((cg - ag) * f) >> 8);
      g = (g < 0 ? 0 : (g > 255 ? 255 : g)) << 8;
      b = ab + (((cb - ab) * f) >> 8);
      b = (b < 0 ? 0 : (b > 255 ? 255 : b));
      return a | r | g | b;
    };
    replace = function(c1, c2) {
      return c2;
    };
    blend = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = c1 & RED_MASK;
      ag = c1 & GREEN_MASK;
      ab = c1 & BLUE_MASK;
      br = c2 & RED_MASK;
      bg = c2 & GREEN_MASK;
      bb = c2 & BLUE_MASK;
      return min(((c1 & ALPHA_MASK) >>> 24) + f, 0xff) << 24 | (ar + (((br - ar) * f) >> 8)) & RED_MASK | (ag + (((bg - ag) * f) >> 8)) & GREEN_MASK | (ab + (((bb - ab) * f) >> 8)) & BLUE_MASK;
    };
    add = function(c1, c2) {
      var f;

      f = (c2 & ALPHA_MASK) >>> 24;
      return min(((c1 & ALPHA_MASK) >>> 24) + f, 0xff) << 24 | min((c1 & RED_MASK) + ((c2 & RED_MASK) >> 8) * f, RED_MASK) & RED_MASK | min((c1 & GREEN_MASK) + ((c2 & GREEN_MASK) >> 8) * f, GREEN_MASK) & GREEN_MASK | min((c1 & BLUE_MASK) + (((c2 & BLUE_MASK) * f) >> 8), BLUE_MASK);
    };
    subtract = function(c1, c2) {
      var f;

      f = (c2 & ALPHA_MASK) >>> 24;
      return min(((c1 & ALPHA_MASK) >>> 24) + f, 0xff) << 24 | max((c1 & RED_MASK) - ((c2 & RED_MASK) >> 8) * f, GREEN_MASK) & RED_MASK | max((c1 & GREEN_MASK) - ((c2 & GREEN_MASK) >> 8) * f, BLUE_MASK) & GREEN_MASK | max((c1 & BLUE_MASK) - (((c2 & BLUE_MASK) * f) >> 8), 0);
    };
    lightest = function(c1, c2) {
      var f;

      f = (c2 & ALPHA_MASK) >>> 24;
      return min(((c1 & ALPHA_MASK) >>> 24) + f, 0xff) << 24 | max(c1 & RED_MASK, ((c2 & RED_MASK) >> 8) * f) & RED_MASK | max(c1 & GREEN_MASK, ((c2 & GREEN_MASK) >> 8) * f) & GREEN_MASK | max(c1 & BLUE_MASK, ((c2 & BLUE_MASK) * f) >> 8);
    };
    darkest = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = c1 & RED_MASK;
      ag = c1 & GREEN_MASK;
      ab = c1 & BLUE_MASK;
      br = min(c1 & RED_MASK, ((c2 & RED_MASK) >> 8) * f);
      bg = min(c1 & GREEN_MASK, ((c2 & GREEN_MASK) >> 8) * f);
      bb = min(c1 & BLUE_MASK, ((c2 & BLUE_MASK) * f) >> 8);
      return min(((c1 & ALPHA_MASK) >>> 24) + f, 0xff) << 24 | (ar + (((br - ar) * f) >> 8)) & RED_MASK | (ag + (((bg - ag) * f) >> 8)) & GREEN_MASK | (ab + (((bb - ab) * f) >> 8)) & BLUE_MASK;
    };
    difference = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = (ar > br ? ar - br : br - ar);
      cg = (ag > bg ? ag - bg : bg - ag);
      cb = (ab > bb ? ab - bb : bb - ab);
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    exclusion = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = ar + br - ((ar * br) >> 7);
      cg = ag + bg - ((ag * bg) >> 7);
      cb = ab + bb - ((ab * bb) >> 7);
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    multiply = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = (ar * br) >> 8;
      cg = (ag * bg) >> 8;
      cb = (ab * bb) >> 8;
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    screen = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = 255 - (((255 - ar) * (255 - br)) >> 8);
      cg = 255 - (((255 - ag) * (255 - bg)) >> 8);
      cb = 255 - (((255 - ab) * (255 - bb)) >> 8);
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    hard_light = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = (br < 128 ? (ar * br) >> 7 : 255 - (((255 - ar) * (255 - br)) >> 7));
      cg = (bg < 128 ? (ag * bg) >> 7 : 255 - (((255 - ag) * (255 - bg)) >> 7));
      cb = (bb < 128 ? (ab * bb) >> 7 : 255 - (((255 - ab) * (255 - bb)) >> 7));
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    soft_light = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = ((ar * br) >> 7) + ((ar * ar) >> 8) - ((ar * ar * br) >> 15);
      cg = ((ag * bg) >> 7) + ((ag * ag) >> 8) - ((ag * ag * bg) >> 15);
      cb = ((ab * bb) >> 7) + ((ab * ab) >> 8) - ((ab * ab * bb) >> 15);
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    overlay = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = (ar < 128 ? (ar * br) >> 7 : 255 - (((255 - ar) * (255 - br)) >> 7));
      cg = (ag < 128 ? (ag * bg) >> 7 : 255 - (((255 - ag) * (255 - bg)) >> 7));
      cb = (ab < 128 ? (ab * bb) >> 7 : 255 - (((255 - ab) * (255 - bb)) >> 7));
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    dodge = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = void 0;
      cg = void 0;
      cb = void 0;
      cr = 255;
      if (br !== 255) {
        cr = (ar << 8) / (255 - br);
        cr = (cr < 0 ? 0 : (cr > 255 ? 255 : cr));
      }
      cg = 255;
      if (bg !== 255) {
        cg = (ag << 8) / (255 - bg);
        cg = (cg < 0 ? 0 : (cg > 255 ? 255 : cg));
      }
      cb = 255;
      if (bb !== 255) {
        cb = (ab << 8) / (255 - bb);
        cb = (cb < 0 ? 0 : (cb > 255 ? 255 : cb));
      }
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
    return burn = function(c1, c2) {
      var ab, ag, ar, bb, bg, br, cb, cg, cr, f;

      f = (c2 & ALPHA_MASK) >>> 24;
      ar = (c1 & RED_MASK) >> 16;
      ag = (c1 & GREEN_MASK) >> 8;
      ab = c1 & BLUE_MASK;
      br = (c2 & RED_MASK) >> 16;
      bg = (c2 & GREEN_MASK) >> 8;
      bb = c2 & BLUE_MASK;
      cr = void 0;
      cg = void 0;
      cb = void 0;
      cr = 0;
      if (br !== 0) {
        cr = ((255 - ar) << 8) / br;
        cr = 255 - (cr < 0 ? 0 : (cr > 255 ? 255 : cr));
      }
      cg = 0;
      if (bg !== 0) {
        cg = ((255 - ag) << 8) / bg;
        cg = 255 - (cg < 0 ? 0 : (cg > 255 ? 255 : cg));
      }
      cb = 0;
      if (bb !== 0) {
        cb = ((255 - ab) << 8) / bb;
        cb = 255 - (cb < 0 ? 0 : (cb > 255 ? 255 : cb));
      }
      return applyMode(c1, f, ar, ag, ab, br, bg, bb, cr, cg, cb);
    };
  };

  /*
  Blends two color values together based on the blending mode given as the MODE parameter.
  The possible modes are described in the reference for the blend() function.
  
  @param {color} c1 color: the first color to blend
  @param {color} c2 color: the second color to blend
  @param {MODE} MODE Either BLEND, ADD, SUBTRACT, DARKEST, LIGHTEST, DIFFERENCE, EXCLUSION, MULTIPLY,
  SCREEN, OVERLAY, HARD_LIGHT, SOFT_LIGHT, DODGE, or BURN
  
  @returns {float} The blended color.
  
  @see blend
  @see color
  */


  ColourFunctions.prototype.blendColor = function(c1, c2, mode) {
    if (mode === this.Constants.REPLACE) {
      return this.modes.replace(c1, c2);
    } else if (mode === this.Constants.BLEND) {
      return this.modes.blend(c1, c2);
    } else if (mode === this.Constants.ADD) {
      return this.modes.add(c1, c2);
    } else if (mode === this.Constants.SUBTRACT) {
      return this.modes.subtract(c1, c2);
    } else if (mode === this.Constants.LIGHTEST) {
      return this.modes.lightest(c1, c2);
    } else if (mode === this.Constants.DARKEST) {
      return this.modes.darkest(c1, c2);
    } else if (mode === this.Constants.DIFFERENCE) {
      return this.modes.difference(c1, c2);
    } else if (mode === this.Constants.EXCLUSION) {
      return this.modes.exclusion(c1, c2);
    } else if (mode === this.Constants.MULTIPLY) {
      return this.modes.multiply(c1, c2);
    } else if (mode === this.Constants.SCREEN) {
      return this.modes.screen(c1, c2);
    } else if (mode === this.Constants.HARD_LIGHT) {
      return this.modes.hard_light(c1, c2);
    } else if (mode === this.Constants.SOFT_LIGHT) {
      return this.modes.soft_light(c1, c2);
    } else if (mode === this.Constants.OVERLAY) {
      return this.modes.overlay(c1, c2);
    } else if (mode === this.Constants.DODGE) {
      return this.modes.dodge(c1, c2);
    } else {
      if (mode === this.Constants.BURN) {
        return this.modes.burn(c1, c2);
      }
    }
  };

  return ColourFunctions;

})();

/*
## Takes care of all matrix-related commands.
*/

var MatrixCommands;

MatrixCommands = (function() {
  "use strict";  MatrixCommands.prototype.matrixStack = [];

  function MatrixCommands(liveCodeLabCore_three, liveCodeLabCoreInstance) {
    var _this = this;

    this.liveCodeLabCore_three = liveCodeLabCore_three;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    this.worldMatrix = new this.liveCodeLabCore_three.Matrix4();
    window.pushMatrix = function() {
      return _this.pushMatrix();
    };
    window.popMatrix = function() {
      return _this.popMatrix();
    };
    window.resetMatrix = function() {
      return _this.resetMatrix();
    };
    window.move = function(a, b, c) {
      return _this.move(a, b, c);
    };
    window.rotate = function(a, b, c) {
      return _this.rotate(a, b, c);
    };
    window.scale = function(a, b, c) {
      return _this.scale(a, b, c);
    };
  }

  MatrixCommands.prototype.getWorldMatrix = function() {
    return this.worldMatrix;
  };

  MatrixCommands.prototype.resetMatrixStack = function() {
    this.matrixStack = [];
    return this.worldMatrix.identity();
  };

  MatrixCommands.prototype.pushMatrix = function() {
    this.matrixStack.push(this.worldMatrix);
    return this.worldMatrix = (new this.liveCodeLabCore_three.Matrix4()).copy(this.worldMatrix);
  };

  MatrixCommands.prototype.popMatrix = function() {
    if (this.matrixStack.length) {
      return this.worldMatrix = this.matrixStack.pop();
    } else {
      return this.worldMatrix.identity();
    }
  };

  MatrixCommands.prototype.resetMatrix = function() {
    return this.worldMatrix.identity();
  };

  MatrixCommands.prototype.move = function(a, b, c) {
    if (c == null) {
      c = 0;
    }
    if (typeof a !== "number") {
      a = Math.sin(this.liveCodeLabCoreInstance.timeKeeper.getTime() / 500);
      b = Math.cos(this.liveCodeLabCoreInstance.timeKeeper.getTime() / 500);
      c = a;
    } else if (typeof b !== "number") {
      b = a;
      c = a;
    }
    return this.worldMatrix.translate(new this.liveCodeLabCore_three.Vector3(a, b, c));
  };

  MatrixCommands.prototype.rotate = function(a, b, c) {
    if (c == null) {
      c = 0;
    }
    if (typeof a !== "number") {
      a = this.liveCodeLabCoreInstance.timeKeeper.getTime() / 1000;
      b = a;
      c = a;
    } else if (typeof b !== "number") {
      b = a;
      c = a;
    }
    return this.worldMatrix.rotateX(a).rotateY(b).rotateZ(c);
  };

  MatrixCommands.prototype.scale = function(a, b, c) {
    if (c == null) {
      c = 1;
    }
    if (typeof a !== "number") {
      a = 1 + Math.sin(this.liveCodeLabCoreInstance.timeKeeper.getTime() / 500) / 4;
      b = a;
      c = a;
    } else if (typeof b !== "number") {
      b = a;
      c = a;
    }
    if (a > -0.000000001 && a < 0.000000001) {
      a = 0.000000001;
    }
    if (b > -0.000000001 && b < 0.000000001) {
      b = 0.000000001;
    }
    if (c > -0.000000001 && c < 0.000000001) {
      c = 0.000000001;
    }
    return this.worldMatrix.scale(new this.liveCodeLabCore_three.Vector3(a, b, c));
  };

  return MatrixCommands;

})();

/*
## Please reference the colour-functions.js file for all colour-related
## functions and lights-functions.js for lights, which use a similar
## structure for caching and counting of light instances.
## 
## Fundamentals
## ============
## There are a couple of fundamentals of LiveCodeLab and a couple of
## complications of Three.js that shape the way
## graphic primitives work in this file.
## 
## LiveCodeLab uses immediate mode graphics
## ----------------------
## First off, like Processing, LiveCodeLab shies away from "retained" graphics
## and instead uses "immediate mode" graphics.
## For context, "immediate mode" graphics means that when the user uses a graphic
## primitive, he is
## NOT given a handle that he can use to modify properties of that element at a
## later stage, contrarily to flash, DOM, CSS, openGL and Three.JS
## (to different degrees).
## Retained graphic modes keep structures in memory that make easy for example
## to do event handling (which object did I click?), hierarchy management
## (parent/child relationships, container/content, etc), property tweaking
## (change property X of object Y), and sometimes animation ( CoreAnimation from
## Apple for example), collision/overlap detection. Note that openGL is retained
## in that there are handles to geometry and textures, but little else is given
## (no events, no input, no physics/overlap/collision/animation).
## Also, retained graphics mode usually is smart about updating
## only minimal parts of the screen that need updating rather than redrawing the
## whole screen (again, openGL doesn't do that apart from basic frustum culling, but
## for example there is nothing to detect occlusions and avoid painting occluded
## objects).
## There are a few drawbacks in retained modes: a) programs that manage
## handles are more lengthy than programs that don't
## b) they are often not needed for example in
## 2d sprites-based videogames c) most importantly,
## they require deeper understanding of the underlying
## model (e.g. which property can I change? What are those called? How do I change
## parent/child relationship? How do events bubble up and where should I catch them?).
## Processing and LiveCodeLab go for immediate mode. Once the primitive is invoked, it
## becomes pixels and there is no built-in way to do input/event/hierarchies...
## Rather, there are a few properties that are set as a global state and apply to all
## objects. Examples are "fill" and "stroke".
## 
## Relationship between objects, meshes, geometry, materials...
## ----------------------
## A Three.js object (or to be more precise, Object3D) can be a line or a mesh. A line
## is a line, a mesh can be anything else depending on what the geometry of the mesh
## is. There are more possible types such as particles, etc. but they are not currently
## used in LiveCodeLab. An object needs one more thing: a material.
## 
## Caching of objects
## ----------------------
## Once created, objects are kept cached together with all possible materials that can be
## associated with it. Each object has to have its own set of materials because
## one can decide to draw one object in solid fill, one in normal color, one with
## an ambient light (i.e. lambert material), etc.
## 
## Objects are kept in the scene
## ----------------------
## Once an object is added to the scene, it's never removed. Rather, it's hidden if it's
## not used, but it's never removed. This is because adding/removing objects from the
## scene is rather expensive. Note that Mr Doob mentioned via email that subsequent
## versions of three.js have improved performance a lot, so it's worth trying another
## approach.
## 
## Strokes are managed via separate objects for stroke and fill
## ----------------------
## There is a particular flag in Three.js materials for drawing wireframes. But materials
## cannot be combined, i.e. only one is associated at any time with a geometry. So one
## can either draw a wireframe or a fill. In previous versions of Three.js more than
## one material could be associated, but that has been deprecated, see
## https://github.com/mrdoob/three.js/issues/751 and instead a
## createMultiMaterialObject utility was put in place, which basically creates multiple
## objects one for each material, see
## https://github.com/mrdoob/three.js/blob/dev/src/extras/SceneUtils.js#L29
## So the solution here is to create two disting objects.
## One for the fills and one, slightly "larger", for the strokes. In that way, the
## strokes are visible "in front" of the fills, and the fills cover the strokes "at
## the back"
## 
## The order of materials matters
## ----------------------
## When an object is created, it must be first rendered with the most complex material,
## because internally in Three.js/WebGL memory is allocated only once. So a special
## mechanism is put in place by which new objects are drawn with the normalMaterial
## with scale 0, so they are rendered but they are invisible. In the next frame (i.e.
## after the first render) the correct material is used.
## 
## "Spinning"
## ----------------------
## "Spinning" applies to all objects added to an empty frame: it makes all objects spin
## for a few frames. This has been implemented for two reasons a) cosmetic b) the user
## is likely to first use "box", and without spinning that would look like a boring
## square that appears without animation. Spinning gives many more cues: the environment
## is 3d, the lighting is special by default and all faces have primary colors, things
## animate. Without spinning, all those cues need to be further explained and demonstra
## ted.
*/

var GraphicsCommands;

GraphicsCommands = (function() {
  "use strict";  GraphicsCommands.prototype.primitiveTypes = {};

  GraphicsCommands.prototype.minimumBallDetail = 2;

  GraphicsCommands.prototype.maximumBallDetail = 30;

  GraphicsCommands.prototype.doFill = true;

  GraphicsCommands.prototype.doStroke = true;

  GraphicsCommands.prototype.reflectValue = 1;

  GraphicsCommands.prototype.refractValue = 0.98;

  GraphicsCommands.prototype.currentStrokeAlpha = void 0;

  GraphicsCommands.prototype.currentStrokeColor = void 0;

  GraphicsCommands.prototype.geometriesBank = [];

  GraphicsCommands.prototype.SPIN_DURATION_IN_FRAMES = 30;

  GraphicsCommands.prototype.currentFillAlpha = void 0;

  GraphicsCommands.prototype.currentFillColor = void 0;

  GraphicsCommands.prototype.objectPools = [];

  GraphicsCommands.prototype.ballDetLevel = 8;

  GraphicsCommands.prototype.currentStrokeSize = 1;

  GraphicsCommands.prototype.objectsUsedInFrameCounts = [];

  GraphicsCommands.prototype.doTheSpinThingy = true;

  GraphicsCommands.prototype.resetTheSpinThingy = false;

  GraphicsCommands.prototype.defaultNormalFill = true;

  GraphicsCommands.prototype.defaultNormalStroke = true;

  function GraphicsCommands(liveCodeLabCore_three, liveCodeLabCoreInstance) {
    var i, _i, _j, _ref, _ref1,
      _this = this;

    this.liveCodeLabCore_three = liveCodeLabCore_three;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    window.line = function(a, b, c) {
      return _this.line(a, b, c);
    };
    window.rect = function(a, b, c) {
      return _this.rect(a, b, c);
    };
    window.box = function(a, b, c) {
      return _this.box(a, b, c);
    };
    window.peg = function(a, b, c) {
      return _this.peg(a, b, c);
    };
    window.ball = function(a, b, c) {
      return _this.ball(a, b, c);
    };
    window.ballDetail = function(a) {
      return _this.ballDetail(a);
    };
    window.fill = function(a, b, c, d) {
      return _this.fill(a, b, c, d);
    };
    window.noFill = function() {
      return _this.noFill();
    };
    window.stroke = function(a, b, c, d) {
      return _this.stroke(a, b, c, d);
    };
    window.noStroke = function() {
      return _this.noStroke();
    };
    window.strokeSize = function(a) {
      return _this.strokeSize(a);
    };
    this.primitiveTypes.ambientLight = 0;
    this.primitiveTypes.line = 1;
    this.primitiveTypes.rect = 2;
    this.primitiveTypes.box = 3;
    this.primitiveTypes.peg = 4;
    this.primitiveTypes.ball = 5;
    this.objectPools[this.primitiveTypes.line] = [];
    this.objectPools[this.primitiveTypes.rect] = [];
    this.objectPools[this.primitiveTypes.box] = [];
    this.objectPools[this.primitiveTypes.peg] = [];
    for (i = _i = 0, _ref = this.maximumBallDetail - this.minimumBallDetail + 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      this.objectPools[this.primitiveTypes.ball + i] = [];
    }
    this.geometriesBank[this.primitiveTypes.line] = new this.liveCodeLabCore_three.Geometry();
    this.geometriesBank[this.primitiveTypes.line].vertices.push(new this.liveCodeLabCore_three.Vector3(0, -0.5, 0));
    this.geometriesBank[this.primitiveTypes.line].vertices.push(new this.liveCodeLabCore_three.Vector3(0, 0.5, 0));
    this.geometriesBank[this.primitiveTypes.rect] = new this.liveCodeLabCore_three.PlaneGeometry(1, 1);
    this.geometriesBank[this.primitiveTypes.box] = new this.liveCodeLabCore_three.CubeGeometry(1, 1, 1);
    this.geometriesBank[this.primitiveTypes.peg] = new this.liveCodeLabCore_three.CylinderGeometry(0.5, 0.5, 1, 32);
    for (i = _j = 0, _ref1 = this.maximumBallDetail - this.minimumBallDetail + 1; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      this.geometriesBank[this.primitiveTypes.ball + i] = new this.liveCodeLabCore_three.SphereGeometry(1, this.minimumBallDetail + i, this.minimumBallDetail + i);
    }
  }

  GraphicsCommands.prototype.createObjectIfNeededAndDressWithCorrectMaterial = function(a, b, c, primitiveProperties, strokeTime, colorToBeUsed, alphaToBeUsed, applyDefaultNormalColor) {
    var objectIsNew, objectPool, pooledObjectWithMaterials, primitiveID, theAngle;

    objectIsNew = false;
    pooledObjectWithMaterials = void 0;
    theAngle = void 0;
    primitiveID = primitiveProperties.primitiveType + primitiveProperties.detailLevel;
    objectPool = this.objectPools[primitiveID];
    pooledObjectWithMaterials = objectPool[this.objectsUsedInFrameCounts[primitiveID]];
    if (pooledObjectWithMaterials === undefined) {
      pooledObjectWithMaterials = {
        lineMaterial: undefined,
        basicMaterial: undefined,
        lambertMaterial: undefined,
        normalMaterial: undefined,
        threejsObject3D: new primitiveProperties.threeObjectConstructor(this.geometriesBank[primitiveID]),
        initialSpinCountdown: this.SPIN_DURATION_IN_FRAMES
      };
      objectIsNew = true;
      objectPool.push(pooledObjectWithMaterials);
    }
    if (primitiveProperties.primitiveType === this.primitiveTypes.line) {
      if (pooledObjectWithMaterials.lineMaterial === undefined) {
        pooledObjectWithMaterials.lineMaterial = new this.liveCodeLabCore_three.LineBasicMaterial();
      }
      if (this.currentStrokeColor === angleColor || this.defaultNormalStroke) {
        theAngle = pooledObjectWithMaterials.threejsObject3D.matrix.multiplyVector3(new this.liveCodeLabCore_three.Vector3(0, 1, 0)).normalize();
        pooledObjectWithMaterials.lineMaterial.color.setHex(color(((theAngle.x + 1) / 2) * 255, ((theAngle.y + 1) / 2) * 255, ((theAngle.z + 1) / 2) * 255));
      } else {
        pooledObjectWithMaterials.lineMaterial.color.setHex(this.currentStrokeColor);
      }
      pooledObjectWithMaterials.lineMaterial.linewidth = this.currentStrokeSize;
      pooledObjectWithMaterials.threejsObject3D.material = pooledObjectWithMaterials.lineMaterial;
    } else if (objectIsNew || (colorToBeUsed === angleColor || applyDefaultNormalColor)) {
      if (pooledObjectWithMaterials.normalMaterial === undefined) {
        pooledObjectWithMaterials.normalMaterial = new this.liveCodeLabCore_three.MeshNormalMaterial();
      }
      pooledObjectWithMaterials.threejsObject3D.material = pooledObjectWithMaterials.normalMaterial;
    } else if (!this.liveCodeLabCoreInstance.lightSystem.lightsAreOn) {
      if (pooledObjectWithMaterials.basicMaterial === undefined) {
        pooledObjectWithMaterials.basicMaterial = new this.liveCodeLabCore_three.MeshBasicMaterial();
      }
      pooledObjectWithMaterials.basicMaterial.color.setHex(colorToBeUsed);
      pooledObjectWithMaterials.threejsObject3D.material = pooledObjectWithMaterials.basicMaterial;
    } else {
      if (pooledObjectWithMaterials.lambertMaterial === undefined) {
        pooledObjectWithMaterials.lambertMaterial = new this.liveCodeLabCore_three.MeshLambertMaterial();
      }
      pooledObjectWithMaterials.lambertMaterial.color.setHex(colorToBeUsed);
      pooledObjectWithMaterials.threejsObject3D.material = pooledObjectWithMaterials.lambertMaterial;
    }
    pooledObjectWithMaterials.threejsObject3D.material.side = primitiveProperties.sidedness;
    pooledObjectWithMaterials.threejsObject3D.material.opacity = alphaToBeUsed;
    if (alphaToBeUsed < 1) {
      pooledObjectWithMaterials.threejsObject3D.material.transparent = true;
    }
    pooledObjectWithMaterials.threejsObject3D.material.wireframe = strokeTime;
    pooledObjectWithMaterials.threejsObject3D.material.wireframeLinewidth = this.currentStrokeSize;
    pooledObjectWithMaterials.threejsObject3D.material.reflectivity = this.reflectValue;
    pooledObjectWithMaterials.threejsObject3D.material.refractionRatio = this.refractValue;
    if (this.resetTheSpinThingy) {
      pooledObjectWithMaterials.initialSpinCountdown = this.SPIN_DURATION_IN_FRAMES;
      this.resetTheSpinThingy = false;
      this.doTheSpinThingy = true;
    }
    if (this.doTheSpinThingy) {
      pooledObjectWithMaterials.initialSpinCountdown -= 1;
    }
    if (pooledObjectWithMaterials.initialSpinCountdown === -1) {
      this.doTheSpinThingy = false;
    }
    pooledObjectWithMaterials.threejsObject3D.primitiveType = primitiveProperties.primitiveType;
    pooledObjectWithMaterials.threejsObject3D.detailLevel = primitiveProperties.detailLevel;
    this.objectsUsedInFrameCounts[primitiveID] += 1;
    if (this.doTheSpinThingy && pooledObjectWithMaterials.initialSpinCountdown > 0) {
      this.liveCodeLabCoreInstance.matrixCommands.pushMatrix();
      this.liveCodeLabCoreInstance.matrixCommands.rotate(pooledObjectWithMaterials.initialSpinCountdown / 50);
    }
    pooledObjectWithMaterials.threejsObject3D.matrixAutoUpdate = false;
    pooledObjectWithMaterials.threejsObject3D.matrix.copy(this.liveCodeLabCoreInstance.matrixCommands.getWorldMatrix());
    pooledObjectWithMaterials.threejsObject3D.matrixWorldNeedsUpdate = true;
    if (this.doTheSpinThingy && pooledObjectWithMaterials.initialSpinCountdown > 0) {
      this.liveCodeLabCoreInstance.matrixCommands.popMatrix();
    }
    if (objectIsNew) {
      pooledObjectWithMaterials.threejsObject3D.matrix.scale(new this.liveCodeLabCore_three.Vector3(0.0001, 0.0001, 0.0001));
    } else if (a !== 1 || b !== 1 || c !== 1) {
      if (strokeTime) {
        pooledObjectWithMaterials.threejsObject3D.matrix.scale(new this.liveCodeLabCore_three.Vector3(a + 0.001, b + 0.001, c + 0.001));
      } else {
        pooledObjectWithMaterials.threejsObject3D.matrix.scale(new this.liveCodeLabCore_three.Vector3(a, b, c));
      }
    }
    if (objectIsNew) {
      return this.liveCodeLabCoreInstance.threeJsSystem.scene.add(pooledObjectWithMaterials.threejsObject3D);
    }
  };

  GraphicsCommands.prototype.commonPrimitiveDrawingLogic = function(a, b, c, primitiveProperties) {
    if (a === undefined) {
      a = 1;
      b = 1;
      c = 1;
    } else if (b === undefined) {
      b = a;
      c = a;
    } else {
      if (c === undefined) {
        c = 1;
      }
    }
    if (!this.doStroke && (!this.doFill || !primitiveProperties.canFill)) {
      return;
    }
    if ((primitiveProperties.canFill && this.doFill && (this.currentStrokeSize === 0 || !this.doStroke || (this.currentStrokeSize <= 1 && !this.defaultNormalFill && !this.defaultNormalStroke && this.currentStrokeColor === this.currentFillColor && this.currentFillAlpha === 1 && this.currentStrokeAlpha === 1))) || (this.currentStrokeSize <= 1 && this.defaultNormalFill && this.defaultNormalStroke)) {
      return this.createObjectIfNeededAndDressWithCorrectMaterial(a, b, c, primitiveProperties, false, this.currentFillColor, this.currentFillAlpha, this.defaultNormalFill);
    } else if ((!this.doFill || !primitiveProperties.canFill) && this.doStroke) {
      return this.createObjectIfNeededAndDressWithCorrectMaterial(a, b, c, primitiveProperties, true, this.currentStrokeColor, this.currentStrokeAlpha, this.defaultNormalStroke);
    } else {
      this.createObjectIfNeededAndDressWithCorrectMaterial(a, b, c, primitiveProperties, true, this.currentStrokeColor, this.currentStrokeAlpha, this.defaultNormalStroke);
      return this.createObjectIfNeededAndDressWithCorrectMaterial(a, b, c, primitiveProperties, false, this.currentFillColor, this.currentFillAlpha, this.defaultNormalFill);
    }
  };

  GraphicsCommands.prototype.reset = function() {
    var i, _i, _ref, _results;

    this.fill(0xFFFFFFFF);
    this.stroke(0xFFFFFFFF);
    this.currentStrokeSize = 1;
    this.defaultNormalFill = true;
    this.defaultNormalStroke = true;
    this.ballDetLevel = this.liveCodeLabCoreInstance.threeJsSystem.ballDefaultDetLevel;
    this.objectsUsedInFrameCounts[this.primitiveTypes.ambientLight] = 0;
    this.objectsUsedInFrameCounts[this.primitiveTypes.line] = 0;
    this.objectsUsedInFrameCounts[this.primitiveTypes.rect] = 0;
    this.objectsUsedInFrameCounts[this.primitiveTypes.box] = 0;
    this.objectsUsedInFrameCounts[this.primitiveTypes.peg] = 0;
    _results = [];
    for (i = _i = 0, _ref = this.maximumBallDetail - this.minimumBallDetail + 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      _results.push(this.objectsUsedInFrameCounts[this.primitiveTypes.ball + i] = 0);
    }
    return _results;
  };

  GraphicsCommands.prototype.line = function(a, b, c) {
    var primitiveProperties, rememberIfThereWasAFill, rememberPreviousStrokeSize;

    if (this.liveCodeLabCoreInstance.lightSystem.lightsAreOn) {
      rememberIfThereWasAFill = this.doFill;
      rememberPreviousStrokeSize = this.currentStrokeSize;
      if (this.currentStrokeSize < 2) {
        this.currentStrokeSize = 2;
      }
      if (a === undefined) {
        a = 1;
      }
      this.rect(0, a, 0);
      this.doFill = rememberIfThereWasAFill;
      this.currentStrokeSize = rememberPreviousStrokeSize;
      return;
    }
    primitiveProperties = {
      canFill: false,
      primitiveType: this.primitiveTypes.line,
      sidedness: this.liveCodeLabCore_three.FrontSide,
      threeObjectConstructor: this.liveCodeLabCore_three.Line,
      detailLevel: 0
    };
    return this.commonPrimitiveDrawingLogic(a, b, c, primitiveProperties);
  };

  GraphicsCommands.prototype.rect = function(a, b, c) {
    var primitiveProperties;

    primitiveProperties = {
      canFill: true,
      primitiveType: this.primitiveTypes.rect,
      sidedness: this.liveCodeLabCore_three.DoubleSide,
      threeObjectConstructor: this.liveCodeLabCore_three.Mesh,
      detailLevel: 0
    };
    return this.commonPrimitiveDrawingLogic(a, b, c, primitiveProperties);
  };

  GraphicsCommands.prototype.box = function(a, b, c) {
    var primitiveProperties;

    primitiveProperties = {
      canFill: true,
      primitiveType: this.primitiveTypes.box,
      sidedness: this.liveCodeLabCore_three.FrontSide,
      threeObjectConstructor: this.liveCodeLabCore_three.Mesh,
      detailLevel: 0
    };
    return this.commonPrimitiveDrawingLogic(a, b, c, primitiveProperties);
  };

  GraphicsCommands.prototype.peg = function(a, b, c) {
    var primitiveProperties;

    primitiveProperties = {
      canFill: true,
      primitiveType: this.primitiveTypes.peg,
      sidedness: this.liveCodeLabCore_three.FrontSide,
      threeObjectConstructor: this.liveCodeLabCore_three.Mesh,
      detailLevel: 0
    };
    return this.commonPrimitiveDrawingLogic(a, b, c, primitiveProperties);
  };

  GraphicsCommands.prototype.ballDetail = function(a) {
    if (a === undefined) {
      return;
    }
    if (a < 2) {
      a = 2;
    }
    if (a > 30) {
      a = 30;
    }
    return this.ballDetLevel = Math.round(a);
  };

  GraphicsCommands.prototype.ball = function(a, b, c) {
    var primitiveProperties;

    primitiveProperties = {
      canFill: true,
      primitiveType: this.primitiveTypes.ball,
      sidedness: this.liveCodeLabCore_three.FrontSide,
      threeObjectConstructor: this.liveCodeLabCore_three.Mesh,
      detailLevel: this.ballDetLevel - this.minimumBallDetail
    };
    return this.commonPrimitiveDrawingLogic(a, b, c, primitiveProperties);
  };

  GraphicsCommands.prototype.fill = function(r, g, b, a) {
    this.doFill = true;
    if (r !== angleColor) {
      this.defaultNormalFill = false;
      this.currentFillColor = color(r, g, b);
      return this.currentFillAlpha = alphaZeroToOne(color(r, g, b, a));
    } else {
      this.defaultNormalFill = true;
      this.currentFillColor = angleColor;
      if (b === undefined && g !== undefined) {
        return this.currentFillAlpha = g / this.liveCodeLabCoreInstance.colourFunctions.colorModeA;
      } else {
        return this.currentFillAlpha = 1;
      }
    }
  };

  /*
  The noFill() function disables filling geometry.
  If both <b>noStroke()</b> and <b>noFill()</b>
  are called, no shapes will be drawn to the screen.
  
  @see #fill()
  */


  GraphicsCommands.prototype.noFill = function() {
    this.doFill = false;
    return this.defaultNormalFill = false;
  };

  /*
  The stroke() function sets the color used to draw lines and borders around shapes.
  This color is either specified in terms of the RGB or HSB color depending on the
  current <b>colorMode()</b> (the default color space is RGB, with each
  value in the range from 0 to 255).
  <br><br>When using hexadecimal notation to specify a color, use "#" or
  "0x" before the values (e.g. #CCFFAA, 0xFFCCFFAA). The # syntax uses six
  digits to specify a color (the way colors are specified in HTML and CSS).
  When using the hexadecimal notation starting with "0x", the hexadecimal
  value must be specified with eight characters; the first two characters
  define the alpha component and the remainder the red, green, and blue
  components.
  <br><br>The value for the parameter "gray" must be less than or equal
  to the current maximum value as specified by <b>colorMode()</b>.
  The default maximum value is 255.
  
  @param {int|float} gray    number specifying value between white and black
  @param {int|float} value1  red or hue value
  @param {int|float} value2  green or saturation value
  @param {int|float} value3  blue or brightness value
  @param {int|float} alpha   opacity of the stroke
  @param {Color} color       any value of the color datatype
  @param {int} hex           color value in hex notation (i.e. #FFCC00 or 0xFFFFCC00)
  
  @see #fill()
  @see #noStroke()
  @see #tint()
  @see #background()
  @see #colorMode()
  */


  GraphicsCommands.prototype.stroke = function(r, g, b, a) {
    this.doStroke = true;
    if (r !== angleColor) {
      this.defaultNormalStroke = false;
      this.currentStrokeColor = color(r, g, b);
      return this.currentStrokeAlpha = alphaZeroToOne(color(r, g, b, a));
    } else {
      this.defaultNormalStroke = true;
      this.currentStrokeColor = angleColor;
      if (b === undefined && g !== undefined) {
        return this.currentStrokeAlpha = g / this.liveCodeLabCoreInstance.colourFunctions.colorModeA;
      } else {
        return this.currentStrokeAlpha = 1;
      }
    }
  };

  /*
  The noStroke() function disables drawing the stroke (outline).
  If both <b>noStroke()</b> and <b>noFill()</b> are called, no shapes
  will be drawn to the screen.
  
  @see #stroke()
  */


  GraphicsCommands.prototype.noStroke = function() {
    return this.doStroke = false;
  };

  GraphicsCommands.prototype.strokeSize = function(a) {
    if (a === undefined) {
      a = 1;
    } else {
      if (a < 0) {
        a = 0;
      }
    }
    return this.currentStrokeSize = a;
  };

  return GraphicsCommands;

})();

/*
Calculates the absolute value (magnitude) of a number. The absolute value of a number is always positive.

@param {int|float} value   int or float

@returns {int|float}
*/

var Marsaglia, PerlinNoise, Random, abs, acos, asin, atan, atan2, ceil, constrain, cos, currentRandom, degrees, dist, exp, floor, lerp, log, mag, map, max, min, noise, noiseDetail, noiseProfile, noiseSeed, norm, pow, radians, random, randomSeed, round, sin, sq, sqrt, tan;

abs = Math.abs;

/*
Calculates the closest int value that is greater than or equal to the value of the parameter.
For example, ceil(9.03) returns the value 10.

@param {float} value   float

@returns {int}

@see floor
@see round
*/


ceil = Math.ceil;

/*
Constrains a value to not exceed a maximum and minimum value.

@param {int|float} value   the value to constrain
@param {int|float} value   minimum limit
@param {int|float} value   maximum limit

@returns {int|float}

@see max
@see min
*/


constrain = function(aNumber, aMin, aMax) {
  if (aNumber > aMax) {
    return aMax;
  } else {
    if (aNumber < aMin) {
      return aMin;
    } else {
      return aNumber;
    }
  }
};

/*
Calculates the distance between two points.

@param {int|float} x1     int or float: x-coordinate of the first point
@param {int|float} y1     int or float: y-coordinate of the first point
@param {int|float} z1     int or float: z-coordinate of the first point
@param {int|float} x2     int or float: x-coordinate of the second point
@param {int|float} y2     int or float: y-coordinate of the second point
@param {int|float} z2     int or float: z-coordinate of the second point

@returns {float}
*/


dist = function() {
  var dx, dy, dz;

  dx = void 0;
  dy = void 0;
  dz = void 0;
  if (arguments.length === 4) {
    dx = arguments[0] - arguments[2];
    dy = arguments[1] - arguments[3];
    return Math.sqrt(dx * dx + dy * dy);
  }
  if (arguments.length === 6) {
    dx = arguments[0] - arguments[3];
    dy = arguments[1] - arguments[4];
    dz = arguments[2] - arguments[5];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
};

/*
Returns Euler's number e (2.71828...) raised to the power of the value parameter.

@param {int|float} value   int or float: the exponent to raise e to

@returns {float}
*/


exp = Math.exp;

/*
Calculates the closest int value that is less than or equal to the value of the parameter.

@param {int|float} value        the value to floor

@returns {int|float}

@see ceil
@see round
*/


floor = Math.floor;

/*
Calculates a number between two numbers at a specific increment. The amt  parameter is the
amount to interpolate between the two values where 0.0 equal to the first point, 0.1 is very
near the first point, 0.5 is half-way in between, etc. The lerp function is convenient for
creating motion along a straight path and for drawing dotted lines.

@param {int|float} value1       float or int: first value
@param {int|float} value2       float or int: second value
@param {int|float} amt          float: between 0.0 and 1.0

@returns {float}

@see curvePoint
@see bezierPoint
*/


lerp = function(value1, value2, amt) {
  return ((value2 - value1) * amt) + value1;
};

/*
Calculates the natural logarithm (the base-e logarithm) of a number. This function
expects the values greater than 0.0.

@param {int|float} value        int or float: number must be greater then 0.0

@returns {float}
*/


log = Math.log;

/*
Calculates the magnitude (or length) of a vector. A vector is a direction in space commonly
used in computer graphics and linear algebra. Because it has no "start" position, the magnitude
of a vector can be thought of as the distance from coordinate (0,0) to its (x,y) value.
Therefore, mag() is a shortcut for writing "dist(0, 0, x, y)".

@param {int|float} a       float or int: first value
@param {int|float} b       float or int: second value
@param {int|float} c       float or int: third value

@returns {float}

@see dist
*/


mag = function(a, b, c) {
  if (c) {
    return Math.sqrt(a * a + b * b + c * c);
  }
  return Math.sqrt(a * a + b * b);
};

/*
Re-maps a number from one range to another. In the example above, the number '25' is converted from
a value in the range 0..100 into a value that ranges from the left edge (0) to the right edge (width) of the screen.
Numbers outside the range are not clamped to 0 and 1, because out-of-range values are often intentional and useful.

@param {float} value        The incoming value to be converted
@param {float} istart       Lower bound of the value's current range
@param {float} istop        Upper bound of the value's current range
@param {float} ostart       Lower bound of the value's target range
@param {float} ostop        Upper bound of the value's target range

@returns {float}

@see norm
@see lerp
*/


map = function(value, istart, istop, ostart, ostop) {
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
};

/*
Determines the largest value in a sequence of numbers.

@param {int|float} value1         int or float
@param {int|float} value2         int or float
@param {int|float} value3         int or float
@param {int|float} array          int or float array

@returns {int|float}

@see min
*/


max = function() {
  var count, i, numbers;

  if (arguments.length === 2) {
    return (arguments[0] < arguments[1] ? arguments[1] : arguments[0]);
  }
  numbers = (arguments.length === 1 ? arguments[0] : arguments);
  if (!("length" in numbers && numbers.length)) {
    throw "Non-empty array is expected";
  }
  max = numbers[0];
  count = numbers.length;
  i = 1;
  while (i < count) {
    if (max < numbers[i]) {
      max = numbers[i];
    }
    ++i;
  }
  return max;
};

/*
Determines the smallest value in a sequence of numbers.

@param {int|float} value1         int or float
@param {int|float} value2         int or float
@param {int|float} value3         int or float
@param {int|float} array          int or float array

@returns {int|float}

@see max
*/


min = function() {
  var count, i, numbers;

  if (arguments.length === 2) {
    return (arguments[0] < arguments[1] ? arguments[0] : arguments[1]);
  }
  numbers = (arguments.length === 1 ? arguments[0] : arguments);
  if (!("length" in numbers && numbers.length)) {
    throw "Non-empty array is expected";
  }
  min = numbers[0];
  count = numbers.length;
  i = 1;
  while (i < count) {
    if (min > numbers[i]) {
      min = numbers[i];
    }
    ++i;
  }
  return min;
};

/*
Normalizes a number from another range into a value between 0 and 1.
Identical to map(value, low, high, 0, 1);
Numbers outside the range are not clamped to 0 and 1, because out-of-range
values are often intentional and useful.

@param {float} aNumber    The incoming value to be converted
@param {float} low        Lower bound of the value's current range
@param {float} high       Upper bound of the value's current range

@returns {float}

@see map
@see lerp
*/


norm = function(aNumber, low, high) {
  return (aNumber - low) / (high - low);
};

/*
Facilitates exponential expressions. The pow() function is an efficient way of
multiplying numbers by themselves (or their reciprocal) in large quantities.
For example, pow(3, 5) is equivalent to the expression 3*3*3*3*3 and pow(3, -5)
is equivalent to 1 / 3*3*3*3*3.

@param {int|float} num        base of the exponential expression
@param {int|float} exponent   power of which to raise the base

@returns {float}

@see sqrt
*/


pow = Math.pow;

/*
Calculates the integer closest to the value parameter. For example, round(9.2) returns the value 9.

@param {float} value        number to round

@returns {int}

@see floor
@see ceil
*/


round = Math.round;

/*
Squares a number (multiplies a number by itself). The result is always a positive number,
as multiplying two negative numbers always yields a positive result. For example, -1 * -1 = 1.

@param {float} value        int or float

@returns {float}

@see sqrt
*/


sq = function(aNumber) {
  return aNumber * aNumber;
};

/*
Calculates the square root of a number. The square root of a number is always positive,
even though there may be a valid negative root. The square root s of number a is such
that s*s = a. It is the opposite of squaring.

@param {float} value        int or float, non negative

@returns {float}

@see pow
@see sq
*/


sqrt = Math.sqrt;

/*
The inverse of cos(), returns the arc cosine of a value. This function expects the
values in the range of -1 to 1 and values are returned in the range 0 to PI (3.1415927).

@param {float} value        the value whose arc cosine is to be returned

@returns {float}

@see cos
@see asin
@see atan
*/


acos = Math.acos;

/*
The inverse of sin(), returns the arc sine of a value. This function expects the values
in the range of -1 to 1 and values are returned in the range -PI/2 to PI/2.

@param {float} value        the value whose arc sine is to be returned

@returns {float}

@see sin
@see acos
@see atan
*/


asin = Math.asin;

/*
The inverse of tan(), returns the arc tangent of a value. This function expects the values
in the range of -Infinity to Infinity (exclusive) and values are returned in the range -PI/2 to PI/2 .

@param {float} value        -Infinity to Infinity (exclusive)

@returns {float}

@see tan
@see asin
@see acos
*/


atan = Math.atan;

/*
Calculates the angle (in radians) from a specified point to the coordinate origin as measured from
the positive x-axis. Values are returned as a float in the range from PI to -PI. The atan2() function
is most often used for orienting geometry to the position of the cursor. Note: The y-coordinate of the
point is the first parameter and the x-coordinate is the second due the the structure of calculating the tangent.

@param {float} y        y-coordinate of the point
@param {float} x        x-coordinate of the point

@returns {float}

@see tan
*/


atan2 = Math.atan2;

/*
Calculates the cosine of an angle. This function expects the values of the angle parameter to be provided
in radians (values from 0 to PI*2). Values are returned in the range -1 to 1.

@param {float} value        an angle in radians

@returns {float}

@see tan
@see sin
*/


cos = Math.cos;

/*
Converts a radian measurement to its corresponding value in degrees. Radians and degrees are two ways of
measuring the same thing. There are 360 degrees in a circle and 2*PI radians in a circle. For example,
90 degrees = PI/2 = 1.5707964. All trigonometric methods in Processing require their parameters to be specified in radians.

@param {int|float} value        an angle in radians

@returns {float}

@see radians
*/


degrees = function(aAngle) {
  return (aAngle * 180) / Math.PI;
};

/*
Converts a degree measurement to its corresponding value in radians. Radians and degrees are two ways of
measuring the same thing. There are 360 degrees in a circle and 2*PI radians in a circle. For example,
90 degrees = PI/2 = 1.5707964. All trigonometric methods in Processing require their parameters to be specified in radians.

@param {int|float} value        an angle in radians

@returns {float}

@see degrees
*/


radians = function(aAngle) {
  return (aAngle / 180) * Math.PI;
};

/*
Calculates the sine of an angle. This function expects the values of the angle parameter to be provided in
radians (values from 0 to 6.28). Values are returned in the range -1 to 1.

@param {float} value        an angle in radians

@returns {float}

@see cos
@see radians
*/


sin = Math.sin;

/*
Calculates the ratio of the sine and cosine of an angle. This function expects the values of the angle
parameter to be provided in radians (values from 0 to PI*2). Values are returned in the range infinity to -infinity.

@param {float} value        an angle in radians

@returns {float}

@see cos
@see sin
@see radians
*/


tan = Math.tan;

currentRandom = Math.random;

/*
Generates random numbers. Each time the random() function is called, it returns an unexpected value within
the specified range. If one parameter is passed to the function it will return a float between zero and the
value of the high parameter. The function call random(5) returns values between 0 and 5 (starting at zero,
up to but not including 5). If two parameters are passed, it will return a float with a value between the
parameters. The function call random(-5, 10.2) returns values starting at -5 up to (but not including) 10.2.
To convert a floating-point random number to an integer, use the int() function.

@param {int|float} value1         if one parameter is used, the top end to random from, if two params the low end
@param {int|float} value2         the top end of the random range

@returns {float}

@see randomSeed
@see noise
*/


random = function() {
  var aMax, aMin;

  if (!arguments.length) {
    return currentRandom();
  }
  if (arguments.length === 1) {
    return currentRandom() * arguments[0];
  }
  aMin = arguments[0];
  aMax = arguments[1];
  return currentRandom() * (aMax - aMin) + aMin;
};

Marsaglia = function(i1, i2) {
  var nextInt, w, z;

  z = i1 || 362436069;
  w = i2 || 521288629;
  nextInt = function() {
    z = (36969 * (z & 65535) + (z >>> 16)) & 0xFFFFFFFF;
    w = (18000 * (w & 65535) + (w >>> 16)) & 0xFFFFFFFF;
    return (((z & 0xFFFF) << 16) | (w & 0xFFFF)) & 0xFFFFFFFF;
  };
  this.nextDouble = function() {
    var i;

    i = nextInt() / 4294967296;
    if (i < 0) {
      return 1 + i;
    } else {
      return i;
    }
  };
  return this.nextInt = nextInt;
};

Marsaglia.createRandomized = function() {
  var now;

  now = new Date();
  return new Marsaglia((now / 60000) & 0xFFFFFFFF, now & 0xFFFFFFFF);
};

/*
Sets the seed value for random(). By default, random() produces different results each time the
program is run. Set the value parameter to a constant to return the same pseudo-random numbers
each time the software is run.

@param {int|float} seed         int

@see random
@see noise
@see noiseSeed
*/


randomSeed = function(seed) {
  return currentRandom = (new Marsaglia(seed)).nextDouble;
};

Random = function(seed) {
  var haveNextNextGaussian, nextNextGaussian;

  haveNextNextGaussian = false;
  nextNextGaussian = void 0;
  random = void 0;
  this.nextGaussian = function() {
    var multiplier, s, v1, v2;

    if (haveNextNextGaussian) {
      haveNextNextGaussian = false;
      return nextNextGaussian;
    }
    v1 = void 0;
    v2 = void 0;
    s = void 0;
    while (true) {
      v1 = 2 * random() - 1;
      v2 = 2 * random() - 1;
      s = v1 * v1 + v2 * v2;
      if (!(s >= 1 || s === 0)) {
        break;
      }
    }
    multiplier = Math.sqrt(-2 * Math.log(s) / s);
    nextNextGaussian = v2 * multiplier;
    haveNextNextGaussian = true;
    return v1 * multiplier;
  };
  return random = (seed === undefined ? Math.random : (new Marsaglia(seed)).nextDouble);
};

PerlinNoise = function(seed) {
  var grad1d, grad2d, grad3d, i, j, perm, rnd, t;

  grad3d = function(i, x, y, z) {
    var h, u, v;

    h = i & 15;
    u = (h < 8 ? x : y);
    v = (h < 4 ? y : (h === 12 || h === 14 ? x : z));
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  grad2d = function(i, x, y) {
    var v;

    v = ((i & 1) === 0 ? x : y);
    if ((i & 2) === 0) {
      return -v;
    } else {
      return v;
    }
  };
  grad1d = function(i, x) {
    if ((i & 1) === 0) {
      return -x;
    } else {
      return x;
    }
  };
  lerp = function(t, a, b) {
    return a + t * (b - a);
  };
  rnd = (seed !== undefined ? new Marsaglia(seed) : Marsaglia.createRandomized());
  i = void 0;
  j = void 0;
  perm = new Uint8Array(512);
  i = 0;
  while (i < 256) {
    perm[i] = i;
    ++i;
  }
  i = 0;
  while (i < 256) {
    t = perm[j = rnd.nextInt() & 0xFF];
    perm[j] = perm[i];
    perm[i] = t;
    ++i;
  }
  i = 0;
  while (i < 256) {
    perm[i + 256] = perm[i];
    ++i;
  }
  this.noise3d = function(x, y, z) {
    var X, Y, Z, fx, fy, fz, p0, p00, p01, p1, p10, p11;

    X = Math.floor(x) & 255;
    Y = Math.floor(y) & 255;
    Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    fx = (3 - 2 * x) * x * x;
    fy = (3 - 2 * y) * y * y;
    fz = (3 - 2 * z) * z * z;
    p0 = perm[X] + Y;
    p00 = perm[p0] + Z;
    p01 = perm[p0 + 1] + Z;
    p1 = perm[X + 1] + Y;
    p10 = perm[p1] + Z;
    p11 = perm[p1 + 1] + Z;
    return lerp(fz, lerp(fy, lerp(fx, grad3d(perm[p00], x, y, z), grad3d(perm[p10], x - 1, y, z)), lerp(fx, grad3d(perm[p01], x, y - 1, z), grad3d(perm[p11], x - 1, y - 1, z))), lerp(fy, lerp(fx, grad3d(perm[p00 + 1], x, y, z - 1), grad3d(perm[p10 + 1], x - 1, y, z - 1)), lerp(fx, grad3d(perm[p01 + 1], x, y - 1, z - 1), grad3d(perm[p11 + 1], x - 1, y - 1, z - 1))));
  };
  this.noise2d = function(x, y) {
    var X, Y, fx, fy, p0, p1;

    X = Math.floor(x) & 255;
    Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    fx = (3 - 2 * x) * x * x;
    fy = (3 - 2 * y) * y * y;
    p0 = perm[X] + Y;
    p1 = perm[X + 1] + Y;
    return lerp(fy, lerp(fx, grad2d(perm[p0], x, y), grad2d(perm[p1], x - 1, y)), lerp(fx, grad2d(perm[p0 + 1], x, y - 1), grad2d(perm[p1 + 1], x - 1, y - 1)));
  };
  return this.noise1d = function(x) {
    var X, fx;

    X = Math.floor(x) & 255;
    x -= Math.floor(x);
    fx = (3 - 2 * x) * x * x;
    return lerp(fx, grad1d(perm[X], x), grad1d(perm[X + 1], x - 1));
  };
};

noiseProfile = {
  generator: undefined,
  octaves: 4,
  fallout: 0.5,
  seed: undefined
};

/*
Returns the Perlin noise value at specified coordinates. Perlin noise is a random sequence
generator producing a more natural ordered, harmonic succession of numbers compared to the
standard random() function. It was invented by Ken Perlin in the 1980s and been used since
in graphical applications to produce procedural textures, natural motion, shapes, terrains etc.
The main difference to the random() function is that Perlin noise is defined in an infinite
n-dimensional space where each pair of coordinates corresponds to a fixed semi-random value
(fixed only for the lifespan of the program). The resulting value will always be between 0.0
and 1.0. Processing can compute 1D, 2D and 3D noise, depending on the number of coordinates
given. The noise value can be animated by moving through the noise space as demonstrated in
the example above. The 2nd and 3rd dimension can also be interpreted as time.
The actual noise is structured similar to an audio signal, in respect to the function's use
of frequencies. Similar to the concept of harmonics in physics, perlin noise is computed over
several octaves which are added together for the final result.
Another way to adjust the character of the resulting sequence is the scale of the input
coordinates. As the function works within an infinite space the value of the coordinates
doesn't matter as such, only the distance between successive coordinates does (eg. when using
noise() within a loop). As a general rule the smaller the difference between coordinates, the
smoother the resulting noise sequence will be. Steps of 0.005-0.03 work best for most applications,
but this will differ depending on use.

@param {float} x          x coordinate in noise space
@param {float} y          y coordinate in noise space
@param {float} z          z coordinate in noise space

@returns {float}

@see random
@see noiseDetail
*/


noise = function(x, y, z) {
  var effect, generator, i, k, sum;

  if (noiseProfile.generator === undefined) {
    noiseProfile.generator = new PerlinNoise(noiseProfile.seed);
  }
  generator = noiseProfile.generator;
  effect = 1;
  k = 1;
  sum = 0;
  i = 0;
  while (i < noiseProfile.octaves) {
    effect *= noiseProfile.fallout;
    switch (arguments.length) {
      case 1:
        sum += effect * (1 + generator.noise1d(k * x)) / 2;
        break;
      case 2:
        sum += effect * (1 + generator.noise2d(k * x, k * y)) / 2;
        break;
      case 3:
        sum += effect * (1 + generator.noise3d(k * x, k * y, k * z)) / 2;
    }
    k *= 2;
    ++i;
  }
  return sum;
};

/*
Adjusts the character and level of detail produced by the Perlin noise function.
Similar to harmonics in physics, noise is computed over several octaves. Lower octaves
contribute more to the output signal and as such define the overal intensity of the noise,
whereas higher octaves create finer grained details in the noise sequence. By default,
noise is computed over 4 octaves with each octave contributing exactly half than its
predecessor, starting at 50% strength for the 1st octave. This falloff amount can be
changed by adding an additional function parameter. Eg. a falloff factor of 0.75 means
each octave will now have 75% impact (25% less) of the previous lower octave. Any value
between 0.0 and 1.0 is valid, however note that values greater than 0.5 might result in
greater than 1.0 values returned by noise(). By changing these parameters, the signal
created by the noise() function can be adapted to fit very specific needs and characteristics.

@param {int} octaves          number of octaves to be used by the noise() function
@param {float} falloff        falloff factor for each octave

@see noise
*/


noiseDetail = function(octaves, fallout) {
  noiseProfile.octaves = octaves;
  if (fallout !== undefined) {
    return noiseProfile.fallout = fallout;
  }
};

/*
Sets the seed value for noise(). By default, noise() produces different results each
time the program is run. Set the value parameter to a constant to return the same
pseudo-random numbers each time the software is run.

@param {int} seed         int

@returns {float}

@see random
@see radomSeed
@see noise
@see noiseDetail
*/


noiseSeed = function(seed) {
  noiseProfile.seed = seed;
  return noiseProfile.generator = undefined;
};

/*
## ProgramRunner manages the running function as it runs. E.g. this is not a
## translation step, this is managing things such as the actually running of the
## latest "stable" function and keeping track of when a function appears to be stable,
## and reinstating the last stable function if the current one throws a runtime error.
*/

var ProgramRunner;

ProgramRunner = (function() {
  "use strict";
  var consecutiveFramesWithoutRunTimeError, currentCodeString, doOnceOccurrencesLineNumbers, drawFunction, lastStableDrawFunction;

  doOnceOccurrencesLineNumbers = [];

  drawFunction = "";

  consecutiveFramesWithoutRunTimeError = 0;

  lastStableDrawFunction = null;

  currentCodeString = "";

  function ProgramRunner(eventRouter, liveCodeLabCoreInstance) {
    var _this = this;

    this.eventRouter = eventRouter;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    window.addDoOnce = function(a) {
      return _this.addDoOnce(a);
    };
  }

  ProgramRunner.prototype.addDoOnce = function(lineNum) {
    return this.doOnceOccurrencesLineNumbers.push(lineNum);
  };

  ProgramRunner.prototype.setDrawFunction = function(drawFunc) {
    return this.drawFunction = drawFunc;
  };

  ProgramRunner.prototype.resetTrackingOfDoOnceOccurrences = function() {
    return this.doOnceOccurrencesLineNumbers = [];
  };

  ProgramRunner.prototype.putTicksNextToDoOnceBlocksThatHaveBeenRun = function() {
    var codeTransformer;

    codeTransformer = this.liveCodeLabCoreInstance.codeTransformer;
    if (this.doOnceOccurrencesLineNumbers.length) {
      return this.setDrawFunction(codeTransformer.addCheckMarksAndUpdateCodeAndNotifyChange(codeTransformer, this.doOnceOccurrencesLineNumbers));
    }
  };

  ProgramRunner.prototype.runDrawFunction = function() {
    this.drawFunction();
    this.consecutiveFramesWithoutRunTimeError += 1;
    if (this.consecutiveFramesWithoutRunTimeError === 5) {
      this.lastStableDrawFunction = this.drawFunction;
      return this.eventRouter.trigger("livecodelab-running-stably");
    }
  };

  ProgramRunner.prototype.reinstateLastWorkingDrawFunction = function() {
    this.consecutiveFramesWithoutRunTimeError = 0;
    return this.drawFunction = this.lastStableDrawFunction;
  };

  return ProgramRunner;

})();

/*
## Although LiveCodeLab is ultimately running Javascript code behind the scenes,
## the user uses a simpler syntax which is basically coffeescript with a little bit of
## extra sugar. CodeTransformer takes care of translating this simplified syntax to
## Javascript. Also note that CodeTransformer might return a program that substituted
## the program passed as input. This is because doOnce statements get transformed by
## pre-prending a tick once they are run, which prevents them from being run again.
*/

var CodeTransformer;

CodeTransformer = (function() {
  CodeTransformer.prototype.currentCodeString = null;

  function CodeTransformer(eventRouter, CoffeeCompiler, liveCodeLabCoreInstance) {
    var listOfPossibleFunctions;

    this.eventRouter = eventRouter;
    this.CoffeeCompiler = CoffeeCompiler;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    listOfPossibleFunctions = ["function", "alert", "rect", "line", "box", "ball", "ballDetail", "peg", "rotate", "move", "scale", "pushMatrix", "popMatrix", "resetMatrix", "bpm", "play", "fill", "noFill", "stroke", "noStroke", "strokeSize", "animationStyle", "background", "simpleGradient", "colorMode", "color", "lights", "noLights", "ambientLight", "pointLight", "abs", "ceil", "constrain", "dist", "exp", "floor", "lerp", "log", "mag", "map", "max", "min", "norm", "pow", "round", "sq", "sqrt", "acos", "asin", "atan", "atan2", "cos", "degrees", "radians", "sin", "tan", "random", "randomSeed", "noise", "noiseDetail", "noiseSeed", "addDoOnce"];
  }

  /*
  ## Stops ticked doOnce blocks from running
  ## 
  ## doOnce statements which have a tick mark next to them
  ## are not run. This is achieved by replacing the line with
  ## the "doOnce" with "if false" or "//" depending on whether
  ## the doOnce is a multiline or an inline one, like so:
  ## 
  ##      ✓doOnce ->
  ##      background 255
  ##      fill 255,0,0
  ##      ✓doOnce -> ball
  ##      becomes:
  ##      if false ->
  ##      background 255
  ##      fill 255,0,0
  ##      //doOnce -> ball
  ## 
  ## @param {string} code    the code to re-write
  ## 
  ## @returns {string}
  */


  CodeTransformer.prototype.removeTickedDoOnce = function(code) {
    var newCode;

    newCode = void 0;
    newCode = code.replace(/^(\s)*✓[ ]*doOnce[ ]*\-\>[ ]*$/gm, "$1if false");
    newCode = newCode.replace(/\u2713/g, "//");
    return newCode;
  };

  CodeTransformer.prototype.addTracingInstructionsToDoOnceBlocks = function(code) {
    var elaboratedSourceByLine, iteratingOverSource, _i, _ref;

    elaboratedSourceByLine = void 0;
    iteratingOverSource = void 0;
    if (code.indexOf("doOnce") > -1) {
      elaboratedSourceByLine = code.split("\n");
      for (iteratingOverSource = _i = 0, _ref = elaboratedSourceByLine.length; 0 <= _ref ? _i < _ref : _i > _ref; iteratingOverSource = 0 <= _ref ? ++_i : --_i) {
        elaboratedSourceByLine[iteratingOverSource] = elaboratedSourceByLine[iteratingOverSource].replace(/^(\s*)doOnce[ ]*\->[ ]*(.+)$/g, "$1;addDoOnce(" + iteratingOverSource + "); (1+0).times -> $2");
        if (elaboratedSourceByLine[iteratingOverSource].match(/^(\s*)doOnce[ ]*\->[ ]*$/g)) {
          elaboratedSourceByLine[iteratingOverSource] = elaboratedSourceByLine[iteratingOverSource].replace(/^(\s*)doOnce[ ]*\->[ ]*$/g, "$1(1+0).times ->");
          elaboratedSourceByLine[iteratingOverSource + 1] = elaboratedSourceByLine[iteratingOverSource + 1].replace(/^(\s*)(.+)$/g, "$1;addDoOnce(" + iteratingOverSource + "); $2");
        }
      }
      code = elaboratedSourceByLine.join("\n");
    }
    return code;
  };

  CodeTransformer.prototype.doesProgramContainStringsOrComments = function(code) {
    var characterBeingExamined, copyOfcode, nextCharacterBeingExamined;

    copyOfcode = code;
    characterBeingExamined = void 0;
    nextCharacterBeingExamined = void 0;
    while (copyOfcode.length) {
      characterBeingExamined = copyOfcode.charAt(0);
      nextCharacterBeingExamined = copyOfcode.charAt(1);
      if (characterBeingExamined === "'" || characterBeingExamined === "\"" || (characterBeingExamined === "/" && (nextCharacterBeingExamined === "*" || nextCharacterBeingExamined === "/"))) {
        return true;
      }
      copyOfcode = copyOfcode.slice(1);
    }
  };

  CodeTransformer.prototype.stripCommentsAndCheckBasicSyntax = function(code) {
    var aposCount, characterBeingExamined, codeWithoutComments, codeWithoutStringsOrComments, curlyBrackCount, programHasBasicError, quoteCount, reasonOfBasicError, roundBrackCount, squareBrackCount;

    codeWithoutComments = void 0;
    codeWithoutStringsOrComments = void 0;
    if (this.doesProgramContainStringsOrComments(code)) {
      code = code.replace(/("(?:[^"\\\n]|\\.)*")|('(?:[^'\\\n]|\\.)*')|(\/\/[^\n]*\n)|(\/\*(?:(?!\*\/)(?:.|\n))*\*\/)/g, function(all, quoted, aposed, singleComment, comment) {
        var cycleToRebuildNewLines, numberOfLinesInMultilineComment, rebuiltNewLines, _i;

        numberOfLinesInMultilineComment = void 0;
        rebuiltNewLines = void 0;
        cycleToRebuildNewLines = void 0;
        if (quoted) {
          return quoted;
        }
        if (aposed) {
          return aposed;
        }
        if (singleComment) {
          return "\n";
        }
        numberOfLinesInMultilineComment = comment.split("\n").length - 1;
        rebuiltNewLines = "";
        for (cycleToRebuildNewLines = _i = 0; 0 <= numberOfLinesInMultilineComment ? _i < numberOfLinesInMultilineComment : _i > numberOfLinesInMultilineComment; cycleToRebuildNewLines = 0 <= numberOfLinesInMultilineComment ? ++_i : --_i) {
          rebuiltNewLines = rebuiltNewLines + "\n";
        }
        return rebuiltNewLines;
      });
      codeWithoutComments = code;
      codeWithoutStringsOrComments = code.replace(/("(?:[^"\\\n]|\\.)*")|('(?:[^'\\\n]|\\.)*')/g, "");
    } else {
      codeWithoutStringsOrComments = code;
    }
    aposCount = 0;
    quoteCount = 0;
    roundBrackCount = 0;
    curlyBrackCount = 0;
    squareBrackCount = 0;
    characterBeingExamined = void 0;
    reasonOfBasicError = void 0;
    while (codeWithoutStringsOrComments.length) {
      characterBeingExamined = codeWithoutStringsOrComments.charAt(0);
      if (characterBeingExamined === "'") {
        aposCount += 1;
      } else if (characterBeingExamined === "\"") {
        quoteCount += 1;
      } else if (characterBeingExamined === "(" || characterBeingExamined === ")") {
        roundBrackCount += 1;
      } else if (characterBeingExamined === "{" || characterBeingExamined === "}") {
        curlyBrackCount += 1;
      } else if (characterBeingExamined === "[" || characterBeingExamined === "]") {
        squareBrackCount += 1;
      }
      codeWithoutStringsOrComments = codeWithoutStringsOrComments.slice(1);
    }
    if (aposCount & 1 || quoteCount & 1 || roundBrackCount & 1 || curlyBrackCount & 1 || squareBrackCount & 1) {
      programHasBasicError = true;
      if (aposCount & 1) {
        reasonOfBasicError = "Missing '";
      }
      if (quoteCount & 1) {
        reasonOfBasicError = "Missing \"";
      }
      if (roundBrackCount & 1) {
        reasonOfBasicError = "Unbalanced ()";
      }
      if (curlyBrackCount & 1) {
        reasonOfBasicError = "Unbalanced {}";
      }
      if (squareBrackCount & 1) {
        reasonOfBasicError = "Unbalanced []";
      }
      this.eventRouter.trigger("compile-time-error-thrown", reasonOfBasicError);
      return null;
    }
    return code;
  };

  /*
  ## Some of the functions can be used with postfix notation
  ## 
  ## e.g.
  ## 
  ##      60 bpm
  ##      red fill
  ##      yellow stroke
  ##      black background
  ## 
  ## We need to switch this round before coffee script compilation
  */


  CodeTransformer.prototype.adjustPostfixNotations = function(code) {
    var elaboratedSource;

    elaboratedSource = void 0;
    elaboratedSource = code.replace(/(\d+)[ ]+bpm(\s)/g, "bpm $1$2");
    elaboratedSource = elaboratedSource.replace(/([a-zA-Z]+)[ ]+fill(\s)/g, "fill $1$2");
    elaboratedSource = elaboratedSource.replace(/([a-zA-Z]+)[ ]+stroke(\s)/g, "stroke $1$2");
    elaboratedSource = elaboratedSource.replace(/([a-zA-Z]+)[ ]+background(\s)/g, "background $1$2");
    return elaboratedSource;
  };

  CodeTransformer.prototype.updateCode = function(code) {
    var aposCount, characterBeingExamined, compiledOutput, curlyBrackCount, e, elaboratedSource, elaboratedSourceByLine, errResults, functionFromCompiledCode, iteratingOverSource, nextCharacterBeingExamined, programHasBasicError, quoteCount, reasonOfBasicError, roundBrackCount, squareBrackCount;

    elaboratedSource = void 0;
    errResults = void 0;
    characterBeingExamined = void 0;
    nextCharacterBeingExamined = void 0;
    aposCount = void 0;
    quoteCount = void 0;
    roundBrackCount = void 0;
    curlyBrackCount = void 0;
    squareBrackCount = void 0;
    elaboratedSourceByLine = void 0;
    iteratingOverSource = void 0;
    reasonOfBasicError = void 0;
    this.currentCodeString = code;
    if (this.currentCodeString === "") {
      this.liveCodeLabCoreInstance.graphicsCommands.resetTheSpinThingy = true;
      programHasBasicError = false;
      this.eventRouter.trigger("clear-error");
      this.liveCodeLabCoreInstance.drawFunctionRunner.consecutiveFramesWithoutRunTimeError = 0;
      functionFromCompiledCode = new Function("");
      this.liveCodeLabCoreInstance.drawFunctionRunner.setDrawFunction(null);
      this.liveCodeLabCoreInstance.drawFunctionRunner.lastStableDrawFunction = null;
      return functionFromCompiledCode;
    }
    code = this.removeTickedDoOnce(code);
    /*
      	## The CodeChecker will check for unbalanced brackets
      	## and unfinished strings
      	## 
      	## If any errors are found then we quit compilation here
      	## and display an error message
    */

    code = this.stripCommentsAndCheckBasicSyntax(code);
    if (code === null) {
      return;
    }
    elaboratedSource = code;
    code = this.adjustPostfixNotations(code);
    code = code.replace(/(\d+)\s+times[ ]*\->/g, ";( $1 + 0).times ->");
    code = this.addTracingInstructionsToDoOnceBlocks(code);
    code = code.replace(/^(\s*)([a-z]+[a-zA-Z0-9]*)[ ]*$/gm, "$1;$2()");
    code = code.replace(/;\s*([a-z]+[a-zA-Z0-9]*)[ ]*([;\n]+)/g, ";$1()$2");
    code = code.replace(/\->\s*([a-z]+[a-zA-Z0-9]*)[ ]*([;\n]+)/g, ";$1()$2");
    if (code.match(/[\s\+\;]+draw\s*\(/) || false) {
      programHasBasicError = true;
      this.eventRouter.trigger("compile-time-error-thrown", "You can't call draw()");
      return;
    }
    code = code.replace(/;(if)\(\)/g, ";$1");
    code = code.replace(/;(else)\(\)/g, ";$1");
    code = code.replace(/;(for)\(\)/g, ";$1");
    code = code.replace(/\/\//g, "#");
    code = code.replace(/([^a-zA-Z0-9])(scale)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(rotate)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(move)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(rect)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(line)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(bpm)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(play)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(pushMatrix)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(popMatrix)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(resetMatrix)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(fill)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(noFill)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(stroke)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(noStroke)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(strokeSize)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(animationStyle)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(simpleGradient)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(background)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(colorMode)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(color)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(lights)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(noLights)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(ambientLight)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(pointLight)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(ball)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(ballDetail)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(peg)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(abs)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(ceil)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(constrain)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(dist)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(exp)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(floor)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(lerp)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(log)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(mag)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(map)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(max)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(min)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(norm)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(pow)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(round)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(sq)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(sqrt)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(acos)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(asin)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(atan)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(atan2)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(cos)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(degrees)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(radians)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(sin)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(tan)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(random)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(randomSeed)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(noise)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(noiseDetail)(\s)+/g, "$1;$2$3");
    code = code.replace(/([^a-zA-Z0-9])(noiseSeed)(\s)+/g, "$1;$2$3");
    code = code.replace(/->(\s+);/g, "->$1");
    code = code.replace(/(\sif\s*.*\s*);/g, "$1");
    code = code.replace(/(\s);(else\s*if\s*.*\s*);/g, "$1$2");
    code = code.replace(/(\s);(else.*\s*);/g, "$1$2");
    try {
      compiledOutput = this.CoffeeCompiler.compile(code, {
        bare: "on"
      });
    } catch (_error) {
      e = _error;
      this.eventRouter.trigger("compile-time-error-thrown", e);
      return;
    }
    programHasBasicError = false;
    this.eventRouter.trigger("clear-error");
    this.liveCodeLabCoreInstance.drawFunctionRunner.consecutiveFramesWithoutRunTimeError = 0;
    compiledOutput = compiledOutput.replace(/var frame/, ";");
    functionFromCompiledCode = new Function(compiledOutput);
    this.liveCodeLabCoreInstance.drawFunctionRunner.setDrawFunction(functionFromCompiledCode);
    return functionFromCompiledCode;
  };

  CodeTransformer.prototype.addCheckMarksAndUpdateCodeAndNotifyChange = function(CodeTransformer, doOnceOccurrencesLineNumbers) {
    var drawFunction, elaboratedSource, elaboratedSourceByLine, iteratingOverSource, _i, _len;

    elaboratedSource = void 0;
    elaboratedSourceByLine = void 0;
    iteratingOverSource = void 0;
    drawFunction = void 0;
    elaboratedSource = this.currentCodeString;
    elaboratedSourceByLine = elaboratedSource.split("\n");
    for (_i = 0, _len = doOnceOccurrencesLineNumbers.length; _i < _len; _i++) {
      iteratingOverSource = doOnceOccurrencesLineNumbers[_i];
      elaboratedSourceByLine[iteratingOverSource] = elaboratedSourceByLine[iteratingOverSource].replace(/^(\s*)doOnce([ ]*\->[ ]*.*)$/gm, "$1✓doOnce$2");
    }
    elaboratedSource = elaboratedSourceByLine.join("\n");
    this.eventRouter.trigger("code-updated-by-livecodelab", elaboratedSource);
    drawFunction = this.updateCode(elaboratedSource);
    return drawFunction;
  };

  return CodeTransformer;

})();

/*
## ProgramLoader takes care of managing the URL and editor content when the user navigates
## through demos and examples - either by selecting menu entries, or by clicking back/forward
## arrow, or by landing on a URL with a hashtag.
*/

var ProgramLoader;

ProgramLoader = (function() {
  "use strict";  function ProgramLoader(eventRouter, texteditor, liveCodeLabCoreInstance) {
    var userWarnedAboutWebglExamples,
      _this = this;

    this.eventRouter = eventRouter;
    this.texteditor = texteditor;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    this.lastHash = "";
    userWarnedAboutWebglExamples = false;
    this.programs = {
      demos: {},
      tutorials: {}
    };
    setInterval(function() {
      return _this.pollHash();
    }, 100);
    eventRouter.bind("url-hash-changed", (function(hash) {
      return _this.loadAppropriateDemoOrTutorialBasedOnHash(hash);
    }), this);
    this.programs.demos.roseDemo = {
      submenu: "Basic",
      title: "Rose",
      code: "// 'B rose' by Guy John (@rumblesan)\n// Mozilla Festival 2012\n// adapted from 'A rose' by Lib4tech\n\ndoOnce -> frame = 0\nbackground red\nscale 1.5\nanimationStyle paintOver\nrotate frame/100\nfill 255-((frame/2)%255),0,0\nstroke 255-((frame/2)%255),0,0\nscale 1-((frame/2)%255) / 255\nbox".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.cheeseAndOlivesDemo = {
      submenu: "Basic",
      title: "Cheese and olives",
      code: "// 'Cheese and olives' by\n// Davina Tirvengadum\n// Mozilla festival 2012\n\nbackground white\nscale .3\nmove 0,-1\nfill yellow\nstroke black\nrotate\nstrokeSize 3\nline 4\nbox\n\nrotate 2,3\nmove 0,3\nscale .3\nfill black\nstroke black\nball\n\nrotate 3\nmove 5\nscale 1\nfill green\nstroke green\nball\n\nrotate 1\nmove -3\nscale 1\nfill yellow\nstroke yellow\nball".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.simpleCubeDemo = {
      submenu: "Basic",
      title: "Simple cube",
      code: "// there you go!\n// a simple cube!\n\nbackground yellow\nrotate 0,time/2000,time/2000\nbox".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.webgltwocubesDemo = {
      submenu: "WebGL",
      title: "WebGL: Two cubes",
      code: "background 155,255,255\n2 times ->\n▶rotate 0, 1, time/2000\n▶box".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.cubesAndSpikes = {
      submenu: "Basic",
      title: "Cubes and spikes",
      code: "simpleGradient fuchsia,color(100,200,200),yellow\nscale 2.1\n5 times ->\n▶rotate 0,1,time/5000\n▶box 0.1,0.1,0.1\n▶move 0,0.1,0.1\n▶3 times ->\n▶▶rotate 0,1,1\n▶▶box 0.01,0.01,1".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.webglturbineDemo = {
      submenu: "WebGL",
      title: "WebGL: Turbine",
      code: "background 155,55,255\n70 times ->\n▶rotate time/100000,1,time/100000\n▶box".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.webglzfightartDemo = {
      submenu: "WebGL",
      title: "WebGL: Z-fight!",
      code: "// Explore the artifacts\n// of your GPU!\n// Go Z-fighting, go!\nscale 5\nrotate\nfill red\nbox\nrotate 0.000001\nfill yellow\nbox".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.littleSpiralOfCubes = {
      submenu: "Basic",
      title: "Little spiral",
      code: "background orange\nscale 0.1\n10 times ->\n▶rotate 0,1,time/1000\n▶move 1,1,1\n▶box".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.tentacleDemo = {
      submenu: "Basic",
      title: "Tentacle",
      code: "background 155,255,155\nscale 0.15\n3 times ->\n▶rotate 0,1,1\n▶10 times ->\n▶▶rotate 0,1,time/1000\n▶▶scale 0.9\n▶▶move 1,1,1\n▶▶box".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.lampDemo = {
      submenu: "Basic",
      title: "Lamp",
      code: "animationStyle motionBlur\nsimpleGradient red,yellow,color(255,0,255)\n//animationStyle paintOver\nscale 2\nrotate time/4000, time/4000,  time/4000\n90 times ->\n▶rotate time/200000, time/200000,  time/200000\n▶line\n▶move 0.5,0,0\n▶line\n▶move -0.5,0,0\n▶line\n▶line".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.trillionfeathersDemo = {
      submenu: "Basic",
      title: "A trillion feathers",
      code: "animationStyle paintOver\nmove 2,0,0\nscale 2\nrotate\n20 times ->\n▶rotate\n▶move 0.25,0,0\n▶line\n▶move -0.5,0,0\n▶line".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.monsterblobDemo = {
      submenu: "Basic",
      title: "Monster blob",
      code: "ballDetail 6\nanimationStyle motionBlur\nrotate time/5000\nsimpleGradient fuchsia,aqua,yellow\n5 times ->\n▶rotate 0,1,time/5000\n▶move 0.2,0,0\n▶3 times ->\n▶▶rotate 1\n▶▶ball -1".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.industrialMusicDemo = {
      submenu: "Sound",
      title: "Sound: Industrial",
      code: "bpm 88\nplay 'alienBeep'  ,'zzxz zzzz zzxz zzzz'\nplay 'beepC'  ,'zxzz zzzz xzzx xxxz'\nplay 'beepA'  ,'zzxz zzzz zzxz zzzz'\nplay 'lowFlash'  ,'zzxz zzzz zzzz zzzz'\nplay 'beepB'  ,'xzzx zzzz zxzz zxzz'\nplay 'voltage'  ,'xzxz zxzz xzxx xzxx'\nplay 'tranceKick'  ,'zxzx zzzx xzzz zzxx'".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.trySoundsDemo = {
      submenu: "Sound",
      title: "Sound: Try them all",
      code: "bpm 88\n// leave this one as base\nplay 'tranceKick'  ,'zxzx zzzx xzzz zzxx'\n\n// uncomment the sounds you want to try\n//play 'toc'  ,'zzxz zzzz zzxz zzzz'\n//play 'highHatClosed'  ,'zzxz zzzz zzxz zzzz'\n//play 'highHatOpen'  ,'zzxz zzzz zzxz zzzz'\n//play 'toc2'  ,'zzxz zzzz zzxz zzzz'\n//play 'toc3'  ,'zzxz zzzz zzxz zzzz'\n//play 'toc4'  ,'zzxz zzzz zzxz zzzz'\n//play 'snare'  ,'zzxz zzzz zzxz zzzz'\n//play 'snare2'  ,'zzxz zzzz zzxz zzzz'\n//play 'china'  ,'zzxz zzzz zzxz zzzz'\n//play 'crash'  ,'zzxz zzzz zzxz zzzz'\n//play 'crash2'  ,'zzxz zzzz zzxz zzzz'\n//play 'crash3'  ,'zzxz zzzz zzxz zzzz'\n//play 'ride'  ,'zzxz zzzz zzxz zzzz'\n//play 'glass'  ,'zzxz zzzz zzxz zzzz'\n//play 'glass1'  ,'zzxz zzzz zzxz zzzz'\n//play 'glass2'  ,'zzxz zzzz zzxz zzzz'\n//play 'glass3'  ,'zzxz zzzz zzxz zzzz'\n//play 'thump'  ,'zzxz zzzz zzxz zzzz'\n//play 'lowFlash'  ,'zzxz zzzz zzxz zzzz'\n//play 'lowFlash2'  ,'zzxz zzzz zzxz zzzz'\n//play 'tranceKick2'  ,'zzxz zzzz zzxz zzzz'\n//play 'tranceKick'  ,'zzxz zzzz zzxz zzzz'\n//play 'wosh'  ,'zzxz zzzz zzxz zzzz'\n//play 'voltage'  ,'zzxz zzzz zzxz zzzz'\n//play 'beepA'  ,'zzxz zzzz zzxz zzzz'\n//play 'beepB'  ,'zzxz zzzz zzxz zzzz'\n//play 'beepC'  ,'zzxz zzzz zzxz zzzz'\n//play 'beepD'  ,'zzxz zzzz zzxz zzzz'\n//play 'beep'  ,'zzxz zzzz zzxz zzzz'\n//play 'hello'  ,'zzxz zzzz zzxz zzzz'\n//play 'alienBeep'  ,'zzxz zzzz zzxz zzzz'".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.springysquaresDemo = {
      submenu: "Basic",
      title: "Springy squares",
      code: "animationStyle motionBlur\nsimpleGradient fuchsia,color(100,200,200),yellow\nscale 0.3\n3 times ->\n▶move 0,0,0.5\n▶5 times ->\n▶▶rotate time/2000\n▶▶move 0.7,0,0\n▶▶rect".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.diceDemo = {
      submenu: "Basic",
      title: "Dice",
      code: "animationStyle motionBlur\nsimpleGradient color(255),moccasin,peachpuff\nstroke 255,100,100,255\nfill red,155\nmove -0.5,0,0\nscale 0.3\n3 times ->\n▶move 0,0,0.5\n▶1 times ->\n▶▶rotate time/1000\n▶▶move 2,0,0\n▶▶box".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.webglalmostvoronoiDemo = {
      submenu: "WebGL",
      title: "WebGL: Almost Voronoi",
      code: "scale 10\n2 times ->\n▶rotate 0,1,time/10000\n▶ball -1".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.webglshardsDemo = {
      submenu: "WebGL",
      title: "WebGL: Shards",
      code: "scale 10\nfill 0\nstrokeSize 7\n5 times ->\n▶rotate 0,1,time/20000\n▶ball \n▶rotate 0,1,1\n▶ball -1.01".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.webglredthreadsDemo = {
      submenu: "WebGL",
      title: "WebGL: Red threads",
      code: "scale 10.5\nbackground black\nstroke red\nnoFill\nstrokeSize 7\n5 times ->\n▶rotate time/20000\n▶ball\n▶rotate 0,1,1\n▶ball".replace(/\u25B6/g, "\t")
    };
    this.programs.demos.webglnuclearOctopusDemo = {
      submenu: "WebGL",
      title: "WebGL: Nuclear octopus",
      code: "simpleGradient black,color(0,0,(time/5)%255),black\nscale 0.2\nmove 5,0,0\nanimationStyle motionBlur\n//animationStyle paintOver\nstroke 255,0,0,120\nfill time%255,0,0\npushMatrix\ncount = 0\n3 times ->\n▶count++\n▶pushMatrix\n▶rotate count+3+time/1000,2+count + time/1000,4+count\n▶120 times ->\n▶▶scale 0.9\n▶▶move 1,1,0\n▶▶rotate time/100\n▶▶box\n▶popMatrix".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.introTutorial = {
      submenu: "Intro",
      title: "intro",
      code: "// Lines beginning with two\n// slashes (like these) are just comments.\n\n// Everything else is run\n// about 30 to 60 times per second\n// in order to create an animation.\n\n// Click the link below to start the tutorial.\n\n// next-tutorial:hello_world".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.helloworldTutorial = {
      submenu: "Intro",
      title: "hello world",
      code: "// type these three letters\n// in one of these empty lines below:\n// 'b' and 'o' and 'x'\n\n\n\n// (you should then see a box facing you)\n// click below for the next tutorial\n// next-tutorial:some_notes".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.somenotesTutorial = {
      submenu: "Intro",
      title: "some notes",
      code: "// If this makes sense to you:\n// the syntax is similar to Coffeescript\n// and the commands are almost\n// like Processing.\n\n// If this doesn't make sense to you\n// don't worry.\n\n// next-tutorial:rotate".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.rotateTutorial = {
      submenu: "Intro",
      title: "a taste of animation",
      code: "// now that we have a box\n// let's rotate it:\n// type 'rotate 1' in the\n// line before the 'box'\n\n\nbox\n\n// click for the next tutorial:\n// next-tutorial:frame".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.frameTutorial = {
      submenu: "Animation",
      title: "frame",
      code: "// make the box spin\n// by replacing '1' with 'frame'\n\nrotate 1\nbox\n\n// 'frame' contains a number\n// always incrementing as\n// the screen is re-drawn.\n// (use 'frame/100' to slow it down)\n// next-tutorial:time".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.timeTutorial = {
      submenu: "Animation",
      title: "time",
      code: "// 'frame/100' has one problem:\n// faster computers will make\n// the cube spin too fast.\n// Replace it with 'time/2000'.\n\nrotate frame/100\nbox\n\n// 'time' counts the\n// number of milliseconds since\n// the program started, so it's\n// independent of how fast\n// the computer is at drawing.\n// next-tutorial:move".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.moveTutorial = {
      submenu: "Placing things",
      title: "move",
      code: "// you can move any object\n// by using 'move'\n\nbox\nmove 1,1,0\nbox\n\n// try to use a rotate before\n// the first box to see how the\n// scene changes.\n// next-tutorial:scale".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.scaleTutorial = {
      submenu: "Placing things",
      title: "scale",
      code: "// you can make an object bigger\n// or smaller by using 'scale'\n\nrotate 3\nbox\nmove 1\nscale 2\nbox\n\n// try to use scale or move before\n// the first box to see how the\n// scene changes.\n// next-tutorial:times".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.timesTutorial = {
      submenu: "Repeating stuff",
      title: "times",
      code: "// 'times' (not to be confused with\n// 'time'!) can be used to\n// repeat operations like so:\n\nrotate 1\n3 times ->\n▶move 0.2,0.2,0.2\n▶box\n\n// note how the tabs indicate\n// exactly the block of code\n// to be repeated.\n// next-tutorial:fill".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.fillTutorial = {
      submenu: "Graphics",
      title: "fill",
      code: "// 'fill' changes the\n// color of all the faces:\n\nrotate 1\nfill 255,255,0\nbox\n\n// the three numbers indicate \n// red green and blue values.\n// You can also use color names such as 'indigo'\n// Try replacing the numbers with\n// 'angleColor'\n// next-tutorial:stroke".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.strokeTutorial = {
      submenu: "Graphics",
      title: "stroke",
      code: "// 'stroke' changes all the\n// edges:\n\nrotate 1\nstrokeSize 5\nstroke 255,255,255\nbox\n\n// the three numbers are RGB\n// but you can also use the color names\n// or the special color 'angleColor'\n// Also you can use 'strokeSize'\n// to specify the thickness.\n// next-tutorial:color_names".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.colornamesTutorial = {
      submenu: "Graphics",
      title: "color by name",
      code: "// you can call colors by name\n// try to un-comment one line:\n//fill greenyellow\n//fill indigo\n//fill lemonchiffon // whaaaat?\n\nrotate 1\nbox\n\n// more color names here:\n// http://html-color-codes.info/color-names/\n// (just use them in lower case)\n// next-tutorial:lights".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.lightsTutorial = {
      submenu: "Graphics",
      title: "lights",
      code: "// 'ambientLight' creates an\n// ambient light so things have\n// some sort of shading:\n\nambientLight 0,255,255\nrotate time/1000\nbox\n\n// you can turn that light on and \n// off while you build the scene\n// by using 'lights' and 'noLights'\n// next-tutorial:background".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.backgroundTutorial = {
      submenu: "Graphics",
      title: "background",
      code: "// 'background' creates a\n// solid background:\n\nbackground 0,0,255\nrotate time/1000\nbox\n\n// next-tutorial:gradient".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.gradientTutorial = {
      submenu: "Graphics",
      title: "gradient",
      code: "// even nicer, you can paint a\n// background gradient:\n\nsimpleGradient color(190,10,10),color(30,90,100),color(0)\nrotate time/1000\nbox\n\n// next-tutorial:line".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.lineTutorial = {
      submenu: "Graphics",
      title: "line",
      code: "// draw lines like this:\n\n20 times ->\n▶rotate time/9000\n▶line\n\n// next-tutorial:ball".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.ballTutorial = {
      submenu: "Graphics",
      title: "ball",
      code: "// draw balls like this:\n\nballDetail 10\n3 times ->\n▶move 0.2,0.2,0.2\n▶ball\n\n// ('ballDetail' is optional)\n// next-tutorial:pushpopMatrix".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.pushpopMatrixTutorial = {
      submenu: "Graphics",
      title: "push and pop",
      code: "// pushMatrix creates a bookmark of\n// the position, which you can\n// return to later by using popMatrix.\n// You can reset using 'resetMatrix'.\n\nrotate time/1000\npushMatrix // bookmark the position after the rotation\nline\nmove 0.5,0,0\nline\npopMatrix // go back to the bookmarked position\nmove -0.5,0,0\nline\nresetMatrix // resets the position\nline // not affected by initial rotation\n// next-tutorial:animation_style".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.animationstyleTutorial = {
      submenu: "Graphics",
      title: "animation style",
      code: "// try uncommenting either line\n// with the animationStyle\n\nbackground 255\n//animationStyle motionBlur\n//animationStyle paintOver\nrotate frame/10\nbox\n\n// next-tutorial:do_once".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.doonceTutorial = {
      submenu: "Controlling the flow",
      title: "do once",
      code: "// delete either check mark below\n\nrotate time/1000\n✓doOnce ->\n▶background 255\n▶fill 255,0,0\n✓doOnce -> ball\nbox\n\n// ...the line or block of code\n// are ran one time only, after that the\n// check marks immediately re-appear\n// P.S. keep hitting the delete button\n// on that first check mark for seizures.\n// next-tutorial:conditionals".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.conditionalsTutorial = {
      submenu: "Controlling the flow",
      title: "conditionals",
      code: "// you can draw different things\n// (or in general do different things)\n// based on any\n// test condition you want:\n\nrotate\nif frame%3 == 0\n▶box\nelse if frame%3 == 1\n▶ball\nelse\n▶peg\n\n// next-tutorial:autocode".replace(/\u25B6/g, "\t")
    };
    this.programs.tutorials.autocodeTutorial = {
      submenu: "Others",
      title: "autocode",
      code: "// the Autocode button invents random\n// variations for you.\n\n// You can interrupt the Autocoder at\n// any time by pressing the button again,\n// or you can press CTRL-Z\n// (or CMD-Z on Macs) to undo (or re-do) some of\n// the steps even WHILE the autocoder is running,\n// if you see that things got\n// boring down a particular path of changes.".replace(/\u25B6/g, "\t")
    };
  }

  ProgramLoader.prototype.loadDemoOrTutorial = function(demoName) {
    var blendControls, prependMessage, userWarnedAboutWebglExamples,
      _this = this;

    if ((!Detector.webgl || this.liveCodeLabCoreInstance.threeJsSystem.forceCanvasRenderer) && !userWarnedAboutWebglExamples && demoName.indexOf("webgl") === 0) {
      userWarnedAboutWebglExamples = true;
      $("#exampleNeedsWebgl").modal();
      $("#simplemodal-container").height(200);
    }
    this.eventRouter.trigger("set-url-hash", "bookmark=" + demoName);
    this.eventRouter.trigger("big-cursor-hide");
    this.eventRouter.trigger("editor-undim");
    this.liveCodeLabCoreInstance.graphicsCommands.doTheSpinThingy = false;
    prependMessage = "";
    if ((!Detector.webgl || this.liveCodeLabCoreInstance.threeJsSystem.forceCanvasRenderer) && demoName.indexOf("webgl") === 0) {
      prependMessage = "// This drawing makes much more sense\n// in a WebGL-enabled browser.\n\n".replace(/\u25B6/g, "\t");
    }
    if (this.programs.demos[demoName] || this.programs.tutorials[demoName]) {
      if (this.programs.demos[demoName]) {
        this.texteditor.setValue(prependMessage + this.programs.demos[demoName].code);
      } else if (this.programs.tutorials[demoName]) {
        this.texteditor.setValue(prependMessage + this.programs.tutorials[demoName].code);
      }
      setTimeout((function() {
        return _this.texteditor.clearHistory();
      }), 30);
    }
    this.texteditor.setCursor(0, 0);
    blendControls = this.liveCodeLabCoreInstance.blendControls;
    blendControls.animationStyle(blendControls.animationStyles.normal);
    blendControls.animationStyleUpdateIfChanged();
    return this.liveCodeLabCoreInstance.renderer.render(this.liveCodeLabCoreInstance.graphicsCommands);
  };

  ProgramLoader.prototype.loadAppropriateDemoOrTutorialBasedOnHash = function(hash) {
    var matched,
      _this = this;

    matched = hash.match(/bookmark=(.*)/);
    if (matched) {
      return this.loadDemoOrTutorial(matched[1]);
    } else {
      this.texteditor.setValue("");
      return setTimeout((function() {
        return _this.texteditor.clearHistory();
      }), 30);
    }
  };

  ProgramLoader.prototype.pollHash = function() {
    if (this.lastHash !== location.hash) {
      this.lastHash = location.hash;
      return this.loadAppropriateDemoOrTutorialBasedOnHash(this.lastHash);
    }
  };

  return ProgramLoader;

})();

/*
## Autocoder takes care of making random variations to the code. It lexes the input,
## collects the tokens that can be mutated, picks one at random, invokes a mutation on it,
## and then re-builds a string pritout from the tokens so to obtain the mutated program.
*/

var Autocoder, TOKEN_ARGDLIM, TOKEN_COLOUR, TOKEN_COLOUROP, TOKEN_COMMENT, TOKEN_DOONCE, TOKEN_ITERATION, TOKEN_MESH, TOKEN_NEWLINE, TOKEN_NUM, TOKEN_OP, TOKEN_SPACE, TOKEN_STATEFUN, TOKEN_TAB, TOKEN_TRANSLATION, TOKEN_UNKNOWN, TOKEN_VARIABLE;

Autocoder = (function() {
  "use strict";  Autocoder.prototype.active = false;

  Autocoder.prototype.autocoderMutateTimeout = void 0;

  Autocoder.prototype.numberOfResults = 0;

  Autocoder.prototype.whichOneToChange = 0;

  function Autocoder(eventRouter, editor, colourNames) {
    var addRule, scanningAllColors, _i, _len, _ref,
      _this = this;

    this.eventRouter = eventRouter;
    this.editor = editor;
    this.colourNames = colourNames;
    this.Tokens = [];
    this.LexersOnlyState = new LexerState();
    addRule = function(regex, TokenClass, otherArgs) {
      return _this.LexersOnlyState.addRule(regex, function(matchedPartOfInput, remainingInput, currentState) {
        _this.Tokens.push(new TokenClass(matchedPartOfInput[0], otherArgs));
        return currentState.returnAFunctionThatAppliesRulesAndRunsActionFor(remainingInput);
      });
    };
    addRule(/\/\/.*\n/, TOKEN_COMMENT);
    addRule(/\t/, TOKEN_TAB);
    addRule(/-?[0-9]+\.?[0-9]*/, TOKEN_NUM);
    addRule(/-?\.[0-9]*/, TOKEN_NUM);
    addRule(/[*|\/|+|\-|=]/, TOKEN_OP);
    addRule(/,/, TOKEN_ARGDLIM);
    addRule(/[\n|\r]{1,2}/, TOKEN_NEWLINE);
    addRule(/rotate/, TOKEN_TRANSLATION);
    addRule(/move/, TOKEN_TRANSLATION);
    addRule(/scale/, TOKEN_TRANSLATION);
    _ref = this.colourNames;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      scanningAllColors = _ref[_i];
      addRule(new RegExp(scanningAllColors), TOKEN_COLOUR, this.colourNames);
    }
    addRule(/background/, TOKEN_COLOUROP);
    addRule(/fill/, TOKEN_COLOUROP);
    addRule(/stroke/, TOKEN_COLOUROP);
    addRule(/simpleGradient/, TOKEN_COLOUROP);
    addRule(/box/, TOKEN_MESH);
    addRule(/ball/, TOKEN_MESH);
    addRule(/peg/, TOKEN_MESH);
    addRule(/rect/, TOKEN_MESH);
    addRule(/line/, TOKEN_MESH);
    addRule(/ambientLight/, TOKEN_STATEFUN);
    addRule(/noStroke/, TOKEN_STATEFUN);
    addRule(/ballDetail/, TOKEN_STATEFUN);
    addRule(/animationStyle\s\w+/, TOKEN_STATEFUN);
    addRule(/\d+\s+times\s+->/, TOKEN_ITERATION);
    addRule(/time/, TOKEN_VARIABLE);
    addRule(/delay/, TOKEN_VARIABLE);
    addRule(/\?doOnce\s+->\s*/, TOKEN_DOONCE);
    addRule(RegExp(" +"), TOKEN_SPACE);
    addRule(/'/, TOKEN_UNKNOWN);
    addRule(/[✓]?doOnce\s+\->?/, TOKEN_UNKNOWN);
    addRule(RegExp("=="), TOKEN_UNKNOWN);
    addRule(/else/, TOKEN_UNKNOWN);
    addRule(/next-tutorial:\w+/, TOKEN_UNKNOWN);
    addRule(/\w+/, TOKEN_UNKNOWN);
    addRule(/if/, TOKEN_UNKNOWN);
    addRule(/pushMatrix/, TOKEN_UNKNOWN);
    addRule(/popMatrix/, TOKEN_UNKNOWN);
    addRule(/play/, TOKEN_UNKNOWN);
    addRule(/bpm/, TOKEN_UNKNOWN);
    addRule(/color\s*\(.+\)/, TOKEN_UNKNOWN);
    addRule(/noFill/, TOKEN_UNKNOWN);
    addRule(/frame/, TOKEN_UNKNOWN);
    addRule(/strokeSize/, TOKEN_UNKNOWN);
    addRule(/\(/, TOKEN_UNKNOWN);
    addRule(/\)/, TOKEN_UNKNOWN);
    addRule(/%/, TOKEN_UNKNOWN);
  }

  Autocoder.prototype.emit = function(stream) {
    var ret, scanningTheStream, _i, _len;

    ret = "";
    for (_i = 0, _len = stream.length; _i < _len; _i++) {
      scanningTheStream = stream[_i];
      ret = ret + scanningTheStream.string;
    }
    return ret;
  };

  Autocoder.prototype.canMutate = function(token) {
    if (typeof token.mutate === "function") {
      return true;
    } else {
      return false;
    }
  };

  Autocoder.prototype.pickMutatableTokenAndMutateIt = function(stream) {
    var idx, mutatableTokens, scanningTheStream, _i, _len;

    mutatableTokens = [];
    idx = void 0;
    for (_i = 0, _len = stream.length; _i < _len; _i++) {
      scanningTheStream = stream[_i];
      if (this.canMutate(scanningTheStream)) {
        mutatableTokens.push(scanningTheStream);
      }
    }
    if (mutatableTokens.length === 0) {
      return;
    }
    idx = Math.floor(Math.random() * mutatableTokens.length);
    return mutatableTokens[idx].mutate();
  };

  Autocoder.prototype.replaceTimeWithAConstant = function() {
    var allMatches, countWhichOneToSwap, editorContent, rePattern;

    editorContent = this.editor.getValue();
    rePattern = /(time)/g;
    allMatches = editorContent.match(rePattern);
    countWhichOneToSwap = 0;
    if (!allMatches) {
      this.numberOfResults = 0;
    } else {
      this.numberOfResults = allMatches.length;
    }
    this.whichOneToChange = Math.floor(Math.random() * this.numberOfResults) + 1;
    editorContent = editorContent.replace(rePattern, function(match, text, urlId) {
      countWhichOneToSwap++;
      if (countWhichOneToSwap === this.whichOneToChange) {
        return "" + Math.floor(Math.random() * 20) + 1;
      }
      return match;
    });
    return this.editor.setValue(editorContent);
  };

  Autocoder.prototype.mutate = function() {
    var e, editorContent, newContent;

    editorContent = this.editor.getValue();
    newContent = void 0;
    this.Tokens = [];
    try {
      this.LexersOnlyState.lex(editorContent);
    } catch (_error) {
      e = _error;
    }
    this.pickMutatableTokenAndMutateIt(this.Tokens);
    newContent = this.emit(this.Tokens);
    return this.editor.setValue(newContent);
  };

  Autocoder.prototype.autocoderMutate = function() {
    this.eventRouter.trigger("autocoderbutton-flash");
    return this.mutate();
  };

  Autocoder.prototype.toggle = function(forcedState) {
    var _this = this;

    if (forcedState === undefined) {
      this.active = !this.active;
    } else {
      this.active = forcedState;
    }
    if (this.active) {
      this.autocoderMutateTimeout = setInterval((function() {
        return _this.autocoderMutate();
      }), 1000);
      if (this.editor.getValue() === "" || ((window.location.hash.indexOf("bookmark") !== -1) && (window.location.hash.indexOf("autocodeTutorial") !== -1))) {
        this.eventRouter.trigger("load-program", "cubesAndSpikes");
      }
    } else {
      clearInterval(this.autocoderMutateTimeout);
    }
    return this.eventRouter.trigger("autocoder-button-pressed", this.active);
  };

  return Autocoder;

})();

TOKEN_COMMENT = (function() {
  function TOKEN_COMMENT(string) {
    this.string = string;
  }

  TOKEN_COMMENT.prototype.toString = function() {
    return "COMMENT(" + string + ")";
  };

  return TOKEN_COMMENT;

})();

TOKEN_SPACE = (function() {
  function TOKEN_SPACE(string) {
    this.string = string;
  }

  TOKEN_SPACE.prototype.toString = function() {
    return "SPACE(" + string + ")";
  };

  return TOKEN_SPACE;

})();

TOKEN_NEWLINE = (function() {
  function TOKEN_NEWLINE(string) {
    this.string = string;
  }

  TOKEN_NEWLINE.prototype.toString = function() {
    return "<br/>";
  };

  return TOKEN_NEWLINE;

})();

TOKEN_TRANSLATION = (function() {
  function TOKEN_TRANSLATION(string) {
    this.string = string;
  }

  TOKEN_TRANSLATION.prototype.toString = function() {
    return "TOKEN_TRANSLATION(" + this.string + ")";
  };

  return TOKEN_TRANSLATION;

})();

TOKEN_VARIABLE = (function() {
  function TOKEN_VARIABLE(string) {
    this.string = string;
  }

  TOKEN_VARIABLE.prototype.toString = function() {
    return "TOKEN_VARIABLE(" + this.string + ")";
  };

  return TOKEN_VARIABLE;

})();

TOKEN_NUM = (function() {
  function TOKEN_NUM(string) {
    this.string = string;
  }

  TOKEN_NUM.prototype.toString = function() {
    return "TOKEN_NUM(" + this.string + ")";
  };

  TOKEN_NUM.prototype.mutate = function() {
    var num, offset, scalar;

    num = new Number(this.string);
    scalar = void 0;
    if (0 === num) {
      num = 0.1;
    }
    if (Math.random() > 0.5) {
      scalar = 0 - Math.random();
    } else {
      scalar = Math.random();
    }
    offset = num * Math.random();
    num += offset;
    num = num.toFixed(2);
    return this.string = num.toString();
  };

  return TOKEN_NUM;

})();

TOKEN_OP = (function() {
  function TOKEN_OP(string) {
    this.string = string;
  }

  TOKEN_OP.prototype.toString = function() {
    return "TOKEN_OP(" + this.string + ")";
  };

  return TOKEN_OP;

})();

TOKEN_ARGDLIM = (function() {
  function TOKEN_ARGDLIM(string) {
    this.string = string;
  }

  TOKEN_ARGDLIM.prototype.toString = function() {
    return "TOKEN_ARGDLIM(" + this.string + ")";
  };

  return TOKEN_ARGDLIM;

})();

TOKEN_TAB = (function() {
  function TOKEN_TAB(string) {
    this.string = string;
  }

  TOKEN_TAB.prototype.toString = function() {
    return "TOKEN_TAB(" + this.string + ")";
  };

  return TOKEN_TAB;

})();

TOKEN_DOONCE = (function() {
  function TOKEN_DOONCE(string) {
    this.string = string;
  }

  TOKEN_DOONCE.prototype.toString = function() {
    return "TOKEN_DOONCE(" + this.string + ")";
  };

  return TOKEN_DOONCE;

})();

TOKEN_MESH = (function() {
  function TOKEN_MESH(string) {
    this.string = string;
  }

  TOKEN_MESH.prototype.toString = function() {
    return "TOKEN_MESH(" + this.string + ")";
  };

  TOKEN_MESH.prototype.mutate = function() {
    switch (this.string) {
      case "box":
        this.string = "ball";
        break;
      case "ball":
        this.string = "box";
        break;
      case "line":
        this.string = "rect";
        break;
      case "rect":
        this.string = "line";
    }
  };

  return TOKEN_MESH;

})();

TOKEN_STATEFUN = (function() {
  function TOKEN_STATEFUN(string) {
    this.string = string;
  }

  TOKEN_STATEFUN.prototype.toString = function() {
    return "TOKEN_STATEFUN(" + this.string + ")";
  };

  return TOKEN_STATEFUN;

})();

TOKEN_ITERATION = (function() {
  function TOKEN_ITERATION(string) {
    this.string = string;
  }

  TOKEN_ITERATION.prototype.toString = function() {
    return "TOKEN_ITERATION(" + this.string + ")";
  };

  TOKEN_ITERATION.prototype.mutate = function() {
    var num, pat;

    pat = /\d/;
    num = pat.exec(this.string);
    if (Math.random() > 0.5) {
      num++;
    } else {
      num--;
    }
    return this.string = num.toString() + " times ->";
  };

  return TOKEN_ITERATION;

})();

TOKEN_UNKNOWN = (function() {
  function TOKEN_UNKNOWN(string) {
    this.string = string;
  }

  TOKEN_UNKNOWN.prototype.toString = function() {
    return "TOKEN_UNKNOWN(" + this.string + ")";
  };

  return TOKEN_UNKNOWN;

})();

TOKEN_COLOUR = (function() {
  function TOKEN_COLOUR(string, colourNames) {
    this.string = string;
    this.colourNames = colourNames;
  }

  TOKEN_COLOUR.prototype.toString = function() {
    return "TOKEN_COLOUR(" + this.string + ")";
  };

  TOKEN_COLOUR.prototype.mutate = function() {
    var idx;

    idx = Math.floor(Math.random() * this.colourNames.length);
    while (this.string === this.colourNames[idx]) {
      idx = Math.floor(Math.random() * this.colourNames.length);
    }
    return this.string = this.colourNames[idx];
  };

  return TOKEN_COLOUR;

})();

TOKEN_COLOUROP = (function() {
  function TOKEN_COLOUROP(string) {
    this.string = string;
  }

  TOKEN_COLOUROP.prototype.toString = function() {
    return "TOKEN_COLOUROP(" + this.string + ")";
  };

  return TOKEN_COLOUROP;

})();

/*
## Simple helper to handle the code dimming. When to trigger dimming and un-dimming and
## keeping track of status of the dedicated "automatic dimming" toggle switch.
*/

var EditorDimmer;

EditorDimmer = (function() {
  "use strict";  EditorDimmer.prototype.cursorActivity = true;

  EditorDimmer.prototype.dimIntervalID = void 0;

  EditorDimmer.prototype.dimCodeOn = false;

  function EditorDimmer(eventRouter, bigCursor) {
    this.eventRouter = eventRouter;
    this.bigCursor = bigCursor;
  }

  EditorDimmer.prototype.undimEditor = function() {
    if (!this.bigCursor.isShowing) {
      if ($("#formCode").css("opacity") < 0.99) {
        return $("#formCode").animate({
          opacity: 1
        }, "fast");
      }
    }
  };

  EditorDimmer.prototype.dimEditor = function() {
    if ($("#formCode").css("opacity") > 0) {
      return $("#formCode").animate({
        opacity: 0
      }, "slow");
    }
  };

  EditorDimmer.prototype.dimIfNoCursorActivity = function() {
    if (this.cursorActivity) {
      return this.cursorActivity = false;
    } else {
      return this.dimEditor();
    }
  };

  EditorDimmer.prototype.toggleDimCode = function(dimmingActive) {
    var _this = this;

    if (dimmingActive === undefined) {
      this.dimCodeOn = !this.dimCodeOn;
    } else {
      this.dimCodeOn = dimmingActive;
    }
    if (this.dimCodeOn) {
      this.dimIntervalID = setInterval((function() {
        return _this.dimIfNoCursorActivity();
      }), 5000);
    } else {
      clearInterval(this.dimIntervalID);
      this.undimEditor();
    }
    return this.eventRouter.trigger("auto-hide-code-button-pressed", this.dimCodeOn);
  };

  return EditorDimmer;

})();

/*
## Keeps the time. A small thing to do, but it allows tricks such as setting a fake time
## for testing purposes, and avoiding repeated and unnecessary invokation of the Date and
## getTime browser functions.
*/

var TimeKeeper;

TimeKeeper = (function() {
  "use strict";  TimeKeeper.prototype.time = void 0;

  TimeKeeper.prototype.timeAtStart = void 0;

  function TimeKeeper() {
    window.time = 0;
  }

  TimeKeeper.prototype.updateTime = function() {
    var d;

    d = new Date();
    this.time = d.getTime() - this.timeAtStart;
    return window.time = d.getTime() - this.timeAtStart;
  };

  TimeKeeper.prototype.resetTime = function() {
    var d;

    d = new Date();
    this.time = 0;
    window.time = 0;
    return this.timeAtStart = d.getTime();
  };

  TimeKeeper.prototype.getTime = function() {
    return this.time;
  };

  return TimeKeeper;

})();

/*
## BlendControls manages the three different blending styles. One can decide for either
## 'normal' (e.g. next frame completely replaces the previous one) or 'paintOver'
## (new frame is painted over the previous one, meaning that the previous frame shows through
## the transparent bits of the new frame) or 'motionBlur' (previous frame is shown faintly
## below the current one so to give a vague effect of motion blur).
*/

var BlendControls;

BlendControls = (function() {
  "use strict";  BlendControls.prototype.previousanimationStyleValue = 0;

  BlendControls.prototype.animationStyleValue = 0;

  BlendControls.prototype.animationStyles = {};

  BlendControls.prototype.blendAmount = 0;

  function BlendControls(liveCodeLabCoreInstance) {
    var _this = this;

    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    window.normal = this.animationStyles.normal = 0;
    window.paintOver = this.animationStyles.paintOver = 1;
    window.motionBlur = this.animationStyles.motionBlur = 2;
    window.animationStyle = function(a) {
      return _this.animationStyle(a);
    };
  }

  BlendControls.prototype.animationStyle = function(a) {
    if (a === false || a === undefined) {
      return;
    }
    return this.animationStyleValue = a;
  };

  BlendControls.prototype.animationStyleUpdateIfChanged = function() {
    var isWebGLUsed;

    if (this.animationStyleValue === this.previousanimationStyleValue) {
      return;
    }
    this.previousanimationStyleValue = this.animationStyleValue;
    isWebGLUsed = this.liveCodeLabCoreInstance.threeJsSystem.isWebGLUsed;
    this.animationStyles = this.animationStyles;
    if (isWebGLUsed && this.animationStyleValue === this.animationStyles.motionBlur) {
      this.liveCodeLabCoreInstance.threeJsSystem.effectBlend.uniforms.mixRatio.value = 0.7;
    } else if (!isWebGLUsed && this.animationStyleValue === this.animationStyles.motionBlur) {
      this.blendAmount = 0.6;
    }
    if (isWebGLUsed && this.animationStyleValue === this.animationStyles.paintOver) {
      this.liveCodeLabCoreInstance.threeJsSystem.effectBlend.uniforms.mixRatio.value = 1;
    } else if (!isWebGLUsed && this.animationStyleValue === this.animationStyles.paintOver) {
      this.blendAmount = 1;
    }
    if (isWebGLUsed && this.animationStyleValue === this.animationStyles.normal) {
      return this.liveCodeLabCoreInstance.threeJsSystem.effectBlend.uniforms.mixRatio.value = 0;
    } else if (!isWebGLUsed && this.animationStyleValue === this.animationStyles.normal) {
      return this.blendAmount = 0;
    }
  };

  return BlendControls;

})();

/*
## Implementation of all lights-related commands.
*/

var LightsCommands;

LightsCommands = (function() {
  "use strict";  LightsCommands.prototype.lightsAreOn = false;

  function LightsCommands(liveCodeLabCore_graphicsCommands, liveCodeLabCoreInstance) {
    var _this = this;

    this.liveCodeLabCore_graphicsCommands = liveCodeLabCore_graphicsCommands;
    this.liveCodeLabCoreInstance = liveCodeLabCoreInstance;
    this.objectPools = this.liveCodeLabCore_graphicsCommands.objectPools;
    this.primitiveTypes = this.liveCodeLabCore_graphicsCommands.primitiveTypes;
    this.objectsUsedInFrameCounts = this.liveCodeLabCore_graphicsCommands.objectsUsedInFrameCounts;
    this.objectPools[this.primitiveTypes.ambientLight] = [];
    this.objectsUsedInFrameCounts[this.primitiveTypes.ambientLight] = 0;
    window.lights = function() {
      return _this.lights();
    };
    window.noLights = function() {
      return _this.noLights();
    };
    window.ambientLight = function(a, b, c, d) {
      return _this.ambientLight(a, b, c, d);
    };
  }

  LightsCommands.prototype.lights = function() {
    return this.lightsAreOn = true;
  };

  LightsCommands.prototype.noLights = function() {
    return this.lightsAreOn = false;
  };

  LightsCommands.prototype.ambientLight = function(r, g, b, a) {
    var ambientLightsPool, colorToBeUsed, newLightCreated, pooledAmbientLight;

    newLightCreated = false;
    if (r === undefined) {
      colorToBeUsed = this.liveCodeLabCoreInstance.colourFunctions.color(255);
    } else {
      colorToBeUsed = this.liveCodeLabCoreInstance.colourFunctions.color(r, g, b, a);
    }
    this.lightsAreOn = true;
    this.liveCodeLabCore_graphicsCommands.defaultNormalFill = false;
    this.liveCodeLabCore_graphicsCommands.defaultNormalStroke = false;
    ambientLightsPool = this.objectPools[this.primitiveTypes.ambientLight];
    pooledAmbientLight = ambientLightsPool[this.objectsUsedInFrameCounts[this.primitiveTypes.ambientLight]];
    if (pooledAmbientLight === undefined) {
      pooledAmbientLight = new this.liveCodeLabCoreInstance.three.PointLight(colorToBeUsed);
      pooledAmbientLight.position.set(10, 50, 130);
      newLightCreated = true;
      ambientLightsPool.push(pooledAmbientLight);
      pooledAmbientLight.detailLevel = 0;
      pooledAmbientLight.primitiveType = this.primitiveTypes.ambientLight;
    } else {
      pooledAmbientLight.color.setHex(colorToBeUsed);
    }
    this.objectsUsedInFrameCounts[this.primitiveTypes.ambientLight] += 1;
    if (newLightCreated) {
      return this.liveCodeLabCoreInstance.threeJsSystem.scene.add(pooledAmbientLight);
    }
  };

  return LightsCommands;

})();

/*
## Ui handles all things UI such as the menus, the notification popups, the editor panel,
## the big flashing cursor, the stats widget...
*/

var Ui;

Ui = (function() {
  "use strict";  function Ui(eventRouter, stats, programLoader) {
    var _this = this;

    this.eventRouter = eventRouter;
    this.stats = stats;
    this.programLoader = programLoader;
    this.eventRouter.bind("report-runtime-or-compile-time-error", (function(e) {
      return _this.checkErrorAndReport(e);
    }), this);
    this.eventRouter.bind("clear-error", (function() {
      return _this.clearError();
    }), this);
    this.eventRouter.bind("autocoder-button-pressed", function(state) {
      if (state === true) {
        return $("#autocodeIndicatorContainer").html("Autocode: on").css("background-color", "#FF0000");
      } else {
        return $("#autocodeIndicatorContainer").html("Autocode").css("background-color", "");
      }
    });
    this.eventRouter.bind("autocoderbutton-flash", function() {
      return $("#autocodeIndicatorContainer").fadeOut(100).fadeIn(100);
    });
    this.eventRouter.bind("auto-hide-code-button-pressed", function(state) {
      if (state === true) {
        return $("#dimCodeButtonContainer").html("Hide Code: on");
      } else {
        return $("#dimCodeButtonContainer").html("Hide Code: off");
      }
    });
  }

  Ui.prototype.resizeCanvas = function(canvasId) {
    var canvas, scale;

    canvas = $(canvasId);
    scale = {
      x: 1,
      y: 1
    };
    scale.x = (window.innerWidth + 40) / canvas.width();
    scale.y = (window.innerHeight + 40) / canvas.height();
    scale = scale.x + ", " + scale.y;
    return canvas.css("-ms-transform-origin", "left top").css("-webkit-transform-origin", "left top").css("-moz-transform-origin", "left top").css("-o-transform-origin", "left top").css("transform-origin", "left top").css("-ms-transform", "scale(" + scale + ")").css("-webkit-transform", "scale3d(" + scale + ", 1)").css("-moz-transform", "scale(" + scale + ")").css("-o-transform", "scale(" + scale + ")").css("transform", "scale(" + scale + ")");
  };

  Ui.prototype.adjustCodeMirrorHeight = function() {
    return $(".CodeMirror-scroll").css("height", window.innerHeight - $("#theMenu").height());
  };

  Ui.prototype.fullscreenify = function(canvasId) {
    var _this = this;

    window.addEventListener("resize", (function() {
      _this.adjustCodeMirrorHeight();
      return _this.resizeCanvas(canvasId);
    }), false);
    return this.resizeCanvas(canvasId);
  };

  Ui.prototype.checkErrorAndReport = function(e) {
    var errorMessage;

    $("#errorMessageDiv").css("color", "red");
    errorMessage = e.message || e;
    if (errorMessage.indexOf("Unexpected 'INDENT'") > -1) {
      errorMessage = "weird indentation";
    } else if (errorMessage.indexOf("Unexpected 'TERMINATOR'") > -1) {
      errorMessage = "line not complete";
    } else if (errorMessage.indexOf("Unexpected 'CALL_END'") > -1) {
      errorMessage = "line not complete";
    } else if (errorMessage.indexOf("Unexpected '}'") > -1) {
      errorMessage = "something wrong";
    } else if (errorMessage.indexOf("Unexpected 'MATH'") > -1) {
      errorMessage = "weird arithmetic there";
    } else if (errorMessage.indexOf("Unexpected 'LOGIC'") > -1) {
      errorMessage = "odd expression thingy";
    } else if (errorMessage.indexOf("Unexpected 'NUMBER'") > -1) {
      errorMessage = "lost number?";
    } else if (errorMessage.indexOf("Unexpected 'NUMBER'") > -1) {
      errorMessage = "lost number?";
    } else {
      if (errorMessage.indexOf("ReferenceError") > -1) {
        errorMessage = errorMessage.replace(/ReferenceError:\s/g, "");
      }
    }
    return $("#errorMessageDiv").text(errorMessage);
  };

  Ui.prototype.clearError = function() {
    $("#errorMessageDiv").css("color", "#000000");
    return $("#errorMessageDiv").text("");
  };

  Ui.prototype.soundSystemOk = function() {
    return $("#soundSystemStatus").text("Sound System On").removeClass("off");
  };

  Ui.prototype.hideStatsWidget = function() {
    return $("#statsWidget").hide();
  };

  Ui.prototype.showStatsWidget = function() {
    return setTimeout("$(\"#statsWidget\").show()", 1);
  };

  Ui.prototype.setup = function() {
    var _this = this;

    return $(document).ready(function() {
      var a, allDemos, allTutorials, demo, demoSubmenu, demoSubmenuNoSpaces, demoSubmenus, eventRouter, submenuOfThisDemo, submenuOfThisTutorial, tutorial, tutorialSubmenu, tutorialSubmenuNoSpaces, tutorialSubmenus, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;

      eventRouter = _this.eventRouter;
      $('<span >LiveCodeLab</span>').appendTo($('<li>').appendTo($('#nav'))).click(function() {
        $("#aboutWindow").modal();
        $("#simplemodal-container").height(250);
        return false;
      });
      $('<span >Demos</span>').appendTo($('<li>').attr('id', 'demos').addClass('current').addClass('sf-parent').appendTo($('#nav')));
      $("<ul id='ulForDemos'></ul>").appendTo($('#demos'));
      allDemos = _this.programLoader.programs.demos;
      demoSubmenus = {};
      for (demo in allDemos) {
        submenuOfThisDemo = allDemos[demo].submenu;
        if ((_ref = demoSubmenus[submenuOfThisDemo]) == null) {
          demoSubmenus[submenuOfThisDemo] = [];
        }
        demoSubmenus[submenuOfThisDemo].push(demo);
      }
      for (demoSubmenu in demoSubmenus) {
        demoSubmenuNoSpaces = demoSubmenu.replace(" ", "_");
        $("<li></li>").appendTo($('#ulForDemos')).attr('id', 'hookforDemos' + demoSubmenuNoSpaces);
        $("<span>" + demoSubmenu + "</span>").appendTo($('#hookforDemos' + demoSubmenuNoSpaces));
        $("<ul id='" + demoSubmenuNoSpaces + "'></ul>").appendTo($('#hookforDemos' + demoSubmenuNoSpaces));
        _ref1 = demoSubmenus[demoSubmenu];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          demo = _ref1[_i];
          a = "<li><a id='" + demo + "'>" + _this.programLoader.programs.demos[demo].title + "</a></li>";
          $(a).appendTo($('#' + demoSubmenuNoSpaces));
        }
      }
      $('<span >Tutorials</span>').appendTo($('<li>').attr('id', 'tutorials').addClass('current').addClass('sf-parent').appendTo($('#nav')));
      $("<ul id='ulForTutorials'></ul>").appendTo($('#tutorials'));
      allTutorials = _this.programLoader.programs.tutorials;
      tutorialSubmenus = {};
      for (tutorial in allTutorials) {
        submenuOfThisTutorial = allTutorials[tutorial].submenu;
        if ((_ref2 = tutorialSubmenus[submenuOfThisTutorial]) == null) {
          tutorialSubmenus[submenuOfThisTutorial] = [];
        }
        tutorialSubmenus[submenuOfThisTutorial].push(tutorial);
      }
      for (tutorialSubmenu in tutorialSubmenus) {
        tutorialSubmenuNoSpaces = tutorialSubmenu.replace(" ", "_");
        $("<li></li>").appendTo($('#ulForTutorials')).attr('id', 'hookforTutorials' + tutorialSubmenuNoSpaces);
        $("<span>" + tutorialSubmenu + "</span>").appendTo($('#hookforTutorials' + tutorialSubmenuNoSpaces));
        $("<ul id='" + tutorialSubmenuNoSpaces + "'></ul>").appendTo($('#hookforTutorials' + tutorialSubmenuNoSpaces));
        _ref3 = tutorialSubmenus[tutorialSubmenu];
        for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
          tutorial = _ref3[_j];
          a = "<li><a id='" + tutorial + "'>" + _this.programLoader.programs.tutorials[tutorial].title + "</a></li>";
          $(a).appendTo($('#' + tutorialSubmenuNoSpaces));
        }
      }
      $('ul.sf-menu').sooperfish();
      $("#demos ul li a").click(function() {
        eventRouter.trigger("load-program", $(this).attr("id"));
        return false;
      });
      $("#tutorials li a").click(function() {
        eventRouter.trigger("load-program", $(this).attr("id"));
        return false;
      });
      $('<span >Autocode</span>').appendTo($('<li>').appendTo($('#nav'))).attr('id', 'autocodeIndicatorContainer');
      $("#autocodeIndicatorContainer").click(function() {
        eventRouter.trigger("toggle-autocoder");
        return false;
      });
      $('<span >Hide Code: on</span>').appendTo($('<li>').appendTo($('#nav'))).attr('id', 'dimCodeButtonContainer');
      $("#dimCodeButtonContainer").click(function() {
        eventRouter.trigger("editor-toggle-dim");
        return false;
      });
      $('<span >Reset</span>').appendTo($('<li>').appendTo($('#nav'))).click(function() {
        eventRouter.trigger("reset");
        $(_this).stop().fadeOut(100).fadeIn(100);
        return false;
      });
      $('<span id="errorMessageDiv">msg will go here</span>').appendTo($('<li>').appendTo($('#nav')));
      _this.stats.getDomElement().style.position = "absolute";
      _this.stats.getDomElement().style.right = "0px";
      _this.stats.getDomElement().style.top = "0px";
      document.body.appendChild(_this.stats.getDomElement());
      $("#startingCourtainScreen").fadeOut();
      $("#formCode").css("opacity", 0);
      _this.fullscreenify("#backGroundCanvas");
      return _this.adjustCodeMirrorHeight();
    });
  };

  return Ui;

})();

/*!
  * Bowser - a browser detector
  * https://github.com/ded/bowser
  * MIT License | (c) Dustin Diaz 2011
  */
var createBowser = function () {
  /**
    * navigator.userAgent =>
    * Chrome:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.57 Safari/534.24"
    * Opera:   "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.7; U; en) Presto/2.7.62 Version/11.01"
    * Safari:  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; en-us) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
    * IE:      "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/5.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)"
    * Firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0) Gecko/20100101 Firefox/4.0"
    * iPhone:  "Mozilla/5.0 (iPhone Simulator; U; CPU iPhone OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5"
    * iPad:    "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari/6533.18.5",
    * Android: "Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; T-Mobile G2 Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1"
    * Touchpad: "Mozilla/5.0 (hp-tabled;Linux;hpwOS/3.0.5; U; en-US)) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.83 Safari/534.6 TouchPad/1.0"
    * PhantomJS: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/534.34 (KHTML, like Gecko) PhantomJS/1.5.0 Safari/534.34"
    */

  var ua = navigator.userAgent
    , t = true
    , ie = /msie/i.test(ua)
    , chrome = /chrome/i.test(ua)
    , phantom = /phantom/i.test(ua)
    , safari = /safari/i.test(ua) && !chrome && !phantom
    , iphone = /iphone/i.test(ua)
    , ipad = /ipad/i.test(ua)
    , touchpad = /touchpad/i.test(ua)
    , android = /android/i.test(ua)
    , opera = /opera/i.test(ua)
    , firefox = /firefox/i.test(ua)
    , gecko = /gecko\//i.test(ua)
    , seamonkey = /seamonkey\//i.test(ua)
    , webkitVersion = /version\/(\d+(\.\d+)?)/i
    , o

  function detect() {

    if (ie) return {
        msie: t
      , version: ua.match(/msie (\d+(\.\d+)?);/i)[1]
    }
    if (chrome) return {
        webkit: t
      , chrome: t
      , version: ua.match(/chrome\/(\d+(\.\d+)?)/i)[1]
    }
    if (phantom) return {
        webkit: t
      , phantom: t
      , version: ua.match(/phantomjs\/(\d+(\.\d+)+)/i)[1]
    }
    if (touchpad) return {
        webkit: t
      , touchpad: t
      , version : ua.match(/touchpad\/(\d+(\.\d+)?)/i)[1]
    }
    if (iphone || ipad) {
      o = {
          webkit: t
        , mobile: t
        , ios: t
        , iphone: iphone
        , ipad: ipad
      }
      // WTF: version is not part of user agent in web apps
      if (webkitVersion.test(ua)) {
        o.version = ua.match(webkitVersion)[1]
      }
      return o
    }
    if (android) return {
        webkit: t
      , android: t
      , mobile: t
      , version: ua.match(webkitVersion)[1]
    }
    if (safari) return {
        webkit: t
      , safari: t
      , version: ua.match(webkitVersion)[1]
    }
    if (opera) return {
        opera: t
      , version: ua.match(webkitVersion)[1]
    }
    if (gecko) {
      o = {
          gecko: t
        , mozilla: t
        , version: ua.match(/firefox\/(\d+(\.\d+)?)/i)[1]
      }
      if (firefox) o.firefox = t
      return o
    }
    if (seamonkey) return {
        seamonkey: t
      , version: ua.match(/seamonkey\/(\d+(\.\d+)?)/i)[1]
    }
  }

  var bowser = detect()

  // Graded Browser Support
  // http://developer.yahoo.com/yui/articles/gbs
  if ((bowser.msie && bowser.version >= 7) ||
      (bowser.chrome && bowser.version >= 10) ||
      (bowser.firefox && bowser.version >= 4.0) ||
      (bowser.safari && bowser.version >= 5) ||
      (bowser.opera && bowser.version >= 10.0)) {
    bowser.a = t;
  }

  else if ((bowser.msie && bowser.version < 7) ||
      (bowser.chrome && bowser.version < 10) ||
      (bowser.firefox && bowser.version < 4.0) ||
      (bowser.safari && bowser.version < 5) ||
      (bowser.opera && bowser.version < 10.0)) {
    bowser.c = t
  } else bowser.x = t

  return bowser
}