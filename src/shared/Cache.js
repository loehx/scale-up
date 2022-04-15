const path = require('path');
const fs = require("fs");
const config = require("../../config");
const { assert } = require('./assertion');
class Cache {
	constructor(storageKey, beautify = false) {
		this.beautify = beautify;
		const directory = config['cache.directory'];
		assert(() => config['cache.directory']);
		this.basePath = path.join(directory, storageKey);
		this.basePath = path.resolve(this.basePath);
		fs.mkdirSync(this.basePath, { recursive: true });
	}

	get length() {
		let count = 0;
		return fs.readdirSync(this.basePath, () => count++).length;
	}

	setItem(key, value) {
		const data = this.beautify ? JSON.stringify(value, null, 4) : JSON.stringify(value);
		fs.writeFileSync(this._filePath(key), data, 'utf8');
	}

	getItem(key) {
		if (this.hasItem(key)) {
			return require(this._filePath(key));
		}
		return null;
	}

	hasItem(key) {
		return fs.existsSync(this._filePath(key));
	}

	getCached(key, getter) {
		const cached = this.getItem(key);
		if (cached) {
			return cached;
		}
		const item = getter();
		this.setItem(key, item);
		return item;
	}

	async getCachedAsync(key, getter) {
		const cached = this.getItem(key);
		if (cached) {
			return cached;
		}
		const item = await getter();
		this.setItem(key, item);
		return item;
	}

	clear() {
		const files = fs.readdirSync(this.basePath);
		for(const file of files) {
			fs.unlinkSync(path.join(this.basePath, file));
		}
		// fs.rmdirSync(this.basePath, { recursive: true });
		// fs.mkdirSync(this.basePath, { recursive: true });
	}

	removeItem(key) {
		if (this.hasItem(key)) {
			fs.unlinkSync(this._filePath(key));
		}
	}

	_filePath(key) {
		return path.join(this.basePath, this._key(key) + '.json');
	}

	_key(key) {
		return key.replace(/[\\/:"*?<>|]+/gi, '-').toLowerCase();
	}
}

module.exports = Cache;