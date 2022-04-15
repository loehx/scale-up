
const assertion = module.exports = {

    assert(cond, message, ...args) {
        if (typeof cond === 'function') {
            if (!cond()) {
                assertion._throwAssertionFailed(cond.toString(), [message, ...args]);
            }
        }
        else if (!cond) {
            assertion._throwAssertionFailed(message, args);
        }
    },

    _throwAssertionFailed(message, args) {
        const error = new Error('Assertion Failed: ' + (message || 'True was expected.'), ...args);
        error.args = args;
        throw error;
    },

    ensure(value, validator) {
        let valid;
        let err;

        if (typeof validator === 'undefined') {
            if (isNaN(value) && value !== value) {
                err = 'Value should not be NaN';
            }
            if (value === null) {
                err = 'Value should not be null';
            }
            if (typeof value === 'undefined') {
                err = 'Value should not be undefined';
            }
        }
        else if (typeof validator === 'function') {
            const match = validator.toString().match(/^\s*function (\w+)/)
            const type = match && match[1];
            if (!type) {
                if (!validator(value)) {
                    err = 'Value should be valid: ' + validator.toString()
                }
            }
            else if (/^(String|Number|Boolean|Function|Symbol)$/.test(type)) {
                const t = typeof value;
                valid = t === type.toLowerCase();
                // for primitive wrapper objects
                if (!valid) {
                    if (t === 'object') {
                        if (!(value instanceof type)) {
                            err = 'Value should be an instance of type: ' + type;
                        }
                    }
                    else {
                        err = 'Value should be of type: ' + type;
                    }
                }
            }
            else if (type === 'Object') {
                let valid = Object.prototype.toString.call(value) === '[object Object]'
                if (!valid) {
                    err = 'Value should be a plain object';
                }
            } else if (type === 'Array') {
                if (!Array.isArray(value)) {
                    err = 'Value should be an array';
                }
            } else {
                if (!(value instanceof type)) {
                    err = 'Value should be an instance of "' + type + '"';
                }
            }
        }
        else if (Array.isArray(validator)) {
            if (validator.indexOf(value) === -1) {
                err = 'Value should be one of these values: ' + validator.join(', ');
            }
        }

        if (err) {
            const error = new Error('Ensure Failed: ' + err);
            error.value = value;
            throw error;
        }
    }
}