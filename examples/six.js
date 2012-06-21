// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
// TODO: " u s e   s t r i c t ";

try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };

  Module['load'] = function(f) {
    globalEval(read(f));
  };

  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
} else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  Module['printErr'] = printErr;

  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }

  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
} else if (ENVIRONMENT_IS_WEB) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }

  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }

  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
} else if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...

  Module['load'] = importScripts;

} else {
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['printErr']) {
  Module['printErr'] = function(){};
}
if (!Module['print']) {
  Module['print'] = Module['printErr'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

  
// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  bitshift64: function (low, high, op, bits) {
    var ander = Math.pow(2, bits)-1;
    if (bits < 32) {
      switch (op) {
        case 'shl':
          return [low << bits, (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits))];
        case 'ashr':
          return [(((low >>> bits ) | ((high&ander) << (32 - bits))) >> 0) >>> 0, (high >> bits) >>> 0];
        case 'lshr':
          return [((low >>> bits) | ((high&ander) << (32 - bits))) >>> 0, high >>> bits];
      }
    } else if (bits == 32) {
      switch (op) {
        case 'shl':
          return [0, low];
        case 'ashr':
          return [high, (high|0) < 0 ? ander : 0];
        case 'lshr':
          return [high, 0];
      }
    } else { // bits > 32
      switch (op) {
        case 'shl':
          return [0, low << (bits - 32)];
        case 'ashr':
          return [(high >> (bits - 32)) >>> 0, (high|0) < 0 ? ander : 0];
        case 'lshr':
          return [high >>>  (bits - 32) , 0];
      }
    }
    abort('unknown bitshift64 op: ' + [value, op, bits]);
  },
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type[type.length-1] == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      assert(type.fields.length === struct.length, 'Number of named fields must match the type for ' + typeName);
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  addFunction: function (func) {
    var ret = FUNCTION_TABLE.length;
    FUNCTION_TABLE.push(func);
    FUNCTION_TABLE.push(0);
    return ret;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func) {
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        FUNCTION_TABLE[func].apply(null, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP += size;STACKTOP = ((((STACKTOP)+3)>>2)<<2);assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP += size;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>0)+(((high)>>>0)*4294967296)) : (((low)>>>0)+(((high)|0)*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



var CorrectionsMonitor = {
  MAX_ALLOWED: 0, // XXX
  corrections: 0,
  sigs: {},

  note: function(type, succeed, sig) {
    if (!succeed) {
      this.corrections++;
      if (this.corrections >= this.MAX_ALLOWED) abort('\n\nToo many corrections!');
    }
  },

  print: function() {
  }
};





//========================================
// Runtime essentials
//========================================

var __THREW__ = false; // Used in checking for thrown exceptions.

var ABORT = false;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;

function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Adding
//
//         __attribute__((used))
//
//       to the function definition will prevent that.
//
// Note: Closure optimizations will minify function names, making
//       functions no longer callable. If you run closure (on by default
//       in -O2 and above), you should export the functions you will call
//       by calling emcc with something like
//
//         -s EXPORTED_FUNCTIONS='["_func1","_func2"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  try {
    var func = eval('_' + ident);
  } catch(e) {
    try {
      func = globalScope['Module']['_' + ident]; // closure exported function
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
Module["ccall"] = ccall;

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  // TODO: optimize this, eval the whole function once instead of going through ccall each time
  return function() {
    return ccall(ident, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': HEAP32[((ptr)>>2)]=value; break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (tempDoubleF64[0]=value,HEAP32[((ptr)>>2)]=tempDoubleI32[0],HEAP32[(((ptr)+(4))>>2)]=tempDoubleI32[1]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (tempDoubleI32[0]=HEAP32[((ptr)>>2)],tempDoubleI32[1]=HEAP32[(((ptr)+(4))>>2)],tempDoubleF64[0]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

// Allocates memory for some data and initializes it properly.

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;

function allocate(slab, types, allocator) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));

  if (zeroinit) {
      _memset(ret, 0, size);
      return ret;
  }
  
  var i = 0, type;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);
    i += Runtime.getNativeTypeSize(type);
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  var nullTerminated = typeof(length) == "undefined";
  var ret = "";
  var i = 0;
  var t;
  var nullByte = String.fromCharCode(0);
  while (1) {
    t = String.fromCharCode(HEAPU8[((ptr)+(i))]);
    if (nullTerminated && t == nullByte) { break; } else {}
    ret += t;
    i += 1;
    if (!nullTerminated && i == length) { break; }
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var FUNCTION_TABLE; // XXX: In theory the indexes here can be equal to pointers to stacked or malloced memory. Such comparisons should
                    //      be false, but can turn out true. We should probably set the top bit to prevent such issues.

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and STATICTOP is the new top.
  Module.printErr('Warning: Enlarging memory arrays, this is not fast! ' + [STATICTOP, TOTAL_MEMORY]);
  assert(STATICTOP >= TOTAL_MEMORY);
  assert(TOTAL_MEMORY > 4); // So the loop below will not be infinite
  while (TOTAL_MEMORY <= STATICTOP) { // Simple heuristic. Override enlargeMemory() if your program has something more optimal for it
    TOTAL_MEMORY = alignMemoryPage(2*TOTAL_MEMORY);
  }
  var oldHEAP8 = HEAP8;
  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(buffer);
  HEAP16 = new Int16Array(buffer);
  HEAP32 = new Int32Array(buffer);
  HEAPU8 = new Uint8Array(buffer);
  HEAPU16 = new Uint16Array(buffer);
  HEAPU32 = new Uint32Array(buffer);
  HEAPF32 = new Float32Array(buffer);
  HEAPF64 = new Float64Array(buffer);
  HEAP8.set(oldHEAP8);
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 10485760;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
  assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
         'Cannot fallback to non-typed array case: Code is too specialized');

  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  HEAP8 = new Int8Array(buffer);
  HEAP16 = new Int16Array(buffer);
  HEAP32 = new Int32Array(buffer);
  HEAPU8 = new Uint8Array(buffer);
  HEAPU16 = new Uint16Array(buffer);
  HEAPU32 = new Uint32Array(buffer);
  HEAPF32 = new Float32Array(buffer);
  HEAPF64 = new Float64Array(buffer);

  // Endianness check (note: assumes compiler arch was little-endian)
  HEAP32[0] = 255;
  assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

var base = intArrayFromString('(null)'); // So printing %s of NULL gives '(null)'
                                         // Also this ensures we leave 0 as an invalid address, 'NULL'
STATICTOP = base.length;
for (var i = 0; i < base.length; i++) {
  HEAP8[(i)]=base[i]
}

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

STACK_ROOT = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_ROOT + TOTAL_STACK;

var tempDoublePtr = Runtime.alignMemory(STACK_MAX, 8);
var tempDoubleI8  = HEAP8.subarray(tempDoublePtr);
var tempDoubleI32 = HEAP32.subarray(tempDoublePtr >> 2);
var tempDoubleF32 = HEAPF32.subarray(tempDoublePtr >> 2);
var tempDoubleF64 = HEAPF64.subarray(tempDoublePtr >> 3);
function copyTempFloat(ptr) { // functions, because inlining this code is increases code size too much
  tempDoubleI8[0] = HEAP8[ptr];
  tempDoubleI8[1] = HEAP8[ptr+1];
  tempDoubleI8[2] = HEAP8[ptr+2];
  tempDoubleI8[3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  tempDoubleI8[0] = HEAP8[ptr];
  tempDoubleI8[1] = HEAP8[ptr+1];
  tempDoubleI8[2] = HEAP8[ptr+2];
  tempDoubleI8[3] = HEAP8[ptr+3];
  tempDoubleI8[4] = HEAP8[ptr+4];
  tempDoubleI8[5] = HEAP8[ptr+5];
  tempDoubleI8[6] = HEAP8[ptr+6];
  tempDoubleI8[7] = HEAP8[ptr+7];
}
STACK_MAX = tempDoublePtr + 8;

STATICTOP = alignMemoryPage(STACK_MAX);

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      func = FUNCTION_TABLE[func];
    }
    func(callback.arg === undefined ? null : callback.arg);
  }
}

var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown

function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);

  // Print summary of correction activity
  CorrectionsMonitor.print();
}

function String_len(ptr) {
  var i = 0;
  while (HEAP8[((ptr)+(i))]) i++; // Note: should be |!= 0|, technically. But this helps catch bugs with undefineds
  return i;
}
Module['String_len'] = String_len;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = [];
  var t;
  var i = 0;
  if (length === undefined) {
    length = stringy.length;
  }
  while (i < length) {
    var chr = stringy.charCodeAt(i);
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + stringy[i] + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(chr);
    i = i + 1;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var i = 0;
  while (i < string.length) {
    var chr = string.charCodeAt(i);
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + string[i] + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    HEAP8[((buffer)+(i))]=chr
    i = i + 1;
  }
  if (!dontAddNull) {
    HEAP8[((buffer)+(i))]=0
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer)+(i))]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

var STRING_TABLE = [];

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
  // TODO: clean up previous line
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
function addRunDependency() {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
function removeRunDependency() {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) run();
}

// === Body ===




function _f__icvt($value, $ndigit, $sign, $base) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $value_addr;
      var $ndigit_addr;
      var $sign_addr;
      var $base_addr;
      var $i;
      var $uvalue;
      $value_addr=$value;
      $ndigit_addr=$ndigit;
      $sign_addr=$sign;
      $base_addr=$base;
      var $0=$value_addr; //@line 26 "fmtlib.c"
      var $cmp=(($0)|0) > 0; //@line 26 "fmtlib.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 26 "fmtlib.c"
    case 3: 
      var $1=$value_addr; //@line 27 "fmtlib.c"
      $uvalue=$1; //@line 27 "fmtlib.c"
      var $2=$sign_addr; //@line 28 "fmtlib.c"
      HEAP32[(($2)>>2)]=0; //@line 28 "fmtlib.c"
      __label__ = 8; break; //@line 29 "fmtlib.c"
    case 4: 
      var $3=$value_addr; //@line 30 "fmtlib.c"
      var $cmp1=(($3)|0) < 0; //@line 30 "fmtlib.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 30 "fmtlib.c"
    case 5: 
      var $4=$value_addr; //@line 31 "fmtlib.c"
      var $sub=(((-$4))|0); //@line 31 "fmtlib.c"
      $uvalue=$sub; //@line 31 "fmtlib.c"
      var $5=$sign_addr; //@line 32 "fmtlib.c"
      HEAP32[(($5)>>2)]=1; //@line 32 "fmtlib.c"
      __label__ = 7; break; //@line 33 "fmtlib.c"
    case 6: 
      var $6=$sign_addr; //@line 35 "fmtlib.c"
      HEAP32[(($6)>>2)]=0; //@line 35 "fmtlib.c"
      var $7=$ndigit_addr; //@line 36 "fmtlib.c"
      HEAP32[(($7)>>2)]=1; //@line 36 "fmtlib.c"
      HEAP8[(((_f__icvt_buf+22)|0))]=48; //@line 37 "fmtlib.c"
      $retval=((_f__icvt_buf+22)|0); //@line 38 "fmtlib.c"
      __label__ = 12; break; //@line 38 "fmtlib.c"
    case 7: 
      __label__ = 8; break;
    case 8: 
      $i=23; //@line 40 "fmtlib.c"
      __label__ = 9; break; //@line 41 "fmtlib.c"
    case 9: 
      var $8=$uvalue; //@line 42 "fmtlib.c"
      var $9=$base_addr; //@line 42 "fmtlib.c"
      var $rem=((($8)>>>0))%((($9)>>>0)); //@line 42 "fmtlib.c"
      var $add=((($rem)+(48))|0); //@line 42 "fmtlib.c"
      var $conv=(($add) & 255); //@line 42 "fmtlib.c"
      var $10=$i; //@line 42 "fmtlib.c"
      var $dec=((($10)-(1))|0); //@line 42 "fmtlib.c"
      $i=$dec; //@line 42 "fmtlib.c"
      var $arrayidx=((_f__icvt_buf+$dec)|0); //@line 42 "fmtlib.c"
      HEAP8[($arrayidx)]=$conv; //@line 42 "fmtlib.c"
      var $11=$base_addr; //@line 43 "fmtlib.c"
      var $12=$uvalue; //@line 43 "fmtlib.c"
      var $div=Math.floor(((($12)>>>0))/((($11)>>>0))); //@line 43 "fmtlib.c"
      $uvalue=$div; //@line 43 "fmtlib.c"
      __label__ = 10; break; //@line 44 "fmtlib.c"
    case 10: 
      var $13=$uvalue; //@line 44 "fmtlib.c"
      var $cmp5=(($13)>>>0) > 0; //@line 44 "fmtlib.c"
      if ($cmp5) { __label__ = 9; break; } else { __label__ = 11; break; } //@line 44 "fmtlib.c"
    case 11: 
      var $14=$i; //@line 46 "fmtlib.c"
      var $sub7=(((23)-($14))|0); //@line 46 "fmtlib.c"
      var $15=$ndigit_addr; //@line 46 "fmtlib.c"
      HEAP32[(($15)>>2)]=$sub7; //@line 46 "fmtlib.c"
      var $16=$i; //@line 47 "fmtlib.c"
      var $arrayidx8=((_f__icvt_buf+$16)|0); //@line 47 "fmtlib.c"
      $retval=$arrayidx8; //@line 47 "fmtlib.c"
      __label__ = 12; break; //@line 47 "fmtlib.c"
    case 12: 
      var $17=$retval; //@line 48 "fmtlib.c"
      ;
      return $17; //@line 48 "fmtlib.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_f__icvt["X"]=1;

function _MAIN__() {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      HEAP32[((_MAIN___i__)>>2)]=0;
      __label__ = 3; break;
    case 3: 
      var $0=HEAP32[((_MAIN___i__)>>2)];
      var $cmp=(($0)|0) <= 24;
      if ($cmp) { __label__ = 4; break; } else { __label__ = 6; break; }
    case 4: 
      var $1=HEAP32[((_MAIN___i__)>>2)];
      var $mul=((($1)*(3600))|0);
      HEAP32[((_MAIN___second)>>2)]=$mul;
      var $call=_s_wsle(_MAIN___io___3);
      var $call1=_do_lio(_c__9, _c__1, ((STRING_TABLE.__str)|0), 7);
      var $call2=_do_lio(_c__3, _c__1, _MAIN___i__, 4);
      var $call3=_do_lio(_c__9, _c__1, ((STRING_TABLE.__str1)|0), 11);
      var $call4=_do_lio(_c__3, _c__1, _MAIN___second, 4);
      var $call5=_e_wsle();
      __label__ = 5; break;
    case 5: 
      var $2=HEAP32[((_MAIN___i__)>>2)];
      var $inc=((($2)+(1))|0);
      HEAP32[((_MAIN___i__)>>2)]=$inc;
      __label__ = 3; break;
    case 6: 
      var $call6=_s_stop(((__str2)|0), 0);
      ;
      return 0;
    default: assert(0, "bad label: " + __label__);
  }
}


function _f_clos($a) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $a_addr;
      var $b;
      $a_addr=$a;
      var $0=$a_addr; //@line 34 "close.c"
      var $cunit=(($0+4)|0); //@line 34 "close.c"
      var $1=HEAP32[(($cunit)>>2)]; //@line 34 "close.c"
      var $cmp=(($1)|0) >= 100; //@line 34 "close.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 34 "close.c"
    case 3: 
      $retval=0; //@line 34 "close.c"
      __label__ = 24; break; //@line 34 "close.c"
    case 4: 
      var $2=$a_addr; //@line 35 "close.c"
      var $cunit1=(($2+4)|0); //@line 35 "close.c"
      var $3=HEAP32[(($cunit1)>>2)]; //@line 35 "close.c"
      var $arrayidx=((_f__units+($3)*(48))|0); //@line 35 "close.c"
      $b=$arrayidx; //@line 35 "close.c"
      var $4=$b; //@line 36 "close.c"
      var $ufd=(($4)|0); //@line 36 "close.c"
      var $5=HEAP32[(($ufd)>>2)]; //@line 36 "close.c"
      var $cmp2=(($5)|0)==0; //@line 36 "close.c"
      if ($cmp2) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 36 "close.c"
    case 5: 
      __label__ = 23; break; //@line 37 "close.c"
    case 6: 
      var $6=$b; //@line 38 "close.c"
      var $uscrtch=(($6+44)|0); //@line 38 "close.c"
      var $7=HEAP32[(($uscrtch)>>2)]; //@line 38 "close.c"
      var $cmp5=(($7)|0)==1; //@line 38 "close.c"
      if ($cmp5) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 38 "close.c"
    case 7: 
      __label__ = 19; break; //@line 39 "close.c"
    case 8: 
      var $8=$a_addr; //@line 40 "close.c"
      var $csta=(($8+8)|0); //@line 40 "close.c"
      var $9=HEAP32[(($csta)>>2)]; //@line 40 "close.c"
      var $tobool=(($9)|0)!=0; //@line 40 "close.c"
      if ($tobool) { __label__ = 10; break; } else { __label__ = 9; break; } //@line 40 "close.c"
    case 9: 
      __label__ = 12; break; //@line 41 "close.c"
    case 10: 
      var $10=$a_addr; //@line 42 "close.c"
      var $csta10=(($10+8)|0); //@line 42 "close.c"
      var $11=HEAP32[(($csta10)>>2)]; //@line 42 "close.c"
      var $12=HEAP8[($11)]; //@line 42 "close.c"
      var $conv=(($12 << 24) >> 24); //@line 42 "close.c"
      if ((($conv)|0) == 107 || (($conv)|0) == 75) {
        __label__ = 13; break;
      }
      else if ((($conv)|0) == 100 || (($conv)|0) == 68) {
        __label__ = 18; break;
      }
      else {
      __label__ = 11; break;
      }
      
    case 11: 
      __label__ = 12; break; //@line 42 "close.c"
    case 12: 
      __label__ = 13; break; //@line 42 "close.c"
    case 13: 
      var $13=$b; //@line 47 "close.c"
      var $uwrt=(($13+40)|0); //@line 47 "close.c"
      var $14=HEAP32[(($uwrt)>>2)]; //@line 47 "close.c"
      var $cmp11=(($14)|0)==1; //@line 47 "close.c"
      if ($cmp11) { __label__ = 14; break; } else { __label__ = 15; break; } //@line 47 "close.c"
    case 14: 
      var $15=$a_addr; //@line 48 "close.c"
      var $16=$15; //@line 48 "close.c"
      var $call=_t_runc($16); //@line 48 "close.c"
      __label__ = 15; break; //@line 48 "close.c"
    case 15: 
      var $17=$b; //@line 49 "close.c"
      var $ufnm=(($17+4)|0); //@line 49 "close.c"
      var $18=HEAP32[(($ufnm)>>2)]; //@line 49 "close.c"
      var $tobool15=(($18)|0)!=0; //@line 49 "close.c"
      if ($tobool15) { __label__ = 16; break; } else { __label__ = 17; break; } //@line 49 "close.c"
    case 16: 
      var $19=$b; //@line 50 "close.c"
      var $ufd17=(($19)|0); //@line 50 "close.c"
      var $20=HEAP32[(($ufd17)>>2)]; //@line 50 "close.c"
      var $call18=_fclose($20); //@line 50 "close.c"
      var $21=$b; //@line 51 "close.c"
      var $ufnm19=(($21+4)|0); //@line 51 "close.c"
      var $22=HEAP32[(($ufnm19)>>2)]; //@line 51 "close.c"
      _free($22); //@line 51 "close.c"
      __label__ = 17; break; //@line 52 "close.c"
    case 17: 
      __label__ = 22; break; //@line 53 "close.c"
    case 18: 
      __label__ = 19; break; //@line 53 "close.c"
    case 19: 
      var $23=$b; //@line 57 "close.c"
      var $ufd22=(($23)|0); //@line 57 "close.c"
      var $24=HEAP32[(($ufd22)>>2)]; //@line 57 "close.c"
      var $call23=_fclose($24); //@line 57 "close.c"
      var $25=$b; //@line 58 "close.c"
      var $ufnm24=(($25+4)|0); //@line 58 "close.c"
      var $26=HEAP32[(($ufnm24)>>2)]; //@line 58 "close.c"
      var $tobool25=(($26)|0)!=0; //@line 58 "close.c"
      if ($tobool25) { __label__ = 20; break; } else { __label__ = 21; break; } //@line 58 "close.c"
    case 20: 
      var $27=$b; //@line 59 "close.c"
      var $ufnm27=(($27+4)|0); //@line 59 "close.c"
      var $28=HEAP32[(($ufnm27)>>2)]; //@line 59 "close.c"
      var $call28=_remove($28); //@line 59 "close.c"
      var $29=$b; //@line 60 "close.c"
      var $ufnm29=(($29+4)|0); //@line 60 "close.c"
      var $30=HEAP32[(($ufnm29)>>2)]; //@line 60 "close.c"
      _free($30); //@line 60 "close.c"
      __label__ = 21; break; //@line 61 "close.c"
    case 21: 
      __label__ = 22; break; //@line 62 "close.c"
    case 22: 
      var $31=$b; //@line 63 "close.c"
      var $ufd31=(($31)|0); //@line 63 "close.c"
      HEAP32[(($ufd31)>>2)]=0; //@line 63 "close.c"
      __label__ = 23; break; //@line 63 "close.c"
    case 23: 
      var $32=$b; //@line 65 "close.c"
      var $uend=(($32+36)|0); //@line 65 "close.c"
      HEAP32[(($uend)>>2)]=0; //@line 65 "close.c"
      var $33=$b; //@line 66 "close.c"
      var $ufnm32=(($33+4)|0); //@line 66 "close.c"
      HEAP32[(($ufnm32)>>2)]=0; //@line 66 "close.c"
      $retval=0; //@line 67 "close.c"
      __label__ = 24; break; //@line 67 "close.c"
    case 24: 
      var $34=$retval; //@line 68 "close.c"
      ;
      return $34; //@line 68 "close.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_f_clos["X"]=1;

function _f_exit() {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $i;
      var $0=HEAP32[((((_f_exit_xx)|0))>>2)]; //@line 77 "close.c"
      var $tobool=(($0)|0)!=0; //@line 77 "close.c"
      if ($tobool) { __label__ = 8; break; } else { __label__ = 3; break; } //@line 77 "close.c"
    case 3: 
      HEAP32[((((_f_exit_xx)|0))>>2)]=1; //@line 78 "close.c"
      HEAP32[((((_f_exit_xx+8)|0))>>2)]=0; //@line 79 "close.c"
      $i=0; //@line 80 "close.c"
      __label__ = 4; break; //@line 80 "close.c"
    case 4: 
      var $1=$i; //@line 80 "close.c"
      var $cmp=(($1)|0) < 100; //@line 80 "close.c"
      if ($cmp) { __label__ = 5; break; } else { __label__ = 7; break; } //@line 80 "close.c"
    case 5: 
      var $2=$i; //@line 82 "close.c"
      HEAP32[((((_f_exit_xx+4)|0))>>2)]=$2; //@line 82 "close.c"
      var $call=_f_clos(_f_exit_xx); //@line 83 "close.c"
      __label__ = 6; break; //@line 84 "close.c"
    case 6: 
      var $3=$i; //@line 80 "close.c"
      var $inc=((($3)+(1))|0); //@line 80 "close.c"
      $i=$inc; //@line 80 "close.c"
      __label__ = 4; break; //@line 80 "close.c"
    case 7: 
      __label__ = 8; break; //@line 85 "close.c"
    case 8: 
      ;
      return; //@line 86 "close.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _do_lio($type, $number, $ptr, $len) {
  ;
  var __label__;

  var $type_addr;
  var $number_addr;
  var $ptr_addr;
  var $len_addr;
  $type_addr=$type;
  $number_addr=$number;
  $ptr_addr=$ptr;
  $len_addr=$len;
  var $0=HEAP32[((_f__lioproc)>>2)]; //@line 19 "dolio.c"
  var $1=$number_addr; //@line 19 "dolio.c"
  var $2=$ptr_addr; //@line 19 "dolio.c"
  var $3=$len_addr; //@line 19 "dolio.c"
  var $4=$type_addr; //@line 19 "dolio.c"
  var $5=HEAP32[(($4)>>2)]; //@line 19 "dolio.c"
  var $call=FUNCTION_TABLE[$0]($1, $2, $3, $5); //@line 19 "dolio.c"
  ;
  return $call; //@line 19 "dolio.c"
}


function _t_runc($a) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $a_addr;
      var $loc;
      var $len;
      var $b;
      var $rc;
      var $bf;
      $a_addr=$a;
      var $0=$a_addr; //@line 90 "endfile.c"
      var $aunit=(($0+4)|0); //@line 90 "endfile.c"
      var $1=HEAP32[(($aunit)>>2)]; //@line 90 "endfile.c"
      var $arrayidx=((_f__units+($1)*(48))|0); //@line 90 "endfile.c"
      $b=$arrayidx; //@line 90 "endfile.c"
      var $2=$b; //@line 91 "endfile.c"
      var $url=(($2+16)|0); //@line 91 "endfile.c"
      var $3=HEAP32[(($url)>>2)]; //@line 91 "endfile.c"
      var $tobool=(($3)|0)!=0; //@line 91 "endfile.c"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 91 "endfile.c"
    case 3: 
      $retval=0; //@line 92 "endfile.c"
      __label__ = 15; break; //@line 92 "endfile.c"
    case 4: 
      var $4=$b; //@line 93 "endfile.c"
      var $ufd=(($4)|0); //@line 93 "endfile.c"
      var $5=HEAP32[(($ufd)>>2)]; //@line 93 "endfile.c"
      $bf=$5; //@line 93 "endfile.c"
      var $call=_ftell($5); //@line 93 "endfile.c"
      $loc=$call; //@line 93 "endfile.c"
      var $6=$bf; //@line 94 "endfile.c"
      var $call1=_fseek($6, 0, 2); //@line 94 "endfile.c"
      var $7=$bf; //@line 95 "endfile.c"
      var $call2=_ftell($7); //@line 95 "endfile.c"
      $len=$call2; //@line 95 "endfile.c"
      var $8=$loc; //@line 96 "endfile.c"
      var $9=$len; //@line 96 "endfile.c"
      var $cmp=(($8)|0) >= (($9)|0); //@line 96 "endfile.c"
      if ($cmp) { __label__ = 6; break; } else { __label__ = 5; break; } //@line 96 "endfile.c"
    case 5: 
      var $10=$b; //@line 96 "endfile.c"
      var $useek=(($10+20)|0); //@line 96 "endfile.c"
      var $11=HEAP32[(($useek)>>2)]; //@line 96 "endfile.c"
      var $cmp3=(($11)|0)==0; //@line 96 "endfile.c"
      if ($cmp3) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 96 "endfile.c"
    case 6: 
      $retval=0; //@line 97 "endfile.c"
      __label__ = 15; break; //@line 97 "endfile.c"
    case 7: 
      var $12=$b; //@line 144 "endfile.c"
      var $urw=(($12+28)|0); //@line 144 "endfile.c"
      var $13=HEAP32[(($urw)>>2)]; //@line 144 "endfile.c"
      var $and=$13 & 2; //@line 144 "endfile.c"
      var $tobool6=(($and)|0)!=0; //@line 144 "endfile.c"
      if ($tobool6) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 144 "endfile.c"
    case 8: 
      var $14=$b; //@line 145 "endfile.c"
      var $ufd8=(($14)|0); //@line 145 "endfile.c"
      var $15=HEAP32[(($ufd8)>>2)]; //@line 145 "endfile.c"
      var $call9=_fflush($15); //@line 145 "endfile.c"
      __label__ = 9; break; //@line 145 "endfile.c"
    case 9: 
      var $16=$b; //@line 149 "endfile.c"
      var $ufd11=(($16)|0); //@line 149 "endfile.c"
      var $17=HEAP32[(($ufd11)>>2)]; //@line 149 "endfile.c"
      var $call12=_fileno($17); //@line 149 "endfile.c"
      var $18=$loc; //@line 149 "endfile.c"
      var $call13=_ftruncate($call12, $18); //@line 149 "endfile.c"
      $rc=$call13; //@line 149 "endfile.c"
      var $19=$b; //@line 152 "endfile.c"
      var $ufd14=(($19)|0); //@line 152 "endfile.c"
      var $20=HEAP32[(($ufd14)>>2)]; //@line 152 "endfile.c"
      var $call15=_fseek($20, 0, 2); //@line 152 "endfile.c"
      var $21=$rc; //@line 154 "endfile.c"
      var $tobool16=(($21)|0)!=0; //@line 154 "endfile.c"
      if ($tobool16) { __label__ = 10; break; } else { __label__ = 14; break; } //@line 154 "endfile.c"
    case 10: 
      var $22=$a_addr; //@line 155 "endfile.c"
      var $aerr=(($22)|0); //@line 155 "endfile.c"
      var $23=HEAP32[(($aerr)>>2)]; //@line 155 "endfile.c"
      var $tobool18=(($23)|0)!=0; //@line 155 "endfile.c"
      if ($tobool18) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 155 "endfile.c"
    case 11: 
      var $call20=___errno(); //@line 155 "endfile.c"
      HEAP32[(($call20)>>2)]=111; //@line 155 "endfile.c"
      __label__ = 13; break; //@line 155 "endfile.c"
    case 12: 
      _f__fatal(111, ((STRING_TABLE.__str21)|0)); //@line 155 "endfile.c"
      __label__ = 13; break;
    case 13: 
      $retval=111; //@line 155 "endfile.c"
      __label__ = 15; break; //@line 155 "endfile.c"
    case 14: 
      $retval=0; //@line 156 "endfile.c"
      __label__ = 15; break; //@line 156 "endfile.c"
    case 15: 
      var $24=$retval; //@line 157 "endfile.c"
      ;
      return $24; //@line 157 "endfile.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_t_runc["X"]=1;

function _f__canseek($f) {
  ;
  var __label__;

  var $f_addr;
  $f_addr=$f;
  var $0=$f_addr; //@line 103 "err.c"
  var $call=_fileno($0); //@line 103 "err.c"
  var $call1=_isatty($call); //@line 103 "err.c"
  var $tobool=(($call1)|0)!=0; //@line 103 "err.c"
  var $lnot=$tobool ^ 1; //@line 103 "err.c"
  var $lnot_ext=(($lnot)&1); //@line 103 "err.c"
  ;
  return $lnot_ext; //@line 103 "err.c"
}


function _f__fatal($n, $s) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $n_addr;
      var $s_addr;
      $n_addr=$n;
      $s_addr=$s;
      var $0=$n_addr; //@line 157 "err.c"
      var $cmp=(($0)|0) < 100; //@line 157 "err.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 5; break; } //@line 157 "err.c"
    case 3: 
      var $1=$n_addr; //@line 157 "err.c"
      var $cmp1=(($1)|0) >= 0; //@line 157 "err.c"
      if ($cmp1) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 157 "err.c"
    case 4: 
      var $2=$s_addr; //@line 157 "err.c"
      _perror($2); //@line 157 "err.c"
      __label__ = 13; break; //@line 157 "err.c"
    case 5: 
      var $3=$n_addr; //@line 158 "err.c"
      var $cmp2=(($3)|0) >= 132; //@line 158 "err.c"
      if ($cmp2) { __label__ = 7; break; } else { __label__ = 6; break; } //@line 158 "err.c"
    case 6: 
      var $4=$n_addr; //@line 158 "err.c"
      var $cmp3=(($4)|0) < -1; //@line 158 "err.c"
      if ($cmp3) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 158 "err.c"
    case 7: 
      var $5=HEAP32[((_stderr)>>2)]; //@line 159 "err.c"
      var $6=$s_addr; //@line 159 "err.c"
      var $7=$n_addr; //@line 159 "err.c"
      var $call=_fprintf($5, ((STRING_TABLE.__str31)|0), (tempInt=STACKTOP,STACKTOP += 8,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$6,HEAP32[(((tempInt)+(4))>>2)]=$7,tempInt)); //@line 159 "err.c"
      __label__ = 12; break; //@line 160 "err.c"
    case 8: 
      var $8=$n_addr; //@line 161 "err.c"
      var $cmp6=(($8)|0)==-1; //@line 161 "err.c"
      if ($cmp6) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 161 "err.c"
    case 9: 
      var $9=HEAP32[((_stderr)>>2)]; //@line 161 "err.c"
      var $10=$s_addr; //@line 161 "err.c"
      var $call8=_fprintf($9, ((STRING_TABLE.__str32)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$10,tempInt)); //@line 161 "err.c"
      __label__ = 11; break; //@line 161 "err.c"
    case 10: 
      var $11=HEAP32[((_stderr)>>2)]; //@line 163 "err.c"
      var $12=$s_addr; //@line 163 "err.c"
      var $13=$n_addr; //@line 163 "err.c"
      var $sub=((($13)-(100))|0); //@line 163 "err.c"
      var $arrayidx=((_F_err+($sub<<2))|0); //@line 163 "err.c"
      var $14=HEAP32[(($arrayidx)>>2)]; //@line 163 "err.c"
      var $call10=_fprintf($11, ((STRING_TABLE.__str33)|0), (tempInt=STACKTOP,STACKTOP += 8,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$12,HEAP32[(((tempInt)+(4))>>2)]=$14,tempInt)); //@line 163 "err.c"
      __label__ = 11; break;
    case 11: 
      __label__ = 12; break;
    case 12: 
      __label__ = 13; break;
    case 13: 
      var $15=HEAP32[((_f__curunit)>>2)]; //@line 164 "err.c"
      var $tobool=(($15)|0)!=0; //@line 164 "err.c"
      if ($tobool) { __label__ = 14; break; } else { __label__ = 15; break; } //@line 164 "err.c"
    case 14: 
      var $16=HEAP32[((_stderr)>>2)]; //@line 165 "err.c"
      var $17=HEAP32[((_f__curunit)>>2)]; //@line 165 "err.c"
      var $sub_ptr_lhs_cast=$17; //@line 165 "err.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-(_f__units))|0); //@line 165 "err.c"
      var $sub_ptr_div=((((($sub_ptr_sub)|0))/(48))&-1); //@line 165 "err.c"
      var $call14=_fprintf($16, ((STRING_TABLE.__str34)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$sub_ptr_div,tempInt)); //@line 165 "err.c"
      var $18=HEAP32[((_stderr)>>2)]; //@line 167 "err.c"
      var $19=HEAP32[((_f__curunit)>>2)]; //@line 167 "err.c"
      var $ufnm=(($19+4)|0); //@line 167 "err.c"
      var $20=HEAP32[(($ufnm)>>2)]; //@line 167 "err.c"
      var $tobool15=(($20)|0)!=0; //@line 167 "err.c"
      var $cond=$tobool15 ? (((STRING_TABLE.__str35)|0)) : (((STRING_TABLE.__str36)|0)); //@line 167 "err.c"
      var $21=HEAP32[((_f__curunit)>>2)]; //@line 167 "err.c"
      var $ufnm16=(($21+4)|0); //@line 167 "err.c"
      var $22=HEAP32[(($ufnm16)>>2)]; //@line 167 "err.c"
      var $call17=_fprintf($18, $cond, (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$22,tempInt)); //@line 167 "err.c"
      __label__ = 16; break; //@line 169 "err.c"
    case 15: 
      var $23=HEAP32[((_stderr)>>2)]; //@line 171 "err.c"
      var $call19=_fprintf($23, ((STRING_TABLE.__str37)|0), (tempInt=STACKTOP,STACKTOP += 1,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=0,tempInt)); //@line 171 "err.c"
      __label__ = 16; break;
    case 16: 
      var $24=HEAP32[((_f__fmtbuf)>>2)]; //@line 172 "err.c"
      var $tobool21=(($24)|0)!=0; //@line 172 "err.c"
      if ($tobool21) { __label__ = 17; break; } else { __label__ = 18; break; } //@line 172 "err.c"
    case 17: 
      var $25=HEAP32[((_stderr)>>2)]; //@line 173 "err.c"
      var $26=HEAP32[((_f__fmtbuf)>>2)]; //@line 173 "err.c"
      var $call23=_fprintf($25, ((STRING_TABLE.__str38)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$26,tempInt)); //@line 173 "err.c"
      __label__ = 18; break; //@line 173 "err.c"
    case 18: 
      var $27=HEAP32[((_stderr)>>2)]; //@line 174 "err.c"
      var $28=HEAP32[((_f__reading)>>2)]; //@line 174 "err.c"
      var $tobool25=(($28)|0)!=0; //@line 174 "err.c"
      var $cond26=$tobool25 ? (((STRING_TABLE.__str40)|0)) : (((STRING_TABLE.__str41)|0)); //@line 174 "err.c"
      var $29=HEAP32[((_f__sequential)>>2)]; //@line 174 "err.c"
      var $tobool27=(($29)|0)!=0; //@line 174 "err.c"
      var $cond28=$tobool27 ? (((STRING_TABLE.__str42)|0)) : (((STRING_TABLE.__str43)|0)); //@line 174 "err.c"
      var $30=HEAP32[((_f__formatted)>>2)]; //@line 174 "err.c"
      var $tobool29=(($30)|0)!=0; //@line 174 "err.c"
      var $cond30=$tobool29 ? (((STRING_TABLE.__str44)|0)) : (((STRING_TABLE.__str45)|0)); //@line 174 "err.c"
      var $31=HEAP32[((_f__external)>>2)]; //@line 174 "err.c"
      var $tobool31=(($31)|0)!=0; //@line 174 "err.c"
      var $cond32=$tobool31 ? (((STRING_TABLE.__str46)|0)) : (((STRING_TABLE.__str47)|0)); //@line 174 "err.c"
      var $call33=_fprintf($27, ((STRING_TABLE.__str39)|0), (tempInt=STACKTOP,STACKTOP += 16,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$cond26,HEAP32[(((tempInt)+(4))>>2)]=$cond28,HEAP32[(((tempInt)+(8))>>2)]=$cond30,HEAP32[(((tempInt)+(12))>>2)]=$cond32,tempInt)); //@line 174 "err.c"
      _sig_die(((STRING_TABLE.__str48)|0), 1); //@line 177 "err.c"
      ;
      return; //@line 178 "err.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_f__fatal["X"]=1;

function _f_init() {
  ;
  var __label__;

  var $p;
  HEAP32[((_f__init)>>2)]=1; //@line 184 "err.c"
  $p=((_f__units)|0); //@line 185 "err.c"
  var $0=HEAP32[((_stderr)>>2)]; //@line 186 "err.c"
  var $1=$p; //@line 186 "err.c"
  var $ufd=(($1)|0); //@line 186 "err.c"
  HEAP32[(($ufd)>>2)]=$0; //@line 186 "err.c"
  var $2=HEAP32[((_stderr)>>2)]; //@line 187 "err.c"
  var $call=_f__canseek($2); //@line 187 "err.c"
  var $3=$p; //@line 187 "err.c"
  var $useek=(($3+20)|0); //@line 187 "err.c"
  HEAP32[(($useek)>>2)]=$call; //@line 187 "err.c"
  var $4=$p; //@line 188 "err.c"
  var $ufmt=(($4+24)|0); //@line 188 "err.c"
  HEAP32[(($ufmt)>>2)]=1; //@line 188 "err.c"
  var $5=$p; //@line 189 "err.c"
  var $uwrt=(($5+40)|0); //@line 189 "err.c"
  HEAP32[(($uwrt)>>2)]=1; //@line 189 "err.c"
  $p=((_f__units+240)|0); //@line 190 "err.c"
  var $6=HEAP32[((_stdin)>>2)]; //@line 191 "err.c"
  var $7=$p; //@line 191 "err.c"
  var $ufd1=(($7)|0); //@line 191 "err.c"
  HEAP32[(($ufd1)>>2)]=$6; //@line 191 "err.c"
  var $8=HEAP32[((_stdin)>>2)]; //@line 192 "err.c"
  var $call2=_f__canseek($8); //@line 192 "err.c"
  var $9=$p; //@line 192 "err.c"
  var $useek3=(($9+20)|0); //@line 192 "err.c"
  HEAP32[(($useek3)>>2)]=$call2; //@line 192 "err.c"
  var $10=$p; //@line 193 "err.c"
  var $ufmt4=(($10+24)|0); //@line 193 "err.c"
  HEAP32[(($ufmt4)>>2)]=1; //@line 193 "err.c"
  var $11=$p; //@line 194 "err.c"
  var $uwrt5=(($11+40)|0); //@line 194 "err.c"
  HEAP32[(($uwrt5)>>2)]=0; //@line 194 "err.c"
  $p=((_f__units+288)|0); //@line 195 "err.c"
  var $12=HEAP32[((_stdout)>>2)]; //@line 196 "err.c"
  var $13=$p; //@line 196 "err.c"
  var $ufd6=(($13)|0); //@line 196 "err.c"
  HEAP32[(($ufd6)>>2)]=$12; //@line 196 "err.c"
  var $14=HEAP32[((_stdout)>>2)]; //@line 197 "err.c"
  var $call7=_f__canseek($14); //@line 197 "err.c"
  var $15=$p; //@line 197 "err.c"
  var $useek8=(($15+20)|0); //@line 197 "err.c"
  HEAP32[(($useek8)>>2)]=$call7; //@line 197 "err.c"
  var $16=$p; //@line 198 "err.c"
  var $ufmt9=(($16+24)|0); //@line 198 "err.c"
  HEAP32[(($ufmt9)>>2)]=1; //@line 198 "err.c"
  var $17=$p; //@line 199 "err.c"
  var $uwrt10=(($17+40)|0); //@line 199 "err.c"
  HEAP32[(($uwrt10)>>2)]=1; //@line 199 "err.c"
  ;
  return; //@line 200 "err.c"
}
_f_init["X"]=1;

function _f__nowwriting($x) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $x_addr;
      var $loc;
      var $ufmt;
      $x_addr=$x;
      var $0=$x_addr; //@line 246 "err.c"
      var $urw=(($0+28)|0); //@line 246 "err.c"
      var $1=HEAP32[(($urw)>>2)]; //@line 246 "err.c"
      var $and=$1 & 2; //@line 246 "err.c"
      var $tobool=(($and)|0)!=0; //@line 246 "err.c"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 6; break; } //@line 246 "err.c"
    case 3: 
      var $2=$x_addr; //@line 247 "err.c"
      var $urw1=(($2+28)|0); //@line 247 "err.c"
      var $3=HEAP32[(($urw1)>>2)]; //@line 247 "err.c"
      var $and2=$3 & 1; //@line 247 "err.c"
      var $tobool3=(($and2)|0)!=0; //@line 247 "err.c"
      if ($tobool3) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 247 "err.c"
    case 4: 
      var $4=$x_addr; //@line 248 "err.c"
      var $ufd=(($4)|0); //@line 248 "err.c"
      var $5=HEAP32[(($ufd)>>2)]; //@line 248 "err.c"
      var $call=_fseek($5, 0, 1); //@line 248 "err.c"
      __label__ = 5; break; //@line 248 "err.c"
    case 5: 
      __label__ = 20; break; //@line 249 "err.c"
    case 6: 
      var $6=$x_addr; //@line 251 "err.c"
      var $ufnm=(($6+4)|0); //@line 251 "err.c"
      var $7=HEAP32[(($ufnm)>>2)]; //@line 251 "err.c"
      var $tobool6=(($7)|0)!=0; //@line 251 "err.c"
      if ($tobool6) { __label__ = 8; break; } else { __label__ = 7; break; } //@line 251 "err.c"
    case 7: 
      __label__ = 17; break; //@line 252 "err.c"
    case 8: 
      var $8=$x_addr; //@line 253 "err.c"
      var $url=(($8+16)|0); //@line 253 "err.c"
      var $9=HEAP32[(($url)>>2)]; //@line 253 "err.c"
      var $tobool9=(($9)|0)!=0; //@line 253 "err.c"
      if ($tobool9) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 253 "err.c"
    case 9: 
      var $cond = 0;__label__ = 11; break; //@line 253 "err.c"
    case 10: 
      var $10=$x_addr; //@line 253 "err.c"
      var $ufmt10=(($10+24)|0); //@line 253 "err.c"
      var $11=HEAP32[(($ufmt10)>>2)]; //@line 253 "err.c"
      var $cond = $11;__label__ = 11; break; //@line 253 "err.c"
    case 11: 
      var $cond; //@line 253 "err.c"
      $ufmt=$cond; //@line 253 "err.c"
      var $12=$x_addr; //@line 254 "err.c"
      var $uwrt=(($12+40)|0); //@line 254 "err.c"
      var $13=HEAP32[(($uwrt)>>2)]; //@line 254 "err.c"
      var $cmp=(($13)|0)==3; //@line 254 "err.c"
      if ($cmp) { __label__ = 12; break; } else { __label__ = 15; break; } //@line 254 "err.c"
    case 12: 
      var $14=$x_addr; //@line 256 "err.c"
      var $ufnm12=(($14+4)|0); //@line 256 "err.c"
      var $15=HEAP32[(($ufnm12)>>2)]; //@line 256 "err.c"
      var $16=$ufmt; //@line 256 "err.c"
      var $arrayidx=((_f__w_mode+($16<<2))|0); //@line 256 "err.c"
      var $17=((((HEAPU8[($arrayidx)])|(HEAPU8[(($arrayidx)+(1))]<<8)|(HEAPU8[(($arrayidx)+(2))]<<16)|(HEAPU8[(($arrayidx)+(3))]<<24))|0)); //@line 256 "err.c"
      var $18=$x_addr; //@line 256 "err.c"
      var $ufd13=(($18)|0); //@line 256 "err.c"
      var $19=HEAP32[(($ufd13)>>2)]; //@line 256 "err.c"
      var $call14=_freopen($15, $17, $19); //@line 256 "err.c"
      var $20=$x_addr; //@line 256 "err.c"
      var $ufd15=(($20)|0); //@line 256 "err.c"
      HEAP32[(($ufd15)>>2)]=$call14; //@line 256 "err.c"
      HEAP32[((_f__cf)>>2)]=$call14; //@line 256 "err.c"
      var $tobool16=(($call14)|0)!=0; //@line 256 "err.c"
      if ($tobool16) { __label__ = 14; break; } else { __label__ = 13; break; } //@line 256 "err.c"
    case 13: 
      __label__ = 17; break; //@line 257 "err.c"
    case 14: 
      var $21=$x_addr; //@line 258 "err.c"
      var $urw19=(($21+28)|0); //@line 258 "err.c"
      HEAP32[(($urw19)>>2)]=2; //@line 258 "err.c"
      __label__ = 19; break; //@line 259 "err.c"
    case 15: 
      var $22=$x_addr; //@line 261 "err.c"
      var $ufd20=(($22)|0); //@line 261 "err.c"
      var $23=HEAP32[(($ufd20)>>2)]; //@line 261 "err.c"
      var $call21=_ftell($23); //@line 261 "err.c"
      $loc=$call21; //@line 261 "err.c"
      var $24=$x_addr; //@line 263 "err.c"
      var $ufnm22=(($24+4)|0); //@line 263 "err.c"
      var $25=HEAP32[(($ufnm22)>>2)]; //@line 263 "err.c"
      var $26=$ufmt; //@line 263 "err.c"
      var $or=$26 | 2; //@line 263 "err.c"
      var $arrayidx23=((_f__w_mode+($or<<2))|0); //@line 263 "err.c"
      var $27=((((HEAPU8[($arrayidx23)])|(HEAPU8[(($arrayidx23)+(1))]<<8)|(HEAPU8[(($arrayidx23)+(2))]<<16)|(HEAPU8[(($arrayidx23)+(3))]<<24))|0)); //@line 263 "err.c"
      var $28=$x_addr; //@line 263 "err.c"
      var $ufd24=(($28)|0); //@line 263 "err.c"
      var $29=HEAP32[(($ufd24)>>2)]; //@line 263 "err.c"
      var $call25=_freopen($25, $27, $29); //@line 263 "err.c"
      var $30=$x_addr; //@line 263 "err.c"
      var $ufd26=(($30)|0); //@line 263 "err.c"
      HEAP32[(($ufd26)>>2)]=$call25; //@line 263 "err.c"
      HEAP32[((_f__cf)>>2)]=$call25; //@line 263 "err.c"
      var $tobool27=(($call25)|0)!=0; //@line 263 "err.c"
      if ($tobool27) { __label__ = 18; break; } else { __label__ = 16; break; } //@line 263 "err.c"
    case 16: 
      var $31=$x_addr; //@line 265 "err.c"
      var $ufd29=(($31)|0); //@line 265 "err.c"
      HEAP32[(($ufd29)>>2)]=0; //@line 265 "err.c"
      __label__ = 17; break; //@line 265 "err.c"
    case 17: 
      var $call30=___errno(); //@line 267 "err.c"
      HEAP32[(($call30)>>2)]=127; //@line 267 "err.c"
      $retval=1; //@line 268 "err.c"
      __label__ = 21; break; //@line 268 "err.c"
    case 18: 
      var $32=$x_addr; //@line 270 "err.c"
      var $urw32=(($32+28)|0); //@line 270 "err.c"
      HEAP32[(($urw32)>>2)]=3; //@line 270 "err.c"
      var $33=$x_addr; //@line 271 "err.c"
      var $ufd33=(($33)|0); //@line 271 "err.c"
      var $34=HEAP32[(($ufd33)>>2)]; //@line 271 "err.c"
      var $35=$loc; //@line 271 "err.c"
      var $call34=_fseek($34, $35, 0); //@line 271 "err.c"
      __label__ = 19; break;
    case 19: 
      __label__ = 20; break;
    case 20: 
      var $36=$x_addr; //@line 274 "err.c"
      var $uwrt36=(($36+40)|0); //@line 274 "err.c"
      HEAP32[(($uwrt36)>>2)]=1; //@line 274 "err.c"
      $retval=0; //@line 275 "err.c"
      __label__ = 21; break; //@line 275 "err.c"
    case 21: 
      var $37=$retval; //@line 276 "err.c"
      ;
      return $37; //@line 276 "err.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_f__nowwriting["X"]=1;

function _c_le($a) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $a_addr;
      $a_addr=$a;
      var $0=HEAP32[((_f__init)>>2)]; //@line 632 "lread.c"
      var $tobool=(($0)|0)!=0; //@line 632 "lread.c"
      if ($tobool) { __label__ = 4; break; } else { __label__ = 3; break; } //@line 632 "lread.c"
    case 3: 
      _f_init(); //@line 633 "lread.c"
      __label__ = 4; break; //@line 633 "lread.c"
    case 4: 
      HEAP32[((_f__fmtbuf)>>2)]=((STRING_TABLE.__str115)|0); //@line 634 "lread.c"
      var $1=$a_addr; //@line 635 "lread.c"
      var $ciunit=(($1+4)|0); //@line 635 "lread.c"
      var $2=HEAP32[(($ciunit)>>2)]; //@line 635 "lread.c"
      var $arrayidx=((_f__units+($2)*(48))|0); //@line 635 "lread.c"
      HEAP32[((_f__curunit)>>2)]=$arrayidx; //@line 635 "lread.c"
      var $3=$a_addr; //@line 636 "lread.c"
      var $ciunit1=(($3+4)|0); //@line 636 "lread.c"
      var $4=HEAP32[(($ciunit1)>>2)]; //@line 636 "lread.c"
      var $cmp=(($4)|0) >= 100; //@line 636 "lread.c"
      if ($cmp) { __label__ = 6; break; } else { __label__ = 5; break; } //@line 636 "lread.c"
    case 5: 
      var $5=$a_addr; //@line 636 "lread.c"
      var $ciunit2=(($5+4)|0); //@line 636 "lread.c"
      var $6=HEAP32[(($ciunit2)>>2)]; //@line 636 "lread.c"
      var $cmp3=(($6)|0) < 0; //@line 636 "lread.c"
      if ($cmp3) { __label__ = 6; break; } else { __label__ = 10; break; } //@line 636 "lread.c"
    case 6: 
      var $7=$a_addr; //@line 637 "lread.c"
      var $cierr=(($7)|0); //@line 637 "lread.c"
      var $8=HEAP32[(($cierr)>>2)]; //@line 637 "lread.c"
      var $tobool5=(($8)|0)!=0; //@line 637 "lread.c"
      if ($tobool5) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 637 "lread.c"
    case 7: 
      var $call=___errno(); //@line 637 "lread.c"
      HEAP32[(($call)>>2)]=101; //@line 637 "lread.c"
      __label__ = 9; break; //@line 637 "lread.c"
    case 8: 
      _f__fatal(101, ((STRING_TABLE.__str1116)|0)); //@line 637 "lread.c"
      __label__ = 9; break;
    case 9: 
      $retval=101; //@line 637 "lread.c"
      __label__ = 22; break; //@line 637 "lread.c"
    case 10: 
      HEAP32[((_f__recpos)>>2)]=0; //@line 638 "lread.c"
      HEAP32[((_f__scale)>>2)]=0; //@line 638 "lread.c"
      var $9=$a_addr; //@line 639 "lread.c"
      HEAP32[((_f__elist)>>2)]=$9; //@line 639 "lread.c"
      var $10=HEAP32[((_f__curunit)>>2)]; //@line 640 "lread.c"
      var $ufd=(($10)|0); //@line 640 "lread.c"
      var $11=HEAP32[(($ufd)>>2)]; //@line 640 "lread.c"
      var $cmp9=(($11)|0)==0; //@line 640 "lread.c"
      if ($cmp9) { __label__ = 11; break; } else { __label__ = 16; break; } //@line 640 "lread.c"
    case 11: 
      var $12=$a_addr; //@line 640 "lread.c"
      var $ciunit10=(($12+4)|0); //@line 640 "lread.c"
      var $13=HEAP32[(($ciunit10)>>2)]; //@line 640 "lread.c"
      var $call11=_fk_open(3, 5, $13); //@line 640 "lread.c"
      var $tobool12=(($call11)|0)!=0; //@line 640 "lread.c"
      if ($tobool12) { __label__ = 12; break; } else { __label__ = 16; break; } //@line 640 "lread.c"
    case 12: 
      var $14=$a_addr; //@line 641 "lread.c"
      var $cierr14=(($14)|0); //@line 641 "lread.c"
      var $15=HEAP32[(($cierr14)>>2)]; //@line 641 "lread.c"
      var $tobool15=(($15)|0)!=0; //@line 641 "lread.c"
      if ($tobool15) { __label__ = 13; break; } else { __label__ = 14; break; } //@line 641 "lread.c"
    case 13: 
      var $call17=___errno(); //@line 641 "lread.c"
      HEAP32[(($call17)>>2)]=102; //@line 641 "lread.c"
      __label__ = 15; break; //@line 641 "lread.c"
    case 14: 
      _f__fatal(102, ((STRING_TABLE.__str2117)|0)); //@line 641 "lread.c"
      __label__ = 15; break;
    case 15: 
      $retval=102; //@line 641 "lread.c"
      __label__ = 22; break; //@line 641 "lread.c"
    case 16: 
      var $16=HEAP32[((_f__curunit)>>2)]; //@line 642 "lread.c"
      var $ufd21=(($16)|0); //@line 642 "lread.c"
      var $17=HEAP32[(($ufd21)>>2)]; //@line 642 "lread.c"
      HEAP32[((_f__cf)>>2)]=$17; //@line 642 "lread.c"
      var $18=HEAP32[((_f__curunit)>>2)]; //@line 643 "lread.c"
      var $ufmt=(($18+24)|0); //@line 643 "lread.c"
      var $19=HEAP32[(($ufmt)>>2)]; //@line 643 "lread.c"
      var $tobool22=(($19)|0)!=0; //@line 643 "lread.c"
      if ($tobool22) { __label__ = 21; break; } else { __label__ = 17; break; } //@line 643 "lread.c"
    case 17: 
      var $20=$a_addr; //@line 643 "lread.c"
      var $cierr24=(($20)|0); //@line 643 "lread.c"
      var $21=HEAP32[(($cierr24)>>2)]; //@line 643 "lread.c"
      var $tobool25=(($21)|0)!=0; //@line 643 "lread.c"
      if ($tobool25) { __label__ = 18; break; } else { __label__ = 19; break; } //@line 643 "lread.c"
    case 18: 
      var $call27=___errno(); //@line 643 "lread.c"
      HEAP32[(($call27)>>2)]=103; //@line 643 "lread.c"
      __label__ = 20; break; //@line 643 "lread.c"
    case 19: 
      _f__fatal(103, ((STRING_TABLE.__str2117)|0)); //@line 643 "lread.c"
      __label__ = 20; break;
    case 20: 
      $retval=103; //@line 643 "lread.c"
      __label__ = 22; break; //@line 643 "lread.c"
    case 21: 
      $retval=0; //@line 644 "lread.c"
      __label__ = 22; break; //@line 644 "lread.c"
    case 22: 
      var $22=$retval; //@line 645 "lread.c"
      ;
      return $22; //@line 645 "lread.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_c_le["X"]=1;

function _l_write($number, $ptr, $len, $type) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $number_addr;
      var $ptr_addr;
      var $len_addr;
      var $type_addr;
      var $i;
      var $x;
      var $y;
      var $z;
      var $xx;
      var $yy;
      $number_addr=$number;
      $ptr_addr=$ptr;
      $len_addr=$len;
      $type_addr=$type;
      $i=0; //@line 255 "lwrite.c"
      __label__ = 3; break; //@line 255 "lwrite.c"
    case 3: 
      var $0=$i; //@line 255 "lwrite.c"
      var $1=$number_addr; //@line 255 "lwrite.c"
      var $2=HEAP32[(($1)>>2)]; //@line 255 "lwrite.c"
      var $cmp=(($0)|0) < (($2)|0); //@line 255 "lwrite.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 23; break; } //@line 255 "lwrite.c"
    case 4: 
      var $3=$type_addr; //@line 257 "lwrite.c"
      if ((($3)|0) == 11) {
        __label__ = 6; break;
      }
      else if ((($3)|0) == 2) {
        __label__ = 7; break;
      }
      else if ((($3)|0) == 3) {
        __label__ = 8; break;
      }
      else if ((($3)|0) == 4) {
        __label__ = 10; break;
      }
      else if ((($3)|0) == 5) {
        __label__ = 11; break;
      }
      else if ((($3)|0) == 6) {
        __label__ = 13; break;
      }
      else if ((($3)|0) == 7) {
        __label__ = 14; break;
      }
      else if ((($3)|0) == 12) {
        __label__ = 16; break;
      }
      else if ((($3)|0) == 13) {
        __label__ = 17; break;
      }
      else if ((($3)|0) == 8) {
        __label__ = 18; break;
      }
      else if ((($3)|0) == 9) {
        __label__ = 20; break;
      }
      else {
      __label__ = 5; break;
      }
      
    case 5: 
      _f__fatal(117, ((STRING_TABLE.__str137)|0)); //@line 259 "lwrite.c"
      __label__ = 6; break; //@line 259 "lwrite.c"
    case 6: 
      var $4=$ptr_addr; //@line 261 "lwrite.c"
      var $5=$4; //@line 261 "lwrite.c"
      var $flchar=$5; //@line 261 "lwrite.c"
      var $6=HEAP8[($flchar)]; //@line 261 "lwrite.c"
      var $conv=(($6 << 24) >> 24); //@line 261 "lwrite.c"
      $x=$conv; //@line 261 "lwrite.c"
      __label__ = 9; break; //@line 262 "lwrite.c"
    case 7: 
      var $7=$ptr_addr; //@line 264 "lwrite.c"
      var $8=$7; //@line 264 "lwrite.c"
      var $flshort=$8; //@line 264 "lwrite.c"
      var $9=HEAP16[(($flshort)>>1)]; //@line 264 "lwrite.c"
      var $conv2=(($9 << 16) >> 16); //@line 264 "lwrite.c"
      $x=$conv2; //@line 264 "lwrite.c"
      __label__ = 9; break; //@line 265 "lwrite.c"
    case 8: 
      var $10=$ptr_addr; //@line 272 "lwrite.c"
      var $11=$10; //@line 272 "lwrite.c"
      var $flint=$11; //@line 272 "lwrite.c"
      var $12=HEAP32[(($flint)>>2)]; //@line 272 "lwrite.c"
      $x=$12; //@line 272 "lwrite.c"
      __label__ = 9; break; //@line 272 "lwrite.c"
    case 9: 
      var $13=$x; //@line 273 "lwrite.c"
      _lwrt_I($13); //@line 273 "lwrite.c"
      __label__ = 21; break; //@line 274 "lwrite.c"
    case 10: 
      var $14=$ptr_addr; //@line 276 "lwrite.c"
      var $15=$14; //@line 276 "lwrite.c"
      var $flreal=$15; //@line 276 "lwrite.c"
      var $16=HEAPF32[(($flreal)>>2)]; //@line 276 "lwrite.c"
      var $conv5=$16; //@line 276 "lwrite.c"
      $y=$conv5; //@line 276 "lwrite.c"
      __label__ = 12; break; //@line 277 "lwrite.c"
    case 11: 
      var $17=$ptr_addr; //@line 279 "lwrite.c"
      var $18=$17; //@line 279 "lwrite.c"
      var $fldouble=$18; //@line 279 "lwrite.c"
      var $19=(tempDoubleI32[0]=HEAP32[(($fldouble)>>2)],tempDoubleI32[1]=HEAP32[((($fldouble)+(4))>>2)],tempDoubleF64[0]); //@line 279 "lwrite.c"
      $y=$19; //@line 279 "lwrite.c"
      __label__ = 12; break; //@line 279 "lwrite.c"
    case 12: 
      var $20=$y; //@line 280 "lwrite.c"
      _lwrt_F($20); //@line 280 "lwrite.c"
      __label__ = 21; break; //@line 281 "lwrite.c"
    case 13: 
      var $21=$ptr_addr; //@line 283 "lwrite.c"
      var $22=$21; //@line 283 "lwrite.c"
      var $flreal8=$22; //@line 283 "lwrite.c"
      $xx=$flreal8; //@line 283 "lwrite.c"
      var $23=$xx; //@line 284 "lwrite.c"
      var $incdec_ptr=(($23+4)|0); //@line 284 "lwrite.c"
      $xx=$incdec_ptr; //@line 284 "lwrite.c"
      var $24=HEAPF32[(($23)>>2)]; //@line 284 "lwrite.c"
      var $conv9=$24; //@line 284 "lwrite.c"
      $y=$conv9; //@line 284 "lwrite.c"
      var $25=$xx; //@line 285 "lwrite.c"
      var $26=HEAPF32[(($25)>>2)]; //@line 285 "lwrite.c"
      var $conv10=$26; //@line 285 "lwrite.c"
      $z=$conv10; //@line 285 "lwrite.c"
      __label__ = 15; break; //@line 286 "lwrite.c"
    case 14: 
      var $27=$ptr_addr; //@line 288 "lwrite.c"
      var $28=$27; //@line 288 "lwrite.c"
      var $fldouble12=$28; //@line 288 "lwrite.c"
      $yy=$fldouble12; //@line 288 "lwrite.c"
      var $29=$yy; //@line 289 "lwrite.c"
      var $incdec_ptr13=(($29+8)|0); //@line 289 "lwrite.c"
      $yy=$incdec_ptr13; //@line 289 "lwrite.c"
      var $30=(tempDoubleI32[0]=HEAP32[(($29)>>2)],tempDoubleI32[1]=HEAP32[((($29)+(4))>>2)],tempDoubleF64[0]); //@line 289 "lwrite.c"
      $y=$30; //@line 289 "lwrite.c"
      var $31=$yy; //@line 290 "lwrite.c"
      var $32=(tempDoubleI32[0]=HEAP32[(($31)>>2)],tempDoubleI32[1]=HEAP32[((($31)+(4))>>2)],tempDoubleF64[0]); //@line 290 "lwrite.c"
      $z=$32; //@line 290 "lwrite.c"
      __label__ = 15; break; //@line 290 "lwrite.c"
    case 15: 
      var $33=$y; //@line 292 "lwrite.c"
      var $34=$z; //@line 292 "lwrite.c"
      _lwrt_C($33, $34); //@line 292 "lwrite.c"
      __label__ = 21; break; //@line 293 "lwrite.c"
    case 16: 
      var $35=$ptr_addr; //@line 295 "lwrite.c"
      var $36=$35; //@line 295 "lwrite.c"
      var $flchar15=$36; //@line 295 "lwrite.c"
      var $37=HEAP8[($flchar15)]; //@line 295 "lwrite.c"
      var $conv16=(($37 << 24) >> 24); //@line 295 "lwrite.c"
      $x=$conv16; //@line 295 "lwrite.c"
      __label__ = 19; break; //@line 296 "lwrite.c"
    case 17: 
      var $38=$ptr_addr; //@line 298 "lwrite.c"
      var $39=$38; //@line 298 "lwrite.c"
      var $flshort18=$39; //@line 298 "lwrite.c"
      var $40=HEAP16[(($flshort18)>>1)]; //@line 298 "lwrite.c"
      var $conv19=(($40 << 16) >> 16); //@line 298 "lwrite.c"
      $x=$conv19; //@line 298 "lwrite.c"
      __label__ = 19; break; //@line 299 "lwrite.c"
    case 18: 
      var $41=$ptr_addr; //@line 301 "lwrite.c"
      var $42=$41; //@line 301 "lwrite.c"
      var $flint21=$42; //@line 301 "lwrite.c"
      var $43=HEAP32[(($flint21)>>2)]; //@line 301 "lwrite.c"
      $x=$43; //@line 301 "lwrite.c"
      __label__ = 19; break; //@line 301 "lwrite.c"
    case 19: 
      var $44=$ptr_addr; //@line 302 "lwrite.c"
      var $45=$44; //@line 302 "lwrite.c"
      var $flint22=$45; //@line 302 "lwrite.c"
      var $46=HEAP32[(($flint22)>>2)]; //@line 302 "lwrite.c"
      var $47=$len_addr; //@line 302 "lwrite.c"
      _lwrt_L($46, $47); //@line 302 "lwrite.c"
      __label__ = 21; break; //@line 303 "lwrite.c"
    case 20: 
      var $48=$ptr_addr; //@line 305 "lwrite.c"
      var $49=$len_addr; //@line 305 "lwrite.c"
      _lwrt_A($48, $49); //@line 305 "lwrite.c"
      __label__ = 21; break; //@line 306 "lwrite.c"
    case 21: 
      var $50=$len_addr; //@line 308 "lwrite.c"
      var $51=$ptr_addr; //@line 308 "lwrite.c"
      var $add_ptr=(($51+$50)|0); //@line 308 "lwrite.c"
      $ptr_addr=$add_ptr; //@line 308 "lwrite.c"
      __label__ = 22; break; //@line 309 "lwrite.c"
    case 22: 
      var $52=$i; //@line 255 "lwrite.c"
      var $inc=((($52)+(1))|0); //@line 255 "lwrite.c"
      $i=$inc; //@line 255 "lwrite.c"
      __label__ = 3; break; //@line 255 "lwrite.c"
    case 23: 
      ;
      return 0; //@line 310 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_l_write["X"]=1;

function _lwrt_I($n) {
  var __stackBase__  = STACKTOP; STACKTOP += 8; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $n_addr;
      var $p;
      var $ndigit=__stackBase__;
      var $sign=(__stackBase__)+(4);
      $n_addr=$n;
      var $0=$n_addr; //@line 29 "lwrite.c"
      var $call=_f__icvt($0, $ndigit, $sign, 10); //@line 29 "lwrite.c"
      $p=$call; //@line 29 "lwrite.c"
      var $1=HEAP32[((_f__recpos)>>2)]; //@line 30 "lwrite.c"
      var $2=HEAP32[(($ndigit)>>2)]; //@line 30 "lwrite.c"
      var $add=((($1)+($2))|0); //@line 30 "lwrite.c"
      var $3=HEAP32[((_L_len)>>2)]; //@line 30 "lwrite.c"
      var $cmp=(($add)|0) >= (($3)|0); //@line 30 "lwrite.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 30 "lwrite.c"
    case 3: 
      _donewrec(); //@line 31 "lwrite.c"
      __label__ = 4; break; //@line 31 "lwrite.c"
    case 4: 
      var $4=HEAP32[((_f__putn)>>2)]; //@line 32 "lwrite.c"
      FUNCTION_TABLE[$4](32); //@line 32 "lwrite.c"
      var $5=HEAP32[(($sign)>>2)]; //@line 33 "lwrite.c"
      var $tobool=(($5)|0)!=0; //@line 33 "lwrite.c"
      if ($tobool) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 33 "lwrite.c"
    case 5: 
      var $6=HEAP32[((_f__putn)>>2)]; //@line 34 "lwrite.c"
      FUNCTION_TABLE[$6](45); //@line 34 "lwrite.c"
      __label__ = 6; break; //@line 34 "lwrite.c"
    case 6: 
      __label__ = 7; break; //@line 35 "lwrite.c"
    case 7: 
      var $7=$p; //@line 35 "lwrite.c"
      var $8=HEAP8[($7)]; //@line 35 "lwrite.c"
      var $tobool3=(($8 << 24) >> 24)!=0; //@line 35 "lwrite.c"
      if ($tobool3) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 35 "lwrite.c"
    case 8: 
      var $9=HEAP32[((_f__putn)>>2)]; //@line 36 "lwrite.c"
      var $10=$p; //@line 36 "lwrite.c"
      var $incdec_ptr=(($10+1)|0); //@line 36 "lwrite.c"
      $p=$incdec_ptr; //@line 36 "lwrite.c"
      var $11=HEAP8[($10)]; //@line 36 "lwrite.c"
      var $conv=(($11 << 24) >> 24); //@line 36 "lwrite.c"
      FUNCTION_TABLE[$9]($conv); //@line 36 "lwrite.c"
      __label__ = 7; break; //@line 36 "lwrite.c"
    case 9: 
      STACKTOP = __stackBase__;
      return; //@line 37 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _lwrt_F($n) {
  var __stackBase__  = STACKTOP; STACKTOP += 24; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $n_addr;
      var $buf=__stackBase__;
      $n_addr=$n;
      var $0=HEAP32[((_f__recpos)>>2)]; //@line 203 "lwrite.c"
      var $arraydecay=(($buf)|0); //@line 203 "lwrite.c"
      var $1=$n_addr; //@line 203 "lwrite.c"
      var $call=_l_g($arraydecay, $1); //@line 203 "lwrite.c"
      var $add=((($0)+($call))|0); //@line 203 "lwrite.c"
      var $2=HEAP32[((_L_len)>>2)]; //@line 203 "lwrite.c"
      var $cmp=(($add)|0) >= (($2)|0); //@line 203 "lwrite.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 203 "lwrite.c"
    case 3: 
      _donewrec(); //@line 204 "lwrite.c"
      __label__ = 4; break; //@line 204 "lwrite.c"
    case 4: 
      var $arraydecay1=(($buf)|0); //@line 205 "lwrite.c"
      _l_put($arraydecay1); //@line 205 "lwrite.c"
      STACKTOP = __stackBase__;
      return; //@line 206 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _lwrt_C($a, $b) {
  var __stackBase__  = STACKTOP; STACKTOP += 48; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $a_addr;
      var $b_addr;
      var $ba;
      var $bb;
      var $bufa=__stackBase__;
      var $bufb=(__stackBase__)+(24);
      var $al;
      var $bl;
      $a_addr=$a;
      $b_addr=$b;
      var $arraydecay=(($bufa)|0); //@line 217 "lwrite.c"
      var $0=$a_addr; //@line 217 "lwrite.c"
      var $call=_l_g($arraydecay, $0); //@line 217 "lwrite.c"
      $al=$call; //@line 217 "lwrite.c"
      var $arraydecay1=(($bufa)|0); //@line 218 "lwrite.c"
      $ba=$arraydecay1; //@line 218 "lwrite.c"
      __label__ = 3; break; //@line 218 "lwrite.c"
    case 3: 
      var $1=$ba; //@line 218 "lwrite.c"
      var $2=HEAP8[($1)]; //@line 218 "lwrite.c"
      var $conv=(($2 << 24) >> 24); //@line 218 "lwrite.c"
      var $cmp=(($conv)|0)==32; //@line 218 "lwrite.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 6; break; } //@line 218 "lwrite.c"
    case 4: 
      var $3=$al; //@line 219 "lwrite.c"
      var $dec=((($3)-(1))|0); //@line 219 "lwrite.c"
      $al=$dec; //@line 219 "lwrite.c"
      __label__ = 5; break; //@line 219 "lwrite.c"
    case 5: 
      var $4=$ba; //@line 218 "lwrite.c"
      var $incdec_ptr=(($4+1)|0); //@line 218 "lwrite.c"
      $ba=$incdec_ptr; //@line 218 "lwrite.c"
      __label__ = 3; break; //@line 218 "lwrite.c"
    case 6: 
      var $arraydecay3=(($bufb)|0); //@line 220 "lwrite.c"
      var $5=$b_addr; //@line 220 "lwrite.c"
      var $call4=_l_g($arraydecay3, $5); //@line 220 "lwrite.c"
      var $add=((($call4)+(1))|0); //@line 220 "lwrite.c"
      $bl=$add; //@line 220 "lwrite.c"
      var $arraydecay5=(($bufb)|0); //@line 221 "lwrite.c"
      $bb=$arraydecay5; //@line 221 "lwrite.c"
      __label__ = 7; break; //@line 221 "lwrite.c"
    case 7: 
      var $6=$bb; //@line 221 "lwrite.c"
      var $7=HEAP8[($6)]; //@line 221 "lwrite.c"
      var $conv7=(($7 << 24) >> 24); //@line 221 "lwrite.c"
      var $cmp8=(($conv7)|0)==32; //@line 221 "lwrite.c"
      if ($cmp8) { __label__ = 8; break; } else { __label__ = 10; break; } //@line 221 "lwrite.c"
    case 8: 
      var $8=$bl; //@line 222 "lwrite.c"
      var $dec11=((($8)-(1))|0); //@line 222 "lwrite.c"
      $bl=$dec11; //@line 222 "lwrite.c"
      __label__ = 9; break; //@line 222 "lwrite.c"
    case 9: 
      var $9=$bb; //@line 221 "lwrite.c"
      var $incdec_ptr13=(($9+1)|0); //@line 221 "lwrite.c"
      $bb=$incdec_ptr13; //@line 221 "lwrite.c"
      __label__ = 7; break; //@line 221 "lwrite.c"
    case 10: 
      var $10=HEAP32[((_f__recpos)>>2)]; //@line 223 "lwrite.c"
      var $11=$al; //@line 223 "lwrite.c"
      var $add15=((($10)+($11))|0); //@line 223 "lwrite.c"
      var $12=$bl; //@line 223 "lwrite.c"
      var $add16=((($add15)+($12))|0); //@line 223 "lwrite.c"
      var $add17=((($add16)+(3))|0); //@line 223 "lwrite.c"
      var $13=HEAP32[((_L_len)>>2)]; //@line 223 "lwrite.c"
      var $cmp18=(($add17)|0) >= (($13)|0); //@line 223 "lwrite.c"
      if ($cmp18) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 223 "lwrite.c"
    case 11: 
      _donewrec(); //@line 224 "lwrite.c"
      __label__ = 12; break; //@line 224 "lwrite.c"
    case 12: 
      var $14=HEAP32[((_f__putn)>>2)]; //@line 228 "lwrite.c"
      FUNCTION_TABLE[$14](32); //@line 228 "lwrite.c"
      var $15=HEAP32[((_f__putn)>>2)]; //@line 229 "lwrite.c"
      FUNCTION_TABLE[$15](40); //@line 229 "lwrite.c"
      var $16=$ba; //@line 230 "lwrite.c"
      _l_put($16); //@line 230 "lwrite.c"
      var $17=HEAP32[((_f__putn)>>2)]; //@line 231 "lwrite.c"
      FUNCTION_TABLE[$17](44); //@line 231 "lwrite.c"
      var $18=HEAP32[((_f__recpos)>>2)]; //@line 232 "lwrite.c"
      var $19=$bl; //@line 232 "lwrite.c"
      var $add20=((($18)+($19))|0); //@line 232 "lwrite.c"
      var $20=HEAP32[((_L_len)>>2)]; //@line 232 "lwrite.c"
      var $cmp21=(($add20)|0) >= (($20)|0); //@line 232 "lwrite.c"
      if ($cmp21) { __label__ = 13; break; } else { __label__ = 14; break; } //@line 232 "lwrite.c"
    case 13: 
      var $21=HEAP32[((_f__donewrec)>>2)]; //@line 233 "lwrite.c"
      var $call24=FUNCTION_TABLE[$21](); //@line 233 "lwrite.c"
      var $22=HEAP32[((_f__putn)>>2)]; //@line 235 "lwrite.c"
      FUNCTION_TABLE[$22](32); //@line 235 "lwrite.c"
      __label__ = 14; break; //@line 237 "lwrite.c"
    case 14: 
      var $23=$bb; //@line 238 "lwrite.c"
      _l_put($23); //@line 238 "lwrite.c"
      var $24=HEAP32[((_f__putn)>>2)]; //@line 239 "lwrite.c"
      FUNCTION_TABLE[$24](41); //@line 239 "lwrite.c"
      STACKTOP = __stackBase__;
      return; //@line 240 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_lwrt_C["X"]=1;

function _lwrt_L($n, $len) {
  var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $n_addr=__stackBase__;
      var $len_addr;
      HEAP32[(($n_addr)>>2)]=$n;
      $len_addr=$len;
      var $0=HEAP32[((_f__recpos)>>2)]; //@line 45 "lwrite.c"
      var $add=((($0)+(2))|0); //@line 45 "lwrite.c"
      var $1=HEAP32[((_L_len)>>2)]; //@line 45 "lwrite.c"
      var $cmp=(($add)|0) >= (($1)|0); //@line 45 "lwrite.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 45 "lwrite.c"
    case 3: 
      _donewrec(); //@line 46 "lwrite.c"
      __label__ = 4; break; //@line 46 "lwrite.c"
    case 4: 
      var $2=$n_addr; //@line 47 "lwrite.c"
      var $3=$len_addr; //@line 47 "lwrite.c"
      var $call=_wrt_L($2, 2, $3); //@line 47 "lwrite.c"
      STACKTOP = __stackBase__;
      return; //@line 48 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _lwrt_A($p, $len) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $p_addr;
      var $len_addr;
      var $a;
      var $p1;
      var $pe;
      $p_addr=$p;
      $len_addr=$len;
      $a=0; //@line 59 "lwrite.c"
      var $0=$p_addr; //@line 60 "lwrite.c"
      var $1=$len_addr; //@line 60 "lwrite.c"
      var $add_ptr=(($0+$1)|0); //@line 60 "lwrite.c"
      $pe=$add_ptr; //@line 60 "lwrite.c"
      var $2=HEAP32[((_f__Aquote)>>2)]; //@line 61 "lwrite.c"
      var $tobool=(($2)|0)!=0; //@line 61 "lwrite.c"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 17; break; } //@line 61 "lwrite.c"
    case 3: 
      $a=3; //@line 62 "lwrite.c"
      var $3=$len_addr; //@line 63 "lwrite.c"
      var $cmp=(($3)|0) > 1; //@line 63 "lwrite.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 11; break; } //@line 63 "lwrite.c"
    case 4: 
      var $4=$len_addr; //@line 63 "lwrite.c"
      var $sub=((($4)-(1))|0); //@line 63 "lwrite.c"
      var $5=$p_addr; //@line 63 "lwrite.c"
      var $arrayidx=(($5+$sub)|0); //@line 63 "lwrite.c"
      var $6=HEAP8[($arrayidx)]; //@line 63 "lwrite.c"
      var $conv=(($6 << 24) >> 24); //@line 63 "lwrite.c"
      var $cmp1=(($conv)|0)==32; //@line 63 "lwrite.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 11; break; } //@line 63 "lwrite.c"
    case 5: 
      __label__ = 6; break; //@line 64 "lwrite.c"
    case 6: 
      var $7=$len_addr; //@line 64 "lwrite.c"
      var $dec=((($7)-(1))|0); //@line 64 "lwrite.c"
      $len_addr=$dec; //@line 64 "lwrite.c"
      var $cmp4=(($dec)|0) > 1; //@line 64 "lwrite.c"
      if ($cmp4) { __label__ = 7; break; } else { var $11 = 0;__label__ = 8; break; } //@line 64 "lwrite.c"
    case 7: 
      var $8=$len_addr; //@line 64 "lwrite.c"
      var $sub6=((($8)-(1))|0); //@line 64 "lwrite.c"
      var $9=$p_addr; //@line 64 "lwrite.c"
      var $arrayidx7=(($9+$sub6)|0); //@line 64 "lwrite.c"
      var $10=HEAP8[($arrayidx7)]; //@line 64 "lwrite.c"
      var $conv8=(($10 << 24) >> 24); //@line 64 "lwrite.c"
      var $cmp9=(($conv8)|0)==32; //@line 64 "lwrite.c"
      var $11 = $cmp9;__label__ = 8; break;
    case 8: 
      var $11;
      if ($11) { __label__ = 9; break; } else { __label__ = 10; break; }
    case 9: 
      __label__ = 6; break;
    case 10: 
      var $12=$p_addr; //@line 65 "lwrite.c"
      var $13=$len_addr; //@line 65 "lwrite.c"
      var $add_ptr11=(($12+$13)|0); //@line 65 "lwrite.c"
      $pe=$add_ptr11; //@line 65 "lwrite.c"
      __label__ = 11; break; //@line 66 "lwrite.c"
    case 11: 
      var $14=$p_addr; //@line 67 "lwrite.c"
      $p1=$14; //@line 67 "lwrite.c"
      __label__ = 12; break; //@line 68 "lwrite.c"
    case 12: 
      var $15=$p1; //@line 68 "lwrite.c"
      var $16=$pe; //@line 68 "lwrite.c"
      var $cmp13=(($15)>>>0) < (($16)>>>0); //@line 68 "lwrite.c"
      if ($cmp13) { __label__ = 13; break; } else { __label__ = 16; break; } //@line 68 "lwrite.c"
    case 13: 
      var $17=$p1; //@line 69 "lwrite.c"
      var $incdec_ptr=(($17+1)|0); //@line 69 "lwrite.c"
      $p1=$incdec_ptr; //@line 69 "lwrite.c"
      var $18=HEAP8[($17)]; //@line 69 "lwrite.c"
      var $conv16=(($18 << 24) >> 24); //@line 69 "lwrite.c"
      var $cmp17=(($conv16)|0)==39; //@line 69 "lwrite.c"
      if ($cmp17) { __label__ = 14; break; } else { __label__ = 15; break; } //@line 69 "lwrite.c"
    case 14: 
      var $19=$a; //@line 70 "lwrite.c"
      var $inc=((($19)+(1))|0); //@line 70 "lwrite.c"
      $a=$inc; //@line 70 "lwrite.c"
      __label__ = 15; break; //@line 70 "lwrite.c"
    case 15: 
      __label__ = 12; break; //@line 70 "lwrite.c"
    case 16: 
      __label__ = 17; break; //@line 71 "lwrite.c"
    case 17: 
      var $20=HEAP32[((_f__recpos)>>2)]; //@line 72 "lwrite.c"
      var $21=$len_addr; //@line 72 "lwrite.c"
      var $add=((($20)+($21))|0); //@line 72 "lwrite.c"
      var $22=$a; //@line 72 "lwrite.c"
      var $add23=((($add)+($22))|0); //@line 72 "lwrite.c"
      var $23=HEAP32[((_L_len)>>2)]; //@line 72 "lwrite.c"
      var $cmp24=(($add23)|0) >= (($23)|0); //@line 72 "lwrite.c"
      if ($cmp24) { __label__ = 18; break; } else { __label__ = 19; break; } //@line 72 "lwrite.c"
    case 18: 
      _donewrec(); //@line 73 "lwrite.c"
      __label__ = 19; break; //@line 73 "lwrite.c"
    case 19: 
      var $24=$a; //@line 74 "lwrite.c"
      var $tobool28=(($24)|0)!=0; //@line 74 "lwrite.c"
      if ($tobool28) { __label__ = 21; break; } else { __label__ = 20; break; } //@line 74 "lwrite.c"
    case 20: 
      var $25=HEAP32[((_f__recpos)>>2)]; //@line 74 "lwrite.c"
      var $tobool29=(($25)|0)!=0; //@line 74 "lwrite.c"
      if ($tobool29) { __label__ = 22; break; } else { __label__ = 21; break; } //@line 74 "lwrite.c"
    case 21: 
      var $26=HEAP32[((_f__putn)>>2)]; //@line 79 "lwrite.c"
      FUNCTION_TABLE[$26](32); //@line 79 "lwrite.c"
      __label__ = 22; break; //@line 79 "lwrite.c"
    case 22: 
      var $27=$a; //@line 80 "lwrite.c"
      var $tobool32=(($27)|0)!=0; //@line 80 "lwrite.c"
      if ($tobool32) { __label__ = 23; break; } else { __label__ = 29; break; } //@line 80 "lwrite.c"
    case 23: 
      var $28=HEAP32[((_f__putn)>>2)]; //@line 81 "lwrite.c"
      FUNCTION_TABLE[$28](39); //@line 81 "lwrite.c"
      __label__ = 24; break; //@line 82 "lwrite.c"
    case 24: 
      var $29=$p_addr; //@line 82 "lwrite.c"
      var $30=$pe; //@line 82 "lwrite.c"
      var $cmp35=(($29)>>>0) < (($30)>>>0); //@line 82 "lwrite.c"
      if ($cmp35) { __label__ = 25; break; } else { __label__ = 28; break; } //@line 82 "lwrite.c"
    case 25: 
      var $31=$p_addr; //@line 83 "lwrite.c"
      var $32=HEAP8[($31)]; //@line 83 "lwrite.c"
      var $conv38=(($32 << 24) >> 24); //@line 83 "lwrite.c"
      var $cmp39=(($conv38)|0)==39; //@line 83 "lwrite.c"
      if ($cmp39) { __label__ = 26; break; } else { __label__ = 27; break; } //@line 83 "lwrite.c"
    case 26: 
      var $33=HEAP32[((_f__putn)>>2)]; //@line 84 "lwrite.c"
      FUNCTION_TABLE[$33](39); //@line 84 "lwrite.c"
      __label__ = 27; break; //@line 84 "lwrite.c"
    case 27: 
      var $34=HEAP32[((_f__putn)>>2)]; //@line 85 "lwrite.c"
      var $35=$p_addr; //@line 85 "lwrite.c"
      var $incdec_ptr43=(($35+1)|0); //@line 85 "lwrite.c"
      $p_addr=$incdec_ptr43; //@line 85 "lwrite.c"
      var $36=HEAP8[($35)]; //@line 85 "lwrite.c"
      var $conv44=(($36 << 24) >> 24); //@line 85 "lwrite.c"
      FUNCTION_TABLE[$34]($conv44); //@line 85 "lwrite.c"
      __label__ = 24; break; //@line 86 "lwrite.c"
    case 28: 
      var $37=HEAP32[((_f__putn)>>2)]; //@line 87 "lwrite.c"
      FUNCTION_TABLE[$37](39); //@line 87 "lwrite.c"
      __label__ = 33; break; //@line 88 "lwrite.c"
    case 29: 
      __label__ = 30; break; //@line 90 "lwrite.c"
    case 30: 
      var $38=$p_addr; //@line 90 "lwrite.c"
      var $39=$pe; //@line 90 "lwrite.c"
      var $cmp47=(($38)>>>0) < (($39)>>>0); //@line 90 "lwrite.c"
      if ($cmp47) { __label__ = 31; break; } else { __label__ = 32; break; } //@line 90 "lwrite.c"
    case 31: 
      var $40=HEAP32[((_f__putn)>>2)]; //@line 91 "lwrite.c"
      var $41=$p_addr; //@line 91 "lwrite.c"
      var $incdec_ptr50=(($41+1)|0); //@line 91 "lwrite.c"
      $p_addr=$incdec_ptr50; //@line 91 "lwrite.c"
      var $42=HEAP8[($41)]; //@line 91 "lwrite.c"
      var $conv51=(($42 << 24) >> 24); //@line 91 "lwrite.c"
      FUNCTION_TABLE[$40]($conv51); //@line 91 "lwrite.c"
      __label__ = 30; break; //@line 91 "lwrite.c"
    case 32: 
      __label__ = 33; break;
    case 33: 
      ;
      return; //@line 92 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_lwrt_A["X"]=1;

function _donewrec() {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $0=HEAP32[((_f__recpos)>>2)]; //@line 15 "lwrite.c"
      var $tobool=(($0)|0)!=0; //@line 15 "lwrite.c"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 15 "lwrite.c"
    case 3: 
      var $1=HEAP32[((_f__donewrec)>>2)]; //@line 16 "lwrite.c"
      var $call=FUNCTION_TABLE[$1](); //@line 16 "lwrite.c"
      __label__ = 4; break; //@line 16 "lwrite.c"
    case 4: 
      ;
      return; //@line 17 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _l_g($buf, $n) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $buf_addr;
      var $n_addr;
      var $b;
      var $c;
      var $c1;
      $buf_addr=$buf;
      $n_addr=$n;
      var $0=$buf_addr; //@line 119 "lwrite.c"
      $b=$0; //@line 119 "lwrite.c"
      var $1=$b; //@line 120 "lwrite.c"
      var $incdec_ptr=(($1+1)|0); //@line 120 "lwrite.c"
      $b=$incdec_ptr; //@line 120 "lwrite.c"
      HEAP8[($1)]=32; //@line 120 "lwrite.c"
      var $2=$n_addr; //@line 121 "lwrite.c"
      var $cmp=$2 < 0; //@line 121 "lwrite.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 121 "lwrite.c"
    case 3: 
      var $3=$b; //@line 122 "lwrite.c"
      var $incdec_ptr1=(($3+1)|0); //@line 122 "lwrite.c"
      $b=$incdec_ptr1; //@line 122 "lwrite.c"
      HEAP8[($3)]=45; //@line 122 "lwrite.c"
      var $4=$n_addr; //@line 123 "lwrite.c"
      var $sub=(-$4); //@line 123 "lwrite.c"
      $n_addr=$sub; //@line 123 "lwrite.c"
      __label__ = 5; break; //@line 124 "lwrite.c"
    case 4: 
      var $5=$b; //@line 126 "lwrite.c"
      var $incdec_ptr2=(($5+1)|0); //@line 126 "lwrite.c"
      $b=$incdec_ptr2; //@line 126 "lwrite.c"
      HEAP8[($5)]=32; //@line 126 "lwrite.c"
      __label__ = 5; break;
    case 5: 
      var $6=$n_addr; //@line 127 "lwrite.c"
      var $cmp3=$6 == 0; //@line 127 "lwrite.c"
      if ($cmp3) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 127 "lwrite.c"
    case 6: 
      var $7=$b; //@line 132 "lwrite.c"
      var $incdec_ptr5=(($7+1)|0); //@line 132 "lwrite.c"
      $b=$incdec_ptr5; //@line 132 "lwrite.c"
      HEAP8[($7)]=48; //@line 132 "lwrite.c"
      var $8=$b; //@line 133 "lwrite.c"
      var $incdec_ptr6=(($8+1)|0); //@line 133 "lwrite.c"
      $b=$incdec_ptr6; //@line 133 "lwrite.c"
      HEAP8[($8)]=46; //@line 133 "lwrite.c"
      var $9=$b; //@line 134 "lwrite.c"
      HEAP8[($9)]=0; //@line 134 "lwrite.c"
      __label__ = 31; break; //@line 135 "lwrite.c"
    case 7: 
      var $10=$b; //@line 137 "lwrite.c"
      var $11=$n_addr; //@line 137 "lwrite.c"
      var $call=_sprintf($10, ((STRING_TABLE.__str1140)|0), (tempInt=STACKTOP,STACKTOP += 8,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),(tempDoubleF64[0]=$11,HEAP32[((tempInt)>>2)]=tempDoubleI32[0],HEAP32[(((tempInt)+(4))>>2)]=tempDoubleI32[1]),tempInt)); //@line 137 "lwrite.c"
      var $12=$b; //@line 138 "lwrite.c"
      var $13=HEAP8[($12)]; //@line 138 "lwrite.c"
      var $conv=(($13 << 24) >> 24); //@line 138 "lwrite.c"
      if ((($conv)|0) == 48) {
        __label__ = 8; break;
      }
      else if ((($conv)|0) == 105 || (($conv)|0) == 73 || (($conv)|0) == 110 || (($conv)|0) == 78) {
        __label__ = 12; break;
      }
      else {
      __label__ = 16; break;
      }
      
    case 8: 
      __label__ = 9; break; //@line 141 "lwrite.c"
    case 9: 
      var $14=$b; //@line 141 "lwrite.c"
      var $arrayidx=(($14+1)|0); //@line 141 "lwrite.c"
      var $15=HEAP8[($arrayidx)]; //@line 141 "lwrite.c"
      var $16=$b; //@line 141 "lwrite.c"
      var $arrayidx8=(($16)|0); //@line 141 "lwrite.c"
      HEAP8[($arrayidx8)]=$15; //@line 141 "lwrite.c"
      var $tobool=(($15 << 24) >> 24)!=0; //@line 141 "lwrite.c"
      if ($tobool) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 141 "lwrite.c"
    case 10: 
      var $17=$b; //@line 142 "lwrite.c"
      var $incdec_ptr9=(($17+1)|0); //@line 142 "lwrite.c"
      $b=$incdec_ptr9; //@line 142 "lwrite.c"
      __label__ = 9; break; //@line 142 "lwrite.c"
    case 11: 
      __label__ = 30; break; //@line 143 "lwrite.c"
    case 12: 
      __label__ = 13; break; //@line 151 "lwrite.c"
    case 13: 
      var $18=$b; //@line 151 "lwrite.c"
      var $incdec_ptr12=(($18+1)|0); //@line 151 "lwrite.c"
      $b=$incdec_ptr12; //@line 151 "lwrite.c"
      var $19=HEAP8[($incdec_ptr12)]; //@line 151 "lwrite.c"
      var $tobool13=(($19 << 24) >> 24)!=0; //@line 151 "lwrite.c"
      if ($tobool13) { __label__ = 14; break; } else { __label__ = 15; break; } //@line 151 "lwrite.c"
    case 14: 
      __label__ = 13; break; //@line 151 "lwrite.c"
    case 15: 
      __label__ = 30; break; //@line 152 "lwrite.c"
    case 16: 
      __label__ = 17; break; //@line 156 "lwrite.c"
    case 17: 
      var $20=$b; //@line 157 "lwrite.c"
      var $21=HEAP8[($20)]; //@line 157 "lwrite.c"
      var $conv16=(($21 << 24) >> 24); //@line 157 "lwrite.c"
      if ((($conv16)|0) == 0) {
        __label__ = 18; break;
      }
      else if ((($conv16)|0) == 46) {
        __label__ = 19; break;
      }
      else if ((($conv16)|0) == 69) {
        __label__ = 23; break;
      }
      else {
      __label__ = 28; break;
      }
      
    case 18: 
      var $22=$b; //@line 159 "lwrite.c"
      var $incdec_ptr18=(($22+1)|0); //@line 159 "lwrite.c"
      $b=$incdec_ptr18; //@line 159 "lwrite.c"
      HEAP8[($22)]=46; //@line 159 "lwrite.c"
      var $23=$b; //@line 160 "lwrite.c"
      HEAP8[($23)]=0; //@line 160 "lwrite.c"
      __label__ = 31; break; //@line 161 "lwrite.c"
    case 19: 
      __label__ = 20; break; //@line 163 "lwrite.c"
    case 20: 
      var $24=$b; //@line 163 "lwrite.c"
      var $incdec_ptr21=(($24+1)|0); //@line 163 "lwrite.c"
      $b=$incdec_ptr21; //@line 163 "lwrite.c"
      var $25=HEAP8[($incdec_ptr21)]; //@line 163 "lwrite.c"
      var $tobool22=(($25 << 24) >> 24)!=0; //@line 163 "lwrite.c"
      if ($tobool22) { __label__ = 21; break; } else { __label__ = 22; break; } //@line 163 "lwrite.c"
    case 21: 
      __label__ = 20; break; //@line 163 "lwrite.c"
    case 22: 
      __label__ = 31; break; //@line 164 "lwrite.c"
    case 23: 
      $c1=46; //@line 166 "lwrite.c"
      $c=69; //@line 166 "lwrite.c"
      __label__ = 24; break; //@line 166 "lwrite.c"
    case 24: 
      var $26=$c1; //@line 166 "lwrite.c"
      var $27=$b; //@line 166 "lwrite.c"
      HEAP8[($27)]=$26; //@line 166 "lwrite.c"
      var $tobool27=(($26 << 24) >> 24)!=0; //@line 166 "lwrite.c"
      if ($tobool27) { __label__ = 25; break; } else { __label__ = 27; break; } //@line 166 "lwrite.c"
    case 25: 
      __label__ = 26; break; //@line 166 "lwrite.c"
    case 26: 
      var $28=$c; //@line 167 "lwrite.c"
      $c1=$28; //@line 167 "lwrite.c"
      var $29=$b; //@line 167 "lwrite.c"
      var $incdec_ptr28=(($29+1)|0); //@line 167 "lwrite.c"
      $b=$incdec_ptr28; //@line 167 "lwrite.c"
      var $30=HEAP8[($incdec_ptr28)]; //@line 167 "lwrite.c"
      $c=$30; //@line 167 "lwrite.c"
      __label__ = 24; break; //@line 167 "lwrite.c"
    case 27: 
      __label__ = 31; break; //@line 168 "lwrite.c"
    case 28: 
      __label__ = 29; break; //@line 169 "lwrite.c"
    case 29: 
      var $31=$b; //@line 156 "lwrite.c"
      var $incdec_ptr30=(($31+1)|0); //@line 156 "lwrite.c"
      $b=$incdec_ptr30; //@line 156 "lwrite.c"
      __label__ = 17; break; //@line 156 "lwrite.c"
    case 30: 
      __label__ = 31; break; //@line 170 "lwrite.c"
    case 31: 
      var $32=$b; //@line 172 "lwrite.c"
      var $33=$buf_addr; //@line 172 "lwrite.c"
      var $sub_ptr_lhs_cast=$32; //@line 172 "lwrite.c"
      var $sub_ptr_rhs_cast=$33; //@line 172 "lwrite.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 172 "lwrite.c"
      ;
      return $sub_ptr_sub; //@line 172 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_l_g["X"]=1;

function _l_put($s) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $s_addr;
      var $pn;
      var $c;
      $s_addr=$s;
      var $0=HEAP32[((_f__putn)>>2)]; //@line 186 "lwrite.c"
      $pn=$0; //@line 186 "lwrite.c"
      __label__ = 3; break; //@line 190 "lwrite.c"
    case 3: 
      var $1=$s_addr; //@line 190 "lwrite.c"
      var $incdec_ptr=(($1+1)|0); //@line 190 "lwrite.c"
      $s_addr=$incdec_ptr; //@line 190 "lwrite.c"
      var $2=HEAP8[($1)]; //@line 190 "lwrite.c"
      var $conv=(($2 << 24) >> 24); //@line 190 "lwrite.c"
      $c=$conv; //@line 190 "lwrite.c"
      var $tobool=(($conv)|0)!=0; //@line 190 "lwrite.c"
      if ($tobool) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 190 "lwrite.c"
    case 4: 
      var $3=$pn; //@line 191 "lwrite.c"
      var $4=$c; //@line 191 "lwrite.c"
      FUNCTION_TABLE[$3]($4); //@line 191 "lwrite.c"
      __label__ = 3; break; //@line 191 "lwrite.c"
    case 5: 
      ;
      return; //@line 192 "lwrite.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _sigfdie($n) {
  ;
  var __label__;

  var $n_addr;
  $n_addr=$n;
  var $0=$n_addr; //@line 58 "main.c"
  $n_addr=$0; //@line 58 "main.c"
  _sig_die(((STRING_TABLE.__str5152)|0), 1); //@line 59 "main.c"
  ;
  return; //@line 60 "main.c"
}


function _sigidie($n) {
  ;
  var __label__;

  var $n_addr;
  $n_addr=$n;
  var $0=$n_addr; //@line 65 "main.c"
  $n_addr=$0; //@line 65 "main.c"
  _sig_die(((STRING_TABLE.__str4151)|0), 1); //@line 66 "main.c"
  ;
  return; //@line 67 "main.c"
}


function _sigtrdie($n) {
  ;
  var __label__;

  var $n_addr;
  $n_addr=$n;
  var $0=$n_addr; //@line 93 "main.c"
  $n_addr=$0; //@line 93 "main.c"
  _sig_die(((STRING_TABLE.__str3150)|0), 1); //@line 94 "main.c"
  ;
  return; //@line 95 "main.c"
}


function _sigqdie($n) {
  ;
  var __label__;

  var $n_addr;
  $n_addr=$n;
  var $0=$n_addr; //@line 72 "main.c"
  $n_addr=$0; //@line 72 "main.c"
  _sig_die(((STRING_TABLE.__str2149)|0), 1); //@line 73 "main.c"
  ;
  return; //@line 74 "main.c"
}


function _sigindie($n) {
  ;
  var __label__;

  var $n_addr;
  $n_addr=$n;
  var $0=$n_addr; //@line 80 "main.c"
  $n_addr=$0; //@line 80 "main.c"
  _sig_die(((STRING_TABLE.__str1148)|0), 0); //@line 81 "main.c"
  ;
  return; //@line 82 "main.c"
}


function _sigtdie($n) {
  ;
  var __label__;

  var $n_addr;
  $n_addr=$n;
  var $0=$n_addr; //@line 86 "main.c"
  $n_addr=$0; //@line 86 "main.c"
  _sig_die(((STRING_TABLE.__str147)|0), 0); //@line 87 "main.c"
  ;
  return; //@line 88 "main.c"
}


function _main($argc, $argv) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $argc_addr;
      var $argv_addr;
      $retval=0;
      $argc_addr=$argc;
      $argv_addr=$argv;
      var $0=$argc_addr; //@line 113 "main.c"
      HEAP32[((_xargc)>>2)]=$0; //@line 113 "main.c"
      var $1=$argv_addr; //@line 114 "main.c"
      HEAP32[((_xargv)>>2)]=$1; //@line 114 "main.c"
      var $call=_signal(8, 2); //@line 115 "main.c"
      var $call1=_signal(6, 4); //@line 117 "main.c"
      var $call2=_signal(5, 6); //@line 120 "main.c"
      var $call3=_signal(3, 8); //@line 123 "main.c"
      var $cmp=(($call3)|0)==1; //@line 123 "main.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 123 "main.c"
    case 3: 
      var $call4=_signal(3, 1); //@line 124 "main.c"
      __label__ = 4; break; //@line 124 "main.c"
    case 4: 
      var $call5=_signal(2, 10); //@line 126 "main.c"
      var $cmp6=(($call5)|0)==1; //@line 126 "main.c"
      if ($cmp6) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 126 "main.c"
    case 5: 
      var $call8=_signal(2, 1); //@line 127 "main.c"
      __label__ = 6; break; //@line 127 "main.c"
    case 6: 
      var $call10=_signal(15, 12); //@line 128 "main.c"
      _f_init(); //@line 134 "main.c"
      var $call11=_atexit(14); //@line 136 "main.c"
      var $call12=_MAIN__(); //@line 138 "main.c"
      _exit(0); //@line 142 "main.c"
      throw "Reached an unreachable!" //@line 142 "main.c"
    case 7: 
      var $2=$retval; //@line 145 "main.c"
      ;
      return $2; //@line 145 "main.c"
    default: assert(0, "bad label: " + __label__);
  }
}
Module["_main"] = _main;

function _f__putbuf($c) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $c_addr;
      var $s;
      var $se;
      var $n;
      $c_addr=$c;
      var $0=HEAP32[((_f__hiwater)>>2)]; //@line 80 "open.c"
      var $1=HEAP32[((_f__recpos)>>2)]; //@line 80 "open.c"
      var $cmp=(($0)|0) > (($1)|0); //@line 80 "open.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 80 "open.c"
    case 3: 
      var $2=HEAP32[((_f__hiwater)>>2)]; //@line 81 "open.c"
      HEAP32[((_f__recpos)>>2)]=$2; //@line 81 "open.c"
      __label__ = 4; break; //@line 81 "open.c"
    case 4: 
      var $3=HEAP32[((_f__recpos)>>2)]; //@line 82 "open.c"
      var $add=((($3)+(1))|0); //@line 82 "open.c"
      $n=$add; //@line 82 "open.c"
      var $4=$n; //@line 83 "open.c"
      var $5=HEAP32[((_f__buflen)>>2)]; //@line 83 "open.c"
      var $cmp1=(($4)|0) >= (($5)|0); //@line 83 "open.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 83 "open.c"
    case 5: 
      var $6=$n; //@line 84 "open.c"
      var $7=HEAP32[((_f__recpos)>>2)]; //@line 84 "open.c"
      _f__bufadj($6, $7); //@line 84 "open.c"
      __label__ = 6; break; //@line 84 "open.c"
    case 6: 
      var $8=HEAP32[((_f__buf)>>2)]; //@line 85 "open.c"
      $s=$8; //@line 85 "open.c"
      var $9=$s; //@line 86 "open.c"
      var $10=HEAP32[((_f__recpos)>>2)]; //@line 86 "open.c"
      var $add_ptr=(($9+$10)|0); //@line 86 "open.c"
      $se=$add_ptr; //@line 86 "open.c"
      var $11=$c_addr; //@line 87 "open.c"
      var $tobool=(($11)|0)!=0; //@line 87 "open.c"
      if ($tobool) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 87 "open.c"
    case 7: 
      var $12=$c_addr; //@line 88 "open.c"
      var $conv=(($12) & 255); //@line 88 "open.c"
      var $13=$se; //@line 88 "open.c"
      var $incdec_ptr=(($13+1)|0); //@line 88 "open.c"
      $se=$incdec_ptr; //@line 88 "open.c"
      HEAP8[($13)]=$conv; //@line 88 "open.c"
      __label__ = 8; break; //@line 88 "open.c"
    case 8: 
      var $14=$se; //@line 89 "open.c"
      HEAP8[($14)]=0; //@line 89 "open.c"
      __label__ = 9; break; //@line 90 "open.c"
    case 9: 
      var $15=$s; //@line 91 "open.c"
      var $16=HEAP32[((_f__cf)>>2)]; //@line 91 "open.c"
      var $call=_fputs($15, $16); //@line 91 "open.c"
      var $17=$s; //@line 92 "open.c"
      var $call6=_strlen($17); //@line 92 "open.c"
      var $18=$s; //@line 92 "open.c"
      var $add_ptr7=(($18+$call6)|0); //@line 92 "open.c"
      $s=$add_ptr7; //@line 92 "open.c"
      var $19=$s; //@line 93 "open.c"
      var $20=$se; //@line 93 "open.c"
      var $cmp8=(($19)>>>0) >= (($20)>>>0); //@line 93 "open.c"
      if ($cmp8) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 93 "open.c"
    case 10: 
      __label__ = 12; break; //@line 94 "open.c"
    case 11: 
      var $21=$s; //@line 95 "open.c"
      var $incdec_ptr12=(($21+1)|0); //@line 95 "open.c"
      $s=$incdec_ptr12; //@line 95 "open.c"
      var $22=HEAP8[($21)]; //@line 95 "open.c"
      var $conv13=(($22 << 24) >> 24); //@line 95 "open.c"
      var $23=HEAP32[((_f__cf)>>2)]; //@line 95 "open.c"
      var $call14=_putc($conv13, $23); //@line 95 "open.c"
      __label__ = 9; break; //@line 96 "open.c"
    case 12: 
      ;
      return 0; //@line 97 "open.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_f__putbuf["X"]=1;

function _f__bufadj($n, $c) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $n_addr;
      var $c_addr;
      var $len;
      var $nbuf;
      var $s;
      var $t;
      var $te;
      $n_addr=$n;
      $c_addr=$c;
      var $0=HEAP32[((_f__buf)>>2)]; //@line 53 "open.c"
      var $cmp=(($0)|0)==(((((_f__buf0)|0)))|0); //@line 53 "open.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 53 "open.c"
    case 3: 
      HEAP32[((_f__buflen)>>2)]=1024; //@line 54 "open.c"
      __label__ = 4; break; //@line 54 "open.c"
    case 4: 
      __label__ = 5; break; //@line 55 "open.c"
    case 5: 
      var $1=HEAP32[((_f__buflen)>>2)]; //@line 55 "open.c"
      var $2=$n_addr; //@line 55 "open.c"
      var $cmp1=(($1)|0) <= (($2)|0); //@line 55 "open.c"
      if ($cmp1) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 55 "open.c"
    case 6: 
      var $3=HEAP32[((_f__buflen)>>2)]; //@line 56 "open.c"
      var $shl=$3 << 1; //@line 56 "open.c"
      HEAP32[((_f__buflen)>>2)]=$shl; //@line 56 "open.c"
      __label__ = 5; break; //@line 56 "open.c"
    case 7: 
      var $4=HEAP32[((_f__buflen)>>2)]; //@line 57 "open.c"
      $len=$4; //@line 57 "open.c"
      var $5=$len; //@line 58 "open.c"
      var $6=HEAP32[((_f__buflen)>>2)]; //@line 58 "open.c"
      var $cmp2=(($5)|0)!=(($6)|0); //@line 58 "open.c"
      if ($cmp2) { __label__ = 9; break; } else { __label__ = 8; break; } //@line 58 "open.c"
    case 8: 
      var $7=$len; //@line 58 "open.c"
      var $call=_malloc($7); //@line 58 "open.c"
      $nbuf=$call; //@line 58 "open.c"
      var $tobool=(($call)|0)!=0; //@line 58 "open.c"
      if ($tobool) { __label__ = 10; break; } else { __label__ = 9; break; } //@line 58 "open.c"
    case 9: 
      _f__fatal(113, ((STRING_TABLE.__str13170)|0)); //@line 59 "open.c"
      __label__ = 10; break; //@line 59 "open.c"
    case 10: 
      var $8=$nbuf; //@line 60 "open.c"
      $s=$8; //@line 60 "open.c"
      var $9=HEAP32[((_f__buf)>>2)]; //@line 61 "open.c"
      $t=$9; //@line 61 "open.c"
      var $10=$t; //@line 62 "open.c"
      var $11=$c_addr; //@line 62 "open.c"
      var $add_ptr=(($10+$11)|0); //@line 62 "open.c"
      $te=$add_ptr; //@line 62 "open.c"
      __label__ = 11; break; //@line 63 "open.c"
    case 11: 
      var $12=$t; //@line 63 "open.c"
      var $13=$te; //@line 63 "open.c"
      var $cmp6=(($12)>>>0) < (($13)>>>0); //@line 63 "open.c"
      if ($cmp6) { __label__ = 12; break; } else { __label__ = 13; break; } //@line 63 "open.c"
    case 12: 
      var $14=$t; //@line 64 "open.c"
      var $incdec_ptr=(($14+1)|0); //@line 64 "open.c"
      $t=$incdec_ptr; //@line 64 "open.c"
      var $15=HEAP8[($14)]; //@line 64 "open.c"
      var $16=$s; //@line 64 "open.c"
      var $incdec_ptr8=(($16+1)|0); //@line 64 "open.c"
      $s=$incdec_ptr8; //@line 64 "open.c"
      HEAP8[($16)]=$15; //@line 64 "open.c"
      __label__ = 11; break; //@line 64 "open.c"
    case 13: 
      var $17=HEAP32[((_f__buf)>>2)]; //@line 65 "open.c"
      var $cmp10=(($17)|0)!=(((((_f__buf0)|0)))|0); //@line 65 "open.c"
      if ($cmp10) { __label__ = 14; break; } else { __label__ = 15; break; } //@line 65 "open.c"
    case 14: 
      var $18=HEAP32[((_f__buf)>>2)]; //@line 66 "open.c"
      _free($18); //@line 66 "open.c"
      __label__ = 15; break; //@line 66 "open.c"
    case 15: 
      var $19=$nbuf; //@line 67 "open.c"
      HEAP32[((_f__buf)>>2)]=$19; //@line 67 "open.c"
      ;
      return; //@line 68 "open.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_f__bufadj["X"]=1;

function _x_putc($c) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $c_addr;
      $c_addr=$c;
      var $0=HEAP32[((_f__recpos)>>2)]; //@line 107 "open.c"
      var $1=HEAP32[((_f__buflen)>>2)]; //@line 107 "open.c"
      var $cmp=(($0)|0) >= (($1)|0); //@line 107 "open.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 107 "open.c"
    case 3: 
      var $2=HEAP32[((_f__recpos)>>2)]; //@line 108 "open.c"
      var $3=HEAP32[((_f__buflen)>>2)]; //@line 108 "open.c"
      _f__bufadj($2, $3); //@line 108 "open.c"
      __label__ = 4; break; //@line 108 "open.c"
    case 4: 
      var $4=$c_addr; //@line 109 "open.c"
      var $conv=(($4) & 255); //@line 109 "open.c"
      var $5=HEAP32[((_f__recpos)>>2)]; //@line 109 "open.c"
      var $inc=((($5)+(1))|0); //@line 109 "open.c"
      HEAP32[((_f__recpos)>>2)]=$inc; //@line 109 "open.c"
      var $6=HEAP32[((_f__buf)>>2)]; //@line 109 "open.c"
      var $arrayidx=(($6+$5)|0); //@line 109 "open.c"
      HEAP8[($arrayidx)]=$conv; //@line 109 "open.c"
      ;
      return; //@line 110 "open.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _f_open($a) {
  var __stackBase__  = STACKTOP; STACKTOP += 268; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $a_addr;
      var $b;
      var $rv;
      var $buf=__stackBase__;
      var $s;
      var $x=(__stackBase__)+(256);
      var $ufmt;
      var $tf;
      $a_addr=$a;
      HEAP32[((_f__external)>>2)]=1; //@line 144 "open.c"
      var $0=$a_addr; //@line 145 "open.c"
      var $ounit=(($0+4)|0); //@line 145 "open.c"
      var $1=HEAP32[(($ounit)>>2)]; //@line 145 "open.c"
      var $cmp=(($1)|0) >= 100; //@line 145 "open.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 3; break; } //@line 145 "open.c"
    case 3: 
      var $2=$a_addr; //@line 145 "open.c"
      var $ounit1=(($2+4)|0); //@line 145 "open.c"
      var $3=HEAP32[(($ounit1)>>2)]; //@line 145 "open.c"
      var $cmp2=(($3)|0) < 0; //@line 145 "open.c"
      if ($cmp2) { __label__ = 4; break; } else { __label__ = 8; break; } //@line 145 "open.c"
    case 4: 
      var $4=$a_addr; //@line 146 "open.c"
      var $oerr=(($4)|0); //@line 146 "open.c"
      var $5=HEAP32[(($oerr)>>2)]; //@line 146 "open.c"
      var $tobool=(($5)|0)!=0; //@line 146 "open.c"
      if ($tobool) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 146 "open.c"
    case 5: 
      var $call=___errno(); //@line 146 "open.c"
      HEAP32[(($call)>>2)]=101; //@line 146 "open.c"
      __label__ = 7; break; //@line 146 "open.c"
    case 6: 
      _f__fatal(101, ((STRING_TABLE.__str6163)|0)); //@line 146 "open.c"
      __label__ = 7; break;
    case 7: 
      $retval=101; //@line 146 "open.c"
      __label__ = 105; break; //@line 146 "open.c"
    case 8: 
      var $6=HEAP32[((_f__init)>>2)]; //@line 147 "open.c"
      var $tobool5=(($6)|0)!=0; //@line 147 "open.c"
      if ($tobool5) { __label__ = 10; break; } else { __label__ = 9; break; } //@line 147 "open.c"
    case 9: 
      _f_init(); //@line 148 "open.c"
      __label__ = 10; break; //@line 148 "open.c"
    case 10: 
      var $7=$a_addr; //@line 149 "open.c"
      var $ounit8=(($7+4)|0); //@line 149 "open.c"
      var $8=HEAP32[(($ounit8)>>2)]; //@line 149 "open.c"
      var $arrayidx=((_f__units+($8)*(48))|0); //@line 149 "open.c"
      $b=$arrayidx; //@line 149 "open.c"
      HEAP32[((_f__curunit)>>2)]=$arrayidx; //@line 149 "open.c"
      var $9=$b; //@line 150 "open.c"
      var $ufd=(($9)|0); //@line 150 "open.c"
      var $10=HEAP32[(($ufd)>>2)]; //@line 150 "open.c"
      var $tobool9=(($10)|0)!=0; //@line 150 "open.c"
      if ($tobool9) { __label__ = 11; break; } else { __label__ = 25; break; } //@line 150 "open.c"
    case 11: 
      var $11=$a_addr; //@line 151 "open.c"
      var $ofnm=(($11+8)|0); //@line 151 "open.c"
      var $12=HEAP32[(($ofnm)>>2)]; //@line 151 "open.c"
      var $cmp11=(($12)|0)==0; //@line 151 "open.c"
      if ($cmp11) { __label__ = 12; break; } else { __label__ = 18; break; } //@line 151 "open.c"
    case 12: 
      __label__ = 13; break; //@line 152 "open.c"
    case 13: 
      var $13=$a_addr; //@line 153 "open.c"
      var $oblnk=(($13+32)|0); //@line 153 "open.c"
      var $14=HEAP32[(($oblnk)>>2)]; //@line 153 "open.c"
      var $tobool13=(($14)|0)!=0; //@line 153 "open.c"
      if ($tobool13) { __label__ = 14; break; } else { __label__ = 17; break; } //@line 153 "open.c"
    case 14: 
      var $15=$a_addr; //@line 154 "open.c"
      var $oblnk15=(($15+32)|0); //@line 154 "open.c"
      var $16=HEAP32[(($oblnk15)>>2)]; //@line 154 "open.c"
      var $17=HEAP8[($16)]; //@line 154 "open.c"
      var $conv=(($17 << 24) >> 24); //@line 154 "open.c"
      var $cmp16=(($conv)|0)==122; //@line 154 "open.c"
      if ($cmp16) { var $21 = 1;__label__ = 16; break; } else { __label__ = 15; break; } //@line 154 "open.c"
    case 15: 
      var $18=$a_addr; //@line 154 "open.c"
      var $oblnk18=(($18+32)|0); //@line 154 "open.c"
      var $19=HEAP32[(($oblnk18)>>2)]; //@line 154 "open.c"
      var $20=HEAP8[($19)]; //@line 154 "open.c"
      var $conv19=(($20 << 24) >> 24); //@line 154 "open.c"
      var $cmp20=(($conv19)|0)==90; //@line 154 "open.c"
      var $21 = $cmp20;__label__ = 16; break; //@line 154 "open.c"
    case 16: 
      var $21;
      var $lor_ext=(($21)&1); //@line 154 "open.c"
      var $22=$b; //@line 154 "open.c"
      var $ublnk=(($22+32)|0); //@line 154 "open.c"
      HEAP32[(($ublnk)>>2)]=$lor_ext; //@line 154 "open.c"
      __label__ = 17; break; //@line 154 "open.c"
    case 17: 
      $retval=0; //@line 155 "open.c"
      __label__ = 105; break; //@line 155 "open.c"
    case 18: 
      var $23=$b; //@line 158 "open.c"
      var $ufnm=(($23+4)|0); //@line 158 "open.c"
      var $24=HEAP32[(($ufnm)>>2)]; //@line 158 "open.c"
      var $tobool24=(($24)|0)!=0; //@line 158 "open.c"
      if ($tobool24) { __label__ = 19; break; } else { __label__ = 22; break; } //@line 158 "open.c"
    case 19: 
      var $25=$b; //@line 159 "open.c"
      var $ufnm25=(($25+4)|0); //@line 159 "open.c"
      var $26=HEAP32[(($ufnm25)>>2)]; //@line 159 "open.c"
      var $call26=_strlen($26); //@line 159 "open.c"
      var $27=$a_addr; //@line 159 "open.c"
      var $ofnmlen=(($27+12)|0); //@line 159 "open.c"
      var $28=HEAP32[(($ofnmlen)>>2)]; //@line 159 "open.c"
      var $cmp27=(($call26)|0)==(($28)|0); //@line 159 "open.c"
      if ($cmp27) { __label__ = 20; break; } else { __label__ = 22; break; } //@line 159 "open.c"
    case 20: 
      var $29=$b; //@line 160 "open.c"
      var $ufnm30=(($29+4)|0); //@line 160 "open.c"
      var $30=HEAP32[(($ufnm30)>>2)]; //@line 160 "open.c"
      var $31=$a_addr; //@line 160 "open.c"
      var $ofnm31=(($31+8)|0); //@line 160 "open.c"
      var $32=HEAP32[(($ofnm31)>>2)]; //@line 160 "open.c"
      var $33=$a_addr; //@line 160 "open.c"
      var $ofnmlen32=(($33+12)|0); //@line 160 "open.c"
      var $34=HEAP32[(($ofnmlen32)>>2)]; //@line 160 "open.c"
      var $call33=_strncmp($30, $32, $34); //@line 160 "open.c"
      var $tobool34=(($call33)|0)!=0; //@line 160 "open.c"
      if ($tobool34) { __label__ = 22; break; } else { __label__ = 21; break; } //@line 160 "open.c"
    case 21: 
      __label__ = 13; break; //@line 161 "open.c"
    case 22: 
      var $35=$a_addr; //@line 167 "open.c"
      var $ounit37=(($35+4)|0); //@line 167 "open.c"
      var $36=HEAP32[(($ounit37)>>2)]; //@line 167 "open.c"
      var $cunit=(($x+4)|0); //@line 167 "open.c"
      HEAP32[(($cunit)>>2)]=$36; //@line 167 "open.c"
      var $csta=(($x+8)|0); //@line 168 "open.c"
      HEAP32[(($csta)>>2)]=0; //@line 168 "open.c"
      var $37=$a_addr; //@line 169 "open.c"
      var $oerr38=(($37)|0); //@line 169 "open.c"
      var $38=HEAP32[(($oerr38)>>2)]; //@line 169 "open.c"
      var $cerr=(($x)|0); //@line 169 "open.c"
      HEAP32[(($cerr)>>2)]=$38; //@line 169 "open.c"
      var $call39=_f_clos($x); //@line 170 "open.c"
      $rv=$call39; //@line 170 "open.c"
      var $cmp40=(($call39)|0)!=0; //@line 170 "open.c"
      if ($cmp40) { __label__ = 23; break; } else { __label__ = 24; break; } //@line 170 "open.c"
    case 23: 
      var $39=$rv; //@line 171 "open.c"
      $retval=$39; //@line 171 "open.c"
      __label__ = 105; break; //@line 171 "open.c"
    case 24: 
      __label__ = 25; break; //@line 172 "open.c"
    case 25: 
      var $40=$a_addr; //@line 173 "open.c"
      var $orl=(($40+28)|0); //@line 173 "open.c"
      var $41=HEAP32[(($orl)>>2)]; //@line 173 "open.c"
      var $42=$b; //@line 173 "open.c"
      var $url=(($42+16)|0); //@line 173 "open.c"
      HEAP32[(($url)>>2)]=$41; //@line 173 "open.c"
      var $43=$a_addr; //@line 174 "open.c"
      var $oblnk45=(($43+32)|0); //@line 174 "open.c"
      var $44=HEAP32[(($oblnk45)>>2)]; //@line 174 "open.c"
      var $tobool46=(($44)|0)!=0; //@line 174 "open.c"
      if ($tobool46) { __label__ = 26; break; } else { var $52 = 0;__label__ = 29; break; } //@line 174 "open.c"
    case 26: 
      var $45=$a_addr; //@line 174 "open.c"
      var $oblnk47=(($45+32)|0); //@line 174 "open.c"
      var $46=HEAP32[(($oblnk47)>>2)]; //@line 174 "open.c"
      var $47=HEAP8[($46)]; //@line 174 "open.c"
      var $conv48=(($47 << 24) >> 24); //@line 174 "open.c"
      var $cmp49=(($conv48)|0)==122; //@line 174 "open.c"
      if ($cmp49) { var $51 = 1;__label__ = 28; break; } else { __label__ = 27; break; } //@line 174 "open.c"
    case 27: 
      var $48=$a_addr; //@line 174 "open.c"
      var $oblnk52=(($48+32)|0); //@line 174 "open.c"
      var $49=HEAP32[(($oblnk52)>>2)]; //@line 174 "open.c"
      var $50=HEAP8[($49)]; //@line 174 "open.c"
      var $conv53=(($50 << 24) >> 24); //@line 174 "open.c"
      var $cmp54=(($conv53)|0)==90; //@line 174 "open.c"
      var $51 = $cmp54;__label__ = 28; break; //@line 174 "open.c"
    case 28: 
      var $51;
      var $52 = $51;__label__ = 29; break;
    case 29: 
      var $52;
      var $land_ext=(($52)&1);
      var $53=$b;
      var $ublnk58=(($53+32)|0);
      HEAP32[(($ublnk58)>>2)]=$land_ext;
      var $54=$a_addr; //@line 175 "open.c"
      var $ofm=(($54+24)|0); //@line 175 "open.c"
      var $55=HEAP32[(($ofm)>>2)]; //@line 175 "open.c"
      var $cmp59=(($55)|0)==0; //@line 175 "open.c"
      if ($cmp59) { __label__ = 30; break; } else { __label__ = 34; break; } //@line 175 "open.c"
    case 30: 
      var $56=$b; //@line 176 "open.c"
      var $url62=(($56+16)|0); //@line 176 "open.c"
      var $57=HEAP32[(($url62)>>2)]; //@line 176 "open.c"
      var $cmp63=(($57)|0) > 0; //@line 176 "open.c"
      if ($cmp63) { __label__ = 31; break; } else { __label__ = 32; break; } //@line 176 "open.c"
    case 31: 
      var $58=$b; //@line 176 "open.c"
      var $ufmt66=(($58+24)|0); //@line 176 "open.c"
      HEAP32[(($ufmt66)>>2)]=0; //@line 176 "open.c"
      __label__ = 33; break; //@line 176 "open.c"
    case 32: 
      var $59=$b; //@line 177 "open.c"
      var $ufmt68=(($59+24)|0); //@line 177 "open.c"
      HEAP32[(($ufmt68)>>2)]=1; //@line 177 "open.c"
      __label__ = 33; break;
    case 33: 
      __label__ = 39; break; //@line 178 "open.c"
    case 34: 
      var $60=$a_addr; //@line 179 "open.c"
      var $ofm71=(($60+24)|0); //@line 179 "open.c"
      var $61=HEAP32[(($ofm71)>>2)]; //@line 179 "open.c"
      var $62=HEAP8[($61)]; //@line 179 "open.c"
      var $conv72=(($62 << 24) >> 24); //@line 179 "open.c"
      var $cmp73=(($conv72)|0)==102; //@line 179 "open.c"
      if ($cmp73) { __label__ = 36; break; } else { __label__ = 35; break; } //@line 179 "open.c"
    case 35: 
      var $63=$a_addr; //@line 179 "open.c"
      var $ofm76=(($63+24)|0); //@line 179 "open.c"
      var $64=HEAP32[(($ofm76)>>2)]; //@line 179 "open.c"
      var $65=HEAP8[($64)]; //@line 179 "open.c"
      var $conv77=(($65 << 24) >> 24); //@line 179 "open.c"
      var $cmp78=(($conv77)|0)==70; //@line 179 "open.c"
      if ($cmp78) { __label__ = 36; break; } else { __label__ = 37; break; } //@line 179 "open.c"
    case 36: 
      var $66=$b; //@line 179 "open.c"
      var $ufmt81=(($66+24)|0); //@line 179 "open.c"
      HEAP32[(($ufmt81)>>2)]=1; //@line 179 "open.c"
      __label__ = 38; break; //@line 179 "open.c"
    case 37: 
      var $67=$b; //@line 180 "open.c"
      var $ufmt83=(($67+24)|0); //@line 180 "open.c"
      HEAP32[(($ufmt83)>>2)]=0; //@line 180 "open.c"
      __label__ = 38; break;
    case 38: 
      __label__ = 39; break;
    case 39: 
      var $68=$b; //@line 181 "open.c"
      var $ufmt86=(($68+24)|0); //@line 181 "open.c"
      var $69=HEAP32[(($ufmt86)>>2)]; //@line 181 "open.c"
      $ufmt=$69; //@line 181 "open.c"
      var $70=$a_addr; //@line 186 "open.c"
      var $ofnm87=(($70+8)|0); //@line 186 "open.c"
      var $71=HEAP32[(($ofnm87)>>2)]; //@line 186 "open.c"
      var $tobool88=(($71)|0)!=0; //@line 186 "open.c"
      if ($tobool88) { __label__ = 40; break; } else { __label__ = 46; break; } //@line 186 "open.c"
    case 40: 
      var $72=$a_addr; //@line 187 "open.c"
      var $ofnm90=(($72+8)|0); //@line 187 "open.c"
      var $73=HEAP32[(($ofnm90)>>2)]; //@line 187 "open.c"
      var $74=$a_addr; //@line 187 "open.c"
      var $ofnmlen91=(($74+12)|0); //@line 187 "open.c"
      var $75=HEAP32[(($ofnmlen91)>>2)]; //@line 187 "open.c"
      var $arraydecay=(($buf)|0); //@line 187 "open.c"
      _g_char($73, $75, $arraydecay); //@line 187 "open.c"
      var $arrayidx92=(($buf)|0); //@line 188 "open.c"
      var $76=HEAP8[($arrayidx92)]; //@line 188 "open.c"
      var $tobool93=(($76 << 24) >> 24)!=0; //@line 188 "open.c"
      if ($tobool93) { __label__ = 45; break; } else { __label__ = 41; break; } //@line 188 "open.c"
    case 41: 
      var $77=$a_addr; //@line 189 "open.c"
      var $oerr95=(($77)|0); //@line 189 "open.c"
      var $78=HEAP32[(($oerr95)>>2)]; //@line 189 "open.c"
      var $tobool96=(($78)|0)!=0; //@line 189 "open.c"
      if ($tobool96) { __label__ = 42; break; } else { __label__ = 43; break; } //@line 189 "open.c"
    case 42: 
      var $call98=___errno(); //@line 189 "open.c"
      HEAP32[(($call98)>>2)]=107; //@line 189 "open.c"
      __label__ = 44; break; //@line 189 "open.c"
    case 43: 
      var $79=$a_addr; //@line 189 "open.c"
      _opn_err(107, ((STRING_TABLE.__str6163)|0), $79); //@line 189 "open.c"
      __label__ = 44; break;
    case 44: 
      $retval=107; //@line 189 "open.c"
      __label__ = 105; break; //@line 189 "open.c"
    case 45: 
      __label__ = 47; break; //@line 190 "open.c"
    case 46: 
      var $arraydecay103=(($buf)|0); //@line 192 "open.c"
      var $80=$a_addr; //@line 192 "open.c"
      var $ounit104=(($80+4)|0); //@line 192 "open.c"
      var $81=HEAP32[(($ounit104)>>2)]; //@line 192 "open.c"
      var $call105=_sprintf($arraydecay103, ((STRING_TABLE.__str7164)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$81,tempInt)); //@line 192 "open.c"
      __label__ = 47; break;
    case 47: 
      var $82=$b; //@line 193 "open.c"
      var $uscrtch=(($82+44)|0); //@line 193 "open.c"
      HEAP32[(($uscrtch)>>2)]=0; //@line 193 "open.c"
      var $83=$b; //@line 194 "open.c"
      var $uend=(($83+36)|0); //@line 194 "open.c"
      HEAP32[(($uend)>>2)]=0; //@line 194 "open.c"
      var $84=$b; //@line 195 "open.c"
      var $uwrt=(($84+40)|0); //@line 195 "open.c"
      HEAP32[(($uwrt)>>2)]=0; //@line 195 "open.c"
      var $85=$b; //@line 196 "open.c"
      var $ufd107=(($85)|0); //@line 196 "open.c"
      HEAP32[(($ufd107)>>2)]=0; //@line 196 "open.c"
      var $86=$b; //@line 197 "open.c"
      var $urw=(($86+28)|0); //@line 197 "open.c"
      HEAP32[(($urw)>>2)]=3; //@line 197 "open.c"
      var $87=$a_addr; //@line 198 "open.c"
      var $osta=(($87+16)|0); //@line 198 "open.c"
      var $88=HEAP32[(($osta)>>2)]; //@line 198 "open.c"
      var $tobool108=(($88)|0)!=0; //@line 198 "open.c"
      if ($tobool108) { __label__ = 48; break; } else { __label__ = 49; break; } //@line 198 "open.c"
    case 48: 
      var $89=$a_addr; //@line 198 "open.c"
      var $osta109=(($89+16)|0); //@line 198 "open.c"
      var $90=HEAP32[(($osta109)>>2)]; //@line 198 "open.c"
      var $91=HEAP8[($90)]; //@line 198 "open.c"
      var $conv110=(($91 << 24) >> 24); //@line 198 "open.c"
      var $cond = $conv110;__label__ = 50; break; //@line 198 "open.c"
    case 49: 
      var $cond = 117;__label__ = 50; break; //@line 198 "open.c"
    case 50: 
      var $cond; //@line 198 "open.c"
      if ((($cond)|0) == 111 || (($cond)|0) == 79) {
        __label__ = 51; break;
      }
      else if ((($cond)|0) == 115 || (($cond)|0) == 83) {
        __label__ = 57; break;
      }
      else if ((($cond)|0) == 110 || (($cond)|0) == 78) {
        __label__ = 63; break;
      }
      else if ((($cond)|0) == 114 || (($cond)|0) == 82) {
        __label__ = 69; break;
      }
      else {
      __label__ = 72; break;
      }
      
    case 51: 
      var $arraydecay111=(($buf)|0); //@line 207 "open.c"
      var $call112=_access($arraydecay111, 0); //@line 207 "open.c"
      var $tobool113=(($call112)|0)!=0; //@line 207 "open.c"
      if ($tobool113) { __label__ = 52; break; } else { __label__ = 56; break; } //@line 207 "open.c"
    case 52: 
      var $92=$a_addr; //@line 208 "open.c"
      var $oerr115=(($92)|0); //@line 208 "open.c"
      var $93=HEAP32[(($oerr115)>>2)]; //@line 208 "open.c"
      var $tobool116=(($93)|0)!=0; //@line 208 "open.c"
      if ($tobool116) { __label__ = 53; break; } else { __label__ = 54; break; } //@line 208 "open.c"
    case 53: 
      var $call118=___errno(); //@line 208 "open.c"
      var $94=HEAP32[(($call118)>>2)]; //@line 208 "open.c"
      var $call119=___errno(); //@line 208 "open.c"
      HEAP32[(($call119)>>2)]=$94; //@line 208 "open.c"
      __label__ = 55; break; //@line 208 "open.c"
    case 54: 
      var $call121=___errno(); //@line 208 "open.c"
      var $95=HEAP32[(($call121)>>2)]; //@line 208 "open.c"
      var $96=$a_addr; //@line 208 "open.c"
      _opn_err($95, ((STRING_TABLE.__str6163)|0), $96); //@line 208 "open.c"
      __label__ = 55; break;
    case 55: 
      var $call123=___errno(); //@line 208 "open.c"
      var $97=HEAP32[(($call123)>>2)]; //@line 208 "open.c"
      $retval=$97; //@line 208 "open.c"
      __label__ = 105; break; //@line 208 "open.c"
    case 56: 
      __label__ = 72; break; //@line 210 "open.c"
    case 57: 
      var $98=$b; //@line 213 "open.c"
      var $uscrtch126=(($98+44)|0); //@line 213 "open.c"
      HEAP32[(($uscrtch126)>>2)]=1; //@line 213 "open.c"
      var $call127=_tmpfile(); //@line 219 "open.c"
      var $99=$b; //@line 219 "open.c"
      var $ufd128=(($99)|0); //@line 219 "open.c"
      HEAP32[(($ufd128)>>2)]=$call127; //@line 219 "open.c"
      var $tobool129=(($call127)|0)!=0; //@line 219 "open.c"
      if ($tobool129) { __label__ = 62; break; } else { __label__ = 58; break; } //@line 219 "open.c"
    case 58: 
      var $100=$a_addr; //@line 220 "open.c"
      var $oerr131=(($100)|0); //@line 220 "open.c"
      var $101=HEAP32[(($oerr131)>>2)]; //@line 220 "open.c"
      var $tobool132=(($101)|0)!=0; //@line 220 "open.c"
      if ($tobool132) { __label__ = 59; break; } else { __label__ = 60; break; } //@line 220 "open.c"
    case 59: 
      var $call134=___errno(); //@line 220 "open.c"
      var $102=HEAP32[(($call134)>>2)]; //@line 220 "open.c"
      var $call135=___errno(); //@line 220 "open.c"
      HEAP32[(($call135)>>2)]=$102; //@line 220 "open.c"
      __label__ = 61; break; //@line 220 "open.c"
    case 60: 
      var $call137=___errno(); //@line 220 "open.c"
      var $103=HEAP32[(($call137)>>2)]; //@line 220 "open.c"
      var $104=$a_addr; //@line 220 "open.c"
      _opn_err($103, ((STRING_TABLE.__str6163)|0), $104); //@line 220 "open.c"
      __label__ = 61; break;
    case 61: 
      var $call139=___errno(); //@line 220 "open.c"
      var $105=HEAP32[(($call139)>>2)]; //@line 220 "open.c"
      $retval=$105; //@line 220 "open.c"
      __label__ = 105; break; //@line 220 "open.c"
    case 62: 
      var $106=$b; //@line 221 "open.c"
      var $ufnm141=(($106+4)|0); //@line 221 "open.c"
      HEAP32[(($ufnm141)>>2)]=0; //@line 221 "open.c"
      var $107=$b; //@line 225 "open.c"
      var $useek=(($107+20)|0); //@line 225 "open.c"
      HEAP32[(($useek)>>2)]=1; //@line 225 "open.c"
      $retval=0; //@line 226 "open.c"
      __label__ = 105; break; //@line 226 "open.c"
    case 63: 
      var $arraydecay143=(($buf)|0); //@line 237 "open.c"
      var $call144=_access($arraydecay143, 0); //@line 237 "open.c"
      var $tobool145=(($call144)|0)!=0; //@line 237 "open.c"
      if ($tobool145) { __label__ = 68; break; } else { __label__ = 64; break; } //@line 237 "open.c"
    case 64: 
      var $108=$a_addr; //@line 238 "open.c"
      var $oerr147=(($108)|0); //@line 238 "open.c"
      var $109=HEAP32[(($oerr147)>>2)]; //@line 238 "open.c"
      var $tobool148=(($109)|0)!=0; //@line 238 "open.c"
      if ($tobool148) { __label__ = 65; break; } else { __label__ = 66; break; } //@line 238 "open.c"
    case 65: 
      var $call150=___errno(); //@line 238 "open.c"
      HEAP32[(($call150)>>2)]=128; //@line 238 "open.c"
      __label__ = 67; break; //@line 238 "open.c"
    case 66: 
      var $110=$a_addr; //@line 238 "open.c"
      _opn_err(128, ((STRING_TABLE.__str6163)|0), $110); //@line 238 "open.c"
      __label__ = 67; break;
    case 67: 
      $retval=128; //@line 238 "open.c"
      __label__ = 105; break; //@line 238 "open.c"
    case 68: 
      __label__ = 69; break; //@line 238 "open.c"
    case 69: 
      var $arraydecay155=(($buf)|0); //@line 246 "open.c"
      var $111=HEAP32[((((_f__w_mode)|0))>>2)]; //@line 246 "open.c"
      var $call156=_fopen($arraydecay155, $111); //@line 246 "open.c"
      $tf=$call156; //@line 246 "open.c"
      var $tobool157=(($call156)|0)!=0; //@line 246 "open.c"
      if ($tobool157) { __label__ = 70; break; } else { __label__ = 71; break; } //@line 246 "open.c"
    case 70: 
      var $112=$tf; //@line 247 "open.c"
      var $call159=_fclose($112); //@line 247 "open.c"
      __label__ = 71; break; //@line 247 "open.c"
    case 71: 
      __label__ = 72; break; //@line 248 "open.c"
    case 72: 
      var $arraydecay161=(($buf)|0); //@line 250 "open.c"
      var $call162=_strlen($arraydecay161); //@line 250 "open.c"
      var $add=((($call162)+(1))|0); //@line 250 "open.c"
      var $call163=_malloc($add); //@line 250 "open.c"
      var $113=$b; //@line 250 "open.c"
      var $ufnm164=(($113+4)|0); //@line 250 "open.c"
      HEAP32[(($ufnm164)>>2)]=$call163; //@line 250 "open.c"
      var $114=$b; //@line 251 "open.c"
      var $ufnm165=(($114+4)|0); //@line 251 "open.c"
      var $115=HEAP32[(($ufnm165)>>2)]; //@line 251 "open.c"
      var $cmp166=(($115)|0)==0; //@line 251 "open.c"
      if ($cmp166) { __label__ = 73; break; } else { __label__ = 77; break; } //@line 251 "open.c"
    case 73: 
      var $116=$a_addr; //@line 251 "open.c"
      var $oerr169=(($116)|0); //@line 251 "open.c"
      var $117=HEAP32[(($oerr169)>>2)]; //@line 251 "open.c"
      var $tobool170=(($117)|0)!=0; //@line 251 "open.c"
      if ($tobool170) { __label__ = 74; break; } else { __label__ = 75; break; } //@line 251 "open.c"
    case 74: 
      var $call172=___errno(); //@line 251 "open.c"
      HEAP32[(($call172)>>2)]=113; //@line 251 "open.c"
      __label__ = 76; break; //@line 251 "open.c"
    case 75: 
      var $118=$a_addr; //@line 251 "open.c"
      _opn_err(113, ((STRING_TABLE.__str8165)|0), $118); //@line 251 "open.c"
      __label__ = 76; break;
    case 76: 
      $retval=113; //@line 251 "open.c"
      __label__ = 105; break; //@line 251 "open.c"
    case 77: 
      var $119=$b; //@line 252 "open.c"
      var $ufnm176=(($119+4)|0); //@line 252 "open.c"
      var $120=HEAP32[(($ufnm176)>>2)]; //@line 252 "open.c"
      var $arraydecay177=(($buf)|0); //@line 252 "open.c"
      var $call178=_strcpy($120, $arraydecay177); //@line 252 "open.c"
      var $121=$a_addr; //@line 253 "open.c"
      var $oacc=(($121+20)|0); //@line 253 "open.c"
      var $122=HEAP32[(($oacc)>>2)]; //@line 253 "open.c"
      $s=$122; //@line 253 "open.c"
      var $tobool179=(($122)|0)!=0; //@line 253 "open.c"
      if ($tobool179) { __label__ = 78; break; } else { __label__ = 80; break; } //@line 253 "open.c"
    case 78: 
      var $123=$b; //@line 253 "open.c"
      var $url181=(($123+16)|0); //@line 253 "open.c"
      var $124=HEAP32[(($url181)>>2)]; //@line 253 "open.c"
      var $tobool182=(($124)|0)!=0; //@line 253 "open.c"
      if ($tobool182) { __label__ = 79; break; } else { __label__ = 80; break; } //@line 253 "open.c"
    case 79: 
      $ufmt=0; //@line 254 "open.c"
      __label__ = 80; break; //@line 254 "open.c"
    case 80: 
      var $arraydecay185=(($buf)|0); //@line 255 "open.c"
      var $125=$ufmt; //@line 255 "open.c"
      var $or=$125 | 2; //@line 255 "open.c"
      var $arrayidx186=((_f__w_mode+($or<<2))|0); //@line 255 "open.c"
      var $126=HEAP32[(($arrayidx186)>>2)]; //@line 255 "open.c"
      var $call187=_fopen($arraydecay185, $126); //@line 255 "open.c"
      $tf=$call187; //@line 255 "open.c"
      var $tobool188=(($call187)|0)!=0; //@line 255 "open.c"
      if ($tobool188) { __label__ = 91; break; } else { __label__ = 81; break; } //@line 255 "open.c"
    case 81: 
      var $arraydecay190=(($buf)|0); //@line 256 "open.c"
      var $127=$ufmt; //@line 256 "open.c"
      var $arrayidx191=((_f__r_mode+($127<<2))|0); //@line 256 "open.c"
      var $128=HEAP32[(($arrayidx191)>>2)]; //@line 256 "open.c"
      var $call192=_fopen($arraydecay190, $128); //@line 256 "open.c"
      $tf=$call192; //@line 256 "open.c"
      var $tobool193=(($call192)|0)!=0; //@line 256 "open.c"
      if ($tobool193) { __label__ = 82; break; } else { __label__ = 83; break; } //@line 256 "open.c"
    case 82: 
      var $129=$b; //@line 257 "open.c"
      var $urw195=(($129+28)|0); //@line 257 "open.c"
      HEAP32[(($urw195)>>2)]=1; //@line 257 "open.c"
      __label__ = 90; break; //@line 257 "open.c"
    case 83: 
      var $arraydecay197=(($buf)|0); //@line 258 "open.c"
      var $130=$ufmt; //@line 258 "open.c"
      var $arrayidx198=((_f__w_mode+($130<<2))|0); //@line 258 "open.c"
      var $131=HEAP32[(($arrayidx198)>>2)]; //@line 258 "open.c"
      var $call199=_fopen($arraydecay197, $131); //@line 258 "open.c"
      $tf=$call199; //@line 258 "open.c"
      var $tobool200=(($call199)|0)!=0; //@line 258 "open.c"
      if ($tobool200) { __label__ = 84; break; } else { __label__ = 85; break; } //@line 258 "open.c"
    case 84: 
      var $132=$b; //@line 259 "open.c"
      var $uwrt202=(($132+40)|0); //@line 259 "open.c"
      HEAP32[(($uwrt202)>>2)]=1; //@line 259 "open.c"
      var $133=$b; //@line 260 "open.c"
      var $urw203=(($133+28)|0); //@line 260 "open.c"
      HEAP32[(($urw203)>>2)]=2; //@line 260 "open.c"
      __label__ = 89; break; //@line 261 "open.c"
    case 85: 
      var $134=$a_addr; //@line 263 "open.c"
      var $oerr205=(($134)|0); //@line 263 "open.c"
      var $135=HEAP32[(($oerr205)>>2)]; //@line 263 "open.c"
      var $tobool206=(($135)|0)!=0; //@line 263 "open.c"
      if ($tobool206) { __label__ = 86; break; } else { __label__ = 87; break; } //@line 263 "open.c"
    case 86: 
      var $call208=___errno(); //@line 263 "open.c"
      var $136=HEAP32[(($call208)>>2)]; //@line 263 "open.c"
      var $call209=___errno(); //@line 263 "open.c"
      HEAP32[(($call209)>>2)]=$136; //@line 263 "open.c"
      __label__ = 88; break; //@line 263 "open.c"
    case 87: 
      var $call211=___errno(); //@line 263 "open.c"
      var $137=HEAP32[(($call211)>>2)]; //@line 263 "open.c"
      _f__fatal($137, ((STRING_TABLE.__str6163)|0)); //@line 263 "open.c"
      __label__ = 88; break;
    case 88: 
      var $call213=___errno(); //@line 263 "open.c"
      var $138=HEAP32[(($call213)>>2)]; //@line 263 "open.c"
      $retval=$138; //@line 263 "open.c"
      __label__ = 105; break; //@line 263 "open.c"
    case 89: 
      __label__ = 90; break;
    case 90: 
      __label__ = 91; break; //@line 264 "open.c"
    case 91: 
      var $139=$tf; //@line 265 "open.c"
      var $140=$b; //@line 265 "open.c"
      var $ufd217=(($140)|0); //@line 265 "open.c"
      HEAP32[(($ufd217)>>2)]=$139; //@line 265 "open.c"
      var $call218=_f__canseek($139); //@line 265 "open.c"
      var $141=$b; //@line 265 "open.c"
      var $useek219=(($141+20)|0); //@line 265 "open.c"
      HEAP32[(($useek219)>>2)]=$call218; //@line 265 "open.c"
      var $142=$b; //@line 270 "open.c"
      var $useek220=(($142+20)|0); //@line 270 "open.c"
      var $143=HEAP32[(($useek220)>>2)]; //@line 270 "open.c"
      var $tobool221=(($143)|0)!=0; //@line 270 "open.c"
      if ($tobool221) { __label__ = 92; break; } else { __label__ = 104; break; } //@line 270 "open.c"
    case 92: 
      var $144=$a_addr; //@line 271 "open.c"
      var $orl223=(($144+28)|0); //@line 271 "open.c"
      var $145=HEAP32[(($orl223)>>2)]; //@line 271 "open.c"
      var $tobool224=(($145)|0)!=0; //@line 271 "open.c"
      if ($tobool224) { __label__ = 93; break; } else { __label__ = 94; break; } //@line 271 "open.c"
    case 93: 
      var $146=$b; //@line 272 "open.c"
      var $ufd226=(($146)|0); //@line 272 "open.c"
      var $147=HEAP32[(($ufd226)>>2)]; //@line 272 "open.c"
      _rewind($147); //@line 272 "open.c"
      __label__ = 103; break; //@line 272 "open.c"
    case 94: 
      var $148=$a_addr; //@line 273 "open.c"
      var $oacc228=(($148+20)|0); //@line 273 "open.c"
      var $149=HEAP32[(($oacc228)>>2)]; //@line 273 "open.c"
      $s=$149; //@line 273 "open.c"
      var $tobool229=(($149)|0)!=0; //@line 273 "open.c"
      if ($tobool229) { __label__ = 95; break; } else { __label__ = 102; break; } //@line 273 "open.c"
    case 95: 
      var $150=$s; //@line 273 "open.c"
      var $151=HEAP8[($150)]; //@line 273 "open.c"
      var $conv231=(($151 << 24) >> 24); //@line 273 "open.c"
      var $cmp232=(($conv231)|0)==97; //@line 273 "open.c"
      if ($cmp232) { __label__ = 97; break; } else { __label__ = 96; break; } //@line 273 "open.c"
    case 96: 
      var $152=$s; //@line 273 "open.c"
      var $153=HEAP8[($152)]; //@line 273 "open.c"
      var $conv235=(($153 << 24) >> 24); //@line 273 "open.c"
      var $cmp236=(($conv235)|0)==65; //@line 273 "open.c"
      if ($cmp236) { __label__ = 97; break; } else { __label__ = 102; break; } //@line 273 "open.c"
    case 97: 
      var $154=$b; //@line 274 "open.c"
      var $ufd239=(($154)|0); //@line 274 "open.c"
      var $155=HEAP32[(($ufd239)>>2)]; //@line 274 "open.c"
      var $call240=_fseek($155, 0, 2); //@line 274 "open.c"
      var $tobool241=(($call240)|0)!=0; //@line 274 "open.c"
      if ($tobool241) { __label__ = 98; break; } else { __label__ = 102; break; } //@line 274 "open.c"
    case 98: 
      var $156=$a_addr; //@line 275 "open.c"
      var $oerr243=(($156)|0); //@line 275 "open.c"
      var $157=HEAP32[(($oerr243)>>2)]; //@line 275 "open.c"
      var $tobool244=(($157)|0)!=0; //@line 275 "open.c"
      if ($tobool244) { __label__ = 99; break; } else { __label__ = 100; break; } //@line 275 "open.c"
    case 99: 
      var $call246=___errno(); //@line 275 "open.c"
      HEAP32[(($call246)>>2)]=129; //@line 275 "open.c"
      __label__ = 101; break; //@line 275 "open.c"
    case 100: 
      var $158=$a_addr; //@line 275 "open.c"
      _opn_err(129, ((STRING_TABLE.__str6163)|0), $158); //@line 275 "open.c"
      __label__ = 101; break;
    case 101: 
      $retval=129; //@line 275 "open.c"
      __label__ = 105; break; //@line 275 "open.c"
    case 102: 
      __label__ = 103; break;
    case 103: 
      __label__ = 104; break;
    case 104: 
      $retval=0; //@line 276 "open.c"
      __label__ = 105; break; //@line 276 "open.c"
    case 105: 
      var $159=$retval; //@line 277 "open.c"
      STACKTOP = __stackBase__;
      return $159; //@line 277 "open.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_f_open["X"]=1;

function _g_char($a, $alen, $b) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $a_addr;
      var $alen_addr;
      var $b_addr;
      var $x;
      var $y;
      $a_addr=$a;
      $alen_addr=$alen;
      $b_addr=$b;
      var $0=$a_addr; //@line 17 "util.c"
      var $1=$alen_addr; //@line 17 "util.c"
      var $add_ptr=(($0+$1)|0); //@line 17 "util.c"
      $x=$add_ptr; //@line 17 "util.c"
      var $2=$b_addr; //@line 18 "util.c"
      var $3=$alen_addr; //@line 18 "util.c"
      var $add_ptr1=(($2+$3)|0); //@line 18 "util.c"
      $y=$add_ptr1; //@line 18 "util.c"
      __label__ = 3; break; //@line 20 "util.c"
    case 3: 
      var $4=$x; //@line 21 "util.c"
      var $5=$a_addr; //@line 21 "util.c"
      var $cmp=(($4)>>>0) <= (($5)>>>0); //@line 21 "util.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 21 "util.c"
    case 4: 
      var $6=$b_addr; //@line 22 "util.c"
      HEAP8[($6)]=0; //@line 22 "util.c"
      __label__ = 12; break; //@line 23 "util.c"
    case 5: 
      var $7=$x; //@line 25 "util.c"
      var $incdec_ptr=((($7)-(1))|0); //@line 25 "util.c"
      $x=$incdec_ptr; //@line 25 "util.c"
      var $8=HEAP8[($incdec_ptr)]; //@line 25 "util.c"
      var $conv=(($8 << 24) >> 24); //@line 25 "util.c"
      var $cmp2=(($conv)|0)!=32; //@line 25 "util.c"
      if ($cmp2) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 25 "util.c"
    case 6: 
      __label__ = 9; break; //@line 26 "util.c"
    case 7: 
      __label__ = 8; break; //@line 27 "util.c"
    case 8: 
      var $9=$y; //@line 20 "util.c"
      var $incdec_ptr6=((($9)-(1))|0); //@line 20 "util.c"
      $y=$incdec_ptr6; //@line 20 "util.c"
      __label__ = 3; break; //@line 20 "util.c"
    case 9: 
      var $10=$y; //@line 28 "util.c"
      var $incdec_ptr7=((($10)-(1))|0); //@line 28 "util.c"
      $y=$incdec_ptr7; //@line 28 "util.c"
      HEAP8[($10)]=0; //@line 28 "util.c"
      __label__ = 10; break; //@line 29 "util.c"
    case 10: 
      var $11=$x; //@line 29 "util.c"
      var $12=HEAP8[($11)]; //@line 29 "util.c"
      var $13=$y; //@line 29 "util.c"
      var $incdec_ptr8=((($13)-(1))|0); //@line 29 "util.c"
      $y=$incdec_ptr8; //@line 29 "util.c"
      HEAP8[($13)]=$12; //@line 29 "util.c"
      __label__ = 11; break; //@line 29 "util.c"
    case 11: 
      var $14=$x; //@line 29 "util.c"
      var $incdec_ptr9=((($14)-(1))|0); //@line 29 "util.c"
      $x=$incdec_ptr9; //@line 29 "util.c"
      var $15=$a_addr; //@line 29 "util.c"
      var $cmp10=(($14)>>>0) > (($15)>>>0); //@line 29 "util.c"
      if ($cmp10) { __label__ = 10; break; } else { __label__ = 12; break; } //@line 29 "util.c"
    case 12: 
      ;
      return; //@line 31 "util.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_g_char["X"]=1;

function _opn_err($m, $s, $a) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $s_addr;
      var $a_addr;
      $m_addr=$m;
      $s_addr=$s;
      $a_addr=$a;
      var $0=$a_addr; //@line 121 "open.c"
      var $ofnm=(($0+8)|0); //@line 121 "open.c"
      var $1=HEAP32[(($ofnm)>>2)]; //@line 121 "open.c"
      var $tobool=(($1)|0)!=0; //@line 121 "open.c"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 6; break; } //@line 121 "open.c"
    case 3: 
      var $2=$a_addr; //@line 123 "open.c"
      var $ofnmlen=(($2+12)|0); //@line 123 "open.c"
      var $3=HEAP32[(($ofnmlen)>>2)]; //@line 123 "open.c"
      var $4=HEAP32[((_f__buflen)>>2)]; //@line 123 "open.c"
      var $cmp=(($3)|0) >= (($4)|0); //@line 123 "open.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 123 "open.c"
    case 4: 
      var $5=$a_addr; //@line 124 "open.c"
      var $ofnmlen2=(($5+12)|0); //@line 124 "open.c"
      var $6=HEAP32[(($ofnmlen2)>>2)]; //@line 124 "open.c"
      _f__bufadj($6, 0); //@line 124 "open.c"
      __label__ = 5; break; //@line 124 "open.c"
    case 5: 
      var $7=$a_addr; //@line 125 "open.c"
      var $ofnm3=(($7+8)|0); //@line 125 "open.c"
      var $8=HEAP32[(($ofnm3)>>2)]; //@line 125 "open.c"
      var $9=$a_addr; //@line 125 "open.c"
      var $ofnmlen4=(($9+12)|0); //@line 125 "open.c"
      var $10=HEAP32[(($ofnmlen4)>>2)]; //@line 125 "open.c"
      var $11=HEAP32[((_f__buf)>>2)]; //@line 125 "open.c"
      var $12=HEAP32[((_f__curunit)>>2)]; //@line 125 "open.c"
      var $ufnm=(($12+4)|0); //@line 125 "open.c"
      HEAP32[(($ufnm)>>2)]=$11; //@line 125 "open.c"
      _g_char($8, $10, $11); //@line 125 "open.c"
      __label__ = 6; break; //@line 126 "open.c"
    case 6: 
      var $13=$m_addr; //@line 127 "open.c"
      var $14=$s_addr; //@line 127 "open.c"
      _f__fatal($13, $14); //@line 127 "open.c"
      ;
      return; //@line 128 "open.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _fk_open($seq, $fmt, $n) {
  var __stackBase__  = STACKTOP; STACKTOP += 48; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;

  var $seq_addr;
  var $fmt_addr;
  var $n_addr;
  var $nbuf=__stackBase__;
  var $a=(__stackBase__)+(12);
  $seq_addr=$seq;
  $fmt_addr=$fmt;
  $n_addr=$n;
  var $arraydecay=(($nbuf)|0); //@line 287 "open.c"
  var $0=$n_addr; //@line 287 "open.c"
  var $call=_sprintf($arraydecay, ((STRING_TABLE.__str7164)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$0,tempInt)); //@line 287 "open.c"
  var $oerr=(($a)|0); //@line 288 "open.c"
  HEAP32[(($oerr)>>2)]=1; //@line 288 "open.c"
  var $1=$n_addr; //@line 289 "open.c"
  var $ounit=(($a+4)|0); //@line 289 "open.c"
  HEAP32[(($ounit)>>2)]=$1; //@line 289 "open.c"
  var $arraydecay1=(($nbuf)|0); //@line 290 "open.c"
  var $ofnm=(($a+8)|0); //@line 290 "open.c"
  HEAP32[(($ofnm)>>2)]=$arraydecay1; //@line 290 "open.c"
  var $arraydecay2=(($nbuf)|0); //@line 291 "open.c"
  var $call3=_strlen($arraydecay2); //@line 291 "open.c"
  var $ofnmlen=(($a+12)|0); //@line 291 "open.c"
  HEAP32[(($ofnmlen)>>2)]=$call3; //@line 291 "open.c"
  var $osta=(($a+16)|0); //@line 292 "open.c"
  HEAP32[(($osta)>>2)]=0; //@line 292 "open.c"
  var $2=$seq_addr; //@line 293 "open.c"
  var $cmp=(($2)|0)==3; //@line 293 "open.c"
  var $cond=$cmp ? (((STRING_TABLE.__str9166)|0)) : (((STRING_TABLE.__str10167)|0)); //@line 293 "open.c"
  var $oacc=(($a+20)|0); //@line 293 "open.c"
  HEAP32[(($oacc)>>2)]=$cond; //@line 293 "open.c"
  var $3=$fmt_addr; //@line 294 "open.c"
  var $cmp4=(($3)|0)==5; //@line 294 "open.c"
  var $cond5=$cmp4 ? (((STRING_TABLE.__str11168)|0)) : (((STRING_TABLE.__str12169)|0)); //@line 294 "open.c"
  var $ofm=(($a+24)|0); //@line 294 "open.c"
  HEAP32[(($ofm)>>2)]=$cond5; //@line 294 "open.c"
  var $4=$seq_addr; //@line 295 "open.c"
  var $cmp6=(($4)|0)==4; //@line 295 "open.c"
  var $cond7=$cmp6 ? 1 : 0; //@line 295 "open.c"
  var $orl=(($a+28)|0); //@line 295 "open.c"
  HEAP32[(($orl)>>2)]=$cond7; //@line 295 "open.c"
  var $oblnk=(($a+32)|0); //@line 296 "open.c"
  HEAP32[(($oblnk)>>2)]=0; //@line 296 "open.c"
  var $call8=_f_open($a); //@line 297 "open.c"
  STACKTOP = __stackBase__;
  return $call8; //@line 297 "open.c"
}


function _wrt_L($n, $len, $sz) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $n_addr;
      var $len_addr;
      var $sz_addr;
      var $i;
      var $x;
      $n_addr=$n;
      $len_addr=$len;
      $sz_addr=$sz;
      var $0=$sz_addr; //@line 232 "wrtfmt.c"
      var $cmp=4==(($0)|0); //@line 232 "wrtfmt.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 232 "wrtfmt.c"
    case 3: 
      var $1=$n_addr; //@line 232 "wrtfmt.c"
      var $il=$1; //@line 232 "wrtfmt.c"
      var $2=HEAP32[(($il)>>2)]; //@line 232 "wrtfmt.c"
      $x=$2; //@line 232 "wrtfmt.c"
      __label__ = 8; break; //@line 232 "wrtfmt.c"
    case 4: 
      var $3=$sz_addr; //@line 233 "wrtfmt.c"
      var $cmp1=(($3)|0)==1; //@line 233 "wrtfmt.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 233 "wrtfmt.c"
    case 5: 
      var $4=$n_addr; //@line 233 "wrtfmt.c"
      var $ic=$4; //@line 233 "wrtfmt.c"
      var $5=HEAP8[($ic)]; //@line 233 "wrtfmt.c"
      var $conv=(($5 << 24) >> 24); //@line 233 "wrtfmt.c"
      $x=$conv; //@line 233 "wrtfmt.c"
      __label__ = 7; break; //@line 233 "wrtfmt.c"
    case 6: 
      var $6=$n_addr; //@line 234 "wrtfmt.c"
      var $is=$6; //@line 234 "wrtfmt.c"
      var $7=HEAP16[(($is)>>1)]; //@line 234 "wrtfmt.c"
      var $conv4=(($7 << 16) >> 16); //@line 234 "wrtfmt.c"
      $x=$conv4; //@line 234 "wrtfmt.c"
      __label__ = 7; break;
    case 7: 
      __label__ = 8; break;
    case 8: 
      $i=0; //@line 235 "wrtfmt.c"
      __label__ = 9; break; //@line 235 "wrtfmt.c"
    case 9: 
      var $8=$i; //@line 235 "wrtfmt.c"
      var $9=$len_addr; //@line 235 "wrtfmt.c"
      var $sub=((($9)-(1))|0); //@line 235 "wrtfmt.c"
      var $cmp6=(($8)|0) < (($sub)|0); //@line 235 "wrtfmt.c"
      if ($cmp6) { __label__ = 10; break; } else { __label__ = 12; break; } //@line 235 "wrtfmt.c"
    case 10: 
      var $10=HEAP32[((_f__putn)>>2)]; //@line 236 "wrtfmt.c"
      FUNCTION_TABLE[$10](32); //@line 236 "wrtfmt.c"
      __label__ = 11; break; //@line 236 "wrtfmt.c"
    case 11: 
      var $11=$i; //@line 235 "wrtfmt.c"
      var $inc=((($11)+(1))|0); //@line 235 "wrtfmt.c"
      $i=$inc; //@line 235 "wrtfmt.c"
      __label__ = 9; break; //@line 235 "wrtfmt.c"
    case 12: 
      var $12=$x; //@line 237 "wrtfmt.c"
      var $tobool=(($12)|0)!=0; //@line 237 "wrtfmt.c"
      if ($tobool) { __label__ = 13; break; } else { __label__ = 14; break; } //@line 237 "wrtfmt.c"
    case 13: 
      var $13=HEAP32[((_f__putn)>>2)]; //@line 237 "wrtfmt.c"
      FUNCTION_TABLE[$13](84); //@line 237 "wrtfmt.c"
      __label__ = 15; break; //@line 237 "wrtfmt.c"
    case 14: 
      var $14=HEAP32[((_f__putn)>>2)]; //@line 238 "wrtfmt.c"
      FUNCTION_TABLE[$14](70); //@line 238 "wrtfmt.c"
      __label__ = 15; break;
    case 15: 
      ;
      return 0; //@line 239 "wrtfmt.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_wrt_L["X"]=1;

function _x_wSL() {
  ;
  var __label__;

  var $n;
  var $call=_f__putbuf(10); //@line 12 "wsfe.c"
  $n=$call; //@line 12 "wsfe.c"
  HEAP32[((_f__cursor)>>2)]=0; //@line 13 "wsfe.c"
  HEAP32[((_f__recpos)>>2)]=0; //@line 13 "wsfe.c"
  HEAP32[((_f__hiwater)>>2)]=0; //@line 13 "wsfe.c"
  var $0=$n; //@line 14 "wsfe.c"
  var $cmp=(($0)|0)==0; //@line 14 "wsfe.c"
  var $conv=(($cmp)&1); //@line 14 "wsfe.c"
  ;
  return $conv; //@line 14 "wsfe.c"
}


function _s_wsle($a) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $a_addr;
      var $n;
      $a_addr=$a;
      var $0=$a_addr; //@line 17 "wsle.c"
      var $call=_c_le($0); //@line 17 "wsle.c"
      $n=$call; //@line 17 "wsle.c"
      var $tobool=(($call)|0)!=0; //@line 17 "wsle.c"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 17 "wsle.c"
    case 3: 
      var $1=$n; //@line 17 "wsle.c"
      $retval=$1; //@line 17 "wsle.c"
      __label__ = 11; break; //@line 17 "wsle.c"
    case 4: 
      HEAP32[((_f__reading)>>2)]=0; //@line 18 "wsle.c"
      HEAP32[((_f__external)>>2)]=1; //@line 19 "wsle.c"
      HEAP32[((_f__formatted)>>2)]=1; //@line 20 "wsle.c"
      HEAP32[((_f__putn)>>2)]=16; //@line 21 "wsle.c"
      HEAP32[((_f__lioproc)>>2)]=18; //@line 22 "wsle.c"
      HEAP32[((_L_len)>>2)]=80; //@line 23 "wsle.c"
      HEAP32[((_f__donewrec)>>2)]=20; //@line 24 "wsle.c"
      var $2=HEAP32[((_f__curunit)>>2)]; //@line 25 "wsle.c"
      var $uwrt=(($2+40)|0); //@line 25 "wsle.c"
      var $3=HEAP32[(($uwrt)>>2)]; //@line 25 "wsle.c"
      var $cmp=(($3)|0)!=1; //@line 25 "wsle.c"
      if ($cmp) { __label__ = 5; break; } else { __label__ = 10; break; } //@line 25 "wsle.c"
    case 5: 
      var $4=HEAP32[((_f__curunit)>>2)]; //@line 25 "wsle.c"
      var $call1=_f__nowwriting($4); //@line 25 "wsle.c"
      var $tobool2=(($call1)|0)!=0; //@line 25 "wsle.c"
      if ($tobool2) { __label__ = 6; break; } else { __label__ = 10; break; } //@line 25 "wsle.c"
    case 6: 
      var $5=$a_addr; //@line 26 "wsle.c"
      var $cierr=(($5)|0); //@line 26 "wsle.c"
      var $6=HEAP32[(($cierr)>>2)]; //@line 26 "wsle.c"
      var $tobool4=(($6)|0)!=0; //@line 26 "wsle.c"
      if ($tobool4) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 26 "wsle.c"
    case 7: 
      var $call6=___errno(); //@line 26 "wsle.c"
      var $7=HEAP32[(($call6)>>2)]; //@line 26 "wsle.c"
      var $call7=___errno(); //@line 26 "wsle.c"
      HEAP32[(($call7)>>2)]=$7; //@line 26 "wsle.c"
      __label__ = 9; break; //@line 26 "wsle.c"
    case 8: 
      var $call8=___errno(); //@line 26 "wsle.c"
      var $8=HEAP32[(($call8)>>2)]; //@line 26 "wsle.c"
      _f__fatal($8, ((STRING_TABLE.__str261)|0)); //@line 26 "wsle.c"
      __label__ = 9; break;
    case 9: 
      var $call10=___errno(); //@line 26 "wsle.c"
      var $9=HEAP32[(($call10)>>2)]; //@line 26 "wsle.c"
      $retval=$9; //@line 26 "wsle.c"
      __label__ = 11; break; //@line 26 "wsle.c"
    case 10: 
      $retval=0; //@line 27 "wsle.c"
      __label__ = 11; break; //@line 27 "wsle.c"
    case 11: 
      var $10=$retval; //@line 28 "wsle.c"
      ;
      return $10; //@line 28 "wsle.c"
    default: assert(0, "bad label: " + __label__);
  }
}
_s_wsle["X"]=1;

function _e_wsle() {
  ;
  var __label__;

  var $n;
  var $call=_f__putbuf(10); //@line 32 "wsle.c"
  $n=$call; //@line 32 "wsle.c"
  HEAP32[((_f__recpos)>>2)]=0; //@line 33 "wsle.c"
  var $0=$n; //@line 38 "wsle.c"
  ;
  return $0; //@line 38 "wsle.c"
}


function _s_stop($s, $n) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $s_addr;
      var $n_addr;
      var $i;
      $s_addr=$s;
      $n_addr=$n;
      var $0=$n_addr; //@line 25 "s_stop.c"
      var $cmp=(($0)|0) > 0; //@line 25 "s_stop.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 8; break; } //@line 25 "s_stop.c"
    case 3: 
      var $1=HEAP32[((_stderr)>>2)]; //@line 27 "s_stop.c"
      var $call=_fprintf($1, ((STRING_TABLE.__str216)|0), (tempInt=STACKTOP,STACKTOP += 1,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=0,tempInt)); //@line 27 "s_stop.c"
      $i=0; //@line 28 "s_stop.c"
      __label__ = 4; break; //@line 28 "s_stop.c"
    case 4: 
      var $2=$i; //@line 28 "s_stop.c"
      var $3=$n_addr; //@line 28 "s_stop.c"
      var $cmp1=(($2)|0) < (($3)|0); //@line 28 "s_stop.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 7; break; } //@line 28 "s_stop.c"
    case 5: 
      var $4=$s_addr; //@line 29 "s_stop.c"
      var $incdec_ptr=(($4+1)|0); //@line 29 "s_stop.c"
      $s_addr=$incdec_ptr; //@line 29 "s_stop.c"
      var $5=HEAP8[($4)]; //@line 29 "s_stop.c"
      var $conv=(($5 << 24) >> 24); //@line 29 "s_stop.c"
      var $6=HEAP32[((_stderr)>>2)]; //@line 29 "s_stop.c"
      var $call2=_putc($conv, $6); //@line 29 "s_stop.c"
      __label__ = 6; break; //@line 29 "s_stop.c"
    case 6: 
      var $7=$i; //@line 28 "s_stop.c"
      var $inc=((($7)+(1))|0); //@line 28 "s_stop.c"
      $i=$inc; //@line 28 "s_stop.c"
      __label__ = 4; break; //@line 28 "s_stop.c"
    case 7: 
      var $8=HEAP32[((_stderr)>>2)]; //@line 30 "s_stop.c"
      var $call3=_fprintf($8, ((STRING_TABLE.__str1217)|0), (tempInt=STACKTOP,STACKTOP += 1,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=0,tempInt)); //@line 30 "s_stop.c"
      __label__ = 8; break; //@line 31 "s_stop.c"
    case 8: 
      _exit(0); //@line 35 "s_stop.c"
      throw "Reached an unreachable!" //@line 35 "s_stop.c"
    case 9: 
      var $9=$retval; //@line 42 "s_stop.c"
      ;
      return $9; //@line 42 "s_stop.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _sig_die($s, $kill) {
  var __stackBase__  = STACKTOP; assert(STACKTOP % 4 == 0, "Stack is unaligned"); assert(STACKTOP < STACK_MAX, "Ran out of stack");
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $s_addr;
      var $kill_addr;
      $s_addr=$s;
      $kill_addr=$kill;
      var $0=HEAP32[((_stderr)>>2)]; //@line 26 "sig_die.c"
      var $1=$s_addr; //@line 26 "sig_die.c"
      var $call=_fprintf($0, ((STRING_TABLE.__str224)|0), (tempInt=STACKTOP,STACKTOP += 4,assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"),HEAP32[((tempInt)>>2)]=$1,tempInt)); //@line 26 "sig_die.c"
      var $2=$kill_addr; //@line 28 "sig_die.c"
      var $tobool=(($2)|0)!=0; //@line 28 "sig_die.c"
      if ($tobool) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 28 "sig_die.c"
    case 3: 
      var $3=HEAP32[((_stderr)>>2)]; //@line 30 "sig_die.c"
      var $call1=_fflush($3); //@line 30 "sig_die.c"
      _f_exit(); //@line 31 "sig_die.c"
      var $4=HEAP32[((_stderr)>>2)]; //@line 32 "sig_die.c"
      var $call2=_fflush($4); //@line 32 "sig_die.c"
      var $call3=_signal(6, 0); //@line 35 "sig_die.c"
      _abort(); //@line 37 "sig_die.c"
      throw "Reached an unreachable!" //@line 37 "sig_die.c"
    case 4: 
      _exit(1); //@line 43 "sig_die.c"
      throw "Reached an unreachable!" //@line 43 "sig_die.c"
    case 5: 
      STACKTOP = __stackBase__;
      return; //@line 45 "sig_die.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function _malloc($bytes) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $bytes_addr;
      var $mem;
      var $nb;
      var $idx;
      var $smallbits;
      var $b;
      var $p;
      var $F;
      var $b31;
      var $p32;
      var $r;
      var $rsize;
      var $i;
      var $leftbits;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $F66;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F98;
      var $rsize147;
      var $p149;
      var $r152;
      var $dvs;
      var $rsize173;
      var $p175;
      var $r176;
      $bytes_addr=$bytes;
      var $0=$bytes_addr; //@line 4628 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)>>>0) <= 244; //@line 4628 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 38; break; } //@line 4628 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$bytes_addr; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($1)>>>0) < 11; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $cond = 16;__label__ = 6; break; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $2=$bytes_addr; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($2)+(4))|0); //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add2=((($add)+(7))|0); //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$add2 & -8; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $and;__label__ = 6; break; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $cond; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nb=$cond; //@line 4631 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=$nb; //@line 4632 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr=$3 >>> 3; //@line 4632 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $idx=$shr; //@line 4632 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=HEAPU32[((((__ZL4_gm_)|0))>>2)]; //@line 4633 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$idx; //@line 4633 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr3=$4 >>> (($5)>>>0); //@line 4633 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $smallbits=$shr3; //@line 4633 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$smallbits; //@line 4635 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and4=$6 & 3; //@line 4635 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp5=(($and4)|0)!=0; //@line 4635 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp5) { __label__ = 7; break; } else { __label__ = 14; break; } //@line 4635 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $7=$smallbits; //@line 4637 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$7 ^ -1; //@line 4637 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and7=$neg & 1; //@line 4637 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=$idx; //@line 4637 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add8=((($8)+($and7))|0); //@line 4637 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $idx=$add8; //@line 4637 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$idx; //@line 4638 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=$9 << 1; //@line 4638 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=((((__ZL4_gm_+40)|0)+($shl<<2))|0); //@line 4638 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$arrayidx; //@line 4638 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$10; //@line 4638 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $b=$11; //@line 4638 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$b; //@line 4639 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($12+8)|0); //@line 4639 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=HEAP32[(($fd)>>2)]; //@line 4639 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$13; //@line 4639 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$p; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd9=(($14+8)|0); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=HEAP32[(($fd9)>>2)]; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$15; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$b; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$F; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp10=(($16)|0)==(($17)|0); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp10) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $18=$idx; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl12=1 << $18; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg13=$shl12 ^ -1; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and14=$19 & $neg13; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_)|0))>>2)]=$and14; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 13; break; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $20=$F; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$20; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp15=(($21)>>>0) >= (($22)>>>0); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp15)&1); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($expval)|0)!=0; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $23=$F; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=$b; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd17=(($24+8)|0); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd17)>>2)]=$23; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $25=$b; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$F; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($26+12)|0); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk)>>2)]=$25; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      _abort(); //@line 4641 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break;
    case 12: 
      __label__ = 13; break;
    case 13: 
      var $27=$idx; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl20=$27 << 3; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$shl20 | 1; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or21=$or | 2; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=$p; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($28+4)|0); //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or21; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=$p; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=$29; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=$idx; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl22=$31 << 3; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($30+$shl22)|0); //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=$add_ptr; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head23=(($32+4)|0); //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $33=HEAP32[(($head23)>>2)]; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or24=$33 | 1; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head23)>>2)]=$or24; //@line 4642 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=$p; //@line 4643 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $35=$34; //@line 4643 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr25=(($35+8)|0); //@line 4643 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr25; //@line 4643 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4645 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $36=$nb; //@line 4648 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $37=HEAPU32[((((__ZL4_gm_+8)|0))>>2)]; //@line 4648 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp27=(($36)>>>0) > (($37)>>>0); //@line 4648 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp27) { __label__ = 15; break; } else { __label__ = 36; break; } //@line 4648 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $38=$smallbits; //@line 4649 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp29=(($38)|0)!=0; //@line 4649 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp29) { __label__ = 16; break; } else { __label__ = 31; break; } //@line 4649 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $39=$smallbits; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=$idx; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl33=$39 << $40; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$idx; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl34=1 << $41; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl35=$shl34 << 1; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $42=$idx; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl36=1 << $42; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl37=$shl36 << 1; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=(((-$shl37))|0); //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or38=$shl35 | $sub; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and39=$shl33 & $or38; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $leftbits=$and39; //@line 4653 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=$leftbits; //@line 4654 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $44=$leftbits; //@line 4654 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub40=(((-$44))|0); //@line 4654 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and41=$43 & $sub40; //@line 4654 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $leastbit=$and41; //@line 4654 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $45=$leastbit; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub42=((($45)-(1))|0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$sub42; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $46=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr43=$46 >>> 12; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and44=$shr43 & 16; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and44; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$K; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$47; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=$K; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $49=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr45=$49 >>> (($48)>>>0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr45; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $50=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr46=$50 >>> 5; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and47=$shr46 & 8; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and47; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $51=$N; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add48=((($51)+($and47))|0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add48; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=$K; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr49=$53 >>> (($52)>>>0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr49; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $54=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr50=$54 >>> 2; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and51=$shr50 & 4; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and51; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $55=$N; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add52=((($55)+($and51))|0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add52; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $56=$K; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $57=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr53=$57 >>> (($56)>>>0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr53; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $58=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr54=$58 >>> 1; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and55=$shr54 & 2; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and55; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59=$N; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add56=((($59)+($and55))|0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add56; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $60=$K; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $61=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr57=$61 >>> (($60)>>>0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr57; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr58=$62 >>> 1; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and59=$shr58 & 1; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and59; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $63=$N; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add60=((($63)+($and59))|0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add60; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $64=$K; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $65=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr61=$65 >>> (($64)>>>0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr61; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=$N; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $67=$Y; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add62=((($66)+($67))|0); //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $i=$add62; //@line 4655 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $68=$i; //@line 4656 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl63=$68 << 1; //@line 4656 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx64=((((__ZL4_gm_+40)|0)+($shl63<<2))|0); //@line 4656 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $69=$arrayidx64; //@line 4656 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $70=$69; //@line 4656 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $b31=$70; //@line 4656 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $71=$b31; //@line 4657 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd65=(($71+8)|0); //@line 4657 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $72=HEAP32[(($fd65)>>2)]; //@line 4657 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p32=$72; //@line 4657 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $73=$p32; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd67=(($73+8)|0); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $74=HEAP32[(($fd67)>>2)]; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F66=$74; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $75=$b31; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=$F66; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp68=(($75)|0)==(($76)|0); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp68) { __label__ = 17; break; } else { __label__ = 18; break; } //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $77=$i; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl70=1 << $77; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg71=$shl70 ^ -1; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $78=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and72=$78 & $neg71; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_)|0))>>2)]=$and72; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 22; break; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $79=$F66; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $80=$79; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $81=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp74=(($80)>>>0) >= (($81)>>>0); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv75=(($cmp74)&1); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval76=(($conv75)==(1)); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool77=(($expval76)|0)!=0; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool77) { __label__ = 19; break; } else { __label__ = 20; break; } //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $82=$F66; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $83=$b31; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd79=(($83+8)|0); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd79)>>2)]=$82; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $84=$b31; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $85=$F66; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk80=(($85+12)|0); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk80)>>2)]=$84; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      _abort(); //@line 4659 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break;
    case 21: 
      __label__ = 22; break;
    case 22: 
      var $86=$i; //@line 4660 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl84=$86 << 3; //@line 4660 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $87=$nb; //@line 4660 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub85=((($shl84)-($87))|0); //@line 4660 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub85; //@line 4660 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $88=$nb; //@line 4665 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or86=$88 | 1; //@line 4665 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or87=$or86 | 2; //@line 4665 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $89=$p32; //@line 4665 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head88=(($89+4)|0); //@line 4665 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head88)>>2)]=$or87; //@line 4665 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $90=$p32; //@line 4666 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $91=$90; //@line 4666 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $92=$nb; //@line 4666 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr89=(($91+$92)|0); //@line 4666 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $93=$add_ptr89; //@line 4666 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $r=$93; //@line 4666 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $94=$rsize; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or90=$94 | 1; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $95=$r; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head91=(($95+4)|0); //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head91)>>2)]=$or90; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=$rsize; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $97=$r; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $98=$97; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $99=$rsize; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr92=(($98+$99)|0); //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $100=$add_ptr92; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($100)|0); //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$96; //@line 4667 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=HEAP32[((((__ZL4_gm_+8)|0))>>2)]; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $DVS=$101; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $102=$DVS; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp93=(($102)|0)!=0; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp93) { __label__ = 23; break; } else { __label__ = 30; break; } //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $103=HEAP32[((((__ZL4_gm_+20)|0))>>2)]; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $DV=$103; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $104=$DVS; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr95=$104 >>> 3; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I=$shr95; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $105=$I; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl96=$105 << 1; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx97=((((__ZL4_gm_+40)|0)+($shl96<<2))|0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $106=$arrayidx97; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $107=$106; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B=$107; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $108=$B; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F98=$108; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $109=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $110=$I; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl99=1 << $110; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and100=$109 & $shl99; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool101=(($and100)|0)!=0; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool101) { __label__ = 25; break; } else { __label__ = 24; break; } //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $111=$I; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl103=1 << $111; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $112=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or104=$112 | $shl103; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_)|0))>>2)]=$or104; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 29; break; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $113=$B; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd106=(($113+8)|0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=HEAP32[(($fd106)>>2)]; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $115=$114; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $116=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp107=(($115)>>>0) >= (($116)>>>0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv108=(($cmp107)&1); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval109=(($conv108)==(1)); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool110=(($expval109)|0)!=0; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool110) { __label__ = 26; break; } else { __label__ = 27; break; } //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $117=$B; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd112=(($117+8)|0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $118=HEAP32[(($fd112)>>2)]; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F98=$118; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 27: 
      _abort(); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break;
    case 28: 
      __label__ = 29; break;
    case 29: 
      var $119=$DV; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $120=$B; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd116=(($120+8)|0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd116)>>2)]=$119; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $121=$DV; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $122=$F98; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk117=(($122+12)|0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk117)>>2)]=$121; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $123=$F98; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $124=$DV; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd118=(($124+8)|0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd118)>>2)]=$123; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $125=$B; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=$DV; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk119=(($126+12)|0); //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk119)>>2)]=$125; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $127=$rsize; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+8)|0))>>2)]=$127; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $128=$r; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+20)|0))>>2)]=$128; //@line 4668 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $129=$p32; //@line 4670 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $130=$129; //@line 4670 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr121=(($130+8)|0); //@line 4670 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr121; //@line 4670 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $131=HEAP32[((((__ZL4_gm_+4)|0))>>2)]; //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp123=(($131)|0)!=0; //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp123) { __label__ = 32; break; } else { __label__ = 34; break; } //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $132=$nb; //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call=__ZL13tmalloc_smallP12malloc_statej(__ZL4_gm_, $132); //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$call; //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp124=(($call)|0)!=0; //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp124) { __label__ = 33; break; } else { __label__ = 34; break; } //@line 4675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      __label__ = 54; break; //@line 4677 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      __label__ = 35; break;
    case 35: 
      __label__ = 36; break; //@line 4679 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      __label__ = 37; break;
    case 37: 
      __label__ = 45; break; //@line 4680 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $133=$bytes_addr; //@line 4681 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp131=(($133)>>>0) >= 4294967232; //@line 4681 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp131) { __label__ = 39; break; } else { __label__ = 40; break; } //@line 4681 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 39: 
      $nb=-1; //@line 4682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 44; break; //@line 4682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 40: 
      var $134=$bytes_addr; //@line 4684 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add134=((($134)+(4))|0); //@line 4684 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add135=((($add134)+(7))|0); //@line 4684 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and136=$add135 & -8; //@line 4684 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nb=$and136; //@line 4684 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135=HEAP32[((((__ZL4_gm_+4)|0))>>2)]; //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp137=(($135)|0)!=0; //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp137) { __label__ = 41; break; } else { __label__ = 43; break; } //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 41: 
      var $136=$nb; //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call139=__ZL13tmalloc_largeP12malloc_statej(__ZL4_gm_, $136); //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$call139; //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp140=(($call139)|0)!=0; //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp140) { __label__ = 42; break; } else { __label__ = 43; break; } //@line 4685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 42: 
      __label__ = 54; break; //@line 4687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 43: 
      __label__ = 44; break;
    case 44: 
      __label__ = 45; break;
    case 45: 
      var $137=$nb; //@line 4691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $138=HEAPU32[((((__ZL4_gm_+8)|0))>>2)]; //@line 4691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp145=(($137)>>>0) <= (($138)>>>0); //@line 4691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp145) { __label__ = 46; break; } else { __label__ = 50; break; } //@line 4691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $139=HEAP32[((((__ZL4_gm_+8)|0))>>2)]; //@line 4692 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $140=$nb; //@line 4692 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub148=((($139)-($140))|0); //@line 4692 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize147=$sub148; //@line 4692 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=HEAP32[((((__ZL4_gm_+20)|0))>>2)]; //@line 4693 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p149=$141; //@line 4693 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $142=$rsize147; //@line 4694 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp150=(($142)>>>0) >= 16; //@line 4694 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp150) { __label__ = 47; break; } else { __label__ = 48; break; } //@line 4694 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $143=$p149; //@line 4695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $144=$143; //@line 4695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $145=$nb; //@line 4695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr153=(($144+$145)|0); //@line 4695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=$add_ptr153; //@line 4695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+20)|0))>>2)]=$146; //@line 4695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $r152=$146; //@line 4695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $147=$rsize147; //@line 4696 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+8)|0))>>2)]=$147; //@line 4696 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $148=$rsize147; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or154=$148 | 1; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $149=$r152; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head155=(($149+4)|0); //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head155)>>2)]=$or154; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $150=$rsize147; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=$r152; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $152=$151; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $153=$rsize147; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr156=(($152+$153)|0); //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=$add_ptr156; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot157=(($154)|0); //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot157)>>2)]=$150; //@line 4697 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $155=$nb; //@line 4698 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or158=$155 | 1; //@line 4698 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or159=$or158 | 2; //@line 4698 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $156=$p149; //@line 4698 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head160=(($156+4)|0); //@line 4698 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head160)>>2)]=$or159; //@line 4698 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 49; break; //@line 4699 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $157=HEAP32[((((__ZL4_gm_+8)|0))>>2)]; //@line 4701 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $dvs=$157; //@line 4701 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+8)|0))>>2)]=0; //@line 4702 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+20)|0))>>2)]=0; //@line 4703 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $158=$dvs; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or162=$158 | 1; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or163=$or162 | 2; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $159=$p149; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head164=(($159+4)|0); //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head164)>>2)]=$or163; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $160=$p149; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161=$160; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $162=$dvs; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr165=(($161+$162)|0); //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $163=$add_ptr165; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head166=(($163+4)|0); //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $164=HEAP32[(($head166)>>2)]; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or167=$164 | 1; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head166)>>2)]=$or167; //@line 4704 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 49; break;
    case 49: 
      var $165=$p149; //@line 4706 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $166=$165; //@line 4706 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr169=(($166+8)|0); //@line 4706 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr169; //@line 4706 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4708 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $167=$nb; //@line 4711 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $168=HEAPU32[((((__ZL4_gm_+12)|0))>>2)]; //@line 4711 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp171=(($167)>>>0) < (($168)>>>0); //@line 4711 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp171) { __label__ = 51; break; } else { __label__ = 52; break; } //@line 4711 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $169=$nb; //@line 4712 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $170=HEAP32[((((__ZL4_gm_+12)|0))>>2)]; //@line 4712 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub174=((($170)-($169))|0); //@line 4712 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+12)|0))>>2)]=$sub174; //@line 4712 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize173=$sub174; //@line 4712 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $171=HEAP32[((((__ZL4_gm_+24)|0))>>2)]; //@line 4713 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p175=$171; //@line 4713 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $172=$p175; //@line 4714 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $173=$172; //@line 4714 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $174=$nb; //@line 4714 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr177=(($173+$174)|0); //@line 4714 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $175=$add_ptr177; //@line 4714 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+24)|0))>>2)]=$175; //@line 4714 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $r176=$175; //@line 4714 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $176=$rsize173; //@line 4715 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or178=$176 | 1; //@line 4715 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $177=$r176; //@line 4715 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head179=(($177+4)|0); //@line 4715 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head179)>>2)]=$or178; //@line 4715 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $178=$nb; //@line 4716 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or180=$178 | 1; //@line 4716 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or181=$or180 | 2; //@line 4716 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $179=$p175; //@line 4716 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head182=(($179+4)|0); //@line 4716 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head182)>>2)]=$or181; //@line 4716 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $180=$p175; //@line 4717 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $181=$180; //@line 4717 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr183=(($181+8)|0); //@line 4717 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$add_ptr183; //@line 4717 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4720 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 52: 
      __label__ = 53; break;
    case 53: 
      var $182=$nb; //@line 4723 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call186=__ZL9sys_allocP12malloc_statej(__ZL4_gm_, $182); //@line 4723 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$call186; //@line 4723 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break; //@line 4723 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $183=$mem; //@line 4727 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $183; //@line 4727 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
Module["_malloc"] = _malloc;_malloc["X"]=1;

function __ZL13tmalloc_smallP12malloc_statej($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $nb_addr;
      var $t;
      var $v;
      var $rsize;
      var $i;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $trem;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F177;
      $m_addr=$m;
      $nb_addr=$nb;
      var $0=$m_addr; //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($0+4)|0); //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[(($treemap)>>2)]; //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$m_addr; //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap1=(($2+4)|0); //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=HEAP32[(($treemap1)>>2)]; //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=(((-$3))|0); //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$1 & $sub; //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $leastbit=$and; //@line 4268 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=$leastbit; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub2=((($4)-(1))|0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$sub2; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr=$5 >>> 12; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and3=$shr & 16; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and3; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$K; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$6; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$K; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr4=$8 >>> (($7)>>>0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr4; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr5=$9 >>> 5; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and6=$shr5 & 8; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and6; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$N; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($10)+($and6))|0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$K; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr7=$12 >>> (($11)>>>0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr7; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr8=$13 >>> 2; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and9=$shr8 & 4; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and9; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$N; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add10=((($14)+($and9))|0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add10; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$K; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr11=$16 >>> (($15)>>>0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr11; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr12=$17 >>> 1; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and13=$shr12 & 2; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and13; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=$N; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add14=((($18)+($and13))|0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add14; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$K; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr15=$20 >>> (($19)>>>0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr15; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr16=$21 >>> 1; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and17=$shr16 & 1; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and17; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=$N; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add18=((($22)+($and17))|0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add18; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=$K; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr19=$24 >>> (($23)>>>0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shr19; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $25=$N; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$Y; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add20=((($25)+($26))|0); //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $i=$add20; //@line 4269 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=$i; //@line 4270 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=$m_addr; //@line 4270 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($28+304)|0); //@line 4270 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($treebins+($27<<2))|0); //@line 4270 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=HEAP32[(($arrayidx)>>2)]; //@line 4270 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $t=$29; //@line 4270 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $v=$29; //@line 4270 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=$t; //@line 4271 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($30+4)|0); //@line 4271 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=HEAP32[(($head)>>2)]; //@line 4271 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and21=$31 & -8; //@line 4271 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=$nb_addr; //@line 4271 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub22=((($and21)-($32))|0); //@line 4271 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub22; //@line 4271 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $33=$t; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child=(($33+16)|0); //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx23=(($child)|0); //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=HEAP32[(($arrayidx23)>>2)]; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($34)|0)!=0; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 5; break; } //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $35=$t; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child24=(($35+16)|0); //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx25=(($child24)|0); //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($arrayidx25)>>2)]; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $36;__label__ = 6; break; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $37=$t; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child26=(($37+16)|0); //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx27=(($child26+4)|0); //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $38=HEAP32[(($arrayidx27)>>2)]; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $38;__label__ = 6; break; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $cond; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $t=$cond; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp28=(($cond)|0)!=0; //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp28) { __label__ = 7; break; } else { __label__ = 10; break; } //@line 4273 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $39=$t; //@line 4274 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head29=(($39+4)|0); //@line 4274 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($head29)>>2)]; //@line 4274 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and30=$40 & -8; //@line 4274 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$nb_addr; //@line 4274 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub31=((($and30)-($41))|0); //@line 4274 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $trem=$sub31; //@line 4274 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $42=$trem; //@line 4275 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=$rsize; //@line 4275 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp32=(($42)>>>0) < (($43)>>>0); //@line 4275 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp32) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 4275 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $44=$trem; //@line 4276 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize=$44; //@line 4276 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $45=$t; //@line 4277 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $v=$45; //@line 4277 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 4278 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      __label__ = 3; break; //@line 4279 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $46=$v; //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$46; //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($48+16)|0); //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $49=HEAPU32[(($least_addr)>>2)]; //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp33=(($47)>>>0) >= (($49)>>>0); //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp33)&1); //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($expval)|0)!=0; //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 11; break; } else { __label__ = 70; break; } //@line 4281 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $50=$v; //@line 4282 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $51=$50; //@line 4282 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=$nb_addr; //@line 4282 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($51+$52)|0); //@line 4282 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$add_ptr; //@line 4282 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $r=$53; //@line 4282 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $54=$v; //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $55=$54; //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $56=$r; //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $57=$56; //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp35=(($55)>>>0) < (($57)>>>0); //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv36=(($cmp35)&1); //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval37=(($conv36)==(1)); //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool38=(($expval37)|0)!=0; //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool38) { __label__ = 12; break; } else { __label__ = 69; break; } //@line 4284 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $58=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent=(($58+24)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59=HEAP32[(($parent)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $XP=$59; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $60=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($60+12)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $61=HEAP32[(($bk)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp40=(($61)|0)!=(($62)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp40) { __label__ = 13; break; } else { __label__ = 17; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $63=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($63+8)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $64=HEAP32[(($fd)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$64; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $65=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk42=(($65+12)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=HEAP32[(($bk42)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$66; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $67=$F; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $68=$67; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $69=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr43=(($69+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $70=HEAPU32[(($least_addr43)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp44=(($68)>>>0) >= (($70)>>>0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv45=(($cmp44)&1); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval46=(($conv45)==(1)); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool47=(($expval46)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool47) { __label__ = 14; break; } else { __label__ = 15; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $71=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $72=$F; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk49=(($72+12)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk49)>>2)]=$71; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $73=$F; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $74=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd50=(($74+8)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd50)>>2)]=$73; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 16; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      _abort(); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 16; break;
    case 16: 
      __label__ = 29; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $75=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child53=(($75+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx54=(($child53+4)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx54; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=HEAP32[(($arrayidx54)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$76; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp55=(($76)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp55) { __label__ = 19; break; } else { __label__ = 18; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $77=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child56=(($77+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx57=(($child56)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx57; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $78=HEAP32[(($arrayidx57)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$78; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp58=(($78)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp58) { __label__ = 19; break; } else { __label__ = 28; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      __label__ = 20; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $79=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child61=(($79+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx62=(($child61+4)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx62; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $80=HEAP32[(($arrayidx62)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp63=(($80)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp63) { var $83 = 1;__label__ = 22; break; } else { __label__ = 21; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $81=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child64=(($81+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx65=(($child64)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx65; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $82=HEAP32[(($arrayidx65)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp66=(($82)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $83 = $cmp66;__label__ = 22; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $83;
      if ($83) { __label__ = 23; break; } else { __label__ = 24; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $84=$CP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$84; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $85=HEAP32[(($84)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$85; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 20; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $86=$RP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $87=$86; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $88=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr69=(($88+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $89=HEAPU32[(($least_addr69)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp70=(($87)>>>0) >= (($89)>>>0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv71=(($cmp70)&1); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval72=(($conv71)==(1)); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool73=(($expval72)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool73) { __label__ = 25; break; } else { __label__ = 26; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $90=$RP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($90)>>2)]=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 27; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      _abort(); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 27; break;
    case 27: 
      __label__ = 28; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 28: 
      __label__ = 29; break;
    case 29: 
      var $91=$XP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp79=(($91)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp79) { __label__ = 30; break; } else { __label__ = 57; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $92=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index=(($92+28)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $93=HEAP32[(($index)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $94=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins81=(($94+304)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx82=(($treebins81+($93<<2))|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx82; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $95=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=$H; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $97=HEAP32[(($96)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp83=(($95)|0)==(($97)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp83) { __label__ = 31; break; } else { __label__ = 34; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $98=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $99=$H; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($99)>>2)]=$98; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp85=(($98)|0)==0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp85) { __label__ = 32; break; } else { __label__ = 33; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $100=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index87=(($100+28)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=HEAP32[(($index87)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $101; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $102=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap88=(($102+4)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $103=HEAP32[(($treemap88)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and89=$103 & $neg; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap88)>>2)]=$and89; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 33; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      __label__ = 41; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $104=$XP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $105=$104; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $106=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr92=(($106+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $107=HEAPU32[(($least_addr92)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp93=(($105)>>>0) >= (($107)>>>0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv94=(($cmp93)&1); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval95=(($conv94)==(1)); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool96=(($expval95)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool96) { __label__ = 35; break; } else { __label__ = 39; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $108=$XP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child98=(($108+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx99=(($child98)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $109=HEAP32[(($arrayidx99)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $110=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp100=(($109)|0)==(($110)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp100) { __label__ = 36; break; } else { __label__ = 37; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $111=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $112=$XP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child102=(($112+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx103=(($child102)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx103)>>2)]=$111; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 38; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $113=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=$XP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child105=(($114+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx106=(($child105+4)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx106)>>2)]=$113; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 38; break;
    case 38: 
      __label__ = 40; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 39: 
      _abort(); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 40; break;
    case 40: 
      __label__ = 41; break;
    case 41: 
      var $115=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp111=(($115)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp111) { __label__ = 42; break; } else { __label__ = 56; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $116=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $117=$116; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $118=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr113=(($118+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $119=HEAPU32[(($least_addr113)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp114=(($117)>>>0) >= (($119)>>>0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv115=(($cmp114)&1); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval116=(($conv115)==(1)); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool117=(($expval116)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool117) { __label__ = 43; break; } else { __label__ = 54; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $120=$XP; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $121=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent119=(($121+24)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent119)>>2)]=$120; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $122=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child120=(($122+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx121=(($child120)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $123=HEAP32[(($arrayidx121)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C0=$123; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp122=(($123)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp122) { __label__ = 44; break; } else { __label__ = 48; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $124=$C0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $125=$124; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr124=(($126+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $127=HEAPU32[(($least_addr124)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp125=(($125)>>>0) >= (($127)>>>0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv126=(($cmp125)&1); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval127=(($conv126)==(1)); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool128=(($expval127)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool128) { __label__ = 45; break; } else { __label__ = 46; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 45: 
      var $128=$C0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $129=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child130=(($129+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx131=(($child130)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx131)>>2)]=$128; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $130=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $131=$C0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent132=(($131+24)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent132)>>2)]=$130; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 46: 
      _abort(); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break;
    case 47: 
      __label__ = 48; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $132=$v; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child136=(($132+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx137=(($child136+4)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $133=HEAP32[(($arrayidx137)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C1=$133; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp138=(($133)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp138) { __label__ = 49; break; } else { __label__ = 53; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $134=$C1; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135=$134; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $136=$m_addr; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr140=(($136+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $137=HEAPU32[(($least_addr140)>>2)]; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp141=(($135)>>>0) >= (($137)>>>0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv142=(($cmp141)&1); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval143=(($conv142)==(1)); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool144=(($expval143)|0)!=0; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool144) { __label__ = 50; break; } else { __label__ = 51; break; } //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $138=$C1; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $139=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child146=(($139+16)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx147=(($child146+4)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx147)>>2)]=$138; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $140=$R; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=$C1; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent148=(($141+24)|0); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent148)>>2)]=$140; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 51: 
      _abort(); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break;
    case 52: 
      __label__ = 53; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 53: 
      __label__ = 55; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 54: 
      _abort(); //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 55; break;
    case 55: 
      __label__ = 56; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 56: 
      __label__ = 57; break; //@line 4285 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $142=$rsize; //@line 4286 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp156=(($142)>>>0) < 16; //@line 4286 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp156) { __label__ = 58; break; } else { __label__ = 59; break; } //@line 4286 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 58: 
      var $143=$rsize; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $144=$nb_addr; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add158=((($143)+($144))|0); //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$add158 | 1; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or159=$or | 2; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $145=$v; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head160=(($145+4)|0); //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head160)>>2)]=$or159; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=$v; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $147=$146; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $148=$rsize; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $149=$nb_addr; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add161=((($148)+($149))|0); //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr162=(($147+$add161)|0); //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $150=$add_ptr162; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head163=(($150+4)|0); //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=HEAP32[(($head163)>>2)]; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or164=$151 | 1; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head163)>>2)]=$or164; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 68; break; //@line 4287 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $152=$nb_addr; //@line 4289 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or166=$152 | 1; //@line 4289 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or167=$or166 | 2; //@line 4289 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $153=$v; //@line 4289 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head168=(($153+4)|0); //@line 4289 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head168)>>2)]=$or167; //@line 4289 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=$rsize; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or169=$154 | 1; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $155=$r; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head170=(($155+4)|0); //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head170)>>2)]=$or169; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $156=$rsize; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $157=$r; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $158=$157; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $159=$rsize; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr171=(($158+$159)|0); //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $160=$add_ptr171; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($160)|0); //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$156; //@line 4290 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($161+8)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $162=HEAP32[(($dvsize)>>2)]; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $DVS=$162; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $163=$DVS; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp172=(($163)|0)!=0; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp172) { __label__ = 60; break; } else { __label__ = 67; break; } //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $164=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dv=(($164+20)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[(($dv)>>2)]; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $DV=$165; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $166=$DVS; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr174=$166 >>> 3; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I=$shr174; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $167=$I; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl175=$167 << 1; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $168=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($168+40)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx176=(($smallbins+($shl175<<2))|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $169=$arrayidx176; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $170=$169; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B=$170; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $171=$B; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F177=$171; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $172=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($172)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $173=HEAP32[(($smallmap)>>2)]; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $174=$I; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl178=1 << $174; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and179=$173 & $shl178; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool180=(($and179)|0)!=0; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool180) { __label__ = 62; break; } else { __label__ = 61; break; } //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $175=$I; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl182=1 << $175; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $176=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap183=(($176)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $177=HEAP32[(($smallmap183)>>2)]; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or184=$177 | $shl182; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap183)>>2)]=$or184; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 66; break; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $178=$B; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd186=(($178+8)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $179=HEAP32[(($fd186)>>2)]; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $180=$179; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $181=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr187=(($181+16)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $182=HEAPU32[(($least_addr187)>>2)]; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp188=(($180)>>>0) >= (($182)>>>0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv189=(($cmp188)&1); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval190=(($conv189)==(1)); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool191=(($expval190)|0)!=0; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool191) { __label__ = 63; break; } else { __label__ = 64; break; } //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $183=$B; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd193=(($183+8)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $184=HEAP32[(($fd193)>>2)]; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F177=$184; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 64: 
      _abort(); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break;
    case 65: 
      __label__ = 66; break;
    case 66: 
      var $185=$DV; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $186=$B; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd197=(($186+8)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd197)>>2)]=$185; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $187=$DV; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $188=$F177; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk198=(($188+12)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk198)>>2)]=$187; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $189=$F177; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $190=$DV; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd199=(($190+8)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd199)>>2)]=$189; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $191=$B; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $192=$DV; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk200=(($192+12)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk200)>>2)]=$191; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 67; break; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 67: 
      var $193=$rsize; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $194=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dvsize202=(($194+8)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dvsize202)>>2)]=$193; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $195=$r; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $196=$m_addr; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dv203=(($196+20)|0); //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dv203)>>2)]=$195; //@line 4291 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 68; break;
    case 68: 
      var $197=$v; //@line 4293 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $198=$197; //@line 4293 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr205=(($198+8)|0); //@line 4293 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr205; //@line 4293 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 71; break; //@line 4293 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 69: 
      __label__ = 70; break; //@line 4295 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 70: 
      _abort(); //@line 4297 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=0; //@line 4298 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 71; break; //@line 4298 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $199=$retval; //@line 4299 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $199; //@line 4299 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL13tmalloc_smallP12malloc_statej["X"]=1;

function __ZL13tmalloc_largeP12malloc_statej($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $nb_addr;
      var $v;
      var $rsize;
      var $t;
      var $idx;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $sizebits;
      var $rst;
      var $rt;
      var $trem;
      var $leftbits;
      var $i;
      var $leastbit;
      var $Y68;
      var $K70;
      var $N73;
      var $trem97;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I;
      var $B;
      var $F268;
      var $TP;
      var $H293;
      var $I294;
      var $X295;
      var $Y303;
      var $N304;
      var $K308;
      var $T;
      var $K349;
      var $C;
      var $F385;
      $m_addr=$m;
      $nb_addr=$nb;
      $v=0; //@line 4194 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $0=$nb_addr; //@line 4195 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=(((-$0))|0); //@line 4195 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub; //@line 4195 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=$nb_addr; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr=$1 >>> 8; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $X=$shr; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$X; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($2)|0)==0; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      $idx=0; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 8; break; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $3=$X; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($3)>>>0) > 65535; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      $idx=31; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $4=$X; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$4; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$Y; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub4=((($5)-(256))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr5=$sub4 >>> 16; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$shr5 & 8; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$and; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$N; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$Y; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=$7 << $6; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub6=((($shl)-(4096))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr7=$sub6 >>> 16; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and8=$shr7 & 4; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and8; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=$K; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$N; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($9)+($8))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$K; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$Y; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl9=$11 << $10; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl9; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub10=((($shl9)-(16384))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr11=$sub10 >>> 16; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and12=$shr11 & 2; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and12; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$N; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add13=((($12)+($and12))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add13; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=$N; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub14=(((14)-($13))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$K; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$Y; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl15=$15 << $14; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl15; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr16=$shl15 >>> 15; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add17=((($sub14)+($shr16))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$add17; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$K; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl18=$16 << 1; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$nb_addr; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=$K; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add19=((($18)+(7))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr20=$17 >>> (($add19)>>>0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and21=$shr20 & 1; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add22=((($shl18)+($and21))|0); //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $idx=$add22; //@line 4198 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break;
    case 7: 
      __label__ = 8; break;
    case 8: 
      var $19=$idx; //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$m_addr; //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($20+304)|0); //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($treebins+($19<<2))|0); //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=HEAP32[(($arrayidx)>>2)]; //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $t=$21; //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($21)|0)!=0; //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 9; break; } else { __label__ = 24; break; } //@line 4199 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $22=$nb_addr; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=$idx; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($23)|0)==31; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 10; break; } else { __label__ = 11; break; } //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $cond = 0;__label__ = 12; break; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $24=$idx; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr27=$24 >>> 1; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add28=((($shr27)+(8))|0); //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub29=((($add28)-(2))|0); //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub30=(((31)-($sub29))|0); //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $sub30;__label__ = 12; break; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $cond; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl31=$22 << $cond; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sizebits=$shl31; //@line 4201 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rst=0; //@line 4202 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 13; break; //@line 4203 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $25=$t; //@line 4205 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($25+4)|0); //@line 4205 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=HEAP32[(($head)>>2)]; //@line 4205 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and32=$26 & -8; //@line 4205 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=$nb_addr; //@line 4205 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub33=((($and32)-($27))|0); //@line 4205 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $trem=$sub33; //@line 4205 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=$trem; //@line 4206 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=$rsize; //@line 4206 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp34=(($28)>>>0) < (($29)>>>0); //@line 4206 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp34) { __label__ = 14; break; } else { __label__ = 17; break; } //@line 4206 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $30=$t; //@line 4207 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $v=$30; //@line 4207 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=$trem; //@line 4208 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize=$31; //@line 4208 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp36=(($31)|0)==0; //@line 4208 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp36) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 4208 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      __label__ = 23; break; //@line 4209 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      __label__ = 17; break; //@line 4210 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $32=$t; //@line 4211 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child=(($32+16)|0); //@line 4211 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx40=(($child+4)|0); //@line 4211 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $33=HEAP32[(($arrayidx40)>>2)]; //@line 4211 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rt=$33; //@line 4211 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=$sizebits; //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr41=$34 >>> 31; //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and42=$shr41 & 1; //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $35=$t; //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child43=(($35+16)|0); //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx44=(($child43+($and42<<2))|0); //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($arrayidx44)>>2)]; //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $t=$36; //@line 4212 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $37=$rt; //@line 4213 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp45=(($37)|0)!=0; //@line 4213 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp45) { __label__ = 18; break; } else { __label__ = 20; break; } //@line 4213 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $38=$rt; //@line 4213 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $39=$t; //@line 4213 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp46=(($38)|0)!=(($39)|0); //@line 4213 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp46) { __label__ = 19; break; } else { __label__ = 20; break; } //@line 4213 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $40=$rt; //@line 4214 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rst=$40; //@line 4214 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 20; break; //@line 4214 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $41=$t; //@line 4215 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp49=(($41)|0)==0; //@line 4215 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp49) { __label__ = 21; break; } else { __label__ = 22; break; } //@line 4215 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $42=$rst; //@line 4216 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $t=$42; //@line 4216 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 23; break; //@line 4217 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $43=$sizebits; //@line 4219 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl52=$43 << 1; //@line 4219 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sizebits=$shl52; //@line 4219 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 13; break; //@line 4220 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      __label__ = 24; break; //@line 4221 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $44=$t; //@line 4222 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp54=(($44)|0)==0; //@line 4222 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp54) { __label__ = 25; break; } else { __label__ = 29; break; } //@line 4222 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $45=$v; //@line 4222 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp56=(($45)|0)==0; //@line 4222 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp56) { __label__ = 26; break; } else { __label__ = 29; break; } //@line 4222 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $46=$idx; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl58=1 << $46; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl59=$shl58 << 1; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$idx; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl60=1 << $47; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl61=$shl60 << 1; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub62=(((-$shl61))|0); //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$shl59 | $sub62; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($48+4)|0); //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $49=HEAP32[(($treemap)>>2)]; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and63=$or & $49; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $leftbits=$and63; //@line 4223 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $50=$leftbits; //@line 4224 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp64=(($50)|0)!=0; //@line 4224 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp64) { __label__ = 27; break; } else { __label__ = 28; break; } //@line 4224 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 27: 
      var $51=$leftbits; //@line 4226 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=$leftbits; //@line 4226 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub66=(((-$52))|0); //@line 4226 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and67=$51 & $sub66; //@line 4226 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $leastbit=$and67; //@line 4226 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$leastbit; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub69=((($53)-(1))|0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y68=$sub69; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $54=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr71=$54 >>> 12; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and72=$shr71 & 16; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K70=$and72; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $55=$K70; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N73=$55; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $56=$K70; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $57=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr74=$57 >>> (($56)>>>0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr74; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $58=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr75=$58 >>> 5; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and76=$shr75 & 8; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K70=$and76; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59=$N73; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add77=((($59)+($and76))|0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N73=$add77; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $60=$K70; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $61=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr78=$61 >>> (($60)>>>0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr78; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr79=$62 >>> 2; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and80=$shr79 & 4; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K70=$and80; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $63=$N73; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add81=((($63)+($and80))|0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N73=$add81; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $64=$K70; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $65=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr82=$65 >>> (($64)>>>0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr82; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr83=$66 >>> 1; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and84=$shr83 & 2; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K70=$and84; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $67=$N73; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add85=((($67)+($and84))|0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N73=$add85; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $68=$K70; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $69=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr86=$69 >>> (($68)>>>0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr86; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $70=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr87=$70 >>> 1; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and88=$shr87 & 1; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K70=$and88; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $71=$N73; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add89=((($71)+($and88))|0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N73=$add89; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $72=$K70; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $73=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr90=$73 >>> (($72)>>>0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y68=$shr90; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $74=$N73; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $75=$Y68; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add91=((($74)+($75))|0); //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $i=$add91; //@line 4227 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=$i; //@line 4228 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $77=$m_addr; //@line 4228 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins92=(($77+304)|0); //@line 4228 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx93=(($treebins92+($76<<2))|0); //@line 4228 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $78=HEAP32[(($arrayidx93)>>2)]; //@line 4228 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $t=$78; //@line 4228 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4229 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 28: 
      __label__ = 29; break; //@line 4230 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 29: 
      __label__ = 30; break; //@line 4232 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $79=$t; //@line 4232 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp96=(($79)|0)!=0; //@line 4232 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp96) { __label__ = 31; break; } else { __label__ = 37; break; } //@line 4232 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $80=$t; //@line 4233 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head98=(($80+4)|0); //@line 4233 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $81=HEAP32[(($head98)>>2)]; //@line 4233 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and99=$81 & -8; //@line 4233 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $82=$nb_addr; //@line 4233 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub100=((($and99)-($82))|0); //@line 4233 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $trem97=$sub100; //@line 4233 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $83=$trem97; //@line 4234 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $84=$rsize; //@line 4234 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp101=(($83)>>>0) < (($84)>>>0); //@line 4234 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp101) { __label__ = 32; break; } else { __label__ = 33; break; } //@line 4234 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $85=$trem97; //@line 4235 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize=$85; //@line 4235 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $86=$t; //@line 4236 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $v=$86; //@line 4236 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 33; break; //@line 4237 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $87=$t; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child104=(($87+16)|0); //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx105=(($child104)|0); //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $88=HEAP32[(($arrayidx105)>>2)]; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp106=(($88)|0)!=0; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp106) { __label__ = 34; break; } else { __label__ = 35; break; } //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $89=$t; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child108=(($89+16)|0); //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx109=(($child108)|0); //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $90=HEAP32[(($arrayidx109)>>2)]; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond114 = $90;__label__ = 36; break; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $91=$t; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child111=(($91+16)|0); //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx112=(($child111+4)|0); //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $92=HEAP32[(($arrayidx112)>>2)]; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond114 = $92;__label__ = 36; break; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $cond114; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $t=$cond114; //@line 4238 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break; //@line 4239 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $93=$v; //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp115=(($93)|0)!=0; //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp115) { __label__ = 38; break; } else { __label__ = 127; break; } //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $94=$rsize; //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $95=$m_addr; //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($95+8)|0); //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($dvsize)>>2)]; //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $97=$nb_addr; //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub117=((($96)-($97))|0); //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp118=(($94)>>>0) < (($sub117)>>>0); //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp118) { __label__ = 39; break; } else { __label__ = 127; break; } //@line 4242 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $98=$v; //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $99=$98; //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $100=$m_addr; //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($100+16)|0); //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=HEAPU32[(($least_addr)>>2)]; //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp120=(($99)>>>0) >= (($101)>>>0); //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp120)&1); //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($expval)|0)!=0; //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 40; break; } else { __label__ = 126; break; } //@line 4243 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 40: 
      var $102=$v; //@line 4244 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $103=$102; //@line 4244 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $104=$nb_addr; //@line 4244 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($103+$104)|0); //@line 4244 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $105=$add_ptr; //@line 4244 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $r=$105; //@line 4244 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $106=$v; //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $107=$106; //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $108=$r; //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $109=$108; //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp122=(($107)>>>0) < (($109)>>>0); //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv123=(($cmp122)&1); //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval124=(($conv123)==(1)); //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool125=(($expval124)|0)!=0; //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool125) { __label__ = 41; break; } else { __label__ = 125; break; } //@line 4246 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 41: 
      var $110=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent=(($110+24)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $111=HEAP32[(($parent)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $XP=$111; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $112=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($112+12)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $113=HEAP32[(($bk)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp127=(($113)|0)!=(($114)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp127) { __label__ = 42; break; } else { __label__ = 46; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $115=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($115+8)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $116=HEAP32[(($fd)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$116; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $117=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk129=(($117+12)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $118=HEAP32[(($bk129)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$118; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $119=$F; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $120=$119; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $121=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr130=(($121+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $122=HEAPU32[(($least_addr130)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp131=(($120)>>>0) >= (($122)>>>0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv132=(($cmp131)&1); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval133=(($conv132)==(1)); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool134=(($expval133)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool134) { __label__ = 43; break; } else { __label__ = 44; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $123=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $124=$F; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk136=(($124+12)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk136)>>2)]=$123; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $125=$F; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd137=(($126+8)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd137)>>2)]=$125; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 45; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 44: 
      _abort(); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 45; break;
    case 45: 
      __label__ = 58; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $127=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child141=(($127+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx142=(($child141+4)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx142; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $128=HEAP32[(($arrayidx142)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$128; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp143=(($128)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp143) { __label__ = 48; break; } else { __label__ = 47; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $129=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child144=(($129+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx145=(($child144)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx145; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $130=HEAP32[(($arrayidx145)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$130; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp146=(($130)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp146) { __label__ = 48; break; } else { __label__ = 57; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 48: 
      __label__ = 49; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $131=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child149=(($131+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx150=(($child149+4)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx150; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $132=HEAP32[(($arrayidx150)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp151=(($132)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp151) { var $135 = 1;__label__ = 51; break; } else { __label__ = 50; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $133=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child152=(($133+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx153=(($child152)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx153; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $134=HEAP32[(($arrayidx153)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp154=(($134)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135 = $cmp154;__label__ = 51; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $135;
      if ($135) { __label__ = 52; break; } else { __label__ = 53; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 52: 
      var $136=$CP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$136; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $137=HEAP32[(($136)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$137; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 49; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 53: 
      var $138=$RP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $139=$138; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $140=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr157=(($140+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=HEAPU32[(($least_addr157)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp158=(($139)>>>0) >= (($141)>>>0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv159=(($cmp158)&1); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval160=(($conv159)==(1)); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool161=(($expval160)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool161) { __label__ = 54; break; } else { __label__ = 55; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $142=$RP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($142)>>2)]=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 56; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 55: 
      _abort(); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 56; break;
    case 56: 
      __label__ = 57; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 57: 
      __label__ = 58; break;
    case 58: 
      var $143=$XP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp167=(($143)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp167) { __label__ = 59; break; } else { __label__ = 86; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $144=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index=(($144+28)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $145=HEAP32[(($index)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins169=(($146+304)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx170=(($treebins169+($145<<2))|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx170; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $147=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $148=$H; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $149=HEAP32[(($148)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp171=(($147)|0)==(($149)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp171) { __label__ = 60; break; } else { __label__ = 63; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $150=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=$H; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($151)>>2)]=$150; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp173=(($150)|0)==0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp173) { __label__ = 61; break; } else { __label__ = 62; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $152=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index175=(($152+28)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $153=HEAP32[(($index175)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl176=1 << $153; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl176 ^ -1; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap177=(($154+4)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $155=HEAP32[(($treemap177)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and178=$155 & $neg; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap177)>>2)]=$and178; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 62; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 62: 
      __label__ = 70; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $156=$XP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $157=$156; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $158=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr181=(($158+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $159=HEAPU32[(($least_addr181)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp182=(($157)>>>0) >= (($159)>>>0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv183=(($cmp182)&1); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval184=(($conv183)==(1)); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool185=(($expval184)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool185) { __label__ = 64; break; } else { __label__ = 68; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 64: 
      var $160=$XP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child187=(($160+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx188=(($child187)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161=HEAP32[(($arrayidx188)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $162=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp189=(($161)|0)==(($162)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp189) { __label__ = 65; break; } else { __label__ = 66; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 65: 
      var $163=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $164=$XP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child191=(($164+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx192=(($child191)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx192)>>2)]=$163; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 67; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 66: 
      var $165=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $166=$XP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child194=(($166+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx195=(($child194+4)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx195)>>2)]=$165; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 67; break;
    case 67: 
      __label__ = 69; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 68: 
      _abort(); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 69; break;
    case 69: 
      __label__ = 70; break;
    case 70: 
      var $167=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp200=(($167)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp200) { __label__ = 71; break; } else { __label__ = 85; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $168=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $169=$168; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $170=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr202=(($170+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $171=HEAPU32[(($least_addr202)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp203=(($169)>>>0) >= (($171)>>>0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv204=(($cmp203)&1); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval205=(($conv204)==(1)); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool206=(($expval205)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool206) { __label__ = 72; break; } else { __label__ = 83; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $172=$XP; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $173=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent208=(($173+24)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent208)>>2)]=$172; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $174=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child209=(($174+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx210=(($child209)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $175=HEAP32[(($arrayidx210)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C0=$175; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp211=(($175)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp211) { __label__ = 73; break; } else { __label__ = 77; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $176=$C0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $177=$176; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $178=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr213=(($178+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $179=HEAPU32[(($least_addr213)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp214=(($177)>>>0) >= (($179)>>>0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv215=(($cmp214)&1); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval216=(($conv215)==(1)); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool217=(($expval216)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool217) { __label__ = 74; break; } else { __label__ = 75; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $180=$C0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $181=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child219=(($181+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx220=(($child219)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx220)>>2)]=$180; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $182=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $183=$C0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent221=(($183+24)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent221)>>2)]=$182; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 76; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 75: 
      _abort(); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 76; break;
    case 76: 
      __label__ = 77; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 77: 
      var $184=$v; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child225=(($184+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx226=(($child225+4)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $185=HEAP32[(($arrayidx226)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C1=$185; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp227=(($185)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp227) { __label__ = 78; break; } else { __label__ = 82; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $186=$C1; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $187=$186; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $188=$m_addr; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr229=(($188+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $189=HEAPU32[(($least_addr229)>>2)]; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp230=(($187)>>>0) >= (($189)>>>0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv231=(($cmp230)&1); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval232=(($conv231)==(1)); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool233=(($expval232)|0)!=0; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool233) { __label__ = 79; break; } else { __label__ = 80; break; } //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $190=$C1; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $191=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child235=(($191+16)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx236=(($child235+4)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx236)>>2)]=$190; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $192=$R; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $193=$C1; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent237=(($193+24)|0); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent237)>>2)]=$192; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 81; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 80: 
      _abort(); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 81; break;
    case 81: 
      __label__ = 82; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 82: 
      __label__ = 84; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 83: 
      _abort(); //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 84; break;
    case 84: 
      __label__ = 85; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 85: 
      __label__ = 86; break; //@line 4247 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 86: 
      var $194=$rsize; //@line 4248 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp245=(($194)>>>0) < 16; //@line 4248 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp245) { __label__ = 87; break; } else { __label__ = 88; break; } //@line 4248 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 87: 
      var $195=$rsize; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $196=$nb_addr; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add247=((($195)+($196))|0); //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or248=$add247 | 1; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or249=$or248 | 2; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $197=$v; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head250=(($197+4)|0); //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head250)>>2)]=$or249; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $198=$v; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $199=$198; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $200=$rsize; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $201=$nb_addr; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add251=((($200)+($201))|0); //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr252=(($199+$add251)|0); //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $202=$add_ptr252; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head253=(($202+4)|0); //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $203=HEAP32[(($head253)>>2)]; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or254=$203 | 1; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head253)>>2)]=$or254; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 124; break; //@line 4249 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $204=$nb_addr; //@line 4251 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or256=$204 | 1; //@line 4251 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or257=$or256 | 2; //@line 4251 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $205=$v; //@line 4251 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head258=(($205+4)|0); //@line 4251 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head258)>>2)]=$or257; //@line 4251 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $206=$rsize; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or259=$206 | 1; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $207=$r; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head260=(($207+4)|0); //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head260)>>2)]=$or259; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $208=$rsize; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $209=$r; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $210=$209; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $211=$rsize; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr261=(($210+$211)|0); //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $212=$add_ptr261; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($212)|0); //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$208; //@line 4252 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $213=$rsize; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr262=$213 >>> 3; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp263=(($shr262)>>>0) < 32; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp263) { __label__ = 89; break; } else { __label__ = 96; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $214=$rsize; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr265=$214 >>> 3; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I=$shr265; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $215=$I; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl266=$215 << 1; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $216=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($216+40)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx267=(($smallbins+($shl266<<2))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $217=$arrayidx267; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $218=$217; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B=$218; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $219=$B; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F268=$219; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $220=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($220)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $221=HEAP32[(($smallmap)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $222=$I; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl269=1 << $222; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and270=$221 & $shl269; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool271=(($and270)|0)!=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool271) { __label__ = 91; break; } else { __label__ = 90; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $223=$I; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl273=1 << $223; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $224=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap274=(($224)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $225=HEAP32[(($smallmap274)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or275=$225 | $shl273; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap274)>>2)]=$or275; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 95; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $226=$B; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd277=(($226+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $227=HEAP32[(($fd277)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $228=$227; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $229=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr278=(($229+16)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $230=HEAPU32[(($least_addr278)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp279=(($228)>>>0) >= (($230)>>>0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv280=(($cmp279)&1); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval281=(($conv280)==(1)); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool282=(($expval281)|0)!=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool282) { __label__ = 92; break; } else { __label__ = 93; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $231=$B; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd284=(($231+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $232=HEAP32[(($fd284)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F268=$232; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 94; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 93: 
      _abort(); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 94; break;
    case 94: 
      __label__ = 95; break;
    case 95: 
      var $233=$r; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $234=$B; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd288=(($234+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd288)>>2)]=$233; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $235=$r; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $236=$F268; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk289=(($236+12)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk289)>>2)]=$235; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $237=$F268; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $238=$r; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd290=(($238+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd290)>>2)]=$237; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $239=$B; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $240=$r; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk291=(($240+12)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk291)>>2)]=$239; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 123; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 96: 
      var $241=$r; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $242=$241; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $TP=$242; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $243=$rsize; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr296=$243 >>> 8; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $X295=$shr296; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $244=$X295; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp297=(($244)|0)==0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp297) { __label__ = 97; break; } else { __label__ = 98; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 97: 
      $I294=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 102; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 98: 
      var $245=$X295; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp300=(($245)>>>0) > 65535; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp300) { __label__ = 99; break; } else { __label__ = 100; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 99: 
      $I294=31; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 101; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 100: 
      var $246=$X295; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y303=$246; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $247=$Y303; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub305=((($247)-(256))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr306=$sub305 >>> 16; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and307=$shr306 & 8; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N304=$and307; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $248=$N304; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $249=$Y303; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl309=$249 << $248; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y303=$shl309; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub310=((($shl309)-(4096))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr311=$sub310 >>> 16; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and312=$shr311 & 4; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K308=$and312; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $250=$K308; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $251=$N304; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add313=((($251)+($250))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N304=$add313; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $252=$K308; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $253=$Y303; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl314=$253 << $252; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y303=$shl314; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub315=((($shl314)-(16384))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr316=$sub315 >>> 16; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and317=$shr316 & 2; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K308=$and317; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $254=$N304; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add318=((($254)+($and317))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N304=$add318; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $255=$N304; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub319=(((14)-($255))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $256=$K308; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $257=$Y303; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl320=$257 << $256; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y303=$shl320; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr321=$shl320 >>> 15; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add322=((($sub319)+($shr321))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K308=$add322; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $258=$K308; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl323=$258 << 1; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $259=$rsize; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $260=$K308; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add324=((($260)+(7))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr325=$259 >>> (($add324)>>>0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and326=$shr325 & 1; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add327=((($shl323)+($and326))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I294=$add327; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 101; break;
    case 101: 
      __label__ = 102; break;
    case 102: 
      var $261=$I294; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $262=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins330=(($262+304)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx331=(($treebins330+($261<<2))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H293=$arrayidx331; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $263=$I294; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $264=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index332=(($264+28)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index332)>>2)]=$263; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $265=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child333=(($265+16)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx334=(($child333+4)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx334)>>2)]=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $266=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child335=(($266+16)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx336=(($child335)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx336)>>2)]=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $267=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap337=(($267+4)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $268=HEAP32[(($treemap337)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $269=$I294; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl338=1 << $269; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and339=$268 & $shl338; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool340=(($and339)|0)!=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool340) { __label__ = 104; break; } else { __label__ = 103; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 103: 
      var $270=$I294; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl342=1 << $270; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $271=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap343=(($271+4)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $272=HEAP32[(($treemap343)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or344=$272 | $shl342; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap343)>>2)]=$or344; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $273=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $274=$H293; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($274)>>2)]=$273; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $275=$H293; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $276=$275; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $277=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent345=(($277+24)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent345)>>2)]=$276; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $278=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $279=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk346=(($279+12)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk346)>>2)]=$278; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $280=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd347=(($280+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd347)>>2)]=$278; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 122; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 104: 
      var $281=$H293; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $282=HEAP32[(($281)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$282; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $283=$rsize; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $284=$I294; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp350=(($284)|0)==31; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp350) { __label__ = 105; break; } else { __label__ = 106; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 105: 
      var $cond358 = 0;__label__ = 107; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 106: 
      var $285=$I294; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr353=$285 >>> 1; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add354=((($shr353)+(8))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub355=((($add354)-(2))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub356=(((31)-($sub355))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond358 = $sub356;__label__ = 107; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 107: 
      var $cond358; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl359=$283 << $cond358; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K349=$shl359; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 108; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 108: 
      var $286=$T; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head361=(($286+4)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $287=HEAP32[(($head361)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and362=$287 & -8; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $288=$rsize; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp363=(($and362)|0)!=(($288)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp363) { __label__ = 109; break; } else { __label__ = 115; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 109: 
      var $289=$K349; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr365=$289 >>> 31; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and366=$shr365 & 1; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $290=$T; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child367=(($290+16)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx368=(($child367+($and366<<2))|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx368; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $291=$K349; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl369=$291 << 1; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K349=$shl369; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $292=$C; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $293=HEAP32[(($292)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp370=(($293)|0)!=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp370) { __label__ = 110; break; } else { __label__ = 111; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 110: 
      var $294=$C; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $295=HEAP32[(($294)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$295; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 114; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 111: 
      var $296=$C; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $297=$296; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $298=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr373=(($298+16)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $299=HEAPU32[(($least_addr373)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp374=(($297)>>>0) >= (($299)>>>0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv375=(($cmp374)&1); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval376=(($conv375)==(1)); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool377=(($expval376)|0)!=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool377) { __label__ = 112; break; } else { __label__ = 113; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 112: 
      var $300=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $301=$C; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($301)>>2)]=$300; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $302=$T; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $303=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent379=(($303+24)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent379)>>2)]=$302; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $304=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $305=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk380=(($305+12)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk380)>>2)]=$304; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $306=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd381=(($306+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd381)>>2)]=$304; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 121; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 113: 
      _abort(); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 121; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 114: 
      __label__ = 120; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 115: 
      var $307=$T; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd386=(($307+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $308=HEAP32[(($fd386)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F385=$308; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $309=$T; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $310=$309; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $311=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr387=(($311+16)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $312=HEAPU32[(($least_addr387)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp388=(($310)>>>0) >= (($312)>>>0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp388) { __label__ = 116; break; } else { var $317 = 0;__label__ = 117; break; } //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 116: 
      var $313=$F385; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $314=$313; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $315=$m_addr; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr389=(($315+16)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $316=HEAPU32[(($least_addr389)>>2)]; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp390=(($314)>>>0) >= (($316)>>>0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $317 = $cmp390;__label__ = 117; break;
    case 117: 
      var $317;
      var $conv391=(($317)&1);
      var $expval392=(($conv391)==(1));
      var $tobool393=(($expval392)|0)!=0;
      if ($tobool393) { __label__ = 118; break; } else { __label__ = 119; break; }
    case 118: 
      var $318=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $319=$F385; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk395=(($319+12)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk395)>>2)]=$318; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $320=$T; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd396=(($320+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd396)>>2)]=$318; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $321=$F385; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $322=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd397=(($322+8)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd397)>>2)]=$321; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $323=$T; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $324=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk398=(($324+12)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk398)>>2)]=$323; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $325=$TP; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent399=(($325+24)|0); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent399)>>2)]=0; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 121; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 119: 
      _abort(); //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 121; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 120: 
      __label__ = 108; break; //@line 4253 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 121: 
      __label__ = 122; break;
    case 122: 
      __label__ = 123; break;
    case 123: 
      __label__ = 124; break;
    case 124: 
      var $326=$v; //@line 4255 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $327=$326; //@line 4255 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr406=(($327+8)|0); //@line 4255 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr406; //@line 4255 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 128; break; //@line 4255 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 125: 
      __label__ = 126; break; //@line 4257 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 126: 
      _abort(); //@line 4258 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 127; break; //@line 4259 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 127: 
      $retval=0; //@line 4260 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 128; break; //@line 4260 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 128: 
      var $328=$retval; //@line 4261 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $328; //@line 4261 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL13tmalloc_largeP12malloc_statej["X"]=1;

function __ZL9sys_allocP12malloc_statej($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $nb_addr;
      var $tbase;
      var $tsize;
      var $mmap_flag;
      var $mem;
      var $br;
      var $ss;
      var $asize;
      var $base;
      var $esize;
      var $end;
      var $asize97;
      var $br106;
      var $end107;
      var $ssize;
      var $mn;
      var $sp;
      var $oldbase;
      var $rsize;
      var $p;
      var $r;
      $m_addr=$m;
      $nb_addr=$nb;
      $tbase=-1; //@line 3876 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tsize=0; //@line 3877 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mmap_flag=0; //@line 3878 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $0=HEAP32[((((__ZL7mparams)|0))>>2)]; //@line 3880 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 3880 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 3880 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=__ZL12init_mparamsv(); //@line 3880 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 3880 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 3880 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $2=$m_addr; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $mflags=(($2+440)|0); //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=HEAP32[(($mflags)>>2)]; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$3 & 0; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool1=(($and)|0)!=0; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool1) { __label__ = 5; break; } else { __label__ = 10; break; } //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $4=$nb_addr; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=HEAPU32[((((__ZL7mparams+12)|0))>>2)]; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($4)>>>0) >= (($5)>>>0); //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 6; break; } else { __label__ = 10; break; } //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $6=$m_addr; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($6+12)|0); //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=HEAP32[(($topsize)>>2)]; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($7)|0)!=0; //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 7; break; } else { __label__ = 10; break; } //@line 3883 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $8=$m_addr; //@line 3884 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$nb_addr; //@line 3884 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call5=__ZL10mmap_allocP12malloc_statej($8, $9); //@line 3884 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mem=$call5; //@line 3884 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$mem; //@line 3885 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp6=(($10)|0)!=0; //@line 3885 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp6) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 3885 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $11=$mem; //@line 3886 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=$11; //@line 3886 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 3886 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      __label__ = 10; break; //@line 3887 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $12=$m_addr; //@line 3911 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $mflags9=(($12+440)|0); //@line 3911 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=HEAP32[(($mflags9)>>2)]; //@line 3911 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and10=$13 & 4; //@line 3911 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool11=(($and10)|0)!=0; //@line 3911 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool11) { __label__ = 43; break; } else { __label__ = 11; break; } //@line 3911 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      $br=-1; //@line 3912 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$m_addr; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top=(($14+24)|0); //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=HEAP32[(($top)>>2)]; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp13=(($15)|0)==0; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp13) { __label__ = 12; break; } else { __label__ = 13; break; } //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $cond = 0;__label__ = 14; break; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $16=$m_addr; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$m_addr; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top14=(($17+24)|0); //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=HEAP32[(($top14)>>2)]; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$18; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call15=__ZL15segment_holdingP12malloc_statePc($16, $19); //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $call15;__label__ = 14; break; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $cond; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $ss=$cond; //@line 3913 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $asize=0; //@line 3914 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$ss; //@line 3917 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp16=(($20)|0)==0; //@line 3917 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp16) { __label__ = 15; break; } else { __label__ = 23; break; } //@line 3917 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $call18=_sbrk(0); //@line 3918 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $base=$call18; //@line 3918 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$base; //@line 3919 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp19=(($21)|0)!=-1; //@line 3919 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp19) { __label__ = 16; break; } else { __label__ = 22; break; } //@line 3919 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $22=$nb_addr; //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($22)+(48))|0); //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=((($23)-(1))|0); //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add21=((($add)+($sub))|0); //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub22=((($24)-(1))|0); //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$sub22 ^ -1; //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and23=$add21 & $neg; //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $asize=$and23; //@line 3920 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $25=$base; //@line 3922 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$25; //@line 3922 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=HEAP32[((((__ZL7mparams+4)|0))>>2)]; //@line 3922 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub24=((($27)-(1))|0); //@line 3922 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and25=$26 & $sub24; //@line 3922 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($and25)|0)==0; //@line 3922 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 18; break; } else { __label__ = 17; break; } //@line 3922 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $28=$base; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=$28; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=HEAP32[((((__ZL7mparams+4)|0))>>2)]; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub28=((($30)-(1))|0); //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add29=((($29)+($sub28))|0); //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=HEAP32[((((__ZL7mparams+4)|0))>>2)]; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub30=((($31)-(1))|0); //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg31=$sub30 ^ -1; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and32=$add29 & $neg31; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=$base; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $33=$32; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub33=((($and32)-($33))|0); //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=$asize; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add34=((($34)+($sub33))|0); //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $asize=$add34; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 18; break; //@line 3923 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $35=$asize; //@line 3925 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp36=(($35)>>>0) < 2147483647; //@line 3925 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp36) { __label__ = 19; break; } else { __label__ = 21; break; } //@line 3925 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $36=$asize; //@line 3926 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call38=_sbrk($36); //@line 3926 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $br=$call38; //@line 3926 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $37=$base; //@line 3926 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp39=(($call38)|0)==(($37)|0); //@line 3926 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp39) { __label__ = 20; break; } else { __label__ = 21; break; } //@line 3926 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $38=$base; //@line 3927 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tbase=$38; //@line 3927 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $39=$asize; //@line 3928 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tsize=$39; //@line 3928 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 3929 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 21: 
      __label__ = 22; break; //@line 3930 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 22: 
      __label__ = 27; break; //@line 3931 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $40=$nb_addr; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$m_addr; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize43=(($41+12)|0); //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $42=HEAP32[(($topsize43)>>2)]; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub44=((($40)-($42))|0); //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add45=((($sub44)+(48))|0); //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub46=((($43)-(1))|0); //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add47=((($add45)+($sub46))|0); //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $44=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub48=((($44)-(1))|0); //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg49=$sub48 ^ -1; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and50=$add47 & $neg49; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $asize=$and50; //@line 3934 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $45=$asize; //@line 3936 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp51=(($45)>>>0) < 2147483647; //@line 3936 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp51) { __label__ = 24; break; } else { __label__ = 26; break; } //@line 3936 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $46=$asize; //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call53=_sbrk($46); //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $br=$call53; //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$ss; //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base54=(($47)|0); //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=HEAP32[(($base54)>>2)]; //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $49=$ss; //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size=(($49+4)|0); //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $50=HEAP32[(($size)>>2)]; //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($48+$50)|0); //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp55=(($call53)|0)==(($add_ptr)|0); //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp55) { __label__ = 25; break; } else { __label__ = 26; break; } //@line 3937 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $51=$br; //@line 3938 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tbase=$51; //@line 3938 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=$asize; //@line 3939 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tsize=$52; //@line 3939 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 26; break; //@line 3940 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      __label__ = 27; break;
    case 27: 
      var $53=$tbase; //@line 3943 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp59=(($53)|0)==-1; //@line 3943 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp59) { __label__ = 28; break; } else { __label__ = 42; break; } //@line 3943 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $54=$br; //@line 3944 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp61=(($54)|0)!=-1; //@line 3944 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp61) { __label__ = 29; break; } else { __label__ = 38; break; } //@line 3944 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $55=$asize; //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp63=(($55)>>>0) < 2147483647; //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp63) { __label__ = 30; break; } else { __label__ = 37; break; } //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $56=$asize; //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $57=$nb_addr; //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add65=((($57)+(48))|0); //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp66=(($56)>>>0) < (($add65)>>>0); //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp66) { __label__ = 31; break; } else { __label__ = 37; break; } //@line 3945 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $58=$nb_addr; //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add68=((($58)+(48))|0); //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59=$asize; //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub69=((($add68)-($59))|0); //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $60=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub70=((($60)-(1))|0); //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add71=((($sub69)+($sub70))|0); //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $61=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub72=((($61)-(1))|0); //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg73=$sub72 ^ -1; //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and74=$add71 & $neg73; //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $esize=$and74; //@line 3947 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62=$esize; //@line 3948 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp75=(($62)>>>0) < 2147483647; //@line 3948 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp75) { __label__ = 32; break; } else { __label__ = 36; break; } //@line 3948 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $63=$esize; //@line 3949 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call77=_sbrk($63); //@line 3949 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $end=$call77; //@line 3949 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $64=$end; //@line 3950 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp78=(($64)|0)!=-1; //@line 3950 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp78) { __label__ = 33; break; } else { __label__ = 34; break; } //@line 3950 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $65=$esize; //@line 3951 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=$asize; //@line 3951 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add80=((($66)+($65))|0); //@line 3951 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $asize=$add80; //@line 3951 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break; //@line 3951 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $67=$asize; //@line 3953 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub82=(((-$67))|0); //@line 3953 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call83=_sbrk($sub82); //@line 3953 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $br=-1; //@line 3954 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 35; break;
    case 35: 
      __label__ = 36; break; //@line 3956 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      __label__ = 37; break; //@line 3957 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 37: 
      __label__ = 38; break; //@line 3958 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $68=$br; //@line 3959 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp88=(($68)|0)!=-1; //@line 3959 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp88) { __label__ = 39; break; } else { __label__ = 40; break; } //@line 3959 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $69=$br; //@line 3960 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tbase=$69; //@line 3960 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $70=$asize; //@line 3961 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tsize=$70; //@line 3961 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break; //@line 3962 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 40: 
      var $71=$m_addr; //@line 3964 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $mflags91=(($71+440)|0); //@line 3964 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $72=HEAP32[(($mflags91)>>2)]; //@line 3964 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$72 | 4; //@line 3964 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($mflags91)>>2)]=$or; //@line 3964 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break;
    case 41: 
      __label__ = 42; break; //@line 3965 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 42: 
      __label__ = 43; break; //@line 3968 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $73=$tbase; //@line 3982 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp95=(($73)|0)==-1; //@line 3982 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp95) { __label__ = 44; break; } else { __label__ = 53; break; } //@line 3982 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $74=$nb_addr; //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add98=((($74)+(48))|0); //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $75=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub99=((($75)-(1))|0); //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add100=((($add98)+($sub99))|0); //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub101=((($76)-(1))|0); //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg102=$sub101 ^ -1; //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and103=$add100 & $neg102; //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $asize97=$and103; //@line 3983 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $77=$asize97; //@line 3984 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp104=(($77)>>>0) < 2147483647; //@line 3984 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp104) { __label__ = 45; break; } else { __label__ = 52; break; } //@line 3984 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 45: 
      $br106=-1; //@line 3985 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $end107=-1; //@line 3986 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $78=$asize97; //@line 3988 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call108=_sbrk($78); //@line 3988 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $br106=$call108; //@line 3988 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call109=_sbrk(0); //@line 3989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $end107=$call109; //@line 3989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $79=$br106; //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp110=(($79)|0)!=-1; //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp110) { __label__ = 46; break; } else { __label__ = 51; break; } //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $80=$end107; //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp112=(($80)|0)!=-1; //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp112) { __label__ = 47; break; } else { __label__ = 51; break; } //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $81=$br106; //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $82=$end107; //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp114=(($81)>>>0) < (($82)>>>0); //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp114) { __label__ = 48; break; } else { __label__ = 51; break; } //@line 3991 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $83=$end107; //@line 3992 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $84=$br106; //@line 3992 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$83; //@line 3992 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$84; //@line 3992 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 3992 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $ssize=$sub_ptr_sub; //@line 3992 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $85=$ssize; //@line 3993 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $86=$nb_addr; //@line 3993 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add116=((($86)+(40))|0); //@line 3993 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp117=(($85)>>>0) > (($add116)>>>0); //@line 3993 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp117) { __label__ = 49; break; } else { __label__ = 50; break; } //@line 3993 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $87=$br106; //@line 3994 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tbase=$87; //@line 3994 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $88=$ssize; //@line 3995 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tsize=$88; //@line 3995 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 50; break; //@line 3996 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 50: 
      __label__ = 51; break; //@line 3997 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 51: 
      __label__ = 52; break; //@line 3998 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 52: 
      __label__ = 53; break; //@line 3999 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 53: 
      var $89=$tbase; //@line 4001 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp123=(($89)|0)!=-1; //@line 4001 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp123) { __label__ = 54; break; } else { __label__ = 92; break; } //@line 4001 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $90=$tsize; //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $91=$m_addr; //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($91+432)|0); //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $92=HEAP32[(($footprint)>>2)]; //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add125=((($92)+($90))|0); //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($footprint)>>2)]=$add125; //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $93=$m_addr; //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $max_footprint=(($93+436)|0); //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $94=HEAPU32[(($max_footprint)>>2)]; //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp126=(($add125)>>>0) > (($94)>>>0); //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp126) { __label__ = 55; break; } else { __label__ = 56; break; } //@line 4003 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 55: 
      var $95=$m_addr; //@line 4004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $footprint128=(($95+432)|0); //@line 4004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($footprint128)>>2)]; //@line 4004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $97=$m_addr; //@line 4004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $max_footprint129=(($97+436)|0); //@line 4004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($max_footprint129)>>2)]=$96; //@line 4004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 56; break; //@line 4004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 56: 
      var $98=$m_addr; //@line 4006 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top131=(($98+24)|0); //@line 4006 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $99=HEAP32[(($top131)>>2)]; //@line 4006 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp132=(($99)|0)!=0; //@line 4006 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp132) { __label__ = 64; break; } else { __label__ = 57; break; } //@line 4006 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $100=$m_addr; //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($100+16)|0); //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=HEAP32[(($least_addr)>>2)]; //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp134=(($101)|0)==0; //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp134) { __label__ = 59; break; } else { __label__ = 58; break; } //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 58: 
      var $102=$tbase; //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $103=$m_addr; //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr135=(($103+16)|0); //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $104=HEAPU32[(($least_addr135)>>2)]; //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp136=(($102)>>>0) < (($104)>>>0); //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp136) { __label__ = 59; break; } else { __label__ = 60; break; } //@line 4007 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $105=$tbase; //@line 4008 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $106=$m_addr; //@line 4008 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr138=(($106+16)|0); //@line 4008 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($least_addr138)>>2)]=$105; //@line 4008 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 60; break; //@line 4008 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $107=$tbase; //@line 4009 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $108=$m_addr; //@line 4009 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg=(($108+444)|0); //@line 4009 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base140=(($seg)|0); //@line 4009 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($base140)>>2)]=$107; //@line 4009 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $109=$tsize; //@line 4010 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $110=$m_addr; //@line 4010 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg141=(($110+444)|0); //@line 4010 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size142=(($seg141+4)|0); //@line 4010 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size142)>>2)]=$109; //@line 4010 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $111=$mmap_flag; //@line 4011 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $112=$m_addr; //@line 4011 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg143=(($112+444)|0); //@line 4011 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($seg143+12)|0); //@line 4011 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($sflags)>>2)]=$111; //@line 4011 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $113=HEAP32[((((__ZL7mparams)|0))>>2)]; //@line 4012 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=$m_addr; //@line 4012 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $magic=(($114+36)|0); //@line 4012 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($magic)>>2)]=$113; //@line 4012 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $115=$m_addr; //@line 4013 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $release_checks=(($115+32)|0); //@line 4013 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($release_checks)>>2)]=-1; //@line 4013 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $116=$m_addr; //@line 4014 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __ZL9init_binsP12malloc_state($116); //@line 4014 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $117=$m_addr; //@line 4016 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp144=(($117)|0)==((__ZL4_gm_)|0); //@line 4016 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp144) { __label__ = 61; break; } else { __label__ = 62; break; } //@line 4016 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $118=$m_addr; //@line 4017 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $119=$tbase; //@line 4017 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $120=$119; //@line 4017 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $121=$tsize; //@line 4017 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub146=((($121)-(40))|0); //@line 4017 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __ZL8init_topP12malloc_stateP12malloc_chunkj($118, $120, $sub146); //@line 4017 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 63; break; //@line 4017 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $122=$m_addr; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $123=$122; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr148=((($123)-(8))|0); //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $124=$add_ptr148; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $125=$124; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $127=$126; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr149=((($127)-(8))|0); //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $128=$add_ptr149; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($128+4)|0); //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $129=HEAP32[(($head)>>2)]; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and150=$129 & -8; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr151=(($125+$and150)|0); //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $130=$add_ptr151; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mn=$130; //@line 4022 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $131=$m_addr; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $132=$mn; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $133=$tbase; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $134=$tsize; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr152=(($133+$134)|0); //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135=$mn; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $136=$135; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast153=$add_ptr152; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast154=$136; //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub155=((($sub_ptr_lhs_cast153)-($sub_ptr_rhs_cast154))|0); //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub156=((($sub_ptr_sub155)-(40))|0); //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __ZL8init_topP12malloc_stateP12malloc_chunkj($131, $132, $sub156); //@line 4023 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 63; break;
    case 63: 
      __label__ = 89; break; //@line 4025 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 64: 
      var $137=$m_addr; //@line 4029 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg159=(($137+444)|0); //@line 4029 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$seg159; //@line 4029 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 65: 
      var $138=$sp; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp160=(($138)|0)!=0; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp160) { __label__ = 66; break; } else { var $144 = 0;__label__ = 67; break; } //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 66: 
      var $139=$tbase; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $140=$sp; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base161=(($140)|0); //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=HEAP32[(($base161)>>2)]; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $142=$sp; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size162=(($142+4)|0); //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $143=HEAP32[(($size162)>>2)]; //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr163=(($141+$143)|0); //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp164=(($139)|0)!=(($add_ptr163)|0); //@line 4031 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $144 = $cmp164;__label__ = 67; break;
    case 67: 
      var $144;
      if ($144) { __label__ = 68; break; } else { __label__ = 69; break; }
    case 68: 
      var $145=$sp; //@line 4032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $next=(($145+8)|0); //@line 4032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=HEAP32[(($next)>>2)]; //@line 4032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$146; //@line 4032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 69: 
      var $147=$sp; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp165=(($147)|0)!=0; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp165) { __label__ = 70; break; } else { __label__ = 75; break; } //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 70: 
      var $148=$sp; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags167=(($148+12)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $149=HEAP32[(($sflags167)>>2)]; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and168=$149 & 8; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool169=(($and168)|0)!=0; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool169) { __label__ = 75; break; } else { __label__ = 71; break; } //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $150=$sp; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags171=(($150+12)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=HEAP32[(($sflags171)>>2)]; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and172=$151 & 0; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $152=$mmap_flag; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp173=(($and172)|0)==(($152)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp173) { __label__ = 72; break; } else { __label__ = 75; break; } //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $153=$m_addr; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top175=(($153+24)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=HEAP32[(($top175)>>2)]; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $155=$154; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $156=$sp; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base176=(($156)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $157=HEAPU32[(($base176)>>2)]; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp177=(($155)>>>0) >= (($157)>>>0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp177) { __label__ = 73; break; } else { __label__ = 75; break; } //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $158=$m_addr; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top179=(($158+24)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $159=HEAP32[(($top179)>>2)]; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $160=$159; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161=$sp; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base180=(($161)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $162=HEAP32[(($base180)>>2)]; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $163=$sp; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size181=(($163+4)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $164=HEAP32[(($size181)>>2)]; //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr182=(($162+$164)|0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp183=(($160)>>>0) < (($add_ptr182)>>>0); //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp183) { __label__ = 74; break; } else { __label__ = 75; break; } //@line 4033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $165=$tsize; //@line 4037 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $166=$sp; //@line 4037 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size185=(($166+4)|0); //@line 4037 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $167=HEAP32[(($size185)>>2)]; //@line 4037 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add186=((($167)+($165))|0); //@line 4037 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size185)>>2)]=$add186; //@line 4037 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $168=$m_addr; //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $169=$m_addr; //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top187=(($169+24)|0); //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $170=HEAP32[(($top187)>>2)]; //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $171=$m_addr; //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize188=(($171+12)|0); //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $172=HEAP32[(($topsize188)>>2)]; //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $173=$tsize; //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add189=((($172)+($173))|0); //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __ZL8init_topP12malloc_stateP12malloc_chunkj($168, $170, $add189); //@line 4038 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 88; break; //@line 4039 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 75: 
      var $174=$tbase; //@line 4041 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $175=$m_addr; //@line 4041 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr191=(($175+16)|0); //@line 4041 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $176=HEAPU32[(($least_addr191)>>2)]; //@line 4041 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp192=(($174)>>>0) < (($176)>>>0); //@line 4041 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp192) { __label__ = 76; break; } else { __label__ = 77; break; } //@line 4041 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 76: 
      var $177=$tbase; //@line 4042 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $178=$m_addr; //@line 4042 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr194=(($178+16)|0); //@line 4042 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($least_addr194)>>2)]=$177; //@line 4042 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 77; break; //@line 4042 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 77: 
      var $179=$m_addr; //@line 4043 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg196=(($179+444)|0); //@line 4043 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$seg196; //@line 4043 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 78; break; //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $180=$sp; //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp198=(($180)|0)!=0; //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp198) { __label__ = 79; break; } else { var $185 = 0;__label__ = 80; break; } //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $181=$sp; //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base200=(($181)|0); //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $182=HEAP32[(($base200)>>2)]; //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $183=$tbase; //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $184=$tsize; //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr201=(($183+$184)|0); //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp202=(($182)|0)!=(($add_ptr201)|0); //@line 4044 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $185 = $cmp202;__label__ = 80; break;
    case 80: 
      var $185;
      if ($185) { __label__ = 81; break; } else { __label__ = 82; break; }
    case 81: 
      var $186=$sp; //@line 4045 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $next205=(($186+8)|0); //@line 4045 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $187=HEAP32[(($next205)>>2)]; //@line 4045 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$187; //@line 4045 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 78; break; //@line 4045 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 82: 
      var $188=$sp; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp207=(($188)|0)!=0; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp207) { __label__ = 83; break; } else { __label__ = 86; break; } //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 83: 
      var $189=$sp; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags209=(($189+12)|0); //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $190=HEAP32[(($sflags209)>>2)]; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and210=$190 & 8; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool211=(($and210)|0)!=0; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool211) { __label__ = 86; break; } else { __label__ = 84; break; } //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 84: 
      var $191=$sp; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags213=(($191+12)|0); //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $192=HEAP32[(($sflags213)>>2)]; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and214=$192 & 0; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $193=$mmap_flag; //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp215=(($and214)|0)==(($193)|0); //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp215) { __label__ = 85; break; } else { __label__ = 86; break; } //@line 4046 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 85: 
      var $194=$sp; //@line 4049 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base217=(($194)|0); //@line 4049 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $195=HEAP32[(($base217)>>2)]; //@line 4049 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $oldbase=$195; //@line 4049 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $196=$tbase; //@line 4050 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $197=$sp; //@line 4050 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base218=(($197)|0); //@line 4050 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($base218)>>2)]=$196; //@line 4050 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $198=$tsize; //@line 4051 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $199=$sp; //@line 4051 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size219=(($199+4)|0); //@line 4051 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $200=HEAP32[(($size219)>>2)]; //@line 4051 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add220=((($200)+($198))|0); //@line 4051 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size219)>>2)]=$add220; //@line 4051 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $201=$m_addr; //@line 4052 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $202=$tbase; //@line 4052 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $203=$oldbase; //@line 4052 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $204=$nb_addr; //@line 4052 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call221=__ZL13prepend_allocP12malloc_statePcS1_j($201, $202, $203, $204); //@line 4052 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=$call221; //@line 4052 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 4052 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 86: 
      var $205=$m_addr; //@line 4055 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $206=$tbase; //@line 4055 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $207=$tsize; //@line 4055 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $208=$mmap_flag; //@line 4055 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __ZL11add_segmentP12malloc_statePcjj($205, $206, $207, $208); //@line 4055 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 87; break;
    case 87: 
      __label__ = 88; break;
    case 88: 
      __label__ = 89; break;
    case 89: 
      var $209=$nb_addr; //@line 4059 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $210=$m_addr; //@line 4059 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize226=(($210+12)|0); //@line 4059 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $211=HEAPU32[(($topsize226)>>2)]; //@line 4059 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp227=(($209)>>>0) < (($211)>>>0); //@line 4059 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp227) { __label__ = 90; break; } else { __label__ = 91; break; } //@line 4059 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $212=$nb_addr; //@line 4060 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $213=$m_addr; //@line 4060 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize229=(($213+12)|0); //@line 4060 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $214=HEAP32[(($topsize229)>>2)]; //@line 4060 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub230=((($214)-($212))|0); //@line 4060 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($topsize229)>>2)]=$sub230; //@line 4060 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rsize=$sub230; //@line 4060 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $215=$m_addr; //@line 4061 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top231=(($215+24)|0); //@line 4061 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $216=HEAP32[(($top231)>>2)]; //@line 4061 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$216; //@line 4061 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $217=$p; //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $218=$217; //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $219=$nb_addr; //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr232=(($218+$219)|0); //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $220=$add_ptr232; //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $221=$m_addr; //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top233=(($221+24)|0); //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($top233)>>2)]=$220; //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $r=$220; //@line 4062 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $222=$rsize; //@line 4063 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or234=$222 | 1; //@line 4063 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $223=$r; //@line 4063 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head235=(($223+4)|0); //@line 4063 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head235)>>2)]=$or234; //@line 4063 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $224=$nb_addr; //@line 4064 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or236=$224 | 1; //@line 4064 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or237=$or236 | 2; //@line 4064 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $225=$p; //@line 4064 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head238=(($225+4)|0); //@line 4064 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head238)>>2)]=$or237; //@line 4064 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $226=$p; //@line 4067 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $227=$226; //@line 4067 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr239=(($227+8)|0); //@line 4067 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr239; //@line 4067 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 4067 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 91: 
      __label__ = 92; break; //@line 4069 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $call242=___errno(); //@line 4071 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($call242)>>2)]=12; //@line 4071 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=0; //@line 4072 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 4072 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 93: 
      var $228=$retval; //@line 4073 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $228; //@line 4073 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL9sys_allocP12malloc_statej["X"]=1;

function _free($mem) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $mem_addr;
      var $p;
      var $psize;
      var $next;
      var $prevsize;
      var $prev;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F53;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F220;
      var $B222;
      var $I224;
      var $TP255;
      var $XP256;
      var $R258;
      var $F262;
      var $RP275;
      var $CP284;
      var $H307;
      var $C0345;
      var $C1346;
      var $I403;
      var $B405;
      var $F408;
      var $tp;
      var $H431;
      var $I432;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K479;
      var $C;
      var $F509;
      $mem_addr=$mem;
      var $0=$mem_addr; //@line 4740 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4740 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 197; break; } //@line 4740 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$mem_addr; //@line 4741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=((($1)-(8))|0); //@line 4741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 4741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$2; //@line 4741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=$p; //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=$3; //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($4)>>>0) >= (($5)>>>0); //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 4; break; } else { var $8 = 0;__label__ = 5; break; } //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $6=$p; //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($6+4)|0); //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=HEAP32[(($head)>>2)]; //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$7 & 3; //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($and)|0)!=1; //@line 4753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8 = $cmp2;__label__ = 5; break;
    case 5: 
      var $8;
      var $conv=(($8)&1);
      var $expval=(($conv)==(1));
      var $tobool=(($expval)|0)!=0;
      if ($tobool) { __label__ = 6; break; } else { __label__ = 194; break; }
    case 6: 
      var $9=$p; //@line 4754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head4=(($9+4)|0); //@line 4754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=HEAP32[(($head4)>>2)]; //@line 4754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and5=$10 & -8; //@line 4754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$and5; //@line 4754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$p; //@line 4755 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$11; //@line 4755 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=$psize; //@line 4755 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr6=(($12+$13)|0); //@line 4755 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$add_ptr6; //@line 4755 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $next=$14; //@line 4755 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$p; //@line 4756 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head7=(($15+4)|0); //@line 4756 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=HEAP32[(($head7)>>2)]; //@line 4756 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and8=$16 & 1; //@line 4756 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool9=(($and8)|0)!=0; //@line 4756 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool9) { __label__ = 78; break; } else { __label__ = 7; break; } //@line 4756 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $17=$p; //@line 4757 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($17)|0); //@line 4757 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=HEAP32[(($prev_foot)>>2)]; //@line 4757 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $prevsize=$18; //@line 4757 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$p; //@line 4758 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head11=(($19+4)|0); //@line 4758 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=HEAP32[(($head11)>>2)]; //@line 4758 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and12=$20 & 3; //@line 4758 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp13=(($and12)|0)==0; //@line 4758 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp13) { __label__ = 8; break; } else { __label__ = 9; break; } //@line 4758 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $21=$prevsize; //@line 4759 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($21)+(16))|0); //@line 4759 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=$psize; //@line 4759 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add15=((($22)+($add))|0); //@line 4759 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$add15; //@line 4759 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4762 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $23=$p; //@line 4765 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=$23; //@line 4765 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $25=$prevsize; //@line 4765 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $idx_neg=(((-$25))|0); //@line 4765 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr16=(($24+$idx_neg)|0); //@line 4765 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$add_ptr16; //@line 4765 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $prev=$26; //@line 4765 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=$prevsize; //@line 4766 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=$psize; //@line 4766 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add17=((($28)+($27))|0); //@line 4766 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$add17; //@line 4766 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=$prev; //@line 4767 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$29; //@line 4767 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=$prev; //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=$30; //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp18=(($31)>>>0) >= (($32)>>>0); //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv19=(($cmp18)&1); //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval20=(($conv19)==(1)); //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool21=(($expval20)|0)!=0; //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool21) { __label__ = 10; break; } else { __label__ = 75; break; } //@line 4768 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $33=$p; //@line 4769 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=HEAP32[((((__ZL4_gm_+20)|0))>>2)]; //@line 4769 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp23=(($33)|0)!=(($34)|0); //@line 4769 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp23) { __label__ = 11; break; } else { __label__ = 71; break; } //@line 4769 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $35=$prevsize; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr=$35 >>> 3; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp25=(($shr)>>>0) < 32; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp25) { __label__ = 12; break; } else { __label__ = 24; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $36=$p; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($36+8)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $37=HEAP32[(($fd)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$37; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $38=$p; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($38+12)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $39=HEAP32[(($bk)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B=$39; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=$prevsize; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr27=$40 >>> 3; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I=$shr27; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$F; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $42=$B; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp28=(($41)|0)==(($42)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp28) { __label__ = 13; break; } else { __label__ = 14; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $43=$I; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $43; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $44=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and30=$44 & $neg; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_)|0))>>2)]=$and30; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 23; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $45=$F; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $46=$I; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl32=$46 << 1; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=((((__ZL4_gm_+40)|0)+($shl32<<2))|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$arrayidx; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=$47; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp33=(($45)|0)==(($48)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp33) { __label__ = 16; break; } else { __label__ = 15; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $49=$F; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $50=$49; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $51=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp34=(($50)>>>0) >= (($51)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp34) { __label__ = 16; break; } else { var $60 = 0;__label__ = 19; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $52=$B; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$I; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl36=$53 << 1; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx37=((((__ZL4_gm_+40)|0)+($shl36<<2))|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $54=$arrayidx37; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $55=$54; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp38=(($52)|0)==(($55)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp38) { var $59 = 1;__label__ = 18; break; } else { __label__ = 17; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $56=$B; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $57=$56; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $58=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp39=(($57)>>>0) >= (($58)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59 = $cmp39;__label__ = 18; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $59;
      var $60 = $59;__label__ = 19; break;
    case 19: 
      var $60;
      var $conv41=(($60)&1);
      var $expval42=(($conv41)==(1));
      var $tobool43=(($expval42)|0)!=0;
      if ($tobool43) { __label__ = 20; break; } else { __label__ = 21; break; }
    case 20: 
      var $61=$B; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62=$F; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk45=(($62+12)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk45)>>2)]=$61; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $63=$F; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $64=$B; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd46=(($64+8)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd46)>>2)]=$63; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 22; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 21: 
      _abort(); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 22; break;
    case 22: 
      __label__ = 23; break;
    case 23: 
      __label__ = 70; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $65=$p; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=$65; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $TP=$66; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $67=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent=(($67+24)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $68=HEAP32[(($parent)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $XP=$68; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $69=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk50=(($69+12)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $70=HEAP32[(($bk50)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $71=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp51=(($70)|0)!=(($71)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp51) { __label__ = 25; break; } else { __label__ = 29; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $72=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd54=(($72+8)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $73=HEAP32[(($fd54)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F53=$73; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $74=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk55=(($74+12)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $75=HEAP32[(($bk55)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$75; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=$F53; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $77=$76; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $78=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp56=(($77)>>>0) >= (($78)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv57=(($cmp56)&1); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval58=(($conv57)==(1)); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool59=(($expval58)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool59) { __label__ = 26; break; } else { __label__ = 27; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $79=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $80=$F53; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk61=(($80+12)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk61)>>2)]=$79; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $81=$F53; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $82=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd62=(($82+8)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd62)>>2)]=$81; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 27: 
      _abort(); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break;
    case 28: 
      __label__ = 41; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $83=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child=(($83+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx66=(($child+4)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx66; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $84=HEAP32[(($arrayidx66)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$84; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp67=(($84)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp67) { __label__ = 31; break; } else { __label__ = 30; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $85=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child69=(($85+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx70=(($child69)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx70; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $86=HEAP32[(($arrayidx70)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$86; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp71=(($86)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp71) { __label__ = 31; break; } else { __label__ = 40; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      __label__ = 32; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $87=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child73=(($87+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx74=(($child73+4)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx74; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $88=HEAP32[(($arrayidx74)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp75=(($88)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp75) { var $91 = 1;__label__ = 34; break; } else { __label__ = 33; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $89=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child77=(($89+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx78=(($child77)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx78; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $90=HEAP32[(($arrayidx78)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp79=(($90)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $91 = $cmp79;__label__ = 34; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $91;
      if ($91) { __label__ = 35; break; } else { __label__ = 36; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $92=$CP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$92; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $93=HEAP32[(($92)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$93; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 32; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $94=$RP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $95=$94; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp81=(($95)>>>0) >= (($96)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv82=(($cmp81)&1); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval83=(($conv82)==(1)); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool84=(($expval83)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool84) { __label__ = 37; break; } else { __label__ = 38; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $97=$RP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($97)>>2)]=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 39; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 38: 
      _abort(); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 39; break;
    case 39: 
      __label__ = 40; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 40: 
      __label__ = 41; break;
    case 41: 
      var $98=$XP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp90=(($98)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp90) { __label__ = 42; break; } else { __label__ = 69; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 42: 
      var $99=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index=(($99+28)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $100=HEAP32[(($index)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx92=((((__ZL4_gm_+304)|0)+($100<<2))|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx92; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $102=$H; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $103=HEAP32[(($102)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp93=(($101)|0)==(($103)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp93) { __label__ = 43; break; } else { __label__ = 46; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $104=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $105=$H; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($105)>>2)]=$104; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp95=(($104)|0)==0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp95) { __label__ = 44; break; } else { __label__ = 45; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $106=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index97=(($106+28)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $107=HEAP32[(($index97)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl98=1 << $107; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg99=$shl98 ^ -1; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $108=HEAP32[((((__ZL4_gm_+4)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and100=$108 & $neg99; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+4)|0))>>2)]=$and100; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 45; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 45: 
      __label__ = 53; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $109=$XP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $110=$109; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $111=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp103=(($110)>>>0) >= (($111)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv104=(($cmp103)&1); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval105=(($conv104)==(1)); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool106=(($expval105)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool106) { __label__ = 47; break; } else { __label__ = 51; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 47: 
      var $112=$XP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child108=(($112+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx109=(($child108)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $113=HEAP32[(($arrayidx109)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp110=(($113)|0)==(($114)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp110) { __label__ = 48; break; } else { __label__ = 49; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $115=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $116=$XP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child112=(($116+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx113=(($child112)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx113)>>2)]=$115; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 50; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $117=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $118=$XP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child115=(($118+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx116=(($child115+4)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx116)>>2)]=$117; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 50; break;
    case 50: 
      __label__ = 52; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 51: 
      _abort(); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break;
    case 52: 
      __label__ = 53; break;
    case 53: 
      var $119=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp121=(($119)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp121) { __label__ = 54; break; } else { __label__ = 68; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 54: 
      var $120=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $121=$120; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $122=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp123=(($121)>>>0) >= (($122)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv124=(($cmp123)&1); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval125=(($conv124)==(1)); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool126=(($expval125)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool126) { __label__ = 55; break; } else { __label__ = 66; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 55: 
      var $123=$XP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $124=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent128=(($124+24)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent128)>>2)]=$123; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $125=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child129=(($125+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx130=(($child129)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=HEAP32[(($arrayidx130)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C0=$126; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp131=(($126)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp131) { __label__ = 56; break; } else { __label__ = 60; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 56: 
      var $127=$C0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $128=$127; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $129=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp133=(($128)>>>0) >= (($129)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv134=(($cmp133)&1); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval135=(($conv134)==(1)); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool136=(($expval135)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool136) { __label__ = 57; break; } else { __label__ = 58; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $130=$C0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $131=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child138=(($131+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx139=(($child138)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx139)>>2)]=$130; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $132=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $133=$C0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent140=(($133+24)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent140)>>2)]=$132; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 59; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 58: 
      _abort(); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 59; break;
    case 59: 
      __label__ = 60; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 60: 
      var $134=$TP; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child144=(($134+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx145=(($child144+4)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135=HEAP32[(($arrayidx145)>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C1=$135; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp146=(($135)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp146) { __label__ = 61; break; } else { __label__ = 65; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $136=$C1; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $137=$136; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $138=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp148=(($137)>>>0) >= (($138)>>>0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv149=(($cmp148)&1); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval150=(($conv149)==(1)); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool151=(($expval150)|0)!=0; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool151) { __label__ = 62; break; } else { __label__ = 63; break; } //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $139=$C1; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $140=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child153=(($140+16)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx154=(($child153+4)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx154)>>2)]=$139; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=$R; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $142=$C1; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent155=(($142+24)|0); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent155)>>2)]=$141; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 64; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 63: 
      _abort(); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 64; break;
    case 64: 
      __label__ = 65; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 65: 
      __label__ = 67; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 66: 
      _abort(); //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 67; break;
    case 67: 
      __label__ = 68; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 68: 
      __label__ = 69; break; //@line 4770 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 69: 
      __label__ = 70; break;
    case 70: 
      __label__ = 74; break; //@line 4771 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $143=$next; //@line 4772 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head165=(($143+4)|0); //@line 4772 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $144=HEAP32[(($head165)>>2)]; //@line 4772 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and166=$144 & 3; //@line 4772 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp167=(($and166)|0)==3; //@line 4772 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp167) { __label__ = 72; break; } else { __label__ = 73; break; } //@line 4772 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $145=$psize; //@line 4773 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+8)|0))>>2)]=$145; //@line 4773 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=$next; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head169=(($146+4)|0); //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $147=HEAP32[(($head169)>>2)]; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and170=$147 & -2; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head169)>>2)]=$and170; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $148=$psize; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$148 | 1; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $149=$p; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head171=(($149+4)|0); //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head171)>>2)]=$or; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $150=$psize; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=$p; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $152=$151; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $153=$psize; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr172=(($152+$153)|0); //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=$add_ptr172; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot173=(($154)|0); //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot173)>>2)]=$150; //@line 4774 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4775 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 73: 
      __label__ = 74; break;
    case 74: 
      __label__ = 76; break; //@line 4777 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 75: 
      __label__ = 195; break; //@line 4779 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 76: 
      __label__ = 77; break;
    case 77: 
      __label__ = 78; break; //@line 4781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $155=$p; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $156=$155; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $157=$next; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $158=$157; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp180=(($156)>>>0) < (($158)>>>0); //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp180) { __label__ = 79; break; } else { var $161 = 0;__label__ = 80; break; } //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $159=$next; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head182=(($159+4)|0); //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $160=HEAP32[(($head182)>>2)]; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and183=$160 & 1; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool184=(($and183)|0)!=0; //@line 4783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161 = $tobool184;__label__ = 80; break;
    case 80: 
      var $161;
      var $conv186=(($161)&1);
      var $expval187=(($conv186)==(1));
      var $tobool188=(($expval187)|0)!=0;
      if ($tobool188) { __label__ = 81; break; } else { __label__ = 193; break; }
    case 81: 
      var $162=$next; //@line 4784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head190=(($162+4)|0); //@line 4784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $163=HEAP32[(($head190)>>2)]; //@line 4784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and191=$163 & 2; //@line 4784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool192=(($and191)|0)!=0; //@line 4784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool192) { __label__ = 154; break; } else { __label__ = 82; break; } //@line 4784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 82: 
      var $164=$next; //@line 4785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[((((__ZL4_gm_+24)|0))>>2)]; //@line 4785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp194=(($164)|0)==(($165)|0); //@line 4785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp194) { __label__ = 83; break; } else { __label__ = 88; break; } //@line 4785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 83: 
      var $166=$psize; //@line 4786 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $167=HEAP32[((((__ZL4_gm_+12)|0))>>2)]; //@line 4786 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add196=((($167)+($166))|0); //@line 4786 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+12)|0))>>2)]=$add196; //@line 4786 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tsize=$add196; //@line 4786 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $168=$p; //@line 4787 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+24)|0))>>2)]=$168; //@line 4787 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $169=$tsize; //@line 4788 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or197=$169 | 1; //@line 4788 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $170=$p; //@line 4788 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head198=(($170+4)|0); //@line 4788 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head198)>>2)]=$or197; //@line 4788 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $171=$p; //@line 4789 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $172=HEAP32[((((__ZL4_gm_+20)|0))>>2)]; //@line 4789 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp199=(($171)|0)==(($172)|0); //@line 4789 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp199) { __label__ = 84; break; } else { __label__ = 85; break; } //@line 4789 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 84: 
      HEAP32[((((__ZL4_gm_+20)|0))>>2)]=0; //@line 4790 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+8)|0))>>2)]=0; //@line 4791 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 85; break; //@line 4792 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 85: 
      var $173=$tsize; //@line 4793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $174=HEAPU32[((((__ZL4_gm_+28)|0))>>2)]; //@line 4793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp202=(($173)>>>0) > (($174)>>>0); //@line 4793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp202) { __label__ = 86; break; } else { __label__ = 87; break; } //@line 4793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 86: 
      var $call=__ZL8sys_trimP12malloc_statej(__ZL4_gm_, 0); //@line 4794 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 87; break; //@line 4794 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 87: 
      __label__ = 196; break; //@line 4795 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $175=$next; //@line 4797 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $176=HEAP32[((((__ZL4_gm_+20)|0))>>2)]; //@line 4797 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp206=(($175)|0)==(($176)|0); //@line 4797 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp206) { __label__ = 89; break; } else { __label__ = 90; break; } //@line 4797 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $177=$psize; //@line 4798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $178=HEAP32[((((__ZL4_gm_+8)|0))>>2)]; //@line 4798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add208=((($178)+($177))|0); //@line 4798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+8)|0))>>2)]=$add208; //@line 4798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $dsize=$add208; //@line 4798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $179=$p; //@line 4799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+20)|0))>>2)]=$179; //@line 4799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $180=$dsize; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or209=$180 | 1; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $181=$p; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head210=(($181+4)|0); //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head210)>>2)]=$or209; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $182=$dsize; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $183=$p; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $184=$183; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $185=$dsize; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr211=(($184+$185)|0); //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $186=$add_ptr211; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot212=(($186)|0); //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot212)>>2)]=$182; //@line 4800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $187=$next; //@line 4804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head214=(($187+4)|0); //@line 4804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $188=HEAP32[(($head214)>>2)]; //@line 4804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and215=$188 & -8; //@line 4804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nsize=$and215; //@line 4804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $189=$nsize; //@line 4805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $190=$psize; //@line 4805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add216=((($190)+($189))|0); //@line 4805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$add216; //@line 4805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $191=$nsize; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr217=$191 >>> 3; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp218=(($shr217)>>>0) < 32; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp218) { __label__ = 91; break; } else { __label__ = 103; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $192=$next; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd221=(($192+8)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $193=HEAP32[(($fd221)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F220=$193; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $194=$next; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk223=(($194+12)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $195=HEAP32[(($bk223)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B222=$195; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $196=$nsize; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr225=$196 >>> 3; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I224=$shr225; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $197=$F220; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $198=$B222; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp226=(($197)|0)==(($198)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp226) { __label__ = 92; break; } else { __label__ = 93; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $199=$I224; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl228=1 << $199; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg229=$shl228 ^ -1; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $200=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and230=$200 & $neg229; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_)|0))>>2)]=$and230; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 102; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 93: 
      var $201=$F220; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $202=$I224; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl232=$202 << 1; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx233=((((__ZL4_gm_+40)|0)+($shl232<<2))|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $203=$arrayidx233; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $204=$203; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp234=(($201)|0)==(($204)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp234) { __label__ = 95; break; } else { __label__ = 94; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 94: 
      var $205=$F220; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $206=$205; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $207=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp236=(($206)>>>0) >= (($207)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp236) { __label__ = 95; break; } else { var $216 = 0;__label__ = 98; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 95: 
      var $208=$B222; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $209=$I224; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl238=$209 << 1; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx239=((((__ZL4_gm_+40)|0)+($shl238<<2))|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $210=$arrayidx239; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $211=$210; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp240=(($208)|0)==(($211)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp240) { var $215 = 1;__label__ = 97; break; } else { __label__ = 96; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 96: 
      var $212=$B222; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $213=$212; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $214=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp242=(($213)>>>0) >= (($214)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $215 = $cmp242;__label__ = 97; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 97: 
      var $215;
      var $216 = $215;__label__ = 98; break;
    case 98: 
      var $216;
      var $conv245=(($216)&1);
      var $expval246=(($conv245)==(1));
      var $tobool247=(($expval246)|0)!=0;
      if ($tobool247) { __label__ = 99; break; } else { __label__ = 100; break; }
    case 99: 
      var $217=$B222; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $218=$F220; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk249=(($218+12)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk249)>>2)]=$217; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $219=$F220; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $220=$B222; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd250=(($220+8)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd250)>>2)]=$219; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 101; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 100: 
      _abort(); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 101; break;
    case 101: 
      __label__ = 102; break;
    case 102: 
      __label__ = 149; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 103: 
      var $221=$next; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $222=$221; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $TP255=$222; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $223=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent257=(($223+24)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $224=HEAP32[(($parent257)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $XP256=$224; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $225=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk259=(($225+12)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $226=HEAP32[(($bk259)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $227=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp260=(($226)|0)!=(($227)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp260) { __label__ = 104; break; } else { __label__ = 108; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 104: 
      var $228=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd263=(($228+8)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $229=HEAP32[(($fd263)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F262=$229; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $230=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk264=(($230+12)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $231=HEAP32[(($bk264)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R258=$231; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $232=$F262; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $233=$232; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $234=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp265=(($233)>>>0) >= (($234)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv266=(($cmp265)&1); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval267=(($conv266)==(1)); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool268=(($expval267)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool268) { __label__ = 105; break; } else { __label__ = 106; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 105: 
      var $235=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $236=$F262; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk270=(($236+12)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk270)>>2)]=$235; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $237=$F262; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $238=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd271=(($238+8)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd271)>>2)]=$237; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 107; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 106: 
      _abort(); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 107; break;
    case 107: 
      __label__ = 120; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 108: 
      var $239=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child276=(($239+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx277=(($child276+4)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP275=$arrayidx277; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $240=HEAP32[(($arrayidx277)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R258=$240; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp278=(($240)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp278) { __label__ = 110; break; } else { __label__ = 109; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 109: 
      var $241=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child280=(($241+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx281=(($child280)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP275=$arrayidx281; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $242=HEAP32[(($arrayidx281)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R258=$242; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp282=(($242)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp282) { __label__ = 110; break; } else { __label__ = 119; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 110: 
      __label__ = 111; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 111: 
      var $243=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child286=(($243+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx287=(($child286+4)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP284=$arrayidx287; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $244=HEAP32[(($arrayidx287)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp288=(($244)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp288) { var $247 = 1;__label__ = 113; break; } else { __label__ = 112; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 112: 
      var $245=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child290=(($245+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx291=(($child290)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP284=$arrayidx291; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $246=HEAP32[(($arrayidx291)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp292=(($246)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $247 = $cmp292;__label__ = 113; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 113: 
      var $247;
      if ($247) { __label__ = 114; break; } else { __label__ = 115; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 114: 
      var $248=$CP284; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP275=$248; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $249=HEAP32[(($248)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R258=$249; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 111; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 115: 
      var $250=$RP275; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $251=$250; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $252=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp296=(($251)>>>0) >= (($252)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv297=(($cmp296)&1); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval298=(($conv297)==(1)); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool299=(($expval298)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool299) { __label__ = 116; break; } else { __label__ = 117; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 116: 
      var $253=$RP275; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($253)>>2)]=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 118; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 117: 
      _abort(); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 118; break;
    case 118: 
      __label__ = 119; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 119: 
      __label__ = 120; break;
    case 120: 
      var $254=$XP256; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp305=(($254)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp305) { __label__ = 121; break; } else { __label__ = 148; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 121: 
      var $255=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index308=(($255+28)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $256=HEAP32[(($index308)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx309=((((__ZL4_gm_+304)|0)+($256<<2))|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H307=$arrayidx309; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $257=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $258=$H307; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $259=HEAP32[(($258)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp310=(($257)|0)==(($259)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp310) { __label__ = 122; break; } else { __label__ = 125; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 122: 
      var $260=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $261=$H307; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($261)>>2)]=$260; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp312=(($260)|0)==0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp312) { __label__ = 123; break; } else { __label__ = 124; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 123: 
      var $262=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index314=(($262+28)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $263=HEAP32[(($index314)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl315=1 << $263; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg316=$shl315 ^ -1; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $264=HEAP32[((((__ZL4_gm_+4)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and317=$264 & $neg316; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+4)|0))>>2)]=$and317; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 124; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 124: 
      __label__ = 132; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 125: 
      var $265=$XP256; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $266=$265; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $267=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp320=(($266)>>>0) >= (($267)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv321=(($cmp320)&1); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval322=(($conv321)==(1)); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool323=(($expval322)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool323) { __label__ = 126; break; } else { __label__ = 130; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 126: 
      var $268=$XP256; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child325=(($268+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx326=(($child325)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $269=HEAP32[(($arrayidx326)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $270=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp327=(($269)|0)==(($270)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp327) { __label__ = 127; break; } else { __label__ = 128; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 127: 
      var $271=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $272=$XP256; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child329=(($272+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx330=(($child329)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx330)>>2)]=$271; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 129; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 128: 
      var $273=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $274=$XP256; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child332=(($274+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx333=(($child332+4)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx333)>>2)]=$273; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 129; break;
    case 129: 
      __label__ = 131; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 130: 
      _abort(); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 131; break;
    case 131: 
      __label__ = 132; break;
    case 132: 
      var $275=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp338=(($275)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp338) { __label__ = 133; break; } else { __label__ = 147; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 133: 
      var $276=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $277=$276; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $278=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp340=(($277)>>>0) >= (($278)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv341=(($cmp340)&1); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval342=(($conv341)==(1)); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool343=(($expval342)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool343) { __label__ = 134; break; } else { __label__ = 145; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 134: 
      var $279=$XP256; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $280=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent347=(($280+24)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent347)>>2)]=$279; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $281=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child348=(($281+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx349=(($child348)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $282=HEAP32[(($arrayidx349)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C0345=$282; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp350=(($282)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp350) { __label__ = 135; break; } else { __label__ = 139; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 135: 
      var $283=$C0345; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $284=$283; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $285=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp352=(($284)>>>0) >= (($285)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv353=(($cmp352)&1); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval354=(($conv353)==(1)); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool355=(($expval354)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool355) { __label__ = 136; break; } else { __label__ = 137; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 136: 
      var $286=$C0345; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $287=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child357=(($287+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx358=(($child357)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx358)>>2)]=$286; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $288=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $289=$C0345; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent359=(($289+24)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent359)>>2)]=$288; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 138; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 137: 
      _abort(); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 138; break;
    case 138: 
      __label__ = 139; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 139: 
      var $290=$TP255; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child363=(($290+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx364=(($child363+4)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $291=HEAP32[(($arrayidx364)>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C1346=$291; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp365=(($291)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp365) { __label__ = 140; break; } else { __label__ = 144; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 140: 
      var $292=$C1346; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $293=$292; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $294=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp367=(($293)>>>0) >= (($294)>>>0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv368=(($cmp367)&1); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval369=(($conv368)==(1)); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool370=(($expval369)|0)!=0; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool370) { __label__ = 141; break; } else { __label__ = 142; break; } //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 141: 
      var $295=$C1346; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $296=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child372=(($296+16)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx373=(($child372+4)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx373)>>2)]=$295; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $297=$R258; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $298=$C1346; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent374=(($298+24)|0); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent374)>>2)]=$297; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 143; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 142: 
      _abort(); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 143; break;
    case 143: 
      __label__ = 144; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 144: 
      __label__ = 146; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 145: 
      _abort(); //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 146; break;
    case 146: 
      __label__ = 147; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 147: 
      __label__ = 148; break; //@line 4806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 148: 
      __label__ = 149; break;
    case 149: 
      var $299=$psize; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or383=$299 | 1; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $300=$p; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head384=(($300+4)|0); //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head384)>>2)]=$or383; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $301=$psize; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $302=$p; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $303=$302; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $304=$psize; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr385=(($303+$304)|0); //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $305=$add_ptr385; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot386=(($305)|0); //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot386)>>2)]=$301; //@line 4807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $306=$p; //@line 4808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $307=HEAP32[((((__ZL4_gm_+20)|0))>>2)]; //@line 4808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp387=(($306)|0)==(($307)|0); //@line 4808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp387) { __label__ = 150; break; } else { __label__ = 151; break; } //@line 4808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 150: 
      var $308=$psize; //@line 4809 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+8)|0))>>2)]=$308; //@line 4809 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 151: 
      __label__ = 152; break;
    case 152: 
      __label__ = 153; break;
    case 153: 
      __label__ = 155; break; //@line 4813 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 154: 
      var $309=$next; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head393=(($309+4)|0); //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $310=HEAP32[(($head393)>>2)]; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and394=$310 & -2; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head393)>>2)]=$and394; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $311=$psize; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or395=$311 | 1; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $312=$p; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head396=(($312+4)|0); //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head396)>>2)]=$or395; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $313=$psize; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $314=$p; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $315=$314; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $316=$psize; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr397=(($315+$316)|0); //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $317=$add_ptr397; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot398=(($317)|0); //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot398)>>2)]=$313; //@line 4815 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 155; break;
    case 155: 
      var $318=$psize; //@line 4817 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr400=$318 >>> 3; //@line 4817 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp401=(($shr400)>>>0) < 32; //@line 4817 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp401) { __label__ = 156; break; } else { __label__ = 163; break; } //@line 4817 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 156: 
      var $319=$psize; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr404=$319 >>> 3; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I403=$shr404; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $320=$I403; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl406=$320 << 1; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx407=((((__ZL4_gm_+40)|0)+($shl406<<2))|0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $321=$arrayidx407; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $322=$321; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B405=$322; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $323=$B405; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F408=$323; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $324=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $325=$I403; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl409=1 << $325; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and410=$324 & $shl409; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool411=(($and410)|0)!=0; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool411) { __label__ = 158; break; } else { __label__ = 157; break; } //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 157: 
      var $326=$I403; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl413=1 << $326; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $327=HEAP32[((((__ZL4_gm_)|0))>>2)]; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or414=$327 | $shl413; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_)|0))>>2)]=$or414; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 162; break; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 158: 
      var $328=$B405; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd416=(($328+8)|0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $329=HEAP32[(($fd416)>>2)]; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $330=$329; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $331=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp417=(($330)>>>0) >= (($331)>>>0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv418=(($cmp417)&1); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval419=(($conv418)==(1)); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool420=(($expval419)|0)!=0; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool420) { __label__ = 159; break; } else { __label__ = 160; break; } //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 159: 
      var $332=$B405; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd422=(($332+8)|0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $333=HEAP32[(($fd422)>>2)]; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F408=$333; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 161; break; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 160: 
      _abort(); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 161; break;
    case 161: 
      __label__ = 162; break;
    case 162: 
      var $334=$p; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $335=$B405; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd426=(($335+8)|0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd426)>>2)]=$334; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $336=$p; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $337=$F408; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk427=(($337+12)|0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk427)>>2)]=$336; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $338=$F408; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $339=$p; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd428=(($339+8)|0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd428)>>2)]=$338; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $340=$B405; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $341=$p; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk429=(($341+12)|0); //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk429)>>2)]=$340; //@line 4818 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 192; break; //@line 4820 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 163: 
      var $342=$p; //@line 4822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $343=$342; //@line 4822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tp=$343; //@line 4822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $344=$psize; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr433=$344 >>> 8; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $X=$shr433; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $345=$X; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp434=(($345)|0)==0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp434) { __label__ = 164; break; } else { __label__ = 165; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 164: 
      $I432=0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 169; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 165: 
      var $346=$X; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp437=(($346)>>>0) > 65535; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp437) { __label__ = 166; break; } else { __label__ = 167; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 166: 
      $I432=31; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 168; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 167: 
      var $347=$X; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$347; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $348=$Y; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=((($348)-(256))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr440=$sub >>> 16; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and441=$shr440 & 8; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$and441; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $349=$N; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $350=$Y; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl442=$350 << $349; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl442; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub443=((($shl442)-(4096))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr444=$sub443 >>> 16; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and445=$shr444 & 4; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and445; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $351=$K; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $352=$N; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add446=((($352)+($351))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add446; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $353=$K; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $354=$Y; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl447=$354 << $353; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl447; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub448=((($shl447)-(16384))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr449=$sub448 >>> 16; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and450=$shr449 & 2; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and450; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $355=$N; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add451=((($355)+($and450))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add451; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $356=$N; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub452=(((14)-($356))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $357=$K; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $358=$Y; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl453=$358 << $357; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl453; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr454=$shl453 >>> 15; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add455=((($sub452)+($shr454))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$add455; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $359=$K; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl456=$359 << 1; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $360=$psize; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $361=$K; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add457=((($361)+(7))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr458=$360 >>> (($add457)>>>0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and459=$shr458 & 1; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add460=((($shl456)+($and459))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I432=$add460; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 168; break;
    case 168: 
      __label__ = 169; break;
    case 169: 
      var $362=$I432; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx463=((((__ZL4_gm_+304)|0)+($362<<2))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H431=$arrayidx463; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $363=$I432; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $364=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index464=(($364+28)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index464)>>2)]=$363; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $365=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child465=(($365+16)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx466=(($child465+4)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx466)>>2)]=0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $366=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child467=(($366+16)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx468=(($child467)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx468)>>2)]=0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $367=HEAP32[((((__ZL4_gm_+4)|0))>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $368=$I432; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl469=1 << $368; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and470=$367 & $shl469; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool471=(($and470)|0)!=0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool471) { __label__ = 171; break; } else { __label__ = 170; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 170: 
      var $369=$I432; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl473=1 << $369; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $370=HEAP32[((((__ZL4_gm_+4)|0))>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or474=$370 | $shl473; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+4)|0))>>2)]=$or474; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $371=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $372=$H431; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($372)>>2)]=$371; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $373=$H431; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $374=$373; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $375=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent475=(($375+24)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent475)>>2)]=$374; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $376=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $377=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk476=(($377+12)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk476)>>2)]=$376; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $378=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd477=(($378+8)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd477)>>2)]=$376; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 189; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 171: 
      var $379=$H431; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $380=HEAP32[(($379)>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$380; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $381=$psize; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $382=$I432; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp480=(($382)|0)==31; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp480) { __label__ = 172; break; } else { __label__ = 173; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 172: 
      var $cond = 0;__label__ = 174; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 173: 
      var $383=$I432; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr481=$383 >>> 1; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add482=((($shr481)+(8))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub483=((($add482)-(2))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub484=(((31)-($sub483))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $sub484;__label__ = 174; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 174: 
      var $cond; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl485=$381 << $cond; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K479=$shl485; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 175; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 175: 
      var $384=$T; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head486=(($384+4)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $385=HEAP32[(($head486)>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and487=$385 & -8; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $386=$psize; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp488=(($and487)|0)!=(($386)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp488) { __label__ = 176; break; } else { __label__ = 182; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 176: 
      var $387=$K479; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr490=$387 >>> 31; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and491=$shr490 & 1; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $388=$T; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child492=(($388+16)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx493=(($child492+($and491<<2))|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx493; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $389=$K479; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl494=$389 << 1; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K479=$shl494; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $390=$C; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $391=HEAP32[(($390)>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp495=(($391)|0)!=0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp495) { __label__ = 177; break; } else { __label__ = 178; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 177: 
      var $392=$C; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $393=HEAP32[(($392)>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$393; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 181; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 178: 
      var $394=$C; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $395=$394; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $396=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp498=(($395)>>>0) >= (($396)>>>0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv499=(($cmp498)&1); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval500=(($conv499)==(1)); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool501=(($expval500)|0)!=0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool501) { __label__ = 179; break; } else { __label__ = 180; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 179: 
      var $397=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $398=$C; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($398)>>2)]=$397; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $399=$T; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $400=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent503=(($400+24)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent503)>>2)]=$399; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $401=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $402=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk504=(($402+12)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk504)>>2)]=$401; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $403=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd505=(($403+8)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd505)>>2)]=$401; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 188; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 180: 
      _abort(); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 188; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 181: 
      __label__ = 187; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 182: 
      var $404=$T; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd510=(($404+8)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $405=HEAP32[(($fd510)>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F509=$405; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $406=$T; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $407=$406; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $408=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp511=(($407)>>>0) >= (($408)>>>0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp511) { __label__ = 183; break; } else { var $412 = 0;__label__ = 184; break; } //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 183: 
      var $409=$F509; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $410=$409; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $411=HEAPU32[((((__ZL4_gm_+16)|0))>>2)]; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp513=(($410)>>>0) >= (($411)>>>0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $412 = $cmp513;__label__ = 184; break;
    case 184: 
      var $412;
      var $conv515=(($412)&1);
      var $expval516=(($conv515)==(1));
      var $tobool517=(($expval516)|0)!=0;
      if ($tobool517) { __label__ = 185; break; } else { __label__ = 186; break; }
    case 185: 
      var $413=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $414=$F509; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk519=(($414+12)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk519)>>2)]=$413; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $415=$T; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd520=(($415+8)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd520)>>2)]=$413; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $416=$F509; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $417=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd521=(($417+8)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd521)>>2)]=$416; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $418=$T; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $419=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk522=(($419+12)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk522)>>2)]=$418; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $420=$tp; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent523=(($420+24)|0); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent523)>>2)]=0; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 188; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 186: 
      _abort(); //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 188; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 187: 
      __label__ = 175; break; //@line 4823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 188: 
      __label__ = 189; break;
    case 189: 
      var $421=HEAP32[((((__ZL4_gm_+32)|0))>>2)]; //@line 4825 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dec=((($421)-(1))|0); //@line 4825 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+32)|0))>>2)]=$dec; //@line 4825 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp527=(($dec)|0)==0; //@line 4825 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp527) { __label__ = 190; break; } else { __label__ = 191; break; } //@line 4825 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 190: 
      var $call529=__ZL23release_unused_segmentsP12malloc_state(__ZL4_gm_); //@line 4826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 191; break; //@line 4826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 191: 
      __label__ = 192; break;
    case 192: 
      __label__ = 196; break; //@line 4828 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 193: 
      __label__ = 194; break; //@line 4830 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 194: 
      __label__ = 195; break; //@line 4830 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 195: 
      _abort(); //@line 4832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 196; break; //@line 4832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 196: 
      __label__ = 197; break; //@line 4836 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 197: 
      ;
      return; //@line 4840 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
Module["_free"] = _free;_free["X"]=1;

function __ZL8sys_trimP12malloc_statej($m, $pad) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $pad_addr;
      var $released;
      var $unit;
      var $extra;
      var $sp;
      var $old_br;
      var $rel_br;
      var $new_br;
      $m_addr=$m;
      $pad_addr=$pad;
      $released=0; //@line 4126 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $0=HEAP32[((((__ZL7mparams)|0))>>2)]; //@line 4127 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)!=0; //@line 4127 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { var $1 = 1;__label__ = 4; break; } else { __label__ = 3; break; } //@line 4127 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=__ZL12init_mparamsv(); //@line 4127 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($call)|0)!=0; //@line 4127 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1 = $tobool;__label__ = 4; break; //@line 4127 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1;
      var $2=$pad_addr; //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($2)>>>0) < 4294967232; //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 26; break; } //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $3=$m_addr; //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top=(($3+24)|0); //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=HEAP32[(($top)>>2)]; //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($4)|0)!=0; //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 6; break; } else { __label__ = 26; break; } //@line 4128 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $5=$pad_addr; //@line 4129 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($5)+(40))|0); //@line 4129 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $pad_addr=$add; //@line 4129 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$m_addr; //@line 4131 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($6+12)|0); //@line 4131 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=HEAPU32[(($topsize)>>2)]; //@line 4131 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=$pad_addr; //@line 4131 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp3=(($7)>>>0) > (($8)>>>0); //@line 4131 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp3) { __label__ = 7; break; } else { __label__ = 22; break; } //@line 4131 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $9=HEAP32[((((__ZL7mparams+8)|0))>>2)]; //@line 4133 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $unit=$9; //@line 4133 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$m_addr; //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize5=(($10+12)|0); //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=HEAP32[(($topsize5)>>2)]; //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$pad_addr; //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=((($11)-($12))|0); //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=$unit; //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub6=((($13)-(1))|0); //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add7=((($sub)+($sub6))|0); //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$unit; //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $div=Math.floor(((($add7)>>>0))/((($14)>>>0))); //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub8=((($div)-(1))|0); //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$unit; //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $mul=((($sub8)*($15))|0); //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $extra=$mul; //@line 4135 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$m_addr; //@line 4136 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$m_addr; //@line 4136 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top9=(($17+24)|0); //@line 4136 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=HEAP32[(($top9)>>2)]; //@line 4136 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$18; //@line 4136 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call10=__ZL15segment_holdingP12malloc_statePc($16, $19); //@line 4136 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$call10; //@line 4136 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$sp; //@line 4138 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($20+12)|0); //@line 4138 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=HEAP32[(($sflags)>>2)]; //@line 4138 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$21 & 8; //@line 4138 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool11=(($and)|0)!=0; //@line 4138 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool11) { __label__ = 19; break; } else { __label__ = 8; break; } //@line 4138 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $22=$sp; //@line 4139 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags13=(($22+12)|0); //@line 4139 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=HEAP32[(($sflags13)>>2)]; //@line 4139 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and14=$23 & 0; //@line 4139 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool15=(($and14)|0)!=0; //@line 4139 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool15) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 4139 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      __label__ = 18; break; //@line 4150 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $24=$extra; //@line 4152 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp17=(($24)>>>0) >= 2147483647; //@line 4152 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp17) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 4152 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $25=$unit; //@line 4153 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub19=(((-2147483648)-($25))|0); //@line 4153 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $extra=$sub19; //@line 4153 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 4153 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $call20=_sbrk(0); //@line 4157 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $old_br=$call20; //@line 4157 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$old_br; //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=$sp; //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base=(($27)|0); //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=HEAP32[(($base)>>2)]; //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=$sp; //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size=(($29+4)|0); //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=HEAP32[(($size)>>2)]; //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($28+$30)|0); //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp21=(($26)|0)==(($add_ptr)|0); //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp21) { __label__ = 13; break; } else { __label__ = 17; break; } //@line 4158 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $31=$extra; //@line 4159 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub23=(((-$31))|0); //@line 4159 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call24=_sbrk($sub23); //@line 4159 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rel_br=$call24; //@line 4159 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call25=_sbrk(0); //@line 4160 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $new_br=$call25; //@line 4160 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=$rel_br; //@line 4161 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($32)|0)!=-1; //@line 4161 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 14; break; } else { __label__ = 16; break; } //@line 4161 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $33=$new_br; //@line 4161 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=$old_br; //@line 4161 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp28=(($33)>>>0) < (($34)>>>0); //@line 4161 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp28) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 4161 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $35=$old_br; //@line 4162 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $36=$new_br; //@line 4162 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$35; //@line 4162 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$36; //@line 4162 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 4162 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $released=$sub_ptr_sub; //@line 4162 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 16; break; //@line 4162 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      __label__ = 17; break; //@line 4163 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 17: 
      __label__ = 18; break;
    case 18: 
      __label__ = 19; break; //@line 4167 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $37=$released; //@line 4169 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp34=(($37)|0)!=0; //@line 4169 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp34) { __label__ = 20; break; } else { __label__ = 21; break; } //@line 4169 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $38=$released; //@line 4170 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $39=$sp; //@line 4170 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size36=(($39+4)|0); //@line 4170 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($size36)>>2)]; //@line 4170 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub37=((($40)-($38))|0); //@line 4170 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size36)>>2)]=$sub37; //@line 4170 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$released; //@line 4171 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $42=$m_addr; //@line 4171 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($42+432)|0); //@line 4171 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=HEAP32[(($footprint)>>2)]; //@line 4171 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub38=((($43)-($41))|0); //@line 4171 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($footprint)>>2)]=$sub38; //@line 4171 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $44=$m_addr; //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $45=$m_addr; //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top39=(($45+24)|0); //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $46=HEAP32[(($top39)>>2)]; //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$m_addr; //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize40=(($47+12)|0); //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=HEAP32[(($topsize40)>>2)]; //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $49=$released; //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub41=((($48)-($49))|0); //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __ZL8init_topP12malloc_stateP12malloc_chunkj($44, $46, $sub41); //@line 4172 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 4174 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 21: 
      __label__ = 22; break; //@line 4175 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $50=$released; //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp44=(($50)|0)==0; //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp44) { __label__ = 23; break; } else { __label__ = 25; break; } //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $51=$m_addr; //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize46=(($51+12)|0); //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=HEAPU32[(($topsize46)>>2)]; //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$m_addr; //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $trim_check=(($53+28)|0); //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $54=HEAPU32[(($trim_check)>>2)]; //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp47=(($52)>>>0) > (($54)>>>0); //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp47) { __label__ = 24; break; } else { __label__ = 25; break; } //@line 4182 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $55=$m_addr; //@line 4183 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $trim_check49=(($55+28)|0); //@line 4183 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($trim_check49)>>2)]=-1; //@line 4183 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 25; break; //@line 4183 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 25: 
      __label__ = 26; break; //@line 4184 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $56=$released; //@line 4186 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp52=(($56)|0)!=0; //@line 4186 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond=$cmp52 ? 1 : 0; //@line 4186 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $cond; //@line 4186 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL8sys_trimP12malloc_statej["X"]=1;

function __ZL15segment_holdingP12malloc_statePc($m, $addr) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $addr_addr;
      var $sp;
      $m_addr=$m;
      $addr_addr=$addr;
      var $0=$m_addr; //@line 2562 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg=(($0+444)|0); //@line 2562 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$seg; //@line 2562 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 2563 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $1=$addr_addr; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$sp; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base=(($2)|0); //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=HEAPU32[(($base)>>2)]; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($1)>>>0) >= (($3)>>>0); //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 6; break; } //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $4=$addr_addr; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$sp; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base1=(($5)|0); //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=HEAP32[(($base1)>>2)]; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$sp; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size=(($7+4)|0); //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[(($size)>>2)]; //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($6+$8)|0); //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp2=(($4)>>>0) < (($add_ptr)>>>0); //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp2) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 2564 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $9=$sp; //@line 2565 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=$9; //@line 2565 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 2565 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $10=$sp; //@line 2566 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $next=(($10+8)|0); //@line 2566 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=HEAP32[(($next)>>2)]; //@line 2566 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$11; //@line 2566 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp3=(($11)|0)==0; //@line 2566 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp3) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 2566 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      $retval=0; //@line 2567 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 2567 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      __label__ = 3; break; //@line 2568 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $12=$retval; //@line 2569 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $12; //@line 2569 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function __ZL23release_unused_segmentsP12malloc_state($m) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $released;
      var $nsegs;
      var $pred;
      var $sp;
      var $base;
      var $size;
      var $next3;
      var $p;
      var $psize;
      var $tp;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $H136;
      var $I;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K184;
      var $C;
      var $F219;
      $m_addr=$m;
      $released=0; //@line 4079 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nsegs=0; //@line 4080 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $0=$m_addr; //@line 4081 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg=(($0+444)|0); //@line 4081 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $pred=$seg; //@line 4081 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=$pred; //@line 4082 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $next=(($1+8)|0); //@line 4082 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=HEAP32[(($next)>>2)]; //@line 4082 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$2; //@line 4082 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 4083 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $3=$sp; //@line 4083 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($3)|0)!=0; //@line 4083 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 88; break; } //@line 4083 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $4=$sp; //@line 4084 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base1=(($4)|0); //@line 4084 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=HEAP32[(($base1)>>2)]; //@line 4084 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $base=$5; //@line 4084 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$sp; //@line 4085 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size2=(($6+4)|0); //@line 4085 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=HEAP32[(($size2)>>2)]; //@line 4085 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $size=$7; //@line 4085 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=$sp; //@line 4086 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $next4=(($8+8)|0); //@line 4086 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=HEAP32[(($next4)>>2)]; //@line 4086 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $next3=$9; //@line 4086 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$nsegs; //@line 4087 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $inc=((($10)+(1))|0); //@line 4087 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nsegs=$inc; //@line 4087 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$sp; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($11+12)|0); //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=HEAP32[(($sflags)>>2)]; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$12 & 0; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($and)|0)!=0; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 5; break; } else { __label__ = 87; break; } //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $13=$sp; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags5=(($13+12)|0); //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=HEAP32[(($sflags5)>>2)]; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and6=$14 & 8; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool7=(($and6)|0)!=0; //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool7) { __label__ = 87; break; } else { __label__ = 6; break; } //@line 4088 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $15=$base; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$base; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($16+8)|0); //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$add_ptr; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and8=$17 & 7; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp9=(($and8)|0)==0; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp9) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $cond = 0;__label__ = 9; break; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $18=$base; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr10=(($18+8)|0); //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$add_ptr10; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and11=$19 & 7; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and11))|0); //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and12=$sub & 7; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $and12;__label__ = 9; break; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $cond; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr13=(($15+$cond)|0); //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$add_ptr13; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$20; //@line 4089 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$p; //@line 4090 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($21+4)|0); //@line 4090 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=HEAP32[(($head)>>2)]; //@line 4090 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and14=$22 & -8; //@line 4090 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$and14; //@line 4090 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=$p; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head15=(($23+4)|0); //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=HEAP32[(($head15)>>2)]; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and16=$24 & 3; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp17=(($and16)|0)!=1; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp17) { __label__ = 86; break; } else { __label__ = 10; break; } //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $25=$p; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$25; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=$psize; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr19=(($26+$27)|0); //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=$base; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=$size; //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr20=(($28+$29)|0); //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr21=((($add_ptr20)-(40))|0); //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($add_ptr19)>>>0) >= (($add_ptr21)>>>0); //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 11; break; } else { __label__ = 86; break; } //@line 4092 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $30=$p; //@line 4093 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=$30; //@line 4093 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tp=$31; //@line 4093 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=$p; //@line 4095 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $33=$m_addr; //@line 4095 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dv=(($33+20)|0); //@line 4095 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=HEAP32[(($dv)>>2)]; //@line 4095 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($32)|0)==(($34)|0); //@line 4095 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 12; break; } else { __label__ = 13; break; } //@line 4095 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $35=$m_addr; //@line 4096 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dv26=(($35+20)|0); //@line 4096 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dv26)>>2)]=0; //@line 4096 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $36=$m_addr; //@line 4097 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($36+8)|0); //@line 4097 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dvsize)>>2)]=0; //@line 4097 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 59; break; //@line 4098 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $37=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent=(($37+24)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $38=HEAP32[(($parent)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $XP=$38; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $39=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($39+12)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($bk)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp27=(($40)|0)!=(($41)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp27) { __label__ = 14; break; } else { __label__ = 18; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $42=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($42+8)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=HEAP32[(($fd)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$43; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $44=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk29=(($44+12)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $45=HEAP32[(($bk29)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$45; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $46=$F; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$46; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($48+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $49=HEAPU32[(($least_addr)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp30=(($47)>>>0) >= (($49)>>>0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp30)&1); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool31=(($expval)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool31) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $50=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $51=$F; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk33=(($51+12)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk33)>>2)]=$50; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=$F; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd34=(($53+8)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd34)>>2)]=$52; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 17; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      _abort(); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 17; break;
    case 17: 
      __label__ = 30; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $54=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child=(($54+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($child+4)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $55=HEAP32[(($arrayidx)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$55; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp37=(($55)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp37) { __label__ = 20; break; } else { __label__ = 19; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $56=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child38=(($56+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx39=(($child38)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx39; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $57=HEAP32[(($arrayidx39)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$57; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp40=(($57)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp40) { __label__ = 20; break; } else { __label__ = 29; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      __label__ = 21; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $58=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child43=(($58+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx44=(($child43+4)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx44; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59=HEAP32[(($arrayidx44)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp45=(($59)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp45) { var $62 = 1;__label__ = 23; break; } else { __label__ = 22; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 22: 
      var $60=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child46=(($60+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx47=(($child46)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx47; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $61=HEAP32[(($arrayidx47)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp48=(($61)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62 = $cmp48;__label__ = 23; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $62;
      if ($62) { __label__ = 24; break; } else { __label__ = 25; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 24: 
      var $63=$CP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$63; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $64=HEAP32[(($63)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$64; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 21; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 25: 
      var $65=$RP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=$65; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $67=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr50=(($67+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $68=HEAPU32[(($least_addr50)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp51=(($66)>>>0) >= (($68)>>>0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv52=(($cmp51)&1); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval53=(($conv52)==(1)); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool54=(($expval53)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool54) { __label__ = 26; break; } else { __label__ = 27; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $69=$RP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($69)>>2)]=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 27: 
      _abort(); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 28; break;
    case 28: 
      __label__ = 29; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 29: 
      __label__ = 30; break;
    case 30: 
      var $70=$XP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp60=(($70)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp60) { __label__ = 31; break; } else { __label__ = 58; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $71=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index=(($71+28)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $72=HEAP32[(($index)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $73=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($73+304)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx62=(($treebins+($72<<2))|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx62; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $74=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $75=$H; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=HEAP32[(($75)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp63=(($74)|0)==(($76)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp63) { __label__ = 32; break; } else { __label__ = 35; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $77=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $78=$H; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($78)>>2)]=$77; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp65=(($77)|0)==0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp65) { __label__ = 33; break; } else { __label__ = 34; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $79=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index67=(($79+28)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $80=HEAP32[(($index67)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $80; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $81=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($81+4)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $82=HEAP32[(($treemap)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and68=$82 & $neg; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap)>>2)]=$and68; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 34; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      __label__ = 42; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $83=$XP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $84=$83; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $85=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr71=(($85+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $86=HEAPU32[(($least_addr71)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp72=(($84)>>>0) >= (($86)>>>0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv73=(($cmp72)&1); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval74=(($conv73)==(1)); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool75=(($expval74)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool75) { __label__ = 36; break; } else { __label__ = 40; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $87=$XP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child77=(($87+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx78=(($child77)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $88=HEAP32[(($arrayidx78)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $89=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp79=(($88)|0)==(($89)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp79) { __label__ = 37; break; } else { __label__ = 38; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $90=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $91=$XP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child81=(($91+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx82=(($child81)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx82)>>2)]=$90; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 39; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $92=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $93=$XP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child84=(($93+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx85=(($child84+4)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx85)>>2)]=$92; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 39; break;
    case 39: 
      __label__ = 41; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 40: 
      _abort(); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break;
    case 41: 
      __label__ = 42; break;
    case 42: 
      var $94=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp90=(($94)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp90) { __label__ = 43; break; } else { __label__ = 57; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 43: 
      var $95=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=$95; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $97=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr92=(($97+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $98=HEAPU32[(($least_addr92)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp93=(($96)>>>0) >= (($98)>>>0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv94=(($cmp93)&1); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval95=(($conv94)==(1)); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool96=(($expval95)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool96) { __label__ = 44; break; } else { __label__ = 55; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $99=$XP; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $100=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent98=(($100+24)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent98)>>2)]=$99; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child99=(($101+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx100=(($child99)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $102=HEAP32[(($arrayidx100)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C0=$102; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp101=(($102)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp101) { __label__ = 45; break; } else { __label__ = 49; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 45: 
      var $103=$C0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $104=$103; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $105=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr103=(($105+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $106=HEAPU32[(($least_addr103)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp104=(($104)>>>0) >= (($106)>>>0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv105=(($cmp104)&1); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval106=(($conv105)==(1)); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool107=(($expval106)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool107) { __label__ = 46; break; } else { __label__ = 47; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $107=$C0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $108=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child109=(($108+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx110=(($child109)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx110)>>2)]=$107; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $109=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $110=$C0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent111=(($110+24)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent111)>>2)]=$109; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 47: 
      _abort(); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 48; break;
    case 48: 
      __label__ = 49; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $111=$tp; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child115=(($111+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx116=(($child115+4)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $112=HEAP32[(($arrayidx116)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C1=$112; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp117=(($112)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp117) { __label__ = 50; break; } else { __label__ = 54; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $113=$C1; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=$113; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $115=$m_addr; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr119=(($115+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $116=HEAPU32[(($least_addr119)>>2)]; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp120=(($114)>>>0) >= (($116)>>>0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv121=(($cmp120)&1); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval122=(($conv121)==(1)); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool123=(($expval122)|0)!=0; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool123) { __label__ = 51; break; } else { __label__ = 52; break; } //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $117=$C1; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $118=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child125=(($118+16)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx126=(($child125+4)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx126)>>2)]=$117; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $119=$R; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $120=$C1; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent127=(($120+24)|0); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent127)>>2)]=$119; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 53; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 52: 
      _abort(); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 53; break;
    case 53: 
      __label__ = 54; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 54: 
      __label__ = 56; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 55: 
      _abort(); //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 56; break;
    case 56: 
      __label__ = 57; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 57: 
      __label__ = 58; break; //@line 4100 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 58: 
      __label__ = 59; break;
    case 59: 
      var $121=$psize; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr=$121 >>> 8; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $X=$shr; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $122=$X; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp137=(($122)|0)==0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp137) { __label__ = 60; break; } else { __label__ = 61; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 60: 
      $I=0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 65; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 61: 
      var $123=$X; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp140=(($123)>>>0) > 65535; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp140) { __label__ = 62; break; } else { __label__ = 63; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 62: 
      $I=31; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 64; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $124=$X; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$124; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $125=$Y; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub143=((($125)-(256))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr144=$sub143 >>> 16; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and145=$shr144 & 8; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$and145; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=$N; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $127=$Y; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl146=$127 << $126; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl146; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub147=((($shl146)-(4096))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr148=$sub147 >>> 16; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and149=$shr148 & 4; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and149; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $128=$K; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $129=$N; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($129)+($128))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $130=$K; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $131=$Y; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl150=$131 << $130; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl150; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub151=((($shl150)-(16384))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr152=$sub151 >>> 16; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and153=$shr152 & 2; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and153; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $132=$N; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add154=((($132)+($and153))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add154; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $133=$N; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub155=(((14)-($133))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $134=$K; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135=$Y; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl156=$135 << $134; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl156; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr157=$shl156 >>> 15; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add158=((($sub155)+($shr157))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$add158; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $136=$K; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl159=$136 << 1; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $137=$psize; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $138=$K; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add160=((($138)+(7))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr161=$137 >>> (($add160)>>>0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and162=$shr161 & 1; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add163=((($shl159)+($and162))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I=$add163; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 64; break;
    case 64: 
      __label__ = 65; break;
    case 65: 
      var $139=$I; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $140=$m_addr; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins166=(($140+304)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx167=(($treebins166+($139<<2))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H136=$arrayidx167; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=$I; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $142=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index168=(($142+28)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index168)>>2)]=$141; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $143=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child169=(($143+16)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx170=(($child169+4)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx170)>>2)]=0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $144=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child171=(($144+16)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx172=(($child171)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx172)>>2)]=0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $145=$m_addr; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap173=(($145+4)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=HEAP32[(($treemap173)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $147=$I; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl174=1 << $147; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and175=$146 & $shl174; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool176=(($and175)|0)!=0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool176) { __label__ = 67; break; } else { __label__ = 66; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 66: 
      var $148=$I; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl178=1 << $148; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $149=$m_addr; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap179=(($149+4)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $150=HEAP32[(($treemap179)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$150 | $shl178; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap179)>>2)]=$or; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $152=$H136; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($152)>>2)]=$151; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $153=$H136; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=$153; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $155=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent180=(($155+24)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent180)>>2)]=$154; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $156=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $157=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk181=(($157+12)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk181)>>2)]=$156; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $158=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd182=(($158+8)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd182)>>2)]=$156; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 85; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 67: 
      var $159=$H136; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $160=HEAP32[(($159)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$160; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161=$psize; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $162=$I; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp185=(($162)|0)==31; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp185) { __label__ = 68; break; } else { __label__ = 69; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 68: 
      var $cond193 = 0;__label__ = 70; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 69: 
      var $163=$I; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr188=$163 >>> 1; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add189=((($shr188)+(8))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub190=((($add189)-(2))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub191=(((31)-($sub190))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond193 = $sub191;__label__ = 70; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 70: 
      var $cond193; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl194=$161 << $cond193; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K184=$shl194; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 71; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 71: 
      var $164=$T; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head195=(($164+4)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[(($head195)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and196=$165 & -8; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $166=$psize; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp197=(($and196)|0)!=(($166)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp197) { __label__ = 72; break; } else { __label__ = 78; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 72: 
      var $167=$K184; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr199=$167 >>> 31; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and200=$shr199 & 1; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $168=$T; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child201=(($168+16)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx202=(($child201+($and200<<2))|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx202; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $169=$K184; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl203=$169 << 1; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K184=$shl203; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $170=$C; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $171=HEAP32[(($170)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp204=(($171)|0)!=0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp204) { __label__ = 73; break; } else { __label__ = 74; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $172=$C; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $173=HEAP32[(($172)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$173; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 77; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $174=$C; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $175=$174; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $176=$m_addr; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr207=(($176+16)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $177=HEAPU32[(($least_addr207)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp208=(($175)>>>0) >= (($177)>>>0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv209=(($cmp208)&1); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval210=(($conv209)==(1)); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool211=(($expval210)|0)!=0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool211) { __label__ = 75; break; } else { __label__ = 76; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 75: 
      var $178=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $179=$C; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($179)>>2)]=$178; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $180=$T; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $181=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent213=(($181+24)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent213)>>2)]=$180; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $182=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $183=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk214=(($183+12)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk214)>>2)]=$182; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $184=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd215=(($184+8)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd215)>>2)]=$182; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 84; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 76: 
      _abort(); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 84; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 77: 
      __label__ = 83; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 78: 
      var $185=$T; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd220=(($185+8)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $186=HEAP32[(($fd220)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F219=$186; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $187=$T; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $188=$187; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $189=$m_addr; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr221=(($189+16)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $190=HEAPU32[(($least_addr221)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp222=(($188)>>>0) >= (($190)>>>0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp222) { __label__ = 79; break; } else { var $195 = 0;__label__ = 80; break; } //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 79: 
      var $191=$F219; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $192=$191; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $193=$m_addr; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr223=(($193+16)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $194=HEAPU32[(($least_addr223)>>2)]; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp224=(($192)>>>0) >= (($194)>>>0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $195 = $cmp224;__label__ = 80; break;
    case 80: 
      var $195;
      var $conv225=(($195)&1);
      var $expval226=(($conv225)==(1));
      var $tobool227=(($expval226)|0)!=0;
      if ($tobool227) { __label__ = 81; break; } else { __label__ = 82; break; }
    case 81: 
      var $196=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $197=$F219; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk229=(($197+12)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk229)>>2)]=$196; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $198=$T; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd230=(($198+8)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd230)>>2)]=$196; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $199=$F219; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $200=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd231=(($200+8)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd231)>>2)]=$199; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $201=$T; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $202=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk232=(($202+12)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk232)>>2)]=$201; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $203=$tp; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent233=(($203+24)|0); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent233)>>2)]=0; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 84; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 82: 
      _abort(); //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 84; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 83: 
      __label__ = 71; break; //@line 4110 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 84: 
      __label__ = 85; break;
    case 85: 
      __label__ = 86; break; //@line 4112 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 86: 
      __label__ = 87; break; //@line 4113 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 87: 
      var $204=$sp; //@line 4116 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $pred=$204; //@line 4116 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $205=$next3; //@line 4117 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$205; //@line 4117 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 4118 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $206=$nsegs; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp240=(($206)>>>0) > 4294967295; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp240) { __label__ = 89; break; } else { __label__ = 90; break; } //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $207=$nsegs; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond244 = $207;__label__ = 91; break; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $cond244 = -1;__label__ = 91; break; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $cond244; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $208=$m_addr; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $release_checks=(($208+32)|0); //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($release_checks)>>2)]=$cond244; //@line 4120 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $209=$released; //@line 4122 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $209; //@line 4122 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL23release_unused_segmentsP12malloc_state["X"]=1;

function __ZL12init_mparamsv() {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $magic;
      var $psize;
      var $gsize;
      var $0=HEAP32[((((__ZL7mparams)|0))>>2)]; //@line 2965 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)|0)==0; //@line 2965 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 7; break; } //@line 2965 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $call=_sysconf(8); //@line 2971 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$call; //@line 2971 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=$psize; //@line 2972 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $gsize=$1; //@line 2972 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$gsize; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=$gsize; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=((($3)-(1))|0); //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$2 & $sub; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp1=(($and)|0)!=0; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp1) { __label__ = 5; break; } else { __label__ = 4; break; } //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $4=$psize; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$psize; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub2=((($5)-(1))|0); //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and3=$4 & $sub2; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($and3)|0)!=0; //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 2989 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      _abort(); //@line 2997 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 2997 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $6=$gsize; //@line 2999 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL7mparams+8)|0))>>2)]=$6; //@line 2999 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$psize; //@line 3000 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL7mparams+4)|0))>>2)]=$7; //@line 3000 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL7mparams+12)|0))>>2)]=-1; //@line 3001 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL7mparams+16)|0))>>2)]=2097152; //@line 3002 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL7mparams+20)|0))>>2)]=0; //@line 3004 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[((((__ZL7mparams+20)|0))>>2)]; //@line 3011 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL4_gm_+440)|0))>>2)]=$8; //@line 3011 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call6=_time(0); //@line 3030 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $xor=$call6 ^ 1431655765; //@line 3030 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $magic=$xor; //@line 3030 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$magic; //@line 3032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$9 | 8; //@line 3032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $magic=$or; //@line 3032 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$magic; //@line 3033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and7=$10 & -8; //@line 3033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $magic=$and7; //@line 3033 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$magic; //@line 3034 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[((((__ZL7mparams)|0))>>2)]=$11; //@line 3034 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 7; break; //@line 3036 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      ;
      return 1; //@line 3039 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function __ZL8init_topP12malloc_stateP12malloc_chunkj($m, $p, $psize) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $p_addr;
      var $psize_addr;
      var $offset;
      $m_addr=$m;
      $p_addr=$p;
      $psize_addr=$psize;
      var $0=$p_addr; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=$0; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($1+8)|0); //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$2 & 7; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($and)|0)==0; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $cond = 0;__label__ = 5; break; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $3=$p_addr; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=$3; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr1=(($4+8)|0); //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$add_ptr1; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and2=$5 & 7; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and2))|0); //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and3=$sub & 7; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $and3;__label__ = 5; break; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $offset=$cond; //@line 3736 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$p_addr; //@line 3737 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$6; //@line 3737 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=$offset; //@line 3737 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr4=(($7+$8)|0); //@line 3737 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$add_ptr4; //@line 3737 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p_addr=$9; //@line 3737 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$offset; //@line 3738 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$psize_addr; //@line 3738 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub5=((($11)-($10))|0); //@line 3738 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize_addr=$sub5; //@line 3738 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$p_addr; //@line 3740 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=$m_addr; //@line 3740 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top=(($13+24)|0); //@line 3740 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($top)>>2)]=$12; //@line 3740 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$psize_addr; //@line 3741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$m_addr; //@line 3741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($15+12)|0); //@line 3741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($topsize)>>2)]=$14; //@line 3741 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$psize_addr; //@line 3742 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$16 | 1; //@line 3742 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$p_addr; //@line 3742 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($17+4)|0); //@line 3742 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or; //@line 3742 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=$p_addr; //@line 3744 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$18; //@line 3744 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$psize_addr; //@line 3744 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr6=(($19+$20)|0); //@line 3744 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$add_ptr6; //@line 3744 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head7=(($21+4)|0); //@line 3744 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head7)>>2)]=40; //@line 3744 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=HEAP32[((((__ZL7mparams+16)|0))>>2)]; //@line 3745 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=$m_addr; //@line 3745 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $trim_check=(($23+28)|0); //@line 3745 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($trim_check)>>2)]=$22; //@line 3745 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return; //@line 3746 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL8init_topP12malloc_stateP12malloc_chunkj["X"]=1;

function __ZL10mmap_allocP12malloc_statej($m, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $retval;
      var $m_addr;
      var $nb_addr;
      var $mmsize;
      var $mm;
      var $offset;
      var $psize;
      var $p;
      $m_addr=$m;
      $nb_addr=$nb;
      var $0=$nb_addr; //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($0)+(24))|0); //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add1=((($add)+(7))|0); //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[((((__ZL7mparams+4)|0))>>2)]; //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=((($1)-(1))|0); //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add2=((($add1)+($sub))|0); //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=HEAP32[((((__ZL7mparams+4)|0))>>2)]; //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub3=((($2)-(1))|0); //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$sub3 ^ -1; //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$add2 & $neg; //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $mmsize=$and; //@line 3672 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=$mmsize; //@line 3673 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=$nb_addr; //@line 3673 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($3)>>>0) > (($4)>>>0); //@line 3673 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 14; break; } //@line 3673 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      $mm=-1; //@line 3674 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$mm; //@line 3675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp4=(($5)|0)!=-1; //@line 3675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp4) { __label__ = 4; break; } else { __label__ = 13; break; } //@line 3675 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $6=$mm; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($6+8)|0); //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$add_ptr; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and6=$7 & 7; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp7=(($and6)|0)==0; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp7) { __label__ = 5; break; } else { __label__ = 6; break; } //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond = 0;__label__ = 7; break; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $8=$mm; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr8=(($8+8)|0); //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$add_ptr8; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and9=$9 & 7; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub10=(((8)-($and9))|0); //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and11=$sub10 & 7; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $and11;__label__ = 7; break; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $cond; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $offset=$cond; //@line 3676 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$mmsize; //@line 3677 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$offset; //@line 3677 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub12=((($10)-($11))|0); //@line 3677 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub13=((($sub12)-(16))|0); //@line 3677 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$sub13; //@line 3677 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$mm; //@line 3678 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=$offset; //@line 3678 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr14=(($12+$13)|0); //@line 3678 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$add_ptr14; //@line 3678 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$14; //@line 3678 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$offset; //@line 3679 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$p; //@line 3679 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($16)|0); //@line 3679 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$15; //@line 3679 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$psize; //@line 3680 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=$p; //@line 3680 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($18+4)|0); //@line 3680 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$17; //@line 3680 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$p; //@line 3682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$19; //@line 3682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$psize; //@line 3682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr15=(($20+$21)|0); //@line 3682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=$add_ptr15; //@line 3682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head16=(($22+4)|0); //@line 3682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head16)>>2)]=7; //@line 3682 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=$p; //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=$23; //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $25=$psize; //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add17=((($25)+(4))|0); //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr18=(($24+$add17)|0); //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$add_ptr18; //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head19=(($26+4)|0); //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head19)>>2)]=0; //@line 3683 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=$m_addr; //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($27+16)|0); //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=HEAP32[(($least_addr)>>2)]; //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp20=(($28)|0)==0; //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp20) { __label__ = 9; break; } else { __label__ = 8; break; } //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $29=$mm; //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=$m_addr; //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr21=(($30+16)|0); //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=HEAPU32[(($least_addr21)>>2)]; //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp22=(($29)>>>0) < (($31)>>>0); //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp22) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 3685 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $32=$mm; //@line 3686 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $33=$m_addr; //@line 3686 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr24=(($33+16)|0); //@line 3686 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($least_addr24)>>2)]=$32; //@line 3686 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 10; break; //@line 3686 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $34=$mmsize; //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $35=$m_addr; //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $footprint=(($35+432)|0); //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($footprint)>>2)]; //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add25=((($36)+($34))|0); //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($footprint)>>2)]=$add25; //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $37=$m_addr; //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $max_footprint=(($37+436)|0); //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $38=HEAPU32[(($max_footprint)>>2)]; //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp26=(($add25)>>>0) > (($38)>>>0); //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp26) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 3687 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $39=$m_addr; //@line 3688 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $footprint28=(($39+432)|0); //@line 3688 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=HEAP32[(($footprint28)>>2)]; //@line 3688 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$m_addr; //@line 3688 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $max_footprint29=(($41+436)|0); //@line 3688 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($max_footprint29)>>2)]=$40; //@line 3688 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 12; break; //@line 3688 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $42=$p; //@line 3691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=$42; //@line 3691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr31=(($43+8)|0); //@line 3691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $retval=$add_ptr31; //@line 3691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3691 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      __label__ = 14; break; //@line 3693 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      $retval=0; //@line 3694 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 15; break; //@line 3694 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $44=$retval; //@line 3695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $44; //@line 3695 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL10mmap_allocP12malloc_statej["X"]=1;

function __ZL9init_binsP12malloc_state($m) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $i;
      var $bin;
      $m_addr=$m;
      $i=0; //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $0=$i; //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($0)>>>0) < 32; //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 4; break; } else { __label__ = 6; break; } //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $1=$i; //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=$1 << 1; //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$m_addr; //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($2+40)|0); //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($smallbins+($shl<<2))|0); //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=$arrayidx; //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=$3; //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $bin=$4; //@line 3753 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$bin; //@line 3754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$bin; //@line 3754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($6+12)|0); //@line 3754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk)>>2)]=$5; //@line 3754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$bin; //@line 3754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($7+8)|0); //@line 3754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd)>>2)]=$5; //@line 3754 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 5; break; //@line 3755 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $8=$i; //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $inc=((($8)+(1))|0); //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $i=$inc; //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 3; break; //@line 3752 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      ;
      return; //@line 3756 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}


function __ZL13prepend_allocP12malloc_statePcS1_j($m, $newbase, $oldbase, $nb) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $newbase_addr;
      var $oldbase_addr;
      var $nb_addr;
      var $p;
      var $oldfirst;
      var $psize;
      var $q;
      var $qsize;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F63;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I192;
      var $B194;
      var $F198;
      var $TP224;
      var $H225;
      var $I226;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K277;
      var $C;
      var $F312;
      $m_addr=$m;
      $newbase_addr=$newbase;
      $oldbase_addr=$oldbase;
      $nb_addr=$nb;
      var $0=$newbase_addr; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=$newbase_addr; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($1+8)|0); //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$add_ptr; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$2 & 7; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($and)|0)==0; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $cond = 0;__label__ = 5; break; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $3=$newbase_addr; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr1=(($3+8)|0); //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=$add_ptr1; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and2=$4 & 7; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and2))|0); //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and3=$sub & 7; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $and3;__label__ = 5; break; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr4=(($0+$cond)|0); //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$add_ptr4; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$5; //@line 3780 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=$oldbase_addr; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$oldbase_addr; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr5=(($7+8)|0); //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=$add_ptr5; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and6=$8 & 7; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp7=(($and6)|0)==0; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp7) { __label__ = 6; break; } else { __label__ = 7; break; } //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $cond15 = 0;__label__ = 8; break; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $9=$oldbase_addr; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr10=(($9+8)|0); //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$add_ptr10; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and11=$10 & 7; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub12=(((8)-($and11))|0); //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and13=$sub12 & 7; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond15 = $and13;__label__ = 8; break; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      var $cond15; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr16=(($6+$cond15)|0); //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$add_ptr16; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $oldfirst=$11; //@line 3781 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$oldfirst; //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $13=$12; //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$p; //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$14; //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$13; //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$15; //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$sub_ptr_sub; //@line 3782 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$p; //@line 3783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$16; //@line 3783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=$nb_addr; //@line 3783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr17=(($17+$18)|0); //@line 3783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$add_ptr17; //@line 3783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $q=$19; //@line 3783 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$psize; //@line 3784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$nb_addr; //@line 3784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub18=((($20)-($21))|0); //@line 3784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $qsize=$sub18; //@line 3784 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=$nb_addr; //@line 3785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$22 | 1; //@line 3785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or19=$or | 2; //@line 3785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=$p; //@line 3785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($23+4)|0); //@line 3785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or19; //@line 3785 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=$oldfirst; //@line 3792 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $25=$m_addr; //@line 3792 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top=(($25+24)|0); //@line 3792 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=HEAP32[(($top)>>2)]; //@line 3792 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp20=(($24)|0)==(($26)|0); //@line 3792 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp20) { __label__ = 9; break; } else { __label__ = 10; break; } //@line 3792 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      var $27=$qsize; //@line 3793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=$m_addr; //@line 3793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $topsize=(($28+12)|0); //@line 3793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=HEAP32[(($topsize)>>2)]; //@line 3793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($29)+($27))|0); //@line 3793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($topsize)>>2)]=$add; //@line 3793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tsize=$add; //@line 3793 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=$q; //@line 3794 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=$m_addr; //@line 3794 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top21=(($31+24)|0); //@line 3794 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($top21)>>2)]=$30; //@line 3794 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=$tsize; //@line 3795 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or22=$32 | 1; //@line 3795 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $33=$q; //@line 3795 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head23=(($33+4)|0); //@line 3795 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head23)>>2)]=$or22; //@line 3795 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 110; break; //@line 3797 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $34=$oldfirst; //@line 3798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $35=$m_addr; //@line 3798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dv=(($35+20)|0); //@line 3798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $36=HEAP32[(($dv)>>2)]; //@line 3798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($34)|0)==(($36)|0); //@line 3798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 11; break; } else { __label__ = 12; break; } //@line 3798 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $37=$qsize; //@line 3799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $38=$m_addr; //@line 3799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dvsize=(($38+8)|0); //@line 3799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $39=HEAP32[(($dvsize)>>2)]; //@line 3799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add26=((($39)+($37))|0); //@line 3799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dvsize)>>2)]=$add26; //@line 3799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $dsize=$add26; //@line 3799 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=$q; //@line 3800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$m_addr; //@line 3800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $dv27=(($41+20)|0); //@line 3800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($dv27)>>2)]=$40; //@line 3800 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $42=$dsize; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or28=$42 | 1; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=$q; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head29=(($43+4)|0); //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head29)>>2)]=$or28; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $44=$dsize; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $45=$q; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $46=$45; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$dsize; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr30=(($46+$47)|0); //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=$add_ptr30; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($48)|0); //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$44; //@line 3801 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 109; break; //@line 3802 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $49=$oldfirst; //@line 3804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head32=(($49+4)|0); //@line 3804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $50=HEAP32[(($head32)>>2)]; //@line 3804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and33=$50 & 3; //@line 3804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp34=(($and33)|0)!=1; //@line 3804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp34) { __label__ = 73; break; } else { __label__ = 13; break; } //@line 3804 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $51=$oldfirst; //@line 3805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head36=(($51+4)|0); //@line 3805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=HEAP32[(($head36)>>2)]; //@line 3805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and37=$52 & -8; //@line 3805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nsize=$and37; //@line 3805 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$nsize; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr=$53 >>> 3; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp38=(($shr)>>>0) < 32; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp38) { __label__ = 14; break; } else { __label__ = 26; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $54=$oldfirst; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($54+8)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $55=HEAP32[(($fd)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$55; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $56=$oldfirst; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($56+12)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $57=HEAP32[(($bk)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B=$57; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $58=$nsize; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr40=$58 >>> 3; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I=$shr40; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59=$F; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $60=$B; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp41=(($59)|0)==(($60)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp41) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $61=$I; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=1 << $61; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg=$shl ^ -1; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($62)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $63=HEAP32[(($smallmap)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and43=$63 & $neg; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap)>>2)]=$and43; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 25; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      var $64=$F; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $65=$I; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl45=$65 << 1; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($66+40)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($smallbins+($shl45<<2))|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $67=$arrayidx; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $68=$67; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp46=(($64)|0)==(($68)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp46) { __label__ = 18; break; } else { __label__ = 17; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 17: 
      var $69=$F; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $70=$69; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $71=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($71+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $72=HEAPU32[(($least_addr)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp47=(($70)>>>0) >= (($72)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp47) { __label__ = 18; break; } else { var $83 = 0;__label__ = 21; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 18: 
      var $73=$B; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $74=$I; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl48=$74 << 1; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $75=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallbins49=(($75+40)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx50=(($smallbins49+($shl48<<2))|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=$arrayidx50; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $77=$76; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp51=(($73)|0)==(($77)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp51) { var $82 = 1;__label__ = 20; break; } else { __label__ = 19; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $78=$B; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $79=$78; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $80=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr52=(($80+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $81=HEAPU32[(($least_addr52)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp53=(($79)>>>0) >= (($81)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $82 = $cmp53;__label__ = 20; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      var $82;
      var $83 = $82;__label__ = 21; break;
    case 21: 
      var $83;
      var $conv=(($83)&1);
      var $expval=(($conv)==(1));
      var $tobool=(($expval)|0)!=0;
      if ($tobool) { __label__ = 22; break; } else { __label__ = 23; break; }
    case 22: 
      var $84=$B; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $85=$F; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk55=(($85+12)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk55)>>2)]=$84; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $86=$F; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $87=$B; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd56=(($87+8)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd56)>>2)]=$86; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 24; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      _abort(); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 24; break;
    case 24: 
      __label__ = 25; break;
    case 25: 
      __label__ = 72; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $88=$oldfirst; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $89=$88; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $TP=$89; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $90=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent=(($90+24)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $91=HEAP32[(($parent)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $XP=$91; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $92=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk60=(($92+12)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $93=HEAP32[(($bk60)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $94=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp61=(($93)|0)!=(($94)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp61) { __label__ = 27; break; } else { __label__ = 31; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 27: 
      var $95=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd64=(($95+8)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($fd64)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F63=$96; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $97=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk65=(($97+12)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $98=HEAP32[(($bk65)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$98; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $99=$F63; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $100=$99; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr66=(($101+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $102=HEAPU32[(($least_addr66)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp67=(($100)>>>0) >= (($102)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv68=(($cmp67)&1); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval69=(($conv68)==(1)); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool70=(($expval69)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool70) { __label__ = 28; break; } else { __label__ = 29; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $103=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $104=$F63; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk72=(($104+12)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk72)>>2)]=$103; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $105=$F63; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $106=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd73=(($106+8)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd73)>>2)]=$105; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 29: 
      _abort(); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 30; break;
    case 30: 
      __label__ = 43; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $107=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child=(($107+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx77=(($child+4)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx77; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $108=HEAP32[(($arrayidx77)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$108; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp78=(($108)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp78) { __label__ = 33; break; } else { __label__ = 32; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $109=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child80=(($109+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx81=(($child80)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$arrayidx81; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $110=HEAP32[(($arrayidx81)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$110; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp82=(($110)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp82) { __label__ = 33; break; } else { __label__ = 42; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      __label__ = 34; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $111=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child84=(($111+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx85=(($child84+4)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx85; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $112=HEAP32[(($arrayidx85)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp86=(($112)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp86) { var $115 = 1;__label__ = 36; break; } else { __label__ = 35; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $113=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child88=(($113+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx89=(($child88)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $CP=$arrayidx89; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=HEAP32[(($arrayidx89)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp90=(($114)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $115 = $cmp90;__label__ = 36; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      var $115;
      if ($115) { __label__ = 37; break; } else { __label__ = 38; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 37: 
      var $116=$CP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $RP=$116; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $117=HEAP32[(($116)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $R=$117; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 34; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $118=$RP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $119=$118; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $120=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr92=(($120+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $121=HEAPU32[(($least_addr92)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp93=(($119)>>>0) >= (($121)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv94=(($cmp93)&1); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval95=(($conv94)==(1)); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool96=(($expval95)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool96) { __label__ = 39; break; } else { __label__ = 40; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $122=$RP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($122)>>2)]=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 40: 
      _abort(); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 41; break;
    case 41: 
      __label__ = 42; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 42: 
      __label__ = 43; break;
    case 43: 
      var $123=$XP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp102=(($123)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp102) { __label__ = 44; break; } else { __label__ = 71; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 44: 
      var $124=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index=(($124+28)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $125=HEAP32[(($index)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($126+304)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx104=(($treebins+($125<<2))|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx104; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $127=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $128=$H; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $129=HEAP32[(($128)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp105=(($127)|0)==(($129)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp105) { __label__ = 45; break; } else { __label__ = 48; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 45: 
      var $130=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $131=$H; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($131)>>2)]=$130; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp107=(($130)|0)==0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp107) { __label__ = 46; break; } else { __label__ = 47; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 46: 
      var $132=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index109=(($132+28)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $133=HEAP32[(($index109)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl110=1 << $133; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $neg111=$shl110 ^ -1; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $134=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($134+4)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135=HEAP32[(($treemap)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and112=$135 & $neg111; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap)>>2)]=$and112; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 47; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 47: 
      __label__ = 55; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 48: 
      var $136=$XP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $137=$136; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $138=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr115=(($138+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $139=HEAPU32[(($least_addr115)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp116=(($137)>>>0) >= (($139)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv117=(($cmp116)&1); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval118=(($conv117)==(1)); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool119=(($expval118)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool119) { __label__ = 49; break; } else { __label__ = 53; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 49: 
      var $140=$XP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child121=(($140+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx122=(($child121)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=HEAP32[(($arrayidx122)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $142=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp123=(($141)|0)==(($142)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp123) { __label__ = 50; break; } else { __label__ = 51; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 50: 
      var $143=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $144=$XP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child125=(($144+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx126=(($child125)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx126)>>2)]=$143; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 51: 
      var $145=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=$XP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child128=(($146+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx129=(($child128+4)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx129)>>2)]=$145; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 52; break;
    case 52: 
      __label__ = 54; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 53: 
      _abort(); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 54; break;
    case 54: 
      __label__ = 55; break;
    case 55: 
      var $147=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp134=(($147)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp134) { __label__ = 56; break; } else { __label__ = 70; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 56: 
      var $148=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $149=$148; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $150=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr136=(($150+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=HEAPU32[(($least_addr136)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp137=(($149)>>>0) >= (($151)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv138=(($cmp137)&1); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval139=(($conv138)==(1)); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool140=(($expval139)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool140) { __label__ = 57; break; } else { __label__ = 68; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 57: 
      var $152=$XP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $153=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent142=(($153+24)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent142)>>2)]=$152; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child143=(($154+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx144=(($child143)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $155=HEAP32[(($arrayidx144)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C0=$155; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp145=(($155)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp145) { __label__ = 58; break; } else { __label__ = 62; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 58: 
      var $156=$C0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $157=$156; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $158=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr147=(($158+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $159=HEAPU32[(($least_addr147)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp148=(($157)>>>0) >= (($159)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv149=(($cmp148)&1); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval150=(($conv149)==(1)); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool151=(($expval150)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool151) { __label__ = 59; break; } else { __label__ = 60; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 59: 
      var $160=$C0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child153=(($161+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx154=(($child153)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx154)>>2)]=$160; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $162=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $163=$C0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent155=(($163+24)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent155)>>2)]=$162; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 61; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 60: 
      _abort(); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 61; break;
    case 61: 
      __label__ = 62; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 62: 
      var $164=$TP; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child159=(($164+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx160=(($child159+4)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $165=HEAP32[(($arrayidx160)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C1=$165; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp161=(($165)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp161) { __label__ = 63; break; } else { __label__ = 67; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 63: 
      var $166=$C1; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $167=$166; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $168=$m_addr; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr163=(($168+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $169=HEAPU32[(($least_addr163)>>2)]; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp164=(($167)>>>0) >= (($169)>>>0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv165=(($cmp164)&1); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval166=(($conv165)==(1)); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool167=(($expval166)|0)!=0; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool167) { __label__ = 64; break; } else { __label__ = 65; break; } //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 64: 
      var $170=$C1; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $171=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child169=(($171+16)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx170=(($child169+4)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx170)>>2)]=$170; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $172=$R; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $173=$C1; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent171=(($173+24)|0); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent171)>>2)]=$172; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 66; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 65: 
      _abort(); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 66; break;
    case 66: 
      __label__ = 67; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 67: 
      __label__ = 69; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 68: 
      _abort(); //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 69; break;
    case 69: 
      __label__ = 70; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 70: 
      __label__ = 71; break; //@line 3806 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 71: 
      __label__ = 72; break;
    case 72: 
      var $174=$oldfirst; //@line 3807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $175=$174; //@line 3807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $176=$nsize; //@line 3807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr180=(($175+$176)|0); //@line 3807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $177=$add_ptr180; //@line 3807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $oldfirst=$177; //@line 3807 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $178=$nsize; //@line 3808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $179=$qsize; //@line 3808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add181=((($179)+($178))|0); //@line 3808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $qsize=$add181; //@line 3808 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 73; break; //@line 3809 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 73: 
      var $180=$oldfirst; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head183=(($180+4)|0); //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $181=HEAP32[(($head183)>>2)]; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and184=$181 & -2; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head183)>>2)]=$and184; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $182=$qsize; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or185=$182 | 1; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $183=$q; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head186=(($183+4)|0); //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head186)>>2)]=$or185; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $184=$qsize; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $185=$q; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $186=$185; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $187=$qsize; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr187=(($186+$187)|0); //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $188=$add_ptr187; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot188=(($188)|0); //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot188)>>2)]=$184; //@line 3810 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $189=$qsize; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr189=$189 >>> 3; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp190=(($shr189)>>>0) < 32; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp190) { __label__ = 74; break; } else { __label__ = 81; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 74: 
      var $190=$qsize; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr193=$190 >>> 3; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I192=$shr193; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $191=$I192; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl195=$191 << 1; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $192=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallbins196=(($192+40)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx197=(($smallbins196+($shl195<<2))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $193=$arrayidx197; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $194=$193; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B194=$194; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $195=$B194; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F198=$195; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $196=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap199=(($196)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $197=HEAP32[(($smallmap199)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $198=$I192; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl200=1 << $198; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and201=$197 & $shl200; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool202=(($and201)|0)!=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool202) { __label__ = 76; break; } else { __label__ = 75; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 75: 
      var $199=$I192; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl204=1 << $199; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $200=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap205=(($200)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $201=HEAP32[(($smallmap205)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or206=$201 | $shl204; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap205)>>2)]=$or206; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 80; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 76: 
      var $202=$B194; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd208=(($202+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $203=HEAP32[(($fd208)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $204=$203; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $205=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr209=(($205+16)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $206=HEAPU32[(($least_addr209)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp210=(($204)>>>0) >= (($206)>>>0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv211=(($cmp210)&1); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval212=(($conv211)==(1)); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool213=(($expval212)|0)!=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool213) { __label__ = 77; break; } else { __label__ = 78; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 77: 
      var $207=$B194; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd215=(($207+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $208=HEAP32[(($fd215)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F198=$208; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 79; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 78: 
      _abort(); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 79; break;
    case 79: 
      __label__ = 80; break;
    case 80: 
      var $209=$q; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $210=$B194; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd219=(($210+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd219)>>2)]=$209; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $211=$q; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $212=$F198; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk220=(($212+12)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk220)>>2)]=$211; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $213=$F198; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $214=$q; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd221=(($214+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd221)>>2)]=$213; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $215=$B194; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $216=$q; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk222=(($216+12)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk222)>>2)]=$215; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 108; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 81: 
      var $217=$q; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $218=$217; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $TP224=$218; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $219=$qsize; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr227=$219 >>> 8; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $X=$shr227; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $220=$X; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp228=(($220)|0)==0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp228) { __label__ = 82; break; } else { __label__ = 83; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 82: 
      $I226=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 87; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 83: 
      var $221=$X; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp231=(($221)>>>0) > 65535; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp231) { __label__ = 84; break; } else { __label__ = 85; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 84: 
      $I226=31; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 86; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 85: 
      var $222=$X; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$222; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $223=$Y; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub234=((($223)-(256))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr235=$sub234 >>> 16; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and236=$shr235 & 8; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$and236; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $224=$N; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $225=$Y; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl237=$225 << $224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl237; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub238=((($shl237)-(4096))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr239=$sub238 >>> 16; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and240=$shr239 & 4; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and240; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $226=$K; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $227=$N; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add241=((($227)+($226))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add241; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $228=$K; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $229=$Y; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl242=$229 << $228; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl242; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub243=((($shl242)-(16384))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr244=$sub243 >>> 16; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and245=$shr244 & 2; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and245; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $230=$N; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add246=((($230)+($and245))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add246; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $231=$N; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub247=(((14)-($231))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $232=$K; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $233=$Y; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl248=$233 << $232; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl248; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr249=$shl248 >>> 15; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add250=((($sub247)+($shr249))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$add250; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $234=$K; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl251=$234 << 1; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $235=$qsize; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $236=$K; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add252=((($236)+(7))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr253=$235 >>> (($add252)>>>0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and254=$shr253 & 1; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add255=((($shl251)+($and254))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I226=$add255; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 86; break;
    case 86: 
      __label__ = 87; break;
    case 87: 
      var $237=$I226; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $238=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins258=(($238+304)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx259=(($treebins258+($237<<2))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H225=$arrayidx259; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $239=$I226; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $240=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index260=(($240+28)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index260)>>2)]=$239; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $241=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child261=(($241+16)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx262=(($child261+4)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx262)>>2)]=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $242=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child263=(($242+16)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx264=(($child263)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx264)>>2)]=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $243=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap265=(($243+4)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $244=HEAP32[(($treemap265)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $245=$I226; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl266=1 << $245; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and267=$244 & $shl266; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool268=(($and267)|0)!=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool268) { __label__ = 89; break; } else { __label__ = 88; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 88: 
      var $246=$I226; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl270=1 << $246; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $247=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap271=(($247+4)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $248=HEAP32[(($treemap271)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or272=$248 | $shl270; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap271)>>2)]=$or272; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $249=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $250=$H225; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($250)>>2)]=$249; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $251=$H225; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $252=$251; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $253=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent273=(($253+24)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent273)>>2)]=$252; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $254=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $255=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk274=(($255+12)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk274)>>2)]=$254; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $256=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd275=(($256+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd275)>>2)]=$254; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 107; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 89: 
      var $257=$H225; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $258=HEAP32[(($257)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$258; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $259=$qsize; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $260=$I226; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp278=(($260)|0)==31; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp278) { __label__ = 90; break; } else { __label__ = 91; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 90: 
      var $cond286 = 0;__label__ = 92; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 91: 
      var $261=$I226; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr281=$261 >>> 1; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add282=((($shr281)+(8))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub283=((($add282)-(2))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub284=(((31)-($sub283))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond286 = $sub284;__label__ = 92; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 92: 
      var $cond286; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl287=$259 << $cond286; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K277=$shl287; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 93; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 93: 
      var $262=$T; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head288=(($262+4)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $263=HEAP32[(($head288)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and289=$263 & -8; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $264=$qsize; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp290=(($and289)|0)!=(($264)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp290) { __label__ = 94; break; } else { __label__ = 100; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 94: 
      var $265=$K277; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr292=$265 >>> 31; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and293=$shr292 & 1; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $266=$T; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child294=(($266+16)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx295=(($child294+($and293<<2))|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx295; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $267=$K277; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl296=$267 << 1; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K277=$shl296; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $268=$C; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $269=HEAP32[(($268)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp297=(($269)|0)!=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp297) { __label__ = 95; break; } else { __label__ = 96; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 95: 
      var $270=$C; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $271=HEAP32[(($270)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$271; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 99; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 96: 
      var $272=$C; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $273=$272; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $274=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr300=(($274+16)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $275=HEAPU32[(($least_addr300)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp301=(($273)>>>0) >= (($275)>>>0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv302=(($cmp301)&1); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval303=(($conv302)==(1)); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool304=(($expval303)|0)!=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool304) { __label__ = 97; break; } else { __label__ = 98; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 97: 
      var $276=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $277=$C; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($277)>>2)]=$276; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $278=$T; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $279=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent306=(($279+24)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent306)>>2)]=$278; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $280=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $281=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk307=(($281+12)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk307)>>2)]=$280; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $282=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd308=(($282+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd308)>>2)]=$280; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 106; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 98: 
      _abort(); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 106; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 99: 
      __label__ = 105; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 100: 
      var $283=$T; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd313=(($283+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $284=HEAP32[(($fd313)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F312=$284; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $285=$T; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $286=$285; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $287=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr314=(($287+16)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $288=HEAPU32[(($least_addr314)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp315=(($286)>>>0) >= (($288)>>>0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp315) { __label__ = 101; break; } else { var $293 = 0;__label__ = 102; break; } //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 101: 
      var $289=$F312; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $290=$289; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $291=$m_addr; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr317=(($291+16)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $292=HEAPU32[(($least_addr317)>>2)]; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp318=(($290)>>>0) >= (($292)>>>0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $293 = $cmp318;__label__ = 102; break;
    case 102: 
      var $293;
      var $conv320=(($293)&1);
      var $expval321=(($conv320)==(1));
      var $tobool322=(($expval321)|0)!=0;
      if ($tobool322) { __label__ = 103; break; } else { __label__ = 104; break; }
    case 103: 
      var $294=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $295=$F312; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk324=(($295+12)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk324)>>2)]=$294; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $296=$T; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd325=(($296+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd325)>>2)]=$294; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $297=$F312; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $298=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd326=(($298+8)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd326)>>2)]=$297; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $299=$T; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $300=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk327=(($300+12)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk327)>>2)]=$299; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $301=$TP224; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent328=(($301+24)|0); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent328)>>2)]=0; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 106; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 104: 
      _abort(); //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 106; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 105: 
      __label__ = 93; break; //@line 3811 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 106: 
      __label__ = 107; break;
    case 107: 
      __label__ = 108; break;
    case 108: 
      __label__ = 109; break;
    case 109: 
      __label__ = 110; break;
    case 110: 
      var $302=$p; //@line 3816 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $303=$302; //@line 3816 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr335=(($303+8)|0); //@line 3816 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      ;
      return $add_ptr335; //@line 3816 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL13prepend_allocP12malloc_statePcS1_j["X"]=1;

function __ZL11add_segmentP12malloc_statePcjj($m, $tbase, $tsize, $mmapped) {
  ;
  var __label__;
  __label__ = 2; 
  while(1) switch(__label__) {
    case 2: 
      var $m_addr;
      var $tbase_addr;
      var $tsize_addr;
      var $mmapped_addr;
      var $old_top;
      var $oldsp;
      var $old_end;
      var $ssize;
      var $rawsp;
      var $offset;
      var $asp;
      var $csp;
      var $sp;
      var $ss;
      var $tnext;
      var $p;
      var $nfences;
      var $nextp;
      var $q;
      var $psize;
      var $tn;
      var $I;
      var $B;
      var $F;
      var $TP;
      var $H;
      var $I54;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K100;
      var $C;
      var $F136;
      $m_addr=$m;
      $tbase_addr=$tbase;
      $tsize_addr=$tsize;
      $mmapped_addr=$mmapped;
      var $0=$m_addr; //@line 3822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $top=(($0+24)|0); //@line 3822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $1=HEAP32[(($top)>>2)]; //@line 3822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $2=$1; //@line 3822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $old_top=$2; //@line 3822 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $3=$m_addr; //@line 3823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $4=$old_top; //@line 3823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $call=__ZL15segment_holdingP12malloc_statePc($3, $4); //@line 3823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $oldsp=$call; //@line 3823 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $5=$oldsp; //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base=(($5)|0); //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $6=HEAP32[(($base)>>2)]; //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $7=$oldsp; //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size=(($7+4)|0); //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $8=HEAP32[(($size)>>2)]; //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr=(($6+$8)|0); //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $old_end=$add_ptr; //@line 3824 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $ssize=24; //@line 3825 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $9=$old_end; //@line 3826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $10=$ssize; //@line 3826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add=((($10)+(16))|0); //@line 3826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add1=((($add)+(7))|0); //@line 3826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $idx_neg=(((-$add1))|0); //@line 3826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr2=(($9+$idx_neg)|0); //@line 3826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $rawsp=$add_ptr2; //@line 3826 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $11=$rawsp; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr3=(($11+8)|0); //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $12=$add_ptr3; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and=$12 & 7; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp=(($and)|0)==0; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp) { __label__ = 3; break; } else { __label__ = 4; break; } //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 3: 
      var $cond = 0;__label__ = 5; break; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 4: 
      var $13=$rawsp; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr4=(($13+8)|0); //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $14=$add_ptr4; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and5=$14 & 7; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub=(((8)-($and5))|0); //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and6=$sub & 7; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond = $and6;__label__ = 5; break; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 5: 
      var $cond; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $offset=$cond; //@line 3827 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $15=$rawsp; //@line 3828 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $16=$offset; //@line 3828 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr7=(($15+$16)|0); //@line 3828 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $asp=$add_ptr7; //@line 3828 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $17=$asp; //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $18=$old_top; //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr8=(($18+16)|0); //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp9=(($17)>>>0) < (($add_ptr8)>>>0); //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $19=$old_top; //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $20=$asp; //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond10=$cmp9 ? $19 : $20; //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $csp=$cond10; //@line 3829 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $21=$csp; //@line 3830 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $22=$21; //@line 3830 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $sp=$22; //@line 3830 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $23=$sp; //@line 3831 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $24=$23; //@line 3831 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr11=(($24+8)|0); //@line 3831 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $25=$add_ptr11; //@line 3831 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $ss=$25; //@line 3831 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $26=$sp; //@line 3832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $27=$26; //@line 3832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $28=$ssize; //@line 3832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr12=(($27+$28)|0); //@line 3832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $29=$add_ptr12; //@line 3832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tnext=$29; //@line 3832 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $30=$tnext; //@line 3833 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$30; //@line 3833 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nfences=0; //@line 3834 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $31=$m_addr; //@line 3837 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $32=$tbase_addr; //@line 3837 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $33=$32; //@line 3837 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $34=$tsize_addr; //@line 3837 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub13=((($34)-(40))|0); //@line 3837 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __ZL8init_topP12malloc_stateP12malloc_chunkj($31, $33, $sub13); //@line 3837 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $35=$ssize; //@line 3841 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or=$35 | 1; //@line 3841 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or14=$or | 2; //@line 3841 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $36=$sp; //@line 3841 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head=(($36+4)|0); //@line 3841 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head)>>2)]=$or14; //@line 3841 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $37=$ss; //@line 3842 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $38=$m_addr; //@line 3842 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg=(($38+444)|0); //@line 3842 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $39=$37; //@line 3842 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $40=$seg; //@line 3842 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      assert(16 % 1 === 0, 'memcpy given ' + 16 + ' bytes to copy. Problem with quantum=1 corrections perhaps?');HEAP32[(($39)>>2)]=HEAP32[(($40)>>2)];HEAP32[((($39)+(4))>>2)]=HEAP32[((($40)+(4))>>2)];HEAP32[((($39)+(8))>>2)]=HEAP32[((($40)+(8))>>2)];HEAP32[((($39)+(12))>>2)]=HEAP32[((($40)+(12))>>2)]; //@line 3842 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $41=$tbase_addr; //@line 3843 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $42=$m_addr; //@line 3843 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg15=(($42+444)|0); //@line 3843 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $base16=(($seg15)|0); //@line 3843 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($base16)>>2)]=$41; //@line 3843 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $43=$tsize_addr; //@line 3844 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $44=$m_addr; //@line 3844 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg17=(($44+444)|0); //@line 3844 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $size18=(($seg17+4)|0); //@line 3844 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($size18)>>2)]=$43; //@line 3844 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $45=$mmapped_addr; //@line 3845 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $46=$m_addr; //@line 3845 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg19=(($46+444)|0); //@line 3845 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sflags=(($seg19+12)|0); //@line 3845 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($sflags)>>2)]=$45; //@line 3845 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $47=$ss; //@line 3846 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $48=$m_addr; //@line 3846 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $seg20=(($48+444)|0); //@line 3846 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $next=(($seg20+8)|0); //@line 3846 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($next)>>2)]=$47; //@line 3846 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 6; break; //@line 3849 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 6: 
      var $49=$p; //@line 3850 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $50=$49; //@line 3850 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr21=(($50+4)|0); //@line 3850 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $51=$add_ptr21; //@line 3850 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nextp=$51; //@line 3850 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $52=$p; //@line 3851 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head22=(($52+4)|0); //@line 3851 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head22)>>2)]=7; //@line 3851 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $53=$nfences; //@line 3852 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $inc=((($53)+(1))|0); //@line 3852 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $nfences=$inc; //@line 3852 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $54=$nextp; //@line 3853 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head23=(($54+4)|0); //@line 3853 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $55=$head23; //@line 3853 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $56=$old_end; //@line 3853 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp24=(($55)>>>0) < (($56)>>>0); //@line 3853 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp24) { __label__ = 7; break; } else { __label__ = 8; break; } //@line 3853 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 7: 
      var $57=$nextp; //@line 3854 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $p=$57; //@line 3854 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 9; break; //@line 3854 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 8: 
      __label__ = 10; break; //@line 3856 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 9: 
      __label__ = 6; break; //@line 3857 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 10: 
      var $58=$csp; //@line 3861 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $59=$old_top; //@line 3861 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp25=(($58)|0)!=(($59)|0); //@line 3861 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp25) { __label__ = 11; break; } else { __label__ = 47; break; } //@line 3861 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 11: 
      var $60=$old_top; //@line 3862 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $61=$60; //@line 3862 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $q=$61; //@line 3862 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $62=$csp; //@line 3863 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $63=$old_top; //@line 3863 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_lhs_cast=$62; //@line 3863 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_rhs_cast=$63; //@line 3863 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub_ptr_sub=((($sub_ptr_lhs_cast)-($sub_ptr_rhs_cast))|0); //@line 3863 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $psize=$sub_ptr_sub; //@line 3863 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $64=$q; //@line 3864 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $65=$64; //@line 3864 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $66=$psize; //@line 3864 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr27=(($65+$66)|0); //@line 3864 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $67=$add_ptr27; //@line 3864 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $tn=$67; //@line 3864 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $68=$tn; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head28=(($68+4)|0); //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $69=HEAP32[(($head28)>>2)]; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and29=$69 & -2; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head28)>>2)]=$and29; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $70=$psize; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or30=$70 | 1; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $71=$q; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head31=(($71+4)|0); //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($head31)>>2)]=$or30; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $72=$psize; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $73=$q; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $74=$73; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $75=$psize; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add_ptr32=(($74+$75)|0); //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $76=$add_ptr32; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $prev_foot=(($76)|0); //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($prev_foot)>>2)]=$72; //@line 3865 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $77=$psize; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr=$77 >>> 3; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp33=(($shr)>>>0) < 32; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp33) { __label__ = 12; break; } else { __label__ = 19; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 12: 
      var $78=$psize; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr35=$78 >>> 3; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I=$shr35; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $79=$I; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl=$79 << 1; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $80=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallbins=(($80+40)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx=(($smallbins+($shl<<2))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $81=$arrayidx; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $82=$81; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $B=$82; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $83=$B; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$83; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $84=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap=(($84)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $85=HEAP32[(($smallmap)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $86=$I; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl36=1 << $86; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and37=$85 & $shl36; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool=(($and37)|0)!=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool) { __label__ = 14; break; } else { __label__ = 13; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 13: 
      var $87=$I; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl39=1 << $87; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $88=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $smallmap40=(($88)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $89=HEAP32[(($smallmap40)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or41=$89 | $shl39; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($smallmap40)>>2)]=$or41; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 18; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 14: 
      var $90=$B; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd=(($90+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $91=HEAP32[(($fd)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $92=$91; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $93=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr=(($93+16)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $94=HEAPU32[(($least_addr)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp43=(($92)>>>0) >= (($94)>>>0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv=(($cmp43)&1); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval=(($conv)==(1)); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool44=(($expval)|0)!=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool44) { __label__ = 15; break; } else { __label__ = 16; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 15: 
      var $95=$B; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd46=(($95+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $96=HEAP32[(($fd46)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F=$96; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 17; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 16: 
      _abort(); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 17; break;
    case 17: 
      __label__ = 18; break;
    case 18: 
      var $97=$q; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $98=$B; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd50=(($98+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd50)>>2)]=$97; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $99=$q; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $100=$F; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk=(($100+12)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk)>>2)]=$99; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $101=$F; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $102=$q; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd51=(($102+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd51)>>2)]=$101; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $103=$B; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $104=$q; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk52=(($104+12)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk52)>>2)]=$103; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 46; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 19: 
      var $105=$q; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $106=$105; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $TP=$106; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $107=$psize; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr55=$107 >>> 8; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $X=$shr55; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $108=$X; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp56=(($108)|0)==0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp56) { __label__ = 20; break; } else { __label__ = 21; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 20: 
      $I54=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 25; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 21: 
      var $109=$X; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp59=(($109)>>>0) > 65535; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp59) { __label__ = 22; break; } else { __label__ = 23; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 22: 
      $I54=31; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 24; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 23: 
      var $110=$X; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$110; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $111=$Y; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub62=((($111)-(256))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr63=$sub62 >>> 16; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and64=$shr63 & 8; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$and64; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $112=$N; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $113=$Y; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl65=$113 << $112; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl65; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub66=((($shl65)-(4096))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr67=$sub66 >>> 16; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and68=$shr67 & 4; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and68; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $114=$K; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $115=$N; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add69=((($115)+($114))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add69; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $116=$K; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $117=$Y; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl70=$117 << $116; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl70; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub71=((($shl70)-(16384))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr72=$sub71 >>> 16; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and73=$shr72 & 2; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$and73; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $118=$N; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add74=((($118)+($and73))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $N=$add74; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $119=$N; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub75=(((14)-($119))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $120=$K; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $121=$Y; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl76=$121 << $120; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $Y=$shl76; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr77=$shl76 >>> 15; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add78=((($sub75)+($shr77))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K=$add78; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $122=$K; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl79=$122 << 1; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $123=$psize; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $124=$K; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add80=((($124)+(7))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr81=$123 >>> (($add80)>>>0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and82=$shr81 & 1; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add83=((($shl79)+($and82))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $I54=$add83; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 24; break;
    case 24: 
      __label__ = 25; break;
    case 25: 
      var $125=$I54; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $126=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treebins=(($126+304)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx86=(($treebins+($125<<2))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $H=$arrayidx86; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $127=$I54; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $128=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $index=(($128+28)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($index)>>2)]=$127; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $129=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child=(($129+16)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx87=(($child+4)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx87)>>2)]=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $130=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child88=(($130+16)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx89=(($child88)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($arrayidx89)>>2)]=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $131=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap=(($131+4)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $132=HEAP32[(($treemap)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $133=$I54; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl90=1 << $133; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and91=$132 & $shl90; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool92=(($and91)|0)!=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool92) { __label__ = 27; break; } else { __label__ = 26; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 26: 
      var $134=$I54; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl94=1 << $134; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $135=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $treemap95=(($135+4)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $136=HEAP32[(($treemap95)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $or96=$136 | $shl94; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($treemap95)>>2)]=$or96; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $137=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $138=$H; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($138)>>2)]=$137; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $139=$H; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $140=$139; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $141=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent=(($141+24)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent)>>2)]=$140; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $142=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $143=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk97=(($143+12)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk97)>>2)]=$142; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $144=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd98=(($144+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd98)>>2)]=$142; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 45; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 27: 
      var $145=$H; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $146=HEAP32[(($145)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$146; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $147=$psize; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $148=$I54; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp101=(($148)|0)==31; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp101) { __label__ = 28; break; } else { __label__ = 29; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 28: 
      var $cond109 = 0;__label__ = 30; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 29: 
      var $149=$I54; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr104=$149 >>> 1; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $add105=((($shr104)+(8))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub106=((($add105)-(2))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $sub107=(((31)-($sub106))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cond109 = $sub107;__label__ = 30; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 30: 
      var $cond109; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl110=$147 << $cond109; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K100=$shl110; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 31; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 31: 
      var $150=$T; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $head112=(($150+4)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $151=HEAP32[(($head112)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and113=$151 & -8; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $152=$psize; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp114=(($and113)|0)!=(($152)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp114) { __label__ = 32; break; } else { __label__ = 38; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 32: 
      var $153=$K100; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shr116=$153 >>> 31; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $and117=$shr116 & 1; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $154=$T; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $child118=(($154+16)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $arrayidx119=(($child118+($and117<<2))|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $C=$arrayidx119; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $155=$K100; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $shl120=$155 << 1; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $K100=$shl120; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $156=$C; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $157=HEAP32[(($156)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp121=(($157)|0)!=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp121) { __label__ = 33; break; } else { __label__ = 34; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 33: 
      var $158=$C; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $159=HEAP32[(($158)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $T=$159; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 37; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 34: 
      var $160=$C; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $161=$160; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $162=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr124=(($162+16)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $163=HEAPU32[(($least_addr124)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp125=(($161)>>>0) >= (($163)>>>0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $conv126=(($cmp125)&1); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $expval127=(($conv126)==(1)); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $tobool128=(($expval127)|0)!=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($tobool128) { __label__ = 35; break; } else { __label__ = 36; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 35: 
      var $164=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $165=$C; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($165)>>2)]=$164; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $166=$T; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $167=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent130=(($167+24)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent130)>>2)]=$166; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $168=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $169=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk131=(($169+12)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk131)>>2)]=$168; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $170=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd132=(($170+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd132)>>2)]=$168; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 44; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 36: 
      _abort(); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 44; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 37: 
      __label__ = 43; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 38: 
      var $171=$T; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd137=(($171+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $172=HEAP32[(($fd137)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      $F136=$172; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $173=$T; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $174=$173; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $175=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr138=(($175+16)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $176=HEAPU32[(($least_addr138)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp139=(($174)>>>0) >= (($176)>>>0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      if ($cmp139) { __label__ = 39; break; } else { var $181 = 0;__label__ = 40; break; } //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 39: 
      var $177=$F136; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $178=$177; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $179=$m_addr; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $least_addr140=(($179+16)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $180=HEAPU32[(($least_addr140)>>2)]; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $cmp141=(($178)>>>0) >= (($180)>>>0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $181 = $cmp141;__label__ = 40; break;
    case 40: 
      var $181;
      var $conv142=(($181)&1);
      var $expval143=(($conv142)==(1));
      var $tobool144=(($expval143)|0)!=0;
      if ($tobool144) { __label__ = 41; break; } else { __label__ = 42; break; }
    case 41: 
      var $182=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $183=$F136; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk146=(($183+12)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk146)>>2)]=$182; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $184=$T; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd147=(($184+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd147)>>2)]=$182; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $185=$F136; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $186=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $fd148=(($186+8)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($fd148)>>2)]=$185; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $187=$T; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $188=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $bk149=(($188+12)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($bk149)>>2)]=$187; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $189=$TP; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      var $parent150=(($189+24)|0); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      HEAP32[(($parent150)>>2)]=0; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 44; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 42: 
      _abort(); //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
      __label__ = 44; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 43: 
      __label__ = 31; break; //@line 3866 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 44: 
      __label__ = 45; break;
    case 45: 
      __label__ = 46; break;
    case 46: 
      __label__ = 47; break; //@line 3867 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    case 47: 
      ;
      return; //@line 3870 "/Users/hb55683/src/Remote/GIT/emscripten/system/lib/dlmalloc.c"
    default: assert(0, "bad label: " + __label__);
  }
}
__ZL11add_segmentP12malloc_statePcjj["X"]=1;
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
var _llvm_dbg_declare; // stub for _llvm_dbg_declare

  
  
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;

  
  
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  
  var _stdin=0;
  
  var _stdout=0;
  
  var _stderr=0;
  
  var __impure_ptr=0;var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
  
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
  
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
  
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {isDevice: false, contents: data};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        var properties = {isDevice: false, url: url};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite) {
        Browser.asyncLoad(url, function(data) {
          FS.createDataFile(parent, name, data, canRead, canWrite);
        });
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          // Browser.
          assert('Cannot do synchronous binary XHRs in modern browsers. Use --embed-file or --preload-file in emcc');
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureRoot();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
  
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        function simpleOutput(val) {
          if (val === null || val === '\n'.charCodeAt(0)) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(String.fromCharCode(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
  
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
  
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
  
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        _stdin = allocate([1], 'void*', ALLOC_STATIC);
        _stdout = allocate([2], 'void*', ALLOC_STATIC);
        _stderr = allocate([3], 'void*', ALLOC_STATIC);
  
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
  
        // Newlib initialization
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        __impure_ptr = allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_STATIC);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output('\n'.charCodeAt(0));
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output('\n'.charCodeAt(0));
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        var path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      if (stream in FS.streams) {
        stream = FS.streams[stream];
        if (stream.object.isDevice) {
          ___setErrNo(ERRNO_CODES.ESPIPE);
          return -1;
        } else {
          return stream.position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }

  
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      if (FS.streams[fildes] && !FS.streams[fildes].isDevice) {
        var stream = FS.streams[fildes];
        var position = offset;
        if (whence === 1) {  // SEEK_CUR.
          position += stream.position;
        } else if (whence === 2) {  // SEEK_END.
          position += stream.object.contents.length;
        }
        if (position < 0) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        } else {
          stream.ungotten = [];
          stream.position = position;
          return position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      } else {
        FS.streams[stream].eof = false;
        return 0;
      }
    }

  
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        delete FS.streams[fildes];
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      if (FS.streams[fildes]) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }

  
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists || !path.exists) {
        ___setErrNo(path.error);
        return -1;
      } else if (path.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (!path.object.write) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else {
        delete path.parentObject.contents[path.name];
        return 0;
      }
    }
  
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists || !path.exists) {
        ___setErrNo(path.error);
        return -1;
      } else if (!path.object.write || path.isRoot) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (!path.object.isFolder) {
        ___setErrNo(ERRNO_CODES.ENOTDIR);
        return -1;
      } else {
        for (var i in path.object.contents) {
          ___setErrNo(ERRNO_CODES.ENOTEMPTY);
          return -1;
        }
        if (path.path == FS.currentPath) {
          ___setErrNo(ERRNO_CODES.EBUSY);
          return -1;
        } else {
          delete path.parentObject.contents[path.name];
          return 0;
        }
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }

  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      var flush = function(filedes) {
        // Right now we write all data directly, except for output devices.
        if (filedes in FS.streams && FS.streams[filedes].object.output) {
          if (!FS.streams[filedes].isTerminal) { // don't flush terminals, it would cause a \n to also appear
            FS.streams[filedes].object.output(null);
          }
        }
      };
      try {
        if (stream === 0) {
          for (var i in FS.streams) flush(i);
        } else {
          flush(stream);
        }
        return 0;
      } catch (e) {
        ___setErrNo(ERRNO_CODES.EIO);
        return -1;
      }
    }

  
  function _memcpy(dest, src, num, align) {
      assert(num % 1 === 0, 'memcpy given ' + num + ' bytes to copy. Problem with quantum=1 corrections perhaps?');
      if (num >= 20 && src % 2 == dest % 2) {
        // This is unaligned, but quite large, and potentially alignable, so work hard to get to aligned settings
        if (src % 4 == dest % 4) {
          var stop = src + num;
          while (src % 4) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src4 = src >> 2, dest4 = dest >> 2, stop4 = stop >> 2;
          while (src4 < stop4) {
            HEAP32[dest4++] = HEAP32[src4++];
          }
          src = src4 << 2;
          dest = dest4 << 2;
          while (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        } else {
          var stop = src + num;
          if (src % 2) { // no need to check for stop, since we have large num
            HEAP8[dest++] = HEAP8[src++];
          }
          var src2 = src >> 1, dest2 = dest >> 1, stop2 = stop >> 1;
          while (src2 < stop2) {
            HEAP16[dest2++] = HEAP16[src2++];
          }
          src = src2 << 1;
          dest = dest2 << 1;
          if (src < stop) {
            HEAP8[dest++] = HEAP8[src++];
          }
        }
      } else {
        while (num--) {
          HEAP8[dest++] = HEAP8[src++];
        }
      }
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
  
  function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (tempDoubleI32[0]=HEAP32[(((varargs)+(argIndex))>>2)],tempDoubleI32[1]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],tempDoubleF64[0]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[(textIndex+1)];
        if (curr == '%'.charCodeAt(0)) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case '+'.charCodeAt(0):
                flagAlwaysSigned = true;
                break;
              case '-'.charCodeAt(0):
                flagLeftAlign = true;
                break;
              case '#'.charCodeAt(0):
                flagAlternative = true;
                break;
              case '0'.charCodeAt(0):
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[(textIndex+1)];
          }
  
          // Handle width.
          var width = 0;
          if (next == '*'.charCodeAt(0)) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[(textIndex+1)];
          } else {
            while (next >= '0'.charCodeAt(0) && next <= '9'.charCodeAt(0)) {
              width = width * 10 + (next - '0'.charCodeAt(0));
              textIndex++;
              next = HEAP8[(textIndex+1)];
            }
          }
  
          // Handle precision.
          var precisionSet = false;
          if (next == '.'.charCodeAt(0)) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[(textIndex+1)];
            if (next == '*'.charCodeAt(0)) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[(textIndex+1)];
                if (precisionChr < '0'.charCodeAt(0) ||
                    precisionChr > '9'.charCodeAt(0)) break;
                precision = precision * 10 + (precisionChr - '0'.charCodeAt(0));
                textIndex++;
              }
            }
            next = HEAP8[(textIndex+1)];
          } else {
            var precision = 6; // Standard default.
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[(textIndex+2)];
              if (nextNext == 'h'.charCodeAt(0)) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[(textIndex+2)];
              if (nextNext == 'l'.charCodeAt(0)) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[(textIndex+1)];
  
          // Handle type specifier.
          if (['d', 'i', 'u', 'o', 'x', 'X', 'p'].indexOf(String.fromCharCode(next)) != -1) {
            // Integer.
            var signed = next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0);
            argSize = argSize || 4;
            var currArg = getNextArg('i' + (argSize * 8));
            var origArg = currArg;
            var argText;
            // Flatten i64-1 [low, high] into a (slightly rounded) double
            if (argSize == 8) {
              currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 'u'.charCodeAt(0));
            }
            // Truncate to requested size.
            if (argSize <= 4) {
              var limit = Math.pow(256, argSize) - 1;
              currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
            }
            // Format the number.
            var currAbsArg = Math.abs(currArg);
            var prefix = '';
            if (next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1]); else
              argText = reSign(currArg, 8 * argSize, 1).toString(10);
            } else if (next == 'u'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
              argText = unSign(currArg, 8 * argSize, 1).toString(10);
              currArg = Math.abs(currArg);
            } else if (next == 'o'.charCodeAt(0)) {
              argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
            } else if (next == 'x'.charCodeAt(0) || next == 'X'.charCodeAt(0)) {
              prefix = flagAlternative ? '0x' : '';
              if (currArg < 0) {
                // Represent negative numbers in hex as 2's complement.
                currArg = -currArg;
                argText = (currAbsArg - 1).toString(16);
                var buffer = [];
                for (var i = 0; i < argText.length; i++) {
                  buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                }
                argText = buffer.join('');
                while (argText.length < argSize * 2) argText = 'f' + argText;
              } else {
                argText = currAbsArg.toString(16);
              }
              if (next == 'X'.charCodeAt(0)) {
                prefix = prefix.toUpperCase();
                argText = argText.toUpperCase();
              }
            } else if (next == 'p'.charCodeAt(0)) {
              if (currAbsArg === 0) {
                argText = '(nil)';
              } else {
                prefix = '0x';
                argText = currAbsArg.toString(16);
              }
            }
            if (precisionSet) {
              while (argText.length < precision) {
                argText = '0' + argText;
              }
            }
  
            // Add sign if needed
            if (flagAlwaysSigned) {
              if (currArg < 0) {
                prefix = '-' + prefix;
              } else {
                prefix = '+' + prefix;
              }
            }
  
            // Add padding.
            while (prefix.length + argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad) {
                  argText = '0' + argText;
                } else {
                  prefix = ' ' + prefix;
                }
              }
            }
  
            // Insert the result into the buffer.
            argText = prefix + argText;
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (['f', 'F', 'e', 'E', 'g', 'G'].indexOf(String.fromCharCode(next)) != -1) {
            // Float.
            var currArg = getNextArg('double');
            var argText;
  
            if (isNaN(currArg)) {
              argText = 'nan';
              flagZeroPad = false;
            } else if (!isFinite(currArg)) {
              argText = (currArg < 0 ? '-' : '') + 'inf';
              flagZeroPad = false;
            } else {
              var isGeneral = false;
              var effectivePrecision = Math.min(precision, 20);
  
              // Convert g/G to f/F or e/E, as per:
              // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
              if (next == 'g'.charCodeAt(0) || next == 'G'.charCodeAt(0)) {
                isGeneral = true;
                precision = precision || 1;
                var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                if (precision > exponent && exponent >= -4) {
                  next = ((next == 'g'.charCodeAt(0)) ? 'f' : 'F').charCodeAt(0);
                  precision -= exponent + 1;
                } else {
                  next = ((next == 'g'.charCodeAt(0)) ? 'e' : 'E').charCodeAt(0);
                  precision--;
                }
                effectivePrecision = Math.min(precision, 20);
              }
  
              if (next == 'e'.charCodeAt(0) || next == 'E'.charCodeAt(0)) {
                argText = currArg.toExponential(effectivePrecision);
                // Make sure the exponent has at least 2 digits.
                if (/[eE][-+]\d$/.test(argText)) {
                  argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                }
              } else if (next == 'f'.charCodeAt(0) || next == 'F'.charCodeAt(0)) {
                argText = currArg.toFixed(effectivePrecision);
              }
  
              var parts = argText.split('e');
              if (isGeneral && !flagAlternative) {
                // Discard trailing zeros and periods.
                while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                       (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                  parts[0] = parts[0].slice(0, -1);
                }
              } else {
                // Make sure we have a period in alternative mode.
                if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                // Zero pad until required precision.
                while (precision > effectivePrecision++) parts[0] += '0';
              }
              argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
              // Capitalize 'E' if needed.
              if (next == 'E'.charCodeAt(0)) argText = argText.toUpperCase();
  
              // Add sign.
              if (flagAlwaysSigned && currArg >= 0) {
                argText = '+' + argText;
              }
            }
  
            // Add padding.
            while (argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                  argText = argText[0] + '0' + argText.slice(1);
                } else {
                  argText = (flagZeroPad ? '0' : ' ') + argText;
                }
              }
            }
  
            // Adjust case.
            if (next < 'a'.charCodeAt(0)) argText = argText.toUpperCase();
  
            // Insert the result into the buffer.
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (next == 's'.charCodeAt(0)) {
            // String.
            var arg = getNextArg('i8*') || 0; // 0 holds '(null)'
            var argLength = String_len(arg);
            if (precisionSet) argLength = Math.min(String_len(arg), precision);
            if (!flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
            for (var i = 0; i < argLength; i++) {
              ret.push(HEAPU8[(arg++)]);
            }
            if (flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
          } else if (next == 'c'.charCodeAt(0)) {
            // Character.
            if (flagLeftAlign) ret.push(getNextArg('i8'));
            while (--width > 0) {
              ret.push(' '.charCodeAt(0));
            }
            if (!flagLeftAlign) ret.push(getNextArg('i8'));
          } else if (next == 'n'.charCodeAt(0)) {
            // Write the length written so far to the next parameter.
            var ptr = getNextArg('i32*');
            HEAP32[((ptr)>>2)]=ret.length
          } else if (next == '%'.charCodeAt(0)) {
            // Literal percent sign.
            ret.push(curr);
          } else {
            // Unknown specifiers remain untouched.
            for (var i = startTextIndex; i < textIndex + 2; i++) {
              ret.push(HEAP8[(i)]);
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, n - 1);
      for (var i = 0; i < limit; i++) {
        HEAP8[((s)+(i))]=result[i];
      }
      HEAP8[((s)+(i))]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  
  
  var ___dirent_struct_layout=null;function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather that strictly
      // following the POSIX standard.
  
      var mode = HEAP32[((varargs)>>2)];
  
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
  
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
  
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isCreate || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id = FS.streams.length;
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        FS.streams[id] = {
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        };
      } else {
        FS.streams[id] = {
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        };
      }
      return id;
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }

  
  function _truncate(path, length) {
      // int truncate(const char *path, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/truncate.html
      // NOTE: The path argument may be a string, to simplify ftruncate().
      if (length < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (typeof path !== 'string') path = Pointer_stringify(path);
        var target = FS.findObject(path);
        if (target === null) return -1;
        if (target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        } else if (target.isDevice) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        } else if (!target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        } else {
          var contents = target.contents;
          if (length < contents.length) contents.length = length;
          else while (length > contents.length) contents.push(0);
          target.timestamp = Date.now();
          return 0;
        }
      }
    }function _ftruncate(fildes, length) {
      // int ftruncate(int fildes, off_t length);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftruncate.html
      if (FS.streams[fildes] && FS.streams[fildes].isWrite) {
        return _truncate(FS.streams[fildes].path, length);
      } else if (FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }

  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      // We use file descriptor numbers and FILE* streams interchangeably.
      return stream;
    }

  function _isatty(fildes) {
      // int isatty(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/isatty.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      if (FS.streams[fildes].isTerminal) return 1;
      ___setErrNo(ERRNO_CODES.ENOTTY);
      return 0;
    }

  
  
  
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[((buf)+(i))];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[((buf)+(i))]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }
  
  function _strlen(ptr) {
      return String_len(ptr);
    }function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[(_fputc.ret)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (stream in FS.streams) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc('\n'.charCodeAt(0), stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  
  var _putc=_fputc;
  
  
  
  var ERRNO_MESSAGES={1:"Operation not permitted",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"Input/output error",6:"No such device or address",8:"Exec format error",9:"Bad file descriptor",10:"No child processes",11:"Resource temporarily unavailable",12:"Cannot allocate memory",13:"Permission denied",14:"Bad address",16:"Device or resource busy",17:"File exists",18:"Invalid cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Inappropriate ioctl for device",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read-only file system",31:"Too many links",32:"Broken pipe",33:"Numerical argument out of domain",34:"Numerical result out of range",35:"Resource deadlock avoided",36:"File name too long",37:"No locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many levels of symbolic links",42:"No message of desired type",43:"Identifier removed",60:"Device not a stream",61:"No data available",62:"Timer expired",63:"Out of streams resources",67:"Link has been severed",71:"Protocol error",72:"Multihop attempted",74:"Bad message",75:"Value too large for defined data type",84:"Invalid or incomplete multibyte or wide character",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Protocol not supported",95:"Operation not supported",97:"Address family not supported by protocol",98:"Address already in use",99:"Cannot assign requested address",100:"Network is down",101:"Network is unreachable",102:"Network dropped connection on reset",103:"Software caused connection abort",104:"Connection reset by peer",105:"No buffer space available",106:"Transport endpoint is already connected",107:"Transport endpoint is not connected",110:"Connection timed out",111:"Connection refused",113:"No route to host",114:"Operation already in progress",115:"Operation now in progress",116:"Stale NFS file handle",122:"Disk quota exceeded",125:"Operation canceled",130:"Owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[((strerrbuf)+(i))]=msg.charCodeAt(i)
          }
          HEAP8[((strerrbuf)+(i))]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }function _perror(s) {
      // void perror(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/perror.html
      if (s) {
        _puts(s);
        _putc(':'.charCodeAt(0));
        _putc(' '.charCodeAt(0));
      }
      var errnum = HEAP32[((___errno_location())>>2)];
      _puts(_strerror(errnum));
    }

  
  function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

  function _freopen(filename, mode, stream) {
      // FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/freopen.html
      if (!filename) {
        if (!(stream in FS.streams)) {
          ___setErrNo(ERRNO_CODES.EBADF);
          return 0;
        }
        if (_freopen.buffer) _free(_freopen.buffer);
        filename = intArrayFromString(FS.streams[stream].path);
        filename = allocate(filename, 'i8', ALLOC_NORMAL);
      }
      _fclose(stream);
      return _fopen(filename, mode);
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
  
  
      exitRuntime();
      ABORT = true;
  
      throw 'exit(' + status + ') called, at ' + new Error().stack;
    }function _exit(status) {
      __exit(status);
    }

  function _access(path, amode) {
      // int access(const char *path, int amode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/access.html
      path = Pointer_stringify(path);
      var target = FS.findObject(path);
      if (target === null) return -1;
      if ((amode & 2 && !target.write) ||  // W_OK.
          ((amode & 1 || amode & 4) && !target.read)) {  // X_OK, R_OK.
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else {
        return 0;
      }
    }

  function _signal(sig, func) {
      // TODO
      return 0;
    }

  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }




  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAP8[((px)+(i))];
        var y = HEAP8[((py)+(i))];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }

  
  function _tmpnam(s, dir, prefix) {
      // char *tmpnam(char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpnam.html
      // NOTE: The dir and prefix arguments are for internal use only.
      var folder = FS.findObject(dir || '/tmp');
      if (!folder || !folder.isFolder) {
        dir = '/tmp';
        folder = FS.findObject(dir);
        if (!folder || !folder.isFolder) return 0;
      }
      var name = prefix || 'file';
      do {
        name += String.fromCharCode(65 + Math.floor(Math.random() * 25));
      } while (name in folder.contents);
      var result = dir + '/' + name;
      if (!_tmpnam.buffer) _tmpnam.buffer = _malloc(256);
      if (!s) s = _tmpnam.buffer;
      for (var i = 0; i < result.length; i++) {
        HEAP8[((s)+(i))]=result.charCodeAt(i);
      }
      HEAP8[((s)+(i))]=0;
      return s;
    }function _tmpfile() {
      // FILE *tmpfile(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/tmpfile.html
      // TODO: Delete the created file on closing.
      if (_tmpfile.mode) {
        _tmpfile.mode = allocate(intArrayFromString('w+'), 'i8', ALLOC_NORMAL);
      }
      return _fopen(_tmpnam(0), _tmpfile.mode);
    }

  function _strcpy(pdest, psrc) {
      var i = 0;
      do {
        HEAP8[(pdest+i)]=HEAP8[(psrc+i)];
        i ++;
      } while (HEAP8[((psrc)+(i-1))] != 0);
      return pdest;
    }

  function _rewind(stream) {
      // void rewind(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rewind.html
      _fseek(stream, 0, 0);  // SEEK_SET.
      if (stream in FS.streams) FS.streams[stream].error = false;
    }

  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
var _llvm_expect_i32; // stub for _llvm_expect_i32

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
  
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }


  function _memset(ptr, value, num, align) {
      // TODO: make these settings, and in memcpy, {{'s
      if (num >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        var stop = ptr + num;
        while (ptr % 4) { // no need to check for stop, since we have large num
          HEAP8[ptr++] = value;
        }
        if (value < 0) value += 256; // make it unsigned
        var ptr4 = ptr >> 2, stop4 = stop >> 2, value4 = value | (value << 8) | (value << 16) | (value << 24);
        while (ptr4 < stop4) {
          HEAP32[ptr4++] = value4;
        }
        ptr = ptr4 << 2;
        while (ptr < stop) {
          HEAP8[ptr++] = value;
        }
      } else {
        while (num--) {
          HEAP8[ptr++] = value;
        }
      }
    }


___setErrNo(0);
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);

// === Auto-generated postamble setup entry stuff ===

Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);

  return _main(argc, argv, 0);
}


var _MAIN___i__;
var _MAIN___second;
var _MAIN___io___3;
var _c__9;
var _c__1;

var _c__3;

var __str2;
var _f_exit_xx;
































var _F_err;
var _stderr;



var _f__curunit;

var _f__units;



var _f__fmtbuf;


var _f__reading;


var _f__sequential;


var _f__formatted;


var _f__external;



var _f__init;
var _stdin;
var _stdout;
var _f__cf;
var _f__elist;
var _f__putn;
var _f__donewrec;
var _f__recpos;
var _f__cursor;
var _f__hiwater;
var _f__scale;
var _f__icvt_buf;



var _f__lioproc;

var _L_len;
var _f__Aquote;

var _xargc;
var _xargv;








var _f__r_mode;




var _f__w_mode;
var _f__buflen;
var _f__buf;







var _f__buf0;





var __ZL7mparams;
var __ZL4_gm_;
_MAIN___i__=allocate(1, "i32", ALLOC_STATIC);
_MAIN___second=allocate(1, "i32", ALLOC_STATIC);
_MAIN___io___3=allocate([0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"i32",0,0,0], ALLOC_STATIC);
_c__9=allocate([9], ["i32",0,0,0,0], ALLOC_STATIC);
_c__1=allocate([1], ["i32",0,0,0,0], ALLOC_STATIC);
STRING_TABLE.__str=allocate([72,79,85,82,32,61,32,0] /* HOUR = \00 */, "i8", ALLOC_STATIC);
_c__3=allocate([3], ["i32",0,0,0,0], ALLOC_STATIC);
STRING_TABLE.__str1=allocate([32,32,83,69,67,79,78,68,83,32,61,0] /*   SECONDS =\00 */, "i8", ALLOC_STATIC);
__str2=allocate(1, "i8", ALLOC_STATIC);
_f_exit_xx=allocate(12, ["i32",0,0,0,"i32",0,0,0,"*",0,0,0], ALLOC_STATIC);
STRING_TABLE.__str21=allocate([101,110,100,102,105,108,101,0] /* endfile\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str25=allocate([101,114,114,111,114,32,105,110,32,102,111,114,109,97,116,0] /* error in format\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str126=allocate([105,108,108,101,103,97,108,32,117,110,105,116,32,110,117,109,98,101,114,0] /* illegal unit number\ */, "i8", ALLOC_STATIC);
STRING_TABLE.__str227=allocate([102,111,114,109,97,116,116,101,100,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0] /* formatted io not all */, "i8", ALLOC_STATIC);
STRING_TABLE.__str328=allocate([117,110,102,111,114,109,97,116,116,101,100,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0] /* unformatted io not a */, "i8", ALLOC_STATIC);
STRING_TABLE.__str429=allocate([100,105,114,101,99,116,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0] /* direct io not allowe */, "i8", ALLOC_STATIC);
STRING_TABLE.__str530=allocate([115,101,113,117,101,110,116,105,97,108,32,105,111,32,110,111,116,32,97,108,108,111,119,101,100,0] /* sequential io not al */, "i8", ALLOC_STATIC);
STRING_TABLE.__str6=allocate([99,97,110,39,116,32,98,97,99,107,115,112,97,99,101,32,102,105,108,101,0] /* can't backspace file */, "i8", ALLOC_STATIC);
STRING_TABLE.__str7=allocate([110,117,108,108,32,102,105,108,101,32,110,97,109,101,0] /* null file name\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str831=allocate([99,97,110,39,116,32,115,116,97,116,32,102,105,108,101,0] /* can't stat file\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str9=allocate([117,110,105,116,32,110,111,116,32,99,111,110,110,101,99,116,101,100,0] /* unit not connected\0 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str10=allocate([111,102,102,32,101,110,100,32,111,102,32,114,101,99,111,114,100,0] /* off end of record\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str11=allocate([116,114,117,110,99,97,116,105,111,110,32,102,97,105,108,101,100,32,105,110,32,101,110,100,102,105,108,101,0] /* truncation failed in */, "i8", ALLOC_STATIC);
STRING_TABLE.__str12=allocate([105,110,99,111,109,112,114,101,104,101,110,115,105,98,108,101,32,108,105,115,116,32,105,110,112,117,116,0] /* incomprehensible lis */, "i8", ALLOC_STATIC);
STRING_TABLE.__str13=allocate([111,117,116,32,111,102,32,102,114,101,101,32,115,112,97,99,101,0] /* out of free space\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str14=allocate([114,101,97,100,32,117,110,101,120,112,101,99,116,101,100,32,99,104,97,114,97,99,116,101,114,0] /* read unexpected char */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1532=allocate([98,97,100,32,108,111,103,105,99,97,108,32,105,110,112,117,116,32,102,105,101,108,100,0] /* bad logical input fi */, "i8", ALLOC_STATIC);
STRING_TABLE.__str16=allocate([98,97,100,32,118,97,114,105,97,98,108,101,32,116,121,112,101,0] /* bad variable type\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str17=allocate([98,97,100,32,110,97,109,101,108,105,115,116,32,110,97,109,101,0] /* bad namelist name\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str18=allocate([118,97,114,105,97,98,108,101,32,110,111,116,32,105,110,32,110,97,109,101,108,105,115,116,0] /* variable not in name */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1933=allocate([110,111,32,101,110,100,32,114,101,99,111,114,100,0] /* no end record\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str20=allocate([118,97,114,105,97,98,108,101,32,99,111,117,110,116,32,105,110,99,111,114,114,101,99,116,0] /* variable count incor */, "i8", ALLOC_STATIC);
STRING_TABLE.__str2134=allocate([115,117,98,115,99,114,105,112,116,32,102,111,114,32,115,99,97,108,97,114,32,118,97,114,105,97,98,108,101,0] /* subscript for scalar */, "i8", ALLOC_STATIC);
STRING_TABLE.__str22=allocate([105,110,118,97,108,105,100,32,97,114,114,97,121,32,115,101,99,116,105,111,110,0] /* invalid array sectio */, "i8", ALLOC_STATIC);
STRING_TABLE.__str23=allocate([115,117,98,115,116,114,105,110,103,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0] /* substring out of bou */, "i8", ALLOC_STATIC);
STRING_TABLE.__str24=allocate([115,117,98,115,99,114,105,112,116,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0] /* subscript out of bou */, "i8", ALLOC_STATIC);
STRING_TABLE.__str2535=allocate([99,97,110,39,116,32,114,101,97,100,32,102,105,108,101,0] /* can't read file\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str26=allocate([99,97,110,39,116,32,119,114,105,116,101,32,102,105,108,101,0] /* can't write file\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str27=allocate([39,110,101,119,39,32,102,105,108,101,32,101,120,105,115,116,115,0] /* 'new' file exists\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str28=allocate([99,97,110,39,116,32,97,112,112,101,110,100,32,116,111,32,102,105,108,101,0] /* can't append to file */, "i8", ALLOC_STATIC);
STRING_TABLE.__str29=allocate([110,111,110,45,112,111,115,105,116,105,118,101,32,114,101,99,111,114,100,32,110,117,109,98,101,114,0] /* non-positive record  */, "i8", ALLOC_STATIC);
STRING_TABLE.__str30=allocate([110,109,76,98,117,102,32,111,118,101,114,102,108,111,119,0] /* nmLbuf overflow\00 */, "i8", ALLOC_STATIC);
_F_err=allocate(128, "*", ALLOC_STATIC);
STRING_TABLE.__str31=allocate([37,115,58,32,105,108,108,101,103,97,108,32,101,114,114,111,114,32,110,117,109,98,101,114,32,37,100,10,0] /* %s: illegal error nu */, "i8", ALLOC_STATIC);
STRING_TABLE.__str32=allocate([37,115,58,32,101,110,100,32,111,102,32,102,105,108,101,10,0] /* %s: end of file\0A\0 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str33=allocate([37,115,58,32,37,115,10,0] /* %s: %s\0A\00 */, "i8", ALLOC_STATIC);
_f__curunit=allocate(1, "%struct.unit*", ALLOC_STATIC);
STRING_TABLE.__str34=allocate([97,112,112,97,114,101,110,116,32,115,116,97,116,101,58,32,117,110,105,116,32,37,100,32,0] /* apparent state: unit */, "i8", ALLOC_STATIC);
_f__units=allocate(4800, ["*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0], ALLOC_STATIC);
STRING_TABLE.__str35=allocate([110,97,109,101,100,32,37,115,10,0] /* named %s\0A\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str36=allocate([40,117,110,110,97,109,101,100,41,10,0] /* (unnamed)\0A\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str37=allocate([97,112,112,97,114,101,110,116,32,115,116,97,116,101,58,32,105,110,116,101,114,110,97,108,32,73,47,79,10,0] /* apparent state: inte */, "i8", ALLOC_STATIC);
_f__fmtbuf=allocate(1, "i8*", ALLOC_STATIC);
STRING_TABLE.__str38=allocate([108,97,115,116,32,102,111,114,109,97,116,58,32,37,115,10,0] /* last format: %s\0A\0 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str39=allocate([108,97,116,101,108,121,32,37,115,32,37,115,32,37,115,32,37,115,0] /* lately %s %s %s %s\0 */, "i8", ALLOC_STATIC);
_f__reading=allocate(1, "i32", ALLOC_STATIC);
STRING_TABLE.__str40=allocate([114,101,97,100,105,110,103,0] /* reading\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str41=allocate([119,114,105,116,105,110,103,0] /* writing\00 */, "i8", ALLOC_STATIC);
_f__sequential=allocate(1, "i32", ALLOC_STATIC);
STRING_TABLE.__str42=allocate([115,101,113,117,101,110,116,105,97,108,0] /* sequential\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str43=allocate([100,105,114,101,99,116,0] /* direct\00 */, "i8", ALLOC_STATIC);
_f__formatted=allocate(1, "i32", ALLOC_STATIC);
STRING_TABLE.__str44=allocate([102,111,114,109,97,116,116,101,100,0] /* formatted\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str45=allocate([117,110,102,111,114,109,97,116,116,101,100,0] /* unformatted\00 */, "i8", ALLOC_STATIC);
_f__external=allocate(1, "i32", ALLOC_STATIC);
STRING_TABLE.__str46=allocate([101,120,116,101,114,110,97,108,0] /* external\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str47=allocate([105,110,116,101,114,110,97,108,0] /* internal\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str48=allocate([32,73,79,0] /*  IO\00 */, "i8", ALLOC_STATIC);
_f__init=allocate(1, "i32", ALLOC_STATIC);
_f__cf=allocate(1, "%struct.__sFILE*", ALLOC_STATIC);
_f__elist=allocate(1, "%struct.cilist*", ALLOC_STATIC);
_f__putn=allocate(1, "void (i32)*", ALLOC_STATIC);
_f__donewrec=allocate(1, "i32 ()*", ALLOC_STATIC);
_f__recpos=allocate(1, "i32", ALLOC_STATIC);
_f__cursor=allocate(1, "i32", ALLOC_STATIC);
_f__hiwater=allocate(1, "i32", ALLOC_STATIC);
_f__scale=allocate(1, "i32", ALLOC_STATIC);
_f__icvt_buf=allocate(24, "i8", ALLOC_STATIC);
STRING_TABLE.__str115=allocate([108,105,115,116,32,105,111,0] /* list io\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1116=allocate([115,116,108,101,114,0] /* stler\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str2117=allocate([108,105,111,0] /* lio\00 */, "i8", ALLOC_STATIC);
_f__lioproc=allocate(1, "i32 (i32*, i8*, i32, i32)*", ALLOC_STATIC);
STRING_TABLE.__str137=allocate([117,110,107,110,111,119,110,32,116,121,112,101,32,105,110,32,108,105,111,0] /* unknown type in lio\ */, "i8", ALLOC_STATIC);
_L_len=allocate(1, "i32", ALLOC_STATIC);
_f__Aquote=allocate(1, "i32", ALLOC_STATIC);
STRING_TABLE.__str1140=allocate([37,46,57,71,0] /* %.9G\00 */, "i8", ALLOC_STATIC);
_xargc=allocate(1, "i32", ALLOC_STATIC);
_xargv=allocate(1, "i8**", ALLOC_STATIC);
STRING_TABLE.__str147=allocate([75,105,108,108,101,100,0] /* Killed\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1148=allocate([73,110,116,101,114,114,117,112,116,0] /* Interrupt\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str2149=allocate([81,117,105,116,32,115,105,103,110,97,108,0] /* Quit signal\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str3150=allocate([84,114,97,99,101,32,116,114,97,112,0] /* Trace trap\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str4151=allocate([73,79,84,32,84,114,97,112,0] /* IOT Trap\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str5152=allocate([70,108,111,97,116,105,110,103,32,69,120,99,101,112,116,105,111,110,0] /* Floating Exception\0 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str153=allocate([114,98,0] /* rb\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1154=allocate([114,0] /* r\00 */, "i8", ALLOC_STATIC);
_f__r_mode=allocate(8, "*", ALLOC_STATIC);
STRING_TABLE.__str2157=allocate([119,98,0] /* wb\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str3158=allocate([119,0] /* w\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str4159=allocate([114,43,98,0] /* r+b\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str5160=allocate([114,43,0] /* r+\00 */, "i8", ALLOC_STATIC);
_f__w_mode=allocate(16, "*", ALLOC_STATIC);
_f__buflen=allocate([400], ["i32",0,0,0,0], ALLOC_STATIC);
_f__buf=allocate(1, "i8*", ALLOC_STATIC);
STRING_TABLE.__str6163=allocate([111,112,101,110,0] /* open\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str7164=allocate([102,111,114,116,46,37,108,100,0] /* fort.%ld\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str8165=allocate([110,111,32,115,112,97,99,101,0] /* no space\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str9166=allocate([115,0] /* s\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str10167=allocate([100,0] /* d\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str11168=allocate([102,0] /* f\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str12169=allocate([117,0] /* u\00 */, "i8", ALLOC_STATIC);
_f__buf0=allocate(400, "i8", ALLOC_STATIC);
STRING_TABLE.__str13170=allocate([109,97,108,108,111,99,32,102,97,105,108,117,114,101,0] /* malloc failure\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str216=allocate([83,84,79,80,32,0] /* STOP \00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str1217=allocate([32,115,116,97,116,101,109,101,110,116,32,101,120,101,99,117,116,101,100,10,0] /*  statement executed\ */, "i8", ALLOC_STATIC);
STRING_TABLE.__str224=allocate([37,115,10,0] /* %s\0A\00 */, "i8", ALLOC_STATIC);
STRING_TABLE.__str261=allocate([108,105,115,116,32,111,117,116,112,117,116,32,115,116,97,114,116,0] /* list output start\00 */, "i8", ALLOC_STATIC);
__ZL7mparams=allocate(24, "i32", ALLOC_STATIC);
__ZL4_gm_=allocate(468, ["i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"i32",0,0,0,"i32",0,0,0,"i32",0,0,0,"*",0,0,0,"i32",0,0,0,"*",0,0,0,"i32",0,0,0,"*",0,0,0,"i32",0,0,0], ALLOC_STATIC);
HEAP32[((_F_err)>>2)]=((STRING_TABLE.__str25)|0);
HEAP32[(((_F_err)+(4))>>2)]=((STRING_TABLE.__str126)|0);
HEAP32[(((_F_err)+(8))>>2)]=((STRING_TABLE.__str227)|0);
HEAP32[(((_F_err)+(12))>>2)]=((STRING_TABLE.__str328)|0);
HEAP32[(((_F_err)+(16))>>2)]=((STRING_TABLE.__str429)|0);
HEAP32[(((_F_err)+(20))>>2)]=((STRING_TABLE.__str530)|0);
HEAP32[(((_F_err)+(24))>>2)]=((STRING_TABLE.__str6)|0);
HEAP32[(((_F_err)+(28))>>2)]=((STRING_TABLE.__str7)|0);
HEAP32[(((_F_err)+(32))>>2)]=((STRING_TABLE.__str831)|0);
HEAP32[(((_F_err)+(36))>>2)]=((STRING_TABLE.__str9)|0);
HEAP32[(((_F_err)+(40))>>2)]=((STRING_TABLE.__str10)|0);
HEAP32[(((_F_err)+(44))>>2)]=((STRING_TABLE.__str11)|0);
HEAP32[(((_F_err)+(48))>>2)]=((STRING_TABLE.__str12)|0);
HEAP32[(((_F_err)+(52))>>2)]=((STRING_TABLE.__str13)|0);
HEAP32[(((_F_err)+(56))>>2)]=((STRING_TABLE.__str9)|0);
HEAP32[(((_F_err)+(60))>>2)]=((STRING_TABLE.__str14)|0);
HEAP32[(((_F_err)+(64))>>2)]=((STRING_TABLE.__str1532)|0);
HEAP32[(((_F_err)+(68))>>2)]=((STRING_TABLE.__str16)|0);
HEAP32[(((_F_err)+(72))>>2)]=((STRING_TABLE.__str17)|0);
HEAP32[(((_F_err)+(76))>>2)]=((STRING_TABLE.__str18)|0);
HEAP32[(((_F_err)+(80))>>2)]=((STRING_TABLE.__str1933)|0);
HEAP32[(((_F_err)+(84))>>2)]=((STRING_TABLE.__str20)|0);
HEAP32[(((_F_err)+(88))>>2)]=((STRING_TABLE.__str2134)|0);
HEAP32[(((_F_err)+(92))>>2)]=((STRING_TABLE.__str22)|0);
HEAP32[(((_F_err)+(96))>>2)]=((STRING_TABLE.__str23)|0);
HEAP32[(((_F_err)+(100))>>2)]=((STRING_TABLE.__str24)|0);
HEAP32[(((_F_err)+(104))>>2)]=((STRING_TABLE.__str2535)|0);
HEAP32[(((_F_err)+(108))>>2)]=((STRING_TABLE.__str26)|0);
HEAP32[(((_F_err)+(112))>>2)]=((STRING_TABLE.__str27)|0);
HEAP32[(((_F_err)+(116))>>2)]=((STRING_TABLE.__str28)|0);
HEAP32[(((_F_err)+(120))>>2)]=((STRING_TABLE.__str29)|0);
HEAP32[(((_F_err)+(124))>>2)]=((STRING_TABLE.__str30)|0);
HEAP32[((_f__r_mode)>>2)]=((STRING_TABLE.__str153)|0);
HEAP32[(((_f__r_mode)+(4))>>2)]=((STRING_TABLE.__str1154)|0);
HEAP32[((_f__w_mode)>>2)]=((STRING_TABLE.__str2157)|0);
HEAP32[(((_f__w_mode)+(4))>>2)]=((STRING_TABLE.__str3158)|0);
HEAP32[(((_f__w_mode)+(8))>>2)]=((STRING_TABLE.__str4159)|0);
HEAP32[(((_f__w_mode)+(12))>>2)]=((STRING_TABLE.__str5160)|0);
HEAP32[((_f__buf)>>2)]=((_f__buf0)|0);
FUNCTION_TABLE = [0,0,_sigfdie,0,_sigidie,0,_sigtrdie,0,_sigqdie,0,_sigindie,0,_sigtdie,0,_f_exit,0,_x_putc,0,_l_write,0,_x_wSL,0]; Module["FUNCTION_TABLE"] = FUNCTION_TABLE;


function run(args) {
  args = args || Module['arguments'];

  if (Module['preRun']) {
    Module['preRun']();
    if (runDependencies > 0) {
      // preRun added a dependency, run will be called later
      Module['preRun'] = null;
      return 0;
    }
  }

  function doRun() {
    var ret = 0;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      Module['postRun']();
    }
    return ret;
  }

  return doRun();
}
Module['run'] = run;

// {{PRE_RUN_ADDITIONS}}

initRuntime();

if (Module['noInitialRun']) {
  addRunDependency();
}

if (runDependencies == 0) {
  var ret = run();
}

// {{POST_RUN_ADDITIONS}}





  // {{MODULE_ADDITIONS}}


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["_f__icvt","_MAIN__","_f_clos","_f_exit","_do_lio","_t_runc","_f__canseek","_f__fatal","_f_init","_f__nowwriting","_c_le","_l_write","_lwrt_I","_lwrt_F","_lwrt_C","_lwrt_L","_lwrt_A","_donewrec","_l_g","_l_put","_sigfdie","_sigidie","_sigtrdie","_sigqdie","_sigindie","_sigtdie","_main","_f__putbuf","_f__bufadj","_x_putc","_f_open","_g_char","_opn_err","_fk_open","_wrt_L","_x_wSL","_s_wsle","_e_wsle","_s_stop","_sig_die","_malloc","__ZL13tmalloc_smallP12malloc_statej","__ZL13tmalloc_largeP12malloc_statej","__ZL9sys_allocP12malloc_statej","_free","__ZL8sys_trimP12malloc_statej","__ZL15segment_holdingP12malloc_statePc","__ZL23release_unused_segmentsP12malloc_state","__ZL12init_mparamsv","__ZL8init_topP12malloc_stateP12malloc_chunkj","__ZL10mmap_allocP12malloc_statej","__ZL9init_binsP12malloc_state","__ZL13prepend_allocP12malloc_statePcS1_j","__ZL11add_segmentP12malloc_statePcjj"]

