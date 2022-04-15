
const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const NeuralNetwork = require('../../src/ai/NeuralNetwork');
const { Log } = require('../../src/shared/log');

const log = Log.consoleLog('Test');

(async () => {

	{
		log.write('CREATE NEURAL NETWORK');

		const nn = new NeuralNetwork({
			id: 'Test: XOR',
			inputActivation: 'sigmoid',
			inputUnits: 10,
			outputActivation: 'sigmoid',
			optimizer: 'rmsprop',
			loss: 'meanSquaredError',
			log: log
		});

		log.write('TRAIN NEURAL NETWORK');
		await nn.trainOnce({
			epochs: 100,
			learningRate: 0.1,
			data: [
				{ x: [0,0], y: [0] },
				{ x: [0,1], y: [1] },
				{ x: [1,0], y: [1] },
				{ x: [1,1], y: [0] },
			]
		});

		log.write('nn.predict([0,0]) =>', nn.predict([0,0]));
		log.write('nn.predict([0,1]) =>', nn.predict([0,1]));
		log.write('nn.predict([1,1]) =>', nn.predict([1,1]));

		log.write('SAVE NEURAL NETWORK');
		const saved = await nn.save();
		log.write('saved', saved);
	}

	{
		log.write('LOAD NEURAL NETWORK');
		const nn = new NeuralNetwork({ 
			id: 'Test: XOR', 
			log
		});
		await nn.tryLoad();
		log.write('nn.predict([0,0]) =>', nn.predict([0,0]));
		log.write('nn.predict([0,1]) =>', nn.predict([0,1]));
		log.write('nn.predict([1,1]) =>', nn.predict([1,1]));

		log.write('RE-TRAIN NEURAL NETWORK');
		await nn.trainOnce({
			epochs: 100,
			learningRate: 0.1,
			data: [
				{ x: [0,0], y: [0] },
				{ x: [0,1], y: [1] },
				{ x: [1,0], y: [1] },
				{ x: [1,1], y: [0] },
			]
		});

		log.write('OVERWRITE NEURAL NETWORK');
		await nn.save();
	}

	{
		log.write('LOAD NEURAL NETWORK');
		const nn = new NeuralNetwork({ 
			id: 'Test: XOR', 
			log
		});
		await nn.tryLoad();
		log.write('nn.predict([0,0]) =>', nn.predict([0,0]));
		log.write('nn.predict([0,1]) =>', nn.predict([0,1]));
		log.write('nn.predict([1,1]) =>', nn.predict([1,1]));
	}

})();