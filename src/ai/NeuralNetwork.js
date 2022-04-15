const tf = require('@tensorflow/tfjs');
const { assert, ensure } = require('../shared/assertion');
const { Log } = require('../shared/log');
const util = require('../shared/util');
const { round } = require('../shared/util');
const { TradeOptions, Trade } = require('../trading');
const NeuralNetworkBase = require('./NeuralNetworkBase')

module.exports = class NeuralNetwork extends NeuralNetworkBase {
	
	constructor({ 
		id, 
		optimizer = 'adam', 
		loss = 'meanSquaredError', 
		inputActivation, 
		inputUnits, 
		outputActivation, 
		hiddenLayers = [], 
		learningRate,
		log
	}) {
		super({
			id,
			log: new Log('NeuralNetwork', log)
		})
		this.optimizerName = optimizer;
		this.loss = loss;
		this.hiddenLayers = hiddenLayers;
		this.inputUnits = inputUnits;
		this.inputActivation = inputActivation;
		this.outputActivation = outputActivation;
		this.learningRate = learningRate;
	}

	get optimizer() {
		if (this.learningRate) {
			return tf.train[this.optimizerName](this.learningRate);
		}
		else {
			return this.optimizerName;
		}
	}

	async _getModel(inputCount, outputCount) {
		if (this.model) {
			return this.model;
		}

		const m = this.model = tf.sequential();

		let lastUnits;

		if (this.inputActivation === 'leakyrelu') {
			m.add(tf.layers.leakyReLU({ inputShape: [inputCount] }));
		}

		// first layer
		m.add(tf.layers.dense({
			units: lastUnits = (this.inputUnits || inputCount), 
			activation: this.inputActivation === 'leakyrelu' ? undefined : this.inputActivation,
			inputShape: [inputCount],
		}));

		// middle layer
		for(let layer of this.hiddenLayers) {
			if ('dropout' in layer) {
				m.add(tf.layers.dropout(layer.dropout));
			}
			else {
				if (layer.activation === 'leakyrelu') {
					m.add(tf.layers.leakyReLU());
				}
				m.add(tf.layers.dense({ ...layer, activation: undefined }));
			}

			if ('units' in layer) {
				lastUnits = layer.units;
			}
		}
		
		// output layer
		m.add(tf.layers.dense({ 
			activation: this.outputActivation,
			units: outputCount, 
		}));

		this._compile();

		return m;
	}

	_compile() {
		this.model.compile({ 
			loss: this.loss, 
			optimizer: this.optimizer,
			metrics: ['accuracy']
		});
		//this.model.summary();
	}

	async trainOnce(options) {
		const iterator = this.train(options);
		for await(let s of iterator) {
			s.stop();
			return s;
		}
	}

	async* train({ data, epochs = 10, learningRate, validationData, validationSplit, randomize, accuracyBaseLine, minProbability }) {
		assert(() => data.length > 0);

		const inputCount = data[0].x.length;
		const outputCount = data[0].y.length;
		assert(() => inputCount > 0);
		assert(() => outputCount > 0);

		const model = await this._getModel(inputCount, outputCount);

		if (Number.isFinite(validationSplit)) {
			assert(() => 0 < validationSplit && validationSplit < 1)
			const ratio = 1 - round(data.length * validationSplit);
			const allData = data;
			data = allData.slice(0, ratio);
			validationData = allData.slice(ratio);
		}

		if (randomize) {
			this._log('!!! RANDOMIZE INPUTS !!!');
			data = data.map(d => ({
				...d,
				x: new Array(inputCount).map(() => Math.random() > .5 ? 1 : 0)
			}))
		}

		const xs = tf.tensor2d(data.map(d => d.x));
		const ys = tf.tensor2d(data.map(d => d.y));
		const val_xs = validationData && tf.tensor2d(validationData.map(d => d.x));
		const val_ys = validationData && tf.tensor2d(validationData.map(d => d.y));
		
		let start = new Date();
		let _stop = false;

		if (learningRate && model.optimizer) {
			model.optimizer.learningRate = learningRate
		}

		let memHistory = null;
		let counter = 0;
		const stop = () => _stop = true;
		const setLearningRate = (lr) => model.optimizer.learningRate = lr;
		const historyLog = [];

		this._log(`Start training with ${data.length} datasets (in: ${inputCount} / out: ${outputCount})`);
		if (validationData) {
			this._log(`validation by ${validationData.length} datasets and minProbability: ${minProbability}`);
		}
		this._log(`#[epoch] [accuracy] / [loss] after [seconds]`)
		while(!_stop) {
			counter++;
			const { history } = await model.fit(xs, ys, { 
				epochs, 
				verbose: 0,
				batchSize: 200,
				workers: 8, 
				useMultiprocessing: true,
				validationData: val_xs ? [val_xs, val_ys] : undefined,
			});

			const validation = validationData ? this.getValidationAccuracy(validationData, minProbability) : null;
			const acc = (history.val_acc || history.acc);
			const accuracy = round(validation?.accuracy || acc[acc.length - 1], 6) - (accuracyBaseLine || 0);
			const loss = round(history.loss[history.loss.length - 1], 6);
			const _epochs = counter * epochs;
			const lossIncrease = memHistory ? round(loss / memHistory.loss - 1, 6) : 0;
			const accuracyIncrease = memHistory ? round(accuracy / memHistory.accuracy - 1, 6) : 0;
			const ms = (new Date() - start);
			const duration = util.humanizeDuration(ms);
			
			this._log(`#${_epochs} ${accuracy.toFixed(6)} / ${loss.toFixed(6)} after ${duration}`)

			memHistory = {
				epochs: _epochs,
				accuracy,
				validation,
				loss,
				acc: acc[acc.length - 1],
				lossIncrease, 
				accuracyIncrease,
				seconds: ms / 1000,
				history: historyLog,
				stop,
				setLearningRate
			}

			historyLog.push(memHistory);
			yield memHistory;
		}
		return null;
	}

	getValidationAccuracy(validationData, minProbability = 0.5) {

		const predictions = this.predictBulk(validationData.map(k => k.x));

		let correct = 0;
		let incorrect = 0;
		let skipped = 0;
		
		for (let i = 0; i < predictions.length; i++) {

			const pred = predictions[i];
			const valXy = validationData[i];
			valXy.prediction = pred;
			valXy.validation = new Array(pred.length);

			//xy.y[0] > .5 && console.log(i, pred, xy.y);
			for (let n = 0; n < pred.length; n++) {

				if (pred[n] < minProbability) {
					skipped++;
					valXy.validation[n] = 0;
					continue; // skip
				}
				if (valXy.y[n] > .5) {
					correct++;
					valXy.validation[n] = 1;
				}
				else {
					incorrect++;
					valXy.validation[n] = -1;
				}
			}
		}

		return {
			accuracy: util.round(correct / (correct + incorrect), 6),
			correct,
			incorrect,
			sum: correct + incorrect,
			skipped,
			predictions
		};
	}

	predictBulk(xs) {
		assert(this.model, 'The model has not been trained yet.');
		ensure(xs, Array);
		ensure(xs[0], Array);
		xs = tf.tensor2d(xs);
		return new Array(this.model.predict(xs, {batchSize: 64}).arraySync())[0];
	}

	predict(x) {
		const prediction = this.predictBulk([x]);
		return prediction[0];
	}
};
