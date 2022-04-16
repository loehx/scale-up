import * as tf from "@tensorflow/tfjs";
import { ensure, assert } from "../shared/assertion";

tf.setBackend("cpu");

export default class NeuralNetworkBase {
  constructor({ id, verbose, log }) {
    ensure(id, String);
    this.id = id.replace(/[\\/:"*?<>| ]+/gi, "-").toLowerCase();
    this.log = log;
  }

  _log(...args) {
    this.log.write(...args);
  }

  _warn(...args) {
    this.log.warn(...args);
  }

  _compile() {
    throw "._compile() not implemented";
  }

  get storageKey() {
    return this.id + ".model";
  }

  async save() {
    assert(
      this.model,
      "The model must have been trained before it can be saved."
    );

    this._log(`Save model to "${this.filePath}"`);
    const json = await this.toJSON();
    localStorage.setItem(this.storageKey, json);

    return true;
  }

  async tryLoad() {
    const json = localStorage.getItem(this.storageKey);
    if (!json) {
      this._log(`No model found: "${this.filePath}"`);
      return false;
    }

    await this.parseJSON(data);
    return true;
  }

  async toJSON() {
    assert(
      this.model,
      "The model must have been trained before it can be serialized to JSON."
    );
    const result = await this.model.save(
      tf.io.withSaveHandler(async (modelArtifacts) => modelArtifacts)
    );
    result.weightData = Buffer.from(result.weightData).toString("base64");
    return JSON.stringify(result);
  }

  async parseJSON(jsonStr) {
    const json = JSON.parse(jsonStr);
    json.weightData = new Uint8Array(
      Buffer.from(json.weightData, "base64")
    ).buffer;
    this.model = await tf.loadLayersModel(tf.io.fromMemory(json));
    this._compile();
  }
}
