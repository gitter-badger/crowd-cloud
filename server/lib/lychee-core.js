
lychee = typeof lychee !== 'undefined' ? lychee : (function(global) {

	/*
	 * NAMESPACE
	 */

	if (typeof lychee === 'undefined') {
		lychee = global.lychee = {};
	}



	/*
	 * HELPERS
	 */

	var _environment = null;

	var _bootstrap_environment = function() {

		if (_environment === null) {

			_environment = new lychee.Environment({
				debug: true
			});

		}


		if (this.environment === null) {
			this.setEnvironment(_environment);
		}

	};

	var _resolve_constructor = function(identifier) {

		var pointer = this;

		var ns = identifier.split('.');
		for (var n = 0, l = ns.length; n < l; n++) {

			var name = ns[n];

			if (pointer[name] !== undefined) {
				pointer = pointer[name];
			} else {
				pointer = null;
				break;
			}

		}


		return pointer;

	};



	/*
	 * IMPLEMENTATION
	 */

	var Module = {

		debug:        true,
		environment:  _environment,

		ENVIRONMENTS: {},
		VERSION:      0.8,



		/*
		 * LIBRARY API
		 */

		diff: function(aobject, bobject) {

			var akeys = Object.keys(aobject);
			var bkeys = Object.keys(bobject);

			if (akeys.length !== bkeys.length) {
				return true;
			}


			for (var a = 0, al = akeys.length; a < al; a++) {

				var key = akeys[a];

				if (bobject[key] !== undefined) {

					if (aobject[key] !== null && bobject[key] !== null) {

						if (aobject[key] instanceof Object && bobject[key] instanceof Object) {

							if (lychee.diff(aobject[key], bobject[key]) === true) {

								// Allows aobject[key].builds = {} and bobject[key].builds = { stuff: {}}
								if (Object.keys(aobject[key]).length > 0) {
									return true;
								}

							}

						} else if (typeof aobject[key] !== typeof bobject[key]) {
							return true;
						}

					}

				} else {
					return true;
				}

			}


			return false;

		},

		enumof: function(template, value) {

			if (template instanceof Object && typeof value === 'number') {

				var valid = false;

				for (var val in template) {

					if (value === template[val]) {
						valid = true;
						break;
					}

				}


				return valid;

			}


			return false;

		},

		extend: function(target) {

			for (var a = 1, al = arguments.length; a < al; a++) {

				var object = arguments[a];
				if (object) {

					for (var prop in object) {
						target[prop] = object[prop];
					}

				}

			}


			return target;

		},

		extendsafe: function(target) {

			for (var a = 1, al = arguments.length; a < al; a++) {

				var object = arguments[a];
				if (object) {

					for (var prop in object) {

						var tvalue = target[prop];
						var ovalue = object[prop];
						if (tvalue instanceof Array && ovalue instanceof Array) {

							lychee.extendsafe(target[prop], object[prop]);

						} else if (tvalue instanceof Object && ovalue instanceof Object) {

							lychee.extendsafe(target[prop], object[prop]);

						} else if (typeof tvalue === typeof ovalue) {

							target[prop] = object[prop];

						}

					}

				}

			}


			return target;

		},

		extendunlink: function(target) {

			for (var a = 1, al = arguments.length; a < al; a++) {

				var object = arguments[a];
				if (object) {

					for (var prop in object) {

						var tvalue = target[prop];
						var ovalue = object[prop];
						if (tvalue instanceof Object && ovalue instanceof Object) {
							target[prop] = {};
							lychee.extendunlink(target[prop], object[prop]);
						} else {
							target[prop] = object[prop];
						}

					}

				}

			}


			return target;

		},

		interfaceof: function(template, instance) {

			var valid = false;
			var method, property;

			// 1. Interface validation on Template
			if (template instanceof Function && template.prototype instanceof Object && instance instanceof Function && instance.prototype instanceof Object) {

				valid = true;

				for (method in template.prototype) {

					if (typeof template.prototype[method] !== typeof instance.prototype[method]) {
						valid = false;
						break;
					}

				}


			// 2. Interface validation on Instance
			} else if (template instanceof Function && template.prototype instanceof Object && instance instanceof Object) {

				valid = true;

				for (method in template.prototype) {

					if (typeof template.prototype[method] !== typeof instance[method]) {
						valid = false;
						break;
					}

				}


			// 3. Interface validation on Struct
			} else if (template instanceof Object && instance instanceof Object) {

				valid = true;

				for (property in template) {

					if (template.hasOwnProperty(property) && instance.hasOwnProperty(property)) {

						if (typeof template[property] !== typeof instance[property]) {
							valid = false;
							break;
						}

					}

				}

			}


			return valid;

		},



		/*
		 * ENTITY API
		 */

		serialize: function(definition) {

			definition = definition !== undefined ? definition : null;


			if (definition !== null) {

				if (typeof definition.serialize === 'function') {
					return definition.serialize();
				} else {
					return JSON.parse(JSON.stringify(definition));
				}

			}


			return null;

		},

		deserialize: function(data) {

			data = data instanceof Object ? data : null;


			if (data !== null) {

				if (typeof data.constructor === 'string' && data.arguments instanceof Array) {

					var construct = _resolve_constructor.call(this.environment.global, data.constructor);
					if (typeof construct === 'function') {

						var bindargs = [].splice.call(data.arguments, 0);
						bindargs.reverse();
						bindargs.push(construct);
						bindargs.reverse();


						for (var b = 0, bl = bindargs.length; b < bl; b++) {

							var value = bindargs[b];
							if (typeof value === 'string' && value.charAt(0) === '#') {

								if (lychee.debug === true) {
									console.log('lychee.deserialize: Injecting "' + value + '" from environment.global');
								}


								var resolved = _resolve_constructor.call(this.environment.global, value.substr(1));
								if (resolved !== null) {
									bindargs[b] = resolved;
								}

							}

						}


						var instance = new (
							construct.bind.apply(
								construct,
								bindargs
							)
						)();


						// High-Level ENTITY API
						if (typeof instance.deserialize === 'function') {

							var blob = data.blob || null;
							if (blob !== null) {
								instance.deserialize(blob);
							}

						// Low-Level ASSET API
						} else if (typeof instance.load === 'function') {
							instance.load();
						}


						return instance;

					} else {

						if (lychee.debug === true) {
							console.warn('lychee.deserialize: Require ' + data.constructor + ' to deserialize it.');
						}

					}

				}

			}


			return null;

		},



		/*
		 * CUSTOM API
		 */

		define: function(identifier) {

			_bootstrap_environment.call(this);

			var definition  = new lychee.Definition(identifier);
			var environment = this.environment;

			definition.exports = function(callback) {
				lychee.Definition.prototype.exports.call(this, callback);
				environment.define(this);
			};

			return definition;

		},

		init: function(callback) {

			_bootstrap_environment.call(this);

			return this.environment.init(callback);

		},

		setEnvironment: function(environment) {

			environment = environment instanceof lychee.Environment ? environment : null;


			if (environment !== null) {
				this.environment = environment;
				this.debug = this.environment.debug;
			} else {
				this.environment = _environment;
				this.debug = this.environment.debug;
			}


			return true;

		}

	};


	return Module.extend(lychee, Module);

})(typeof global !== 'undefined' ? global : this);


lychee.Debugger = typeof lychee.Debugger !== 'undefined' ? lychee.Debugger : (function(global) {

	/*
	 * HELPERS
	 */

	var _client      = null;
	var _environment = null;

	var _bootstrap_environment = function() {

		if (_environment === null) {

			var currentenv = lychee.environment;
			lychee.setEnvironment(null);

			var defaultenv = lychee.environment;
			lychee.setEnvironment(currentenv);

			_environment = defaultenv;

		}

	};

	var _diff_environment = function(environment) {

		var cache1 = {};
		var cache2 = {};

		var global1 = _environment.global;
		var global2 = environment.global;

		for (var prop1 in global1) {

			if (global1[prop1] === global2[prop1]) continue;

			if (typeof global1[prop1] !== typeof global2[prop1]) {
				cache1[prop1] = global1[prop1];
			}

		}

		for (var prop2 in global2) {

			if (global2[prop2] === global1[prop2]) continue;

			if (typeof global2[prop2] !== typeof global1[prop2]) {
				cache2[prop2] = global2[prop2];
			}

		}


		var diff = lychee.extend({}, cache1, cache2);
		if (Object.keys(diff).length > 0) {
			return diff;
		}


		return null;

	};

	var _report = function(data) {

		if (_client === null && typeof sorbet === 'object' && typeof sorbet.net === 'object' && typeof sorbet.net.Client === 'function') {

			_client = new sorbet.net.Client();
			_client.bind('connect', function() {
				_report.call(this, data);
			}, this, true);

		} else if (_client !== null) {

			var service = _client.getService('debugger');
			if (service !== null) {
				service.report('lychee.Debugger Report', data);
			}

		}


		console.error('lychee.Debugger: Report', data);

	};



	/*
	 * IMPLEMENTATION
	 */

	var Module = {

		/*
		 * CUSTOM API
		 */

		expose: function(environment) {

			_bootstrap_environment();


			var project = environment instanceof lychee.Environment ? environment.id : null;


			if (project !== null) {

				if (lychee.diff(environment.global, _environment.global) === true) {

					var diff = _diff_environment(environment);
					if (diff !== null) {
						return diff;
					}

				}

			}


			return null;

		},

		report: function(environment, error, definition) {

			_bootstrap_environment();


			var project = environment instanceof lychee.Environment ? environment.id          : null;

			environment = environment instanceof lychee.Environment ? environment.serialize() : null;
			definition  = definition instanceof lychee.Definition   ? definition.id           : null;


			var data = {
				project:     project,
				definition:  definition,
				environment: environment,
				file:        null,
				line:        null,
				method:      null,
				type:        error.toString().split(':')[0],
				message:     error.message
			};


			if (typeof Error.captureStackTrace === 'function') {

				var orig = Error.prepareStackTrace;

				Error.prepareStackTrace = function(err, stack) { return stack; };
				Error.captureStackTrace(new Error());


				var callsite = error.stack[0];

				data.file   = callsite.getFileName();
				data.line   = callsite.getLineNumber();
				data.method = callsite.getFunctionName() || callsite.getMethodName();


				Error.prepareStackTrace = orig;

			}


			_report(data);


			return true;

		}

	};


	return Module;

})(typeof global !== 'undefined' ? global : this);


lychee.Definition = typeof lychee.Definition !== 'undefined' ? lychee.Definition : (function(global) {

	var lychee = global.lychee;

	var Class = function(id) {

		id = typeof id === 'string' ? id : '';


		if (id.match(/\./)) {

			var tmp = id.split('.');

			this.id        = id;
			this.classId   = tmp.slice(1).join('.');
			this.packageId = tmp[0];

		} else {

			this.id        = 'lychee.' + id;
			this.classId   = id;
			this.packageId = 'lychee';

		}


		this._attaches = {};
		this._tags     = {};
		this._requires = [];
		this._includes = [];
		this._exports  = null;
		this._supports = null;


		return this;

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		deserialize: function(blob) {

			if (blob.attaches instanceof Object) {

				var attachesmap = {};

				for (var aid in blob.attaches) {
					attachesmap[aid] = lychee.deserialize(blob.attaches[aid]);
				}

				this.attaches(attachesmap);

			}

			if (blob.tags instanceof Object) {
				this.tags(blob.tags);
			}

			if (blob.requires instanceof Array) {
				this.requires(blob.requires);
			}

			if (blob.includes instanceof Array) {
				this.includes(blob.includes);
			}


			var index1, index2, tmp, bindargs;

			if (typeof blob.supports === 'string') {

				// Function head
				tmp      = blob.supports.split('{')[0].trim().substr('function '.length);
				bindargs = tmp.substr(1, tmp.length - 2).split(',');

				// Function body
				index1 = blob.supports.indexOf('{') + 1;
				index2 = blob.supports.lastIndexOf('}') - 1;
				bindargs.push(blob.supports.substr(index1, index2 - index1));

				this.supports(Function.apply(Function, bindargs));

			}

			if (typeof blob.exports === 'string') {

				// Function head
				tmp      = blob.exports.split('{')[0].trim().substr('function '.length);
				bindargs = tmp.substr(1, tmp.length - 2).split(',');

				// Function body
				index1 = blob.exports.indexOf('{') + 1;
				index2 = blob.exports.lastIndexOf('}') - 1;
				bindargs.push(blob.exports.substr(index1, index2 - index1));

				this.exports(Function.apply(Function, bindargs));

			}

		},

		serialize: function() {

			var settings = {};
			var blob     = {};


			if (Object.keys(this._attaches).length > 0) {

				blob.attaches = {};

				for (var aid in this._attaches) {
					blob.attaches[aid] = lychee.serialize(this._attaches[aid]);
				}

			}

			if (Object.keys(this._tags).length > 0) {

				blob.tags = {};

				for (var tid in this._tags) {
					blob.tags[tid] = this._tags[tid];
				}

			}

			if (this._requires.length > 0)          blob.requires = this._requires.slice(0);
			if (this._includes.length > 0)          blob.includes = this._includes.slice(0);
			if (this._supports instanceof Function) blob.supports = this._supports.toString();
			if (this._exports instanceof Function)  blob.exports  = this._exports.toString();


			return {
				'constructor': 'lychee.Definition',
				'arguments':   [ this.id ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},



		/*
		 * CUSTOM API
		 */

		attaches: function(map) {

			map = map instanceof Object ? map : null;


			if (map !== null) {

				for (var id in map) {

					var value = map[id];
					if (value instanceof Font || value instanceof Music || value instanceof Sound || value instanceof Texture || value !== undefined) {
						this._attaches[id] = map[id];
					}

				}

			}


			return this;

		},

		exports: function(callback) {

			callback = callback instanceof Function ? callback : null;


			if (callback !== null) {
				this._exports = callback;
			}


			return this;

		},

		includes: function(definitions) {

			definitions = definitions instanceof Array ? definitions : null;


			if (definitions !== null) {

				for (var d = 0, dl = definitions.length; d < dl; d++) {

					var definition = definitions[d];
					if (typeof definition === 'string') {

						if (definition.indexOf('.') !== -1 && this._includes.indexOf(definition) === -1) {
							this._includes.push(definition);
						}

					}

				}

			}


			return this;

		},

		requires: function(definitions) {

			definitions = definitions instanceof Array ? definitions : null;


			if (definitions !== null) {

				for (var d = 0, dl = definitions.length; d < dl; d++) {

					var definition = definitions[d];
					if (typeof definition === 'string') {

						if (definition.indexOf('.') !== -1 && this._requires.indexOf(definition) === -1) {
							this._requires.push(definition);
						}

					}

				}

			}


			return this;

		},

		supports: function(callback) {

			callback = callback instanceof Function ? callback : null;


			if (callback !== null) {
				this._supports = callback;
			}


			return this;

		},

		tags: function(map) {

			map = map instanceof Object ? map : null;


			if (map !== null) {

				for (var id in map) {

					var value = map[id];
					if (typeof value === 'string') {
						this._tags[id] = value;
					}

				}

			}


			return this;

		}

	};


	return Class;

})(typeof global !== 'undefined' ? global : this);


lychee.Environment = typeof lychee.Environment !== 'undefined' ? lychee.Environment : (function(global) {

	var lychee  = global.lychee;
	var console = global.console;




	/*
	 * EVENTS
	 */

	var _export_loop = function(cache) {

		var that  = this;
		var load  = cache.load;
		var ready = cache.ready;

		var identifier, definition;


		for (var l = 0, ll = load.length; l < ll; l++) {

			identifier = load[l];
			definition = this.definitions[identifier] || null;


			if (definition !== null) {

				if (ready.indexOf(identifier) === -1) {
					ready.push(identifier);
				}

				load.splice(l, 1);
				ll--;
				l--;

			}

		}


		for (var r = 0, rl = ready.length; r < rl; r++) {

			identifier = ready[r];
			definition = this.definitions[identifier] || null;

			if (definition !== null) {

				var dependencies = _resolve_definition.call(this, definition);
				if (dependencies.length > 0) {

					dependencies.forEach(function(dependency) {

						if (load.indexOf(dependency) === -1 && ready.indexOf(dependency) === -1) {

							that.load(dependency);
							load.push(dependency);

						}

					});

				} else {

					_export_definition.call(this, definition);

					ready.splice(r, 1);
					rl--;
					r--;

				}

			}

		}


		if (load.length === 0 && ready.length === 0) {

			cache.active = false;

		} else {

			if (Date.now() > cache.timeout) {
				cache.active = false;
			}

		}

	};



	/*
	 * HELPERS
	 */

	var _validate_values = function(array) {

		if (array instanceof Array) {

			var valid = true;

			for (var a = 0, al = array.length; a < al; a++) {

				var value = array[a];
				if (typeof value !== 'string') {
					valid = false;
					break;
				}

			}


			return valid;

		}


		return false;

	};

	var _validate_definition = function(definition) {

		if (!definition instanceof lychee.Definition) {
			return false;
		}


		var supported = false;

		if (definition._supports !== null) {

			// TODO: We need a Proxy for determination of all required sandboxed properties
			supported = definition._supports.call(global, lychee, global);

		} else {
			supported = true;
		}


		var tagged = true;

		if (Object.keys(definition._tags).length > 0) {

			for (var type in definition._tags) {

				var value = definition._tags[type];
				var tags  = this.tags[type] || null;
				if (tags instanceof Array) {

					if (tags.indexOf(value) === -1) {

						tagged = false;
						break;

					}

				}

			}

		}


		if (this.type === 'build') {

			return tagged;

		} else if (this.type === 'export') {

			return tagged;

		} else if (this.type === 'source') {

			return supported && tagged;

		}


		return false;

	};

	var _get_package = function(packageId) {

		for (var p = 0, pl = this.packages.length; p < pl; p++) {

			var pkg = this.packages[p];
			if (pkg.id === packageId) {
				return pkg;
			}

		}


		return null;

	};

	var _resolve_definition = function(definition) {

		var dependencies = [];


		if (definition instanceof lychee.Definition) {

			for (var i = 0, il = definition._includes.length; i < il; i++) {

				var inc      = definition._includes[i];
				var incclass = _get_class.call(this.global, inc);
				if (incclass === null) {
					dependencies.push(inc);
				}

			}

			for (var r = 0, rl = definition._requires.length; r < rl; r++) {

				var req      = definition._requires[r];
				var reqclass = _get_class.call(this.global, req);
				if (reqclass === null) {
					dependencies.push(req);
				}

			}

		}


		return dependencies;

	};

	var _export_definition = function(definition) {

		if (_get_class.call(this.global, definition.id) !== null) {
			return false;
		}


		var namespace  = _get_namespace.call(this.global, definition.id);
		var packageId  = definition.packageId;
		var classId    = definition.classId.split('.').pop();


		if (this.debug === true) {
			var info = Object.keys(definition._attaches).length > 0 ? ('(' + Object.keys(definition._attaches).length + ' Attachment(s))') : '';
			this.global.console.log('lychee-Environment-' + this.id + ': Exporting "' + definition.id + '" ' + info);
		}



		/*
		 * 1. Export Class, Module or Callback
		 */

		var template = null;
		if (definition._exports !== null) {

			if (this.debug === true) {

				if (packageId === 'lychee') {

					try {

						// TODO: This needs to be sandboxed, so global will be this.global

						template = definition._exports.call(
							definition._exports,
							this.global.lychee,
							global,
							definition._attaches
						) || null;

					} catch(err) {
						lychee.Debugger.report(this, err, definition);
					}

				} else {

					try {

						// TODO: This needs to be sandboxed, so global will be this.global

						template = definition._exports.call(
							definition._exports,
							this.global.lychee,
							this.global[packageId],
							global,
							definition._attaches
						) || null;

					} catch(err) {
						lychee.Debugger.report(this, err, definition);
					}

				}

			} else {

				if (packageId === 'lychee') {

					// TODO: This needs to be sandboxed, so global will be this.global

					template = definition._exports.call(
						definition._exports,
						this.global.lychee,
						global,
						definition._attaches
					) || null;

				} else {

					// TODO: This needs to be sandboxed, so global will be this.global

					template = definition._exports.call(
						definition._exports,
						this.global.lychee,
						this.global[packageId],
						global,
						definition._attaches
					) || null;

				}

			}

		}



		/*
		 * 2. Extend Class, Module or Callback
		 */

		if (template !== null) {

			/*
			 * 2.1 Extend and export Class or Module
			 */

			var includes = definition._includes;
			if (includes.length > 0) {


				// Cache old prototype
				var oldprototype = null;
				if (template.prototype instanceof Object) {

					oldprototype = {};

					for (var property in template.prototype) {
						oldprototype[property] = template.prototype[property];
					}

				}



				// Define classId in namespace
				Object.defineProperty(namespace, classId, {
					value:        template,
					writable:     false,
					enumerable:   true,
					configurable: false
				});


				// Create new prototype
				namespace[classId].prototype = {};


				var extendargs = [];

				extendargs.push(namespace[classId].prototype);

				for (var i = 0, il = includes.length; i < il; i++) {

					var include = _get_template.call(this.global, includes[i]);
					if (include !== null) {

						extendargs.push(include.prototype);

					} else {

						if (this.debug === true) {
							console.error('lychee-Environment-' + this.id + ': Invalid Inclusion of "' + includes[i] + '"');
						}

					}

				}


				if (oldprototype !== null) {
					extendargs.push(oldprototype);
				}


				lychee.extend.apply(lychee, extendargs);

				Object.seal(namespace[classId].prototype);


			/*
			 * 2.2 Nothing to include, plain Definition
			 */

			} else {

				namespace[classId] = template;


				if (template instanceof Object) {
					Object.seal(namespace[classId]);
				}

			}

		} else {

			namespace[classId] = function() {};

			if (this.debug === true) {
				this.global.console.error('lychee-Environment-' + this.id + ': Invalid Definition "' + definition.id + '", it is a Dummy now.');
			}

		}


		return true;

	};

	var _get_class = function(identifier) {

		var id = identifier.split('.').pop();

		var pointer = _get_namespace.call(this, identifier);
		if (pointer[id] !== undefined) {
			return pointer;
		}


		return null;

	};

	var _get_namespace = function(identifier) {

		var pointer = this;

		var ns = identifier.split('.'); ns.pop();
		for (var n = 0, l = ns.length; n < l; n++) {

			var name = ns[n];

			if (pointer[name] === undefined) {
				pointer[name] = {};
			}

			pointer = pointer[name];

		}


		return pointer;

	};

	var _get_template = function(identifier) {

		var pointer = this;

		var ns = identifier.split('.');
		for (var n = 0, l = ns.length; n < l; n++) {

			var name = ns[n];

			if (pointer[name] !== undefined) {
				pointer = pointer[name];
			} else {
				pointer = null;
				break;
			}

		}


		return pointer;

	};



	/*
	 * STRUCTS
	 */

	var _sandbox = function(settings) {

		this.__STDOUT = '';
		this.__STDERR = '';


		var that = this;

		this.console = {};
		this.console.log = function() {

			var str = '\n';

			for (var a = 0, al = arguments.length; a < al; a++) {

				var arg = arguments[a];
				if (arg instanceof Object) {
					str += JSON.stringify(arg, null, '\t');
				} else if (typeof arg.toString === 'function') {
					str += arg.toString();
				} else {
					str += arg;
				}

				if (a < al - 1) {
					str += '\t';
				}

			}

			that.__STDOUT += str;

			if (str.substr(0, 3) === '(E)') {
				that.__STDERR += str;
			}

		};

		this.console.info = function() {

			var args = [ '(I)\t' ];

			for (var a = 0, al = arguments.length; a < al; a++) {
				args.push(arguments[a]);
			}

			this.log.apply(this, args);

		};

		this.console.warn = function() {

			var args = [ '(W)\t' ];

			for (var a = 0, al = arguments.length; a < al; a++) {
				args.push(arguments[a]);
			}

			this.log.apply(this, args);

		};

		this.console.error = function() {

			var args = [ '(E)\t' ];

			for (var a = 0, al = arguments.length; a < al; a++) {
				args.push(arguments[a]);
			}

			this.log.apply(this, args);

		};


		this.Buffer  = global.Buffer;
		this.Config  = global.Config;
		this.Font    = global.Font;
		this.Music   = global.Music;
		this.Sound   = global.Sound;
		this.Texture = global.Texture;


		this.lychee              = {};
		this.lychee.ENVIRONMENTS = {};
		this.lychee.VERSION      = global.lychee.VERSION;

		[
			'debug', 'environment',
			'diff', 'extend', 'extendsafe', 'extendunlink',
			'enumof', 'interfaceof',
			'serialize', 'deserialize',
			'define', 'init', 'setEnvironment',
			'Debugger', 'Definition', 'Environment', 'Package'
		].forEach(function(identifier) {

			that.lychee[identifier] = global.lychee[identifier];

		});


		this.setTimeout = function(callback, timeout) {
			global.setTimeout(callback, timeout);
		};

		this.setInterval = function(callback, interval) {
			global.setInterval(callback, interval);
		};


		if (settings instanceof Object) {

			for (var property in settings) {

				var instance = lychee.deserialize(settings[property]);
				if (instance !== null) {
					this[property] = instance;
				}

			}

		}

	};

	_sandbox.prototype = {

		deserialize: function(blob) {

			if (typeof blob.STDOUT === 'string') {
				this.__STDOUT = blob.STDOUT;
			}

			if (typeof blob.STDERR === 'string') {
				this.__STDERR = blob.STDERR;
			}

		},

		serialize: function() {

			var settings = {};
			var blob     = {};


			for (var property in this) {

				if (property.charAt(0) !== '_' && property === property.toUpperCase()) {
					settings[property] = lychee.serialize(this[property]);
				}

			}


			if (this.__STDOUT.length > 0) blob.STDOUT = this.__STDOUT;
			if (this.__STDERR.length > 0) blob.STDERR = this.__STDERR;


			return {
				'constructor': '_sandbox',
				'arguments':   [ settings ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		}

	};



	/*
	 * IMPLEMENTATION
	 */

	var _id = 0;

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.id          = '' + _id++;
		this.build       = 'game.Main';
		this.debug       = true;
		this.definitions = {};
		this.global      = new _sandbox();
		this.packages    = [];
		this.sandbox     = true;
		this.tags        = {};
		this.timeout     = 10000;
		this.type        = 'source';


		this.__cache = {
			active:   false,
			start:    0,
			end:      0,
			timeout:  0,
			build:    {
				'load':  [],
				'ready': []
			}
		};


		// Alternative API for lychee.pkg

		if (settings.packages instanceof Array) {

			for (var p = 0, pl = settings.packages.length; p < pl; p++) {

				var pkg = settings.packages[p];
				if (pkg instanceof Array) {
					settings.packages[p] = new lychee.Package(pkg[0], pkg[1]);
				}

			}

		}


		this.setSandbox(settings.sandbox);
		this.setDebug(settings.debug);

		this.setDefinitions(settings.definitions);
		this.setId(settings.id);
		this.setPackages(settings.packages);
		this.setTags(settings.tags);
		this.setTimeout(settings.timeout);

		// Needs this.packages to be ready
		this.setType(settings.type);
		this.setBuild(settings.build);



		/*
		 * INITIALIZATION
		 */

		var type = this.type;
		if (type === 'source' || type === 'export') {

			var lypkg = _get_package.call(this, 'lychee');
			if (lypkg === null) {

				lypkg = new lychee.Package('lychee', '/lychee/lychee.pkg');

				if (this.debug === true) {
					this.global.console.log('lychee-Environment-' + this.id + ': Injecting Package "lychee"');
				}

				lypkg.setEnvironment(this);
				this.packages.push(lypkg);

			}

		}


		settings = null;

	};



	/*
	 * BOOTSTRAP API
	 */

	Class.__FILENAME = null;

	var _asset_types = {};

	Class.createAsset = function(url, type) {

		url  = typeof url === 'string'  ? url  : null;
		type = typeof type === 'string' ? type : null;


		if (url !== null) {

			if (type === null) {
				type = url.split('/').pop().split('.').pop();
			}


			var construct = _asset_types[type] || _asset_types['*'] || null;
			if (construct !== null) {
				return new construct(url);
			}

		}


		return null;

	};

	Class.setAssetType = function(type, construct) {

		type      = typeof type === 'string'      ? type      : null;
		construct = construct instanceof Function ? construct : null;


		if (type !== null && construct !== null) {

			_asset_types[type] = construct;


			return true;

		}


		return false;

	};



	/*
	 * IMPLEMENTATION
	 */

	Class.prototype = {

		createAsset: function(url) {
			return Class.createAsset(url);
		},


		/*
		 * ENTITY API
		 */

		deserialize: function(blob) {

			if (blob.definitions instanceof Object) {

				for (var id in blob.definitions) {
					this.definitions[id] = lychee.deserialize(blob.definitions[id]);
				}

			}

			if (blob.packages instanceof Array) {

				var packages = [];

				for (var p = 0, pl = blob.packages.length; p < pl; p++) {
					packages.push(lychee.deserialize(blob.packages[p]));
				}

				this.setPackages(packages);

				// This is a dirty hack which is allowed here
				this.setType(blob.type);
				this.setBuild(blob.build);

			} else {

				// This is a dirty hack which is allowed here
				this.setType(blob.type);
				this.setBuild(blob.build);

			}

			if (blob.global instanceof Object) {

				this.global = new _sandbox(blob.global.arguments[0]);

				if (blob.global.blob !== null) {
					this.global.deserialize(blob.global.blob)
				}

			}

		},

		serialize: function() {

			var settings = {};
			var blob     = {};


			if (this.id !== '0')            settings.id      = this.id;
			if (this.build !== 'game.Main') settings.build   = this.build;
			if (this.debug !== true)        settings.debug   = this.debug;
			if (this.sandbox !== true)      settings.sandbox = this.sandbox;
			if (this.timeout !== 10000)     settings.timeout = this.timeout;
			if (this.type !== 'source')     settings.type    = this.type;


			if (Object.keys(this.tags).length > 0) {

				settings.tags = {};

				for (var tagid in this.tags) {
					settings.tags[tagid] = this.tags[tagid];
				}

			}

			if (Object.keys(this.definitions).length > 0) {

				blob.definitions = {};

				for (var defid in this.definitions) {
					blob.definitions[defid] = lychee.serialize(this.definitions[defid]);
				}

			}

			if (this.packages.length > 0) {

				blob.packages = [];

				for (var p = 0, pl = this.packages.length; p < pl; p++) {
					blob.packages.push(lychee.serialize(this.packages[p]));
				}

				// This is a dirty hack which is allowed here
				blob.type  = this.type;
				blob.build = this.build;

			}

			if (this.sandbox === true) {
				blob.global = this.global.serialize();
			}


			return {
				'constructor': 'lychee.Environment',
				'arguments':   [ settings ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},



		/*
		 * CUSTOM API
		 */

		load: function(identifier) {

			identifier = typeof identifier === 'string' ? identifier : null;


			if (identifier !== null) {

				var packageId = identifier.split('.')[0];
				var classId   = identifier.split('.').slice(1).join('.');


				var definition = this.definitions[identifier] || null;
				if (definition !== null) {

					return true;

				} else {

					var pkg = _get_package.call(this, packageId);
					if (pkg !== null && pkg.isReady() === true) {

						var result = pkg.load(classId, this.tags);
						if (result === true) {

							if (this.debug === true) {
								this.global.console.log('lychee-Environment-' + this.id + ': Loading "' + identifier + '" from Package "' + pkg.id + '"');
							}

						}


						return result;

					}

				}

			}


			return false;

		},

		define: function(definition) {

			var filename = Class.__FILENAME || null;
			if (filename !== null) {

				if (definition instanceof lychee.Definition) {

					var oldPackageId = definition.packageId;
					var newPackageId = null;

					for (var p = 0, pl = this.packages.length; p < pl; p++) {

						var root = this.packages[p].root;
						if (filename.substr(0, root.length) === root) {
							newPackageId = this.packages[p].id;
							break;
						}

					}


					if (newPackageId !== null && newPackageId !== oldPackageId) {

						if (this.debug === true) {
							this.global.console.log('lychee-Environment-' + this.id + ': Injecting Definition "' + definition.id + '" as "' + newPackageId + '.' + definition.classId + '"');
						}


						definition.packageId = newPackageId;
						definition.id        = definition.packageId + '.' + definition.classId;

						for (var i = 0, il = definition._includes.length; i < il; i++) {

							var inc = definition._includes[i];
							if (inc.substr(0, oldPackageId.length) === oldPackageId) {
								definition._includes[i] = newPackageId + inc.substr(oldPackageId.length);
							}

						}

						for (var r = 0, rl = definition._requires.length; r < rl; r++) {

							var req = definition._requires[r];
							if (req.substr(0, oldPackageId.length) === oldPackageId) {
								definition._requires[r] = newPackageId + req.substr(oldPackageId.length);
							}

						}

					}

				}

			}


			if (_validate_definition.call(this, definition) === true) {

				if (this.debug === true) {
					var info = Object.keys(definition._tags).length > 0 ? ('(' + JSON.stringify(definition._tags) + ')') : '';
					this.global.console.log('lychee-Environment-' + this.id + ': Mapping "' + definition.id + '" ' + info);
				}

				this.definitions[definition.id] = definition;

			} else {

				if (this.debug === true) {
					this.global.console.error('lychee-Environment-' + this.id + ': Invalid Definition "' + definition.id + '"');
				}

			}


			return definition;

		},

		init: function(callback) {

			callback = callback instanceof Function ? callback : function() {};


			var build = this.build;
			var cache = this.__cache;
			var that  = this;

			if (build !== null && cache.active === false) {

				var result = this.load(build, 'lychee.init');
				if (result === true) {

					if (this.debug === true) {
						this.global.console.log('lychee-Environment-' + this.id + ': BUILD START ("' + this.build + '")');
					}


					cache.start   = Date.now();
					cache.timeout = Date.now() + this.timeout;
					cache.load    = [ build ];
					cache.ready   = [];
					cache.active  = true;


					var onbuildend = function() {

						cache.end = Date.now();

						if (this.debug === true) {
							this.global.console.log('lychee-Environment-' + this.id + ': BUILD END (' + (cache.end - cache.start) + 'ms)');
						}


						if (this.sandbox === true) {
							this.global.lychee.environment = this;
						}


						if (this.debug === true) {

							try {

								callback.call(
									this.global,
									this.global
								);

							} catch(err) {
								lychee.Debugger.report(this, err, null);
							}

						} else {

							callback.call(
								this.global,
								this.global
							);

						}

					};


					var intervalId = setInterval(function() {

						var cache = that.__cache;
						if (cache.active === true) {

							_export_loop.call(that, cache);

						} else if (cache.active === false) {

							if (intervalId !== null) {
								clearInterval(intervalId);
								intervalId = null;
							}

							if (Date.now() > cache.timeout) {

								if (that.debug === true) {
									that.global.console.error('lychee-Environment-' + that.id + ': BUILD TIMEOUT (' + (Date.now() - cache.start) + 'ms)');
									that.global.console.error('lychee-Environment-' + that.id + ': Invalid Dependencies "' + cache.build['load'] + '"');
								}

							} else {
								onbuildend.call(that);
							}

						}

					}, (1000 / 60) | 0);

				} else {

					if (this.debug === true) {
						this.global.console.log('lychee-Environment-' + this.id + ': Package not ready, retrying in 100ms ...');
					}


					setTimeout(function() {
						that.init(callback);
					}, 100);

				}

			}

		},

		inject: function(environment) {

			environment = environment instanceof Class ? environment : null;


			if (environment !== null) {

				for (var identifier in environment.definitions) {

					var definition = environment.definitions[identifier];
					if (_validate_definition.call(this, definition) === true) {

						if (this.debug === true) {
							var info = Object.keys(definition._tags).length > 0 ? ('(' + JSON.stringify(definition._tags) + ')') : '';
							this.global.console.log('lychee-Environment-' + this.id + ': Injecting "' + definition.id + '" ' + info);
						}

						// Inject definition as environment knows definition
						this.definitions[identifier] = definition;

					}

				}


				return true;

			}


			return false;

		},

		setBuild: function(identifier) {

			identifier = typeof identifier === 'string' ? identifier : null;


			if (identifier !== null) {

				var type = this.type;
				if (type === 'build') {

					this.build = identifier;

					return true;

				} else {

					var pkg = _get_package.call(this, identifier.split('.')[0]);
					if (pkg !== null) {

						this.build = identifier;

						return true;

					}

				}

			}


			return false;

		},

		setDebug: function(debug) {

			if (debug === true || debug === false) {

				this.debug = debug;

				if (this.sandbox === true) {
					this.global.lychee.debug = debug;
				}

				return true;

			}


			return false;

		},

		setDefinitions: function(definitions) {

			definitions = definitions instanceof Object ? definitions : null;


			if (definitions !== null) {

				for (var identifier in definitions) {

					var definition = definitions[identifier];
					if (definition instanceof lychee.Definition) {
						this.definitions[identifier] = definition;
					}

				}


				return true;

			}


			return false;

		},

		setId: function(id) {

			id = typeof id === 'string' ? id : null;


			if (id !== null) {

				this.id = id;


				return true;

			}


			return false;

		},

		setPackages: function(packages) {

			packages = packages instanceof Array ? packages : null;


			if (packages !== null) {

				for (var p = 0, pl = packages.length; p < pl; p++) {

					var pkg = packages[p];
					if (pkg instanceof lychee.Package) {

						if (this.debug === true) {
							this.global.console.log('lychee-Environment-' + this.id + ': Adding Package "' + pkg.id + '"');
						}

						pkg.setEnvironment(this);
						this.packages.push(pkg);

					}

				}


				return true;

			}


			return false;

		},

		setSandbox: function(sandbox) {

			if (sandbox === true || sandbox === false) {

				this.sandbox = sandbox;


				if (sandbox === true) {
					this.global = new _sandbox();
				} else {
					this.global = global;
				}


				return true;

			}


			return false;

		},

		setTags: function(tags) {

			tags = tags instanceof Object ? tags : null;


			if (tags !== null) {

				for (var type in tags) {

					var values = tags[type];
					if (_validate_values(values) === true) {
						this.tags[type] = values;
					}

				}


				return true;

			}


			return false;

		},

		setTimeout: function(timeout) {

			timeout = typeof timeout === 'number' ? timeout : null;


			if (timeout !== null) {

				this.timeout = timeout;

				return true;

			}


			return false;

		},

		setType: function(type) {

			if (type === 'source' || type === 'export' || type === 'build') {

				this.type = type;


				for (var p = 0, pl = this.packages.length; p < pl; p++) {
					this.packages[p].setType(this.type);
				}


				return true;

			}


			return false;

		}

	};


	return Class;

})(typeof global !== 'undefined' ? global : this);


lychee.Package = typeof lychee.Package !== 'undefined' ? lychee.Package : (function(global) {

	var lychee = global.lychee;


	/*
	 * HELPERS
	 */

	var _resolve_root = function() {

		var root = this.root;
		var type = this.type;
		if (type === 'source') {
			root += '/source';
		} else if (type === 'export') {
			root += '/source';
		} else if (type === 'build') {
			root += '/build';
		}


		return root;

	};

	var _resolve_path = function(candidate) {

		var path = typeof candidate === 'string' ? candidate.split('/') : null;


		if (path !== null) {

			var type = this.type;
			if (type === 'export') {
				type = 'source';
			}


			var pointer = this.config.buffer[type].files || null;
			if (pointer !== null) {

				for (var p = 0, pl = path.length; p < pl; p++) {

					var name = path[p];
					if (pointer[name] !== undefined) {
						pointer = pointer[name];
					} else {
						pointer = null;
						break;
					}

				}

			}


			return pointer !== null ? true : false;

		}


		return false;

	};

	var _resolve_attachments = function(candidate) {

		var attachments = {};
		var path        = candidate.split('/');
		if (path.length > 0) {

			var pointer = this.config.buffer.source.files || null;
			if (pointer !== null) {

				for (var pa = 0, pal = path.length; pa < pal; pa++) {

					var name = path[pa];
					if (pointer[name] !== undefined) {
						pointer = pointer[name];
					} else {
						pointer = null;
						break;
					}

				}


				if (pointer !== null && pointer instanceof Array) {

					var classpath = _resolve_root.call(this) + '/' + path.join('/');

					for (var po = 0, pol = pointer.length; po < pol; po++) {

						var type = pointer[po];
						if (type !== 'js') {
							attachments[type] = classpath + '.' + type;
						}

					}

				}

			}

		}


		return attachments;

	};

	var _resolve_candidates = function(classId, tags) {

		var candidatepath = classId.split('.').join('/');
		var candidates    = [];

		for (var tag in tags) {

			var values = tags[tag];
			for (var v = 0, vl = values.length; v < vl; v++) {

				var path = _resolve_tag.call(this, tag, values[v]) + '/' + candidatepath;
				if (_resolve_path.call(this, path) === true) {
					candidates.push(path);
				}

			}

		}


		if (_resolve_path.call(this, candidatepath) === true) {
			candidates.push(candidatepath);
		}


		return candidates;

	};

	var _resolve_tag = function(tag, value) {

		tag   = typeof tag === 'string'   ? tag   : null;
		value = typeof value === 'string' ? value : null;


		if (tag !== null && value !== null) {

			var type = this.type;
			if (type === 'export') {
				type = 'source';
			}


			var pointer = this.config.buffer[type].tags || null;
			if (pointer !== null) {

				if (pointer[tag] instanceof Object) {

					var path = pointer[tag][value] || null;
					if (path !== null) {
						return path;
					}

				}

			}

		}


		return '';

	};

	var _load_candidate = function(classId, candidates) {

		if (candidates.length > 0) {

			var map = {
				classId:      classId,
				candidate:    null,
				attachments:  [],
				dependencies: [],
				loading:      candidates.length
			};

			this.requests[classId] = map;


			for (var c = 0, cl = candidates.length; c < cl; c++) {

				var candidate = candidates[c];
				if (this.__blacklist[candidate] === 1) continue;

				var url            = _resolve_root.call(this) + '/' + candidates[c] + '.js';
				var implementation = lychee.Environment.createAsset(url);
				var attachments    = _resolve_attachments.call(this, candidate);

				if (implementation !== null) {
					_load_candidate_implementation.call(this, candidate, implementation, attachments, map);
				}

			}

		}

	};

	var _load_candidate_implementation = function(candidate, implementation, attachments, map) {

		var that       = this;
		var identifier = this.id + '.' + map.classId;


		implementation.onload = function(result) {

			map.loading--;


			// Fastest path, file doesn't exist
			if (result === false) {

				delete environment.definitions[identifier];
				that.__blacklist[candidate] = 1;

				return;

			}


			var environment = that.environment;
			var definition  = environment.definitions[identifier] || null;
			if (definition !== null) {

				map.candidate = this;


				var attachmentIds = Object.keys(attachments);


				// Temporary delete definition from environment and re-define it after attachments are all loaded
				if (attachmentIds.length > 0) {

					delete environment.definitions[identifier];

					map.loading += attachmentIds.length;


					attachmentIds.forEach(function(assetId) {

						var url   = attachments[assetId];
						var asset = lychee.Environment.createAsset(url);
						if (asset !== null) {

							asset.onload = function(result) {

								map.loading--;

								var tmp = {};
								if (result === true) {
									tmp[assetId] = this;
								} else {
									tmp[assetId] = null;
								}

								definition.attaches(tmp);


								if (map.loading === 0) {
									environment.definitions[identifier] = definition;
								}

							};

							asset.load();

						} else {

							map.loading--;

						}

					});

				}


				for (var i = 0, il = definition._includes.length; i < il; i++) {
					environment.load(definition._includes[i]);
				}

				for (var r = 0, rl = definition._requires.length; r < rl; r++) {
					environment.load(definition._requires[r]);
				}

			} else {

				that.__blacklist[candidate] = 1;

			}

		};

		implementation.load();

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(id, url) {

		id = typeof id === 'string' ? id : 'game';


		this.environment = null;
		this.root        = null;
		this.tags        = {};
		this.type        = 'source';
		this.url         = null;
		this.config      = null;

		this.__blacklist = {};
		this.requests  = {};


		var tmp  = url.split('/');
		var file = tmp.pop();
		if (file === 'lychee.pkg') {

			this.id   = id;
			this.root = tmp.join('/');
			this.url  = url;


			var that = this;

			this.config = new Config(this.url);
			this.config.onload = function(result) {

				if (that.isReady() === false) {
					result = false;
				}


				if (result === true) {

					if (lychee.debug === true) {
						console.info('lychee.Package-' + that.id + ': Package at ' + this.url + ' ready');
					}

				} else {

					if (lychee.debug === true) {
						console.error('lychee.Package-' + that.id + ': Package at ' + this.url + ' corrupt');
					}

				}

			};
			this.config.load();

		}

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			return {
				'constructor': 'lychee.Package',
				'arguments':   [ this.id, this.url ]
			};

		},



		/*
		 * CUSTOM API
		 */

		isReady: function() {

			var ready  = false;
			var config = this.config;

			if (config !== null && config.buffer !== null) {

				if (config.buffer.source instanceof Object && config.buffer.build instanceof Object) {
					ready = true;
				}

			}


			return ready;

		},

		load: function(classId, tags) {

			classId = typeof classId === 'string' ? classId : null;


			if (classId !== null && this.isReady() === true) {

				var request = this.requests[classId] || null;
				if (request === null) {

					var candidates = _resolve_candidates.call(this, classId, tags);
					if (candidates.length > 0) {

						_load_candidate.call(this, classId, candidates);

						return true;

					} else {

						if (lychee.debug === true) {
							var info = Object.keys(tags).length > 0 ? ('(' + JSON.stringify(tags) + ')') : '';
							console.error('lychee.Package-' + this.id + ': Invalid Definition "' + classId + '" ' + info);
						}

						return false;

					}

				} else {

					return true;

				}

			}


			return false;

		},

		setEnvironment: function(environment) {

			environment = environment instanceof lychee.Environment ? environment : null;


			if (environment !== null) {

				this.environment = environment;

				return true;

			}


			return false;

		},

		setType: function(type) {

			type = typeof type === 'string' ? type : null;


			if (type !== null) {

				if (type === 'source' || type === 'export' || type === 'build') {

					this.type = type;

					return true;

				}

			}


			return false;

		}

	};


	return Class;

})(typeof global !== 'undefined' ? global : this);


(function(lychee, global) {

	/*
	 * HELPERS
	 */

	var _fs        = require('fs');
	var _root      = process.cwd();
	var __filename = null;

	var _resolve_url = function(path) {

		if (_root !== '') {
			path = _root + (path.charAt(0) === '/' ? '' : '/') + path;
		}


		var tmp = path.split('/');

		for (var t = 0, tl = tmp.length; t < tl; t++) {

			if (tmp[t] === '.') {
				tmp.splice(t, 1);
				tl--;
				t--;
			} else if (tmp[t] === '..') {
				tmp.splice(t - 1, 2);
				tl -= 2;
				t  -= 2;
			}

		}

		return tmp.join('/');

	};

	var _load_asset = function(settings, callback, scope) {

		var path     = _resolve_url(settings.url);
		var encoding = settings.encoding === 'binary' ? 'binary': 'utf8';


		_fs.readFile(path, encoding, function(err, buffer) {

			var raw = null;
			if (!err) {
				raw = buffer;
			}

			try {
				callback.call(scope, raw);
			} catch(err) {
				lychee.Debugger.report(lychee.environment, err, null);
			}

		});

	};



	/*
	 * POLYFILLS
	 */

	var _log   = console.log   || function() {};
	var _info  = console.info  || console.log;
	var _warn  = console.warn  || console.log;
	var _error = console.error || console.log;


	console.log = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push('\u001b[40m');
		args.push('\u001b[37m');
		args.reverse();
		args.push('\u001b[39m');
		args.push('\u001b[49m');

		_log.apply(console, args);

	};

	console.info = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push('\u001b[42m');
		args.push('\u001b[37m');
		args.reverse();
		args.push('\u001b[39m');
		args.push('\u001b[49m');

		_info.apply(console, args);

	};

	console.warn = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push('\u001b[43m');
		args.push('\u001b[37m');
		args.reverse();
		args.push('\u001b[39m');
		args.push('\u001b[49m');

		_warn.apply(console, args);

	};

	console.error = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push('\u001b[41m');
		args.push('\u001b[37m');
		args.reverse();
		args.push('\u001b[39m');
		args.push('\u001b[49m');

		_error.apply(console, args);

	};



	var _META_KEYCODE     = /^(?:\x1b)([a-zA-Z0-9])$/;
	var _FUNCTION_KEYCODE = /^(?:\x1b+)(O|N|\[|\[\[)(?:(\d+)(?:;(\d+))?([~^$])|(?:1;)?(\d+)?([a-zA-Z]))/;

	var _parse_keypress   = function(str) {

		var parts;


		if (Buffer.isBuffer(str)) {

			if (str[0] > 127 && str[1] === undefined) {
				str[0] -= 128;
				str = '\x1b' + str.toString('utf8');
			} else {
				str = str.toString('utf8');
			}

		}


		var key = {
			name:     null,
			ctrl:     false,
			meta:     false,
			shift:    false
		};


		// Return
		if (str === '\r' || str === '\n') {

			key.name = 'return';

		// Tab
		} else if (str === '\t') {

			key.name = 'tab';

		// Backspace or Ctrl + H
		} else if (str === '\b' || str === '\x7f' || str === '\x1b\b' || str === '\x1b\x7f') {

			key.name = 'backspace';
			key.meta = (str.charAt(0) === '\x1b');

		// Escape
		} else if (str === '\x1b' || str === '\x1b\x1b') {

			key.name = 'escape';
			key.meta = (str.length === 2);

		// Space
		} else if (str === ' ' || str === '\x1b ') {

			key.name = 'space';
			key.meta = (str.length === 2);

		// Ctrl + Letter
		} else if (str <= '\x1a') {

			key.name = String.fromCharCode(str.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
			key.ctrl = true;

		// Letter
		} else if (str.length === 1 && str >= 'a' && str <= 'z') {

			key.name = str;

		// Shift + Letter
		} else if (str.length === 1 && str >= 'A' && str <= 'Z') {

			// was: key.name = str.toLowerCase();
			key.name = str;
			key.shift = true;

		// Meta + Letter
		} else if ((parts = _META_KEYCODE.exec(str))) {

			key.name = parts[1].toLowerCase();
			key.meta = true;
			key.shift = /^[A-Z]$/.test(parts[1]);

		// Function Key (ANSI ESCAPE SEQUENCE)
		} else if ((parts = _FUNCTION_KEYCODE.exec(str))) {

			var code = (parts[1] || '') + (parts[2] || '') + (parts[4] || '') + (parts[6] || '');
			var mod  = (parts[3] || parts[5] || 1) - 1;

			key.ctrl = !!(mod & 4);
			key.meta = !!(mod & 10);
			key.shift = !!(mod & 1);


			// Parse the key itself
			switch (code) {

				/* xterm ESC O letter */
				case 'OP':   key.name = 'f1'; break;
				case 'OQ':   key.name = 'f2'; break;
				case 'OR':   key.name = 'f3'; break;
				case 'OS':   key.name = 'f4'; break;

				/* xterm ESC [ number ~ */
				case '[11~': key.name = 'f1'; break;
				case '[12~': key.name = 'f2'; break;
				case '[13~': key.name = 'f3'; break;
				case '[14~': key.name = 'f4'; break;

				/* Cygwin/libuv */
				case '[[A':  key.name = 'f1'; break;
				case '[[B':  key.name = 'f2'; break;
				case '[[C':  key.name = 'f3'; break;
				case '[[D':  key.name = 'f4'; break;
				case '[[E':  key.name = 'f5'; break;

				/* common */
				case '[15~': key.name = 'f5';  break;
				case '[17~': key.name = 'f6';  break;
				case '[18~': key.name = 'f7';  break;
				case '[19~': key.name = 'f8';  break;
				case '[20~': key.name = 'f9';  break;
				case '[21~': key.name = 'f10'; break;
				case '[23~': key.name = 'f11'; break;
				case '[24~': key.name = 'f12'; break;

				/* xterm ESC [ letter */
				case '[A':   key.name = 'up';    break;
				case '[B':   key.name = 'down';  break;
				case '[C':   key.name = 'right'; break;
				case '[D':   key.name = 'left';  break;
				case '[E':   key.name = 'clear'; break;
				case '[F':   key.name = 'end';   break;
				case '[H':   key.name = 'home';  break;

				/* xterm ESC O letter */
				case 'OA':   key.name = 'up';    break;
				case 'OB':   key.name = 'down';  break;
				case 'OC':   key.name = 'right'; break;
				case 'OD':   key.name = 'left';  break;
				case 'OE':   key.name = 'clear'; break;
				case 'OF':   key.name = 'end';   break;
				case 'OH':   key.name = 'home';  break;

				/* xterm ESC [ number ~ */
				case '[1~':  key.name = 'home';     break;
				case '[2~':  key.name = 'insert';   break;
				case '[3~':  key.name = 'delete';   break;
				case '[4~':  key.name = 'end';      break;
				case '[5~':  key.name = 'pageup';   break;
				case '[6~':  key.name = 'pagedown'; break;

				/* Putty */
				case '[[5~': key.name = 'pageup';   break;
				case '[[6~': key.name = 'pagedown'; break;

				/* misc. */
				case '[Z':   key.name = 'tab'; key.shift = true; break;
				default:     key.name = null;                    break;

			}

		}


		if (key.name !== null) {
			return key;
		}


		return null;

	};



	/*
	 * FEATURE DETECTION
	 */

	(function() {

		var consol  = 'console' in global;
		var audio   = false;
		var buffer  = true;
		var image   = false;


		if (lychee.debug === true) {

			var methods = [];

			if (consol)  methods.push('console');
			if (audio)   methods.push('Audio');
			if (buffer)  methods.push('Buffer');
			if (image)   methods.push('Image');

			if (methods.length === 0) {
				console.error('bootstrap.js: Supported methods are NONE');
			} else {
				console.info('bootstrap.js: Supported methods are ' + methods.join(', '));
			}

		}

	})();



	/*
	 * CONFIG IMPLEMENTATION
	 */

	var _config_cache = {};


	var _clone_config = function(origin, clone) {

		if (origin.buffer !== null) {

			clone.buffer = JSON.parse(JSON.stringify(origin.buffer));

			clone.__load = false;

		}

	};


	var Config = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url    = url;
		this.onload = null;
		this.buffer = null;

		this.__load = true;


		if (url !== null) {

			if (_config_cache[url] !== undefined) {
				_clone_config(_config_cache[url], this);
			} else {
				_config_cache[url] = this;
			}

		}

	};


	Config.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.buffer = JSON.parse(new Buffer(blob.buffer, 'base64').toString('utf8'));
			}

		},

		serialize: function() {

			var blob = {};


			if (this.buffer !== null) {
				blob.buffer = new Buffer(JSON.stringify(this.buffer), 'utf8').toString('base64');
			}


			return {
				'constructor': 'Config',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url,
				encoding: 'utf8'
			}, function(raw) {

				var data = null;
				try {
					data = JSON.parse(raw);
				} catch(e) {
				}


				this.buffer = data;


				if (data !== null) {

				} else {

					if (lychee.debug === true) {
						console.error('bootstrap.js: Config at ' + this.url + ' is invalid (No JSON file)');
					}

				}


				if (this.onload instanceof Function) {
					this.onload(data !== null);
					this.onload = null;
				}

			}, this);

		}

	};



	/*
	 * FONT IMPLEMENTATION
	 */

	var _parse_font = function(data) {

		if (typeof data.kerning === 'number' && typeof data.spacing === 'number') {

			if (data.kerning > data.spacing) {
				data.kerning = data.spacing;
			}

		}


		if (data.texture !== undefined) {
			this.texture = new Texture(data.texture);
			this.texture.load();
		}


		this.baseline   = typeof data.baseline === 'number'    ? data.baseline   : this.baseline;
		this.charset    = typeof data.charset === 'string'     ? data.charset    : this.charset;
		this.spacing    = typeof data.spacing === 'number'     ? data.spacing    : this.spacing;
		this.kerning    = typeof data.kerning === 'number'     ? data.kerning    : this.kerning;
		this.lineheight = typeof data.lineheight === 'number'  ? data.lineheight : this.lineheight;


		if (data.map instanceof Array) {

			this.__buffer     = {};
			this.__buffer[''] = {
				width:      0,
				height:     this.lineheight,
				realwidth:  0,
				realheight: this.lineheight,
				x:          0,
				y:          0
			};



			var offset = this.spacing;

			for (var c = 0, cl = this.charset.length; c < cl; c++) {

				var id = this.charset[c];

				var chr = {
					width:      data.map[c] + this.spacing * 2,
					height:     this.lineheight,
					realwidth:  data.map[c],
					realheight: this.lineheight,
					x:          offset - this.spacing,
					y:          0
				};

				offset += chr.width;


				this.__buffer[id] = chr;

			}

		}


		if (this.texture === null || this.__buffer === null) {

			if (lychee.debug === true) {
				console.error('bootstrap.js: Font at "' + this.url + '" is invalid (No FNT file)');
			}

		}

	};


	var _font_cache = {};


	var _clone_font = function(origin, clone) {

		if (origin.__buffer !== null && origin.texture !== null) {

			clone.texture    = origin.texture;

			clone.baseline   = origin.baseline;
			clone.charset    = origin.charset;
			clone.spacing    = origin.spacing;
			clone.kerning    = origin.kerning;
			clone.lineheight = origin.lineheight;

			clone.__buffer   = origin.__buffer;
			clone.__load     = false;

		}

	};


	var Font = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url        = url;
		this.onload     = null;
		this.texture    = null;

		this.baseline   = 0;
		this.charset    = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
		this.spacing    = 0;
		this.kerning    = 0;
		this.lineheight = 1;

		this.__buffer   = null;
		this.__load     = true;


		if (url !== null) {

			if (_font_cache[url] !== undefined) {
				_clone_font(_font_cache[url], this);
			} else {
				_font_cache[url] = this;
			}

		}

	};


	Font.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.__buffer = JSON.parse(new Buffer(blob.buffer.substr(29), 'base64').toString('utf8'));
			}

			if (blob.texture instanceof Object) {
				this.texture = lychee.deserialize(blob.texture);
			}

		},

		serialize: function() {

			var blob = {};


			if (this.__buffer !== null) {
				blob.buffer = 'data:application/json;base64,' + new Buffer(JSON.stringify(this.__buffer), 'utf8').toString('base64');
			}

			if (this.texture instanceof Texture) {
				blob.texture = lychee.serialize(this.texture);
			}


			return {
				'constructor': 'Font',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		measure: function(text) {

			text = typeof text === 'string' ? text : null;


			if (text !== null) {

				if (text.length === 1) {

					if (this.__buffer[text] !== undefined) {
						return this.__buffer[text];
					}

				} else if (text.length > 1) {

					var data = this.__buffer[text] || null;
					if (data === null) {

						var width = 0;

						for (var t = 0, tl = text.length; t < tl; t++) {
							var chr = this.measure(text[t]);
							width  += chr.realwidth + this.kerning;
						}


						// TODO: Embedded Font ligatures will set x and y values based on settings.map

						data = this.__buffer[text] = {
							width:      width,
							height:     this.lineheight,
							realwidth:  width,
							realheight: this.lineheight,
							x:          0,
							y:          0
						};

					}


					return data;

				}

			}


			return this.__buffer[''];

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url,
				encoding: 'utf8'
			}, function(raw) {

				var data = null;
				try {
					data = JSON.parse(raw);
				} catch(e) {
				}


				if (data !== null) {
					_parse_font.call(this, data);
					this.__load = false;
				}


				if (this.onload instanceof Function) {
					this.onload(data !== null);
					this.onload = null;
				}

			}, this);

		}

	};



	/*
	 * MUSIC IMPLEMENTATION
	 */

	var _music_cache = {};


	var _clone_music = function(origin, clone) {

		if (origin.buffer !== null) {

			clone.buffer = origin.buffer;

			clone.__load = false;

		}

	};


	var Music = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url       = url;
		this.onload    = null;
		this.buffer    = null;
		this.volume    = 0.0;
		this.isIdle    = true;
		this.isLooping = false;

		this.__load    = true;


		if (url !== null) {

			if (_music_cache[url] !== undefined) {
				_clone_music(_music_cache[url], this);
			} else {
				_music_cache[url] = this;
			}

		}

	};


	Music.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.buffer = new Buffer(blob.buffer, 'base64');
			}

		},

		serialize: function() {

			var blob = {};

			if (this.buffer !== null) {
				blob.buffer = new Buffer(this.buffer, 'binary').toString('base64');
			}


			return {
				'constructor': 'Music',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url,
				encoding: 'binary'
			}, function(raw) {

				if (raw !== null) {
					this.buffer = new Buffer(raw, 'binary');
				}


				if (this.onload instanceof Function) {
					this.onload(raw !== null);
					this.onload = null;
				}

			}, this);

		},

		clone: function() {
			return new Music(this.url);
		},

		play: function() {
			this.isIdle = false;
		},

		pause: function() {
			this.isIdle = true;
		},

		resume: function() {
			this.isIdle = false;
		},

		stop: function() {
			this.isIdle = true;
		},

		setVolume: function(volume) {

			volume = typeof volume === 'number' ? volume : null;


			return false;

		}

	};



	/*
	 * SOUND IMPLEMENTATION
	 */

	var _sound_cache = {};


	var _clone_sound = function(origin, clone) {

		if (origin.buffer !== null) {

			clone.buffer = origin.buffer;

			clone.__load = false;

		}

	};


	var Sound = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url    = url;
		this.onload = null;
		this.buffer = null;
		this.volume = 0.0;
		this.isIdle = true;

		this.__load = true;


		if (url !== null) {

			if (_sound_cache[url] !== undefined) {
				_clone_sound(_sound_cache[url], this);
			} else {
				_sound_cache[url] = this;
			}

		}

	};


	Sound.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.buffer = new Buffer(blob.buffer, 'base64');
			}

		},

		serialize: function() {

			var blob = {};

			if (this.buffer !== null) {
				blob.buffer = new Buffer(this.buffer, 'binary').toString('base64');
			}


			return {
				'constructor': 'Sound',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url,
				encoding: 'binary'
			}, function(raw) {

				if (raw !== null) {
					this.buffer = new Buffer(raw, 'binary');
				}


				if (this.onload instanceof Function) {
					this.onload(raw !== null);
					this.onload = null;
				}

			}, this);

		},

		clone: function() {
			return new Sound(this.url);
		},

		play: function() {
			this.isIdle = false;
		},

		pause: function() {
			this.isIdle = true;
		},

		resume: function() {
			this.isIdle = false;
		},

		stop: function() {
			this.isIdle = true;
		},

		setVolume: function(volume) {

			volume = typeof volume === 'number' ? volume : null;


			return false;

		}

	};



	/*
	 * TEXTURE IMPLEMENTATION
	 */

	var _texture_id    = 0;
	var _texture_cache = {};

	var _parse_texture = function(data) {

		this.width  = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
		this.height = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];

	};


	var _clone_texture = function(origin, clone) {

		if (origin.buffer !== null) {

			clone.id     = origin.id;

			clone.buffer = origin.buffer;
			clone.width  = origin.width;
			clone.height = origin.height;

			clone.__load = false;

		}

	};


	var Texture = function(url) {

		url = typeof url === 'string' ? url : null;


		this.id     = _texture_id++;
		this.url    = url;
		this.onload = null;
		this.buffer = null;
		this.width  = 0;
		this.height = 0;

		this.__load = true;


		if (url !== null && url.substr(0, 10) !== 'data:image') {

			if (_texture_cache[url] !== undefined) {
				_clone_texture(_texture_cache[url], this);
			} else {
				_texture_cache[url] = this;
			}

		}

	};


	Texture.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.buffer = new Buffer(blob.buffer.substr(22), 'base64');
				this.__load = false;
			}

		},

		serialize: function() {

			var blob = {};


			if (this.buffer !== null) {
				blob.buffer = 'data:image/png;base64,' + this.buffer.toString('base64');
			}


			return {
				'constructor': 'Texture',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

			}


			if (this.url.substr(0, 5) === 'data:') {

				if (this.url.substr(0, 15) === 'data:image/png;') {

					var b64data = this.url.substr(15, this.url.length - 15);
					this.buffer = new Buffer(b64data, 'base64');
					this.__load = false;

					_parse_texture.call(this, this.buffer.slice(16, 24));

				} else {

					if (lychee.debug === true) {
						console.error('bootstrap.js: Texture at "' + this.url.substr(0, 15) + '" is invalid (no PNG file)');
					}

				}


				if (this.onload instanceof Function) {
					this.onload(this.buffer !== null);
					this.onload = null;
				}

			} else {

				if (this.url.split('.').pop() === 'png') {

					_load_asset({
						url:      this.url,
						encoding: 'binary'
					}, function(raw) {

						if (raw !== null) {

							this.buffer = new Buffer(raw, 'binary');
							this.__load = false;

							_parse_texture.call(this, this.buffer.slice(16, 24));

						}


						if (this.onload instanceof Function) {
							this.onload(raw !== null);
							this.onload = null;
						}

					}, this);

				} else {

					if (lychee.debug === true) {
						console.error('bootstrap.js: Texture at "' + this.url + '" is invalid (no PNG file)');
					}


					if (this.onload instanceof Function) {
						this.onload(false);
						this.onload = null;
					}

				}

			}


			var is_power_of_two = (this.width & (this.width - 1)) === 0 && (this.height & (this.height - 1)) === 0;
			if (is_power_of_two === false) {

				if (lychee.debug === true) {
					console.warn('bootstrap.js: Texture at ' + this.url + ' is NOT power-of-two');
				}

			}

		}

	};



	/*
	 * PRELOADER IMPLEMENTATION
	 */

	var _Wildcard = function(url) {

		this.url    = url;
		this.onload = null;
		this.buffer = null;

	};

	_Wildcard.prototype = {

		serialize: function() {

			return {
				'url':    this.url,
				'buffer': this.buffer !== null ? this.buffer.toString() : null
			};

		},

		load: function() {

			if (this.buffer !== null) {
				return;
			}


			var that = this;
			var file = _resolve_url(this.url);

			if (_fs.existsSync(file) === false) {

				this.buffer = null;

				if (this.onload instanceof Function) {
					this.onload(false);
					this.onload = null;
				}

				return;

			}


			var type = this.url.split('/').pop().split('.').pop();
			if (type === 'js') {

				_fs.readFile(file, 'utf8', function(err, raw) {

					if (err) {

						that.buffer = null;

						if (that.onload instanceof Function) {
							that.onload(false);
							that.onload = null;
						}

					} else {

						__filename = that.url;

						if (require.cache[file] !== undefined) {
							delete require.cache[file];
						}

						require(file);

						__filename = null;


						that.buffer = raw.toString();

						if (that.onload instanceof Function) {
							that.onload(true);
							that.onload = null;
						}

					}

				});

			} else if (type === 'css') {

				// CSS files can't fail and can't influence the NodeJS application
				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

			} else {

				_fs.readFile(file, 'utf8', function(err, raw) {

					if (err) {

						that.buffer = null;

						if (that.onload instanceof Function) {
							that.onload(false);
							that.onload = null;
						}

					} else {

						that.buffer = raw.toString();

						if (that.onload instanceof Function) {
							that.onload(true);
							that.onload = null;
						}

					}

				});

			}

		}

	};



	/*
	 * EXPORTS
	 */

	// global.Buffer  = Buffer; // Not necessary, NodeJS data type
	global.Config  = Config;
	global.Font    = Font;
	global.Music   = Music;
	global.Sound   = Sound;
	global.Texture = Texture;

	lychee.Environment.setAssetType('json', Config);
	lychee.Environment.setAssetType('fnt',  Font);
	lychee.Environment.setAssetType('msc',  Music);
	lychee.Environment.setAssetType('snd',  Sound);
	lychee.Environment.setAssetType('png',  Texture);
	lychee.Environment.setAssetType('*',    _Wildcard);



	Object.defineProperty(lychee.Environment, '__FILENAME', {

		get: function() {

			if (__filename !== null) {
				return __filename;
			}

			return null;

		},

		set: function() {
			return false;
		}

	});



	module.exports = function(root) {

		var stream      = process.stdin;
		var is_emitting = stream._emitsKeypress === true;
		if (is_emitting === false) {

			// Note: This fixes issues with running nodejs with nohup
			if (stream.isTTY === true) {

				stream._emitsKeypress = true;

				stream.setEncoding('utf8');
				stream.setRawMode(true);
				stream.resume();

				stream.on('data', function(data) {

					if (this.listeners('keypress').length > 0) {

						var key = _parse_keypress(data);
						if (key !== null) {
							this.emit('keypress', key);
						}

					}

				});

			}

		}


		if (typeof root === 'string') {
			_root = root;
		}


		return lychee;

	};

})(lychee, global);


lychee.define('Input').tags({
	platform: 'nodejs'
}).includes([
	'lychee.event.Emitter'
]).supports(function(lychee, global) {

	if (typeof process !== 'undefined') {

		if (typeof process.stdin === 'object' && typeof process.stdin.on === 'function') {
			return true;
		}

	}


	return false;

}).exports(function(lychee, global) {

	/*
	 * EVENTS
	 */

	var _instances = [];

	var _listeners = {

		keyboard: function(key) {

			// This is apparently a hack to have a TTY conform behaviour
			if (key.ctrl === true && key.name === 'c') {

				process.exit();

			} else {

				for (var i = 0, l = _instances.length; i < l; i++) {
					_process_key.call(_instances[i], key.name, key.ctrl, key.meta, key.shift);
				}

			}

		}

	};



	/*
	 * FEATURE DETECTION
	 */

	(function() {

		process.stdin.on('keypress', _listeners.keyboard);


		if (lychee.debug === true) {
			console.info('lychee.Input: Supported methods are Keyboard');
		}

	})();



	/*
	 * HELPERS
	 */

	// TODO: Modifier support is missing, I have no idea how to work around the TTY behaviour.

	var _process_key = function(key, ctrl, alt, shift) {

		if (this.key === false) return false;


		// 2. Only fire after the enforced delay
		var delta = Date.now() - this.__clock.key;
		if (delta < this.delay) {
			return;
		}


		// 3. Check for current key being a modifier
		if (this.keymodifier === false) {

			if (key === 'ctrl' || key === 'meta' || key === 'shift') {
				return true;
			}

		}


		var name = '';

		if (ctrl  === true) name += 'ctrl-';
		if (alt   === true) name += 'alt-';
		if (shift === true) name += 'shift-';

		name += key.toLowerCase();



		var handled = false;

		if (key !== null) {

			// allow bind('key') and bind('ctrl-a');

			handled = this.trigger('key', [ key, name, delta ]) || handled;
			handled = this.trigger(name,  [ delta ])            || handled;


			if (handled === true) {

				if (lychee.debug === true) {
					this.__history.key.push([ Date.now(), key, name, delta ]);
				}

			}

		}


		this.__clock.key = Date.now();


		return handled;

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.delay       = 0;
		this.key         = false;
		this.keymodifier = false;
		this.touch       = false;
		this.swipe       = false;

		this.__clock  = {
			key:   Date.now(),
			touch: Date.now(),
			swipe: Date.now()
		};
		this.__history = {
			key:   [],
			touch: [],
			swipe: []
		};


		this.setDelay(settings.delay);
		this.setKey(settings.key);
		this.setKeyModifier(settings.keymodifier);
		this.setTouch(settings.touch);
		this.setSwipe(settings.swipe);


		lychee.event.Emitter.call(this);

		_instances.push(this);

		settings = null;

	};


	Class.prototype = {

		destroy: function() {

			var found = false;

			for (var i = 0, il = _instances.length; i < il; i++) {

				if (_instances[i] === this) {
					_instances.splice(i, 1);
					found = true;
					il--;
					i--;
				}

			}

			this.unbind();


			return found;

		},



		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var settings = {};
			var blob     = {};


			if (this.delay !== 0)           settings.delay       = this.delay;
			if (this.key !== false)         settings.key         = this.key;
			if (this.keymodifier !== false) settings.keymodifier = this.keymodifier;
			if (this.touch !== false)       settings.touch       = this.touch;
			if (this.swipe !== false)       settings.swipe       = this.swipe;


			if (this.__history.key.length > 0 || this.__history.touch.length > 0 || this.__history.swipe.length > 0) {

				blob.history = {};

				if (this.__history.key.length > 0) {

					blob.history.key = [];

					for (var k = 0, kl = this.__history.key.length; k < kl; k++) {
						blob.history.key.push(this.__history.key[k]);
					}

				}

				if (this.__history.touch.length > 0) {

					blob.history.touch = [];

					for (var t = 0, tl = this.__history.touch.length; t < tl; t++) {
						blob.history.touch.push(this.__history.touch[t]);
					}

				}

				if (this.__history.swipe.length > 0) {

					blob.history.swipe = [];

					for (var s = 0, sl = this.__history.swipe.length; s < sl; s++) {
						blob.history.swipe.push(this.__history.swipe[s]);
					}

				}

			}


			return {
				'constructor': 'lychee.Input',
				'arguments':   [ settings ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},



		/*
		 * CUSTOM API
		 */

		setDelay: function(delay) {

			delay = typeof delay === 'number' ? delay : null;


			if (delay !== null) {

				this.delay = delay;

				return true;

			}


			return false;

		},

		setKey: function(key) {

			if (key === true || key === false) {

				this.key = key;

				return true;

			}


			return false;

		},

		setKeyModifier: function(keymodifier) {

			if (keymodifier === true || keymodifier === false) {

				this.keymodifier = keymodifier;

				return true;

			}


			return false;

		},

		setTouch: function(touch) {
			return false;
		},

		setSwipe: function(swipe) {
			return false;
		}

	};


	return Class;

});


lychee.define('Renderer').tags({
	platform: 'nodejs'
}).supports(function(lychee, global) {

	if (typeof process !== 'undefined') {

		if (typeof process.stdout === 'object') {
			return true;
		}

	}


	return false;

}).exports(function(lychee, global, attachments) {

	/*
	 * HELPERS
	 */

	var _color_cache = {};

	var _is_color = function(color) {

		if (typeof color === 'string') {

			if (color.match(/(#[AaBbCcDdEeFf0-9]{6})/) || color.match(/(#[AaBbCcDdEeFf0-9]{8})/)) {
				return true;
			}

		}


		return false;

	};

	var _hex_to_rgba = function(hex) {

		if (_color_cache[hex] !== undefined) {
			return _color_cache[hex];
		}

		var rgba = [ 0, 0, 0, 255 ];

		if (typeof hex === 'string') {

			if (hex.length === 7) {

				rgba[0] = parseInt(hex[1] + hex[2], 16);
				rgba[1] = parseInt(hex[3] + hex[4], 16);
				rgba[2] = parseInt(hex[5] + hex[6], 16);
				rgba[3] = 255;

			} else if (hex.length === 9) {

 				rgba[0] = parseInt(hex[1] + hex[2], 16);
				rgba[1] = parseInt(hex[3] + hex[4], 16);
				rgba[2] = parseInt(hex[5] + hex[6], 16);
				rgba[3] = parseInt(hex[7] + hex[8], 16);

			}

		}


		var color = 'rgba(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + (rgba[3] / 255) + ')';

		_color_cache[hex] = color;


		return color;

	};

	var _draw_ctx = function(x, y, value) {

		if (x >= 0 && x < this[0].length && y >= 0 && y < this.length) {
			this[y][x] = value;
		}

	};



	/*
	 * STRUCTS
	 */

	var _buffer = function(width, height) {

		this.width  = typeof width === 'number'  ? width  : 1;
		this.height = typeof height === 'number' ? height : 1;


		this.__ctx = [];


		this.resize();

	};

	_buffer.prototype = {

		clear: function() {

			var ctx    = this.__ctx;
			var width  = this.width;
			var height = this.height;

			for (var y = 0; y < this.height; y++) {

				for (var x = 0; x < this.width; x++) {
					this.__ctx[y][x] = ' ';
				}

			}

		},

		resize: function(width, height) {

			this.__ctx.length = 0;

			// TODO: Remove this
			// this.__ctx = [];


			for (var y = 0; y < this.height; y++) {

				var line = new Array(this.width);
				for (var x = 0; x < this.width; x++) {
					line[x] = ' ';
				}

				this.__ctx.push(line);

			}

		}

	};



	/*
	 * IMPLEMENTATION
	 */

	var _id = 0;


	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.alpha      = 1.0;
		this.background = '#000000';
		this.id         = 'lychee-Renderer-' + _id++;
		this.width      = null;
		this.height     = null;
		this.offset     = { x: 0, y: 0 };


		this.__buffer = this.createBuffer(0, 0);
		this.__ctx    = this.__buffer.__ctx;


		this.setAlpha(settings.alpha);
		this.setBackground(settings.background);
		this.setId(settings.id);
		this.setWidth(settings.width);
		this.setHeight(settings.height);


		settings = null;

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var settings = {};


			if (this.alpha !== 1.0)                           settings.alpha      = this.alpha;
			if (this.background !== '#000000')                settings.background = this.background;
			if (this.id.substr(0, 16) !== 'lychee-Renderer-') settings.id         = this.id;
			if (this.width !== null)                          settings.width      = this.width;
			if (this.height !== null)                         settings.height     = this.height;


			return {
				'constructor': 'lychee.Renderer',
				'arguments':   [ settings ],
				'blob':        null
			};

		},



		/*
		 * SETTERS AND GETTERS
		 */

		setAlpha: function(alpha) {

			alpha = typeof alpha === 'number' ? alpha : null;


			if (alpha !== null) {

				if (alpha >= 0 && alpha <= 1) {
					this.alpha = alpha;
				}

			}

		},

		setBackground: function(color) {

			color = _is_color(color) === true ? color : null;


			if (color !== null) {
				this.background = color;
			}

		},

		setId: function(id) {

			id = typeof id === 'string' ? id : null;


			if (id !== null) {
				this.id = id;
			}

		},

		setWidth: function(width) {

			width = typeof width === 'number' ? width : null;


			if (width !== null) {
				this.width = width;
			} else {
				this.width = process.stdout.columns - 1;
			}


			this.__buffer.width = this.width;
			this.__buffer.resize();

			this.offset.x = 0;

		},

		setHeight: function(height) {

			height = typeof height === 'number' ? height : null;


			if (height !== null) {
				this.height = height;
			} else {
				this.height = process.stdout.rows - 1;
			}


			this.__buffer.height = this.height;
			this.__buffer.resize();

			this.offset.y = 0;

		},



		/*
		 * BUFFER INTEGRATION
		 */

		clear: function(buffer) {

			buffer = buffer instanceof _buffer ? buffer : null;


			if (buffer !== null) {

				buffer.clear();

			} else {

				process.stdout.write('\u001B[2J\u001B[0;0f');

				this.__buffer.clear();

			}

		},

		flush: function() {

			var ctx = this.__ctx;

			var line = ctx[0];
			var info = this.width + 'x' + this.height;

			for (var i = 0; i < info.length; i++) {
				line[i] = info[i];
			}


			for (var y = 0; y < this.height; y++) {
				process.stdout.write(ctx[y].join('') + '\n');
			}

		},

		createBuffer: function(width, height) {
			return new _buffer(width, height);
		},

		setBuffer: function(buffer) {

			buffer = buffer instanceof _buffer ? buffer : null;


			if (buffer !== null) {
				this.__ctx = buffer.__ctx;
			} else {
				this.__ctx = this.__buffer.__ctx;
			}

		},



		/*
		 * DRAWING API
		 */

		drawArc: function(x, y, start, end, radius, color, background, lineWidth) {

			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;
			var pi2 = Math.PI * 2;


			// TODO: Implement arc-drawing ASCII art algorithm

		},

		drawBox: function(x1, y1, x2, y2, color, background, lineWidth) {

			if (this.alpha < 0.5) return;

			x1 = x1 | 0;
			y1 = y1 | 0;
			x2 = x2 | 0;
			y2 = y2 | 0;

			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;
			var x = 0;
			var y = 0;


			if (background === true) {

				for (x = x1 + 1; x < x2; x++) {

					for (y = y1 + 1; y < y2; y++) {
						_draw_ctx.call(ctx, x, y, '+');
					}

				}

			}


			// top - right - bottom - left

			y = y1;
			for (x = x1 + 1; x < x2; x++) _draw_ctx.call(ctx, x, y, '-');

			x = x2;
			for (y = y1 + 1; y < y2; y++) _draw_ctx.call(ctx, x, y, '|');

			y = y2;
			for (x = x1 + 1; x < x2; x++) _draw_ctx.call(ctx, x, y, '-');

			x = x1;
			for (y = y1 + 1; y < y2; y++) _draw_ctx.call(ctx, x, y, '|');

		},

		drawBuffer: function(x1, y1, buffer) {

			buffer = buffer instanceof _buffer ? buffer : null;


			if (buffer !== null) {

				var ctx = this.__ctx;


				var x2 = Math.min(x1 + buffer.width,  this.__buffer.width);
				var y2 = Math.min(y1 + buffer.height, this.__buffer.height);


				for (var y = y1; y < y2; y++) {

					for (var x = x1; x < x2; x++) {
						this.__ctx[y][x] = buffer.__ctx[y - y1][x - x1];
					}

				}


				if (lychee.debug === true) {

					this.drawBox(
						x1,
						y1,
						x1 + buffer.width,
						y1 + buffer.height,
						'#00ff00',
						false,
						1
					);

				}

			}

		},

		drawCircle: function(x, y, radius, color, background, lineWidth) {

			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			// TODO: Implement circle-drawing ASCII art algorithm

		},

		drawLight: function(x, y, radius, color, background, lineWidth) {

			color      = _is_color(color) ? _hex_to_rgba(color) : 'rgba(255,255,255,1.0)';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			// TODO: Implement light-drawing ASCII art algorithm

		},

		drawLine: function(x1, y1, x2, y2, color, lineWidth) {

			color     = _is_color(color) === true ? color : '#000000';
			lineWidth = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			// TODO: Implement line-drawing ASCII art algorithm

		},

		drawTriangle: function(x1, y1, x2, y2, x3, y3, color, background, lineWidth) {

			color      = _is_color(color) === true ? color : '#000000';
			background = background === true;
			lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


			var ctx = this.__ctx;


			// TODO: Implement triangle-drawing ASCII art algorithm

		},

		// points, x1, y1, [ ... x(a), y(a) ... ], [ color, background, lineWidth ]
		drawPolygon: function(points, x1, y1) {

			var l = arguments.length;

			if (points > 3) {

				var optargs = l - (points * 2) - 1;


				var color, background, lineWidth;

				if (optargs === 3) {

					color      = arguments[l - 3];
					background = arguments[l - 2];
					lineWidth  = arguments[l - 1];

				} else if (optargs === 2) {

					color      = arguments[l - 2];
					background = arguments[l - 1];

				} else if (optargs === 1) {

					color      = arguments[l - 1];

				}


				color      = _is_color(color) === true ? color : '#000000';
				background = background === true;
				lineWidth  = typeof lineWidth === 'number' ? lineWidth : 1;


				var ctx = this.__ctx;


				// TODO: Implement polygon-drawing ASCII art algorithm

			}

		},

		drawSprite: function(x1, y1, texture, map) {

			texture = texture instanceof Texture ? texture : null;
			map     = map instanceof Object      ? map     : null;


			if (texture !== null) {

				if (map === null) {

				} else {

					if (lychee.debug === true) {

						this.drawBox(
							x1,
							y1,
							x1 + map.w,
							y1 + map.h,
							'#ff0000',
							false,
							1
						);

					}

				}

			}

		},

		drawText: function(x1, y1, text, font, center) {

			font   = font instanceof Font ? font : null;
			center = center === true;


			if (font !== null) {

				if (center === true) {

					var dim = font.measure(text);

					x1 -= dim.realwidth / 2;
					y1 -= (dim.realheight - font.baseline) / 2;

				}


				y1 -= font.baseline / 2;


				x1 = x1 | 0;
				y1 = y1 | 0;


				var ctx = this.__ctx;
				var margin  = 0;
				var texture = font.texture;
				if (texture !== null) {

					for (t = 0, l = text.length; t < l; t++) {

						var chr = font.measure(text[t]);

						var x = x1 + margin - font.spacing;
						var y = y1;


						_draw_ctx.call(ctx, x, y, text[t]);


						margin += chr.realwidth + font.kerning;

					}

				}

			}

		},



		/*
		 * RENDERING API
		 */

		renderEntity: function(entity, offsetX, offsetY) {

			if (typeof entity.render === 'function') {

				entity.render(
					this,
					offsetX || 0,
					offsetY || 0
				);

			}

		}

	};


	return Class;

});


lychee.define('Storage').tags({
	platform: 'nodejs'
}).includes([
	'lychee.event.Emitter'
]).supports(function(lychee, global) {

	var fs = require('fs');
	if (typeof fs.readFileSync === 'function' && typeof fs.writeFileSync === 'function') {
		return true;
	}

	return false;

}).exports(function(lychee, global) {

	/*
	 * EVENTS
	 */

	var _persistent = {};
	var _temporary  = {};



	/*
	 * FEATURE DETECTION
	 */

	var _read_persistent  = function() { return false; };
	var _write_persistent = function() { return false; };

	(function() {

		var _fs   = require('fs');
		var _path = require('path');


		var read = 'readFileSync' in _fs;
		if (read === true) {

			_read_persistent = function() {

				var url = _path.normalize(process.cwd() + '/lychee.store');


				var raw = null;
				try {
					raw = _fs.readFileSync(url, 'utf8');
				} catch(e) {
					raw = null;
				}


				var buffer = null;
				try {
					buffer = JSON.parse(raw);
				} catch(e) {
					buffer = null;
				}


				if (buffer !== null) {

					// TODO: Evaluate if asynchronous update of deep hierarchies makes sense

					for (var id in buffer) {
						_persistent[id] = buffer[id];
					}


					return true;

				}


				return false;

			};

		}


		var write = 'writeFileSync' in _fs;
		if (write === true) {

			_write_persistent = function() {

				var buffer = JSON.stringify(_persistent, null, '\t');
				var url    = _path.normalize(process.cwd() + '/lychee.store');


				var result = false;
				try {
					result = _fs.writeFileSync(url, buffer, 'utf8');
				} catch(e) {
					result = false;
				}


				return result;

			};

		}


		if (lychee.debug === true) {

			var methods = [];

			if (read && write) methods.push('Persistent');
			if (_temporary)    methods.push('Temporary');

			if (methods.length === 0) {
				console.error('lychee.Storage: Supported methods are NONE');
			} else {
				console.info('lychee.Storage: Supported methods are ' + methods.join(', '));
			}

		}


		_read_persistent();

	})();



	/*
	 * HELPERS
	 */

	var _read_storage = function() {

		var id   = this.id;
		var blob = null;


		var type = this.type;
		if (type === Class.TYPE.persistent) {
			blob = _persistent[id] || null;
		} else if (type === Class.TYPE.temporary) {
			blob = _temporary[id]  || null;
		}


		if (blob !== null) {

			if (this.model === null) {

				if (blob['@model'] instanceof Object) {
					this.model = blob['@model'];
				}

			}


			var document = this.__document;
			if (document.index === 0) {

				if (blob['@document'] instanceof Object) {
					this.__document = blob['@document'];
				}

			}


			var objects = this.__objects;
			if (objects.length === 0 || objects.length !== blob['@objects'].length) {

				if (blob['@objects'] instanceof Array) {

					objects = blob['@objects'];
					this.__objects = [];

					for (var o = 0, ol = objects.length; o < ol; o++) {
						this.__objects.push(objects[o]);
					}

					this.trigger('sync', [ this.__objects ]);


					return true;

				}

			}

		}


		return false;

	};

	var _write_storage = function() {

		var operations = this.__operations;
		if (operations.length !== 0) {

			while (operations.length > 0) {

				var operation = operations.shift();
				if (operation.type === 'insert') {

					this.__document.index++;
					this.__objects.push(operation.object);
					this.trigger('insert', [ operation.index, operation.object ]);

				} else if (operation.type === 'update') {

					if (this.__objects[operation.index] !== operation.object) {
						this.__objects[operation.index] = operation.object;
						this.trigger('update', [ operation.index, operation.object ]);
					}

				} else if (operation.type === 'remove') {

					this.__document.index--;
					this.__objects.splice(operation.index, 1);
					this.trigger('remove', [ operation.index, operation.object ]);

				}

			}


			this.__document.time = Date.now();


			var id   = this.id;
			var blob = {
				'@document': this.__document,
				'@model':    this.model,
				'@objects':  this.__objects
			};


			var type = this.type;
			if (type === Class.TYPE.persistent) {

				_persistent[id] = blob;
				_write_persistent();

			} else if (type === Class.TYPE.temporary) {

				_temporary[id] = blob;

			}


			this.trigger('sync', [ this.__objects ]);

		}

	};



	/*
	 * IMPLEMENTATION
	 */

	var _id = 0;

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.id    = 'lychee-Storage-' + _id++;
		this.model = {};
		this.type  = Class.TYPE.persistent;

		this.__document   = { index: 0, time: Date.now() };
		this.__objects    = [];
		this.__operations = [];


		this.setId(settings.id);
		this.setModel(settings.model);
		this.setType(settings.type);


		lychee.event.Emitter.call(this);

		settings = null;



		/*
		 * INITIALIZATION
		 */

		_read_storage.call(this);

	};


	Class.TYPE = {
		persistent: 0,
		temporary:  1
	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		sync: function(force) {

			force = force === true;


			var result = _read_storage.call(this);
			if (result === true) {

				return true;

			} else {

				if (force === true) {

					this.trigger('sync', [ this.__objects ]);

					return true;

				}

			}


			return false;

		},

		deserialize: function(blob) {

			if (blob.document instanceof Object) {
				this.__document.index = blob.document.index;
				this.__document.time  = blob.document.time;
			}

			if (blob.objects instanceof Array) {

				this.__objects = [];

				for (var o = 0, ol = blob.objects.length; o < ol; o++) {

					var object = blob.objects[o];
					if (lychee.interfaceof(this.model, object)) {
						this.__objects.push(object);
					}

				}

			}

		},

		serialize: function() {

			var settings = {};
			var blob     = {};


			if (this.id.substr(0, 15) !== 'lychee-Storage-') settings.id    = this.id;
			if (Object.keys(this.model).length !== 0)        settings.model = this.model;
			if (this.type !== Class.TYPE.persistent)         settings.type  = this.type;


			if (this.__document.index > 0) {

				blob.document = {};
				blob.document.index = this.__document.index;
				blob.document.time  = this.__document.time;

			}

			if (this.__objects.length > 0) {

				blob.objects = {};

				for (var o = 0, ol = this.__objects.length; o < ol; o++) {

					var object = this.__objects[o];
					if (object instanceof Object) {
						blob.objects.push(JSON.parse(JSON.stringify(object)));
					}

				}

			}


			return {
				'constructor': 'lychee.Storage',
				'arguments':   [ settings ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},



		/*
		 * CUSTOM API
		 */

		create: function() {
			return lychee.extendunlink({}, this.model);
		},

		filter: function(callback, scope) {

			callback = callback instanceof Function ? callback : null;
			scope    = scope !== undefined          ? scope    : this;


			var filtered = [];

			for (var o = 0, ol = this.__objects.length; o < ol; o++) {

				var object = this.__objects[o];
				if (callback !== null) {

					if (callback.call(scope, o, object) === true) {
						filtered.push(object);
					}

				} else {
					filtered.push(object);
				}

			}


			return filtered;

		},

		insert: function(object) {

			// This uses the diff method, because properties can be null
			object = lychee.diff(this.model, object) === false ? object : null;


			if (object !== null) {

				var index = this.__objects.indexOf(object);
				if (index === -1) {

					this.__operations.push({
						type:   'insert',
						index:  this.__objects.length,
						object: object
					});


					_write_storage.call(this);

					return true;

				}

			}


			return false;

		},

		update: function(object) {

			// This uses the diff method, because properties can be null
			object = lychee.diff(this.model, object) === false ? object : null;


			if (object !== null) {

				var index = this.__objects.indexOf(object);
				if (index !== -1) {

					this.__operations.push({
						type:   'update',
						index:  index,
						object: object
					});


					_write_storage.call(this);

					return true;

				}

			}


			return false;

		},

		get: function(index) {

			index = typeof index === 'number' ? (index | 0) : null;


			if (index !== null) {

				var object = this.__objects[index] || null;
				if (object !== null) {
					return object;
				}

			}


			return null;

		},

		remove: function(index, object) {

			index = typeof index === 'number' ? (index | 0) : this.__objects.indexOf(object);


			if (index >= 0 && index < this.__objects.length) {

				this.__operations.push({
					type:   'remove',
					index:  index,
					object: this.__objects[index]
				});


				_write_storage.call(this);

				return true;

			}


			return false;

		},

		setId: function(id) {

			id = typeof id === 'string' ? id : null;


			if (id !== null) {

				this.id = id;

				return true;

			}


			return false;

		},

		setModel: function(model) {

			model = model instanceof Object ? model : null;


			if (model !== null) {

				this.model = JSON.parse(JSON.stringify(model));

				return true;

			}


			return false;

		},

		setType: function(type) {

			if (lychee.enumof(Class.TYPE, type)) {

				this.type = type;

				return true;

			}


			return false;

		}

	};


	return Class;

});


lychee.define('Viewport').tags({
	platform: 'nodejs'
}).includes([
	'lychee.event.Emitter'
]).supports(function(lychee, global) {

	if (typeof process !== 'undefined') {

		if (typeof process.stdout === 'object' && typeof process.stdout.on === 'function') {
			return true;
		}

	}

	return false;

}).exports(function(lychee, global) {

	/*
	 * EVENTS
	 */

	var _instances = [];

	var _listeners = {

		resize: function() {

			for (var i = 0, l = _instances.length; i < l; i++) {
				_process_reshape.call(_instances[i], process.stdout.columns, process.stdout.rows);
			}

		}

	};



	/*
	 * FEATURE DETECTION
	 */

	(function() {

		var resize = true;
		if (resize === true) {
			process.stdout.on('resize', _listeners.resize);
		}


		if (lychee.debug === true) {

			var methods = [];

			if (resize) methods.push('Resize');

			if (methods.length === 0) {
				console.error('lychee.Viewport: Supported methods are NONE');
			} else {
				console.info('lychee.Viewport: Supported methods are ' + methods.join(', '));
			}

		}

	})();



	/*
	 * HELPERS
	 */

	var _process_reshape = function(width, height) {

		if (width === this.width && height === this.height) {
			return false;
		}


		this.width  = width;
		this.height = height;



		var orientation = null;
		var rotation    = null;

		if (width > height) {

			orientation = 'landscape';
			rotation    = 'landscape';

		} else {

			orientation = 'landscape';
			rotation    = 'landscape';

		}



		var handled = false;

		handled = this.trigger('reshape', [ orientation, rotation ]) || handled;


		if (handled === true) {

			if (lychee.debug === true) {
				this.__history.reshape.push([ Date.now(), orientation, rotation ]);
			}

		}


		return handled;

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.fullscreen = false;
		this.width      = process.stdout.columns;
		this.height     = process.stdout.rows;

		this.__orientation = 0; // Unsupported
		this.__history     = {
			show:    [],
			hide:    [],
			reshape: []
		};


		lychee.event.Emitter.call(this);

		_instances.push(this);


		this.setFullscreen(settings.fullscreen);

		settings = null;

	};


	Class.prototype = {

		destroy: function() {

			var found = false;

			for (var i = 0, il = _instances.length; i < il; i++) {

				if (_instances[i] === this) {
					_instances.splice(i, 1);
					found = true;
					il--;
					i--;
				}

			}

			this.unbind();


			return found;

		},



		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var settings = {};
			var blob     = {};


			if (this.fullscreen !== false) settings.fullscreen = this.fullscreen;


			if (this.__history.show.length > 0 || this.__history.hide.length > 0 || this.__history.reshape.length > 0) {

				blob.history = {};

				if (this.__history.show.length > 0) {

					blob.history.show = [];

					for (var s = 0, sl = this.__history.show.length; s < sl; s++) {
						blob.history.show.push(this.__history.show[s]);
					}

				}

				if (this.__history.hide.length > 0) {

					blob.history.hide = [];

					for (var h = 0, hl = this.__history.hide.length; h < hl; h++) {
						blob.history.hide.push(this.__history.hide[h]);
					}

				}

				if (this.__history.reshape.length > 0) {

					blob.history.reshape = [];

					for (var r = 0, rl = this.__history.reshape.length; r < rl; r++) {
						blob.history.reshape.push(this.__history.reshape[r]);
					}

				}

			}


			return {
				'constructor': 'lychee.Viewport',
				'arguments':   [ settings ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},



		/*
		 * CUSTOM API
		 */

		setFullscreen: function(fullscreen) {
			return false;
		}

	};


	return Class;

});

