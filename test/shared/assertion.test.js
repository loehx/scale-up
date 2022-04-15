const { ensure, assert } = require("../../src/shared/assertion");


describe('assert', () => {
    test('.assert(() => true)', () => {
        expect(() => assert(() => true)).not.toThrow(Error);
    })

    test('.assert(() => false)', () => {
        expect(() => assert(() => false)).toThrow(Error);
        expect(() => assert(() => false)).toThrow('Assertion Failed: () => false');
    })

    test('.assert(true)', () => {
        expect(() => assert(true)).not.toThrow(Error);
    })

    test('.assert(false)', () => {
        expect(() => assert(false)).toThrow(Error);
    })

    test('.assert()', () => {
        expect(() => assert()).toThrow(Error);
    })

    test('.assert(null)', () => {
        expect(() => assert(null)).toThrow(Error);
    })

    test('.assert(false, "Custom Message")', () => {
        expect(() => assert(false, 'Custom Message')).toThrow('Assertion Failed: Custom Message');
    })

    test('.assert(false, "Custom Message", 1)', () => {
        try {
            assert(false, 'Custom Message', 1)
        }
        catch(e) {
            expect(e.args).toStrictEqual([1]);
        }
    })
});

describe('ensure', () => {

    test.each([
        [0, false],
        [1, false],
        [NaN, 'Ensure Failed: Value should not be NaN'],
        [undefined, 'Ensure Failed: Value should not be undefined'],
        [null, 'Ensure Failed: Value should not be null'],
    ])('.ensure(%p)', (value, error) => {
        const t = expect(() => ensure(value));
        if (error) { 
            t.toThrow(Error);
            t.toThrow(error);
        }
        else {
            t.not.toThrow(Error);
        }
    })

    test.each([
        [1, Number, false],
        [1.5, Number, false],
        [NaN, Number, false],
        ["", String, false],
        ["test", String, false],
        ["test", Number, 'Ensure Failed: Value should be of type: Number'],
        ["test", Array, 'Ensure Failed: Value should be an array'],
        [1, [1, 2, 3], false],
        [0, [1, 2, 3], "Ensure Failed: Value should be one of these values: 1, 2, 3"],
        [{}, Object, false],
        [[], Array, false],
        [true, Boolean, false],
        [false, Boolean, false],
        [(a) => a, Function, false],
        [1, i => i == 1, false],
    ])('.ensure(%p, %p)', (value, validator, error) => {
        const t = expect(() => ensure(value, validator));
        if (error) { 
            t.toThrow(Error);
            t.toThrow(error);
        }
        else {
            t.not.toThrow(Error);
        }
    })
});