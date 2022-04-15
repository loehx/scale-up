const tf = require('@tensorflow/tfjs');
const { ensure, assert } = require("../shared/assertion");
const config = require("../../config");
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

assert(() => config['ai.directory']);

module.exports = class NeuralNetworkBase {

	constructor({ id, verbose, log }) {
		ensure(id, String);
		this.id = id.replace(/[\\/:"*?<>| ]+/gi, '-').toLowerCase();
		this.filePath = path.join(config['ai.directory'], this.id + '.json');
		this.log = log;
	}

	_log(...args) {
		this.log.write(...args);
	}

	_warn(...args) {
		this.log.warn(...args);
	}

	_compile() {
		throw "._compile() not implemented"
	}

	async fileExists() {
		try{
			return await fs.stat(this.filePath);
		}
		catch(e) {
			return false;
		}
	}
	
	async save() {
		assert(this.model, 'The model must have been trained before it can be saved.');
		try{
			await fs.mkdir(config['ai.directory'])}
		catch(e) {}

		if (await this.fileExists()) {
			await fs.unlink(this.filePath);
		}

		this._log(`Save model to "${this.filePath}"`);
		const json = await this.toJSON();
		await fs.writeFile(this.filePath, json, { encoding: 'utf8' })
		// DOES NOT WORK WITH APPLE SILICON:
		//return await this.model.save('file://' + this.filePath);
		return true;
	}

	async tryLoad() {
		if (await this.fileExists()) {
			const data = await fs.readFile(this.filePath);
			await this.parseJSON(data);
			// DOES NOT WORK WITH APPLE SILICON:
			// this.model = await tf.loadLayersModel('file://' + this.filePath + '/model.json');
			// this._log(`Model loaded successfully from: "${this.filePath}"`);
			// this._compile();
			return true;
		}
		this._log(`No model found: "${this.filePath}"`);
		return false;
	}

	async toJSON() {
		assert(this.model, 'The model must have been trained before it can be serialized to JSON.');
		const result = await this.model.save(tf.io.withSaveHandler(async modelArtifacts => modelArtifacts));
		result.weightData = Buffer.from(result.weightData).toString("base64");
		return JSON.stringify(result);
	}

	async parseJSON(jsonStr) {
		const json = JSON.parse(jsonStr);
		json.weightData = new Uint8Array(Buffer.from(json.weightData, "base64")).buffer;
		this.model = await tf.loadLayersModel(tf.io.fromMemory(json));
		this._compile();
	}
};