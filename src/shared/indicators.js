
const technicalindicators = require('technicalindicators');
const { assert, ensure } = require('./assertion');
const util = require('./util');
const {
	ATR,
	SMA,
	RSI,
	WMA
} = technicalindicators;



const CANDLE_PATTERNS = {
	// bullish: 20,
	// // bearish: 4,
	abandonedbaby: 3,
	doji: 2,
	bearishengulfingpattern: 2,
	bullishengulfingpattern: 2,
	darkcloudcover: 2,
	downsidetasukigap: 3,
	dragonflydoji: 2,
	gravestonedoji: 2,
	bullishharami: 2,
	bearishharami: 2,
	bullishharamicross: 2,
	bearishharamicross: 2,
	eveningdojistar: 3,
	eveningstar: 3,
	morningdojistar: 3,
	morningstar: 3,
	bullishmarubozu: 2,
	bearishmarubozu: 2,
	piercingline: 2,
	bullishspinningtop: 2,
	bearishspinningtop: 2,
	threeblackcrows: 3,
	threewhitesoldiers: 3,
	//bullishhammer: 2,
	//bearishhammer: 2,
	//bullishinvertedhammer: 2,
	//bearishinvertedhammer: 2,
	hammerpattern: 5,
	hangingman: 5,
	shootingstar: 5,
	tweezertop: 5,
	tweezerbottom: 5,
};

const indicators = module.exports = {

	getSMA(values) {
		ensure(values, Array);
		assert(() => values.length > 0);
		return SMA.calculate({
			period: values.length,
			values
		})[0];
	},

	getSMAs(period, values) {
		return [
			...new Array(period - 1).fill(null),
			...SMA.calculate({
				period,
				values
			})
		];
	},

	getWMA(values) {
		ensure(values, Array);
		assert(() => values.length > 0);
		return WMA.calculate({
			period: values.length,
			values
		})[0];
	},

	getWMAs(period, values) {
		return [
			...new Array(period - 1).fill(null),
			...WMA.calculate({
				period,
				values
			})
		];
	},

	getRSI(values) {
		ensure(values, Array);
		assert(() => values.length > 1);
		const r = RSI.calculate({
			period: values.length - 1,
			values
		})
		assert(() => r.length === 1);
		return r[0];
	},

	getRSIs(period, values) {
		return [
			...new Array(period).fill(null),
			...RSI.calculate({
				period,
				values
			})
		];
	},

	getATR(highs, lows, closes) {
		ensure(highs, Array);
		ensure(lows, Array);
		ensure(closes, Array);
		assert(() => highs.length >= 2);
		assert(() => highs.length === lows.length);
		assert(() => lows.length === closes.length);
		return ATR.calculate({
			period: highs.length - 1,
			high: highs,
			low: lows,
			close: closes
		})[0]
	},

	getATRs(period, highs, lows, closes) {
		return [
			...new Array(period).fill(null),
			...ATR.calculate({
				period,
				high: highs,
				low: lows,
				close: closes
			})
		];
	},


	getCandlePattern(open, high, close, low) {
		ensure(open, Array);
		ensure(high, Array);
		ensure(close, Array);
		ensure(low, Array);
		assert(() => open.length >= 4);
		assert(() => open.length === high.length);
		assert(() => high.length === close.length);
		assert(() => close.length === low.length);
		const result = {};

		for (let name in CANDLE_PATTERNS) {

			const period = CANDLE_PATTERNS[name];
			const fn = technicalindicators[name];
			assert(fn != null, 'technicalindicators.' + name + ' must be defined.');

			if (open.length < period) {
				result[name] = 0;
				continue;
			}

			result[name] = fn({
				open: open.slice(open.length - period),
				close: close.slice(close.length - period),
				high: high.slice(high.length - period),
				low: low.slice(low.length - period),
			}) ? 1 : 0;
		}

		return result;
	},


	getCandlePatterns(open, high, close, low) {
		ensure(open, Array);
		ensure(high, Array);
		ensure(close, Array);
		ensure(low, Array);
		assert(() => open.length === high.length);
		assert(() => high.length === close.length);
		assert(() => close.length === low.length);
		const total = open.length;
		const patternCount = Object.values(CANDLE_PATTERNS).length;
		const result = {};

		for (let name in CANDLE_PATTERNS) {
			const period = CANDLE_PATTERNS[name];

			const res = result[name] = new Array(total).fill(null);

			const fn = technicalindicators[name];
			assert(fn != null, 'technicalindicators.' + name + ' must be defined.');

			for (let i = 0; i < total; i++) {
				if (i >= period) {
					const r = fn({
						open: open.slice(i - period, i + 1),
						high: high.slice(i - period, i + 1),
						close: close.slice(i - period, i + 1),
						low: low.slice(i - period, i + 1),
					})

					ensure(r, Boolean);
					res[i] = r ? 1 : 0;
				}
			}
		}

		return result;
	},

	get(symbol, period, data) {

		if (typeof symbol === 'string') {
			assert(symbol in indicators.Symbols, 'Symbol must be defined: ' + symbol)
			symbol = indicators.Symbols[symbol];
		}

		if (symbol.func) {
			const result = symbol.func(period, data);
			if (data.close.length > result.length) {
				result.unshift(...new Array(data.close.length - result.length).fill(result[0]));
			}
			return result;
		}

		const func = technicalindicators[symbol.name];
		let result = null;

		try {
			result = func.calculate({
				period,
				values: data.close,
				rsiPeriod : period,
				stochasticPeriod : period,
				kPeriod : 3,
				dPeriod : 3,
				fastPeriod: Math.round(period / 2), // AwesomeOscillator, MACD
				slowPeriod : period, // AwesomeOscillator, MACD
				signalPeriod: Math.round(period / 2), // Stochastic, MACD
				stdDev: .2, // BollingerBands
				step: 0.02, // PSAR
				max: 0.2, // PSAR
				noOfBars: period, // VolumeProfile
				...data
			});

			if (data.close.length > result.length) {
				result.unshift(...new Array(data.close.length - result.length).fill(result[0]));
			}
			if (symbol.transform) {
				result = symbol.transform(result);
			}
			//console.log(symbol, result.slice(0, 20));
			return result;
		}
		catch(e) {
			console.log({
				error: e,
				symbol,
				period,
				data,
				result
			});
			throw 'Failed to .get(' + symbol.name + ', ' + period + ', [data]): ' + e.message;
		}
	},

	getIndicators() {
		return Object.keys(indicators.Symbols);
	},

	Symbols: {
		MAX: { name: 'MAX', func: (period, { high }) => util.calculateMax(high, period) },
		MIN: { name: 'MIN', func: (period, { low }) => util.calculateMin(low, period) },
		PROFITABILITY: { name: 'PROFITABILITY', func: (period, { close }) => util.calculateProfitability(close, period) },

		PROGRESS: { 
			name: 'PROGRESS', 
			func: (period, { close }) => {
				const result = new Array(period).fill(0);
				for (let i = period; i < close.length; i++) {
					const current = close[i];
					const past = close[i - period];
					result.push(current - past);
				}
				return result;
			},
		},

		SMA: { name: 'SMA' },
		EMA: { name: 'EMA' },
		WMA: { name: 'WMA' },
		WEMA: { name: 'WEMA' },
		RSI: { name: 'RSI' },
		MACD: { name: 'MACD',
			transform: result => result.map(k => [k?.MACD || 0, k?.signal, k?.histogram])
		},
		RSI: { name: 'RSI' },
		BollingerBands: { 
			name: 'BollingerBands',
			transform: result => result.map(k => [k?.middle || 0, k?.upper, k?.lower, k?.pb || 0])
		 },
		ADX: { 
			name: 'ADX', 
			transform: result => result.map(k => [k?.adx || 0, k?.pdi || 0, k?.mdi || 0])
		},
		ATR: { name: 'ATR' },
		TrueRange: { name: 'TrueRange' },
		ROC: { name: 'ROC' },
		PSAR: { name: 'PSAR' },
		Stochastic: { 
			name: 'Stochastic',
			transform: result => result.map(({ k, d }) => [k, d])
	 	},
		WilliamsR: { name: 'WilliamsR' },
		ADL: { name: 'ADL' },
		OBV: { name: 'OBV' },
		TRIX: { name: 'TRIX' },
		ForceIndex: { name: 'ForceIndex' },
		CCI: { name: 'CCI' },
		AwesomeOscillator: { name: 'AwesomeOscillator' },
		VWAP: { name: 'VWAP' },
		VolumeProfile: { name: 'VolumeProfile' },
		MFI: { name: 'MFI' },
		StochasticRSI: { 
			name: 'StochasticRSI', 
			transform: (result) => result.map(k => [k.stochRSI, k.k, k.d])
		},
		AverageGain: { name: 'AverageGain' },
		AverageLoss: { name: 'AverageLoss' },
		SD: { name: 'SD' },
		// Highest: { name: 'Highest' },
		// Lowest: { name: 'Lowest' },
		// Sum: { name: 'Sum' },
		// HeikinAshi: { name: 'HeikinAshi' },
		// IchimokuCloud: { name: 'IchimokuCloud' },
	}

};