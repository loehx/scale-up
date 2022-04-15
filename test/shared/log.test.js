const { Log } = require("../../src/shared/log");

describe('log', () => {

    test('new Log()', () => {
        const log = new Log('Test');
        expect(log.getName()).toBe('Test');
    })

    test('log.write(...)', async () => {
        const log = new Log('unnamed');
        return new Promise(resolve => {
            log.on('write', (message) => {
                expect(message).toBe('[unnamed] Test Message');
                resolve();
            })
            log.write('Test Message');
        });
    })

    test('log.write("")', async () => {
        const log = new Log('unnamed');
        return new Promise(resolve => {
            log.on('write', (message) => {
                expect(message).toBe('[unnamed] (empty)');
                resolve();
            })
            log.write();
        });
    })

    test('log.write(...)', async () => {
        const log = new Log('TestLog');
        return new Promise(resolve => {
            log.on('write', (message, ...args) => {
                expect(message).toBe('[TestLog] Test Message');
                expect(args[0]).toBe(1);
                expect(args[1]).toBe(2);
                expect(args[2]).toBe(3);
                resolve();
            })
            log.write('Test Message', 1, 2, 3);
        });
    })

    test('log.warning(...)', async () => {
        const log = new Log('TestLog');
        return new Promise(resolve => {
            log.on('warning', (message, ...args) => {
                expect(message).toBe('[TestLog] Test Message');
                expect(args[0]).toBe(1);
                resolve();
            })
            log.warn('Test Message', 1);
        });
    })

    test('log.error(...)', async () => {
        const log = new Log('TestLog');
        return new Promise(resolve => {
            log.on('error', (message, ...args) => {
                expect(message).toBe('[TestLog] Test Message');
                expect(args[0]).toBe(1);
                resolve();
            })
            log.error('Test Message', 1);
        });
    })

    test('log.assert(...)', async () => {
        const log = new Log('TestLog');
        return new Promise(resolve => {
            log.on('warning', (message) => {
                expect(message).toBe('[TestLog] Assertion Failed: Test Message');
                resolve();
            })
            log.assert(false, 'Test Message');
        });
    })

    test('log.ensure(...)', async () => {
        const log = new Log('TestLog');
        return new Promise(resolve => {
            log.on('warning', (message, value) => {
                expect(message).toBe('[TestLog] Ensure Failed: Value should be of type: String');
                expect(value).toBe(1);
                resolve();
            })
            log.ensure(1, String);
        });
    })

    test('Parent Log', async () => {
        const parent = new Log('Parent');
        const log = new Log('TestLog', parent);
        return new Promise(resolve => {
            parent.on('write', (message, ...args) => {
                expect(message).toBe('[Parent.TestLog] Test Message');
                expect(args[0]).toBe(1);
                expect(args[1]).toBe(2);
                expect(args[2]).toBe(3);
                resolve();
            })
            log.write('Test Message', 1, 2, 3);
        });
    })
})