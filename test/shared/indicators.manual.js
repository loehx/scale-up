const data = require('../../src/data');
const { DataSeries, Data, DataFactory, Symbols } = require('../../src/data');
const indicators = require('../../src/shared/indicators');
const { plot2d } = require('../../src/shared/plotting');
const util = require('../../src/shared/util');

(async () => {

    const result = [];

    const factory = new DataFactory();
    const data = await factory.getDataSeries(Symbols.NASDAQ_HOURLY_HISTORICAL, { limit: 1000 });

    for (const symbolName of indicators.getIndicators()) {
        const period = 14;
        
        const values = indicators.get(symbolName, period, data.getOpenCloseHighLowVolume());
        const plotting = {};
        if (Array.isArray(values[0])) {
            values[0].forEach((_, i) => {
                plotting[symbolName + '#' + (i+1)] = values.map(k => k[i]);
            });
        }
        else {
            plotting[symbolName] = values;
        }
        result.push(plotting);
    }


    plot2d(...result.map(k => ({
        scaleMinMax: true,
        x: data.timestamps,
        'Close': data.closes,
        ...k
    })))

})();
