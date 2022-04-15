const { Data, DataSeries } = require('../../src/data');

test('new Data()', () => {
	expect(() => new Data()).toThrow(Error);
})

test('new Data(...)', () => {
	const now = new Date();
	const data = new Data({
		timestamp: new Date(),
		low: 0,
		high: 10,
		open: 2,
		close: 8
	});

	expect(data.timestamp).toStrictEqual(now);
	expect(data.low).toBe(0);
	expect(data.high).toBe(10);
	expect(data.open).toBe(2);
	expect(data.close).toBe(8);

	expect(data.mid).toBe(5);
	expect(data.hl2).toBe(5);
	expect(data.ohlc4).toBe(5);

	expect(data.progress).toBe(3); // 300% increase
})

test('new Data(...).toString()', () => {
	const data = new Data({
		timestamp: new Date(2020,0,1),
		low: 1,
		high: 1,
		open: 1,
		close: 1
	});
	expect(data.toString()).toBe('[Data(2020-01-01T00:00:00+01:00 1o 1c 1l 1h)]');
})

test('Data.random()', () => {
	expect(() => Data.random()).not.toThrow();
})

test('new Data() instanceof Data', () => {
	expect(Data.random() instanceof Data).toBe(true)
})

test('Data validation -> close', () => {
	const data = {
		timestamp: new Date(),
		low: 0,
		high: 10,
		open: 0,
		close: 11
	};
	expect(() => new Data(data)).toThrow('Assertion Failed: .close (11) should be equal or smaller than .high (10)');
})

test('Data validation -> open', () => {
	const data = {
		timestamp: new Date(),
		low: 0,
		high: 10,
		open: -1,
		close: 10
	};
	expect(() => new Data(data)).toThrow('Assertion Failed: .open (-1) should be equal or greater than .low (0)');
})

test('Data validation -> timestamp', () => {
	jest.spyOn(console, 'warn').mockImplementation(() => {});
	const data = {
		...Data.random(),
		timestamp: 'BAD_DATETIME',
	};
	expect(() => new Data(data)).toThrow('Assertion Failed: timestamp is not valid');
})

test('.isAttached', () => {
	const data = Data.random();
	expect(data.isAttached).toBe(false);
})

test('.toJSON()', () => {
	const data = new Data({
		timestamp: '2020-01-01T00:00:00',
		low: 1,
		high: 1,
		open: 1,
		close: 1
	});
	
	const json = JSON.stringify(data);
	expect(json).toBe('{"timestamp":"2020-01-01T00:00:00.000Z\","low":1,"high":1,"open":1,"close":1}');
})

test('.getPrev()', () => {
	const series = DataSeries.mock(10, 1, 'hour');
	const data = series.get(5);
	expect(data.getPrev(1).length).toBe(1);
	expect(data.getPrev(2, true).length).toBe(2);
	expect(data.getPrev(2, true)[0]).toStrictEqual(series.get(4));
	expect(data.getPrev(2, true)[1]).toStrictEqual(data);
	expect(data.getPrev(10, true).length).toBe(6);

	expect(data.getPrev(10, false, true).length).toBe(10);
})

test('.getCandlePattern()', () => {
	const series = DataSeries.mock(5, 1, 'hour');
	const pattern = series.last.getCandlePattern();

	expect(pattern.abandonedbaby).toBe(0); 
	expect(pattern.bearishengulfingpattern).toBe(0); 
	expect(pattern.bearishharami).toBe(0); 
	expect(pattern.bearishharamicross).toBe(0); 
	expect(pattern.bearishmarubozu).toBe(0); 
	expect(pattern.bearishspinningtop).toBe(1); 
	expect(pattern.bullishengulfingpattern).toBe(0); 
	expect(pattern.bullishharami).toBe(0); 
	expect(pattern.bullishharamicross).toBe(0); 
	expect(pattern.bullishmarubozu).toBe(0); 
	expect(pattern.bullishspinningtop).toBe(0); 
	expect(pattern.darkcloudcover).toBe(0); 
	expect(pattern.doji).toBe(0); 
	expect(pattern.downsidetasukigap).toBe(0); 
	expect(pattern.dragonflydoji).toBe(0); 
	expect(pattern.eveningdojistar).toBe(0); 
	expect(pattern.eveningstar).toBe(0); 
	expect(pattern.gravestonedoji).toBe(0); 
	expect(pattern.morningdojistar).toBe(0); 
	expect(pattern.morningstar).toBe(0); 
	expect(pattern.piercingline).toBe(0); 
	expect(pattern.threeblackcrows).toBe(0); 
	expect(pattern.threewhitesoldiers).toBe(0);
})