const util = require('../../src/shared/util');

describe('util', () => {

    test.each([
        [0, [0, 5], undefined, undefined, [1, 0, 0, 0, 0, 0]],
        [1, [0, 5], undefined, undefined, [0, 1, 0, 0, 0, 0]],
        [2, [0, 5], undefined, undefined, [0, 0, 1, 0, 0, 0]],
        [5, [0, 5], undefined, undefined, [0, 0, 0, 0, 0, 1]],
        [-1, [0, 5], true, undefined, [0, 0, 0, 0, 0, 0]],
        [6, [0, 5], true, undefined, [0, 0, 0, 0, 0, 0]],
        [0, [0, 100], true, 6, [1, 0, 0, 0, 0, 0]],
        [10, [0, 100], true, 6, [1, 0, 0, 0, 0, 0]],
        [20, [0, 100], true, 6, [0, 1, 0, 0, 0, 0]],
        [30, [0, 100], true, 6, [0, 1, 0, 0, 0, 0]],
        [100, [0, 100], true, 6, [0, 0, 0, 0, 0, 1]],
    ])('.oneHot(%p, %p, %p, $p)', (value, range, ignoreOverflow, arraySize, expected) => {
        expect(util.oneHot(value, range, ignoreOverflow, arraySize)).toStrictEqual(expected);
    });

    test.each([
        [1, 3, 1, [1, 2, 3]],
        [1, 4, 1, [1, 2, 3, 4]],
        [1, 5, 1, [1, 2, 3, 4, 5]],

        [0, 3, 1, [0, 1, 2, 3]],
        [0, 4, 1, [0, 1, 2, 3, 4]],
        [0, 5, 1, [0, 1, 2, 3, 4, 5]],

        [1, 5, 2, [1, 3, 5]],
        [1, 5, 5, [1]],
        [1, 1, undefined, [1]],
    ])('.range(%p, %p, %p)', (start, end, step, expected) => {
        expect(util.range(start, end, step)).toStrictEqual(expected);
    });

    test('.avg()', () => {
        const array = util.range(0, 80 * 1000, 1);
        const average = util.avg(array);

        expect(average).toBeCloseTo(40000);
    }) 

    test('.crossJoinByProps()', () => {
        const joined = util.crossJoinByProps({
            A: [1,2],
            B: [1,2],
            C: 3
        });

        expect(joined).toStrictEqual([
            {A: 1, B: 1, C: 3}, 
            {A: 2, B: 1, C: 3}, 
            {A: 1, B: 2, C: 3}, 
            {A: 2, B: 2, C: 3}
        ]);
    }) 

    test.each([
        [new Date(), new Date(), '0ms'],
        [1, 2, '1ms'],
        [2, 1, '-1ms'],
        [2, , '2ms'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2000-01-01T00:00:01'), '1s'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2000-01-01T00:01:00'), '1m'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2000-01-01T00:01:01'), '1m'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2000-01-01T01:01:01'), '1h'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2000-01-02T01:01:01'), '1d'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2000-01-08T01:01:01'), '7d'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2000-02-08T01:01:01'), '38d'],
        [Date.parse('2000-01-01T00:00:00'), Date.parse('2001-02-08T01:01:01'), '1y'],
        
    ])('.humanizeDuration(%p, %p)', (from, to, expected) => {
        expect(util.humanizeDuration(from, to)).toStrictEqual(expected);
    });

    test.each([
        // [[1,2,3], , [0, 0.5, 1]],
        // [[1,1,1], , [1, 1, 1]],
        [[0, 0, 0], , [0, 0, 0]],
        // [[0.5,0.5,0.5], , [1, 1, 1]],
        // [[-2, -1, 0, 1, 2], , [0, .25, .5, .75, 1]],
        // [[-2, -1, 0, 1, 2], true, [-1, -.5, 0, 0.5, 1]],
        
    ])('.scaleMinMax(%p, %p)', (arr, minusOneToOne, expected) => {
        expect(util.scaleMinMax(arr, minusOneToOne)).toStrictEqual(expected);
    });

    test.each([
        [1, [1]],
        [5, [1, 2, 3, 5]],
        
    ])('.fibonacciSequence(%p)', (max, expected) => {
        expect(util.fibonacciSequence(max)).toStrictEqual(expected);
    });

    test.each([
        [[1,2,3], 3, [0,0,0.5]],
        [[1,2,4], 3, [0,0,1]],
        [[1,2,10], 3, [0,0,4]],
    ])('.scaleByMean(%p, $p)', (data, period, expected) => {
        expect(util.scaleByMean(data, period)).toStrictEqual(expected);
    });
})