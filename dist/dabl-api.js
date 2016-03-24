dabl = typeof dabl === "undefined" ? {} : dabl;

dabl.sPad = function(value) {
	value = value + '';
	return value.length === 2 ? value : '0' + value;
};

dabl.copy = function(obj) {
	if (obj === null) {
		return null;
	}

	if (obj instanceof Model) {
		return obj.constructor(obj);
	}

	if (obj instanceof Array) {
		return obj.slice(0);
	}

	if (obj instanceof Date) {
		return new Date(obj.getTime());
	}

	switch (typeof obj) {
		case 'string':
		case 'boolean':
		case 'number':
		case 'undefined':
		case 'function':
			return obj;
	}

	var target = {};
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			target[i] = obj[i];
		}
	}
	return target;
};

dabl.equals = function(a, b, type) {
	if (type && type === Model.FIELD_TYPE_DATE) {
		a = dabl.formatDate(a);
		b = dabl.formatDate(b);
	} else if (type && type === Model.FIELD_TYPE_TIMESTAMP) {
		a = dabl.constructDate(a);
		b = dabl.constructDate(b);
	}

	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}

	if (type && type === JSON) {
		if (typeof a !== 'string') {
			a = JSON.stringify(a);
		}
		if (typeof b !== 'string') {
			b = JSON.stringify(b);
		}
	} else if (typeof a === 'object') {
		return JSON.stringify(a) === JSON.stringify(b);
	}
	return a === b;
};

dabl.formatDate = function(value) {
	if (!(value instanceof Date)) {
		value = dabl.constructDate(value);
	}
	if (!value) {
		return null;
	}
	return value.getUTCFullYear() + '-' + dabl.sPad(value.getUTCMonth() + 1) + '-' + dabl.sPad(value.getUTCDate());
};

dabl.constructDate = function(value) {
	if (value === false || value === '' || typeof value === 'undefined') {
		return null;
	}

	if (value instanceof Date) {
		return value;
	}

	var date = new Date(value);
	if (isNaN(date.getTime())) {
		throw new Error(value + ' is not a valid date');
	}
	return date;
};

dabl.serialize = function(obj, prefix) {
	//Method from http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
	var str = [];
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
			str.push(typeof v === 'object' ?
				dabl.serialize(v, k) :
				encodeURIComponent(k) + '=' + encodeURIComponent(v));
		}
	}
	return str.join('&');
};
if (typeof jQuery !== 'undefined' && jQuery.Deferred) {
	dabl.Deferred = jQuery.Deferred;
} else {
// https://github.com/warpdesign/Standalone-Deferred

function isArray(arr) {
	return Object.prototype.toString.call(arr) === '[object Array]';
}

function foreach(arr, handler) {
	if (isArray(arr)) {
		for (var i = 0; i < arr.length; i++) {
			handler(arr[i]);
		}
	}
	else
		handler(arr);
}

function D(fn) {
	var status = 'pending',
		doneFuncs = [],
		failFuncs = [],
		progressFuncs = [],
		resultArgs = null,

	promise = {
		done: function() {
			for (var i = 0; i < arguments.length; i++) {
				// skip any undefined or null arguments
				if (!arguments[i]) {
					continue;
				}

				if (isArray(arguments[i])) {
					var arr = arguments[i];
					for (var j = 0; j < arr.length; j++) {
						// immediately call the function if the deferred has been resolved
						if (status === 'resolved') {
							arr[j].apply(this, resultArgs);
						}

						doneFuncs.push(arr[j]);
					}
				}
				else {
					// immediately call the function if the deferred has been resolved
					if (status === 'resolved') {
						arguments[i].apply(this, resultArgs);
					}

					doneFuncs.push(arguments[i]);
				}
			}

			return this;
		},

		fail: function() {
			for (var i = 0; i < arguments.length; i++) {
				// skip any undefined or null arguments
				if (!arguments[i]) {
					continue;
				}

				if (isArray(arguments[i])) {
					var arr = arguments[i];
					for (var j = 0; j < arr.length; j++) {
						// immediately call the function if the deferred has been resolved
						if (status === 'rejected') {
							arr[j].apply(this, resultArgs);
						}

						failFuncs.push(arr[j]);
					}
				}
				else {
					// immediately call the function if the deferred has been resolved
					if (status === 'rejected') {
						arguments[i].apply(this, resultArgs);
					}

					failFuncs.push(arguments[i]);
				}
			}

			return this;
		},

		always: function() {
			return this.done.apply(this, arguments).fail.apply(this, arguments);
		},

		progress: function() {
			for (var i = 0; i < arguments.length; i++) {
				// skip any undefined or null arguments
				if (!arguments[i]) {
					continue;
				}

				if (isArray(arguments[i])) {
					var arr = arguments[i];
					for (var j = 0; j < arr.length; j++) {
						// immediately call the function if the deferred has been resolved
						if (status === 'pending') {
							progressFuncs.push(arr[j]);
						}
					}
				}
				else {
					// immediately call the function if the deferred has been resolved
					if (status === 'pending') {
						progressFuncs.push(arguments[i]);
					}
				}
			}

			return this;
		},

		then: function() {
			// fail callbacks
			if (arguments.length > 1 && arguments[1]) {
				this.fail(arguments[1]);
			}

			// done callbacks
			if (arguments.length > 0 && arguments[0]) {
				this.done(arguments[0]);
			}

			// notify callbacks
			if (arguments.length > 2 && arguments[2]) {
				this.progress(arguments[2]);
			}
			return this;
		},

		promise: function(obj) {
			if (obj == null) {
				return promise;
			} else {
				for (var i in promise) {
					obj[i] = promise[i];
				}
				return obj;
			}
		},

		state: function() {
			return status;
		},

		debug: function() {
			console.log('[debug]', doneFuncs, failFuncs, status);
		},

		isRejected: function() {
			return status === 'rejected';
		},

		isResolved: function() {
			return status === 'resolved';
		},

		pipe: function(done, fail, progress) {
			return D(function(def) {
				foreach(done, function(func) {
					// filter function
					if (typeof func === 'function') {
						deferred.done(function() {
							var returnval = func.apply(this, arguments);
							// if a new deferred/promise is returned, its state is passed to the current deferred/promise
							if (returnval && typeof returnval === 'function') {
								returnval.promise().then(def.resolve, def.reject, def.notify);
							}
							else {	// if new return val is passed, it is passed to the piped done
								def.resolve(returnval);
							}
						});
					}
					else {
						deferred.done(def.resolve);
					}
				});

				foreach(fail, function(func) {
					if (typeof func === 'function') {
						deferred.fail(function() {
							var returnval = func.apply(this, arguments);

							if (returnval && typeof returnval === 'function') {
								returnval.promise().then(def.resolve, def.reject, def.notify);
							} else {
								def.reject(returnval);
							}
						});
					}
					else {
						deferred.fail(def.reject);
					}
				});
			}).promise();
		}
	},

	deferred = {
		resolveWith: function(context) {
			if (status === 'pending') {
				status = 'resolved';
				var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
				for (var i = 0; i < doneFuncs.length; i++) {
					doneFuncs[i].apply(context, args);
				}
			}
			return this;
		},

		rejectWith: function(context) {
			if (status === 'pending') {
				status = 'rejected';
				var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
				for (var i = 0; i < failFuncs.length; i++) {
					failFuncs[i].apply(context, args);
				}
			}
			return this;
		},

		notifyWith: function(context) {
			if (status === 'pending') {
				var args = resultArgs = (arguments.length > 1) ? arguments[1] : [];
				for (var i = 0; i < progressFuncs.length; i++) {
					progressFuncs[i].apply(context, args);
				}
			}
			return this;
		},

		resolve: function() {
			return this.resolveWith(this, arguments);
		},

		reject: function() {
			return this.rejectWith(this, arguments);
		},

		notify: function() {
			return this.notifyWith(this, arguments);
		}
	};

	var obj = promise.promise(deferred);

	if (fn) {
		fn.apply(obj, [obj]);
	}

	return obj;
}

D.when = function() {
	if (arguments.length < 2) {
		var obj = arguments.length ? arguments[0] : undefined;
		if (obj && (typeof obj.isResolved === 'function' && typeof obj.isRejected === 'function')) {
			return obj.promise();
		}
		else {
			return D().resolve(obj).promise();
		}
	}
	else {
		return (function(args){
			var df = D(),
				size = args.length,
				done = 0,
				rp = new Array(size);	// resolve params: params of each resolve, we need to track down them to be able to pass them in the correct order if the master needs to be resolved

			for (var i = 0; i < args.length; i++) {
				(function(j) {
					args[j].done(function() { rp[j] = (arguments.length < 2) ? arguments[0] : arguments; if (++done === size) { df.resolve.apply(df, rp); }})
					.fail(function() { df.reject(arguments); });
				})(i);
			}

			return df.promise();
		})(arguments);
	}
};

dabl.Deferred = D;
}
/**
 * Simple JavaScript Inheritance
 * Initially by John Resig http://ejohn.org/
 * MIT Licensed.
 */

var initializing = false, fnTest = /xyz/.test(function(){
	var xyz;
}) ? /\b_super\b/ : /.*/;

function extend(newProps, target, src) {
	var name;

	// Copy the properties over onto the new prototype
	for (name in newProps) {
		// Check if we're overwriting an existing function
		target[name] = typeof newProps[name] === 'function' &&
		typeof src[name] === 'function' && fnTest.test(newProps[name]) ?
		(function(name, fn){
			return function() {
				var tmp = this._super,
					ret;

				// Add a new ._super() method that is the same method
				// but on the super-class
				this._super = src[name];

				// The method only need to be bound temporarily, so we
				// remove it when we're done executing
				ret = fn.apply(this, arguments);
				this._super = tmp;

				return ret;
			};
		})(name, newProps[name]) : newProps[name];
	}
}

// The base Class implementation (does nothing)
var Class = function(){};

function doesDefinePropertyWork(object) {
	try {
		Object.defineProperty(object, "sentinel", {
			value: 'foo'
		});
		return "sentinel" in object;
	} catch (exception) {
		return false;
	}
}

Class.canDefineProperties = doesDefinePropertyWork({});

// Create a new Class that inherits from this class
Class.extend = function(instanceProps, classProps) {
	if (typeof instanceProps === 'undefined') {
		instanceProps = {};
	}
	if (typeof classProps === 'undefined') {
		classProps = {};
	}

	var prototype,
		name;

	// Instantiate a base class (but only create the instance,
	// don't run the init constructor)
	initializing = true;
	prototype = new this();
	initializing = false;

	// The dummy class constructor
	function Class() {
		// All construction is actually done in the init method
		if (!initializing && this.init) {
			this.init.apply(this, arguments);
		}
	}

	for (name in this) {
		if (!(name in classProps) && this.hasOwnProperty(name)) {
			Class[name] = this[name];
		}
	}

	extend(instanceProps, prototype, this.prototype);
	extend(classProps, Class, this);

	// Populate our constructed prototype object
	Class.prototype = prototype;

	// Enforce the constructor to be what we expect
	Class.prototype.constructor = Class;

	return Class;
};

/**
 * Normalizes the return value of async and non-async functions to always use the
 * Deferred/Promise API
 * @param {function} func A method that can return a Promise or a normal return value
 * @param {function} success Success callback
 * @param {function} failure callback
 */
Class.callAsync = Class.prototype.callAsync = function callAsync(func, success, failure) {
	var deferred = dabl.Deferred(),
		promise = deferred.promise();

	try {
		var result = func.call(this);
		if (result && typeof result.then === 'function') {
			promise = result;
		} else {
			deferred.resolve(result);
		}
	} catch (e) {
		deferred.reject(e);
	}

	if (typeof success === 'function' || typeof failure === 'function') {
		promise.then(success, failure);
	}

	return promise;
};

dabl.Class = Class;
var Model = dabl.Class.extend({

	/**
	 * Object containing names of modified fields
	 */
	_oldValues: null,

	/**
	 * Whether or not this is a new object
	 */
	_isNew: true,

	/**
	 * Errors from the validate() step of saving
	 */
	_validationErrors: null,

	/**
	 * @param {Object} values
	 */
	init : function Model(values) {
		this._validationErrors = [];
		var defaults = {},
			model = this.constructor;
		for (var fieldName in model._fields) {
			var field = model._fields[fieldName];
			if (typeof field.value !== 'undefined') {
				defaults[fieldName] = dabl.copy(field.value);
			} else if (field.type === Array) {
				defaults[fieldName] = [];
			} else {
				defaults[fieldName] = null;
			}
		}
		this.fromJSON(defaults);
		this.resetModified();
		if (values) {
			this.fromJSON(values);
		}
	},

	toString: function() {
		return this.constructor._table + ':' + JSON.stringify(this.toJSON());
	},

	/**
	 * Creates new instance of self and with the same values as this, except
	 * the primary key value is cleared
	 * @return {Model}
	 */
	copy: function() {
		var model = this.constructor,
			newObject = new model(this),
			pk = model.getKey();

		if (pk) {
			newObject[pk] = null;
		}
		return newObject;
	},

	/**
	 * If field is provided, checks whether that field has been modified
	 * If no field is provided, checks whether any of the fields have been modified from the database values.
	 *
	 * @param {String} fieldName Optional
	 * @return bool
	 */
	isModified: function(fieldName) {
		if (fieldName) {
			var type = this.constructor.getFieldType(fieldName);
			return !dabl.equals(this[fieldName], this._oldValues[fieldName], type);
		}
		for (var fieldName in this.constructor._fields) {
			if (this.isModified(fieldName)) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Returns an array of the names of modified fields
	 * @return {Object}
	 */
	getModified: function() {
		var modified = {};
		for (var fieldName in this.constructor._fields) {
			if (this.isModified(fieldName)) {
				modified[fieldName] = true;
			}
		}
		return modified;
	},

	/**
	 * Clears the array of modified field names
	 * @return {Model}
	 */
	resetModified: function() {
		this._oldValues = JSON.parse(JSON.stringify(this));
		return this;
	},

	/**
	 * Resets the object to the state it was in before changes were made
	 */
	revert: function() {
		this.fromJSON(this._oldValues);
		this.resetModified();
		return this;
	},

	/**
	 * Populates this with the values of an associative Array.
	 * Array keys must match field names to be used.
	 * @param {Object} values
	 * @return {Model}
	 */
	fromJSON: function(values) {
		var model = this.constructor;
		for (var fieldName in model._fields) {
			if (!(fieldName in values)) {
				continue;
			}
			this[fieldName] = values[fieldName];
		}
		model.coerceValues(this);
		return this;
	},

	/**
	 * Returns an associative Array with the values of this.
	 * Array keys match field names.
	 * @return {Object}
	 */
	toJSON: function() {
		var values = {},
			fieldName,
			value,
			model = this.constructor,
			fields = model._fields,
			type;

		// avoid infinite loops
		if (this._inToJSON) {
			return null;
		}
		this._inToJSON = true;

		model.coerceValues(this);

		for (fieldName in fields) {
			value = this[fieldName];
			type = fields[fieldName].type;
			if (value instanceof Array) {
				var newValue = [];
				for (var x = 0, l = value.length; x < l; ++x) {
					if (value[x] !== null && typeof value[x].toJSON === 'function') {
						newValue[x] = value[x].toJSON();
					} else {
						newValue[x] = dabl.copy(value[x]);
					}
				}
				value = newValue;
			} else if (type === JSON) {
				value = JSON.stringify(value);
			} else if (type === Model.FIELD_TYPE_DATE) {
				value = dabl.formatDate(value);
			} else if (value !== null && typeof value.toJSON === 'function') {
				value = value.toJSON();
			} else {
				value = dabl.copy(value);
			}
			values[fieldName] = value;
		}

		delete this._inToJSON;

		return values;
	},

	/**
	 * Returns true if this table has primary keys and if all of the key values are not null
	 * @return {Boolean}
	 */
	hasKeyValues: function() {
		var model = this.constructor,
			pks = model._keys;
		if (pks.length === 0) {
			return false;
		}

		model.coerceValues(this);
		for (var x = 0, len = pks.length; x < len; ++x) {
			var pk = pks[x];
			if (this[pk] === null) {
				return false;
			}
		}
		return true;
	},

	/**
	 * Returns an object of key values, indexed by field name.
	 *
	 * @return {Object}
	 */
	getKeyValues: function() {
		var values = {},
			model = this.constructor,
			pks = model._keys;

		model.coerceValues(this);
		for (var x = 0, len = pks.length; x < len; ++x) {
			var pk = pks[x];
			values[pk] = this[pk];
		}
		return values;
	},

	/**
	 * Returns true if this has not yet been saved to the database
	 * @return {Boolean}
	 */
	isNew: function() {
		return this._isNew;
	},

	/**
	 * Indicate whether this object has been saved to the database
	 * @param {Boolean} bool
	 * @return {Model}
	 */
	setNew: function (bool) {
		this._isNew = (bool === true);
		return this;
	},

	/**
	 * Returns true if the field values validate.
	 * @return {Boolean}
	 */
	validate: function() {
		this._validationErrors = [];
		var model = this.constructor;

		model.coerceValues(this);
		for (var fieldName in model._fields) {
			var field = model._fields[fieldName];
			if (!field.required) {
				continue;
			}
			var value = this[fieldName];
			if (!value || (value instanceof Array && value.length === 0)) {
				this._validationErrors.push(fieldName + ' is required.');
			}
		}

		return this._validationErrors.length === 0;
	},

	/**
	 * See this.validate()
	 * @return {Array} Array of errors that occured when validating object
	 */
	getValidationErrors: function() {
		return this._validationErrors;
	},

	/**
	 * Saves the values of this using either insert or update
	 * @param {function} success Success callback
	 * @param {function} failure callback
	 * @return {Promise}
	 */
	save: function(success, failure) {
		if (this.isNew()) {
			return this.insert(success, failure);
		} else {
			return this.update(success, failure);
		}
	},

	/**
	 * Stores a new record with that values in this object
	 * @param {function} success Success callback
	 * @param {function} failure callback
	 * @return {Promise}
	 */
	insert: function(success, failure) {
		return this.callAsync(function(){
			var model = this.constructor;

			if (!this.validate()) {
				throw new Error('Cannot save ' + model._table + ' with validation errors:\n' + this.getValidationErrors().join('\n'));
			}

			if (this.isNew() && model.hasField('created') && !this.isModified('created')) {
				this.created = new Date();
			}
			if (
				(this.isNew() || this.isModified())
				&& model.hasField('updated')
				&& !this.isModified('updated')
			) {
				this.updated = new Date();
			}

			return this.constructor._adapter.insert(this);
		}, success, failure);
	},

	/**
	 * Updates the stored record representing this object.
	 * @param {Object} values
	 * @param {function} success Success callback
	 * @param {function} failure callback
	 * @return {Promise}
	 */
	update: function(values, success, failure) {
		if (typeof values === 'function') {
			success = values;
			failure = success;
		}

		return this.callAsync(function(){
			var model = this.constructor;

			if (!this.validate()) {
				throw new Error('Cannot save ' + model._table + ' with validation errors:\n' + this.getValidationErrors().join('\n'));
			}

			if (model._keys.length === 0) {
				throw new Error('Cannot update without primary keys');
			}

			if (this.isNew() && model.hasField('created') && !this.isModified('created')) {
				this.created = new Date();
			}
			if (
				(this.isNew() || this.isModified())
				&& model.hasField('updated')
				&& !this.isModified('updated')
			) {
				this.updated = new Date();
			}

			if (typeof values === 'object') {
				this.fromJSON(values);
			}

			return model._adapter.update(this);
		}, success, failure);
	},

	/**
	 * Deletes any records with a primary key(s) that match this
	 * NOTE/BUG: If you alter pre-existing primary key(s) before deleting, then you will be
	 * deleting based on the new primary key(s) and not the originals,
	 * leaving the original row unchanged(if it exists).  Also, since NULL isn't an accurate way
	 * to look up a row, I return if one of the primary keys is null.
	 * @param {function} success Success callback
	 * @param {function} failure callback
	 * @return {Promise}
	 */
	remove: function(success, failure) {
		return this.callAsync(function(){
			return this.constructor._adapter.remove(this);
		}, success, failure);
	}

});

Model.models = {};

Model._fields = Model._keys = Model._table = null;

Model._autoIncrement = false;

Model.FIELD_TYPE_TEXT = 'TEXT';
Model.FIELD_TYPE_NUMERIC = 'NUMERIC';
Model.FIELD_TYPE_INTEGER = 'INTEGER';
Model.FIELD_TYPE_DATE = 'DATE';
Model.FIELD_TYPE_TIME = 'TIME';
Model.FIELD_TYPE_TIMESTAMP = 'TIMESTAMP';

Model.FIELD_TYPES = {
	TEXT: Model.FIELD_TYPE_TEXT,
	NUMERIC: Model.FIELD_TYPE_NUMERIC,
	INTEGER: Model.FIELD_TYPE_INTEGER,
	DATE: Model.FIELD_TYPE_DATE,
	TIME: Model.FIELD_TYPE_TIME,
	TIMESTAMP: Model.FIELD_TYPE_TIMESTAMP
};

Model.TEXT_TYPES = {
	TEXT: Model.FIELD_TYPE_TEXT,
	DATE: Model.FIELD_TYPE_DATE,
	TIME: Model.FIELD_TYPE_TIME,
	TIMESTAMP: Model.FIELD_TYPE_TIMESTAMP
};

Model.INTEGER_TYPES = {
	INTEGER: Model.FIELD_TYPE_INTEGER
};

Model.TEMPORAL_TYPES = {
	DATE: Model.FIELD_TYPE_DATE,
	TIME: Model.FIELD_TYPE_TIME,
	TIMESTAMP: Model.FIELD_TYPE_TIMESTAMP
};

Model.NUMERIC_TYPES = {
	INTEGER: Model.FIELD_TYPE_INTEGER,
	NUMERIC: Model.FIELD_TYPE_NUMERIC
};

/**
 * @param {String} type
 * @returns {Boolean}
 */
Model.isFieldType = function(type) {
	return (type in Model.FIELD_TYPES || this.isObjectType(type));
};

/**
 * Whether passed type is a temporal (date/time/timestamp) type.
 * @param {String} type
 * @return {Boolean}
 */
Model.isTemporalType = function(type) {
	return (type in this.TEMPORAL_TYPES);
};

/**
 * Returns true if values for the type need to be quoted.
 * @param {String} type
 * @return {Boolean}
 */
Model.isTextType = function(type) {
	return (type in this.TEXT_TYPES);
};

/**
 * Returns true if values for the type are numeric.
 * @param {String} type
 * @return {Boolean}
 */
Model.isNumericType = function(type) {
	return (type in this.NUMERIC_TYPES);
};

/**
 * Returns true if values for the type are integer.
 * @param {String} type
 * @return {Boolean}
 */
Model.isIntegerType = function(type) {
	return (type in this.INTEGER_TYPES);
};

/**
 * Returns true if values for the type are objects or arrays.
 * @param {String} type
 * @return {Boolean}
 */
Model.isObjectType = function(type) {
	return type === JSON || typeof type === 'function';
};

/**
 * Sets the value of a field
 * @param {mixed} value
 * @param {Object} field
 * @return {mixed}
 */
Model.coerceValue = function(value, field) {
	var fieldType = field.type;

	if (typeof value === 'undefined' || value === null) {
		if (fieldType === Array) {
			value = [];
		} else {
			return null;
		}
	}

	var temporal = this.isTemporalType(fieldType),
		numeric = this.isNumericType(fieldType);

	if (numeric || temporal) {
		if ('' === value) {
			return null;
		}
	}
	if (numeric) {
		if (this.isIntegerType(fieldType)) {
			// validate and cast
			value = parseInt(value, 10);
			if (isNaN(value)) {
				throw new Error(value + ' is not a valid integer');
			}
		} else {
			// validate and cast
			value = parseFloat(value, 10);
			if (isNaN(value)) {
				throw new Error(value + ' is not a valid float');
			}
		}
	} else if (temporal) {
		if (!(value instanceof Date)) {
			value = dabl.constructDate(value);
		}
	} else if (fieldType === Array) {
		if (field.elementType) {
			this.convertArray(value, field.elementType);
			for (var x = 0, l = value.length; x < l; ++x) {
				value[x] = this.coerceValue(value[x], {type: field.elementType});
			}
		}
	} else if (fieldType === JSON) {
		if (typeof value === 'string') {
			value = JSON.parse(value);
		}
	} else if (fieldType === this.FIELD_TYPE_TEXT) {
		if (typeof value !== 'string') {
			value = value + '';
		}
	} else if (
		this.isObjectType(fieldType)
		&& fieldType.isModel
		&& value.constructor !== fieldType
	) {
		value = fieldType.inflate(value);
	}
	return value;
};

Model.coerceValues = function(values) {
	if (null === values || typeof values === 'undefined') {
		return this;
	}
	for (var fieldName in this._fields) {
		if (!(fieldName in values)) {
			continue;
		}
		values[fieldName] = this.coerceValue(values[fieldName], this._fields[fieldName]);
	}
	return this;
};

Model.convertArray = function(array, elementType) {
	if (array.modelCollection) {
		return;
	}

	array.modelCollection = true;

	var model = this;
	array.push = function() {
		return Array.prototype.push.apply(this, model.coerceValue(arguments, {type: Array, elementType: elementType}));
	};
	array.unshift = function() {
		return Array.prototype.unshift.apply(this, model.coerceValue(arguments, {type: Array, elementType: elementType}));
	};
	array.pop = function() {
		return model.coerceValue(Array.prototype.pop.apply(this, arguments), {type: elementType});
	};
	array.shift = function() {
		return model.coerceValue(Array.prototype.shift.apply(this, arguments), {type: elementType});
	};
	array.slice = function() {
		return model.coerceValue(Array.prototype.slice.apply(this, arguments), {type: Array, elementType: elementType});
	};
	array.concat = function() {
		return model.coerceValue(Array.prototype.concat.apply(this, arguments), {type: Array, elementType: elementType});
	};
	array.splice = function() {
		for (var x = 2, l = arguments.length; x < l; ++x) {
			arguments[x] = model.coerceValue(arguments[x], {type: elementType});
		}
		return model.coerceValue(Array.prototype.splice.apply(this, arguments), {type: Array, elementType: elementType});
	};

	var iterationMethods = ['forEach', 'every', 'some', 'filter', 'map'];
	for (var x = 0, l = iterationMethods.length; x < l; ++x) {
		var method = iterationMethods[x];
		array[method] = (function(method) {
			return function(callback, thisArg) {
				return Array.prototype[method].call(this, function() {
					arguments[0] = model.coerceValue(arguments[0], {type: elementType});
					return callback.apply(this, arguments);
				}, thisArg);
			};
		})(method);
	}
};

/**
 * @returns {Adapter}
 */
Model.getAdapter = function(){
	return this._adapter;
};

/**
 * @param {Adapter} adapter
 * @returns {Model}
 */
Model.setAdapter = function(adapter){
	this._adapter = adapter;
	return this;
};

/**
 * @param {Object} values
 * @returns {Model}
 */
Model.inflate = function(values) {
	var pk = this.getKey(),
		adapter = this._adapter,
		instance;
	if (pk && values[pk]) {
		instance = adapter.cache(this._table, values[pk]);
		if (instance) {
			// if instance is modified, don't alter with values from database
			if (instance.isModified()) {
				return instance;
			}
			// if not modified, update instance with latest db values
			instance.fromJSON(values);
		}
	}
	if (!instance) {
		instance = new this(values);
	}
	instance
		.resetModified()
		.setNew(false);

	if (pk && instance[pk]) {
		adapter.cache(this._table, instance[pk], instance);
	}
	return instance;
};

Model.inflateArray = function(array) {
	var i,
		len,
		result;

	if (array.constructor !== Array) {
		if (typeof result.length === 'undefined') {
			throw new Error('Unknown array type for collection.');
		}
		result = [];
	} else {
		result = array;
	}

	for (i = 0, len = array.length; i < len; ++i) {
		result[i] = this.inflate(array[i]);
	}

	this.convertArray(result, this);
	return result;
};

/**
 * Returns string representation of table name
 * @return {String}
 */
Model.getTableName = function() {
	return this._table;
};

/**
 * Access to array of field types, indexed by field name
 * @return {Object}
 */
Model.getFields = function() {
	return dabl.copy(this._fields);
};

/**
 * Get the type of a field
 * @param {String} fieldName
 * @return {Object}
 */
Model.getField = function(fieldName) {
	return dabl.copy(this._fields[fieldName]);
};

/**
 * Get the type of a field
 * @param {String} fieldName
 * @return {mixed}
 */
Model.getFieldType = function(fieldName) {
	return this._fields[fieldName].type;
};

/**
 * @param {String} fieldName
 * @return {Boolean}
 */
Model.hasField = function(fieldName) {
	return fieldName in this._fields;
};

/**
 * Access to array of primary keys
 * @return {Array}
 */
Model.getKeys = function() {
	return this._keys.slice(0);
};

/**
 * Access to name of primary key
 * @return {Array}
 */
Model.getKey = function() {
	return this._keys.length === 1 ? this._keys[0] : null;
};

/**
 * Returns true if the primary key field for this table is auto-increment
 * @return {Boolean}
 */
Model.isAutoIncrement = function() {
	return this._autoIncrement;
};

/**
 * @param {String} fieldName
 * @param {mixed} field
 */
Model.addField = function(fieldName, field) {
	if (!field.type) {
		field = {
			type: field
		};
	}

	if (typeof field.type === 'string') {
		field.type = field.type.toUpperCase();
	}

	switch (field.type) {
		case 'STRING':
		case String:
			field.type = this.FIELD_TYPE_TEXT;
			break;
		case Number:
			field.type = this.FIELD_TYPE_NUMERIC;
			break;
		case Date:
			field.type = this.FIELD_TYPE_TIMESTAMP;
			break;
		case 'INT':
			field.type = this.FIELD_TYPE_INTEGER;
			break;
	}

	if (field.key) {
		this._keys.push(fieldName);
	}
	if (field.computed) {
		this._autoIncrement = true;
	}
	if (!this.isFieldType(field.type)) {
		throw new Error(field.type + ' is not a valide field type');
	}
	if (field.type.isModel) {
		this._relations.push(fieldName);
	}

	this._fields[fieldName] = field;

//	var get, set, self = this;
//	if (!this.prototype.__defineGetter__ && !this.canDefineProperties) {
//		return;
//	}
//
//	get = function() {
//		var value = this._values[fieldName];
//		return typeof value === 'undefined' ? null : value;
//};
//	set = function(value) {
//		this._values[fieldName] = self.coerceValue(value, field);
//	};
//
//	try {
//		if (Object.defineProperty) {
//			Object.defineProperty(this.prototype, fieldName, {
//				get: get,
//				set: set,
//				enumerable: true
//			});
//		} else {
//			this.prototype.__defineGetter__(fieldName, get);
//			this.prototype.__defineSetter__(fieldName, set);
//		}
//	} catch (e) {}
};

/**
 * @param {String} table
 * @param {Object} opts
 * @return {Model}
 */
Model.extend = function(table, opts) {
	var newClass,
		fieldName,
		prop;

	opts = opts || {};

	if (typeof table === 'undefined') {
		throw new Error('Must provide a table when exending Model');
	}

	newClass = Class.extend.call(this, opts.prototype);
	delete opts.prototype;

	if (!this._table && !this._fields) {
		if (!opts.fields) {
			throw new Error('Must provide fields when exending Model');
		}

		newClass._keys = [];
		newClass._fields = {};
		newClass._relations = [];
	} else {
		newClass._keys = dabl.copy(this._keys);
		newClass._fields = dabl.copy(this._fields);
		newClass._relations = dabl.copy(this._relations);
	}

	newClass._table = table;

	for (prop in opts) {
		switch (prop) {
			// private static properties
			case 'url':
			case 'adapter':
				newClass['_' + prop] = opts[prop];
				break;

			// public static methods and properties
			default:
				newClass[prop] = opts[prop];
				break;
		}
	}

	for (fieldName in opts.fields) {
		newClass.addField(fieldName, opts.fields[fieldName]);
	}

	Model.models[table] = newClass;

	return newClass;
};

Model.isModel = true;

Model.toString = function() {
	return this._table;
};

/*
 * Adapter lookup methods
 */

var adapterMethods = ['countAll', 'findAll', 'find', 'removeAll', 'updateAll'];
for (var i = 0, l = adapterMethods.length; i < l; ++i) {
	var method = adapterMethods[i];
	Model[method] = (function(method){
		return function() {
			var args = Array.prototype.slice.call(arguments),
				con = this.getAdapter(),
				success = null,
				failure = null,
				x = args.length - 1;
			while (x > -1 && !(args[x] instanceof Model) && typeof args[x] === 'function') {
				if (!success) {
					success = args.pop();
					--x;
					continue;
				}

				failure = success;
				success = args.pop();
				break;
			}
			args.unshift(this);
			return this.callAsync(function(){
				return con[method].apply(con, args);
			}, success, failure);
		};
	})(method);
}

var findAliases = ['findBy', 'retrieveByField', 'retrieveByPK', 'retrieveByPKs', 'findByPKs'];
for (var x = 0, len = findAliases.length; x < len; ++x) {
	Model[findAliases[x]] = Model.find;
}

dabl.Model = Model;
var Condition = dabl.Class.extend({
	_conds : null,

	init: function Condition(left, operator, right, quote) {
		this._conds = [];
		if (arguments.length !== 0) {
			this.and.apply(this, arguments);
		}
	},

	_preprocessCondition: function(left, operator, right, quote) {
		switch (arguments.length) {
			case 0:
				return null;
			case 1:
				if (left instanceof Query.Statement || (left instanceof Condition && left._conds.length !== 0)) {
					return [left];
				} else {
					return null;
				}
			case 2:
				right = operator;
				operator = Condition.EQUAL;
				// pass through...
			case 3:
				quote = Condition.QUOTE_RIGHT;
		}

		var isQuery = right instanceof Query,
			isArray = right instanceof Array;

		if (isArray || isQuery) {
			if (false === isQuery || 1 !== right.getLimit()) {
				// Convert any sort of equality operator to something suitable for arrays
				switch (operator) {
					case Condition.BETWEEN:
						break;
					// Various forms of equal
					case Condition.IN:
					case Condition.EQUAL:
					case 'eq':
						operator = Condition.IN;
						break;
					// Various forms of not equal
					case 'ne':
					case Condition.NOT_IN:
					case Condition.NOT_EQUAL:
					case Condition.ALT_NOT_EQUAL:
						operator = Condition.NOT_IN;
						break;
					default:
						throw new Error(operator + ' unknown for comparing an array.');
				}
			}
			if (isArray) {
				if (0 === right.length && operator === Condition.NOT_IN) {
					return null;
				}
			}
			if (isQuery) {
				if (!right.getTable()) {
					throw new Error('right does not have a table, so it cannot be nested.');
				}

				if (quote !== Condition.QUOTE_LEFT) {
					quote = Condition.QUOTE_NONE;
				}
			}
		} else {
			if (null === right) {
				if (operator === Condition.NOT_EQUAL || operator === Condition.ALT_NOT_EQUAL || operator === 'ne') {
					// IS NOT NULL
					operator = Condition.IS_NOT_NULL;
				} else if (operator === Condition.EQUAL || operator === 'eq') {
					// IS NULL
					operator = Condition.IS_NULL;
				}
			}
			if (operator === Condition.IS_NULL || operator === Condition.IS_NOT_NULL) {
				right = null;
				if (quote !== Condition.QUOTE_LEFT) {
					quote = Condition.QUOTE_NONE;
				}
			}
		}

		return [left, operator, right, quote];
	},

	/**
	 * @param {mixed} left
	 * @param {String} operator
	 * @param {mixed} right
	 * @param {Number} quote
	 * @return {Query.Statement}
	 */
	_processCondition : function(left, operator, right, quote) {

		if (arguments.length === 1) {
			if (left instanceof Query.Statement) {
				return left;
			}
			// Left can be a Condition
			if (left instanceof Condition) {
				clauseStatement = left.getQueryStatement();
				clauseStatement.setString('(' + clauseStatement._qString + ')');
				return clauseStatement;
			}
		}

		var statement = new Query.Statement,
			clauseStatement,
			x,
			isQuery = right instanceof Query,
			isArray = right instanceof Array,
			arrayLen;

		if (!(operator in Condition.SQL.operators)) {
			throw new Error('Unsupported SQL operator: "' + operator + '"');
		}

		if (operator === 'substringof') {
			var tmp = left;
			left = right;
			right = tmp;
		}
		operator = Condition.SQL.operators[operator];

		// Escape left
		if (quote === Condition.QUOTE_LEFT || quote === Condition.QUOTE_BOTH) {
			statement.addParam(left);
			left = '?';
		}

		if (operator === Condition.CONTAINS) {
			operator = Condition.LIKE;
			right = '%' + right + '%';
		} else if (operator === Condition.BEGINS_WITH) {
			operator = Condition.LIKE;
			right += '%';
		} else if (operator === Condition.ENDS_WITH) {
			operator = Condition.LIKE;
			right = '%' + right;
		}

		// right can be an array
		if (isArray || isQuery) {
			// Right can be a Query, if you're trying to nest queries, like "WHERE MyColumn = (SELECT OtherColumn From MyTable LIMIT 1)"
			if (isQuery) {
				clauseStatement = right.getQuery();

				right = '(' + clauseStatement._qString + ')';
				statement.addParams(clauseStatement._params);
			} else if (isArray) {
				arrayLen = right.length;
				// BETWEEN
				if (2 === arrayLen && operator === Condition.BETWEEN) {
					statement.setString(left + ' ' + operator + ' ? AND ?');
					statement.addParams(right);
					return statement;
				} else if (0 === arrayLen) {
					// Handle empty arrays
					if (operator === Condition.IN) {
						statement.setString('(0 = 1)');
						return statement;
					}
				} else if (quote === Condition.QUOTE_RIGHT || quote === Condition.QUOTE_BOTH) {
					statement.addParams(right);
					var rString = '(';
					for (x = 0; x < arrayLen; ++x) {
						if (0 < x) {
							rString += ',';
						}
						rString += '?';
					}
					right = rString + ')';
				}
			}
		} else {
			if (
				operator !== Condition.IS_NULL
				&& operator !== Condition.IS_NOT_NULL
				&& (quote === Condition.QUOTE_RIGHT || quote === Condition.QUOTE_BOTH)
			) {
				statement.addParam(right);
				right = '?';
			}
		}
		statement.setString(left + ' ' + operator + (right === null ? '' : ' ' + right));

		return statement;
	},

	/**
	 * @param {mixed} value
	 * @return mixed
	 */
	prepareInput: function(value) {
		if (value instanceof Array) {
			value = value.slice(0);
			for (var x = 0, len = value.length; x < len; ++x) {
				value[x] = this.prepareInput(value[x]);
			}
			return value;
		}

		if (value === true || value === false) {
			return value ? 1 : 0;
		}

		if (value === null || typeof value === 'undefined') {
			return 'null';
		}

		if (parseInt(value, 10) === value) {
			return value;
		}

//		if (value instanceof Date) {
//			if (value.getSeconds() === 0 && value.getMinutes() === 0 && value.getHours() === 0) {
//				// just a date
//				value = this.formatDate(value);
//			} else {
//				value = this.formatDateTime(value);
//			}
//		}

		return this.quote(value);
	},

	quote: function(value) {
		return "'" + value.replace("'", "''") + "'";
	},

	_processODataCondition: function(left, operator, right, quote) {

		if (arguments.length === 1) {
			if (left instanceof Query.Statement) {
				throw new Error('Unable to use Query.Statement within a Condition to build an OData query');
			}
			// Left can be a Condition
			if (left instanceof Condition) {
				return '(' + left.getODataFilter() + ')';
			}
		}

		if (right instanceof Query) {
			throw new Error('Unable to use Query within a Condition to build an OData query');
		}

		var x,
			isArray = right instanceof Array,
			arrayLen;

		// Escape left
		if (quote === Condition.QUOTE_LEFT || quote === Condition.QUOTE_BOTH) {
			left = this.prepareInput(left);
		}

		switch (operator) {
			case 'startswith':
			case 'endswith':
			case 'substringof':
			case Condition.LIKE:
			case Condition.CONTAINS:
			case Condition.BEGINS_WITH:
			case Condition.ENDS_WITH:
				if (right.indexOf('%') !== -1) {
					throw new Error('Cannot use % in OData queries');
				}
				break;
		}

		if (operator === Condition.IS_NULL) {
			operator = Condition.EQUAL;
			right = 'null';
		} else if (operator === Condition.IS_NOT_NULL) {
			operator = Condition.NOT_EQUAL;
			right = 'null';
		} else if (quote === Condition.QUOTE_RIGHT || quote === Condition.QUOTE_BOTH) {
			right = this.prepareInput(right);
		}

		// right can be an array
		if (isArray) {
			arrayLen = right.length;
			// BETWEEN
			if (2 === arrayLen && operator === Condition.BETWEEN) {
				return '(' + left + ' ge ' + right[0] + ' and ' + left + ' le ' + right[1] + ')';
			} else if (0 === arrayLen && operator === Condition.IN) {
				// Handle empty arrays
				return '(0 eq 1)';
			} else {
				var sep;
				if (operator === Condition.IN) {
					operator = ' eq ';
					sep = ' or ';
				} else {
					operator = ' ne ';
					sep = ' and ';
				}
				var str = '(';
				for (x = 0; x < arrayLen; ++x) {
					str += (0 !== x ? sep : '') + left + operator + right[x];
				}
				return str + ')';
			}
		} else {
			if (operator in Condition.OData.operators) {
				operator = Condition.OData.operators[operator];
				return left + ' ' + operator + ' ' + right;
			} else if (operator in Condition.OData.functions) {
				var func = Condition.OData.functions[operator];
				var rightIndex = func.indexOf('@');
				var leftIndex = func.indexOf('?');
				if (rightIndex > leftIndex) {
					func = func.substring(0, rightIndex) + right + func.substr(rightIndex + 1);
					func = func.substring(0, leftIndex) + left + func.substr(leftIndex + 1);
				} else {
					func = func.substring(0, leftIndex) + left + func.substr(leftIndex + 1);
					func = func.substring(0, rightIndex) + right + func.substr(rightIndex + 1);
				}
				return func;
			}
		}

		throw new Error('Unexpected arguments: ' + arguments.join(', '));
	},

	/**
	 * Adds an "AND" condition to the array of conditions.
	 * @param left mixed
	 * @param operator string[optional]
	 * @param right mixed[optional]
	 * @param quote int[optional]
	 * @return {Condition}
	 */
	and : function(left, operator, right, quote) {
		var key;

		if (left.constructor === Object) {
			for (key in left) {
				this.and(key, left[key]);
			}
			return this;
		}

		var args = this._preprocessCondition.apply(this, arguments);
		if (null === args) {
			return this;
		}

		args.type = 'AND';
		this._conds.push(args);

		return this;
	},

	/**
	 * Alias of and
	 * @return {Condition}
	 */
	addAnd : function(left, operator, right, quote) {
		return this.and.apply(this, arguments);
	},

	/**
	 * Alias of and
	 * @return {Condition}
	 */
	add : function(left, operator, right, quote) {
		return this.and.apply(this, arguments);
	},

	/**
	 * Alias of and
	 * @return {Condition}
	 */
	filter : function(left, operator, right, quote) {
		return this.and.apply(this, arguments);
	},

	/**
	 * Alias of and
	 * @return {Condition}
	 */
	where : function(left, operator, right, quote) {
		return this.and.apply(this, arguments);
	},

	/**
	 * Adds an "OR" condition to the array of conditions.
	 * @param left mixed
	 * @param operator string[optional]
	 * @param right mixed[optional]
	 * @param quote int[optional]
	 * @return {Condition}
	 */
	or : function(left, operator, right, quote) {
		var key;

		if (left.constructor === Object) {
			for (key in left) {
				this.or(key, left[key]);
			}
			return this;
		}

		var args = this._preprocessCondition.apply(this, arguments);
		if (null === args) {
			return this;
		}

		args.type = 'OR';
		this._conds.push(args);

		return this;
	},

	/**
	 * Alias of or
	 * @return {Condition}
	 */
	addOr : function(left, operator, right, quote) {
		return this.or.apply(this, arguments);
	},

	/**
	 * Alias of or
	 * @return {Condition}
	 */
	orWhere : function(left, operator, right, quote) {
		return this.or.apply(this, arguments);
	},

	/**
	 * @return {Condition}
	 */
	andNot : function(column, value) {
		return this.and(column, Condition.NOT_EQUAL, value);
	},

	/**
	 * @return {Condition}
	 */
	andLike : function(column, value) {
		return this.and(column, Condition.LIKE, value);
	},

	/**
	 * @return {Condition}
	 */
	andNotLike : function(column, value) {
		return this.and(column, Condition.NOT_LIKE, value);
	},

	/**
	 * @return {Condition}
	 */
	andGreater : function(column, value) {
		return this.and(column, Condition.GREATER_THAN, value);
	},

	/**
	 * @return {Condition}
	 */
	andGreaterEqual : function(column, value) {
		return this.and(column, Condition.GREATER_EQUAL, value);
	},

	/**
	 * @return {Condition}
	 */
	andLess : function(column, value) {
		return this.and(column, Condition.LESS_THAN, value);
	},

	/**
	 * @return {Condition}
	 */
	andLessEqual : function(column, value) {
		return this.and(column, Condition.LESS_EQUAL, value);
	},

	/**
	 * @return {Condition}
	 */
	andNull : function(column) {
		return this.and(column, null);
	},

	/**
	 * @return {Condition}
	 */
	andNotNull : function(column) {
		return this.and(column, Condition.NOT_EQUAL, null);
	},

	/**
	 * @return {Condition}
	 */
	andBetween : function(column, from, to) {
		return this.and(column, Condition.BETWEEN, [from, to]);
	},

	/**
	 * @return {Condition}
	 */
	andBeginsWith : function(column, value) {
		return this.and(column, Condition.BEGINS_WITH, value);
	},

	/**
	 * @return {Condition}
	 */
	andEndsWith : function(column, value) {
		return this.and(column, Condition.ENDS_WITH, value);
	},

	/**
	 * @return {Condition}
	 */
	andContains : function(column, value) {
		return this.and(column, Condition.CONTAINS, value);
	},

	/**
	 * @return {Condition}
	 */
	orNot : function(column, value) {
		return this.or(column, Condition.NOT_EQUAL, value);
	},

	/**
	 * @return {Condition}
	 */
	orLike : function(column, value) {
		return this.or(column, Condition.LIKE, value);
	},

	/**
	 * @return {Condition}
	 */
	orNotLike : function(column, value) {
		return this.or(column, Condition.NOT_LIKE, value);
	},

	/**
	 * @return {Condition}
	 */
	orGreater : function(column, value) {
		return this.or(column, Condition.GREATER_THAN, value);
	},

	/**
	 * @return {Condition}
	 */
	orGreaterEqual : function(column, value) {
		return this.or(column, Condition.GREATER_EQUAL, value);
	},

	/**
	 * @return {Condition}
	 */
	orLess : function(column, value) {
		return this.or(column, Condition.LESS_THAN, value);
	},

	/**
	 * @return {Condition}
	 */
	orLessEqual : function(column, value) {
		return this.or(column, Condition.LESS_EQUAL, value);
	},

	/**
	 * @return {Condition}
	 */
	orNull : function(column) {
		return this.or(column, null);
	},

	/**
	 * @return {Condition}
	 */
	orNotNull : function(column) {
		return this.or(column, Condition.NOT_EQUAL, null);
	},

	/**
	 * @return {Condition}
	 */
	orBetween : function(column, from, to) {
		return this.or(column, Condition.BETWEEN, [from, to]);
	},

	/**
	 * @return {Condition}
	 */
	orBeginsWith : function(column, value) {
		return this.or(column, Condition.BEGINS_WITH, value);
	},

	/**
	 * @return {Condition}
	 */
	orEndsWith : function(column, value) {
		return this.or(column, Condition.ENDS_WITH, value);
	},

	/**
	 * @return {Condition}
	 */
	orContains : function(column, value) {
		return this.or(column, Condition.CONTAINS, value);
	},

	/**
	 * Builds and returns a string representation of this Condition
	 * @param {Adapter} conn
	 * @return {Query.Statement}
	 */
	getQueryStatement : function(conn) {

		if (0 === this._conds.length) {
			return null;
		}

		var statement = new Query.Statement(conn),
			string = '',
			x,
			cond,
			conds = this._conds,
			len = conds.length;

		for (x = 0; x < len; ++x) {
			cond = this._processCondition.apply(this, conds[x]);

			if (null === cond) {
				continue;
			}

			string += "\n\t";
			if (0 !== x) {
				string += ((1 === x && conds[0].type === 'OR') ? 'OR' : conds[x].type) + ' ';
			}
			string += cond._qString;
			statement.addParams(cond._params);
		}
		statement.setString(string);
		return statement;
	},

	getODataFilter: function() {

		if (0 === this._conds.length) {
			return null;
		}

		var str = '',
			x,
			cond,
			conds = this._conds,
			len = conds.length;

		for (x = 0; x < len; ++x) {
			cond = this._processODataCondition.apply(this, conds[x]);

			if (null === cond) {
				continue;
			}

			if (0 !== x) {
				str += ' ' + ((1 === x && conds[0].type === 'or') ? 'or' : (conds[x].type === 'OR' ? 'or' : 'and')) + ' ';
			}
			str += cond;
		}
		return str;
	},

	/**
	 * Builds and returns a string representation of this Condition
	 * @return {String}
	 */
	toString : function() {
		return this.getQueryStatement().toString();
	},

	getSimpleJSON: function() {
		var r = {};

		if (0 === this._conds.length) {
			return {};
		}

		var x,
			cond,
			conds = this._conds,
			len = conds.length;

		for (x = 0; x < len; ++x) {
			var cond = conds[x];
			if ('AND' !== cond.type) {
				throw new Error('OR conditions not supported.');
			}
			if (cond.length === 2) {
				r[cond[0]] = cond[1];
			} else  {
				r[cond[0]] = cond[2];
			}
		}
		return r;
	}
});

// Comparison types
Condition.EQUAL = '=';
Condition.NOT_EQUAL = '<>';
Condition.ALT_NOT_EQUAL = '!=';
Condition.GREATER_THAN = '>';
Condition.LESS_THAN = '<';
Condition.GREATER_EQUAL = '>=';
Condition.LESS_EQUAL = '<=';
Condition.LIKE = 'LIKE';
Condition.BEGINS_WITH = 'BEGINS_WITH';
Condition.ENDS_WITH = 'ENDS_WITH';
Condition.CONTAINS = 'CONTAINS';
Condition.NOT_LIKE = 'NOT LIKE';
Condition.IN = 'IN';
Condition.NOT_IN = 'NOT IN';
Condition.IS_NULL = 'IS NULL';
Condition.IS_NOT_NULL = 'IS NOT NULL';
Condition.BETWEEN = 'BETWEEN';
Condition.BINARY_AND = '&';
Condition.BINARY_OR = '|';

Condition.SQL = {
	operators: {
		eq: '=',
		ne: '<>',
		gt: '>',
		lt: '<',
		ge: '>=',
		le: '<=',
		'=': '=',
		'<>': '<>',
		'!=': '<>',
		'>': '>',
		'<': '<',
		'>=': '>=',
		'<=': '<=',
		'&': '&',
		'|': '|',
		startswith: 'BEGINS_WITH',
		BEGINS_WITH: 'BEGINS_WITH',
		endswith: 'ENDS_WITH',
		ENDS_WITH: 'BEGINS_WITH',
		substringof: 'CONTAINS',
		CONTAINS: 'CONTAINS',
		LIKE : 'LIKE',
		'NOT LIKE' : 'NOT LIKE',
		IN: 'IN',
		'NOT IN': 'NOT IN',
		'IS NULL': 'IS NULL',
		'IS NOT NULL': 'IS NOT NULL',
		BETWEEN: 'BETWEEN'
	}
};

Condition.OData = {
	operators: {
		eq: 'eq',
		ne: 'ne',
		gt: 'gt',
		lt: 'lt',
		ge: 'ge',
		le: 'le',
		'=': 'eq',
		'<>': 'ne',
		'!=': 'ne',
		'>': 'gt',
		'<': 'lt',
		'>=': 'ge',
		'<=': 'le',
		'&': '&',
		'|': '|'
	},
	functions: {
		startswith: 'startswith(?, @)',
		endswith: 'endswith(?, @)',
		substringof: 'substringof(@, ?)',
		BEGINS_WITH: 'startswith(?, @)',
		ENDS_WITH: 'endswith(?, @)',
		CONTAINS: 'substringof(@, ?)',
		LIKE: 'tolower(@) eq tolower(?)',
		'NOT LIKE': 'tolower(@) ne tolower(?)'
	}
};

/**
 * escape only the first parameter
 */
Condition.QUOTE_LEFT = 1;

/**
 * escape only the second param
 */
Condition.QUOTE_RIGHT = 2;

/**
 * escape both params
 */
Condition.QUOTE_BOTH = 3;

/**
 * escape no params
 */
Condition.QUOTE_NONE = 4;

dabl.Condition = Condition;
/**
 * Used to build query strings using OOP
 */
var Query = Condition.extend({

	_action : 'SELECT',

	/**
	 * @var array
	 */
	_columns : null,

	/**
	 * @var mixed
	 */
	_table : null,

	/**
	 * @var string
	 */
	_tableAlias : null,

	/**
	 * @var array
	 */
	_extraTables: null,

	/**
	 * @var Query.Join[]
	 */
	_joins: null,

	/**
	 * @var array
	 */
	_orders: null,
	/**
	 * @var array
	 */
	_groups: null,
	/**
	 * @var Condition
	 */
	_having : null,
	/**
	 * @var int
	 */
	_limit : null,
	/**
	 * @var int
	 */
	_offset : 0,
	/**
	 * @var bool
	 */
	_distinct : false,

	/**
	 * Creates new instance of Query, parameters will be passed to the
	 * setTable() method.
	 * @return self
	 * @param {String} table
	 * @param {String} alias
	 */
	init: function Query(table, alias) {
		this._super();

		this._columns = [];
		this._joins = [];
		this._orders = [];
		this._groups = [];

		if (!table) {
			return;
		}

		if (table.constructor === Object) {
			this.and(table);
		} else if (table) {
			this.setTable(table, alias);
		}
	},


	//	__clone : function() {
	//		if (this._having instanceof Condition) {
	//			this._having = clone this._having;
	//		}
	//		foreach (this._joins as key => join) {
	//			this._joins[key] = clone join;
	//		}
	//	},

	/**
	 * Specify whether to select only distinct rows
	 * @param {Boolean} bool
	 */
	setDistinct : function(bool) {
		if (typeof bool === 'undefined') {
			bool = true;
		}
		this._distinct = bool === true;
	},

	/**
	 * Sets the action of the query.  Should be SELECT, DELETE, or COUNT.
	 * @return {Query}
	 * @param {String} action
	 */
	setAction : function(action) {
		switch (action) {
			case 'SELECT':
			case 'DELETE':
			case 'COUNT':
				break;
			default:
				throw new Error('"' + action + '" is not an allowed Query action.');
				break;
		}

		this._action = action;
		return this;
	},

	/**
	 * Returns the action of the query.  Should be SELECT, DELETE, or COUNT.
	 * @return {String}
	 */
	getAction : function() {
		return this._action;
	},

	/**
	 * Add a column to the list of columns to select.  If unused, defaults to *.
	 *
	 * {@example libraries/dabl/database/query/Query_addColumn.php}
	 *
	 * @param {String} columnName
	 * @return {Query}
	 */
	addColumn : function(columnName) {
		this._columns.push(columnName);
		return this;
	},

	/**
	 * Set array of strings of columns to be selected
	 * @param columnsArray
	 * @return {Query}
	 */
	setColumns : function(columnsArray) {
		this._columns = columnsArray.slice(0);
		return this;
	},

	/**
	 * Alias of setColumns
	 * Set array of strings of columns to be selected
	 * @param columnsArray
	 * @return {Query}
	 */
	select : function(columnsArray) {
		return this.setColumns.apply(this, arguments);
	},

	/**
	 * Return array of columns to be selected
	 * @return {Array}
	 */
	getColumns : function() {
		return this._columns;
	},

	/**
	 * Set array of strings of groups to be selected
	 * @param groupsArray
	 * @return {Query}
	 */
	setGroups : function(groupsArray) {
		this._groups = groupsArray;
		return this;
	},

	/**
	 * Return array of groups to be selected
	 * @return {Array}
	 */
	getGroups : function() {
		return this._groups;
	},

	/**
	 * Sets the table to be queried. This can be a string table name
	 * or an instance of Query if you would like to nest queries.
	 * This function also supports arbitrary SQL.
	 *
	 * @param {String} table Name of the table to add, or sub-Query
	 * @param {String} alias Alias for the table
	 * @return {Query}
	 */
	setTable : function(table, alias) {
		if (table instanceof Query) {
			if (!alias) {
				throw new Error('The nested query must have an alias.');
			}
		}

		if (alias) {
			this.setAlias(alias);
		}

		this._table = table;
		return this;
	},

	from: function(table, alias) {
		return this.setTable.apply(this, arguments);
	},

	/**
	 * Returns a String representation of the table being queried,
	 * NOT including its alias.
	 *
	 * @return {String}
	 */
	getTable : function() {
		return this._table;
	},

	setAlias : function(alias) {
		this._tableAlias = alias;
		return this;
	},

	/**
	 * Returns a String of the alias of the table being queried,
	 * if present.
	 *
	 * @return {String}
	 */
	getAlias : function() {
		return this._tableAlias;
	},

	/**
	 * @param {String} tableName
	 * @param {String} alias
	 * @return {Query}
	 */
	addTable : function(tableName, alias) {
		if (tableName instanceof Query) {
			if (!alias) {
				throw new Error('The nested query must have an alias.');
			}
		} else if (typeof alias === 'undefined') {
			alias = tableName;
		}

		if (alias === this._tableAlias || alias === this._table) {
			throw new Error('The alias "' + alias + '" is is already in use');
		}

		if (this._extraTables === null) {
			this._extraTables = {};
		}
		this._extraTables[alias] = tableName;
		return this;
	},

	/**
	 * Add a JOIN to the query.
	 *
	 * @todo Support the ON clause being NULL correctly
	 * @param {String} tableOrColumn Table to join on
	 * @param {String} onClauseOrColumn ON clause to join with
	 * @param {String} joinType Type of JOIN to perform
	 * @return {Query}
	 */
	addJoin : function(tableOrColumn, onClauseOrColumn, joinType) {
		if (tableOrColumn instanceof Query.Join) {
			this._joins.push(tableOrColumn);
			return this;
		}

		if (null === onClauseOrColumn) {
			if (joinType === Query.JOIN || joinType === Query.INNER_JOIN) {
				this.addTable(tableOrColumn);
				return this;
			}
			onClauseOrColumn = '1 = 1';
		}

		this._joins.push(new Query.Join(tableOrColumn, onClauseOrColumn, joinType));
		return this;
	},

	/**
	 * Alias of {@link addJoin()}.
	 * @return {Query}
	 */
	join : function(tableOrColumn, onClauseOrColumn, joinType) {
		return this.addJoin(tableOrColumn, onClauseOrColumn, joinType);
	},

	/**
	 * @return {Query}
	 */
	innerJoin : function(tableOrColumn, onClauseOrColumn) {
		return this.addJoin(tableOrColumn, onClauseOrColumn, Query.INNER_JOIN);
	},

	/**
	 * @return {Query}
	 */
	leftJoin : function(tableOrColumn, onClauseOrColumn) {
		return this.addJoin(tableOrColumn, onClauseOrColumn, Query.LEFT_JOIN);
	},

	/**
	 * @return {Query}
	 */
	rightJoin : function(tableOrColumn, onClauseOrColumn) {
		return this.addJoin(tableOrColumn, onClauseOrColumn, Query.RIGHT_JOIN);
	},

	/**
	 * @return {Query}
	 */
	outerJoin : function(tableOrColumn, onClauseOrColumn) {
		return this.addJoin(tableOrColumn, onClauseOrColumn, Query.OUTER_JOIN);
	},

	/**
	 * @return {Array}
	 */
	getJoins : function() {
		return this._joins;
	},

	/**
	 * @return {Query}
	 */
	setJoins : function(joins) {
		this._joins = joins;
		return this;
	},

	/**
	 * Adds a clolumn to GROUP BY
	 * @return {Query}
	 * @param {String} column
	 */
	groupBy : function(column) {
		this._groups.push(column);
		return this;
	},

	/**
	 * Provide the Condition object to generate the HAVING clause of the query
	 * @return {Query}
	 * @param {Condition} condition
	 */
	setHaving : function(condition) {
		if (null !== condition && !(condition instanceof Condition)) {
			throw new Error('setHaving must be given an instance of Condition');
		}
		this._having = condition;
		return this;
	},

	/**
	 * Returns the Condition object that generates the HAVING clause of the query
	 * @return {Condition}
	 */
	getHaving : function() {
		return this._having;
	},

	/**
	 * Adds a column to ORDER BY in the form of "COLUMN DIRECTION"
	 * @return {Query}
	 * @param {String} column
	 * @param {String} dir
	 */
	orderBy : function(column, dir) {
		this._orders.push(arguments);
		return this;
	},

	/**
	 * Sets the limit of rows that can be returned
	 * @return {Query}
	 * @param {Number} limit
	 * @param {Number} offset
	 */
	limit : function(limit, offset) {
		limit = parseInt(limit);
		if (isNaN(limit)) {
			throw new Error('Not a number');
		}
		this._limit = limit;

		if (arguments.length > 1) {
			this.setOffset(offset);
		}
		return this;
	},

	/**
	 * Convenience function for limit
	 * Sets the limit of rows that can be returned
	 * @return {Query}
	 * @param {Number} limit
	 * @param {Number} offset
	 */
	top : function(limit, offset) {
		return this.limit.apply(this, arguments);
	},

	/**
	 * Returns the LIMIT integer for this Query, if it has one
	 * @return {Number}
	 */
	getLimit : function() {
		return this._limit;
	},

	/**
	 * Sets the offset for the rows returned.
	 * @return {Query}
	 * @param {Number} offset
	 */
	offset : function(offset) {
		offset = parseInt(offset);
		if (isNaN(offset)) {
			throw new Error('Not a number.');
		}
		this._offset = offset;
		return this;
	},

	/**
	 * Convenience function for offset
	 * Sets the offset for the rows returned.
	 * @return {Query}
	 * @param {Number} offset
	 */
	skip : function(offset) {
		return this.offset.apply(this, arguments);
	},

	/**
	 * Sets the offset for the rows returned.  Used to build
	 * the LIMIT part of the query.
	 * @param {Number} page
	 * @return {Query}
	 */
	setPage : function(page) {
		page = parseInt(page);
		if (isNaN(page)) {
			throw new Error('Not a number.');
		}
		if (page < 2) {
			this._offset = null;
			return this;
		}
		if (!this._limit) {
			throw new Error('Cannot set page without first setting limit.');
		}
		this._offset = page * this._limit - this._limit;
		return this;
	},

	/**
	 * Returns true if this Query uses aggregate functions in either a GROUP BY clause or in the
	 * select columns
	 * @return {Boolean}
	 */
	hasAggregates : function() {
		if (this._groups.length !== 0) {
			return true;
		}
		for (var c = 0, clen = this._columns.length; c < clen; ++c) {
			if (this._columns[c].indexOf('(') !== -1) {
				return true;
			}
		}
		return false;
	},

	/**
	 * Returns true if this Query requires a complex count
	 * @return {Boolean}
	 */
	needsComplexCount : function() {
		return this.hasAggregates()
		|| null !== this._having
		|| this._distinct;
	},

	/**
	 * Builds and returns the query string
	 *
	 * @param {SQLAdapter} adapter
	 * @return {Query.Statement}
	 */
	getQuery : function(adapter) {
		if (typeof adapter === 'undefined') {
			adapter = new SQLAdapter;
		}

		// the Query.Statement for the Query
		var statement = new Query.Statement(adapter),
			queryS,
			columnsStatement,
			tableStatement,
			x,
			len,
			join,
			joinStatement,
			whereStatement,
			havingStatement;

		// the string statement will use
		queryS = '';

		switch (this._action) {
			default:
			case Query.ACTION_COUNT:
			case Query.ACTION_SELECT:
				columnsStatement = this.getColumnsClause(adapter);
				statement.addParams(columnsStatement._params);
				queryS += 'SELECT ' + columnsStatement._qString;
				break;
			case Query.ACTION_DELETE:
				queryS += 'DELETE';
				break;
		}

		tableStatement = this.getTablesClause(adapter);
		statement.addParams(tableStatement._params);
		queryS += "\nFROM " + tableStatement._qString;

		if (this._joins.length !== 0) {
			for (x = 0, len = this._joins.length; x < len; ++x) {
				join = this._joins[x],
				joinStatement = join.getQueryStatement(adapter);
				queryS += "\n\t" + joinStatement._qString;
				statement.addParams(joinStatement._params);
			}
		}

		whereStatement = this.getWhereClause();

		if (null !== whereStatement) {
			queryS += "\nWHERE " + whereStatement._qString;
			statement.addParams(whereStatement._params);
		}

		if (this._groups.length !== 0) {
			queryS += "\nGROUP BY " + this._groups.join(', ');
		}

		if (null !== this.getHaving()) {
			havingStatement = this.getHaving().getQueryStatement();
			if (havingStatement) {
				queryS += "\nHAVING " + havingStatement._qString;
				statement.addParams(havingStatement._params);
			}
		}

		if (this._action !== Query.ACTION_COUNT && this._orders.length !== 0) {
			queryS += "\nORDER BY ";

			for (x = 0, len = this._orders.length; x < len; ++x) {
				var column = this._orders[x][0];
				var dir = this._orders[x][1];
				if (null !== dir && typeof dir !== 'undefined') {
					column = column + ' ' + dir;
				}
				if (0 !== x) {
					queryS += ', ';
				}
				queryS += column;
			}
		}

		if (null !== this._limit) {
			if (adapter) {
				queryS = adapter.applyLimit(queryS, this._offset, this._limit);
			} else {
				queryS += "\nLIMIT " + (this._offset ? this._offset + ', ' : '') + this._limit;
			}
		}

		if (this._action === Query.ACTION_COUNT && this.needsComplexCount()) {
			queryS = "SELECT count(0)\nFROM (" + queryS + ") a";
		}

		statement.setString(queryS);
		return statement;
	},

	/**
	 * Protected for now.  Likely to be public in the future.
	 * @param {SQLAdapter} adapter
	 * @return {Query.Statement}
	 */
	getTablesClause : function(adapter) {

		var table = this._table,
			statement,
			alias,
			tableStatement,
			tAlias,
			tableString,
			extraTable,
			extraTableStatement,
			extraTableString;

		if (!table) {
			throw new Error('No table specified.');
		}

		statement = new Query.Statement(adapter);
		alias = this._tableAlias;

		// if table is a Query, get its Query.Statement
		if (table instanceof Query) {
			tableStatement = table.getQuery(adapter),
			tableString = '(' + tableStatement._qString + ')';
		} else {
			tableStatement = null;
			tableString = table;
		}

		switch (this._action) {
			case Query.ACTION_COUNT:
			case Query.ACTION_SELECT:
				// setup identifiers for table_string
				if (null !== tableStatement) {
					statement.addParams(tableStatement._params);
				}

				// append alias, if it's not empty
				if (alias) {
					tableString = tableString + ' AS ' + alias;
				}

				// setup identifiers for any additional tables
				if (this._extraTables !== null) {
					for (tAlias in this._extraTables) {
						extraTable = this._extraTables[tAlias];
						if (extraTable instanceof Query) {
							extraTableStatement = extraTable.getQuery(adapter),
							extraTableString = '(' + extraTableStatement._qString + ') AS ' + tAlias;
							statement.addParams(extraTableStatement._params);
						} else {
							extraTableString = extraTable;
							if (tAlias !== extraTable) {
								extraTableString = extraTableString + ' AS ' + tAlias;
							}
						}
						tableString = tableString + ', ' + extraTableString;
					}
				}
				statement.setString(tableString);
				break;
			case Query.ACTION_DELETE:
				if (null !== tableStatement) {
					statement.addParams(tableStatement._params);
				}

				// append alias, if it's not empty
				if (alias) {
					tableString = tableString + ' AS ' + alias;
				}
				statement.setString(tableString);
				break;
			default:
				break;
		}
		return statement;
	},

	/**
	 * Protected for now.  Likely to be public in the future.
	 * @param {SQLAdapter} adapter
	 * @return {Query.Statement}
	 */
	getColumnsClause : function(adapter) {
		var table = this._table,
			column,
			statement = new Query.Statement(adapter),
			alias = this._tableAlias,
			action = this._action,
			x,
			len,
			columnsToUse,
			columnsString;

		if (action === Query.ACTION_DELETE) {
			return statement;
		}

		if (!table) {
			throw new Error('No table specified.');
		}

		if (action === Query.ACTION_COUNT) {
			if (!this.needsComplexCount()) {
				statement.setString('count(0)');
				return statement;
			}

			if (this._groups.length !== 0) {
				statement.setString(this._groups.join(', '));
				return statement;
			}

			if (!this._distinct && null === this.getHaving() && this._columns.length !== 0) {
				columnsToUse = [];
				for (x = 0, len = this._columns.length; x < len; ++x) {
					column = this._columns[x];
					if (column.indexOf('(') === -1) {
						continue;
					}
					columnsToUse.push(column);
				}
				if (columnsToUse.length !== 0) {
					statement.setString(columnsToUse.join(', '));
					return statement;
				}
			}
		}

		// setup columns_string
		if (this._columns.length !== 0) {
			columnsString = this._columns.join(', ');
		} else if (alias) {
			// default to selecting only columns from the target table
			columnsString = alias + '.*';
		} else {
			// default to selecting only columns from the target table
			columnsString = table + '.*';
		}

		if (this._distinct) {
			columnsString = 'DISTINCT ' + columnsString;
		}

		statement.setString(columnsString);
		return statement;
	},

	/**
	 * Protected for now.  Likely to be public in the future.
	 * @param {SQLAdapter} adapter
	 * @return {Query.Statement}
	 */
	getWhereClause : function(adapter) {
		return this.getQueryStatement(adapter);
	},

	/**
	 * @return {String}
	 */
	toString : function() {
		if (!this._table)
			this.setTable('{UNSPECIFIED-TABLE}');
		return this.getQuery().toString();
	},

	/**
	 * @param {SQLAdapter} adapter
	 * @returns {Query.Statement}
	 */
	getCountQuery : function(adapter) {
		if (!this._table) {
			throw new Error('No table specified.');
		}

		this.setAction(Query.ACTION_COUNT);
		return this.getQuery(adapter);
	},

	/**
	 * @param {SQLAdapter} adapter
	 * @returns {Query.Statement}
	 */
	getDeleteQuery : function(adapter) {
		if (!this._table) {
			throw new Error('No table specified.');
		}

		this.setAction(Query.ACTION_DELETE);
		return this.getQuery(adapter);
	},

	/**
	 * @param {SQLAdapter} adapter
	 * @returns {Query.Statement}
	 */
	getSelectQuery : function(adapter) {
		if (!this._table) {
			throw new Error('No table specified.');
		}

		this.setAction(Query.ACTION_SELECT);
		return this.getQuery(adapter);
	},

	getODataQuery: function() {
		if (this._joins && this._joins.length !== 0) {
			throw new Error('JOINS cannot be exported.');
		}
		if (this._extraTables && this._extraTables.length !== 0) {
			throw new Error('Extra tables cannot be exported.');
		}
		if (this._having && this._having.length !== 0) {
			throw new Error('Having cannot be exported.');
		}
		if (this._groups && this._groups.length !== 0) {
			throw new Error('Grouping cannot be exported.');
		}

		var r = {};

		if (this._columns.length !== 0) {
			r.$select = this._columns.join(',');
		}

		var filter = this.getODataFilter();
		if (filter) {
			r.$filter = filter;
		}

		if (this._limit) {
			r.$top = this._limit;
			if (this._offset) {
				r.$skip = this._offset;
			}
		}

		if (this._orders && this._orders.length !== 0) {
			r.$orderby = this._orders[0][0];
			if (this._orders[0][1] === Query.DESC) {
				r.$orderby += ' desc';
			}
		}

		return r;
	},

	getSimpleJSON: function() {
		if (this._joins && this._joins.length !== 0) {
			throw new Error('JOINS cannot be exported.');
		}
		if (this._extraTables && this._extraTables.length !== 0) {
			throw new Error('Extra tables cannot be exported.');
		}
		if (this._having && this._having.length !== 0) {
			throw new Error('Having cannot be exported.');
		}
		if (this._groups && this._groups.length !== 0) {
			throw new Error('Grouping cannot be exported.');
		}

		var r = this._super();

		if (this._limit) {
			r.limit = this._limit;
			if (this._offset) {
				r.offset = this._offset;
				r.page = Math.floor(this._offset / this._limit) + 1;
			}
		}

		if (this._orders && this._orders.length !== 0) {
			r.order_by = this._orders[0][0];
			if (this._orders[0][1] === Query.DESC) {
				r.dir = Query.DESC;
			}
		}

		if (this._action === Query.ACTION_COUNT) {
			r.count_only = 1;
		}

		return r;
	}
});

Query.ACTION_COUNT = 'COUNT';
Query.ACTION_DELETE = 'DELETE';
Query.ACTION_SELECT = 'SELECT';

// JOIN TYPES
Query.JOIN = 'JOIN';
Query.LEFT_JOIN = 'LEFT JOIN';
Query.RIGHT_JOIN = 'RIGHT JOIN';
Query.INNER_JOIN = 'INNER JOIN';
Query.OUTER_JOIN = 'OUTER JOIN';

// 'Order by' qualifiers
Query.ASC = 'ASC';
Query.DESC = 'DESC';

dabl.Query = Query;
var isIdent = /^\w+\.\w+$/;

var Join = function Join(tableOrColumn, onClauseOrColumn, joinType) {
	if (arguments.length < 3) {
		joinType = Query.JOIN;
	}

	// check for Propel type join: table.column, table.column
	if (
		!(tableOrColumn instanceof Query)
		&& !(onClauseOrColumn instanceof Condition)
		&& isIdent.test(onClauseOrColumn)
		&& isIdent.test(tableOrColumn)
	) {
		this._isLikePropel = true;
		this._leftColumn = tableOrColumn;
		this._rightColumn = onClauseOrColumn;
		this._table = onClauseOrColumn.substring(0, onClauseOrColumn.indexOf('.'));
		this._joinType = joinType;
		return;
	}

	this.setTable(tableOrColumn)
	.setOnClause(onClauseOrColumn)
	.setJoinType(joinType);
};

Join.prototype = {

	/**
	 * @var mixed
	 */
	_table : null,

	/**
	 * @var string
	 */
	_alias : null,

	/**
	 * @var mixed
	 */
	_onClause : null,

	/**
	 * @var bool
	 */
	_isLikePropel : false,

	/**
	 * @var string
	 */
	_leftColumn : null,

	/**
	 * @var string
	 */
	_rightColumn : null,

	/**
	 * @var string
	 */
	_joinType : Query.JOIN,

	/**
	 * @return {String}
	 */
	toString : function() {
		if (!this.getTable()) {
			this.setTable('{UNSPECIFIED-TABLE}');
		}
		return this.getQueryStatement().toString();
	},

	/**
	 * @param {String} tableName
	 * @return {Query.Join}
	 */
	setTable : function(tableName) {
		var space = tableName.lastIndexOf(' '),
			as = space === -1 ? -1 : tableName.toUpperCase().lastIndexOf(' AS ');

		if (as !== space - 3) {
			as = -1;
		}
		if (space !== -1) {
			this.setAlias(tableName.substr(space + 1));
			tableName = tableName.substring(0, as === -1 ? space : as);
		}
		this._table = tableName;
		return this;
	},

	/**
	 * @param {String} alias
	 * @return {Query.Join}
	 */
	setAlias : function(alias) {
		this._alias = alias;
		return this;
	},

	/**
	 * @param {Condition} onClause
	 * @return {Query.Join}
	 */
	setOnClause : function(onClause) {
		this._isLikePropel = false;
		this._onClause = onClause;
		return this;
	},

	/**
	 * @param {String} joinType
	 * @return {Query.Join}
	 */
	setJoinType : function(joinType) {
		this._joinType = joinType;
		return this;
	},

	/**
	 * @param {Adapter} conn
	 * @return {Query.Statement}
	 */
	getQueryStatement : function(conn) {
		var statement,
			table = this._table,
			onClause = this._onClause,
			joinType = this._joinType,
			alias = this._alias,
			onClauseStatement;

		if (table instanceof Query) {
			statement = table.getQuery(conn);
			table = '(' + statement._qString + ')';
			statement.setString('');
		} else {
			statement = new Query.Statement(conn);
		}

		if (alias) {
			table += ' AS ' + alias;
		}

		if (this._isLikePropel) {
			onClause = this._leftColumn + ' = ' + this._rightColumn;
		} else if (null === onClause) {
			onClause = '1 = 1';
		} else if (onClause instanceof Condition) {
			onClauseStatement = onClause.getQueryStatement();
			onClause = onClauseStatement._qString;
			statement.addParams(onClauseStatement.getParams());
		}

		if ('' !== onClause) {
			onClause = 'ON (' + onClause + ')';
		}

		statement.setString(joinType + ' ' + table + ' ' + onClause);
		return statement;
	},

	/**
	 * @return {String|Query}
	 */
	getTable : function() {
		return this._table;
	},

	/**
	 * @return {String}
	 */
	getAlias : function() {
		return this._alias;
	},

	/**
	 * @return {String|Condition}
	 */
	getOnClause : function() {
		if (this._isLikePropel) {
			return this._leftColumn + ' = ' + this._rightColumn;
		}
		return this._onClause;
	},

	/**
	 * @return {String}
	 */
	getJoinType : function() {
		return this._joinType;
	}

};

dabl.Query.Join = Join;
var Statement = function Statement(conn) {
	this._params = [];
	if (conn) {
		this._conn = conn;
	}
};

/**
 * Emulates a prepared statement.  Should only be used as a last resort.
 * @param string
 * @param params
 * @param conn
 * @return {String}
 */
Statement.embedParams = function(string, params, conn) {
	if (conn) {
		params = conn.prepareInput(params);
	}

	var p = '?';

	if (string.split(p).length - 1 !== params.length) {
		throw new Error('The number of occurances of ' + p + ' do not match the number of _params.');
	}

	if (params.length === 0) {
		return string;
	}

	var currentIndex = string.length,
		pLength = p.length,
		x,
		identifier;

	for (x = params.length - 1; x >= 0; --x) {
		identifier = params[x];
		currentIndex = string.lastIndexOf(p, currentIndex);
		if (currentIndex === -1) {
			throw new Error('The number of occurances of ' + p + ' do not match the number of _params.');
		}
		string = string.substring(0, currentIndex) + identifier + string.substr(currentIndex + pLength);
	}

	return string;
};

Statement.prototype = {

	/**
	 * @var string
	 */
	_qString : '',
	/**
	 * @var array
	 */
	_params : null,
	/**
	 * @var Adapter
	 */
	_conn : null,

	/**
	 * Sets the PDO connection to be used for preparing and
	 * executing the query
	 * @param {Adapter} conn
	 */
	setConnection : function(conn) {
		this._conn = conn;
	},

	/**
	 * @return {Adapter}
	 */
	getConnection : function() {
		return this._conn;
	},

	/**
	 * Sets the SQL string to be used in a query
	 * @param {String} string
	 */
	setString : function(string) {
		this._qString = string;
	},

	/**
	 * @return {String}
	 */
	getString : function() {
		return this._qString;
	},

	/**
	 * Merges given array into _params
	 * @param {Array} params
	 */
	addParams : function(params) {
		this._params = this._params.concat(params);
	},

	/**
	 * Replaces params with given array
	 * @param {Array} params
	 */
	setParams : function(params) {
		this._params = params.slice(0);
	},

	/**
	 * Adds given param to param array
	 * @param {mixed} param
	 */
	addParam : function(param) {
		this._params.push(param);
	},

	/**
	 * @return {Array}
	 */
	getParams : function() {
		return this._params.slice(0);
	},

	/**
	 * @return {String}
	 */
	toString : function() {
		return Query.Statement.embedParams(this._qString, this._params.slice(0), this._conn);
	}
};

dabl.Query.Statement = Statement;
var Adapter = dabl.Class.extend({

	_cache: null,

	init: function Adapter() {
		this._cache = {};
	},

	/**
	 * @param {String} table
	 * @param {mixed} key
	 * @param {Model} value
	 * @return {Model|Adapter}
	 */
	cache: function(table, key, value) {
		if (!this._cache[table]) {
			this._cache[table] = {};
		}
		if (arguments.length < 3) {
			if (!this._cache[table][key]) {
				return null;
			}
			return this._cache[table][key];
		}
		this._cache[table][key] = value;
		return this;
	},

	/**
	 * @param {String} table
	 */
	emptyCache: function(table) {
		delete this._cache[table];
	},

	/**
	 * @param {Date|String} value
	 * @return {String}
	 */
	formatDate: function(value, fieldType) {
		if (!value) {
			return null;
		}
		if (fieldType && fieldType === dabl.Model.FIELD_TYPE_TIMESTAMP) {
			return this.formatDateTime(value);
		}
		if (!(value instanceof Date)) {
			value = dabl.constructDate(value);
		}
		return value.getUTCFullYear() + '-' + dabl.sPad(value.getUTCMonth() + 1) + '-' + dabl.sPad(value.getUTCDate());
	},

	/**
	 * @param {Date|String} value
	 * @return {String}
	 */
	formatDateTime: function(value) {
		if (!value) {
			return null;
		}
		if (!(value instanceof Date)) {
			value = dabl.constructDate(value);
		}
		return value.getFullYear() + '-' + dabl.sPad(value.getMonth() + 1) + '-' + dabl.sPad(value.getDate()) + ' ' + dabl.sPad(value.getHours()) + ':' + dabl.sPad(value.getMinutes()) + ':' + dabl.sPad(value.getSeconds());
	},

	/**
	 * @param {Class} model class
	 */
	findQuery: function(model) {
		var a = Array.prototype.slice.call(arguments),
			q = new Query().setTable(model.getTableName()),
			key = model.getKey();
		a.shift();
		var len = a.length;

		if (len === 0) {
			return q;
		}
		if (len === 1) {
			if (typeof a[0] === 'object') {
				if (a[0] instanceof Query) {
					if (!a[0].getTable()) {
						a[0].setTable(model.getTableName());
					}
					return a[0];
				} else {
					q.and(a[0]);
				}
			} else if (key) {
				var idNum = parseInt(a[0], 10);
				if (isNaN(idNum)) {
					q.and(key, a[0]);
				} else {
					q.and(key, idNum);
				}
			}
		} else if ((len === 2 || len === 3 || len === 4) && typeof a[0] === 'string') {
			q.and.apply(q, a);
		} else {
			throw new Error('Unknown arguments for find: (' + a.join(', ') + ')');
		}
		return q;
	},

	/**
	 * @param {Class} model class
	 */
	find: function(model){
		throw new Error('find not implemented for this adapter');
	},

	/**
	 * @param {Class} model class
	 */
	findAll: function(model) {
		throw new Error('findAll not implemented for this adapter');
	},

	/**
	 * @param {Class} model class
	 * @param {Query} q
	 */
	countAll: function(model, q) {
		throw new Error('countAll not implemented for this adapter');
	},

	/**
	 * @param {Class} model class
	 * @param {Query} q
	 */
	removeAll: function(model, q) {
		throw new Error('removeAll not implemented for this adapter');
	},

	/**
	 * @param {Model} instance
	 */
	insert: function(instance) {
		throw new Error('insert not implemented for this adapter');
	},

	/**
	 * @param {Model} instance
	 */
	update: function(instance) {
		throw new Error('update not implemented for this adapter');
	},

	/**
	 * @param {Model} instance
	 */
	remove: function(instance) {
		throw new Error('remove not implemented for this adapter');
	}
});

dabl.Adapter = Adapter;;function encodeUriSegment(val) {
	return encodeUriQuery(val, true).
	replace(/%26/gi, '&').
	replace(/%3D/gi, '=').
	replace(/%2B/gi, '+');
}

function encodeUriQuery(val, pctEncodeSpaces) {
	return encodeURIComponent(val).
	replace(/%40/gi, '@').
	replace(/%3A/gi, ':').
	replace(/%24/g, '$').
	replace(/%2C/gi, ',').
	replace((pctEncodeSpaces ? null : /%20/g), '+');
}

function Route(template, defaults) {
	this.template = template;
	this.defaults = defaults || {};
	var urlParams = this.urlParams = {},
		parts = template.split(/\W/);
	for (var i = 0, l = parts.length; i < l; ++i) {
		var param = parts[i];
		if (!(new RegExp("^\\d+$").test(param)) && param && (new RegExp("(^|[^\\\\]):" + param + "(\\W|$)").test(template))) {
			urlParams[param] = true;
		}
	}
	this.template = template.replace(/\\:/g, ':');
}

Route.prototype = {
	url: function(params) {
		var self = this,
		url = this.template,
		val,
		encodedVal;

		params = params || {};

		for (var urlParam in this.urlParams) {
			val = typeof params[urlParam] !== 'undefined' || params.hasOwnProperty(urlParam) ? params[urlParam] : self.defaults[urlParam];
			if (typeof val !== 'undefined' && val !== null) {
				encodedVal = encodeUriSegment(val);
				url = url.replace(new RegExp(":" + urlParam + "(\\W)", "g"), encodedVal + "$1");
			} else {
				url = url.replace(new RegExp("(\/?):" + urlParam + "(\\W)", "g"), function(match, leadingSlashes, tail) {
					if (tail.charAt(0) === '/') {
						return tail;
					} else {
						return leadingSlashes + tail;
					}
				});

				//Prevent '/.' as an artifact of the :id from dashboards/:id.json and leaving dashboards/.json
				url = (url.charAt(0) === '/' && url.charAt(1) === '.' ? '/' : '') + url.replace('/.', '.');
			}
		}
		return url;
	},

	urlGet: function(params) {
		var url = this.url(params);
		params = params || {};

		url = url.replace(/\/?#$/, '');
		var query = dabl.serialize(params);
		url = url.replace(/\/*$/, '');
		return url + (query.length ? '?' + query : '');
	}
};

var RESTAdapter = dabl.Adapter.extend({

	_routes: {},

	_urlBase: '',

	init: function RESTAdapter(urlBase) {
		this._super();
		if (urlBase) {
			this._urlBase = urlBase;
		}
	},

	_getRoute: function(url) {
		if (!url) {
			throw new Error('Cannot create RESTful route for empty url.');
		}
		if (this._routes[url]) {
			return this._routes[url];
		}
		return this._routes[url] = new Route(this._urlBase + url);
	},

	_getErrorCallback: function(def) {
		return function(jqXHR, textStatus, errorThrown) {
			var data;
			try {
				if (jqXHR.responseText) {
					data = JSON.parse(jqXHR.responseText);
				} else {
					data = null;
				}
			} catch (e) {
				data = null;
			};
			var error = errorThrown || 'Request failed.';
			if (data) {
				if (data.error) {
					error = data.error;
				} else if (data.errors) {
					error = data.errors.join('\n');
				}
			}
			def.reject(error, data, jqXHR);
		};
	},

	_isValidResponseObject: function(data, model) {
		var pk = model.getKey();
		if (
			typeof data !== 'object'
			|| data.error
			|| (data.errors && data.errors.length !== 0)
			|| (pk && typeof data[pk] === 'undefined')
		) {
			return false;
		}
		return true;
	},

	_save: function(instance, method) {
		var fieldName,
			model = instance.constructor,
			value,
			route = this._getRoute(model._url),
			data = {},
			pk = model.getKey(),
			self = this,
			def = dabl.Deferred(),
			error = this._getErrorCallback(def);

		for (fieldName in model._fields) {
			var field = model._fields[fieldName];
			value = instance[fieldName];
			if (model.isTemporalType(field.type)) {
				value = this.formatDate(value, field.type);
			}
			data[fieldName] = value;
		}

		jQuery.ajax({
			url: route.url(data),
			type: 'POST',
			data: JSON.stringify(data),
			contentType: 'application/json;charset=utf-8',
			dataType: 'json',
			headers: {
				'X-HTTP-Method-Override': method
			},
			success: function(data, textStatus, jqXHR) {
				if (!self._isValidResponseObject(data, model)) {
					error(jqXHR, textStatus, 'Invalid response.');
					return;
				}
				instance
					.fromJSON(data)
					.resetModified()
					.setNew(false);

				if (pk && typeof instance[pk] !== 'undefined') {
					self.cache(model._table, instance[pk], instance);
				}
				def.resolve(instance);
			},
			error: error
		});
		return def.promise();
	},

	formatDateTime: function(value) {
		if (!value) {
			return null;
		}
		if (!(value instanceof Date)) {
			value = dabl.constructDate(value);
		}
		var offset = -value.getTimezoneOffset() / 60;
		offset = (offset > 0 ? '+' : '-') + dabl.sPad(Math.abs(offset));

		return value.getFullYear() + '-' + dabl.sPad(value.getMonth() + 1) + '-' + dabl.sPad(value.getDate())
			+ ' ' + dabl.sPad(value.getHours())
			+ ':' + dabl.sPad(value.getMinutes())
			+ ':' + dabl.sPad(value.getSeconds())
			+ ' ' + offset + '00';
	},

	insert: function(instance) {
		return this._save(instance, 'POST');
	},

	update: function(instance) {
		if (!instance.isModified()) {
			var def = dabl.Deferred();
			def.resolve(instance);
			return def.promise();
		}

		return this._save(instance, 'PUT');
	},

	remove: function(instance) {
		var model = instance.constructor,
			route = this._getRoute(model._url),
			pk = model.getKey(),
			self = this,
			def = dabl.Deferred(),
			error = this._getErrorCallback(def);

		jQuery.ajax({
			url: route.url(instance.toJSON()),
			type: 'POST',
			data: {},
			contentType: 'application/json;charset=utf-8',
			dataType: 'json',
			headers: {
				'X-HTTP-Method-Override': 'DELETE'
			},
			success: function(data, textStatus, jqXHR) {
				if (data && (data.error || (data.errors && data.errors.length))) {
					error(jqXHR, textStatus, 'Invalid response.');
					return;
				}
				if (pk && instance[pk]) {
					self.cache(model._table, instance[pk], null);
				}
				def.resolve(instance);
			},
			error: error
		});

		return def.promise();
	},

	find: function(model, id) {
		var route = this._getRoute(model._url),
			data = {},
			instance = null,
			q,
			def = dabl.Deferred(),
			error = this._getErrorCallback(def),
			self = this,
			pk = model.getKey();

		if (pk && arguments.length === 2 && (typeof id === 'number' || typeof id === 'string')) {
			// look for it in the cache
			instance = this.cache(model._table, id);
			if (instance) {
				def.resolve(instance);
				return def.promise();
			}
			data = {};
			data[pk] = id;
		} else {
			q = this.findQuery.apply(this, arguments);
			q.limit(1);
			data = q.getSimpleJSON();
		}

		jQuery.get(route.urlGet(data), function(data, textStatus, jqXHR) {
			if (!self._isValidResponseObject(data, model)) {
				error(jqXHR, textStatus, 'Invalid response.');
				return;
			}
			if (data instanceof Array) {
				data = data.shift();
			}
			def.resolve(model.inflate(data));
		})
		.fail(error);
		return def.promise();
	},

	findAll: function(model) {
		var q = this.findQuery.apply(this, arguments),
			route = this._getRoute(model._url),
			data = q.getSimpleJSON(),
			def = dabl.Deferred(),
			error = this._getErrorCallback(def);

		jQuery.get(route.urlGet(data), function(data, textStatus, jqXHR) {
			if (typeof data !== 'object' || data.error || (data.errors && data.errors.length)) {
				error(jqXHR, textStatus, 'Invalid response.');
				return;
			}
			if (!(data instanceof Array)) {
				data = [data];
			}
			def.resolve(model.inflateArray(data));
		})
		.fail(error);
		return def.promise();
	},

	countAll: function(model) {
		var q = this.findQuery.apply(this, arguments).setAction(dabl.Query.ACTION_COUNT),
			route = this._getRoute(model._url),
			data = q.getSimpleJSON(),
			def = dabl.Deferred(),
			error = this._getErrorCallback(def);

		jQuery.get(route.urlGet(data), function(data, textStatus, jqXHR) {
			var count = parseInt(data.total, 10);
			if (isNaN(count) || typeof data !== 'object' || data.error || (data.errors && data.errors.length)) {
				error(jqXHR, textStatus, 'Invalid response.');
				return;
			}
			def.resolve(count);
		})
		.fail(error);
		return def.promise();
	}
});

dabl.RESTAdapter = RESTAdapter;
;angular.module('dabl', [])
.factory('dabl', ['$http', '$q', function($http, $q){

	dabl.Deferred = function () {
		var def = $q.defer(),
			promise = def.promise;

		def.promise = function() {
			return promise;
		};
		return def;
	};

	var AngularRESTAdapter = dabl.RESTAdapter.extend({

		$http: null,

		init: function(urlBase) {
			this._super(urlBase);
		},

		_getErrorCallback: function(def) {
			return function(data, status, headers, config){
				var error = 'Request failed.';
				if (data) {
					if (data.error) {
						error = data.error;
					} else if (data.errors) {
						error = data.errors.join('\n');
					}
				}
				def.reject(error, data, config);
			};
		},

		_save: function(instance, method) {
			var fieldName,
				model = instance.constructor,
				value,
				route = this._getRoute(model._url),
				data = {},
				pk = model.getKey(),
				self = this,
				def = $q.defer(),
				error = this._getErrorCallback(def);

			for (fieldName in model._fields) {
				var field = model._fields[fieldName];
				value = instance[fieldName];
				if (model.isTemporalType(field.type)) {
					value = this.formatDate(value, field.type);
				}
				data[fieldName] = value;
			}

			$http({
				url: route.url(data),
				method: 'POST',
				data: data,
				headers: {
					'X-HTTP-Method-Override': method
				}
			})
			.success(function(data, status, headers, config) {
				if (!self._isValidResponseObject(data, model)) {
					error.apply(this, arguments);
					return;
				}
				instance
					.fromJSON(data)
					.resetModified()
					.setNew(false);

				if (pk && typeof instance[pk] !== 'undefined') {
					self.cache(model._table, instance[pk], instance);
				}
				def.resolve(instance);
			})
			.error(error);
			return def.promise;
		},

		update: function(instance) {
			if (!instance.isModified()) {
				var def = $q.defer();
				def.resolve(instance);
				return def.promise;
			}

			return this._save(instance, 'PUT');
		},

		remove: function(instance) {
			var model = instance.constructor,
				route = this._getRoute(model._url),
				pk = model.getKey(),
				self = this,
				def = $q.defer(),
				error = this._getErrorCallback(def);

			$http({
				url: route.url(instance.toJSON()),
				method: 'POST',
				data: {},
				headers: {
					'X-HTTP-Method-Override': 'DELETE'
				}
			})
			.success(function(data, status, headers, config) {
				if (data && (data.error || (data.errors && data.errors.length))) {
					error.apply(this, arguments);
					return;
				}
				if (pk && instance[pk]) {
					self.cache(model._table, instance[pk], null);
				}
				def.resolve(instance);
			})
			.error(error);

			return def.promise;
		},

		find: function(model, id) {
			var route = this._getRoute(model._url),
				data = {},
				instance = null,
				q,
				def = $q.defer(),
				error = this._getErrorCallback(def),
				self = this,
				pk = model.getKey();

			if (pk && arguments.length === 2 && (typeof id === 'number' || typeof id === 'string')) {
				// look for it in the cache
				instance = this.cache(model._table, id);
				if (instance) {
					def.resolve(instance);
					return def.promise;
				}
				data = {};
				data[pk] = id;
			} else {
				q = this.findQuery.apply(this, arguments);
				q.limit(1);
				data = q.getSimpleJSON();
			}

			$http
			.get(route.urlGet(data))
			.success(function(data, status, headers, config) {
				if (!self._isValidResponseObject(data, model)) {
					error.apply(this, arguments);
					return;
				}
				if (data instanceof Array) {
					data = data.shift();
				}
				def.resolve(model.inflate(data));
			})
			.error(error);
			return def.promise;
		},

		findAll: function(model) {
			var q = this.findQuery.apply(this, arguments),
				route = this._getRoute(model._url),
				data = q.getSimpleJSON(),
				def = $q.defer(),
				error = this._getErrorCallback(def);

			$http
			.get(route.urlGet(data))
			.success(function(data, status, headers, config) {
				if (typeof data !== 'object' || data.error || (data.errors && data.errors.length)) {
					error.apply(this, arguments);
					return;
				}
				if (!(data instanceof Array)) {
					data = [data];
				}
				def.resolve(model.inflateArray(data));
			})
			.error(error);
			return def.promise;
		},

		countAll: function(model) {
			var q = this.findQuery.apply(this, arguments).setAction(dabl.Query.ACTION_COUNT),
				route = this._getRoute(model._url),
				data = q.getSimpleJSON(),
				def = $q.defer(),
				error = this._getErrorCallback(def);

			$http
			.get(route.urlGet(data))
			.success(function(data, status, headers, config) {
				var count = parseInt(data.total, 10);
				if (isNaN(count) || typeof data !== 'object' || data.error || (data.errors && data.errors.length)) {
					error.apply(this, arguments);
					return;
				}
				def.resolve(count);
			})
			.error(error);
			return def.promise;
		}
	});

	dabl.AngularRESTAdapter = AngularRESTAdapter;

	return dabl;

}]);
;/*
 A JavaScript implementation of the SHA family of hashes, as
 defined in FIPS PUB 180-2 as well as the corresponding HMAC implementation
 as defined in FIPS PUB 198a

 Copyright Brian Turek 2008-2015
 Distributed under the BSD License
 See http://caligatio.github.com/jsSHA/ for more information

 Several functions taken from Paul Johnston
*/
'use strict';(function(T){function y(c,a,d){var b=0,f=[],k=0,g,e,n,h,m,u,r,p=!1,q=!1,t=[],v=[],x,w=!1;d=d||{};g=d.encoding||"UTF8";x=d.numRounds||1;n=J(a,g);if(x!==parseInt(x,10)||1>x)throw Error("numRounds must a integer >= 1");if("SHA-1"===c)m=512,u=K,r=U,h=160;else if(u=function(a,d){return L(a,d,c)},r=function(a,d,b,f){var k,e;if("SHA-224"===c||"SHA-256"===c)k=(d+65>>>9<<4)+15,e=16;else if("SHA-384"===c||"SHA-512"===c)k=(d+129>>>10<<5)+31,e=32;else throw Error("Unexpected error in SHA-2 implementation");
for(;a.length<=k;)a.push(0);a[d>>>5]|=128<<24-d%32;a[k]=d+b;b=a.length;for(d=0;d<b;d+=e)f=L(a.slice(d,d+e),f,c);if("SHA-224"===c)a=[f[0],f[1],f[2],f[3],f[4],f[5],f[6]];else if("SHA-256"===c)a=f;else if("SHA-384"===c)a=[f[0].a,f[0].b,f[1].a,f[1].b,f[2].a,f[2].b,f[3].a,f[3].b,f[4].a,f[4].b,f[5].a,f[5].b];else if("SHA-512"===c)a=[f[0].a,f[0].b,f[1].a,f[1].b,f[2].a,f[2].b,f[3].a,f[3].b,f[4].a,f[4].b,f[5].a,f[5].b,f[6].a,f[6].b,f[7].a,f[7].b];else throw Error("Unexpected error in SHA-2 implementation");
return a},"SHA-224"===c)m=512,h=224;else if("SHA-256"===c)m=512,h=256;else if("SHA-384"===c)m=1024,h=384;else if("SHA-512"===c)m=1024,h=512;else throw Error("Chosen SHA variant is not supported");e=z(c);this.setHMACKey=function(a,d,f){var k;if(!0===q)throw Error("HMAC key already set");if(!0===p)throw Error("Cannot set HMAC key after finalizing hash");if(!0===w)throw Error("Cannot set HMAC key after calling update");g=(f||{}).encoding||"UTF8";d=J(d,g)(a);a=d.binLen;d=d.value;k=m>>>3;f=k/4-1;if(k<
a/8){for(d=r(d,a,0,z(c));d.length<=f;)d.push(0);d[f]&=4294967040}else if(k>a/8){for(;d.length<=f;)d.push(0);d[f]&=4294967040}for(a=0;a<=f;a+=1)t[a]=d[a]^909522486,v[a]=d[a]^1549556828;e=u(t,e);b=m;q=!0};this.update=function(a){var c,d,g,h=0,p=m>>>5;c=n(a,f,k);a=c.binLen;d=c.value;c=a>>>5;for(g=0;g<c;g+=p)h+m<=a&&(e=u(d.slice(g,g+p),e),h+=m);b+=h;f=d.slice(h>>>5);k=a%m;w=!0};this.getHash=function(a,d){var g,m,n;if(!0===q)throw Error("Cannot call getHash after setting HMAC key");n=M(d);switch(a){case "HEX":g=
function(a){return N(a,n)};break;case "B64":g=function(a){return O(a,n)};break;case "BYTES":g=P;break;default:throw Error("format must be HEX, B64, or BYTES");}if(!1===p)for(e=r(f,k,b,e),m=1;m<x;m+=1)e=r(e,h,0,z(c));p=!0;return g(e)};this.getHMAC=function(a,d){var g,n,t;if(!1===q)throw Error("Cannot call getHMAC without first setting HMAC key");t=M(d);switch(a){case "HEX":g=function(a){return N(a,t)};break;case "B64":g=function(a){return O(a,t)};break;case "BYTES":g=P;break;default:throw Error("outputFormat must be HEX, B64, or BYTES");
}!1===p&&(n=r(f,k,b,e),e=u(v,z(c)),e=r(n,h,m,e));p=!0;return g(e)}}function b(c,a){this.a=c;this.b=a}function V(c,a,d){var b=c.length,f,k,e,l,n;a=a||[0];d=d||0;n=d>>>3;if(0!==b%2)throw Error("String of HEX type must be in byte increments");for(f=0;f<b;f+=2){k=parseInt(c.substr(f,2),16);if(isNaN(k))throw Error("String of HEX type contains invalid characters");l=(f>>>1)+n;for(e=l>>>2;a.length<=e;)a.push(0);a[e]|=k<<8*(3-l%4)}return{value:a,binLen:4*b+d}}function W(c,a,d){var b=[],f,k,e,l,b=a||[0];d=
d||0;k=d>>>3;for(f=0;f<c.length;f+=1)a=c.charCodeAt(f),l=f+k,e=l>>>2,b.length<=e&&b.push(0),b[e]|=a<<8*(3-l%4);return{value:b,binLen:8*c.length+d}}function X(c,a,d){var b=[],f=0,e,g,l,n,h,m,b=a||[0];d=d||0;a=d>>>3;if(-1===c.search(/^[a-zA-Z0-9=+\/]+$/))throw Error("Invalid character in base-64 string");g=c.indexOf("=");c=c.replace(/\=/g,"");if(-1!==g&&g<c.length)throw Error("Invalid '=' found in base-64 string");for(g=0;g<c.length;g+=4){h=c.substr(g,4);for(l=n=0;l<h.length;l+=1)e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(h[l]),
n|=e<<18-6*l;for(l=0;l<h.length-1;l+=1){m=f+a;for(e=m>>>2;b.length<=e;)b.push(0);b[e]|=(n>>>16-8*l&255)<<8*(3-m%4);f+=1}}return{value:b,binLen:8*f+d}}function N(c,a){var d="",b=4*c.length,f,e;for(f=0;f<b;f+=1)e=c[f>>>2]>>>8*(3-f%4),d+="0123456789abcdef".charAt(e>>>4&15)+"0123456789abcdef".charAt(e&15);return a.outputUpper?d.toUpperCase():d}function O(c,a){var d="",b=4*c.length,f,e,g;for(f=0;f<b;f+=3)for(g=f+1>>>2,e=c.length<=g?0:c[g],g=f+2>>>2,g=c.length<=g?0:c[g],g=(c[f>>>2]>>>8*(3-f%4)&255)<<16|
(e>>>8*(3-(f+1)%4)&255)<<8|g>>>8*(3-(f+2)%4)&255,e=0;4>e;e+=1)8*f+6*e<=32*c.length?d+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(g>>>6*(3-e)&63):d+=a.b64Pad;return d}function P(c){var a="",d=4*c.length,b,f;for(b=0;b<d;b+=1)f=c[b>>>2]>>>8*(3-b%4)&255,a+=String.fromCharCode(f);return a}function M(c){var a={outputUpper:!1,b64Pad:"="};c=c||{};a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty("b64Pad")&&(a.b64Pad=c.b64Pad);if("boolean"!==typeof a.outputUpper)throw Error("Invalid outputUpper formatting option");
if("string"!==typeof a.b64Pad)throw Error("Invalid b64Pad formatting option");return a}function J(c,a){var d;switch(a){case "UTF8":case "UTF16BE":case "UTF16LE":break;default:throw Error("encoding must be UTF8, UTF16BE, or UTF16LE");}switch(c){case "HEX":d=V;break;case "TEXT":d=function(c,d,b){var e=[],l=[],n=0,h,m,u,r,p,e=d||[0];d=b||0;u=d>>>3;if("UTF8"===a)for(h=0;h<c.length;h+=1)for(b=c.charCodeAt(h),l=[],128>b?l.push(b):2048>b?(l.push(192|b>>>6),l.push(128|b&63)):55296>b||57344<=b?l.push(224|
b>>>12,128|b>>>6&63,128|b&63):(h+=1,b=65536+((b&1023)<<10|c.charCodeAt(h)&1023),l.push(240|b>>>18,128|b>>>12&63,128|b>>>6&63,128|b&63)),m=0;m<l.length;m+=1){p=n+u;for(r=p>>>2;e.length<=r;)e.push(0);e[r]|=l[m]<<8*(3-p%4);n+=1}else if("UTF16BE"===a||"UTF16LE"===a)for(h=0;h<c.length;h+=1){b=c.charCodeAt(h);"UTF16LE"===a&&(m=b&255,b=m<<8|b>>>8);p=n+u;for(r=p>>>2;e.length<=r;)e.push(0);e[r]|=b<<8*(2-p%4);n+=2}return{value:e,binLen:8*n+d}};break;case "B64":d=X;break;case "BYTES":d=W;break;default:throw Error("format must be HEX, TEXT, B64, or BYTES");
}return d}function w(c,a){return c<<a|c>>>32-a}function q(c,a){return c>>>a|c<<32-a}function v(c,a){var d=null,d=new b(c.a,c.b);return d=32>=a?new b(d.a>>>a|d.b<<32-a&4294967295,d.b>>>a|d.a<<32-a&4294967295):new b(d.b>>>a-32|d.a<<64-a&4294967295,d.a>>>a-32|d.b<<64-a&4294967295)}function Q(c,a){var d=null;return d=32>=a?new b(c.a>>>a,c.b>>>a|c.a<<32-a&4294967295):new b(0,c.a>>>a-32)}function Y(c,a,d){return c&a^~c&d}function Z(c,a,d){return new b(c.a&a.a^~c.a&d.a,c.b&a.b^~c.b&d.b)}function R(c,a,d){return c&
a^c&d^a&d}function aa(c,a,d){return new b(c.a&a.a^c.a&d.a^a.a&d.a,c.b&a.b^c.b&d.b^a.b&d.b)}function ba(c){return q(c,2)^q(c,13)^q(c,22)}function ca(c){var a=v(c,28),d=v(c,34);c=v(c,39);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function da(c){return q(c,6)^q(c,11)^q(c,25)}function ea(c){var a=v(c,14),d=v(c,18);c=v(c,41);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function fa(c){return q(c,7)^q(c,18)^c>>>3}function ga(c){var a=v(c,1),d=v(c,8);c=Q(c,7);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function ha(c){return q(c,
17)^q(c,19)^c>>>10}function ia(c){var a=v(c,19),d=v(c,61);c=Q(c,6);return new b(a.a^d.a^c.a,a.b^d.b^c.b)}function B(c,a){var d=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(d>>>16)&65535)<<16|d&65535}function ja(c,a,d,b){var f=(c&65535)+(a&65535)+(d&65535)+(b&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(b>>>16)+(f>>>16)&65535)<<16|f&65535}function C(c,a,d,b,f){var e=(c&65535)+(a&65535)+(d&65535)+(b&65535)+(f&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(b>>>16)+(f>>>16)+(e>>>16)&65535)<<16|e&65535}function ka(c,
a){var d,e,f;d=(c.b&65535)+(a.b&65535);e=(c.b>>>16)+(a.b>>>16)+(d>>>16);f=(e&65535)<<16|d&65535;d=(c.a&65535)+(a.a&65535)+(e>>>16);e=(c.a>>>16)+(a.a>>>16)+(d>>>16);return new b((e&65535)<<16|d&65535,f)}function la(c,a,d,e){var f,k,g;f=(c.b&65535)+(a.b&65535)+(d.b&65535)+(e.b&65535);k=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(f>>>16);g=(k&65535)<<16|f&65535;f=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(k>>>16);k=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(f>>>16);return new b((k&65535)<<16|
f&65535,g)}function ma(c,a,d,e,f){var k,g,l;k=(c.b&65535)+(a.b&65535)+(d.b&65535)+(e.b&65535)+(f.b&65535);g=(c.b>>>16)+(a.b>>>16)+(d.b>>>16)+(e.b>>>16)+(f.b>>>16)+(k>>>16);l=(g&65535)<<16|k&65535;k=(c.a&65535)+(a.a&65535)+(d.a&65535)+(e.a&65535)+(f.a&65535)+(g>>>16);g=(c.a>>>16)+(a.a>>>16)+(d.a>>>16)+(e.a>>>16)+(f.a>>>16)+(k>>>16);return new b((g&65535)<<16|k&65535,l)}function z(c){var a,d;if("SHA-1"===c)c=[1732584193,4023233417,2562383102,271733878,3285377520];else switch(a=[3238371032,914150663,
812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case "SHA-224":c=a;break;case "SHA-256":c=d;break;case "SHA-384":c=[new b(3418070365,a[0]),new b(1654270250,a[1]),new b(2438529370,a[2]),new b(355462360,a[3]),new b(1731405415,a[4]),new b(41048885895,a[5]),new b(3675008525,a[6]),new b(1203062813,a[7])];break;case "SHA-512":c=[new b(d[0],4089235720),new b(d[1],2227873595),new b(d[2],4271175723),
new b(d[3],1595750129),new b(d[4],2917565137),new b(d[5],725511199),new b(d[6],4215389547),new b(d[7],327033209)];break;default:throw Error("Unknown SHA variant");}return c}function K(c,a){var d=[],b,e,k,g,l,n,h;b=a[0];e=a[1];k=a[2];g=a[3];l=a[4];for(h=0;80>h;h+=1)d[h]=16>h?c[h]:w(d[h-3]^d[h-8]^d[h-14]^d[h-16],1),n=20>h?C(w(b,5),e&k^~e&g,l,1518500249,d[h]):40>h?C(w(b,5),e^k^g,l,1859775393,d[h]):60>h?C(w(b,5),R(e,k,g),l,2400959708,d[h]):C(w(b,5),e^k^g,l,3395469782,d[h]),l=g,g=k,k=w(e,30),e=b,b=n;a[0]=
B(b,a[0]);a[1]=B(e,a[1]);a[2]=B(k,a[2]);a[3]=B(g,a[3]);a[4]=B(l,a[4]);return a}function U(c,a,b,e){var f;for(f=(a+65>>>9<<4)+15;c.length<=f;)c.push(0);c[a>>>5]|=128<<24-a%32;c[f]=a+b;b=c.length;for(a=0;a<b;a+=16)e=K(c.slice(a,a+16),e);return e}function L(c,a,d){var q,f,k,g,l,n,h,m,u,r,p,v,t,w,x,y,z,D,E,F,G,H,A=[],I;if("SHA-224"===d||"SHA-256"===d)r=64,v=1,H=Number,t=B,w=ja,x=C,y=fa,z=ha,D=ba,E=da,G=R,F=Y,I=e;else if("SHA-384"===d||"SHA-512"===d)r=80,v=2,H=b,t=ka,w=la,x=ma,y=ga,z=ia,D=ca,E=ea,G=aa,
F=Z,I=S;else throw Error("Unexpected error in SHA-2 implementation");d=a[0];q=a[1];f=a[2];k=a[3];g=a[4];l=a[5];n=a[6];h=a[7];for(p=0;p<r;p+=1)16>p?(u=p*v,m=c.length<=u?0:c[u],u=c.length<=u+1?0:c[u+1],A[p]=new H(m,u)):A[p]=w(z(A[p-2]),A[p-7],y(A[p-15]),A[p-16]),m=x(h,E(g),F(g,l,n),I[p],A[p]),u=t(D(d),G(d,q,f)),h=n,n=l,l=g,g=t(k,m),k=f,f=q,q=d,d=t(m,u);a[0]=t(d,a[0]);a[1]=t(q,a[1]);a[2]=t(f,a[2]);a[3]=t(k,a[3]);a[4]=t(g,a[4]);a[5]=t(l,a[5]);a[6]=t(n,a[6]);a[7]=t(h,a[7]);return a}var e,S;e=[1116352408,
1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,
430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];S=[new b(e[0],3609767458),new b(e[1],602891725),new b(e[2],3964484399),new b(e[3],2173295548),new b(e[4],4081628472),new b(e[5],3053834265),new b(e[6],2937671579),new b(e[7],3664609560),new b(e[8],2734883394),new b(e[9],1164996542),new b(e[10],1323610764),new b(e[11],3590304994),new b(e[12],4068182383),new b(e[13],991336113),new b(e[14],
633803317),new b(e[15],3479774868),new b(e[16],2666613458),new b(e[17],944711139),new b(e[18],2341262773),new b(e[19],2007800933),new b(e[20],1495990901),new b(e[21],1856431235),new b(e[22],3175218132),new b(e[23],2198950837),new b(e[24],3999719339),new b(e[25],766784016),new b(e[26],2566594879),new b(e[27],3203337956),new b(e[28],1034457026),new b(e[29],2466948901),new b(e[30],3758326383),new b(e[31],168717936),new b(e[32],1188179964),new b(e[33],1546045734),new b(e[34],1522805485),new b(e[35],2643833823),
new b(e[36],2343527390),new b(e[37],1014477480),new b(e[38],1206759142),new b(e[39],344077627),new b(e[40],1290863460),new b(e[41],3158454273),new b(e[42],3505952657),new b(e[43],106217008),new b(e[44],3606008344),new b(e[45],1432725776),new b(e[46],1467031594),new b(e[47],851169720),new b(e[48],3100823752),new b(e[49],1363258195),new b(e[50],3750685593),new b(e[51],3785050280),new b(e[52],3318307427),new b(e[53],3812723403),new b(e[54],2003034995),new b(e[55],3602036899),new b(e[56],1575990012),
new b(e[57],1125592928),new b(e[58],2716904306),new b(e[59],442776044),new b(e[60],593698344),new b(e[61],3733110249),new b(e[62],2999351573),new b(e[63],3815920427),new b(3391569614,3928383900),new b(3515267271,566280711),new b(3940187606,3454069534),new b(4118630271,4000239992),new b(116418474,1914138554),new b(174292421,2731055270),new b(289380356,3203993006),new b(460393269,320620315),new b(685471733,587496836),new b(852142971,1086792851),new b(1017036298,365543100),new b(1126000580,2618297676),
new b(1288033470,3409855158),new b(1501505948,4234509866),new b(1607167915,987167468),new b(1816402316,1246189591)];"function"===typeof define&&define.amd?define(function(){return y}):"undefined"!==typeof exports?"undefined"!==typeof module&&module.exports?module.exports=exports=y:exports=y:T.jsSHA=y})(this);
;'use strict';

angular.module('dablApi', [
	'dabl'
]);'use strict';

angular.module('dablApi')

.service('dablAuth', [
	'$rootScope',
	'$localstorage',
function (
	$rootScope,
	$localstorage
) {
		var obj = {}, loggedInUser = null;

		obj.setLoggedInUser = function (user) {
			loggedInUser = user;
		};

		obj.setUser = function (user) {
			var olduser = loggedInUser;
			obj.setLoggedInUser(user);

			if (olduser === null && user && user.id) {
				$rootScope.$broadcast('dabl-auth.user.logged-in');

			} else if (user === null) {
				$rootScope.$broadcast('dabl-auth.user.logged-out');
			}

			$localstorage.set('user', user);
		};

		obj.getUser = function () {
			return loggedInUser;
		};

		obj.getToken = function () {
			if (loggedInUser && typeof loggedInUser.authentication_token !== 'undefined') {
				return loggedInUser.authToken;
			}
			return null;
		};

		obj.getEmail = function () {
			if (loggedInUser && typeof loggedInUser.email !== 'undefined') {
				return loggedInUser.email;
			}
			return null;
		};

		obj.isLoggedIn = function () {
			return (
				loggedInUser &&
				typeof loggedInUser.email !== 'undefined' &&
				typeof loggedInUser.authToken !== 'undefined'
			);
		};

		obj.checkAuthorization = function (toState) {
			return !((
					typeof toState === 'undefined' ||
					typeof toState.data === 'undefined' ||
					typeof toState.data.bypassAuth === 'undefined' ||
					!toState.data.bypassAuth
				) &&
				!obj.isLoggedIn()
			);
		};

		obj.globalAdminIsLoggedIn = function () {
			var user = obj.getUser();
			return user && user.type === 1;
		};

		obj.projectManagerIsLoggedIn = function () {
			var user = obj.getUser();
			return user && user.type === 2;
		};

		obj.reset = function() {
			obj.setUser(null);
		};

		obj.passwordIsValid = function(password) {
			return (password.length >= 8 && password.match(/[A-Z]+/) && password.match(/[a-z]+/) && password.match(/[0-9]+/));
		}

		var u = $localstorage.get('user');
		if (u) {
			obj.setUser(u);
		}

		return obj;
	}
]);
;'use strict';

angular.module('dablApi')
.factory('dablHttpInterceptor', [
	'dablApiConfig',
	'dablSecurity',
	'dablAuth',
	'$q',
	'$rootScope',
function (
	dablApiConfig,
	dablSecurity,
	dablAuth,
	$q,
	$rootScope
) {
	function getAuthHeader(hmac) {
		return dablApiConfig.headerName + dablApiConfig.hash + ':' + hmac;
	}

	function generateHeaders(endpoint) {
		var date = (Date.now() / 1000) | 0;
		var hmac = dablSecurity.getHMAC(dablApiConfig.secret, [endpoint, date].join(','));
		var obj = {
			'X-Timestamp': date,
			'Authorization': getAuthHeader(hmac)
		};
		if (dablAuth.isLoggedIn()) {
			obj['X-Email'] = dablAuth.getUser()['email'];
			obj['X-User-Token'] = dablAuth.getUser()['authToken'];
		}
		return obj;
	}

	return {
		request: function (config) {
			var headers = generateHeaders(config.url);

			if (typeof config['headers']['X-Timestamp'] !== 'undefined') {
				return config;
			}

			for(var header in headers) {
				config['headers'][header] = headers[header];
			}

			return config;
		},
		responseError: function(rejection) {
			$rootScope.$broadcast('dablApi.response.error', rejection);
			return $q.reject(rejection);
		},
		generateHeaders: generateHeaders
	};
}]);
;'use strict';

angular.module('dablApi')

.service('jsSHA', function() {
	if (typeof jsSHA === 'undefined') {
		throw new Error('jsSHA is not included');
	}

	return jsSHA;
});;'use strict';

angular.module('dablApi')

.factory('$localstorage', [
	'$window',
function(
	$window
){
	return {
		get: function (key, defaultValue) {
			var val = $window.localStorage[key];
			return val ? JSON.parse(val) : defaultValue;
		},
		set: function (key, value) {
			$window.localStorage[key] = JSON.stringify(value);
		},
		remove: function(key) {
			return delete $window.localStorage[key];
		}
	};
}]);
;'use strict';
/*global jsSHA: false */
angular.module('dablApi')
.factory('dablSecurity', [
	'jsSHA',
function(
	jsSHA
){
	var obj = {};

	obj.getHMAC = function(skey, content){
		var hasher = new jsSHA('SHA-512', 'TEXT');
		hasher.setHMACKey(skey, 'TEXT');
		hasher.update(content);
		return hasher.getHMAC('HEX');
	};

	obj.getHash = function(content, type) {
		type = type || 'SHA-512';
		var hasher = new jsSHA(type, 'TEXT');
		hasher.update(content);
		return hasher.getHash('HEX');
	};

	obj.encode64 = function(d) {
		return btoa(d);
	};

	obj.decode64 = function(d) {
		return atob(d);
	};

	return obj;
}]);
;'use strict';

angular.module('dablApi')
.factory('dablServerApi', [
	'$q',
	'$http',
	'dablApiConfig',
function(
	$q,
	$http,
	dablApiConfig
){
	var serverApi = {
		makeRequest: function(endpoint, data, method, contentType) {
			data = data || '';
			method = method ? method.toUpperCase() : (data === '' ? 'GET' : 'POST');
			if (endpoint.charAt(0) === '/') {
				endpoint = endpoint.substring(1);
			}

			var deferredAbort = $q.defer(),
				options = {
					method: method,
					url: dablApiConfig.baseUrl + '/' + endpoint,
					data: data,
					timeout: deferredAbort.promise
				};

			if (typeof contentType !== 'undefined') {
				options['headers'] = {'Content-Type': contentType};
			}

			//console.log('making request: ', JSON.stringify(options));

			var promise = $http(options).then(function(r){
				return r.data;
			}, function(e){
				return $q.reject(e);
			});

			promise.abort = function() {
				deferredAbort.resolve();
			};

			promise.finally(function(){
				promise.abort = angular.noop;
				deferredAbort = promise = null;
			});
			return promise;
		},
		serialize: function (obj, prefix) {
			//Method from http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
			var str = [];
			for (var p in obj) {
				if (obj.hasOwnProperty(p)) {
					var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
					str.push(typeof v === 'object' ?
						serverApi.serialize(v, k) :
						encodeURIComponent(k) + '=' + encodeURIComponent(v));
				}
			}
			return str.join('&');
		},
		unserialize: function (query) {
			var result = {};
			var spl = query.split('&');
			angular.forEach(spl, function(val) {
				if (val.length < 1) {
					return;
				}
				var sides = val.split('=');
				if (sides[0].indexOf('[') !== -1) {
					var start = sides[0].indexOf('[');
					var end = sides[0].indexOf(']');
					var key;
					var idx;
					++start;
					end = end - start;
					idx = sides[0].substr(0, start - 1);
					key = sides[0].substr(start, end);
					if (typeof result[idx] === 'undefined') {
						result[idx] = {};
					}
					result[idx][key] = sides[1];
				} else {
					result[decodeURIComponent(sides[0])] = decodeURIComponent(sides[1]);
				}
			});
			return result;
		}
	};

	return serverApi;
}]);
;'use strict';

angular.module('dablApi')

.factory('dablSiteUrl', [
	'dablApiConfig',
function(
	dablApiConfig
) {
	var version = 16;

	return function(url, rev){

		url = url || '';

		if (url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {
			url = dablApiConfig.baseUrl + '/' + (url ? url : '');
		}

		if (rev) {
			url += '?v=' + version;
		}

		return url;
	};
}]);
;'use strict';

angular.module('dablApi')
.service('dablUserApi', [
	'dablSecurity',
	'dablServerApi',
function(
	dablSecurity,
	dablServerApi
){
	var obj = {},
		url = 'users';

	obj.signIn = function(username, password) {
		var endpoint = url + '/login',
			contentType = 'application/x-www-form-urlencoded',
			data = 'credentials=' + dablSecurity.encode64([username, password].join(':'));
		return dablServerApi.makeRequest(endpoint, data, 'post', contentType);
	};

	obj.signOut = function() {
		var endpoint = url + '/login/logout';
		return dablServerApi.makeRequest(endpoint, null, 'get');
	};

	return obj;
}]);
;'use strict';

angular.module('dablApi')

.factory('dablModel', [
	'dabl',
	'dablApiConfig',
	function(
		dabl,
		dablApiConfig
	) {
		var adapter = new dabl.AngularRESTAdapter(dablApiConfig.baseUrl + '/');
		return dabl.Model.extend('model', {
			adapter: adapter,
			fields: {}
		});
	}
]);
