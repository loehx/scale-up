
module.exports = class MemCache {

	constructor(maxItems = 100) {
		this.maxItems = maxItems;
		this.map = new Map();
		this.keys = [];
	}

	has(name) {
		return this.map.has(name);
	}

	get(name, getter) {
		const cached = this.map.get(name);
		if (typeof cached !== 'undefined') {
			return cached;
		}
		const value = getter();
		this.set(name, value);
		return value;
	}

	set(name, value) {
		this.map.set(name, value);
		const index = this.keys.indexOf(name);
		if (index !== -1) {
			this.keys.splice(index, 1);
		}
		this.keys.push(name);

		if (this.keys.length > this.maxItems) {
			const removed = this.keys.shift();
			this.map.delete(removed);
		}
	}
}