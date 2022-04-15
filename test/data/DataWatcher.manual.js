
const { Data, DataSeries, DataWatcher, Symbols, DataFactory } = require('../../src/data');
const { ensure } = require('../../src/shared/assertion');
const { Log } = require('../../src/shared/log');

(async () => {
	const log = Log.consoleLog('ManualTest');
	const factory = new DataFactory(log);
	const series = await factory.getDataSeries(Symbols.NASDAQ_HOURLY_HISTORICAL);
	const watcher = new DataWatcher(factory, Symbols.NASDAQ_HOURLY);

	// for await (let data of watcher.watch(100)) {
	// 	ensure(data, Array);
	// 	series.addData(data);
	// 	console.log('added ' + data.length + ' datasets to ' + series.toString());
	// }

})();