const EventEmitter = require('events');
const util = require('./util');
const { ensure, assert } = require('./assertion');
const cliProgress = require('cli-progress');

class Log {

    constructor(name, log) {
        ensure(name, String);
        
        if (log) {
            this.parent = log;
            this.name = `${log.name}.${name}`;
            this.eventBus = log.eventBus;
        }
        else {
            this.name = name || 'unnamed';
            this.eventBus = new EventEmitter();
        }
        this.timers = [];
    }

    getName() {
        return this.name;    
    }

    startTimer(name) {
        this.write(name + '...');
        this.timers.push({
            start: new Date(),
            name: name
        })
    }

    stopTimer(message) {
        if (this.progressBar) {
            this.progressBar.stop();
            this.progressBar = null;
        }
        const timer = this.timers.pop();
        assert(timer, 'No timer found to stop.');
        const ms = new Date() - timer.start;
        this.write(`${message || timer.name} (after ${util.humanizeDuration(ms)})`);
    }

    assert(...args) {
        try {
            assert(...args);
        }
        catch(e) {
            this.warn(e.message, e.value)
        }
    }

    ensure(...args) {
        try {
            ensure(...args);
        }
        catch(e) {
            this.warn(e.message, e.value)
        }
    }

    writeProgress(count, total, debounceMilliseconds = 2000, message) {
        const lastCall = new Date() - (this._lastprog || 0);

        if (!this.progressBar) {
            this.progressBar = new cliProgress.SingleBar({
                barsize: 80
            }, cliProgress.Presets.shades_classic);
            this.progressBar.start(total, count);
        }
        else {
            this.progressBar.update(count);
        }

        return;

        if (lastCall <= debounceMilliseconds) {
            return;
        }

        message = message ? message + ' ' : '';

        this._lastprog = new Date();
        const timer = this.timers[this.timers.length - 1];
        if (timer) {
            const timePassed = new Date() - timer.start;
            const remaining = (timePassed / count) * (total - count);

            this.write(`${message}${count} of ${total} (${Math.round(count / total * 100)}%) after ${util.humanizeDuration(timePassed)} (remaining: ${util.humanizeDuration(remaining)})`);
        }
        else {
            this.write(`${message}${count} of ${total} (${Math.round(count / total * 100)}%)`);
        }
    }

    write(message, ...args) {
        this._write('write', message, ...args);
    }

    warn(message, ...args) {
        this._write('warning', message, ...args);
    }

    error(message, ...args) {
        this._write('error', message, ...args);
    }

    on(name, callback) {
        this.eventBus.on(name, callback);
    }

    get timersActive() {
        return (this.parent?.timersActive || 0) + this.timers.length;
    }

    _write(type, message, ...args) {
        message = message || '(empty)';
        if (typeof message === 'object') {
            message = JSON.stringify(message, null, 4);
        }
        const tabs = new Array(this.timersActive).fill('\t').join('');
        message = `[${this.name}] ${tabs}${message}`
        this.eventBus.emit(type, message, ...args);
        this.eventBus.emit('all', type.toString() + ': ' + message, ...args);
    }

    static consoleLog(name) {
        const log = new Log(name);
        log.on('write', console.log);
        log.on('warning', console.warn);
        log.on('error', console.error);
        return log;
    }
}

module.exports = {
    Log
};