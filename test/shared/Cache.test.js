const Cache = require("../../src/shared/Cache")

describe('Cache', () => {
	
	test('setItem & getItem', () => {
		const cache = new Cache('test-a');
		cache.clear();
		cache.setItem('test', { 'test': 123 });
		expect(cache.length).toBe(1)
		expect(cache.getItem('test')).toStrictEqual({ 'test': 123 })
		cache.removeItem('test');
		expect(cache.length).toBe(0);
	})

	// test('using properties', () => {
	// 	const cache = new Cache('test-b');
	// 	cache.clear();
	// 	cache.test = { 'test': 123 };
	// 	expect(cache.length).toBe(1)
	// 	expect(cache.test).toStrictEqual({ 'test': 123 })
	// 	cache.removeItem('test');
	// })

	test('falsify', () => {
		{
			const cache = new Cache('test-c');
			cache.clear();
			cache.setItem('test', { 'test': 123 });
		}
		{
			const cache = new Cache('test-c-123');
			expect(cache.length).toBe(0);
			expect(cache.getItem('test')).toBe(null);
		}
		{
			const cache = new Cache('test-c');
			expect(cache.length).toBe(1)
			expect(cache.getItem('test')).toStrictEqual({ 'test': 123 })
			cache.clear();
			expect(cache.length).toBe(0)
		}
	})

})