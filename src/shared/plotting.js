const { option } = require('commander');
const { plot, Plot, stack } = require('nodeplotlib');
const { scaleMinMax } = require('./util');
const util = require('./util');

const plotting = module.exports = {

	plotLines(options) {
		// type: line, bar, scatter, scatter3d
		const keys = Object.keys(options).filter(k => k != 'x');
		plot(
			keys.map(k => ({
				x: options.x,
				y: Array.isArray(options[k]) ? options[k] : options.x.map(options[k]),
				type: 'line',
				name: k
			}))
		);
	},

	plot2d(...args) {
		if (Array.isArray(args[0])) {
			args = args[0];
		}
		args.forEach(options => {
			// type: line, bar, scatter, scatter3d
			const keys = Object.keys(options).filter(k => k !== 'x' && k !== 'scaleMinMax');
			const labels = options.labels && (Array.isArray(options.labels) ? options.labels : options.x.map(options.labels));
			const shouldScaleMinMax = Array.isArray(options.scaleMinMax) ? ((key) => options.scaleMinMax.indexOf(key) !== -1) : () => !!options.scaleMinMax;

			stack(
				keys.map(k => {
					let y = options[k];
					if (typeof y === 'function') {
						y = options.x.map(options[k]);
					}
					
					if (!Array.isArray(y)) {
						return;
					}

					const count = Math.min(y.length, options.max || Infinity);
					let x = options.x || util.range(1, count);
	
					
					if (y.length > options.max) {
						x = x.slice(y.length - options.max);
						y = y.slice(y.length - options.max);
					}

					if (typeof y[0] === 'object' && 'open' in y[0] && 'close' in y[0]) {
						let values = [
							...y.map(a => a.open),
							...y.map(a => a.close),
							...y.map(a => a.low),
							...y.map(a => a.high),
						]
						if (shouldScaleMinMax(k)) {
							values = scaleMinMax(values);
						}
						return {
							x,
							open: values.slice(0, y.length),
							close: values.slice(y.length, y.length*2),
							low: values.slice(y.length*2, y.length*3),
							high: values.slice(y.length*3),
							type: 'candlestick',
							//mode: options.mode,
							text: labels,
							name: k
							
						};
					}
	
	
					if (shouldScaleMinMax(k)) {
						y = util.scaleMinMax(y);
					}
	
					return {
						x,
						y,
						type: options.type,
						mode: options.mode,
						text: labels,
						name: k
					};
				}).filter(k => k),
				{
					title: options.title,
					xaxis: {
						rangeslider: {
							visible: false
						}
					}
				}
			);
		});
		plot();
	},

	plot3d(...args) {
		args.forEach(options => {
			let z = options.z || options.data;
			if (!Array.isArray(z[0])) {
				const chunkSize = Math.round(Math.sqrt(z.length));
				zNew = [];
				for (let i = 0; i < chunkSize; i++) {
					zNew.push(z.slice(i * chunkSize, (i + 1) * chunkSize));
				}
				z = zNew;
			}
			stack([
				{
					z,
					type: 'surface',
					title: options.title,
				}
			], {
				title: options.title
			});
		})
		
		plot();
	},
};