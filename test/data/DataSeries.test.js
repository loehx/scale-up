const { Data, DataSeries, DataFactory } = require('../../src/data');

test('new DataSeries()', () => {
	expect(() => new DataSeries()).toThrow(Error);
})

test('new DataSeries()', () => {
	const data = [
		Data.random(),
		Data.random(),
	];
	const series = new DataSeries(data);
	expect(series.first).toStrictEqual(data[0])
	expect(series.last).toStrictEqual(data[1])
	expect(series.length).toBe(2);
	expect(series.from).toBe(series.first.timestamp);
	expect(series.to).toBe(series.last.timestamp);
})

test('new DataSeries(BAD_DATA)', () => {
	const data = [
		'BAD DATA'
	];
	expect(() => new DataSeries(data)).toThrow('Assertion Failed: () => d instanceof Data')
})

test('.addData', () => {
	const series = new DataSeries([
		Data.create('2000-01-01T00:00:00', 100, 100, 105, 106),
		Data.create('2000-01-01T01:00:00', 102, 105, 110, 112),
		/* added later */
		Data.create('2000-01-01T04:00:00', 95, 105, 97, 107),
		Data.create('2000-01-01T05:00:00', 55, 97, 80, 110),
	])
	
	expect(series.length).toBe(4);

	series.addData([		
		Data.create('2000-01-01T02:00:00', 102, 110, 112, 112),
		Data.create('2000-01-01T03:00:00', 104, 112, 105, 112),
	])

	expect(series.length).toBe(6);
})

test('.toShuffledArray', () => {
	const data = [
		Data.random(),
		Data.random(),
	];
	const series = new DataSeries(data);
	const shuffled = series.toShuffledArray();
	expect(shuffled.length).toBe(2);
	expect(shuffled instanceof DataSeries).toBe(false)
})

test('.high, .low, ...', () => {
	const data = [
		new Data({
			timestamp: new Date(),
			low: 0,
			high: 10,
			open: 2,
			close: 8
		})
	];
	const series = new DataSeries(data);

	expect(series.low).toBe(0);
	expect(series.high).toBe(10);
	expect(series.open).toBe(2);
	expect(series.close).toBe(8);
	expect(series.progress).toBe(3); // 300% rise
})

test('.avg', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	expect(series.length).toBe(5);

	expect(series.avgClose).toBe(4);
	expect(series.avgOpen).toBe(3);
	expect(series.avgLow).toBe(2);
	expect(series.avgHigh).toBe(5);
})

test('.mock()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	expect(series.length).toBe(5);

	expect(series.lows).toStrictEqual([0, 1, 2, 3, 4])
	expect(series.opens).toStrictEqual([1, 2, 3, 4, 5])
	expect(series.closes).toStrictEqual([2, 3, 4, 5, 6])
	expect(series.highs).toStrictEqual([3, 4, 5, 6, 7])
})

test('.get()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	expect(series.get(0).open).toBe(1);
	expect(series.get(1).open).toBe(2);
})

test('.getSMA()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	expect(series.getSMA(2)).toStrictEqual([null, 2.5, 3.5, 4.5, 5.5]);
	expect(series.getSMA(3)).toStrictEqual([null, null, 3, 4, 5]);
})

test('.getWMA()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	expect(series.getWMA(2)).toStrictEqual([null, 2.6666666666666665, 3.6666666666666665, 4.666666666666667, 5.666666666666667]);
	expect(series.getWMA(3)).toStrictEqual([null, null, 3.333333333333333, 4.333333333333333, 5.333333333333334]);
})

test('.getRSI()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	expect(series.getRSI(2)).toStrictEqual([null, null, 100, 100, 100]);
	expect(series.getRSI(3)).toStrictEqual([null, null, null, 100, 100]);
})

test('.getATR()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	expect(series.getATR(2)).toStrictEqual([null, null, 3, 3, 3]);
	expect(series.getATR(3)).toStrictEqual([null, null, null, 3, 3]);
})

test('.getCandlePatterns()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	const patterns = series.getCandlePatterns();
	expect(patterns.bearishspinningtop).toStrictEqual([null, null, 1, 1, 1]);
	expect(patterns.abandonedbaby).toStrictEqual([null, null, null, 0, 0]);
})

test('.toArray()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	const array = series.toArray();
	expect(array.length).toBe(5);
	expect(array[0]).toBe(series.get(0));
	expect(array[4]).toBe(series.get(4));
})

test('.toJSON()', () => {
	const series = DataSeries.mock(2, 1, 'hour');
	series.getSMA(2);
	const json = series.toJSON();
	
	const parsed = DataSeries.parseJSON(json);
	expect(series.get(0).toString()).toBe(parsed.get(0).toString());
})


test('.subscribe()', () => {
	const series = DataSeries.mock(2, 1, 'hour');
	const should = Data.random();

	return new Promise(resolve => {
		series.subscribe((data) => {
			expect(data[0]).toStrictEqual(should);
			resolve();
		})
		series.addData(should);
	});
})

test('.getResolution() -> 1h', () => {
	const series = DataSeries.mock(2, 1, 'hour');
	expect(series.getResolution()).toBe('1h');
})

test('.getResolution() -> 1d', () => {
	const series = new DataSeries([
		Data.create('2000-01-01T00:00:00', 1, 1, 1, 1),
		Data.create('2000-01-02T00:00:01', 1, 1, 1, 1)
	])
	expect(series.getResolution()).toBe('1d');
})

test('.getResolution() -> 5m', () => {
	const series = new DataSeries([
		Data.create('2000-01-01T00:00:00', 1, 1, 1, 1),
		Data.create('2000-01-01T00:05:11', 1, 1, 1, 1)
	])
	expect(series.getResolution()).toBe('5m');
})

test('.getResolution() -> ?', () => {
	const series = new DataSeries([
		Data.create('2000-01-01T00:00:00', 1, 1, 1, 1)
	])
	expect(series.getResolution()).toBe('?');
})
