module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _child_process = __webpack_require__(1);
	
	var _child_process2 = _interopRequireDefault(_child_process);
	
	var _firebase = __webpack_require__(2);
	
	var _firebase2 = _interopRequireDefault(_firebase);
	
	var _q = __webpack_require__(3);
	
	var _q2 = _interopRequireDefault(_q);
	
	var _config = __webpack_require__(4);
	
	var _config2 = _interopRequireDefault(_config);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var devices = [{
	  msgType: 'scm',
	  deviceId: '43000657',
	  category: 'electric'
	}, {
	  msgType: 'r900',
	  deviceId: '1541531110',
	  category: 'water'
	}];
	
	_firebase2.default.initializeApp(_config2.default);
	
	var db = _firebase2.default.database();
	
	var reading = db.ref("reading");
	
	var read = function read(device) {
	
	  var deferred = _q2.default.defer();
	
	  var msgType = device.msgType;
	  var deviceId = device.deviceId;
	  var category = device.category;
	
	
	  var cmd = 'rtlamr -filterid=' + deviceId + ' -msgtype=' + msgType + ' -single=true -quiet -format=json --server=192.168.10.172:1234';
	
	  _child_process2.default.exec(cmd, function (err, stdout, stderr) {
	
	    if (err) {
	
	      deferred.reject(new Error(err));
	    } else {
	
	      var data = JSON.parse(stdout);
	      data.category = category;
	
	      deferred.resolve(data);
	    }
	  });
	
	  return deferred.promise;
	};
	
	var save = function save(data) {
	
	  var deferred = _q2.default.defer();
	
	  data = Object.assign({ timeStamp: data.Time, category: data.category }, data.Message);
	
	  reading.set(data, function (err) {
	    var dataStr = JSON.stringify(data);
	
	    if (err) {
	      console.log('Error when saving ' + dataStr, err);
	    } else {
	      console.log('Saved ' + dataStr);
	    }
	    deferred.resolve();
	  });
	
	  return deferred.promise;
	};
	
	var readDevices = function readDevices() {
	
	  (0, _q2.default)(null).then(read.bind(null, devices[0])).then(save).then(read.bind(null, devices[1])).then(save).done(readDevices);
	};
	
	exports.default = readDevices;

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("child_process");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("firebase");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("q");

/***/ },
/* 4 */
/***/ function(module, exports) {

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.default = {
	    serviceAccount: process.env.FIREBASE_SERVER_CREDENTIALS,
	    databaseURL: 'https://glaring-fire-6854.firebaseio.com/'
	};

/***/ }
/******/ ]);
//# sourceMappingURL=reader.js.map